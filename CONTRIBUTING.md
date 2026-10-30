# Contributing

Thanks for considering a contribution to ProofStack.

## Before opening a pull request

1. Open an issue describing the problem or proposed change.
2. Keep changes focused and include tests for behavior changes.
3. Never add private documents, credentials, API keys, or personal data.
4. Document limitations honestly; do not label heuristic matching as verified fact.

## Local setup

```bash
npm install
npm install --prefix server
npm install --prefix client
npm run dev
```

## Quality expectations

- Add or update automated tests.
- Handle malformed and unsupported documents safely.
- Preserve source references when changing retrieval behavior.
- Explain any trade-offs in the pull request description.
