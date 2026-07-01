# LangChain JS Capstone — PR Description RAG

RAG-based assistant that drafts **pull request descriptions** from a Jira-style ticket and a git diff. Built for the AssureSoft Moodle assignment *Strategic Blueprint: From Prototype to Production-Ready LLM Features*.

## Problem & ROI

Engineers spend 10–20 minutes per PR writing context for reviewers. This prototype automates the first draft by retrieving the most relevant diff hunks (not the whole patch) and mapping acceptance criteria to code changes.

**Local mode (default):** zero API cost — runs on **Ollama** with tiny models in Docker.  
**Cloud mode (optional):** OpenAI for higher quality.

## Architecture

```
User (CLI) → Ticket + Diff ingest
           → Embeddings (Ollama nomic-embed-text | OpenAI)
           → Child chunks in MemoryVectorStore
           → Parent Document Retrieval
           → LCEL: Prompt → LLM → Zod structured output
           → PR JSON
```

See [docs/architecture.md](docs/architecture.md) for the full TDD outline.

## Quick start — Docker (recommended, 100% local)

Requires Docker + Docker Compose. No API keys.

```bash
cd portfolio/langchain-js-capstone
npm run docker:demo
```

This will:

1. Start **Ollama** in Docker (`docker compose up -d ollama`)
2. Pull tiny models if missing (`qwen2.5:0.5b` + `nomic-embed-text`)
3. Build and run the app container → writes `evidence/*`

Other Docker commands:

```bash
npm run docker:up      # Ollama only (background)
npm run docker:build   # Build app image
npm run docker:down    # Stop containers
```

## Local without Docker app container

Ollama in Docker, Node on host:

```bash
cp .env.example .env
npm install
npm run docker:up
./scripts/wait-for-ollama.sh   # pulls models into Ollama
npm run demo
```

## Optional — OpenAI cloud

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

## Models (local / Docker)

| Role | Model | Size (approx.) |
|------|-------|----------------|
| Chat | `qwen2.5:0.5b` | ~400 MB |
| Embeddings | `nomic-embed-text` | ~270 MB |

Override via `.env`:

```env
OLLAMA_CHAT_MODEL=qwen2.5:0.5b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
OLLAMA_BASE_URL=http://localhost:11434
```

## Run commands

```bash
npm run demo      # v1 vs v2 iteration + evidence/
npm run generate  # structured JSON only
npm run ingest    # index stats only
```

## Stack

| Layer | Local (default) | Cloud (optional) |
|-------|-----------------|------------------|
| Orchestration | LCEL | LCEL |
| LLM | Ollama `qwen2.5:0.5b` | `gpt-4o-mini` |
| Embeddings | Ollama `nomic-embed-text` | `text-embedding-3-small` |
| Vector store | `MemoryVectorStore` | same |
| Optimization | Parent Document Retrieval | same |
| Output | Zod (+ JSON fallback for tiny models) | native structured output |

## Moodle deliverables checklist

- [ ] PDF technical design from `docs/architecture.md`
- [ ] Repo or ZIP (include `docker-compose.yml`)
- [ ] Screenshots / `evidence/` from `npm run docker:demo`
- [ ] Upload to [Capstone Project](https://moodleop.assuresoft.com/mod/assign/view.php?id=10127)
