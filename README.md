# RepairLens

Source-backed repair walkthroughs with interactive 3D demonstrations and optional Meta Muse photo checkpoints. Built during the Meta Global AI Developer Hackathon, October 2026.

The first supported task is **Logitech M185 external AA battery replacement**. This bounded prototype is not a general-purpose diagnosis service.

## Run

Node.js 22+ required.

```sh
npm ci
npm run build
npm start
```

Open http://127.0.0.1:3004. For development, `npm run dev` serves the interface on port 5174.

The server reads this project's `.env`, then an optional parent `.env`, without overwriting existing variables. Accepted key names: `MODEL_API_KEY`, `MUSE_TOKEN`, `MUSE_API_KEY`, `META_API_KEY`. Keep credentials on the server. `.env.example` lists configuration. No key is required for the walkthrough or 3D illustration.

## What it does

- Five source-linked steps, animated assembly motion, orbit/zoom, and clickable part inspection.
- Original illustrative geometry; not a scan, certified mechanical diagram, or a claim of compatibility with every M185 revision. Actual device markings take precedence.
- On-demand Muse Spark photo review. One submitted photo per request, no background capture or streaming.
- Deterministic evidence checks: hidden polarity cannot count as verified orientation; visible concerns or a device mismatch pause the walkthrough.
- Manual device confirmation, step completion, and functional outcome reporting. The model cannot certify a repair from a photo.
- Browser-local progress and an exported JSON session record. Photos are excluded from persistence and export; the server does not save images.

The phone file picker supports taking a photo where available. An image is resized locally before transmission to Meta when the user presses the photo-check button.

## Sources and attribution

- [Logitech M185 getting-started guide](https://www.logitech.com/assets/42356/3/m185-quick-start-guide.pdf): battery door release, power switch and setup.
- [Logitech M185 specifications](https://support.logi.com/hc/en-us/articles/360023302074-M185-Technical-Specifications): model variants and replaceable AA battery.
- [Garrett Ginter's iFixit battery-replacement guide](https://www.ifixit.com/Guide/Logitech+M185+Wireless+Mouse+Battery+Replacement/150073): removal and replacement sequence. This is community-contributed guidance.

Guide copy is an original concise summary. No source photographs are redistributed. This project is independent of Logitech and iFixit. Fonts are DM Sans and Instrument Serif (SIL Open Font License); icons are Lucide (ISC). Library licenses remain with their authors.

## Validation and limits

`npm test` exercises evidence boundaries without any model calls. `npm run build` includes TypeScript checks. Interface testing should include a narrow viewport, 3D replay, manual completion, source dialogs, and an actual-device test.

The default server caps attempted Muse calls at 12 per process and rate-limits requests. This is not a monetary cap and resets after restart. It binds to loopback only. Public deployment requires authentication and durable abuse/cost controls; do not expose this development server directly.

**Not yet validated:** a physical repair, expert mechanical review, and photo-check accuracy on a real device. The prototype must not be presented as a certified guide, an independently verified successful repair, or measured environmental savings.

## Hackathon demo

Show the real device, link its guide, animate the cover and battery movement, submit a real checkpoint photo, show an uncertainty case, and record a genuine user functional test. Distinguish authored geometry and guide content from live Muse output. A public repository, a working demo, and the event's three-minute video remain submission requirements. Verify the current official rules before submission.
