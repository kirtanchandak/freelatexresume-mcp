export function buildSystemPrompt(currentLatex: string): string {
  return `You are an expert LaTeX resume editor. The user has a LaTeX resume they want to modify.

Here is their current resume LaTeX source:

\`\`\`latex
${currentLatex}
\`\`\`

IMPORTANT RULES:
1. When the user asks for edits, respond with a JSON block wrapped in \`\`\`json fences containing an array of find-and-replace operations, followed by a brief friendly summary of what you changed.
2. Each operation has "find" (the exact text to find in the current source) and "replace" (the replacement text).
3. Use the MINIMUM number of edits needed. Never output the entire file.
4. The "find" value must be an EXACT substring of the current LaTeX source (including whitespace).
5. Keep "find" strings long enough to be unique — include surrounding context if needed.

Example response format:

\`\`\`json
[
  {"find": "old text here", "replace": "new text here"},
  {"find": "another old text", "replace": "another new text"}
]
\`\`\`

Updated the email and added a new section.

6. If the user asks a question (not requesting edits), answer normally without any JSON block.
7. If you need to ADD new content, use "find" to locate the line BEFORE or AFTER where you want to insert, and include it in "replace" with the new content added.
8. Keep the resume concise and professional — one page when possible.
9. Ensure all replacements produce valid, compilable LaTeX.`;
}

interface EditOperation {
  find: string;
  replace: string;
}

export function parseEditsFromResponse(content: string): { edits: EditOperation[]; message: string } | null {
  const jsonMatch = content.match(/```json\n([\s\S]*?)```/);
  if (!jsonMatch) return null;

  try {
    const edits = JSON.parse(jsonMatch[1].trim()) as EditOperation[];
    if (!Array.isArray(edits) || edits.length === 0) return null;
    if (!edits.every(e => typeof e.find === "string" && typeof e.replace === "string")) return null;

    // Extract the message part (everything after the JSON block)
    const afterJson = content.slice(content.indexOf("```", content.indexOf("```json") + 7) + 3).trim();
    return { edits, message: afterJson || "Changes applied." };
  } catch {
    return null;
  }
}

export function applyEdits(source: string, edits: EditOperation[]): { result: string; applied: number; failed: string[] } {
  let result = source;
  let applied = 0;
  const failed: string[] = [];

  for (const edit of edits) {
    if (result.includes(edit.find)) {
      result = result.replace(edit.find, edit.replace);
      applied++;
    } else {
      failed.push(edit.find.slice(0, 60) + (edit.find.length > 60 ? "..." : ""));
    }
  }

  return { result, applied, failed };
}

// Keep backward compatibility for old-style full LaTeX responses
export function parseLatexFromResponse(content: string): string | null {
  // Try to extract from ```latex ... ``` code fence
  const latexFenceMatch = content.match(/```latex\n([\s\S]*?)```/);
  if (latexFenceMatch) return latexFenceMatch[1].trim();

  // Try generic code fence (but not json)
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
