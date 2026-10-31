import { describe, it, expect } from "vitest";
import { checkInput, enforceEvidence } from "../shared/check";
import { steps, sources } from "../shared/guide";
const base = {
  status: "visible",
  observation: "The holder is visible.",
  nextAction: "Follow the linked guide.",
  modelEvidence: "not_visible",
  polarityEvidence: "not_applicable",
  concern: "none",
  marker: { x: 0.5, y: 0.5, label: "Holder" },
};
describe("Evidence guardrails", () => {
  it("does not verify hidden polarity", () =>
    expect(
      enforceEvidence({ ...base, polarityEvidence: "not_visible" }, 3).status,
    ).toBe("unclear"));
  it("does not keep a marker on an unclear result", () =>
    expect(
      enforceEvidence({ ...base, status: "unclear" }, 1).marker,
    ).toBeNull());
  it.each(["corrosion", "leakage", "damage", "wrong_device"])(
    "pauses for %s",
    (concern) =>
      expect(enforceEvidence({ ...base, concern }, 1).status).toBe("stop"),
  );
  it("pauses for reversed polarity", () =>
    expect(
      enforceEvidence({ ...base, polarityEvidence: "visible_mismatch" }, 3)
        .status,
    ).toBe("stop"));
  it("pauses for a different device", () =>
    expect(
      enforceEvidence({ ...base, modelEvidence: "different_device" }, 0).status,
    ).toBe("stop"));
  it("rejects arbitrary remote image URLs", () =>
    expect(
      checkInput.safeParse({
        step: 0,
        modelConfirmed: true,
        image: "https://example.com/photo.jpg",
      }).success,
    ).toBe(false));
  it("requires model confirmation", () =>
    expect(
      checkInput.safeParse({
        step: 0,
        modelConfirmed: false,
        image: "data:image/jpeg;base64,AAAA",
      }).success,
    ).toBe(false));
  it("rejects out-of-frame annotations", () =>
    expect(() =>
      enforceEvidence({ ...base, marker: { x: 3, y: 0.2, label: "Bad" } }, 1),
    ).toThrow());
  it("links every step to a registered source", () => {
    for (const s of steps)
      for (const id of s.sourceIds)
        expect(sources.some((v) => v.id === id)).toBe(true);
  });
  it("keeps successful operation outside photo assessment", () =>
    expect(steps[4].evidence).toContain("Only you can confirm"));
});
