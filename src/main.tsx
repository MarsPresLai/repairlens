import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/instrument-serif/latin-400.css";
import React, {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Box,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ExternalLink,
  Focus,
  ImagePlus,
  Info,
  Layers,
  Leaf,
  LoaderCircle,
  Mouse,
  MoveUpRight,
  Pause,
  Play,
  RotateCcw,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Upload,
  Wrench,
  X,
} from "lucide-react";
import { sources, steps, type Part } from "../shared/guide";
import type { PhotoCheck } from "../shared/check";
import "./style.css";
const DeviceView = lazy(() => import("./DeviceView"));
function saved() {
  try {
    const v = JSON.parse(localStorage.getItem("repairlens-session") || "null");
    return {
      step: Number.isInteger(v?.step) && v.step >= 0 && v.step < 5 ? v.step : 0,
      confirmed: v?.confirmed === true,
      done: Array.isArray(v?.done)
        ? v.done.filter(
            (x: unknown) =>
              Number.isInteger(x) && Number(x) >= 0 && Number(x) < 5,
          )
        : [],
      paused: v?.paused === true,
      outcome: ["working", "not-working"].includes(v?.outcome) ? v.outcome : "",
    };
  } catch {
    return { step: 0, confirmed: false, done: [], paused: false, outcome: "" };
  }
}
function App() {
  const [initial] = useState(saved);
  const [step, setStep] = useState<number>(initial.step);
  const [confirmed, setConfirmed] = useState(initial.confirmed);
  const [done, setDone] = useState<number[]>(initial.done);
  const [outcome, setOutcome] = useState<string>(initial.outcome);
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [part, setPart] = useState<Part | null>(null);
  const [webgl, setWebgl] = useState(true);
  const [photo, setPhoto] = useState<string | null>(null);
  const [result, setResult] = useState<PhotoCheck | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<"sources" | "about" | null>(null);
  const [status, setStatus] = useState<{
    configured: boolean;
    calls: number;
    limit: number;
  } | null>(null);
  const [paused, setPaused] = useState(initial.paused);
  const upload = useRef<HTMLInputElement>(null);
  const revision = useRef(0);
  const s = steps[step];
  const fail = useCallback(() => setWebgl(false), []);
  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {});
    return () => {
      revision.current++;
    };
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(
        "repairlens-session",
        JSON.stringify({ step, confirmed, done, outcome, paused }),
      );
    } catch {}
  }, [step, confirmed, done, outcome, paused]);
  useEffect(() => {
    if (!playing) return;
    let raf: number;
    const start = performance.now() - (progress * 6500) / speed;
    const tick = (now: number) => {
      const p = Math.min(1, ((now - start) * speed) / 6500);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setPlaying(false);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed]);
  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement as HTMLElement;
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    dialog?.querySelector<HTMLElement>("button")?.focus();
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") setModal(null);
      if (event.key === "Tab") {
        const items = Array.from(
          dialog?.querySelectorAll<HTMLElement>("button,a[href]") || [],
        );
        if (event.shiftKey && document.activeElement === items[0]) {
          event.preventDefault();
          items.at(-1)?.focus();
        } else if (!event.shiftKey && document.activeElement === items.at(-1)) {
          event.preventDefault();
          items[0]?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      previous?.focus();
    };
  }, [modal]);
  function select(i: number) {
    if (busy || i < 0 || i > 4) return;
    revision.current++;
    setStep(i);
    setProgress(0);
    setPlaying(false);
    setPart(null);
    setPhoto(null);
    setResult(null);
    setError("");
  }
  function complete() {
    if (!confirmed || paused) return;
    setDone((v) => Array.from(new Set([...v, step])));
    if (step < 4) select(step + 1);
  }
  async function addPhoto(file: File) {
    revision.current++;
    setResult(null);
    setError("");
    if (
      !/^image\/(png|jpeg|webp)$/.test(file.type) ||
      file.size > 10 * 1024 * 1024
    ) {
      setError("Choose a PNG, JPEG, or WebP photo under 10 MB.");
      return;
    }
    try {
      const image = await createImageBitmap(file);
      const ratio = Math.min(1, 1280 / Math.max(image.width, image.height));
      const c = document.createElement("canvas");
      c.width = Math.round(image.width * ratio);
      c.height = Math.round(image.height * ratio);
      c.getContext("2d")!.drawImage(image, 0, 0, c.width, c.height);
      image.close();
      setPhoto(c.toDataURL("image/jpeg", 0.8));
    } catch {
      setError("This photo could not be read. Try a JPEG or PNG.");
    }
  }
  async function checkPhoto() {
    if (!photo || !confirmed || busy) return;
    const current = ++revision.current;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step, modelConfirmed: true, image: photo }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (current === revision.current) {
        setResult(data.check);
        if (data.check.status === "stop") setPaused(true);
      }
      fetch("/api/status")
        .then((r) => r.json())
        .then(setStatus)
        .catch(() => {});
    } catch (e) {
      if (current === revision.current)
        setError(
          e instanceof Error ? e.message : "The check could not be completed.",
        );
    } finally {
      setBusy(false);
    }
  }
  function exportRecord() {
    const data = {
      project: "RepairLens",
      guide: "Logitech M185 external AA battery replacement",
      timestamp: new Date().toISOString(),
      modelConfirmedByUser: confirmed,
      stepsMarkedDoneByUser: done.map((i) => steps[i].id),
      functionalTestReportedByUser: outcome || "not-recorded",
      guidePaused: paused,
      sources: sources.map((v) => v.url),
      note: "This record contains user reports, not a certified repair or electrical diagnosis. Photos are not included.",
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "repairlens-session.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="shell">
      <header>
        <a href="/" className="brand">
          <span className="brand-icon">
            <Focus size={22} />
          </span>
          repair<span>lens</span>
        </a>
        <nav>
          <span className="nav-active">WORKBENCH</span>
          <button onClick={() => setModal("sources")}>
            THE SOURCES <ArrowUpRight size={12} />
          </button>
        </nav>
        <span className="header-note">
          <span className="live-dot" />
          {status?.configured
            ? "Muse photo checks available"
            : "Offline walkthrough"}
        </span>
        <button
          className="header-info"
          aria-label="About this prototype"
          onClick={() => setModal("about")}
        >
          <Info size={17} />
        </button>
      </header>
      <main>
        <div className="breadcrumb">
          FIELD GUIDE <ChevronRight size={11} /> EVERYDAY ELECTRONICS{" "}
          <ChevronRight size={11} />
          <span>001</span>
        </div>
        <section className="intro">
          <div>
            <span className="eyebrow">LESS REPLACING. MORE UNDERSTANDING.</span>
            <h1>
              Keep good things <em>going.</em>
            </h1>
            <p>
              A little guidance between a device that stopped and a device you
              keep.
            </p>
          </div>
          <div className="case-id">
            <span>CASE 001 / SUPPORTED WALKTHROUGH</span>
            <strong>Logitech M185</strong>
            <small>External AA battery replacement</small>
          </div>
        </section>
        <div className="workbench">
          <section className="visual">
            <div className="visual-top">
              <span>
                <Box size={14} /> INTERACTIVE ASSEMBLY
              </span>
              <button
                onClick={() => {
                  setProgress(0);
                  setPlaying(false);
                }}
              >
                <RotateCcw size={13} /> Reset motion
              </button>
            </div>
            <div className="model-stage">
              {webgl ? (
                <Suspense
                  fallback={
                    <div className="model-loading">
                      <LoaderCircle className="spin" size={25} />
                      Preparing your workbench…
                    </div>
                  }
                >
                  <DeviceView
                    step={step}
                    progress={progress}
                    onPart={setPart}
                    onFailure={fail}
                  />
                </Suspense>
              ) : (
                <div className="model-loading">
                  <Box size={34} />
                  <p>3D is unavailable on this device.</p>
                  <p>The written guide and photo checks still work.</p>
                </div>
              )}
              <div className="stage-heading">
                <span>LOGITECH M185 · ASSEMBLY STUDY</span>
                <strong>
                  {step === 0
                    ? "Get to know the underside."
                    : step === 1
                      ? "A cover, not a whole new mouse."
                      : step === 2
                        ? "One small part. A useful first check."
                        : step === 3
                          ? "The markings tell the story."
                          : "Back together. Ready to test."}
                </strong>
              </div>
              <div className="orientation">
                <span>UNDERSIDE VIEW</span>
                <span>↗ drag to orbit · scroll to zoom</span>
              </div>
              <div className="stage-badge">
                <span className="orange-dot" />
                STEP {String(step + 1).padStart(2, "0")}
                <span> / 05</span>
              </div>
              {part && (
                <div className="part-popover">
                  <button
                    aria-label="Close part detail"
                    onClick={() => setPart(null)}
                  >
                    <X size={14} />
                  </button>
                  <span className="eyebrow">PART INSPECTOR</span>
                  <h3>
                    {part === "power"
                      ? "Power switch"
                      : part === "cover"
                        ? "Battery door"
                        : part === "battery"
                          ? "AA battery & holder"
                          : "Mouse assembly"}
                  </h3>
                  <p>
                    {part === "power"
                      ? "Switch off before starting. Confirm the switch position on the actual device."
                      : part === "cover"
                        ? "The user-accessible door opens the battery compartment. The main housing stays intact."
                        : part === "battery"
                          ? "One replaceable AA battery. Match the + and − markings inside your device."
                          : "An original illustrative model. Dimensions and part positions may differ across revisions."}
                  </p>
                </div>
              )}
            </div>
            <div className="motion-bar">
              <button
                className="play"
                aria-label={playing ? "Pause movement" : "Play movement"}
                onClick={() => {
                  if (progress >= 1) setProgress(0);
                  setPlaying(!playing);
                }}
              >
                {playing ? (
                  <Pause size={15} fill="currentColor" />
                ) : (
                  <Play size={15} fill="currentColor" />
                )}
              </button>
              <div className="motion-caption">
                <strong>See the movement</strong>
                <span>
                  {Math.round(progress * 100)}% · illustrative animation
                </span>
              </div>
              <input
                aria-label="Assembly animation progress"
                type="range"
                min="0"
                max="1"
                step=".005"
                value={progress}
                onChange={(e) => {
                  setPlaying(false);
                  setProgress(Number(e.target.value));
                }}
              />
              <select
                aria-label="Animation speed"
                value={speed}
                onChange={(e) => {
                  setPlaying(false);
                  setSpeed(Number(e.target.value));
                }}
              >
                <option value={0.25}>0.25×</option>
                <option value={0.5}>0.5×</option>
                <option value={1}>1×</option>
              </select>
            </div>
            <div className="illustration-note">
              <Info size={12} />
              <span>
                Illustrative geometry. Use the actual device’s release, fit, and
                polarity markings.
              </span>
            </div>
          </section>
          <aside className="guide-panel">
            <div className="guide-panel-top">
              <span className="eyebrow">YOUR NEXT MOVE</span>
              <span>{String(step + 1).padStart(2, "0")} / 05</span>
            </div>
            <h2>{s.title}</h2>
            <p className="action">{s.action}</p>
            <p className="detail">{s.detail}</p>
            <div className="field-note">
              <Wrench size={14} />
              <p>{s.tip}</p>
            </div>
            <div className="step-sources">
              <ShieldCheck size={13} />
              <button onClick={() => setModal("sources")}>
                Source-backed instruction
              </button>
              <span>{s.sourceIds.length} refs</span>
            </div>
            {step === 0 && (
              <label className="model-confirm">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
                <span>I checked that my device matches the M185 guide.</span>
              </label>
            )}
            <div className="photo-check">
              <div className="photo-title">
                <span>
                  <Sparkles size={15} /> A second pair of eyes
                </span>
                <span className="meta-tag">META MUSE</span>
              </div>
              <p>{s.evidence}</p>
              {photo ? (
                <div className="photo-preview">
                  <img src={photo} alt="Your selected checkpoint photo" />
                  {result?.marker && (
                    <span
                      className="photo-marker"
                      style={{
                        left: `${result.marker.x * 100}%`,
                        top: `${result.marker.y * 100}%`,
                      }}
                      title={result.marker.label}
                    >
                      <Focus size={27} />
                    </span>
                  )}
                  <button
                    aria-label="Remove selected photo"
                    onClick={() => {
                      revision.current++;
                      setPhoto(null);
                      setResult(null);
                    }}
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <button
                  className="upload"
                  onClick={() => upload.current?.click()}
                >
                  <ImagePlus size={20} />
                  <span>
                    Add a checkpoint photo
                    <small>Choose a file or use your phone camera</small>
                  </span>
                  <PlusIcon />
                </button>
              )}
              <input
                ref={upload}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                capture="environment"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void addPhoto(f);
                  e.target.value = "";
                }}
              />
              {photo && (
                <button
                  className="check-photo"
                  disabled={!confirmed || busy}
                  onClick={checkPhoto}
                >
                  {busy ? (
                    <LoaderCircle size={14} className="spin" />
                  ) : (
                    <ScanLine size={14} />
                  )}{" "}
                  {busy
                    ? "Muse is checking visible evidence…"
                    : "Ask Muse to check this photo"}
                  <ArrowUpRight size={14} />
                </button>
              )}
              <span className="privacy-note">
                {!confirmed
                  ? "Confirm the supported device in step 1 to enable checks."
                  : "One photo per request. No continuous recording or upload."}
              </span>
              {result && (
                <div className={"photo-result " + result.status} role="status">
                  <span>
                    {result.status === "visible"
                      ? "EXPECTED STATE VISIBLE"
                      : result.status === "stop"
                        ? "PAUSE THIS GUIDE"
                        : "MORE EVIDENCE NEEDED"}
                  </span>
                  <p>{result.observation}</p>
                  <strong>{result.nextAction}</strong>
                  <small>
                    Photo evidence only · not an electrical or safety
                    certification
                  </small>
                </div>
              )}
            </div>
            {paused && (
              <div className="pause-note" role="alert">
                This session is paused because the photo check flagged a
                concern. Do not continue this walkthrough for that condition.
              </div>
            )}
            {step === 4 ? (
              <div className="functional-test">
                <span className="eyebrow">YOU CHECK THE REAL-WORLD RESULT</span>
                <p>Does the pointer now move normally?</p>
                <div>
                  <button
                    disabled={!confirmed || paused}
                    className={outcome === "working" ? "selected" : ""}
                    onClick={() => {
                      setOutcome("working");
                      setDone((v) => Array.from(new Set([...v, 4])));
                    }}
                  >
                    <Check size={13} />
                    Yes, it works
                  </button>
                  <button
                    disabled={!confirmed || paused}
                    className={outcome === "not-working" ? "selected" : ""}
                    onClick={() => setOutcome("not-working")}
                  >
                    Still not working
                  </button>
                </div>
                {outcome && (
                  <small>
                    {outcome === "working"
                      ? "Working again — reported by you. No environmental savings are estimated."
                      : "Result recorded. A battery replacement did not resolve the issue; this guide does not diagnose the cause."}
                  </small>
                )}
              </div>
            ) : (
              <button
                className="next-step"
                disabled={!confirmed || paused || busy}
                onClick={complete}
              >
                I’ve done this step <ArrowRight size={15} />
              </button>
            )}
            <div className="step-bottom">
              <button
                disabled={step === 0 || busy}
                onClick={() => select(step - 1)}
              >
                <ArrowLeft size={13} /> Previous
              </button>
              <span>Progress is marked by you.</span>
            </div>
          </aside>
        </div>
        {error && (
          <div className="error" role="alert">
            <span>{error}</span>
            <button aria-label="Dismiss error" onClick={() => setError("")}>
              <X size={16} />
            </button>
          </div>
        )}
        <section className="journey">
          <div className="journey-head">
            <span className="eyebrow">A SMALL JOB, MADE CLEAR.</span>
            <span>{done.length} of 5 steps marked done</span>
          </div>
          <div className="journey-steps">
            {steps.map((v, i) => (
              <button
                key={v.id}
                disabled={busy}
                className={step === i ? "active" : ""}
                onClick={() => select(i)}
              >
                <span className="journey-index">
                  {done.includes(i) ? (
                    <Check size={13} />
                  ) : (
                    String(i + 1).padStart(2, "0")
                  )}
                </span>
                <div>
                  <strong>{v.short}</strong>
                  <span>
                    {i === 0
                      ? "Match the device"
                      : i === 1
                        ? "Release the door"
                        : i === 2
                          ? "Lift the old cell"
                          : i === 3
                            ? "Check the markings"
                            : "Record the result"}
                  </span>
                </div>
                <ChevronRight size={14} />
              </button>
            ))}
          </div>
        </section>
        <section className="principles">
          <div>
            <BookOpen size={21} />
            <h3>Instructions with a source.</h3>
            <p>
              The guide stays fixed. Muse checks the photo against the step
              instead of inventing a repair.
            </p>
          </div>
          <div>
            <Focus size={21} />
            <h3>Evidence, before confidence.</h3>
            <p>
              Hidden markings or an unclear view mean “can’t verify,” not a
              reassuring guess.
            </p>
          </div>
          <div>
            <Leaf size={21} />
            <h3>A result you can actually test.</h3>
            <p>
              You confirm the device works. We don’t turn a photo into a claim
              of a successful repair.
            </p>
          </div>
        </section>
        <footer>
          <span className="footer-brand">repairlens</span>
          <span>Built for things worth keeping.</span>
          <button onClick={exportRecord}>
            <ArrowDownToLine size={13} />
            Export session record
          </button>
          <button
            onClick={() => {
              revision.current++;
              setConfirmed(false);
              setDone([]);
              setOutcome("");
              setPaused(false);
              select(0);
            }}
            disabled={busy}
          >
            Start over
          </button>
        </footer>
      </main>
      {modal && (
        <div className="backdrop" onClick={() => setModal(null)}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={
              modal === "sources" ? "Guide sources" : "About RepairLens"
            }
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              aria-label="Close dialog"
              onClick={() => setModal(null)}
            >
              <X size={19} />
            </button>
            <span className="eyebrow">
              {modal === "sources"
                ? "CHECK THE ORIGINALS"
                : "PROTOTYPE / FIELD GUIDE 001"}
            </span>
            <h2>
              {modal === "sources"
                ? "A guide you can trace."
                : "Repair before replace."}
            </h2>
            {modal === "sources" ? (
              <>
                <p>
                  This walkthrough is an original summary of the sources below.
                  It does not cover internal disassembly or other mouse models.
                  Manufacturer revisions differ.
                </p>
                {sources.map((v) => (
                  <a
                    className="source-card"
                    href={v.url}
                    target="_blank"
                    rel="noreferrer"
                    key={v.id}
                  >
                    <span>
                      {v.kind}
                      <strong>{v.title}</strong>
                    </span>
                    <ExternalLink size={16} />
                  </a>
                ))}
                <small>
                  The iFixit guide is community-contributed. Its photographs are
                  not redistributed here. This project is independent of
                  Logitech and iFixit.
                </small>
              </>
            ) : (
              <>
                <p>
                  RepairLens explores a simple loop: understand the instruction,
                  see the movement, check the visible result, and test the
                  actual device.
                </p>
                <p>
                  The 3D assembly is an authored illustration, not a scan. Muse
                  photo checks are experimental. A real-device repair and expert
                  review have not yet validated this prototype.
                </p>
                <p>
                  Photos are resized in your browser and sent to Meta only when
                  you request a check. Photos are not included in the saved
                  session or exported record.
                </p>
                <p>
                  Supported scope: Logitech M185 external AA battery
                  replacement. The walkthrough is available without API calls.
                </p>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
function PlusIcon() {
  return <span className="upload-plus">+</span>;
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
