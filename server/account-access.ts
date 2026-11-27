import type { AccountContext } from "../src/contracts/identity.js";

export type AccountAccessResult =
  | Readonly<{ kind: "success"; account: AccountContext }>
  | Readonly<{ kind: "unauthenticated" | "forbidden" | "unavailable" }>;

/** Application-facing access boundary: no provider subjects, clients or SDK errors escape. */
export interface AccountAccess {
  read(bearer: string, signal: AbortSignal): Promise<AccountAccessResult>;
}
