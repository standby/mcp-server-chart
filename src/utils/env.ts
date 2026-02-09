import process from "node:process";

/**
 * Get the VIS_REQUEST_SERVER from environment variables.
 * Returns undefined if not set, indicating local rendering should be used.
 */
export function getVisRequestServer() {
  return process.env.VIS_REQUEST_SERVER;
}

/**
 * Check if private (local) deployment is enabled.
 * Private deployment is enabled by default when VIS_REQUEST_SERVER is not set.
 */
export function isPrivateDeployment(): boolean {
  return !process.env.VIS_REQUEST_SERVER;
}

/**
 * Get the `SERVICE_ID` from environment variables.
 */
export function getServiceIdentifier() {
  return process.env.SERVICE_ID;
}

/**
 * Get the list of disabled tools from environment variables.
 */
export function getDisabledTools(): string[] {
  const disabledTools = process.env.DISABLED_TOOLS;
  if (!disabledTools || disabledTools === "undefined") {
    return [];
  }
  return disabledTools.split(",");
}
