import { vi } from "vitest";

// Mock @antv/gpt-vis-ssr globally for all tests
vi.mock("@antv/gpt-vis-ssr", () => ({
  render: vi.fn(async (options) => ({
    toBuffer: () =>
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), // PNG signature
    destroy: () => {},
  })),
}));
