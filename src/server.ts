import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as Charts from "./charts";
import {
  startHTTPStreamableServer,
  startSSEMcpServer,
  startStdioMcpServer,
} from "./services";
import { callTool } from "./utils/callTool";
import {
  getChartImageDir,
  getDisabledTools,
  getImageServerPort,
  isLocalMode,
} from "./utils/env";
import { startImageServer } from "./utils/image-server";
import { setOutputDir } from "./utils/local-render";
import { logger } from "./utils/logger";

/**
 * Initialize local rendering if enabled.
 * Starts the image server and waits for it to be ready.
 */
async function initLocalRendering(): Promise<void> {
  if (!isLocalMode()) return;

  const customDir = getChartImageDir();
  if (customDir) {
    setOutputDir(customDir);
  }

  const port = getImageServerPort();
  await startImageServer("localhost", port);
  logger.info(`Local rendering mode enabled (image server port: ${port})`);
}

/**
 * Creates and configures an MCP server for chart generation.
 */
export function createServer(): Server {
  const server = new Server(
    {
      name: "mcp-server-chart",
      version: "0.8.x",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  setupToolHandlers(server);

  server.onerror = (e: Error) => {
    logger.error("Server encountered an error, shutting down", e);
  };

  process.on("SIGINT", async () => {
    logger.info("SIGINT received, shutting down server...");
    await server.close();
    process.exit(0);
  });

  return server;
}

/**
 * Gets enabled tools based on environment variables.
 */
function getEnabledTools() {
  const disabledTools = getDisabledTools();
  const allCharts = Object.values(Charts);

  if (disabledTools.length === 0) {
    return allCharts;
  }

  return allCharts.filter((chart) => !disabledTools.includes(chart.tool.name));
}

/**
 * Sets up tool handlers for the MCP server.
 */
function setupToolHandlers(server: Server): void {
  logger.info("setting up tool handlers...");
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: getEnabledTools().map((chart) => chart.tool),
  }));

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
    logger.info("calling tool", request.params.name, request.params.arguments);

    return await callTool(request.params.name, request.params.arguments);
  });
  logger.info("tool handlers set up");
}

/**
 * Runs the server with stdio transport.
 */
export async function runStdioServer(): Promise<void> {
  await initLocalRendering();
  const server = createServer();
  await startStdioMcpServer(server);
}

/**
 * Runs the server with SSE transport.
 */
export async function runSSEServer(
  host = "localhost",
  port = 1122,
  endpoint = "/sse",
): Promise<void> {
  await initLocalRendering();
  await startSSEMcpServer(createServer, endpoint, port, host);
}

/**
 * Runs the server with HTTP streamable transport.
 */
export async function runHTTPStreamableServer(
  host = "localhost",
  port = 1122,
  endpoint = "/mcp",
): Promise<void> {
  await initLocalRendering();
  await startHTTPStreamableServer(createServer, endpoint, port, host);
}
