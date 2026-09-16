"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import PdfPreview from "./PdfPreview";
import { defaultLatexTemplate } from "@/lib/defaultTemplate";

const LatexEditor = dynamic(() => import("./LatexEditor"), { ssr: false });

type SaveState = "saved" | "saving" | "unsaved" | "loading";

interface FileState {
  id: string;
  name: string;
  content: string;
}

// ── Toolbar icon button ───────────────────────────────────────────────────────
function IconBtn({
  title,
  onClick,
  children,
  className = "",
}: {
  title: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100 transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

export default function EditorPage() {
  const isFileSystem = process.env.NEXT_PUBLIC_STORAGE_MODE === "filesystem";

  const [files, setFiles] = useState<FileState[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("loading");
  
  const [zoom, setZoom] = useState(100);
  const [splitPct, setSplitPct] = useState(50);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevPdfUrl = useRef<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoad = useRef(true);

  // Get active content safely
  const activeFile = files.find(f => f.id === activeFileId);
  const latexSource = activeFile?.content || "";

  // ── Load data on mount ────────────────────────────────────────────────────
  useEffect(() => {
    if (isFileSystem) {
      // Local dev mode: load from backend API so MCP server can access it
      fetch("/api/resume")
        .then((r) => r.json())
        .then((d) => { 
          if (d.files && d.files.length > 0) {
            setFiles(d.files);
            setActiveFileId(d.files[0].id);
          } else {
            setFiles([{ id: "1", name: "main.tex", content: d.content ?? "" }]);
            setActiveFileId("1");
          }
          setSaveState("saved"); 
        })
        .catch(() => setSaveState("unsaved"));
    } else {
      // PROD SaaS mode: load from browser localStorage
      const stored = localStorage.getItem("freelatex-files");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.length > 0) {
            setFiles(parsed);
            setActiveFileId(parsed[0].id);
          }
        } catch { /* ignore */ }
      }
      
      // Fallback if empty
      setFiles((prev) => {
        if (prev.length > 0) return prev;
        const init = [{ id: "1", name: "main.tex", content: defaultLatexTemplate }];
        setActiveFileId("1");
        return init;
      });
      setSaveState("saved");
    }
  }, [isFileSystem]);

  // ── Auto-save (debounced 1 s) ─────────────────────────────────────────────
  useEffect(() => {
    if (isFirstLoad.current || files.length === 0) { 
      if (files.length > 0) isFirstLoad.current = false; 
      return; 
    }
    setSaveState("unsaved");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    
    saveTimer.current = setTimeout(async () => {
      setSaveState("saving");
      if (isFileSystem) {
        // Local: save full workspace array to server
        try {
          await fetch("/api/resume", { 
            method: "PUT", 
            headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify({ files }) 
          });
          setSaveState("saved");
        } catch { setSaveState("unsaved"); }
      } else {
        // PROD: save to localStorage
        localStorage.setItem("freelatex-files", JSON.stringify(files));
        setSaveState("saved");
      }
    }, 1000);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [files, isFileSystem]);

  const handleEditorChange = useCallback((newContent: string) => {
    if (!activeFileId) return;
    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content: newContent } : f));
  }, [activeFileId]);

  const addFile = useCallback(() => {
    const newId = Date.now().toString();
    const newFile = { id: newId, name: `file_${files.length + 1}.tex`, content: defaultLatexTemplate };
    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newId);
  }, [files.length]);

  const removeFile = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFiles(prev => {
      const filtered = prev.filter(f => f.id !== id);
      if (activeFileId === id && filtered.length > 0) {
        setActiveFileId(filtered[0].id);
      }
      return filtered;
    });
  }, [activeFileId]);

  // Cleanup blob URLs
  useEffect(() => () => { if (prevPdfUrl.current) URL.revokeObjectURL(prevPdfUrl.current); }, []);

  // ── Compile ───────────────────────────────────────────────────────────────
  const handleCompile = useCallback(async () => {
    setIsCompiling(true); setCompileError(null);
    try {
      const res = await fetch("/api/compile", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ latex: latexSource }) 
      });
      if (!res.ok) { const e = await res.json(); setCompileError(e.details || e.error || "Compilation failed."); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (prevPdfUrl.current) URL.revokeObjectURL(prevPdfUrl.current);
      prevPdfUrl.current = url;
      setPdfUrl(url);
    } catch (err) { setCompileError(err instanceof Error ? err.message : "Network error"); }
    finally { setIsCompiling(false); }
  }, [latexSource]);

  // ── Download ──────────────────────────────────────────────────────────────
  const handleDownload = useCallback(() => {
    if (!pdfUrl) return;
    const a = document.createElement("a"); a.href = pdfUrl; a.download = activeFile?.name.replace(".tex", ".pdf") || "resume.pdf"; a.click();
  }, [pdfUrl, activeFile]);

  // ── Keyboard shortcut Cmd+Enter ───────────────────────────────────────────
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); handleCompile(); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [handleCompile]);

  // ── Divider drag ─────────────────────────────────────────────────────────
  const onDividerMouseDown = useCallback(() => {
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPct(Math.min(Math.max(pct, 20), 80));
    };
    const onUp = () => { isDragging.current = false; document.body.style.cursor = ""; document.body.style.userSelect = ""; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  const saveLabel = { loading: "Loading…", saving: "Saving…", saved: "Saved", unsaved: "Unsaved changes" }[saveState];
  const saveDot = { loading: "bg-zinc-500", saving: "bg-yellow-400", saved: "bg-green-500", unsaved: "bg-orange-400" }[saveState];

  // ── Auto-compile on initial load or tab switch ───────────────────────────
  const lastCompiledFileId = useRef<string | null>(null);
  useEffect(() => {
    if (activeFileId && activeFileId !== lastCompiledFileId.current && latexSource.trim() !== "") {
      lastCompiledFileId.current = activeFileId;
      handleCompile();
    }
  }, [activeFileId, latexSource, handleCompile]);

  return (
    <div className="flex h-screen flex-col bg-[#1a1a2e] text-zinc-100 overflow-hidden">

      {/* ── Top app bar ──────────────────────────────────────────────────── */}
      <header className="flex h-9 shrink-0 items-center gap-3 border-b border-zinc-800 bg-[#1a1a2e] px-3">
        <span className="text-sm font-bold tracking-tight select-none">
          <span className="text-green-400">Free</span>LaTeX
        </span>
        <div className="h-4 w-px bg-zinc-700" />
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${saveDot}`} />
          <span className="text-xs text-zinc-400">{saveLabel} {isFileSystem ? "(Local FS)" : "(Browser LocalStorage)"}</span>
        </div>
      </header>

      {/* ── Main split area ──────────────────────────────────────────────── */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden">

        {/* ══ LEFT: Editor pane ══════════════════════════════════════════ */}
        <div style={{ width: `${splitPct}%` }} className="flex flex-col border-r border-zinc-800 min-w-0">

          {/* File tab bar */}
          <div className="flex h-8 shrink-0 items-center border-b border-zinc-800 bg-[#12121f] px-1 overflow-x-auto">
            {files.map(f => (
              <div 
                key={f.id}
                onClick={() => setActiveFileId(f.id)}
                className={`flex h-full items-center gap-1.5 rounded-t px-3 text-xs cursor-pointer select-none border-t-2 ${
                  activeFileId === f.id 
                    ? "border-t-green-400 bg-[#1e1e35] text-zinc-200" 
                    : "border-t-transparent hover:bg-[#1a1a2e] text-zinc-400"
                }`}
              >
                <svg className="h-3 w-3 text-orange-400" viewBox="0 0 16 16" fill="currentColor"><path d="M9.5 1L14 5.5V15H2V1h7.5zM9 2H3v12h10V6H9V2z"/></svg>
                {f.name}
                {files.length > 1 && (
                  <button onClick={(e) => removeFile(e, f.id)} className="ml-1 text-zinc-500 hover:text-red-400">✕</button>
                )}
              </div>
            ))}
            <button onClick={addFile} className="ml-2 flex h-5 w-5 items-center justify-center rounded text-zinc-400 hover:bg-zinc-700 hover:text-white">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 5v14M5 12h14"/></svg>
            </button>
          </div>

          {/* Editor toolbar */}
          <div className="flex h-8 shrink-0 items-center gap-0.5 border-b border-zinc-800 bg-[#1a1a2e] px-2">
            <IconBtn title="Undo (⌘Z)">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 14L4 9l5-5"/><path d="M4 9h10a5 5 0 010 10h-1"/></svg>
            </IconBtn>
            <IconBtn title="Redo (⌘⇧Z)">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path d="M15 14l5-5-5-5"/><path d="M20 9H10a5 5 0 000 10h1"/></svg>
            </IconBtn>
            <div className="mx-1 h-4 w-px bg-zinc-700" />
            <IconBtn title="Bold"><span className="text-xs font-bold">B</span></IconBtn>
            <IconBtn title="Italic"><span className="text-xs italic">I</span></IconBtn>
            <div className="mx-1 h-4 w-px bg-zinc-700" />
            <IconBtn title="Insert symbol">
              <span className="text-xs font-serif">Ω</span>
            </IconBtn>
            <IconBtn title="Insert link">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
            </IconBtn>
            <div className="mx-1 h-4 w-px bg-zinc-700" />
            <IconBtn title="Find (⌘F)">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            </IconBtn>
          </div>

          {/* CodeMirror editor */}
          <div className="flex-1 overflow-hidden">
            {files.length > 0 && activeFileId ? (
              <LatexEditor key={activeFileId} initialValue={latexSource} onChange={handleEditorChange} />
            ) : (
              <div className="flex h-full items-center justify-center bg-[#1e1e2e]">
                <div className="h-5 w-5 animate-spin rounded-full border-4 border-zinc-700 border-t-green-400" />
              </div>
            )}
          </div>
        </div>

        {/* ── Drag divider with collapse arrows ─────────────────────────── */}
        <div
          onMouseDown={onDividerMouseDown}
          className="relative flex w-2 shrink-0 cursor-col-resize flex-col items-center justify-center bg-zinc-800 hover:bg-zinc-600 transition-colors group"
        >
          <div className="flex flex-col gap-0.5 text-zinc-500 group-hover:text-zinc-300">
            <svg viewBox="0 0 6 10" className="h-3 w-3 rotate-180" fill="currentColor"><path d="M4.5 1L1 5l3.5 4"/></svg>
            <svg viewBox="0 0 6 10" className="h-3 w-3" fill="currentColor"><path d="M4.5 1L1 5l3.5 4"/></svg>
          </div>
        </div>

        {/* ══ RIGHT: PDF pane ════════════════════════════════════════════ */}
        <div style={{ width: `${100 - splitPct}%` }} className="flex flex-col min-w-0 bg-[#f0f0f0]">

          {/* PDF toolbar */}
          <div className="flex h-9 shrink-0 items-center justify-between border-b border-zinc-300 bg-white px-2">
            {/* Left: Recompile */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleCompile}
                disabled={isCompiling || saveState === "loading"}
                className="flex items-center gap-1.5 rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-500 disabled:opacity-50 transition-colors mr-2"
              >
                {isCompiling ? (
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                )}
                {isCompiling ? "Compiling…" : "Recompile"}
              </button>

              {/* Download */}
              <button
                onClick={handleDownload}
                disabled={!pdfUrl}
                title="Download PDF"
                className="flex h-7 w-7 items-center justify-center rounded text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700 disabled:opacity-30 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              </button>
            </div>

            {/* Right: zoom + page nav */}
            <div className="flex items-center gap-1 text-zinc-600">
              <button className="flex h-7 w-7 items-center justify-center rounded hover:bg-zinc-200 transition-colors">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
              </button>
              <button className="flex h-7 w-7 items-center justify-center rounded hover:bg-zinc-200"><svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 15l-6-6-6 6"/></svg></button>
              <button className="flex h-7 w-7 items-center justify-center rounded hover:bg-zinc-200"><svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 9l6 6 6-6"/></svg></button>
              <span className="mx-1 rounded border border-zinc-300 bg-white px-1.5 py-0.5 text-xs">1 / 1</span>
              <div className="mx-1 h-4 w-px bg-zinc-300" />
              <button onClick={() => setZoom(z => Math.max(z - 10, 25))} className="flex h-7 w-7 items-center justify-center rounded hover:bg-zinc-200 text-lg leading-none">−</button>
              <span className="w-10 text-center text-xs">{zoom}%</span>
              <button onClick={() => setZoom(z => Math.min(z + 10, 200))} className="flex h-7 w-7 items-center justify-center rounded hover:bg-zinc-200 text-lg leading-none">+</button>
            </div>
          </div>

          {/* PDF viewer */}
          <div className="flex-1 overflow-auto">
            <PdfPreview pdfUrl={pdfUrl} isLoading={isCompiling} error={compileError} zoom={zoom} />
          </div>
        </div>
      </div>
    </div>
  );
}
