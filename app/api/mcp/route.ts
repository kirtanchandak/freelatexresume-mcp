import { NextRequest } from "next/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { defaultLatexTemplate } from "@/lib/defaultTemplate";

const RESUME_PATH = join(process.cwd(), "resume.tex");

async function ensureResumeExists() {
  if (!existsSync(RESUME_PATH)) {
    await writeFile(RESUME_PATH, defaultLatexTemplate, "utf-8");
  }
}

// Build a fresh MCP server instance per request (stateless mode)
function buildMcpServer(): McpServer {
  const server = new McpServer({
    name: "latex-resume",
    version: "1.0.0",
  });

  // Tool 1: Read the full resume
  server.tool(
    "read_resume",
    "Read the full LaTeX source of the resume file",
    {},
    async () => {
      await ensureResumeExists();
      const content = await readFile(RESUME_PATH, "utf-8");
      return {
        content: [{ type: "text" as const, text: content }],
      };
    }
  );

  // Tool 2: Overwrite the entire resume
  server.tool(
    "write_resume",
    "Overwrite the entire resume with new LaTeX content. Use this when making large structural changes.",
    {
      content: z
        .string()
        .describe("The complete, valid LaTeX source for the resume"),
    },
    async ({ content }) => {
      await writeFile(RESUME_PATH, content, "utf-8");
      return {
        content: [
          {
            type: "text" as const,
            text: "Resume saved successfully. Refresh the browser to see changes.",
          },
        ],
      };
    }
  );

  // Tool 3: Patch a specific section (safer for targeted edits)
  server.tool(
    "patch_resume",
    "Replace a specific piece of text in the resume. Safer than write_resume for targeted edits (e.g. updating one job, fixing a line).",
    {
      search: z
        .string()
        .describe("The exact text to find in the resume (must match exactly, including whitespace)"),
      replace: z
        .string()
        .describe("The new text to replace it with"),
    },
    async ({ search, replace }) => {
      await ensureResumeExists();
      const content = await readFile(RESUME_PATH, "utf-8");
      if (!content.includes(search)) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: Could not find the following text in the resume:\n\n"${search}"\n\nUse read_resume to see the current content.`,
            },
          ],
          isError: true,
        };
      }
      const updated = content.replace(search, replace);
      await writeFile(RESUME_PATH, updated, "utf-8");
      return {
        content: [
          {
            type: "text" as const,
            text: "Patch applied successfully. Refresh the browser to see changes.",
          },
        ],
      };
    }
  );

  return server;
}

// Single handler for all MCP requests (GET for SSE, POST for JSON-RPC)
async function handler(req: NextRequest): Promise<Response> {
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless — no session management needed
  });
  const server = buildMcpServer();
  await server.connect(transport);
  return transport.handleRequest(req);
}

export const GET = handler;
export const POST = handler;
export const DELETE = handler;
