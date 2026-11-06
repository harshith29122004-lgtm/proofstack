# Architecture

This document describes the current v0.1 implementation, not a promise that every planned capability already exists.

## High-level flow

```text
Browser (React + TypeScript + Vite)
              |
              | HTTP / JSON + multipart upload
              v
       Express API (Node.js)
              |
       +------+-------------------+
       |                          |
       v                          v
 File parsers                 Workspace store
 PDF / DOCX / XLSX            data/workspace.json
 XLS / CSV / TXT              serialized writes
 MD / JSON / LOG
       |
       v
 Extracted text + source locators
       |
       v
 Chunking and lexical indexing
       |
       v
 Ranked evidence passages
       |
       v
 Browser displays excerpts and source references
```

## Main components

### Client

The client is a Vite-powered React and TypeScript application. The main workspace interface lives in `client/src/App.tsx`; shared presentation rules are in `client/src/styles.css`. It calls the local Express API and renders documents, workspace status and retrieved evidence.

### API and ingestion

The Express application is in `server/src/index.js`. It validates upload metadata and limits, dispatches files to format-specific parsers, and converts extracted text into document/evidence records. Upload processing stages the batch before applying the workspace mutation so a parser failure does not leave a partially indexed batch.

### Retrieval

`server/src/search.js` contains the current lexical retrieval primitives: Unicode-aware tokenization, chunk splitting and ranking. Ranking rewards term coverage and exact token phrases while reducing the influence of repeated terms. It is intentionally lightweight and explainable. It is not a semantic embedding model, a fact checker or a calibrated confidence estimator.

### Persistence

The local workspace is stored in `server/data/workspace.json`. Mutations are serialized to avoid overlapping writes. Persistence uses a temporary file followed by an atomic rename. Startup refuses to replace an unreadable or invalid existing workspace file; preserve and investigate that file rather than deleting it.

## Design boundaries

- **Local-first:** the API binds to loopback by default. An explicit `HOST` override changes that boundary and should only be used with an appropriate network security design.
- **Single-user prototype:** there is no authentication, authorization, tenant isolation or shared-workspace protocol.
- **Untrusted input:** uploaded files and filenames must be treated as untrusted. Parser resource limits and upload caps are part of the security boundary.
- **Evidence, not verdicts:** retrieval ranks candidate passages. Users must inspect the original document and context.
- **Replaceable modules:** parsers, retrieval, persistence and UI are separated enough to evolve independently, but the data model is still prototype-level.

## Safe extension points

When adding a parser, preserve a stable document identity and include a useful source locator (page, sheet/row or section) wherever the source format permits it. Add synthetic fixtures and tests for malformed and boundary-case inputs.

When changing retrieval, test tokenization, empty queries, repeated terms, punctuation, chunk boundaries, Unicode text and source-locator preservation. Explain ranking changes in the pull request.

When changing persistence, cover concurrent mutations, failed writes, missing files and corrupt existing data. Do not silently reset a user's workspace after a parse or write error.
