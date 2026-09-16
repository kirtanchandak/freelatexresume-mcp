"use client";

import { useEffect, useRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";

interface LatexEditorProps {
  initialValue: string;
  onChange: (value: string) => void;
}

export default function LatexEditor({ initialValue, onChange }: LatexEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      doc: initialValue,
      extensions: [
        basicSetup,
        oneDark,
        keymap.of([indentWithTab]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }
        }),
        EditorView.theme({
          "&": {
            height: "100%",
            fontSize: "13px",
            backgroundColor: "#1e1e2e",
          },
          ".cm-scroller": {
            overflow: "auto",
            fontFamily: "var(--font-geist-mono), 'Fira Code', 'Cascadia Code', monospace",
          },
          ".cm-gutters": {
            backgroundColor: "#181825",
            borderRight: "1px solid #313244",
            color: "#585b70",
          },
          ".cm-activeLineGutter": {
            backgroundColor: "#313244",
          },
          ".cm-activeLine": {
            backgroundColor: "#2a2a3d",
          },
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={editorRef}
      className="h-full w-full overflow-hidden rounded-lg border border-zinc-700"
    />
  );
}
