import { z } from "zod";

const environmentSchema = z.enum(["local", "test", "staging", "production"]);
function publicKey(value: string): boolean {
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(value)) return true;
  // This classifies configured public keys; it never authenticates a user JWT.
  const parts = value.split(".");
  if (
    parts.length !== 3 ||
    !parts.every((part) => /^[A-Za-z0-9_-]+$/.test(part))
  )
    return false;
  try {
    const payload: unknown = JSON.parse(
      Buffer.from(parts[1] ?? "", "base64url").toString(),
    );
    return (
      typeof payload === "object" &&
      payload !== null &&
      "role" in payload &&
      payload.role === "anon"
    );
  } catch {
    return false;
  }
}
function exactOrigin(value: string, local: boolean): boolean {
  try {
    const url = new URL(value);
    if (url.origin !== value || url.username || url.password) return false;
    return (
      url.protocol === "https:" ||
      (local &&
        url.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
    );
  } catch {
    return false;
  }
}
const schema = z.object({
  APP_ENV: environmentSchema,
  SUPABASE_URL: z.string(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1).max(4096).refine(publicKey),
  APP_ORIGIN: z.string(),
  RELEASE: z.string().regex(/^[A-Za-z0-9._-]{1,100}$/),
  REQUEST_TIMEOUT_MS: z
    .string()
    .regex(/^[1-9][0-9]*$/)
    .transform(Number)
    .pipe(z.number().int().min(1).max(60_000)),
});
export type ServerConfig = Readonly<{
  environment: z.infer<typeof environmentSchema>;
  supabaseUrl: string;
  supabasePublishableKey: string;
  appOrigin: string;
  release: string;
  requestTimeoutMs: number;
}>;
export function loadServerConfig(env: NodeJS.ProcessEnv): ServerConfig {
  const result = schema.safeParse(env);
  if (!result.success) throw new Error("Invalid server configuration");
  const value = result.data;
  const local = value.APP_ENV === "local" || value.APP_ENV === "test";
  if (
    !exactOrigin(value.APP_ORIGIN, local) ||
    !exactOrigin(value.SUPABASE_URL, local)
  )
    throw new Error("Invalid server configuration");
  return Object.freeze({
    environment: value.APP_ENV,
    supabaseUrl: value.SUPABASE_URL,
    supabasePublishableKey: value.SUPABASE_PUBLISHABLE_KEY,
    appOrigin: value.APP_ORIGIN,
    release: value.RELEASE,
    requestTimeoutMs: value.REQUEST_TIMEOUT_MS,
  });
}
