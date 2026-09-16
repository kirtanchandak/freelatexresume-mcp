"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import PdfPreview from "./PdfPreview";

// Dynamically import editor to avoid SSR issues with CodeMirror
const LatexEditor = dynamic(() => import("./LatexEditor"), { ssr: false });

type SaveState = "saved" | "saving" | "unsaved" | "loading";

export default function EditorPage() {
  const [latexSource, setLatexSource] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("loading");
  const prevPdfUrl = useRef<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoad = useRef(true);

  // Load resume from disk on mount
  useEffect(() => {
    fetch("/api/resume")
      .then((res) => res.json())
      .then((data) => {
        if (data.content) {
          setLatexSource(data.content);
          setSaveState("saved");
        }
      })
      .catch(() => setSaveState("unsaved"));
  }, []);

  // Auto-save to disk whenever latexSource changes (debounced 1s)
  useEffect(() => {
    // Skip the initial load-triggered change
    if (isFirstLoad.current) {
      if (latexSource !== "") isFirstLoad.current = false;
      return;
    }

    setSaveState("unsaved");

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaveState("saving");
      try {
        await fetch("/api/resume", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: latexSource }),
        });
        setSaveState("saved");
      } catch {
        setSaveState("unsaved");
      }
    }, 1000);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [latexSource]);

  // Clean up blob URLs
  useEffect(() => {
    return () => {
      if (prevPdfUrl.current) URL.revokeObjectURL(prevPdfUrl.current);
    };
  }, []);

  const handleCompile = useCallback(async () => {
    setIsCompiling(true);
    setCompileError(null);
    try {
      const res = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latex: latexSource }),
      });

      if (!res.ok) {
        const errData = await res.json();
        setCompileError(errData.details || errData.error || "Compilation failed.");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (prevPdfUrl.current) URL.revokeObjectURL(prevPdfUrl.current);
      prevPdfUrl.current = url;
      setPdfUrl(url);
    } catch (err) {
      setCompileError(err instanceof Error ? err.message : "Network error");
    } finally {
      setIsCompiling(false);
    }
  }, [latexSource]);

  const handleDownload = useCallback(() => {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = "resume.pdf";
    a.click();
  }, [pdfUrl]);

  // Keyboard shortcut: Cmd/Ctrl + Enter to compile
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleCompile();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleCompile]);

  const saveIndicator = {
    loading: <span className="text-xs text-zinc-500">Loading...</span>,
    saving: <span className="text-xs text-yellow-400">Saving...</span>,
    saved: <span className="text-xs text-green-500">✓ Saved</span>,
    unsaved: <span className="text-xs text-zinc-500">Unsaved</span>,
  }[saveState];

  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-zinc-100">
      {/* Toolbar */}
      <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold tracking-tight">
            <span className="text-blue-400">Free</span>LaTeX Resume
          </h1>
          {saveIndicator}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCompile}
            disabled={isCompiling || saveState === "loading"}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCompiling ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Compiling...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Compile PDF
              </>
            )}
          </button>
          {pdfUrl && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 rounded-md border border-zinc-600 px-4 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF
            </button>
          )}
        </div>
      </header>

      {/* Split View */}
      <div className="flex flex-1 gap-1 overflow-hidden p-2">
        <div className="flex-1 overflow-hidden">
          {latexSource !== "" || saveState !== "loading" ? (
            <LatexEditor initialValue={latexSource} onChange={setLatexSource} />
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-zinc-600 border-t-blue-500" />
            </div>
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          <PdfPreview pdfUrl={pdfUrl} isLoading={isCompiling} error={compileError} />
        </div>
      </div>
    </div>
  );
}
