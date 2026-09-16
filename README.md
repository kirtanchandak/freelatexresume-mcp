# FreeLaTeX Resume Builder

A modern, fast, and local-first LaTeX resume editor with real-time PDF compilation, designed to work seamlessly with AI tools like Cursor via the Model Context Protocol (MCP).

## ✨ Features

- **No Local Dependencies:** You don't need to install massive TeX Live distributions on your Mac. Everything runs perfectly inside a lightweight Docker container.
- **Real-time Compilation:** Instant PDF rendering as you type using `pdfLaTeX`.
- **Dual-Mode Architecture:** 
  - **Local Mode:** Syncs perfectly to a local `resume.tex` file on your machine, allowing AI agents to edit your resume for you.
  - **SaaS (PROD) Mode:** A multi-file, sandboxed `localStorage` environment safe for public internet deployment.
- **AI Ready (MCP):** Comes with a built-in Server-Sent Events (SSE) MCP server so AI editors like Cursor can natively read and write your LaTeX code.

---

## 🚀 Quickstart

1. **Install Docker** on your machine.
2. Clone this repository.
3. Run the following command:

```bash
docker compose up --build
```

4. Open your browser to [http://localhost:3005](http://localhost:3005).

---

## 🏗️ Architecture & Storage Modes

This application dynamically adapts based on where it is running.

### 1. Local Mode (Filesystem)
By default, the `docker-compose.yml` file contains the `NEXT_PUBLIC_STORAGE_MODE=filesystem` environment variable. 
In this mode:
- The app locks to a single file (`main.tex`).
- Every keystroke automatically saves directly to the `resume.tex` file on your actual hard drive.
- This is required for the MCP server to function.

### 2. PROD Mode (Browser LocalStorage)
If you deploy this app to Vercel, Railway, or comment out the environment variable in `docker-compose.yml`, the app switches to SaaS mode.
In this mode:
- The app uses the user's browser `localStorage`.
- Users are greeted with a dummy "John Doe" template.
- Users get a **Tabs UI** allowing them to create, edit, and delete multiple files (`cover_letter.tex`, etc.).
- Your backend files are never touched.

---

## 🤖 Connecting to Cursor (MCP)

If you want to use Cursor to automatically write and format your LaTeX resume, you can connect the built-in MCP server.

1. Ensure the app is running locally via Docker (Local Mode must be enabled).
2. Open **Cursor Settings** (`Cmd + ,`).
3. Navigate to **Features > MCP**.
4. Click **+ Add New MCP Server**.
5. Configure it as follows:
   - **Name:** `latex-resume`
   - **Type:** `sse`
   - **URL:** `http://localhost:3005/api/mcp`
6. Click **Save**. (You should see a green dot 🟢 appear).

**How to use it:**
Open Cursor Composer (`Cmd + I`) and type: 
> *"Use the latex-resume tools to read my resume, and format my new job at OpenAI into the experience section."*

The AI will pull your code, write the LaTeX, and save it. Your browser will instantly update!
