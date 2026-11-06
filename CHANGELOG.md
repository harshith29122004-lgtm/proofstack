# Changelog

All notable changes to ProofStack will be documented here.

The project is currently in an early prototype stage. There are no published releases yet.

## Unreleased

### Added
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
