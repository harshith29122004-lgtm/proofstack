# Developer setup

## Requirements

- Node.js 20 or newer
- npm
- A modern browser

## Install

From the repository root:

```bash
npm install
npm install --prefix server
npm install --prefix client
```

The repository currently uses separate npm package manifests for the root scripts, API and client. Install dependencies in all three locations.

## Run the application

Start both development processes:

```bash
npm run dev
```

The root script runs the server and Vite client concurrently. By default, the client is available at http://localhost:5173 and the API at http://127.0.0.1:8787.

To run one part independently:

```bash
npm run dev --prefix server
npm run dev --prefix client
```

## Checks

```bash
npm test
npm run build
```

- `npm test` runs the server's Node.js test files.
- `npm run build` runs the client TypeScript check and Vite production build.

CI also runs the server tests on Node.js 20 and 22 and performs CodeQL analysis.

## Configuration

The server reads:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `8787` | API listen port |
| `HOST` | `127.0.0.1` | API bind address |

Keep the default loopback binding for local use. Setting `HOST=0.0.0.0` exposes the API on network interfaces; do not do this on an untrusted network. ProofStack does not currently provide authentication or multi-user access.

The example environment file is `.env.example`. Do not commit real environment files or secrets.

## Workspace data

The server creates its local workspace under `server/data/workspace.json`. This directory is intentionally excluded from version control. Use the synthetic files in `examples/` for repeatable tests; do not commit real user documents or workspace snapshots.

If startup reports that an existing workspace cannot be read or parsed, stop and preserve the file for recovery. Do not delete it as a first troubleshooting step.

## Tests

Run the backend integration and parser tests:

```bash
npm test
```

Run the React component tests:

```bash
npm run test:client
```

The client suite uses Vitest, jsdom and React Testing Library. CI runs both test suites before the client production build and Docker smoke test.

## Troubleshooting

### Port already in use

Stop the process already using port 8787 (API) or 5173 (Vite), or choose an unused port. If changing the API port, keep the client API configuration in sync.

### Upload rejected

Check that the file extension is supported, that each file is at most 10 MB, and that no more than 5 files are sent in one request. A file with a supported extension can still fail if its contents are malformed or unsupported by its parser.

### Search returns no useful matches

The current engine is lexical. Try a short query using important terms that appear in the source. Search relevance is a ranking signal, not a semantic correctness guarantee.

### Workspace does not start

Preserve `server/data/workspace.json` and inspect the error. The server intentionally refuses to replace an invalid existing workspace with an empty one.


## Docker Compose deployment

For a reproducible local stack, install Docker Engine and the Compose plugin, then run from the repository root:

```bash
docker compose up --build
```

Open `http://localhost:8080`. Nginx serves the built React application and proxies `/api` requests to the internal Express service. Only the web port is published, and it is bound to `127.0.0.1`; the API port is not exposed on the host. The API runs as the unprivileged Node user and stores workspace data in the named `proofstack-data` volume.

Useful commands:

```bash
docker compose ps
docker compose logs -f api web
docker compose down
```

The named volume survives `docker compose down`. To intentionally delete it, run `docker compose down -v`; this permanently removes the container-managed workspace data. Export a workspace backup before destructive maintenance.

The Compose deployment is still a local single-user prototype. Loopback binding does not add authentication or make the application suitable for public or multi-user hosting.
