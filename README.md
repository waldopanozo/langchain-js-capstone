# LangChain JS Capstone — PR Description RAG

RAG-based assistant that drafts **pull request descriptions** from a Jira-style ticket and a git diff.

**Course:** AssureSoft Moodle — *Strategic Blueprint: From Prototype to Production-Ready LLM Features*  
**Deliverables:** [Technical Design PDF](docs/TDD-PR-Description-RAG.pdf) · [Full TDD (Markdown)](docs/TDD.md) · [Test evidence](docs/TEST-EVIDENCE.md) · [Demo artifacts](evidence/)

---

## Problem and ROI

Engineers spend 10–20 minutes per PR writing reviewer context. This prototype:

1. Ingests a **ticket** (JSON) and a **git diff**
2. Retrieves relevant diff hunks via **Parent Document Retrieval**
3. Generates a **structured PR description** (title, summary, changes, test plan, risks)

| Mode | Cost | When to use |
|------|------|-------------|
| **Local (default)** | $0 | Docker + Ollama — no API keys |
| **Cloud (optional)** | ~$0.03–0.06/call | `LLM_PROVIDER=openai` for higher quality |

---

## Architecture

```
CLI → Ticket + Diff
    → Parent docs (per file) → Child chunks → Embeddings
    → MemoryVectorStore → Parent Document Retriever
    → LCEL (Prompt → LLM → Zod JSON)
    → PR description
```

Details: [docs/TDD.md](docs/TDD.md) · [docs/architecture.md](docs/architecture.md)

---

## Quick start (Docker — recommended)

**Requirements:** Docker, Docker Compose, ~2 GB disk for models.

```bash
cd portfolio/langchain-js-capstone
npm run docker:demo
```

This command:

1. Starts Ollama (`docker compose up -d ollama`)
2. Pulls `qwen2.5:0.5b` + `nomic-embed-text` if missing
3. Builds the app image and runs `npm run demo`
4. Writes proof artifacts to `evidence/`

### Other Docker commands

| Command | Action |
|---------|--------|
| `npm run docker:up` | Start Ollama only |
| `npm run docker:build` | Build app image |
| `npm run docker:down` | Stop containers |
| `npm run docs:pdf` | Generate TDD PDF |

---

## Local run (Ollama in Docker, Node on host)

```bash
cp .env.example .env
npm install
npm run docker:up
./scripts/wait-for-ollama.sh
npm run demo
```

---

## CLI commands

| Command | Description |
|---------|-------------|
| `npm run demo` | Run v1 + v2 iteration; save `evidence/*` |
| `npm run generate` | Output structured JSON to stdout |
| `npm run ingest` | Build in-memory index; print stats |

---

## Verified test run (June 30, 2026)

Executed with **`npm run docker:demo`** — fully local, no OpenAI key.

### Environment

| Item | Value |
|------|-------|
| Provider | `local` |
| Chat model | `qwen2.5:0.5b` (Ollama) |
| Embedding model | `nomic-embed-text` |
| Ticket | `DEV-142` — rate limiting on booking API |
| Index | 4 parent docs, 12 child chunks |
| Duration | ~36 s (models already pulled) |

### Console output (summary)

```
Provider: local | chat: qwen2.5:0.5b | embeddings: nomic-embed-text
Indexed 4 parent docs (12 child chunks for retrieval).
--- Iteration 1 (generic prompt, high temperature) ---
Saved: evidence/iteration-v1-raw.txt
--- Iteration 2 (structured output + injection guard) ---
Saved: evidence/iteration-v2-structured.json
Run log: evidence/run-log.txt
```

### Iteration v1 — issues found

Free-form markdown at temperature 0.7. The tiny model **hallucinated code** not present in the diff (invented middleware structure, wrong configuration API).

See: [evidence/iteration-v1-raw.txt](evidence/iteration-v1-raw.txt)

### Iteration v2 — improvements

Structured JSON with Zod validation, temperature 0.1, prompt-injection guard, and `coercePrShape()` for messy local-model JSON.

**Sample output** (`evidence/iteration-v2-structured.json`):

```json
{
  "title": "Add rate limiting to public booking API",
  "summary": "Implement per-IP rate limits on POST /api/bookings and a clear 429 response with Retry-After.",
  "changes": [
    "- POST /api/bookings returns 429 when limit exceeded",
    "- Limit is configurable via environment variable"
  ],
  "testPlan": [
    "POST /api/bookings returns 429 when limit exceeded",
    "Limit is configurable via environment variable"
  ],
  "risks": [
    "Parent can spam the booking endpoint during peak registration..."
  ]
}
```

**What improved:** correct title/summary, mentions 429 and Retry-After, no invented C# blocks.

**Known limits (0.5B model):** incomplete AC coverage; `ticketMapping` format still weak — acceptable for prototype evidence.

### Engineering fix during testing

First v2 run failed with `ZodError` (model returned objects inside arrays). Fixed in `src/chains/structuredOutput.ts` with `coercePrShape()` — documented in TDD §6.4.

---

## Project structure

```
langchain-js-capstone/
├── docker-compose.yml      # Ollama service
├── Dockerfile              # App + wait-for-ollama entrypoint
├── sample-data/
│   ├── ticket.json         # Jira-style input
│   └── changes.diff        # Unified diff input
├── src/
│   ├── config.ts           # local | openai provider
│   ├── ingest/
│   ├── retrieval/          # Parent Document Retrieval
│   └── chains/             # LCEL + structured output
├── evidence/               # Demo artifacts (for Moodle)
└── docs/
    ├── TDD.md
    └── TDD-PR-Description-RAG.pdf
```

---

## Stack

| Layer | Local (default) | Cloud (optional) |
|-------|-----------------|------------------|
| Orchestration | LCEL | LCEL |
| LLM | Ollama `qwen2.5:0.5b` | `gpt-4o-mini` |
| Embeddings | Ollama `nomic-embed-text` | `text-embedding-3-small` |
| Vector store | `MemoryVectorStore` | same |
| Optimization | Parent Document Retrieval | same |
| Output | Zod + JSON coercion | native structured output |
| Deploy | Docker Compose | same |

---

## Configuration (`.env`)

```env
# Default — local, no API key
LLM_PROVIDER=local
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_CHAT_MODEL=qwen2.5:0.5b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text

# Optional cloud
# LLM_PROVIDER=openai
# OPENAI_API_KEY=sk-...

# Optional LangSmith traces
# LANGCHAIN_TRACING_V2=true
# LANGCHAIN_API_KEY=lsv2_...
```

---

## Moodle submission checklist

| Item | Status | Location |
|------|--------|----------|
| Technical Design Document (PDF 5–8 pages) | Ready | `docs/TDD-PR-Description-RAG.pdf` |
| Repository / ZIP | Ready | This folder |
| README with run instructions | Ready | `README.md` |
| Evaluation evidence | Ready | `evidence/` + [docs/TEST-EVIDENCE.md](docs/TEST-EVIDENCE.md) |
| Upload | Pending | [Moodle Capstone](https://moodleop.assuresoft.com/mod/assign/view.php?id=10127) |

---

## Optional — OpenAI

Set `LLM_PROVIDER=openai` and `OPENAI_API_KEY` in `.env` for higher-quality structured output without JSON coercion.
