# Contributing to ProofStack

Thanks for considering a contribution. ProofStack is an early-stage, local-first evidence workspace. Small, reviewable changes with tests and clear limitations are especially valuable.

## Before you start

1. Search existing issues and pull requests for related work.
2. For a bug, include reproducible steps, expected behavior, actual behavior and sanitized logs.
3. For a feature, open an issue describing the user problem, proposed behavior, alternatives and privacy implications before starting a large implementation.
4. Do not upload real confidential documents to issues, pull requests, CI, screenshots or sample fixtures.

## Local development

Requirements: Node.js 20+ and npm.

```bash
npm install
npm install --prefix server
npm install --prefix client
npm run dev
```

Run checks before opening a pull request:

```bash
npm test
npm run build
```

The server test command uses Node's built-in test runner. The build command type-checks and builds the client.

## Project map

- `client/src/App.tsx`: main React workspace interface.
- `client/src/styles.css`: application styles.
- `server/src/index.js`: Express routes, parsing orchestration and workspace persistence.
- `server/src/search.js`: lexical tokenization, chunking and ranking helpers.
- `server/src/*.test.js`: API and search regression tests.
- `examples/`: synthetic fixtures suitable for local testing.
- `docs/`: architecture, API and development notes.

See [architecture.md](docs/architecture.md) before changing ingestion, retrieval or persistence behavior.

## Contribution expectations

- Keep pull requests focused; explain the user-facing problem and trade-offs.
- Add or update tests for changed behavior, including failure paths when practical.
- Preserve document IDs and source locators unless a migration is explicitly included.
- Keep upload limits, error handling and persistence safety intact.
- Do not introduce network calls, telemetry, hosted AI services or external document transmission without explicit opt-in and documentation.
- Treat filenames and document contents as untrusted input.
- Do not claim a passage proves a statement merely because it ranks highly.
- Update the README or relevant docs when commands, API behavior, configuration or limitations change.
- Never commit credentials, API keys, private documents, generated workspace data, dependency folders or build output.

## Pull request checklist

- [ ] The change solves one clearly described problem.
- [ ] Tests were added or updated where behavior changed.
- [ ] `npm test` passes.
- [ ] `npm run build` passes.
- [ ] Documentation and examples reflect the new behavior.
- [ ] No secrets, private data or generated workspace files are included.
- [ ] Security, privacy and evidence-quality implications are described.

## Good first contributions

Look for issues labeled `good first issue`. Suitable starter areas include improving parser error messages, adding synthetic fixtures for supported formats, expanding search edge-case tests, improving keyboard accessibility, and documenting reproducible bug reports. Please coordinate in an issue before taking on work that changes the data model or API.
