import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { logger } from "./logger";

let createChartFn: typeof import("@antv/g2-ssr").createChart | null = null;

async function getCreateChart() {
  if (!createChartFn) {
    const mod = await import("@antv/g2-ssr");
    createChartFn = mod.createChart;
  }
  return createChartFn;
}

/** Directory where rendered chart images are stored */
let outputDir: string = path.join(os.tmpdir(), "mcp-chart-images");

/**
 * Get (and ensure exists) the output directory for chart images.
 */
export function getOutputDir(): string {
  try {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  } catch (err) {
    logger.error(`Failed to create chart image directory: ${outputDir}`, err);
    throw new Error(
      `Cannot create chart image directory '${outputDir}': ${(err as Error).message}`,
    );
  }
  return outputDir;
}

/**
 * Override the output directory (e.g. from env var).
 */
export function setOutputDir(dir: string): void {
  outputDir = dir;
}

/**
 * Render a G2 spec to a PNG file locally using @antv/g2-ssr.
 * Returns the file path to the generated PNG image.
 */
export async function renderG2SpecToFile(
  // biome-ignore lint/suspicious/noExplicitAny: G2 spec is loosely typed
  spec: Record<string, any>,
  width = 600,
  height = 400,
): Promise<string> {
  const createChart = await getCreateChart();

  const chart = await createChart({
    width,
    height,
    imageType: "png",
    ...spec,
  });

  const dir = getOutputDir();
  const filename = `chart-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.png`;
  const filePath = path.join(dir, filename);

  chart.exportToFile(filePath.replace(/\.png$/, ""));

  logger.info(`Chart rendered locally: ${filePath}`);
  return filePath;
}

/**
 * Render a G2 spec to a PNG buffer.
 */
export async function renderG2SpecToBuffer(
  // biome-ignore lint/suspicious/noExplicitAny: G2 spec is loosely typed
  spec: Record<string, any>,
  width = 600,
  height = 400,
): Promise<Buffer> {
  const createChart = await getCreateChart();

  const chart = await createChart({
    width,
    height,
    imageType: "png",
    ...spec,
  });

  return chart.toBuffer();
}
