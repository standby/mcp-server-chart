import { afterEach, describe, expect, it } from "vitest";
import {
  getDisabledTools,
  getVisRequestServer,
  isPrivateDeployment,
} from "../../src/utils/env";

describe("env", () => {
  it("default vis request server is undefined (private deployment)", () => {
    process.env.VIS_REQUEST_SERVER = undefined;
    expect(getVisRequestServer()).toBeUndefined();
  });

  it("private deployment is enabled by default", () => {
    process.env.VIS_REQUEST_SERVER = undefined;
    expect(isPrivateDeployment()).toBe(true);
  });

  it("modify vis request server by env", () => {
    process.env.VIS_REQUEST_SERVER = "https://example.com/api/gpt-vis";
    expect(getVisRequestServer()).toBe("https://example.com/api/gpt-vis");
    expect(isPrivateDeployment()).toBe(false);
  });

  it("default disabled tools", () => {
    process.env.DISABLED_TOOLS = undefined;
    expect(getDisabledTools()).toEqual([]);
  });

  it("parse disabled tools from env", () => {
    process.env.DISABLED_TOOLS = "generate_fishbone_diagram,generate_mind_map";
    expect(getDisabledTools()).toEqual([
      "generate_fishbone_diagram",
      "generate_mind_map",
    ]);
  });

  it("handle empty disabled tools env", () => {
    process.env.DISABLED_TOOLS = "";
    expect(getDisabledTools()).toEqual([]);
  });

  afterEach(() => {
    process.env.VIS_REQUEST_SERVER = undefined;
    process.env.DISABLED_TOOLS = undefined;
  });
});
