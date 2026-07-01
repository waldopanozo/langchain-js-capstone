# Test and verification evidence

Companion to `evidence/` artifacts produced by `npm run docker:demo`.

## Reproduce

```bash
npm run docker:demo
```

## Verified run — 2026-06-30

| Field | Value |
|-------|-------|
| Command | `npm run docker:demo` |
| Provider | `local` |
| Chat | `qwen2.5:0.5b` |
| Embeddings | `nomic-embed-text` |
| Ticket | DEV-142 |
| Parent docs | 4 |
| Child chunks | 12 |
| Wall time | ~36 s (models cached) |

## Artifacts

| File | Description |
|------|-------------|
| `evidence/iteration-v1-raw.txt` | Unstructured output (temp 0.7) — shows hallucinations |
| `evidence/iteration-v2-structured.json` | Zod-validated JSON (temp 0.1) |
| `evidence/run-log.txt` | Short iteration summary |

> **Note:** Files under `evidence/` may be owned by `root` if generated inside Docker. Run `sudo chown -R $USER:$USER evidence/` before editing locally.

## v1 issues (documented)

- Invented C# middleware code not in `sample-data/changes.diff`
- Unstructured markdown unsuitable for GitHub PR template

## v2 output (excerpt)

```json
{
  "title": "Add rate limiting to public booking API",
  "summary": "Implement per-IP rate limits on POST /api/bookings and a clear 429 response with Retry-After.",
  "changes": [
    "- POST /api/bookings returns 429 when limit exceeded",
    "- Limit is configurable via environment variable"
  ]
}
```

## Parser fix

First structured run failed with `ZodError` when the 0.5B model returned objects inside arrays. Fixed in `src/chains/structuredOutput.ts` via `coercePrShape()`.

## PDF

```bash
npm run docs:pdf
```

Output: `docs/TDD-PR-Description-RAG.pdf` (~170 KB, ~10 sections, suitable for Moodle upload).
