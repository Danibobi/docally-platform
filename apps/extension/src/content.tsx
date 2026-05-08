import React, {useEffect, useMemo, useState} from "react";
import {createRoot} from "react-dom/client";
import {ChevronLeft, Headphones, RefreshCw, RotateCcw, ShieldCheck, Sparkles, X} from "lucide-react";
import type {AccessibilityMode, TransformResponse} from "@docally/shared";
import {accessibilityModes, modeLabels} from "@docally/shared";
import {extractDocument} from "./lib/extractDocument";
import "./styles.css";

const rootId = "docally-enterprise-root";

type Status = "idle" | "loading" | "success" | "error";

function App() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AccessibilityMode>("autism-adhd");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("Ready to transform this page.");
  const [result, setResult] = useState<TransformResponse | null>(null);

  useEffect(() => {
    chrome.storage.sync.get(["docallyMode"]).then((stored) => {
      const storedMode = stored.docallyMode;
      if (typeof storedMode === "string" && accessibilityModes.includes(storedMode as AccessibilityMode)) {
        setMode(storedMode as AccessibilityMode);
      }
    });

    chrome.runtime.onMessage.addListener((event) => {
      if (event?.type === "DOCALLY_TOGGLE") setOpen((value) => !value);
    });
  }, []);

  const summaryItems = useMemo(() => result?.summary.needToKnow ?? [], [result]);

  async function transform() {
    const documentResult = extractDocument();
    if ("error" in documentResult) {
      setStatus("error");
      setMessage(documentResult.error);
      return;
    }

    setStatus("loading");
    setMessage("Creating a private three-layer summary...");

    const response = await chrome.runtime.sendMessage({
      type: "DOCALLY_TRANSFORM",
      payload: {
        document: documentResult,
        mode,
        simplify: true,
        includeReadingView: true,
      },
    });

    if (!response?.ok) {
      setStatus("error");
      setMessage(response?.error || "DocAlly could not transform this document.");
      return;
    }

    setResult(response.data);
    setStatus("success");
    setMessage(response.data.status === "demo" ? "Demo summary ready. Connect the API provider for live output." : "Summary ready.");
  }

  async function speak() {
    const text = result?.readingView;
    if (!text) {
      setMessage("Transform a page first to prepare audio.");
      return;
    }

    const response = await chrome.runtime.sendMessage({type: "DOCALLY_AUDIO", payload: {text}});
    if (response?.data?.audioBase64) {
      const audio = new Audio(`data:${response.data.mimeType};base64,${response.data.audioBase64}`);
      await audio.play();
      setMessage("Audio narration is playing.");
      return;
    }

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(text.slice(0, 900)));
      setMessage("Browser narration is playing.");
    }
  }

  function changeMode(nextMode: AccessibilityMode) {
    setMode(nextMode);
    chrome.storage.sync.set({docallyMode: nextMode});
  }

  return (
    <>
      <button className="docally-tab" type="button" hidden={open} onClick={() => setOpen(true)} aria-label="Open DocAlly">
        <ChevronLeft aria-hidden="true" size={18} />
        DocAlly
      </button>
      <aside className={`docally-panel ${open ? "is-open" : ""}`} aria-label="DocAlly accessibility panel">
        <header className="docally-header">
          <div>
            <span className="docally-eyebrow">Private accessibility layer</span>
            <h2>DocAlly</h2>
          </div>
          <button className="docally-icon-button" type="button" onClick={() => setOpen(false)} aria-label="Close DocAlly">
            <X aria-hidden="true" size={20} />
          </button>
        </header>

        <section className="docally-section">
          <h3>Profile</h3>
          <div className="docally-mode-list" role="group" aria-label="Accessibility mode">
            {accessibilityModes
              .filter((item) => item !== "custom")
              .map((item) => (
                <button
                  key={item}
                  type="button"
                  className={item === mode ? "is-selected" : ""}
                  onClick={() => changeMode(item)}
                  aria-pressed={item === mode}
                >
                  {modeLabels[item]}
                </button>
              ))}
          </div>
        </section>

        <section className="docally-section docally-status" data-status={status}>
          <div>
            <span>Status</span>
            <p>{message}</p>
          </div>
          <ShieldCheck aria-hidden="true" size={22} />
        </section>

        <div className="docally-actions">
          <button className="docally-primary" type="button" onClick={transform} disabled={status === "loading"}>
            {status === "loading" ? <RefreshCw aria-hidden="true" size={18} /> : <Sparkles aria-hidden="true" size={18} />}
            {status === "loading" ? "Transforming" : "Transform document"}
          </button>
          <button className="docally-secondary" type="button" onClick={speak} disabled={!result}>
            <Headphones aria-hidden="true" size={18} />
            Listen
          </button>
          <button className="docally-secondary" type="button" onClick={() => setResult(null)} disabled={!result}>
            <RotateCcw aria-hidden="true" size={18} />
            Clear
          </button>
        </div>

        {result ? (
          <article className="docally-output">
            <span className="docally-eyebrow">Three-layer summary</span>
            <h3>What is this?</h3>
            <p>{result.summary.whatIsThis}</p>
            <h3>What do I need to know?</h3>
            <ul>
              {summaryItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <h3>What do I need to do?</h3>
            <ul>
              {result.summary.needToDo.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <details>
              <summary>Accessible reading view</summary>
              <pre>{result.readingView}</pre>
            </details>
          </article>
        ) : null}
      </aside>
    </>
  );
}

if (!document.getElementById(rootId)) {
  const mount = document.createElement("div");
  mount.id = rootId;
  document.documentElement.appendChild(mount);
  createRoot(mount).render(<App />);
}
