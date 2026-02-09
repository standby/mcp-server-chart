import process from "node:process";

/**
 * Get the list of disabled tools from environment variables.
 */
export function getDisabledTools(): string[] {
  const disabledTools = process.env.DISABLED_TOOLS;
  if (!disabledTools || disabledTools === "undefined") {
    return [];
  }
  return disabledTools.split(",");
}

/**
 * Get the custom output directory for chart images, if set.
 */
export function getChartImageDir(): string | undefined {
  return process.env.CHART_IMAGE_DIR;
}

/**
 * Get the port for the local image server.
 */
export function getImageServerPort(): number {
  const raw = process.env.IMAGE_SERVER_PORT;
  if (!raw) return 18900;
  const port = Number.parseInt(raw, 10);
  if (Number.isNaN(port) || port < 1 || port > 65535) {
    throw new Error(
      `Invalid IMAGE_SERVER_PORT '${raw}': must be a number between 1 and 65535.`,
    );
  }
  return port;
}
