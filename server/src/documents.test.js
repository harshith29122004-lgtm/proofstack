import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

async function availablePort() {
  const server = createServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const { port } = server.address();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return port;
}

test('document evidence endpoint returns bounded, paginated source passages', async (t) => {
  const port = await availablePort();
  const directory = await mkdtemp(path.join(tmpdir(), 'proofstack-evidence-'));
  const entrypoint = fileURLToPath(new URL('./index.js', import.meta.url));
  const child = spawn(process.execPath, [entrypoint], { cwd: directory, env: { ...process.env, PORT: String(port), HOST: '127.0.0.1' }, stdio: 'ignore' });
  const base = 'http://127.0.0.1:' + port;
  t.after(async () => { if (child.exitCode === null) child.kill('SIGTERM'); await new Promise((resolve) => child.once('exit', resolve)); await rm(directory, { recursive: true, force: true }); });
  let ready = false;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try { const response = await fetch(base + '/api/health'); if (response.ok) { ready = true; break; } } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.equal(ready, true);
  const body = new FormData();
  body.append('files', new Blob([Array.from({ length: 100 }, (_, index) => 'Evidence paragraph ' + (index + 1) + ': the project milestone is documented with supporting context.').join('\n\n')]), 'evidence.txt');
  const upload = await fetch(base + '/api/documents', { method: 'POST', body });
  assert.equal(upload.status, 201);
  const uploaded = await upload.json();
  const id = uploaded.documents[0].id;
  const first = await fetch(base + '/api/documents/' + id + '/evidence?limit=2&offset=0');
  assert.equal(first.status, 200);
  const pageOne = await first.json();
  assert.equal(pageOne.evidence.length, 2);
  assert.equal(pageOne.offset, 0);
  assert.ok(pageOne.total > 2);
  assert.equal(pageOne.hasMore, true);
  assert.match(pageOne.evidence[0].excerpt, /Evidence paragraph/);
  const second = await fetch(base + '/api/documents/' + id + '/evidence?limit=2&offset=2').then((response) => response.json());
  assert.equal(second.evidence.length, 2);
  assert.notEqual(second.evidence[0].id, pageOne.evidence[0].id);
  const capped = await fetch(base + '/api/documents/' + id + '/evidence?limit=9999').then((response) => response.json());
  assert.equal(capped.limit, 100);
  const missing = await fetch(base + '/api/documents/not-a-real-id/evidence');
  assert.equal(missing.status, 404);
});
