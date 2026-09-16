import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { defaultLatexTemplate } from "@/lib/defaultTemplate";

export const RESUME_PATH = join(process.cwd(), "resume.tex");
const WORKSPACE_PATH = join(process.cwd(), "workspace.json");

// Seed resume.tex with the default template if it doesn't exist yet
async function ensureResumeExists() {
  try { await readFile(RESUME_PATH); } 
  catch { await writeFile(RESUME_PATH, defaultLatexTemplate, "utf-8"); }
}

export async function GET() {
  try {
    await ensureResumeExists();
    let files: any[] = [];
    
    // 1. Try to load the multi-file workspace
    try {
      const workspaceData = await readFile(WORKSPACE_PATH, "utf-8");
      files = JSON.parse(workspaceData);
    } catch (e) {
      // Doesn't exist yet, that's fine
    }

    // 2. Always read the raw resume.tex to ensure we capture any MCP edits!
    try {
      const resumeContent = await readFile(RESUME_PATH, "utf-8");
      const mainFileIdx = files.findIndex(f => f.id === "1" || f.name === "main.tex");
      if (mainFileIdx >= 0) {
        files[mainFileIdx].content = resumeContent;
      } else {
        files.unshift({ id: "1", name: "main.tex", content: resumeContent });
      }
    } catch (e) {
      // If resume.tex doesn't exist, we just return the workspace files
    }

    return NextResponse.json({ files });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to read resume";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { files } = await req.json();
    
    if (!Array.isArray(files)) {
      return NextResponse.json({ error: "Missing 'files' array field" }, { status: 400 });
    }

    // Save the entire workspace state
    await writeFile(WORKSPACE_PATH, JSON.stringify(files, null, 2), "utf-8");
    
    // Extract main.tex and mirror it to resume.tex for the MCP server to read/write!
    const mainFile = files.find((f: any) => f.id === "1" || f.name === "main.tex");
    if (mainFile) {
      await writeFile(RESUME_PATH, mainFile.content, "utf-8");
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save files";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
