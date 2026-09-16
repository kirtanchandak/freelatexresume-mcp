# MCP Server — FreeLatex Resume

The app exposes a built-in MCP server at `/api/mcp`. No separate process needed — it runs inside the same Docker container as the web editor.

## Tools Available

| Tool | What it does |
|------|-------------|
| `read_resume` | Returns the full LaTeX source of your resume |
| `write_resume` | Replaces the entire resume with new LaTeX content |
| `patch_resume` | Replaces a specific piece of text (safer for targeted edits) |

---

## Connect to Antigravity IDE

Add this to your Antigravity MCP settings (Settings → MCP Servers → Edit config):

```json
{
  "mcpServers": {
    "latex-resume": {
      "url": "http://localhost:3005/api/mcp"
    }
  }
}
```

Restart Antigravity. You can now say things like:

> *"Read my resume and add my new role at Google as a Senior Engineer from 2024 to present"*
> *"Rewrite the skills section to emphasize Go, Kubernetes, and distributed systems"*
> *"Fix the formatting of the education section"*

---

## Connect to Claude Desktop

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "latex-resume": {
      "url": "http://localhost:3005/api/mcp"
    }
  }
}
```

---

## How it works

```
Antigravity / Claude Desktop
        │
        │  HTTP (MCP Streamable HTTP transport)
        ▼
http://localhost:3005/api/mcp   ← MCP server (inside Docker)
        │
        │  reads/writes
        ▼
/app/resume.tex  ← mounted as ./resume.tex on your Mac
        │
        │  also used by
        ▼
http://localhost:3005  ← web editor (auto-syncs every 1s)
```

- `resume.tex` is mounted as a Docker volume, so it lives on your Mac at `./resume.tex`
- The web editor auto-saves changes every 1 second
- After the AI edits via MCP, **refresh the browser** to see the updated content in the editor

---

## Start the app

```bash
docker compose up --build
```

Then open **http://localhost:3005** in your browser.
