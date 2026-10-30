# ProofStack

Evidence-first, local-first document workspace for traceable decisions.

ProofStack ingests common office documents, indexes text into evidence units, and retrieves relevant passages with source references. It intentionally does not pretend a text match proves a claim or fabricate an AI answer.

## Features in v0.1
- Multi-file upload (15 MB/file; up to 12 files per request)
- PDF, DOCX, XLSX, XLS, CSV, TXT, Markdown, JSON and LOG extraction
- Chunked evidence indexing with source document and page/sheet/row/section locators
- Ranked lexical retrieval with source excerpts and relevance ranking
- Local JSON persistence, document removal, API health and overview endpoints
- Responsive React/TypeScript interface

## Architecture
React + TypeScript + Vite (5173) -> Express API (8787) -> document parsers -> chunking and lexical retrieval -> local JSON store at server/data/workspace.json.

## Run locally
Requirements: Node.js 20+ and npm.

```bash
npm install
npm install --prefix server
npm install --prefix client
npm run dev
```
Open http://localhost:5173. API: http://localhost:8787.

```bash
npm test
npm run build
```

## API
| Method | Endpoint | Purpose |
|---|---|---|
| GET | /api/health | API health and index counts |
| GET | /api/documents | List indexed documents |
| POST | /api/documents | Upload files as multipart field files |
| DELETE | /api/documents/:id | Remove document and evidence |
| POST | /api/query | Retrieve evidence for { "question": "..." } |
| GET | /api/overview | Workspace counts and storage mode |

## Honest limitations
This is an early prototype. It does not yet include semantic/vector search, generated answers, claim entailment verification, robust contradiction detection, OCR, authentication, encryption-at-rest, multi-user access, audit export, production database migrations, or hardened upload sandboxing. Relevance is a ranking signal, not a confidence score. Keep it local and do not expose the API to the public internet or upload confidential documents to a shared machine.

## Principles
1. Evidence before eloquence.
2. Visible limitations and uncertainty.
3. Local-first privacy.
4. Replaceable parser, retrieval, persistence and UI components.
5. No fake verification.

## Roadmap
- [ ] Parser/API integration and browser end-to-end tests
- [ ] Deterministic source locators and source hashes
- [ ] OCR for scanned documents
- [ ] Hybrid BM25 + embedding retrieval
- [ ] Contradiction candidates with side-by-side citations
- [ ] Decision briefs and exportable evidence ledger
- [ ] Optional local model adapter with explicit user opt-in
- [ ] SQLite/PostgreSQL, migrations, authentication and deployment hardening

Synthetic sample documents are in examples/. MIT licensed.
