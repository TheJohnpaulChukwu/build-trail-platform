import { createClient } from "@supabase/supabase-js";
import type { AccountAccess } from "../../account-access.js";
import type { ServerConfig } from "../../config.js";
import { verifyIdentity } from "./verify-identity.js";
import { readAccount } from "./read-account.js";

export function createSupabaseAccountAccess(
  config: Pick<ServerConfig, "supabaseUrl" | "supabasePublishableKey">,
  fetcher: typeof fetch = fetch,
): AccountAccess {
  return {
    async read(bearer, signal) {
      try {
        signal.throwIfAborted();
        const boundedFetch: typeof fetch = async (input, init) => {
          const combined = init?.signal
            ? AbortSignal.any([signal, init.signal])
            : signal;
          try {
            return await fetcher(input, { ...init, signal: combined });
          } catch {
            throw new Error("Account service unavailable");
          }
        };
        const client = createClient(
          config.supabaseUrl,
          config.supabasePublishableKey,
          {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
              detectSessionInUrl: false,
            },
            global: {
              headers: { Authorization: `Bearer ${bearer}` },
              fetch: boundedFetch,
            },
          },
        );
        const identity = await verifyIdentity(
          client,
          bearer,
          `${config.supabaseUrl}/auth/v1`,
        );
        if (identity.kind !== "verified") return identity;
        signal.throwIfAborted();
        return await readAccount(client, identity);
      } catch {
        return { kind: "unavailable" };
      }
    },
  };
}
