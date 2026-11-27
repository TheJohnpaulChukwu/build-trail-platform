import type { IncomingMessage, ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { loadServerConfig } from "./config.js";
import { createApplicationHandler } from "./composition.js";

/** Validate at the deployment boundary; configuration errors never expose values. */
export default async function runtimeHandler(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  try {
    await createApplicationHandler(loadServerConfig(process.env))(
      request,
      response,
    );
  } catch {
    const requestId = randomUUID();
    response.statusCode = 503;
    response.setHeader("cache-control", "no-store");
    response.setHeader("x-request-id", requestId);
    response.setHeader("content-type", "application/json; charset=utf-8");
    response.end(
      JSON.stringify({
        error: {
          code: "RETRYABLE_FAILURE",
          message: "Service temporarily unavailable",
          requestId,
        },
      }),
    );
  }
}
