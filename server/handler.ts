import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { AccountAccess } from "./account-access.js";

function json(response: ServerResponse, status: number, body: unknown): void {
  response.statusCode = status;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
}
export type NodeHandler = (
  request: IncomingMessage,
  response: ServerResponse,
) => Promise<void>;

export type RequestCompletion = Readonly<{
  event: "request_completed";
  requestId: string;
  method: string;
  path: string;
  status: number;
  durationMs: number;
}>;
export type CompletionLogger = (event: RequestCompletion) => void;
const stdoutLogger: CompletionLogger = (event) => {
  process.stdout.write(`${JSON.stringify(event)}\n`);
};

export function createHandler(
  config: Readonly<{ release: string; requestTimeoutMs: number }>,
  accountAccess: AccountAccess,
  logger: CompletionLogger = stdoutLogger,
): NodeHandler {
  return async (
    request: IncomingMessage,
    response: ServerResponse,
  ): Promise<void> => {
    const requestId = randomUUID();
    const started = performance.now();
    const path = (request.url ?? "").split("?")[0];
    const safePath =
      path === "/api/v1/health" || path === "/api/v1/me" ? path : "[unmatched]";
    const safeMethod = [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "HEAD",
      "OPTIONS",
    ].includes(request.method ?? "")
      ? (request.method ?? "OTHER")
      : "OTHER";
    response.once("finish", () => {
      try {
        logger({
          event: "request_completed",
          requestId,
          method: safeMethod,
          path: safePath,
          status: response.statusCode,
          durationMs: Math.round((performance.now() - started) * 100) / 100,
        });
      } catch {
        // A broken telemetry sink must not turn an acknowledged request into a crash.
        process.stderr.write("Request completion logging unavailable\n");
      }
    });
    response.setHeader("cache-control", "no-store");
    response.setHeader("x-request-id", requestId);
    response.setHeader("x-content-type-options", "nosniff");
    const fail = (status: number, code: string, message: string) =>
      json(response, status, { error: { code, message, requestId } });
    try {
      if (path !== "/api/v1/health" && path !== "/api/v1/me") {
        fail(404, "NOT_FOUND", "Not found");
        return;
      }
      if (request.method !== "GET") {
        response.setHeader("allow", "GET");
        fail(405, "METHOD_NOT_ALLOWED", "Method not allowed");
        return;
      }
      if (path === "/api/v1/health") {
        json(response, 200, { status: "ok", release: config.release });
        return;
      }
      const authorization = request.headers.authorization;
      const bearer = authorization?.match(/^Bearer ([A-Za-z0-9._~-]+)$/i)?.[1];
      if (!bearer || bearer.length > 8192) {
        fail(401, "UNAUTHENTICATED", "Sign in required");
        return;
      }
      const deadline = AbortSignal.timeout(config.requestTimeoutMs);
      const result = await accountAccess.read(bearer, deadline);
      switch (result.kind) {
        case "success":
          json(response, 200, result.account);
          return;
        case "unauthenticated":
          fail(401, "UNAUTHENTICATED", "Sign in required");
          return;
        case "forbidden":
          fail(403, "FORBIDDEN", "Account unavailable");
          return;
        case "unavailable":
          fail(503, "RETRYABLE_FAILURE", "Service temporarily unavailable");
          return;
      }
    } catch {
      fail(503, "RETRYABLE_FAILURE", "Service temporarily unavailable");
    }
  };
}
