"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import LatexEditor from "./LatexEditor";
import PdfPreview from "./PdfPreview";
import { defaultLatexTemplate } from "@/lib/defaultTemplate";

export default function EditorPage() {
  const [latexSource, setLatexSource] = useState(defaultLatexTemplate);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prevPdfUrl = useRef<string | null>(null);

  // Clean up blob URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (prevPdfUrl.current) {
        URL.revokeObjectURL(prevPdfUrl.current);
      }
    };
  }, []);

  const handleCompile = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latex: latexSource }),
      });

      if (!res.ok) {
        const errData = await res.json();
        setError(errData.details || errData.error || "Compilation failed.");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      // Revoke the old URL
      if (prevPdfUrl.current) {
        URL.revokeObjectURL(prevPdfUrl.current);
      }
      prevPdfUrl.current = url;
      setPdfUrl(url);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Network error";
      setError(`Failed to compile: ${message}`);
    } finally {
      setIsLoading(false);
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

  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-zinc-100">
      {/* Toolbar */}
      <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold tracking-tight">
            <span className="text-blue-400">Free</span>LaTeX Resume
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCompile}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
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
        {/* Left Pane: Editor */}
        <div className="flex-1 overflow-hidden">
          <LatexEditor initialValue={latexSource} onChange={setLatexSource} />
        </div>

        {/* Right Pane: PDF Preview */}
        <div className="flex-1 overflow-hidden">
          <PdfPreview pdfUrl={pdfUrl} isLoading={isLoading} error={error} />
        </div>
      </div>
    </div>
  );
}
