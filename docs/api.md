# API reference

Base URL for local development: `http://127.0.0.1:8787`.

The API is intended for the local single-user application. It does not implement authentication or authorization; do not expose it to an untrusted network.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | API health and index counts |
| GET | `/api/documents` | List indexed documents |
| POST | `/api/documents` | Upload and index multipart files |
| DELETE | `/api/documents/:id` | Remove a document and its evidence |
| POST | `/api/query` | Retrieve evidence for a question |
| GET | `/api/overview` | Workspace counts and storage overview |

## Examples

Check API health:

```bash
curl http://127.0.0.1:8787/api/health
```

List indexed documents:

```bash
curl http://127.0.0.1:8787/api/documents
```

Upload the synthetic CSV fixture:

```bash
curl -X POST http://127.0.0.1:8787/api/documents \
  -F "files=@examples/sample-costs.csv"
```

Retrieve evidence for a question:

```bash
curl -X POST http://127.0.0.1:8787/api/query \
  -H "Content-Type: application/json" \
  -d '{"question":"Which cost items increased?"}'
```

Remove a document (replace the placeholder with an ID returned by the documents endpoint):

```bash
curl -X DELETE "http://127.0.0.1:8787/api/documents/DOCUMENT_ID"
```

## Upload constraints

- Up to 5 files per request.
- Maximum 10 MB per file.
- Allowed extensions: PDF, DOCX, XLSX, XLS, CSV, TXT, Markdown, JSON and LOG.
- Spreadsheet extraction is capped at 10,000 rows per sheet.
- Extracted text is capped at 5,000,000 characters per file.

A supported extension does not guarantee a valid parse. Treat parser failures as input errors and retain the original source file for investigation.

## Response and evidence semantics

The API returns JSON. For exact response fields, consult the route implementation and the client types in the current branch; this reference documents the stable endpoint intent rather than freezing the prototype's evolving response schema.

A query result is a ranked candidate passage with a source reference. It is not a generated answer, a verified claim, or a calibrated probability. Always inspect the cited source and surrounding context before relying on a result.
