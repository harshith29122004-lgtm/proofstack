# Changelog

All notable changes to ProofStack will be documented here.

The project is currently in an early prototype stage. There are no published releases yet.

## Unreleased

### Added
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
