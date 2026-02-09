import { spawn } from "node:child_process";
import { Client } from "@modelcontextprotocol/sdk/client";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { describe, expect, it } from "vitest";

function spawnAsync(
  command: string,
  args: string[],
  extraEnv: Record<string, string> = {},
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
): Promise<any> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: { ...process.env, ...extraEnv },
    });

    // Wait for the MCP transport server to be ready.
    // With local rendering, the image server logs before the MCP server.
    // We wait for transport-specific messages to ensure the MCP server is ready.
    let resolved = false;
    const tryResolve = (text: string) => {
      if (resolved) return;
      if (
        text.includes("SSE Server listening") ||
        text.includes("Streamable HTTP Server listening") ||
        text.includes("Stdio MCP Server started")
      ) {
        resolved = true;
        resolve(child);
      }
    };
    child.stdout.on("data", (data) => tryResolve(data.toString()));
    child.stderr.on("data", (data) => tryResolve(data.toString()));
  });
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
function killAsync(child: any): Promise<void> {
  return new Promise((resolve, reject) => {
    child.on("exit", () => {
      resolve();
    });
    child.kill();
  });
}

describe("MCP Server", () => {
  it("stdio", async () => {
    const transport = new StdioClientTransport({
      command: "ts-node",
      args: ["./src/index.ts"],
      env: { ...process.env, IMAGE_SERVER_PORT: "18905" },
    });
    const client = new Client({
      name: "stdio-client",
      version: "1.0.0",
    });
    await client.connect(transport);
    const listTools = await client.listTools();

    expect(listTools.tools.length).toBe(23);

    const spec = {
      type: "line",
      data: [
        { time: "2020", value: 100 },
        { time: "2021", value: 120 },
        { time: "2022", value: 145 },
        { time: "2023", value: 150 },
        { time: "2024", value: 167 },
        { time: "2025", value: 163 },
      ],
    };

    const res = await client.callTool({
      name: "generate_line_chart",
      arguments: spec,
    });

    expect(res._meta).toEqual({
      description:
        "This is the chart's spec and configuration, which can be renderred to corresponding chart by AntV GPT-Vis chart components.",
      spec: spec,
    });

    // @ts-expect-error ignore
    expect(res.content[0].text).toMatch(/^https?:\/\//);

    await transport.close();
  });

  it("sse", async () => {
    const child = await spawnAsync("ts-node", ["./src/index.ts", "-t", "sse"], {
      IMAGE_SERVER_PORT: "18901",
    });

    const url = "http://localhost:1122/sse";
    const transport = new SSEClientTransport(new URL(url), {});

    const client = new Client(
      { name: "sse-client", version: "1.0.0" },
      { capabilities: {} },
    );

    await client.connect(transport);
    const listTools = await client.listTools();

    expect(listTools.tools.length).toBe(23);

    const spec = {
      type: "line",
      data: [
        { time: "2020", value: 100 },
        { time: "2021", value: 120 },
        { time: "2022", value: 145 },
        { time: "2023", value: 150 },
        { time: "2024", value: 167 },
        { time: "2025", value: 163 },
      ],
    };

    const res = await client.callTool({
      name: "generate_line_chart",
      arguments: spec,
    });

    expect(res._meta).toEqual({
      description:
        "This is the chart's spec and configuration, which can be renderred to corresponding chart by AntV GPT-Vis chart components.",
      spec: spec,
    });

    // @ts-expect-error ignore
    expect(res.content[0].text).toMatch(/^https?:\/\//);

    await killAsync(child);
  });

  it("streamable", async () => {
    const child = await spawnAsync(
      "ts-node",
      ["./src/index.ts", "-t", "streamable"],
      { IMAGE_SERVER_PORT: "18902" },
    );

    const url = "http://localhost:1122/mcp";
    const transport = new StreamableHTTPClientTransport(new URL(url));
    const client = new Client({
      name: "streamable-http-client",
      version: "1.0.0",
    });
    await client.connect(transport);
    const listTools = await client.listTools();

    expect(listTools.tools.length).toBe(23);

    const spec = {
      type: "line",
      data: [
        { time: "2020", value: 100 },
        { time: "2021", value: 120 },
        { time: "2022", value: 145 },
        { time: "2023", value: 150 },
        { time: "2024", value: 167 },
        { time: "2025", value: 163 },
      ],
    };

    const res = await client.callTool({
      name: "generate_line_chart",
      arguments: spec,
    });

    expect(res._meta).toEqual({
      description:
        "This is the chart's spec and configuration, which can be renderred to corresponding chart by AntV GPT-Vis chart components.",
      spec: spec,
    });

    // @ts-expect-error ignore
    expect(res.content[0].text).toMatch(/^https?:\/\//);

    await killAsync(child);
  });

  it("sse with multiple clients", async () => {
    const child = await spawnAsync("ts-node", ["./src/index.ts", "-t", "sse"], {
      IMAGE_SERVER_PORT: "18903",
    });

    const url = "http://localhost:1122/sse";

    const transport1 = new SSEClientTransport(new URL(url), {});
    const client1 = new Client(
      { name: "sse-client-1", version: "1.0.0" },
      { capabilities: {} },
    );

    const transport2 = new SSEClientTransport(new URL(url), {});
    const client2 = new Client(
      { name: "sse-client-2", version: "1.0.0" },
      { capabilities: {} },
    );

    await Promise.all([
      client1.connect(transport1),
      client2.connect(transport2),
    ]);

    expect((await client1.listTools()).tools.length).toBe(
      (await client2.listTools()).tools.length,
    );

    await killAsync(child);
  });

  it("streamable with multiple clients", async () => {
    const child = await spawnAsync(
      "ts-node",
      ["./src/index.ts", "-t", "streamable"],
      { IMAGE_SERVER_PORT: "18904" },
    );

    const url = "http://localhost:1122/mcp";

    const transport1 = new StreamableHTTPClientTransport(new URL(url), {});
    const client1 = new Client(
      { name: "streamable-client-1", version: "1.0.0" },
      { capabilities: {} },
    );

    const transport2 = new StreamableHTTPClientTransport(new URL(url), {});
    const client2 = new Client(
      { name: "streamable-client-2", version: "1.0.0" },
      { capabilities: {} },
    );

    await Promise.all([
      client1.connect(transport1),
      client2.connect(transport2),
    ]);

    expect((await client1.listTools()).tools.length).toBe(
      (await client2.listTools()).tools.length,
    );

    await killAsync(child);
  });
});
