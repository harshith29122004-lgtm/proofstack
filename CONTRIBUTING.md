# Contributing

1. Open an issue describing the problem or proposal.
2. Keep pull requests focused and include tests for behavior changes.
3. Never commit private documents, credentials, API keys, or personal data.
4. Preserve source references when changing retrieval behavior.
5. Document limitations honestly; do not label heuristic matching as verified fact.

## Local setup
```bash
npm install
npm install --prefix server
npm install --prefix client
npm run dev
```

Run tests with `npm test` and build the UI with `npm run build`.
