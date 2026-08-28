# usememoire

> ⚠️ **This project is currently in active development (v0.1.0-alpha). APIs, config formats and behaviours may change without notice.**

**usememoire** is an open-source, 100% local persistent memory layer for LLMs, built on the [Model Context Protocol (MCP)](https://modelcontextprotocol.io). It acts as a universal memory passport across Claude Desktop, Cursor, and any other MCP-compatible client — no cloud, no lock-in, no re-explaining context ever again.

---

## The Problem

Every time you start a new chat, your LLM forgets everything. You re-explain your stack, your conventions, your architectural decisions — over and over. This wastes tokens and time.

**usememoire** solves this by persisting the facts that matter, locally on your machine, and injecting only the relevant ones when you need them.

---

## How It Works

usememoire runs as a local MCP server in the background. It exposes tools that Claude (or any MCP-compatible LLM client) can call to save and retrieve facts from a local SQLite database.

```
You write a message
        │
        ▼
Claude calls search_memory() → retrieves relevant context from DB
        │
        ▼
Claude responds with full context — no re-explaining needed
        │
        ▼
You or Claude calls save_memory() → new fact persisted locally
```

---

## Features

- 🏠 **100% local** — your memory lives in a `.db` file on your machine
- 🔌 **MCP native** — works out of the box with Claude Desktop, Cursor, Zed and any MCP client
- 🔍 **FTS5 full-text search** — fast, accurate keyword search via SQLite
- 🧠 **Two extraction modes** — MANUAL (explicit saves) or AUTO (LLM-assisted background extraction)
- 🖥️ **Local dashboard** — view, search and delete memories at `http://localhost:5173` (dev) or `http://localhost:3761` (prod)
- 💸 **Token savings** — inject 20 tokens of context instead of re-explaining 500

---

## Quick Start

### Prerequisites

- Node.js 22+
- An MCP-compatible client (Claude Desktop, Cursor, etc.)

### Install

```bash
git clone https://github.com/yourusername/usememoire.git
cd usememoire

# Install server dependencies
npm install

# Install UI dependencies
cd ui && npm install && cd ..
```

### Run

You need two terminals running simultaneously:

**Terminal 1 — MCP Server:**
```bash
npm run dev
```

**Terminal 2 — UI (optional, for dashboard):**
```bash
npm run dev:ui
```

Dashboard available at `http://localhost:5173`

---

### Configure Claude Desktop

Find your config file:

- **Windows (Store)**: `C:\Users\<you>\AppData\Local\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Roaming\Claude\claude_desktop_config.json`
- **Windows (Direct)**: `C:\Users\<you>\AppData\Roaming\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

Add the `mcpServers` block — be careful not to overwrite existing keys:

```json
{
  "mcpServers": {
    "usememoire": {
      "command": "npx",
      "args": [
        "tsx",
        "C:\\Users\\<you>\\usememoire\\src\\server.ts"
      ],
      "cwd": "C:\\Users\\<you>\\usememoire"
    }
  }
}
```

> ⚠️ Replace `<you>` with your actual Windows username. On macOS use forward slashes.

Restart Claude Desktop completely — usememoire should appear under **Connectors**.

---

## Usage

### Save a memory explicitly

Ask Claude directly:
```
Use the save_memory tool to save: "we use JWT in HTTP-only cookies"
```

Or use the tag anywhere in your message:
```
We decided to use Inertia.js for all forms [SAVE_MEMORY]
```

### Search memory

```
Use search_memory to find anything about our auth setup
```

### Dashboard

Open `http://localhost:5173` in your browser to view, search and delete saved memories.

---

## Modes

Configure via `~/.usememoire/config.json`:

```json
{
  "mode": "manual",
  "ui_port": 3761
}
```

| Mode | Description |
|------|-------------|
| `manual` | Only saves via explicit `save_memory` tool call or `[SAVE_MEMORY]` tag |
| `auto` | Also uses an LLM to extract facts automatically after each exchange |

For `auto` mode, add your OpenAI key:

```json
{
  "mode": "auto",
  "openai_api_key": "sk-..."
}
```

---

## MCP Tools

| Tool | Description |
|------|-------------|
| `save_memory` | Save a fact with a category tag |
| `search_memory` | Full-text search across all saved memories |
| `process_message` | Pipeline: tag → regex → LLM extraction |
| `list_memories` | List all saved memories |

---

## Project Structure

```
usememoire/
├── src/                  # MCP server (TypeScript)
│   ├── db/               # SQLite schema and queries
│   ├── extractor/        # Regex and LLM fact extractors
│   ├── ui/               # Express HTTP server for dashboard
│   │   └── dist/         # Built Vue app (generated)
│   ├── config.ts
│   └── server.ts         # MCP server entry point
├── ui/                   # Dashboard source (Vue 3 + Vite)
│   └── src/
│       └── App.vue
├── .gitignore
├── package.json
└── README.md
```

---

## Roadmap

- [ ] Vector search via `sqlite-vec` (semantic retrieval)
- [ ] TTL and conflict resolution for stale facts
- [ ] CLI tool (`mem ls`, `mem rm`, `mem search`)
- [ ] npx one-liner distribution
- [ ] Multi-provider AUTO mode (Anthropic, Ollama)
- [ ] Browser extension

---

## Contributing

This project is in early alpha. Issues and PRs are welcome.

Please use the following labels when opening issues:

| Label | Scope |
|-------|-------|
| `bug` | Something is broken |
| `enhancement` | New feature or improvement |
| `core` | DB, MCP server, memory engine |
| `extractor` | Fact extraction pipeline |
| `ui` | Local dashboard |
| `dx` | Setup, docs, developer experience |
| `documentation` | Docs only |

---

## License

MIT

---

*usememoire — say it once, remember it forever.*