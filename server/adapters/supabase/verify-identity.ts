import type { SupabaseClient } from "@supabase/supabase-js";

type VerifiedIdentity =
  | Readonly<{ kind: "verified"; subject: string; issuer: string }>
  | Readonly<{ kind: "unauthenticated" | "unavailable" }>;

export async function verifyIdentity(
  client: SupabaseClient,
  bearer: string,
  issuer: string,
): Promise<VerifiedIdentity> {
  const verified = await client.auth.getUser(bearer);
  if (verified.error) {
    return {
      kind:
        verified.error.status === 401 || verified.error.status === 403
          ? "unauthenticated"
          : "unavailable",
    };
  }
  if (!verified.data.user) return { kind: "unauthenticated" };
  return { kind: "verified", subject: verified.data.user.id, issuer };
}
