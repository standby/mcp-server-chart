import fs from "node:fs";
import { describe, expect, it } from "vitest";
import {
  renderG2SpecToBuffer,
  renderG2SpecToFile,
} from "../src/utils/local-render";
import { translateToG2Spec } from "../src/utils/spec-translator";

describe("local rendering", () => {
  it("translates line chart spec", () => {
    const spec = translateToG2Spec("line", {
      data: [
        { time: "2020", value: 100 },
        { time: "2021", value: 120 },
        { time: "2022", value: 145 },
      ],
    });
    expect(spec).toBeTruthy();
    // biome-ignore lint/suspicious/noExplicitAny: test
    expect((spec as any).type).toBe("line");
  });

  it("translates pie chart spec", () => {
    const spec = translateToG2Spec("pie", {
      data: [
        { category: "A", value: 30 },
        { category: "B", value: 70 },
      ],
    });
    expect(spec).toBeTruthy();
    // biome-ignore lint/suspicious/noExplicitAny: test
    expect((spec as any).type).toBe("interval");
    // biome-ignore lint/suspicious/noExplicitAny: test
    expect((spec as any).coordinate.type).toBe("theta");
  });

  it("returns null for unknown types", () => {
    const spec = translateToG2Spec("unknown-type", {});
    expect(spec).toBeNull();
  });

  it("translates all G2-supported chart types", () => {
    const types = [
      "line",
      "area",
      "bar",
      "column",
      "scatter",
      "pie",
      "funnel",
      "radar",
      "histogram",
      "boxplot",
      "violin",
      "waterfall",
      "liquid",
      "word-cloud",
      "venn",
      "treemap",
      "sankey",
      "dual-axes",
      "network-graph",
      "mind-map",
      "organization-chart",
      "flow-diagram",
      "fishbone-diagram",
    ];
    for (const type of types) {
      const args = getMockArgs(type);
      const spec = translateToG2Spec(type, args);
      expect(
        spec,
        `translateToG2Spec should return a spec for '${type}'`,
      ).toBeTruthy();
    }
  });

  it("renders a line chart to PNG buffer", async () => {
    const spec = translateToG2Spec("line", {
      data: [
        { time: "2020", value: 100 },
        { time: "2021", value: 120 },
        { time: "2022", value: 145 },
      ],
    });
    const buffer = await renderG2SpecToBuffer(
      spec as Record<string, unknown>,
      400,
      300,
    );
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(100);
    // PNG magic bytes
    expect(buffer[0]).toBe(0x89);
    expect(buffer[1]).toBe(0x50); // P
    expect(buffer[2]).toBe(0x4e); // N
    expect(buffer[3]).toBe(0x47); // G
  });

  it("renders a pie chart to PNG file", async () => {
    const spec = translateToG2Spec("pie", {
      data: [
        { category: "A", value: 30 },
        { category: "B", value: 50 },
        { category: "C", value: 20 },
      ],
    });
    const filePath = await renderG2SpecToFile(
      spec as Record<string, unknown>,
      400,
      300,
    );
    expect(fs.existsSync(filePath)).toBe(true);
    const stat = fs.statSync(filePath);
    expect(stat.size).toBeGreaterThan(100);
    // Clean up
    fs.unlinkSync(filePath);
  });

  it("renders a bar chart to PNG buffer", async () => {
    const spec = translateToG2Spec("bar", {
      data: [
        { category: "Sports", value: 275 },
        { category: "Strategy", value: 115 },
        { category: "Action", value: 120 },
      ],
    });
    const buffer = await renderG2SpecToBuffer(
      spec as Record<string, unknown>,
      400,
      300,
    );
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(100);
  });
});

// biome-ignore lint/suspicious/noExplicitAny: test helper
function getMockArgs(type: string): Record<string, any> {
  switch (type) {
    case "line":
    case "area":
      return {
        data: [
          { time: "2020", value: 100 },
          { time: "2021", value: 120 },
        ],
      };
    case "bar":
    case "column":
      return {
        data: [
          { category: "A", value: 10 },
          { category: "B", value: 20 },
        ],
      };
    case "scatter":
      return {
        data: [
          { x: 1, y: 2 },
          { x: 3, y: 4 },
        ],
      };
    case "pie":
      return {
        data: [
          { category: "A", value: 30 },
          { category: "B", value: 70 },
        ],
      };
    case "funnel":
      return {
        data: [
          { category: "Step 1", value: 100 },
          { category: "Step 2", value: 80 },
        ],
      };
    case "radar":
      return {
        data: [
          { name: "Design", value: 70 },
          { name: "Dev", value: 80 },
          { name: "QA", value: 60 },
        ],
      };
    case "histogram":
      return { data: [10, 20, 30, 40, 50, 60, 70, 80] };
    case "boxplot":
    case "violin":
      return {
        data: [
          { category: "A", value: 10 },
          { category: "A", value: 20 },
          { category: "A", value: 30 },
          { category: "B", value: 15 },
          { category: "B", value: 25 },
        ],
      };
    case "waterfall":
      return {
        data: [
          { category: "Start", value: 100 },
          { category: "Add", value: 50 },
          { category: "Total", isTotal: true },
        ],
      };
    case "liquid":
      return { percent: 0.75 };
    case "word-cloud":
      return {
        data: [
          { text: "Hello", value: 100 },
          { text: "World", value: 50 },
        ],
      };
    case "venn":
      return {
        data: [
          { sets: ["A"], value: 10 },
          { sets: ["B"], value: 10 },
          { sets: ["A", "B"], value: 5 },
        ],
      };
    case "treemap":
      return {
        data: [
          {
            name: "root",
            value: 100,
            children: [
              { name: "A", value: 60 },
              { name: "B", value: 40 },
            ],
          },
        ],
      };
    case "sankey":
      return {
        data: [
          { source: "A", target: "B", value: 10 },
          { source: "B", target: "C", value: 8 },
        ],
      };
    case "dual-axes":
      return {
        categories: ["2020", "2021", "2022"],
        series: [
          { type: "column", data: [100, 120, 140] },
          { type: "line", data: [0.5, 0.6, 0.7] },
        ],
      };
    case "network-graph":
    case "flow-diagram":
      return {
        data: {
          nodes: [{ name: "A" }, { name: "B" }],
          edges: [{ source: "A", target: "B" }],
        },
      };
    case "mind-map":
    case "fishbone-diagram":
      return {
        data: {
          name: "Root",
          children: [{ name: "Child 1" }, { name: "Child 2" }],
        },
      };
    case "organization-chart":
      return {
        data: {
          name: "CEO",
          children: [{ name: "CTO" }, { name: "CFO" }],
        },
      };
    default:
      return {};
  }
}
