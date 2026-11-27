import { z } from "zod";

/** Decimal strings preserve PostgreSQL bigint precision at JSON boundaries. */
export const RevisionSchema = z
  .string()
  .regex(/^(0|[1-9][0-9]*)$/)
  .max(19)
  .refine(
    (value) =>
      value.length < 19 ||
      (value.length === 19 && value <= "9223372036854775807"),
    "Revision exceeds bigint",
  );
export const UuidSchema = z.uuid();
