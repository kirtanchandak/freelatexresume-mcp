export function buildSystemPrompt(currentLatex: string): string {
  return `You are an expert LaTeX resume editor. The user has a LaTeX resume they want to modify.

Here is their current resume LaTeX source:

\`\`\`latex
${currentLatex}
\`\`\`

Rules:
1. When the user asks for changes, return the COMPLETE updated LaTeX source wrapped in a \`\`\`latex code fence.
2. Only return the LaTeX code block — no explanations before or after unless the user asks a question.
3. Preserve all existing formatting, packages, and structure unless asked to change them.
4. Ensure the output is valid, compilable LaTeX.
5. If the user asks a question (not requesting edits), answer normally without a code block.
6. Keep the resume concise and professional — one page when possible.`;
}

export function parseLatexFromResponse(content: string): string | null {
  // Try to extract from ```latex ... ``` code fence
  const latexFenceMatch = content.match(/```latex\n([\s\S]*?)```/);
  if (latexFenceMatch) return latexFenceMatch[1].trim();

  // Try generic code fence
  const genericFenceMatch = content.match(/```\n([\s\S]*?)```/);
  if (genericFenceMatch) {
    const inner = genericFenceMatch[1].trim();
    if (inner.includes("\\documentclass") || inner.includes("\\begin{document}")) {
      return inner;
    }
  }

  // Check if the entire response looks like LaTeX
  const trimmed = content.trim();
  if (trimmed.startsWith("\\documentclass") || trimmed.startsWith("%")) {
    if (trimmed.includes("\\begin{document}") && trimmed.includes("\\end{document}")) {
      return trimmed;
    }
  }

  return null;
}
