import path from "node:path";
import express from "express";
import { getOutputDir } from "./local-render";
import { logger } from "./logger";

let imageServerStarted = false;
let imageServerPort = 18900;
let imageServerHost = "localhost";

/**
 * Start a local HTTP server to serve rendered chart images.
 * Only starts once; subsequent calls resolve immediately.
 * Returns a promise that resolves when the server is listening.
 */
export function startImageServer(
  host = "localhost",
  port = 18900,
): Promise<void> {
  if (imageServerStarted) return Promise.resolve();

  imageServerHost = host;
  imageServerPort = port;

  return new Promise<void>((resolve, reject) => {
    const app = express();
    const dir = getOutputDir();

    app.use("/charts", express.static(dir));

    const server = app.listen(port, host);

    server.on("listening", () => {
      imageServerStarted = true;
      logger.info(`Image server listening on http://${host}:${port}/charts`);
      resolve();
    });

    server.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        logger.error(
          `Image server port ${port} is already in use. Set IMAGE_SERVER_PORT to a different port.`,
        );
      } else {
        logger.error(`Image server failed to start: ${err.message}`, err);
      }
      reject(err);
    });
  });
}

/**
 * Get the URL prefix for served chart images.
 */
export function getImageUrlPrefix(): string {
  return `http://${imageServerHost}:${imageServerPort}/charts`;
}

/**
 * Convert a local file path to a URL served by the image server.
 */
export function filePathToUrl(filePath: string): string {
  const filename = path.basename(filePath);
  return `${getImageUrlPrefix()}/${filename}`;
}

/**
 * Check if the image server has been started.
 */
export function isImageServerRunning(): boolean {
  return imageServerStarted;
}
