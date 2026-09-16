import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { defaultLatexTemplate } from "@/lib/defaultTemplate";

export const RESUME_PATH = join(process.cwd(), "resume.tex");

// Seed resume.tex with the default template if it doesn't exist yet
async function ensureResumeExists() {
  if (!existsSync(RESUME_PATH)) {
    await writeFile(RESUME_PATH, defaultLatexTemplate, "utf-8");
  }
}

export async function GET() {
  try {
    await ensureResumeExists();
    const content = await readFile(RESUME_PATH, "utf-8");
    return NextResponse.json({ content });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to read resume";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { content } = await req.json();
    if (typeof content !== "string") {
      return NextResponse.json({ error: "Missing 'content' string field" }, { status: 400 });
    }
    await writeFile(RESUME_PATH, content, "utf-8");
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save resume";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
