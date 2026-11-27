import { createSupabaseAccountAccess } from "./adapters/supabase/account-access.js";
import type { ServerConfig } from "./config.js";
import {
  createHandler,
  type CompletionLogger,
  type NodeHandler,
} from "./handler.js";

/** This composition boundary is the only place HTTP selects an identity provider. */
export function createApplicationHandler(
  config: ServerConfig,
  fetcher: typeof fetch = fetch,
  logger?: CompletionLogger,
): NodeHandler {
  return createHandler(
    config,
    createSupabaseAccountAccess(config, fetcher),
    logger,
  );
}
