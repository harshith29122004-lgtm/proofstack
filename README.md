# ProofStack

Evidence-first, local-first document workspace for traceable research and decisions.

ProofStack ingests common office documents, indexes their text into evidence chunks, and retrieves relevant passages with source references. It is designed to help people inspect *why* a result was returned—not to pretend that text similarity proves a claim.

> **Status:** early prototype (v0.1). Use synthetic or non-sensitive documents while evaluating it. See [SECURITY.md](SECURITY.md) before exposing any service or handling confidential material.

## What it does

- Upload up to 5 files per request, 10 MB per file.
- Extract text from PDF, DOCX, XLSX, XLS, CSV, TXT, Markdown, JSON and LOG files.
- Split extracted text into evidence chunks while retaining document and page/sheet/row/section locators where available.
- Retrieve ranked lexical matches with source excerpts and relevance signals, either across the workspace or scoped to a single source.
- Keep an on-disk local workspace with serialized writes and document removal.
- Provide a React + TypeScript interface for querying evidence and managing a searchable source library.
- Inspect indexed passages for each source, including page, sheet, row or section locators, with paginated loading.
- Open a search citation directly in the source inspector, centered on and highlighting the exact retrieved passage.
- Save evidence-query snapshots in the local workspace—including the selected source scope—and export cited passages, source locations, relevance signals and verification notes as Markdown.
- Browse and delete saved reports; report snapshots remain available if the original source document is later removed.

ProofStack does **not** currently provide semantic/vector search, generated answers, claim-entailment verification, contradiction detection, OCR, authentication, multi-user access, or encrypted-at-rest storage. Saved reports are snapshots of extractive retrieval—not independently verified findings. A relevance score is a ranking signal, not a truth or confidence score.

## Quick start

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm install --prefix server
npm install --prefix client
npm run dev
```

Open the Vite URL printed by the client (normally http://localhost:5173). The API listens on http://127.0.0.1:8787 by default.

Useful root commands:

```bash
npm test       # server tests
npm run build  # client type-check and production build
npm start      # start the API only
```

For environment variables and host-binding details, see [server configuration](docs/development.md#configuration).

## Documentation

- [Developer setup and troubleshooting](docs/development.md)
- [Architecture and data flow](docs/architecture.md)
- [API reference and curl examples](docs/api.md)
- [Contribution guide](CONTRIBUTING.md)
- [Security policy and deployment limitations](SECURITY.md)
- [Changelog](CHANGELOG.md)

## Repository layout

```text
client/       React, TypeScript and Vite application
server/       Express API, parsers, workspace persistence and tests
examples/     Synthetic sample documents for local evaluation
docs/         Developer and API documentation
.github/      CI, CodeQL, Dependabot and contribution templates
```

## Evidence and privacy principles

1. Show source passages before presenting conclusions.
2. Keep document processing local by default.
3. Preserve source locators so users can inspect the original material.
4. Make uncertainty and product limitations visible.
5. Never label lexical matching as verified fact.

## Contributing

Bug reports, focused improvements, documentation and tests are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md), then look for issues tagged `good first issue` or `help wanted`. If you are proposing a larger change, open an issue first so scope and expected behavior can be agreed before implementation.

## License

MIT. See [LICENSE](LICENSE).
