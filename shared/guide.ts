export const sources = [
  {
    id: "logitech-guide",
    title: "Logitech M185 · Getting started",
    url: "https://www.logitech.com/assets/42356/3/m185-quick-start-guide.pdf",
    kind: "Manufacturer guide",
  },
  {
    id: "logitech-specs",
    title: "Logitech M185 · Technical specifications",
    url: "https://support.logi.com/hc/en-us/articles/360023302074-M185-Technical-Specifications",
    kind: "Manufacturer specifications",
  },
  {
    id: "ifixit-battery",
    title: "M185 battery replacement · Garrett Ginter",
    url: "https://www.ifixit.com/Guide/Logitech+M185+Wireless+Mouse+Battery+Replacement/150073",
    kind: "Community repair guide",
  },
] as const;
export const steps = [
  {
    id: "prepare",
    title: "Start with the right device.",
    short: "Prepare",
    action:
      "Confirm the mouse is a Logitech M185 and switch it off. Work on a clear surface.",
    detail:
      "M185 revisions differ. Read the underside label and check the linked manufacturer guide before following this walkthrough.",
    evidence:
      "A readable underside label and the power switch. A photo alone may not establish the exact model.",
    part: "power",
    sourceIds: ["logitech-guide", "logitech-specs"],
    tip: "You need one suitable AA battery. No internal disassembly is part of this guide.",
  },
  {
    id: "cover",
    title: "Release the battery door.",
    short: "Open",
    action:
      "Use the battery-door release and gently slide the cover away. Stop if it resists.",
    detail:
      "The illustration separates the parts to explain their relationship. Match the actual release and movement on your mouse.",
    evidence:
      "The underside with the door removed and the compartment visible.",
    part: "cover",
    sourceIds: ["logitech-guide", "ifixit-battery"],
    tip: "Use your fingers. Do not pry open the main housing.",
  },
  {
    id: "remove",
    title: "Lift the old AA battery out.",
    short: "Remove",
    action:
      "Gently release the AA battery from its holder, without bending or forcing the contacts.",
    detail:
      "Observe the compartment’s polarity marks before removing the old battery.",
    evidence:
      "The empty battery holder. A photo cannot measure remaining charge.",
    part: "battery",
    sourceIds: ["ifixit-battery", "logitech-specs"],
    tip: "If you see leakage, corrosion, or damaged contacts, stop this walkthrough and seek device-specific advice.",
  },
  {
    id: "replace",
    title: "Follow the polarity marks.",
    short: "Replace",
    action:
      "Insert a suitable replacement AA battery according to the + and − markings inside the compartment.",
    detail:
      "Use the markings on your device. The 3D model is an illustration, not a certified polarity diagram for every revision.",
    evidence:
      "A close, well-lit view of the battery ends and the compartment’s polarity marks. If marks are hidden, Muse must say it cannot verify orientation.",
    part: "battery",
    sourceIds: ["logitech-specs", "ifixit-battery"],
    tip: "Seat the battery gently; it should not require force.",
  },
  {
    id: "test",
    title: "Close it. Try it. Keep it.",
    short: "Test",
    action:
      "Refit the cover, switch the mouse on, and test pointer movement with its USB receiver connected.",
    detail:
      "Record the actual result. If it still does not work, this walkthrough does not establish the cause.",
    evidence:
      "A photo can show the closed cover. Only you can confirm pointer movement and successful operation.",
    part: "cover",
    sourceIds: ["logitech-guide", "ifixit-battery"],
    tip: "A completed walkthrough is not the same as a repaired device. Record the functional test below.",
  },
] as const;
export type Part = "power" | "cover" | "battery" | "body";
