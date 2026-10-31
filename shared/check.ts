import { z } from "zod";
export const checkInput = z
  .object({
    step: z.number().int().min(0).max(4),
    modelConfirmed: z.literal(true),
    image: z
      .string()
      .max(1500000)
      .regex(/^data:image\/(jpeg|png);base64,[A-Za-z0-9+/]+=*$/),
  })
  .strict();
export const photoCheck = z
  .object({
    status: z.enum(["visible", "unclear", "stop"]),
    observation: z.string().max(700),
    nextAction: z.string().max(500),
    modelEvidence: z.enum([
      "readable_label",
      "not_visible",
      "different_device",
    ]),
    polarityEvidence: z.enum([
      "visible_match",
      "visible_mismatch",
      "not_visible",
      "not_applicable",
    ]),
    concern: z.enum(["none", "corrosion", "leakage", "damage", "wrong_device"]),
    marker: z
      .object({
        x: z.number().min(0).max(1),
        y: z.number().min(0).max(1),
        label: z.string().max(60),
      })
      .strict()
      .nullable(),
  })
  .strict();
export type PhotoCheck = z.infer<typeof photoCheck>;
export function enforceEvidence(value: unknown, step: number): PhotoCheck {
  const result = photoCheck.parse(value);
  if (
    result.concern !== "none" ||
    result.modelEvidence === "different_device" ||
    result.polarityEvidence === "visible_mismatch"
  )
    result.status = "stop";
  if (
    step === 3 &&
    result.polarityEvidence !== "visible_match" &&
    result.status === "visible"
  )
    result.status = "unclear";
  if (result.status === "unclear") result.marker = null;
  return result;
}
