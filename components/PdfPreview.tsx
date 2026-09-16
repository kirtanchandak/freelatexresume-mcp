"use client";

interface PdfPreviewProps {
  pdfUrl: string | null;
  isLoading: boolean;
  error: string | null;
}

export default function PdfPreview({ pdfUrl, isLoading, error }: PdfPreviewProps) {
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-900 rounded-lg border border-zinc-700">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-600 border-t-blue-500" />
          <p className="text-sm text-zinc-400">Compiling LaTeX...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-900 rounded-lg border border-zinc-700 p-6">
        <div className="max-w-full overflow-auto">
          <div className="mb-2 flex items-center gap-2 text-red-400">
            <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold">Compilation Error</span>
          </div>
          <pre className="whitespace-pre-wrap rounded bg-zinc-800 p-4 text-xs text-red-300 font-mono max-h-[60vh] overflow-auto">
            {error}
          </pre>
        </div>
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-900 rounded-lg border border-zinc-700">
        <div className="text-center">
          <svg className="mx-auto h-16 w-16 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="mt-3 text-zinc-400">Click <strong>&quot;Compile PDF&quot;</strong> to preview your resume</p>
          <p className="mt-1 text-xs text-zinc-500">⌘ + Enter</p>
        </div>
      </div>
    );
  }

  return (
    <iframe
      src={pdfUrl}
      className="h-full w-full rounded-lg border border-zinc-700"
      title="PDF Preview"
    />
  );
}
