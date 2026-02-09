# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MCP server (`@antv/mcp-server-chart`) that exposes 23 chart generation tools via the Model Context Protocol. Built with TypeScript, it accepts chart specifications, validates them with Zod, and renders charts locally using `@antv/g2-ssr` (no external server needed).

## Commands

```bash
npm run build          # TypeScript compile + tsc-alias path resolution
npm test               # Run all tests (vitest)
npm test -- --run      # Run tests once without watch mode
npx vitest run __tests__/api.spec.ts   # Run a single test file
npm run start          # Launch with MCP inspector (stdio transport)
```

**Lint/format (via Biome):**
```bash
npx biome check --write src/    # Check + auto-fix
npx biome format --write src/   # Format only
npx biome lint src/             # Lint only
```

Biome config: 2-space indent, double quotes, organized imports.

Pre-commit hooks (Husky + lint-staged) run Biome automatically on staged `*.{ts,js,json}` files.

## Architecture

### Chart Module Pattern

Every chart in `src/charts/` exports `{ schema, tool }`:

- **`schema`**: A plain object of Zod field definitions (not a `z.object()`). Composed from shared base schemas in `src/charts/base.ts` (ThemeSchema, WidthSchema, etc.) plus chart-specific fields.
- **`tool`**: MCP tool descriptor with `name` (e.g. `generate_line_chart`), `description`, `inputSchema` (generated via `zodToJsonSchema(schema)`), and `annotations`.

All charts are re-exported from `src/charts/index.ts` using string-literal named exports (e.g. `export { dualAxes as "dual-axes" }`).

### Tool Dispatch (`src/utils/callTool.ts`)

`CHART_TYPE_MAP` maps tool names -> chart type keys. `callTool()` validates input with `z.object(schema).safeParse(args)`, then calls `generateChartUrl()` to render locally. Errors are converted to typed `McpError` responses.

### Chart Rendering (`src/utils/generate.ts`)

Translates MCP chart specs to G2 specs via `src/utils/spec-translator.ts`, then renders to PNG using `@antv/g2-ssr` in `src/utils/local-render.ts`. Images are saved to a temp directory and served by a local HTTP image server (`src/utils/image-server.ts`, default port 18900).

### Spec Translation (`src/utils/spec-translator.ts`)

Translates the MCP server's custom chart schemas into `@antv/g2` declarative specs. Each chart type has a translator function that maps fields like `data`, `style`, `theme` into G2's `type`/`encode`/`transform`/`coordinate` format. Graph/diagram types (network-graph, mind-map, org-chart, flow-diagram, fishbone) are rendered using G2's `forceGraph` mark type.

### Transport Layer (`src/services/`)

Three transport implementations, all using the same `createServer()` from `src/server.ts`:
- **stdio** -- direct Node.js stdin/stdout
- **SSE** -- Express-based Server-Sent Events (default port 1122, endpoint `/sse`)
- **Streamable HTTP** -- stateless Express endpoint (default port 1122, endpoint `/mcp`)

### Server Setup (`src/server.ts`)

`createServer()` instantiates an MCP `Server`, registers `ListToolsRequest` and `CallToolRequest` handlers. On startup, `initLocalRendering()` starts the image server. Tools can be disabled at runtime via the `DISABLED_TOOLS` environment variable.

## Adding a New Chart

1. Create `src/charts/my-chart.ts` following the `{ schema, tool }` pattern
2. Compose schema from base schemas in `base.ts` + custom Zod fields
3. Name the tool `generate_my_chart` with a descriptive `description`
4. Export from `src/charts/index.ts`
5. Add the tool name -> chart type mapping in `CHART_TYPE_MAP` in `src/utils/callTool.ts`
6. Add a G2 spec translator in `src/utils/spec-translator.ts`

## Environment Variables

| Variable | Purpose | Default |
|---|---|---|
| `CHART_IMAGE_DIR` | Custom directory for rendered chart images | OS temp dir |
| `IMAGE_SERVER_PORT` | Port for the local image server | `18900` |
| `DISABLED_TOOLS` | Comma-separated tool names to disable | -- |

## Testing

Tests live in `__tests__/*.spec.ts`. Key test files:
- `local-render.spec.ts` -- tests spec translation and local PNG rendering
- `server.spec.ts` -- integration tests spawning server processes for all three transports
- `api.spec.ts` -- SDK export structure validation

Test timeout is 60 seconds. Integration tests use unique `IMAGE_SERVER_PORT` values to avoid port conflicts.
