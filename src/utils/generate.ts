import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import {
  getServiceIdentifier,
  getVisRequestServer,
  isPrivateDeployment,
} from "./env";
import { isLocalRenderingSupported, renderChartLocally } from "./localRenderer";

/**
 * Generate a chart URL or base64 data using the provided configuration.
 * @param type The type of chart to generate
 * @param options Chart options
 * @returns {Promise<string>} The generated chart URL or base64 data URI.
 * @throws {Error} If the chart generation fails.
 */
export async function generateChartUrl(
  type: string,
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  options: Record<string, any>,
): Promise<string> {
  // Use local rendering by default (private deployment)
  if (isPrivateDeployment()) {
    if (!isLocalRenderingSupported(type)) {
      throw new Error(
        `Chart type "${type}" requires external service for rendering. Please set VIS_REQUEST_SERVER environment variable to use geographic map charts.`,
      );
    }

    const buffer = await renderChartLocally(type, options);
    // Return as base64 data URI
    return `data:image/png;base64,${buffer.toString("base64")}`;
  }

  // Use external service if VIS_REQUEST_SERVER is configured
  const url = getVisRequestServer();
  if (!url) {
    throw new Error("VIS_REQUEST_SERVER is not configured");
  }

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
 * Generate a map
 * @param tool - The tool name
 * @param input - The input
 * @returns
 */
export async function generateMap(
  tool: string,
  input: unknown,
): Promise<ResponseResult> {
  // Geographic maps always require external service
  const url = getVisRequestServer();

  if (!url) {
    throw new Error(
      "Geographic map generation requires VIS_REQUEST_SERVER to be configured. Please set the VIS_REQUEST_SERVER environment variable to use geographic map charts.",
    );
  }

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
