import { NextRequest, NextResponse } from "next/server";
import { writeFile, readFile, mkdtemp, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

// Ensure common TeX install locations are on PATH for local dev.
// Node.js server processes don't inherit the user's full shell PATH.
// In production, you'd use a Docker image with TeX Live or a third-party API.
const TEX_PATHS = "/Library/TeX/texbin:/usr/local/texlive/2026/bin/universal-darwin";
process.env.PATH = `${TEX_PATHS}:${process.env.PATH || ""}`;

export async function POST(req: NextRequest) {
  let tempDir: string | null = null;

  try {
    const { latex } = await req.json();

    if (!latex || typeof latex !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'latex' field in request body." },
        { status: 400 }
      );
    }

    // Create a temporary directory for this compilation
    tempDir = await mkdtemp(join(tmpdir(), "latex-"));
    const texPath = join(tempDir, "input.tex");
    const pdfPath = join(tempDir, "input.pdf");

    // Write the LaTeX source to a file
    await writeFile(texPath, latex, "utf-8");

    // Run pdflatex (two passes to resolve references)
    try {
      await execFileAsync("pdflatex", [
        "-interaction=nonstopmode",
        "-halt-on-error",
        "-output-directory",
        tempDir,
        texPath,
      ], { timeout: 30000 });

      // Second pass for references/TOC
      await execFileAsync("pdflatex", [
        "-interaction=nonstopmode",
        "-halt-on-error",
        "-output-directory",
        tempDir,
        texPath,
      ], { timeout: 30000 });
    } catch (compileError: unknown) {
      // Try to read the log file for a better error message
      const logPath = join(tempDir, "input.log");
      let logContent = "";
      try {
        logContent = await readFile(logPath, "utf-8");
      } catch {
        // Log file might not exist
      }

      // Extract the most relevant error lines from the log
      const errorLines = logContent
        .split("\n")
        .filter((line) => line.startsWith("!") || line.startsWith("l."))
        .slice(0, 20)
        .join("\n");

      const stderr = compileError instanceof Error ? compileError.message : "";

      return NextResponse.json(
        {
          error: "LaTeX compilation failed.",
          details: errorLines || stderr || "Unknown compilation error.",
        },
        { status: 400 }
      );
    }

    // Read the generated PDF
    const pdfBuffer = await readFile(pdfPath);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="resume.pdf"',
      },
    });
  } catch (error: unknown) {
    console.error("Compile API error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    // Clean up temp directory
    if (tempDir) {
      rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}
