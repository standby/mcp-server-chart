/**
 * Translates MCP server chart input arguments into @antv/g2 spec format.
 * Each chart type's custom schema is mapped to a G2 declarative spec
 * that can be rendered by @antv/g2-ssr.
 */

// biome-ignore lint/suspicious/noExplicitAny: chart args are loosely typed
type Args = Record<string, any>;

/**
 * Translate an MCP chart type + args into a G2 spec.
 * Returns null for chart types that cannot be rendered with G2 (maps, spreadsheets, graph diagrams).
 */
export function translateToG2Spec(
  chartType: string,
  args: Args,
): object | null {
  const translator = TRANSLATORS[chartType];
  if (!translator) return null;
  return translator(args);
}

/** Chart types that require G6 or external rendering and cannot use G2 */
export const UNSUPPORTED_LOCAL_TYPES = new Set([
  "district-map",
  "path-map",
  "pin-map",
  "spreadsheet",
]);

/** Chart types that are graph/diagram types - rendered as simple SVG locally */
export const GRAPH_DIAGRAM_TYPES = new Set([
  "network-graph",
  "mind-map",
  "organization-chart",
  "flow-diagram",
  "fishbone-diagram",
]);

function applyCommonStyle(spec: Args, args: Args): void {
  if (args.title) {
    spec.title = { title: args.title };
  }
  if (args.style?.palette) {
    spec.scale = {
      ...spec.scale,
      color: { range: args.style.palette },
    };
  }
  if (args.style?.backgroundColor) {
    spec.viewStyle = { viewFill: args.style.backgroundColor };
  }
}

function applyAxisTitles(spec: Args, args: Args): void {
  if (args.axisXTitle || args.axisYTitle) {
    spec.axis = spec.axis || {};
    if (args.axisXTitle) {
      spec.axis.x = { ...(spec.axis.x || {}), title: args.axisXTitle };
    }
    if (args.axisYTitle) {
      spec.axis.y = { ...(spec.axis.y || {}), title: args.axisYTitle };
    }
  }
}

const TRANSLATORS: Record<string, (args: Args) => object> = {
  line: (args) => {
    const hasGroup = args.data?.some((d: Args) => d.group);
    const spec: Args = {
      type: "line",
      data: args.data,
      encode: {
        x: "time",
        y: "value",
        ...(hasGroup ? { color: "group" } : {}),
      },
      style: {
        ...(args.style?.lineWidth ? { lineWidth: args.style.lineWidth } : {}),
      },
    };
    if (args.style?.startAtZero) {
      spec.scale = { y: { domainMin: 0 } };
    }
    applyCommonStyle(spec, args);
    applyAxisTitles(spec, args);
    return spec;
  },

  area: (args) => {
    const hasGroup = args.data?.some((d: Args) => d.group);
    const spec: Args = {
      type: "area",
      data: args.data,
      encode: {
        x: "time",
        y: "value",
        ...(hasGroup ? { color: "group" } : {}),
      },
      style: {
        fillOpacity: 0.5,
        ...(args.style?.lineWidth ? { lineWidth: args.style.lineWidth } : {}),
      },
    };
    if (args.stack && hasGroup) {
      spec.transform = [{ type: "stackY" }];
    }
    applyCommonStyle(spec, args);
    applyAxisTitles(spec, args);
    return spec;
  },

  bar: (args) => {
    const hasGroup = args.data?.some((d: Args) => d.group);
    const spec: Args = {
      type: "interval",
      data: args.data,
      encode: {
        x: "category",
        y: "value",
        ...(hasGroup ? { color: "group" } : {}),
      },
      coordinate: { transform: [{ type: "transpose" }] },
    };
    if (hasGroup) {
      if (args.group) {
        spec.transform = [{ type: "dodgeX" }];
      } else if (args.stack !== false) {
        spec.transform = [{ type: "stackY" }];
      }
    }
    applyCommonStyle(spec, args);
    applyAxisTitles(spec, args);
    return spec;
  },

  column: (args) => {
    const hasGroup = args.data?.some((d: Args) => d.group);
    const spec: Args = {
      type: "interval",
      data: args.data,
      encode: {
        x: "category",
        y: "value",
        ...(hasGroup ? { color: "group" } : {}),
      },
    };
    if (hasGroup) {
      if (args.stack) {
        spec.transform = [{ type: "stackY" }];
      } else if (args.group !== false) {
        spec.transform = [{ type: "dodgeX" }];
      }
    }
    applyCommonStyle(spec, args);
    applyAxisTitles(spec, args);
    return spec;
  },

  scatter: (args) => {
    const hasGroup = args.data?.some((d: Args) => d.group);
    const spec: Args = {
      type: "point",
      data: args.data,
      encode: {
        x: "x",
        y: "y",
        ...(hasGroup ? { color: "group" } : {}),
      },
    };
    applyCommonStyle(spec, args);
    applyAxisTitles(spec, args);
    return spec;
  },

  pie: (args) => {
    const spec: Args = {
      type: "interval",
      data: args.data,
      encode: { y: "value", color: "category" },
      transform: [{ type: "stackY" }],
      coordinate: {
        type: "theta",
        ...(args.innerRadius ? { innerRadius: args.innerRadius } : {}),
      },
      legend: { color: { position: "right" } },
      labels: [{ text: "value" }],
    };
    applyCommonStyle(spec, args);
    return spec;
  },

  funnel: (args) => {
    const spec: Args = {
      type: "interval",
      data: args.data,
      encode: { x: "category", y: "value", color: "category", shape: "funnel" },
      transform: [{ type: "symmetryY" }],
      coordinate: { transform: [{ type: "transpose" }] },
      scale: { x: { padding: 0 } },
      axis: false,
      legend: { color: { position: "bottom" } },
      labels: [
        { text: (d: Args) => `${d.category} ${d.value}`, position: "inside" },
      ],
    };
    applyCommonStyle(spec, args);
    return spec;
  },

  radar: (args) => {
    const hasGroup = args.data?.some((d: Args) => d.group);
    const children: Args[] = [];

    if (hasGroup) {
      children.push({
        type: "area",
        encode: { x: "name", y: "value", color: "group" },
        style: { fillOpacity: 0.3 },
      });
      children.push({
        type: "line",
        encode: { x: "name", y: "value", color: "group" },
        style: {
          ...(args.style?.lineWidth ? { lineWidth: args.style.lineWidth } : {}),
        },
      });
      children.push({
        type: "point",
        encode: { x: "name", y: "value", color: "group" },
      });
    } else {
      children.push({
        type: "area",
        encode: { x: "name", y: "value" },
        style: {
          fillOpacity: 0.5,
          ...(args.style?.lineWidth ? { lineWidth: args.style.lineWidth } : {}),
        },
      });
      children.push({
        type: "line",
        encode: { x: "name", y: "value" },
      });
    }

    const spec: Args = {
      type: "view",
      data: args.data,
      coordinate: { type: "polar" },
      scale: { x: { padding: 0.5, align: 0 } },
      axis: { y: { title: false } },
      children,
    };
    applyCommonStyle(spec, args);
    return spec;
  },

  histogram: (args) => {
    // histogram data is an array of numbers; convert to objects for G2
    const data = args.data.map((v: number) => ({ value: v }));
    const spec: Args = {
      type: "rect",
      data,
      encode: { x: "value" },
      transform: [
        {
          type: "binX",
          y: "count",
          ...(args.binNumber ? { thresholds: args.binNumber } : {}),
        },
      ],
    };
    applyCommonStyle(spec, args);
    applyAxisTitles(spec, args);
    return spec;
  },

  boxplot: (args) => {
    const hasGroup = args.data?.some((d: Args) => d.group);
    const spec: Args = {
      type: "boxplot",
      data: args.data,
      encode: {
        x: "category",
        y: "value",
        ...(hasGroup ? { color: "group" } : { color: "category" }),
      },
    };
    if (args.style?.startAtZero) {
      spec.scale = { y: { domainMin: 0 } };
    }
    applyCommonStyle(spec, args);
    applyAxisTitles(spec, args);
    return spec;
  },

  violin: (args) => {
    const hasGroup = args.data?.some((d: Args) => d.group);
    const spec: Args = {
      type: "boxplot",
      data: args.data,
      encode: {
        x: "category",
        y: "value",
        shape: "violin",
        ...(hasGroup ? { color: "group" } : { color: "category" }),
      },
      style: { opacity: 0.5, strokeOpacity: 0.5, point: false },
    };
    if (args.style?.startAtZero) {
      spec.scale = { y: { domainMin: 0 } };
    }
    applyCommonStyle(spec, args);
    applyAxisTitles(spec, args);
    return spec;
  },

  waterfall: (args) => {
    // Pre-process waterfall data to compute cumulative start/end
    const waterfallData: Args[] = [];
    let cumulative = 0;
    for (const item of args.data) {
      if (item.isTotal) {
        waterfallData.push({
          category: item.category,
          start: 0,
          end: cumulative,
          value: cumulative,
          type: "total",
        });
      } else if (item.isIntermediateTotal) {
        waterfallData.push({
          category: item.category,
          start: 0,
          end: cumulative,
          value: cumulative,
          type: "total",
        });
      } else {
        const start = cumulative;
        cumulative += item.value;
        waterfallData.push({
          category: item.category,
          start,
          end: cumulative,
          value: item.value,
          type: item.value >= 0 ? "positive" : "negative",
        });
      }
    }

    const palette = args.style?.palette || {};
    const positiveColor = palette.positiveColor || "#FF4D4F";
    const negativeColor = palette.negativeColor || "#2EBB59";
    const totalColor = palette.totalColor || "#1783FF";

    const spec: Args = {
      type: "interval",
      data: waterfallData,
      encode: {
        x: "category",
        y: ["start", "end"],
        color: "type",
      },
      scale: {
        color: {
          domain: ["positive", "negative", "total"],
          range: [positiveColor, negativeColor, totalColor],
        },
      },
      labels: [{ text: "value" }],
    };
    applyCommonStyle(spec, args);
    applyAxisTitles(spec, args);
    return spec;
  },

  liquid: (args) => {
    const spec: Args = {
      type: "liquid",
      data: args.percent,
      style: {
        shape: args.shape || "circle",
        ...(args.style?.color ? { fill: args.style.color } : {}),
      },
    };
    applyCommonStyle(spec, args);
    return spec;
  },

  "word-cloud": (args) => {
    const spec: Args = {
      type: "wordCloud",
      data: args.data,
      layout: { spiral: "rectangular" },
      encode: { color: "text" },
      axis: false,
    };
    applyCommonStyle(spec, args);
    return spec;
  },

  venn: (args) => {
    const spec: Args = {
      type: "path",
      data: {
        type: "inline",
        value: args.data,
        transform: [{ type: "venn" }],
      },
      encode: { d: "path", color: "key" },
      style: { fillOpacity: 0.6 },
      labels: [{ text: "label", position: "inside" }],
    };
    applyCommonStyle(spec, args);
    return spec;
  },

  treemap: (args) => {
    // The MCP schema provides an array of tree nodes; G2 expects a single root
    const treeData =
      args.data.length === 1
        ? args.data[0]
        : { name: "root", children: args.data };

    const spec: Args = {
      type: "treemap",
      data: {
        type: "inline",
        value: treeData,
      },
      layout: { tile: "treemapBinary" },
      encode: { value: "value", color: "name" },
      style: {
        labelText: (d: Args) => d.data?.name || "",
        labelFill: "#000",
        labelFontSize: 12,
      },
    };
    applyCommonStyle(spec, args);
    return spec;
  },

  sankey: (args) => {
    const spec: Args = {
      type: "sankey",
      data: {
        type: "inline",
        value: { links: args.data },
      },
      layout: {
        nodeAlign: args.nodeAlign || "center",
        nodePadding: 0.03,
      },
      style: {
        labelSpacing: 3,
        labelFontWeight: "bold",
        nodeStrokeWidth: 1.2,
        linkFillOpacity: 0.4,
      },
    };
    applyCommonStyle(spec, args);
    return spec;
  },

  "dual-axes": (args) => {
    // Build combined data from categories + series
    const data: Args[] = [];
    for (let i = 0; i < args.categories.length; i++) {
      const row: Args = { category: args.categories[i] };
      for (let j = 0; j < args.series.length; j++) {
        row[`series_${j}`] = args.series[j].data[i];
      }
      data.push(row);
    }

    const children: Args[] = args.series.map((s: Args, idx: number) => {
      const field = `series_${idx}`;
      const child: Args = {
        type: s.type === "column" ? "interval" : "line",
        encode: { x: "category", y: field },
        scale: { y: { independent: true } },
        axis: {
          y: {
            title: s.axisYTitle || "",
            position: idx === 0 ? "left" : "right",
          },
        },
      };
      if (s.type === "line") {
        child.style = { lineWidth: 2 };
      }
      return child;
    });

    const spec: Args = {
      type: "view",
      data,
      children,
    };
    if (args.axisXTitle) {
      spec.axis = { x: { title: args.axisXTitle } };
    }
    applyCommonStyle(spec, args);
    return spec;
  },

  // Graph/diagram types - rendered as force graph in G2 (simplified)
  "network-graph": (args) => {
    const links = args.data.edges.map((e: Args) => ({
      source: e.source,
      target: e.target,
    }));
    const nodes = args.data.nodes.map((n: Args) => ({
      id: n.name,
    }));
    const spec: Args = {
      type: "forceGraph",
      data: {
        type: "inline",
        value: { nodes, links },
      },
    };
    applyCommonStyle(spec, args);
    return spec;
  },

  // Mind map, org chart, flow diagram, fishbone - rendered as tree/force graph
  "mind-map": (args) => {
    // Flatten tree to nodes + links for forceGraph
    const { nodes, links } = flattenTree(args.data);
    const spec: Args = {
      type: "forceGraph",
      data: {
        type: "inline",
        value: { nodes, links },
      },
    };
    applyCommonStyle(spec, args);
    return spec;
  },

  "organization-chart": (args) => {
    const { nodes, links } = flattenTree(args.data);
    const spec: Args = {
      type: "forceGraph",
      data: {
        type: "inline",
        value: { nodes, links },
      },
    };
    applyCommonStyle(spec, args);
    return spec;
  },

  "flow-diagram": (args) => {
    const links = args.data.edges.map((e: Args) => ({
      source: e.source,
      target: e.target,
    }));
    const nodes = args.data.nodes.map((n: Args) => ({
      id: n.name,
    }));
    const spec: Args = {
      type: "forceGraph",
      data: {
        type: "inline",
        value: { nodes, links },
      },
    };
    applyCommonStyle(spec, args);
    return spec;
  },

  "fishbone-diagram": (args) => {
    const { nodes, links } = flattenTree(args.data);
    const spec: Args = {
      type: "forceGraph",
      data: {
        type: "inline",
        value: { nodes, links },
      },
    };
    applyCommonStyle(spec, args);
    return spec;
  },
};

/** Flatten a tree structure into nodes and links for forceGraph rendering */
function flattenTree(root: Args): {
  nodes: { id: string }[];
  links: { source: string; target: string }[];
} {
  const nodes: { id: string }[] = [];
  const links: { source: string; target: string }[] = [];

  function walk(node: Args) {
    nodes.push({ id: node.name });
    if (node.children) {
      for (const child of node.children) {
        links.push({ source: node.name, target: child.name });
        walk(child);
      }
    }
  }
  walk(root);
  return { nodes, links };
}
