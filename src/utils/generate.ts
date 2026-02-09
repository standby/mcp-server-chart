import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import { getServiceIdentifier, getVisRequestServer, isLocalMode } from "./env";
import { filePathToUrl } from "./image-server";
import { renderG2SpecToFile } from "./local-render";
import { logger } from "./logger";
import { UNSUPPORTED_LOCAL_TYPES, translateToG2Spec } from "./spec-translator";

/**
 * Generate a chart URL using the provided configuration.
 * In local mode, renders charts locally using @antv/g2-ssr.
 * Falls back to the remote API for chart types that are not yet supported locally,
 * or when RENDER_MODE=remote.
 */
export async function generateChartUrl(
  type: string,
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  options: Record<string, any>,
): Promise<string> {
  if (isLocalMode() && !UNSUPPORTED_LOCAL_TYPES.has(type)) {
    return generateChartUrlLocally(type, options);
  }
  return generateChartUrlRemote(type, options);
}

/**
 * Generate a chart URL by rendering locally with @antv/g2-ssr.
 */
async function generateChartUrlLocally(
  type: string,
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  options: Record<string, any>,
): Promise<string> {
  const g2Spec = translateToG2Spec(type, options);
  if (!g2Spec) {
    logger.warn(
      `Local rendering not available for chart type '${type}', falling back to remote.`,
    );
    return generateChartUrlRemote(type, options);
  }

  const width = options.width || 600;
  const height = options.height || 400;

  const filePath = await renderG2SpecToFile(
    g2Spec as Record<string, unknown>,
    width,
    height,
  );
  return filePathToUrl(filePath);
}

/**
 * Generate a chart URL using the remote API.
 */
async function generateChartUrlRemote(
  type: string,
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  options: Record<string, any>,
): Promise<string> {
  const url = getVisRequestServer();

  const response = await axios.post(
    url,
    {
      type,
      ...options,
      source: "mcp-server-chart",
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
  const { success, errorMessage, resultObj } = response.data;

  if (!success) {
    throw new Error(errorMessage);
  }

  return resultObj;
}

type ResponseResult = {
  metadata: unknown;
  /**
   * @docs https://modelcontextprotocol.io/specification/2025-03-26/server/tools#tool-result
   */
  content: CallToolResult["content"];
  isError?: CallToolResult["isError"];
};

/**
 * Generate a map.
 * Maps always require the remote API (they depend on AMap service).
 * @param tool - The tool name
 * @param input - The input
 * @returns
 */
export async function generateMap(
  tool: string,
  input: unknown,
): Promise<ResponseResult> {
  const url = getVisRequestServer();

  const response = await axios.post(
    url,
    {
      serviceId: getServiceIdentifier(),
      tool,
      input,
      source: "mcp-server-chart",
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
  const { success, errorMessage, resultObj } = response.data;

  if (!success) {
    throw new Error(errorMessage);
  }
  return resultObj;
}
