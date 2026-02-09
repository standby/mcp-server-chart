import { filePathToUrl } from "./image-server";
import { renderG2SpecToFile } from "./local-render";
import { logger } from "./logger";
import { translateToG2Spec } from "./spec-translator";

/**
 * Generate a chart URL by rendering locally with @antv/g2-ssr.
 */
export async function generateChartUrl(
  type: string,
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  options: Record<string, any>,
): Promise<string> {
  const g2Spec = translateToG2Spec(type, options);
  if (!g2Spec) {
    throw new Error(`Unsupported chart type for local rendering: '${type}'`);
  }

  const width = options.width || 600;
  const height = options.height || 400;

  const filePath = await renderG2SpecToFile(
    g2Spec as Record<string, unknown>,
    width,
    height,
  );
  const url = filePathToUrl(filePath);
  logger.info(`Generated chart URL: ${url}`);
  return url;
}
