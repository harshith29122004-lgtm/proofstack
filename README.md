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
- Export the complete local workspace—including sources, extracted evidence and saved reports—to a versioned JSON backup, then restore it with validation.

Original uploaded file bytes are processed in memory and are not retained; ProofStack persists document metadata, extracted text, evidence chunks and saved reports in the local workspace.

ProofStack does **not** currently provide semantic/vector search, generated answers, claim-entailment verification, contradiction detection, OCR, authentication, multi-user access, or encrypted-at-rest storage. Saved reports are snapshots of extractive retrieval—not independently verified findings. A relevance score is a ranking signal, not a truth or confidence score.

## Quick start

### Docker Compose (recommended for a local demo)

Requirements: Docker Engine with the Compose plugin.

```bash
docker compose up --build
```

Open http://localhost:8080. The web UI is published only on loopback; the API remains internal to the Compose network and is reached through the web proxy. Workspace data persists in the named `proofstack-data` volume. Stop the stack with `docker compose down` (use `docker compose down -v` only if you intentionally want to delete the workspace volume).

### Node.js development

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
npm test       # server API and parser tests
npm run test:client # React component tests
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
client/       React, TypeScript, Vite, nginx configuration and Dockerfile
server/       Express API, parsers, workspace persistence, tests and Dockerfile
examples/     Synthetic sample documents for local evaluation
docs/         Developer and API documentation
.github/      CI, CodeQL, Dependabot and contribution templates
docker-compose.yml  Local-only web/API deployment with a persistent data volume
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
