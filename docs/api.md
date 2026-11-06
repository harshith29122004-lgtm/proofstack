# API reference

Base URL for local development: `http://127.0.0.1:8787`.

The API is intended for the local single-user application. It does not implement authentication or authorization; do not expose it to an untrusted network.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | API health and index counts |
| GET | `/api/documents` | List indexed documents |
| GET | `/api/documents/:id/evidence` | List paginated extracted passages for one document; optionally center the page on a citation using `chunkId` |
| POST | `/api/documents` | Upload and index multipart files |
| DELETE | `/api/documents/:id` | Remove a document and its evidence |
| POST | `/api/reports` | Save a snapshot of an evidence query, including its optional source scope |
| GET | `/api/reports` | List saved report metadata |
| GET | `/api/reports/:id` | Retrieve a saved report snapshot |
| GET | `/api/reports/:id/export` | Download a Markdown report |
| DELETE | `/api/reports/:id` | Delete a saved report |
| POST | `/api/query` | Retrieve evidence for a question, optionally scoped to one source |
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

Inspect the first 30 evidence passages for a document (the API clamps `limit` to 100 and supports `offset` pagination):

```bash
curl "http://127.0.0.1:8787/api/documents/DOCUMENT_ID/evidence?limit=30&offset=0"
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

Search within one document by including its ID in the query body:

```bash
curl -X POST http://127.0.0.1:8787/api/query \
  -H "Content-Type: application/json" \
  -d '{"question":"Which cost items increased?","documentId":"DOCUMENT_ID"}'
```

Omit `documentId` to search the full workspace. A stale or unknown document ID returns `404`.

Save a snapshot of an evidence query:

```bash
curl -X POST http://127.0.0.1:8787/api/reports \
  -H "Content-Type: application/json" \
  -d '{"question":"Which cost items increased?"}'
```

Saved reports retain the selected source scope along with the evidence snapshot.

List saved reports and download one as Markdown:

```bash
curl http://127.0.0.1:8787/api/reports
curl -OJ http://127.0.0.1:8787/api/reports/REPORT_ID/export
```

Delete a saved report:

```bash
curl -X DELETE http://127.0.0.1:8787/api/reports/REPORT_ID
```

A workspace supports up to 100 saved reports. Reports are stored in the local workspace JSON file and preserve their evidence snapshot if a source document is subsequently removed.

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

Query result source objects include `documentId` and `chunkId`. Pass a citation's `chunkId` to `GET /api/documents/:id/evidence?chunkId=CHUNK_ID` to retrieve a bounded page centered on that exact passage. The chunk must belong to the selected document; otherwise the API returns `404`.

A query result is a ranked candidate passage with a source reference. It is not a generated answer, a verified claim, or a calibrated probability. Always inspect the cited source and surrounding context before relying on a result.
