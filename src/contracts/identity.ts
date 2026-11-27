import { z } from "zod";
import { RevisionSchema, UuidSchema } from "./common.js";

export const AccountContextSchema = z.strictObject({
  userId: UuidSchema,
  displayName: z.string().max(100).nullable(),
  preferences: z.strictObject({
    theme: z.enum(["system", "light", "dark"]),
    readingSize: z.enum(["normal", "large", "extra_large"]),
    readingFont: z.enum(["mono", "proportional"]),
    focus: z.boolean(),
    revision: RevisionSchema,
  }),
  usage: z.strictObject({
    textBytes: z
      .number()
      .int()
      .min(0)
      .max(10 * 1024 * 1024),
    studyRecordCount: z.number().int().min(0).max(10_000),
    enrollmentCount: z.number().int().min(0).max(1_000),
  }),
  isOwner: z.boolean(),
});
export type AccountContext = z.infer<typeof AccountContextSchema>;
