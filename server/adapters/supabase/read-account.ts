import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { AccountContextSchema } from "../../../src/contracts/identity.js";
import type { AccountAccessResult } from "../../account-access.js";

const envelopeSchema = z.strictObject({
  issuer: z.string().url(),
  subject: z.string().min(1).max(256),
  account: AccountContextSchema,
});

export async function readAccount(
  client: SupabaseClient,
  principal: Readonly<{ issuer: string; subject: string }>,
): Promise<AccountAccessResult> {
  const result = await client.rpc("account_context");
  if (result.error)
    return {
      kind: result.error.code === "42501" ? "forbidden" : "unavailable",
    };
  const envelope = envelopeSchema.safeParse(result.data);
  if (
    !envelope.success ||
    envelope.data.subject !== principal.subject ||
    envelope.data.issuer !== principal.issuer
  )
    return { kind: "unavailable" };
  // Application identity is independent of the provider's authenticated subject.
  return { kind: "success", account: envelope.data.account };
}
