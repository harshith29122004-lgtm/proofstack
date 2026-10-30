# ProofStack

**Evidence intelligence for documents and decisions.**

ProofStack is an open-source workspace for turning scattered documents into traceable, searchable evidence. It is designed to help developers, researchers, students, and small teams verify information before acting on it.

## Why ProofStack?

AI summaries are useful, but a decision is only as trustworthy as the evidence behind it. ProofStack focuses on source traceability: answers should lead back to the original document and matching passage.

## Current scope

- Upload and index PDF, DOCX, XLSX, CSV, and text documents.
- Search across a workspace and inspect matching excerpts.
- Keep source references alongside retrieved evidence.
- Organize documents and sample project material.
- Run a local development workspace.

## Technology

- React + TypeScript + Vite
- Node.js + Express
- Document parsing and evidence retrieval
- Local-first development configuration

## Development

Requirements: Node.js 20 or newer.

```bash
npm install
npm install --prefix server
npm install --prefix client
npm run dev
```

Open http://localhost:5173.

Run backend tests:

```bash
npm test --prefix server
```

## Project status

This is an early prototype, not a production-ready evidence verification system. Current retrieval is based on indexed source text. Semantic search, robust contradiction detection, OCR, authentication, multi-user collaboration, and production database support remain planned work.

## Design principles

1. **Traceability first:** show where evidence came from.
2. **No fabricated citations:** do not claim a source supports something it does not contain.
3. **Local-first:** keep the initial workflow usable without sending documents to a hosted AI provider.
4. **Explicit uncertainty:** distinguish supported, conflicting, and missing evidence.
5. **Reproducibility:** preserve the source material and the path from question to evidence.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT.
