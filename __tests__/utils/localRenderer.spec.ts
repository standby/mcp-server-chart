import { describe, expect, it } from "vitest";
import {
  isLocalRenderingSupported,
  renderChartLocally,
} from "../../src/utils/localRenderer";

describe("localRenderer", () => {
  it("should identify supported chart types for local rendering", () => {
    expect(isLocalRenderingSupported("line")).toBe(true);
    expect(isLocalRenderingSupported("bar")).toBe(true);
    expect(isLocalRenderingSupported("pie")).toBe(true);
    expect(isLocalRenderingSupported("area")).toBe(true);
  });

  it("should identify unsupported chart types (geographic maps)", () => {
    expect(isLocalRenderingSupported("district-map")).toBe(false);
    expect(isLocalRenderingSupported("path-map")).toBe(false);
    expect(isLocalRenderingSupported("pin-map")).toBe(false);
  });

  it("should render a simple line chart locally", async () => {
    const buffer = await renderChartLocally("line", {
      data: [
        { time: "2015", value: 23 },
        { time: "2016", value: 32 },
      ],
      width: 600,
      height: 400,
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
    // Check if it's a PNG buffer (PNG signature starts with 0x89504E47)
    expect(buffer[0]).toBe(0x89);
    expect(buffer[1]).toBe(0x50);
    expect(buffer[2]).toBe(0x4e);
    expect(buffer[3]).toBe(0x47);
  });

  it("should render a pie chart locally", async () => {
    const buffer = await renderChartLocally("pie", {
      data: [
        { name: "A", value: 30 },
        { name: "B", value: 70 },
      ],
      width: 600,
      height: 400,
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
    // Verify PNG signature
    expect(buffer[0]).toBe(0x89);
  });
});
