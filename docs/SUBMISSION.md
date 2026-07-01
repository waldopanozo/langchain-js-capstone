# Moodle submission guide

**Assignment:** [Capstone Project — LangChain JS](https://moodleop.assuresoft.com/mod/assign/view.php?id=10127)  
**Repository:** https://github.com/waldopanozo/langchain-js-capstone

## Checklist vs assignment brief

| Requirement | Covered? | Where |
|-------------|----------|-------|
| High-value problem + ROI | Yes | TDD §2; ticket DEV-142 |
| Architecture diagram (User → Embedding → Vector Store → LLM → Parser) | Yes | TDD §3.2 |
| LCEL orchestration | Yes | `src/chains/` |
| Advanced optimization (Parent Document Retrieval) | Yes | `src/retrieval/parentDocumentRetriever.ts` |
| Trade-offs, prompt injection, zero-result fallback | Yes | TDD §5, §7 |
| TDD PDF 5–8 pages | Yes | `docs/TDD-PR-Description-RAG.pdf` (7 pages) |
| GitHub repo + README | Yes | This repository |
| Iteration evidence (logs or LangSmith) | Yes | `evidence/iteration-v1-raw.txt`, `iteration-v2-structured.json` |

## What to upload in Moodle

1. **Attach PDF:** `docs/TDD-PR-Description-RAG.pdf`
2. **Optional ZIP:** repo without `node_modules/` (reviewers can clone from GitHub instead)
3. **Comment field** (recommended):

```
GitHub: https://github.com/waldopanozo/langchain-js-capstone
Quick run: npm run docker:demo (Docker + Ollama, no API key)
Evidence: evidence/ folder — v1 hallucinations vs v2 structured JSON
```

## Reproduce before submitting

```bash
git clone https://github.com/waldopanozo/langchain-js-capstone.git
cd langchain-js-capstone
npm run docker:demo
```

## Regenerate PDF after edits

```bash
npm run docs:pdf
```
