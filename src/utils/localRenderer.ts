// Workaround for CSS imports in Node.js
// @antv/s2 tries to import CSS files which Node.js can't handle
// This must be set before importing @antv/gpt-vis-ssr
if (typeof require !== "undefined" && require.extensions) {
  // biome-ignore lint/suspicious/noExplicitAny: require.extensions type definitions vary across Node.js versions
  (require.extensions as any)[".css"] = () => {};
}

import { render } from "@antv/gpt-vis-ssr";

/**
 * Render a chart locally using @antv/gpt-vis-ssr
 * @param type The type of chart to generate
 * @param options Chart options
 * @returns {Promise<Buffer>} The generated chart image as a buffer.
 * @throws {Error} If the chart generation fails.
 */
export async function renderChartLocally(
  type: string,
  // biome-ignore lint/suspicious/noExplicitAny: options structure varies by chart type and cannot be strictly typed
  options: Record<string, any>,
): Promise<Buffer> {
  try {
    const vis = await render({
      type,
      ...options,
      // biome-ignore lint/suspicious/noExplicitAny: render function expects flexible type that matches internal library interface
    } as any);

    // Get the rendered chart as PNG buffer
    const buffer = vis.toBuffer();

    // Cleanup resources
    vis.destroy();

    return buffer;
  } catch (error) {
    throw new Error(
      `Failed to render chart locally: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Check if a chart type is supported for local rendering
 * @param type The chart type to check
 * @returns true if the chart type is supported for local rendering
 */
export function isLocalRenderingSupported(type: string): boolean {
  // Geographic map charts are not supported for local rendering as per the README
  const unsupportedTypes = ["district-map", "path-map", "pin-map"];
  return !unsupportedTypes.includes(type);
}
