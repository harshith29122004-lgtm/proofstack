# Changelog

All notable changes to ProofStack will be documented here.

The project is currently in an early prototype stage. There are no published releases yet.

## Unreleased

### Added
- React component test suite covering source-scope controls, source-library navigation, saved-report rendering and persistent upload/backup controls.
- Root `npm run test:client` command and client test execution in CI.
- Local Docker Compose deployment with an unprivileged API container, nginx frontend proxy and persistent named workspace volume.
- CI container build and end-to-end smoke test through the published local web endpoint.
- Versioned workspace JSON export and validated, atomic restore endpoints.
- Workspace backup and restore controls in the Saved reports view.
- Integration coverage for backup contents, malformed backup rejection and successful restore.
- Direct citation-to-source navigation using stable document and evidence-chunk IDs.
- Evidence inspector deep-linking to a centered passage window and highlighting the cited chunk.
- Regression tests for exact passage lookup and rejection of cross-document chunk IDs.
- Optional per-document retrieval scope in the evidence assistant and query API.
- Source scope is retained in saved report snapshots and report archive metadata.
- Regression tests verify source-isolated results, missing-source handling and scoped report snapshots.
- Persistent saved evidence reports with backward-compatible workspace migration and a 100-report workspace limit.
- Report list, detail, delete, and Markdown export API endpoints.
- Saved reports workspace with save-from-search and download controls.
- API integration tests for report lifecycle, Markdown export, validation, and snapshot retention after source deletion.
- Searchable source-library screen with filename search, file-type filtering, and sorting.
- Source inspector for reviewing extracted evidence passages with original location labels and paginated loading.
- Paginated `GET /api/documents/:id/evidence` endpoint with bounded page size and excerpt length.
- Regression tests for evidence pagination, limit clamping, and missing document handling.
- Automated server test and client production-build workflow for pushes and pull requests.
- Scheduled CodeQL analysis for JavaScript and TypeScript.
- Dependabot update configuration for npm dependencies and GitHub Actions.
- Structured bug-report and feature-request templates.
- Pull-request checklist and initial security reporting policy.
- API smoke tests for health, empty-workspace, overview, and short-query validation behavior.
