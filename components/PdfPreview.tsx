"use client";

interface PdfPreviewProps {
  pdfUrl: string | null;
  isLoading: boolean;
  error: string | null;
  zoom?: number;
}

export default function PdfPreview({ pdfUrl, isLoading, error, zoom = 100 }: PdfPreviewProps) {
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#f0f0f0]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-green-500" />
          <p className="text-sm text-zinc-500">Compiling…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-start justify-center bg-[#f0f0f0] p-6">
        <div className="w-full max-w-2xl rounded-lg border border-red-200 bg-white shadow">
          <div className="flex items-center gap-2 rounded-t-lg border-b border-red-200 bg-red-50 px-4 py-2">
            <svg className="h-4 w-4 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-semibold text-red-700">Compilation Error</span>
          </div>
          <pre className="max-h-[70vh] overflow-auto p-4 text-xs text-red-800 font-mono whitespace-pre-wrap">
            {error}
          </pre>
        </div>
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-[#f0f0f0] text-zinc-400">
        <svg className="h-16 w-16 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm">Click <strong className="text-zinc-600">Recompile</strong> to preview your resume</p>
        <p className="text-xs text-zinc-400">⌘ + Enter</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-full items-start justify-center bg-[#f0f0f0] py-6">
      <iframe
        src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
        title="PDF Preview"
        style={{ width: `${zoom}%`, minHeight: "100vh" }}
        className="shadow-xl rounded bg-white border border-zinc-300"
      />
    </div>
  );
}
