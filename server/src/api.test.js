import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

async function getAvailablePort() {
  const probe = createServer();
  await new Promise((resolve, reject) => {
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', resolve);
  });
  const { port } = probe.address();
  await new Promise((resolve, reject) => probe.close((error) => error ? reject(error) : resolve()));
  return port;
}

async function waitForApi(url, child) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(`ProofStack API exited before becoming ready (code ${child.exitCode}).`);
    }
    try {
      const response = await fetch(url);
      if (response.ok) return response;
    } catch {
      // The server may still be starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('ProofStack API did not become ready within five seconds.');
}

test('API validates uploads, indexes evidence, and exposes workspace endpoints', async (t) => {
  const port = await getAvailablePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const isolatedDirectory = await mkdtemp(path.join(tmpdir(), 'proofstack-api-'));
  const entrypoint = fileURLToPath(new URL('./index.js', import.meta.url));
  const child = spawn(process.execPath, [entrypoint], {
    cwd: isolatedDirectory,
    env: { ...process.env, PORT: String(port), HOST: '127.0.0.1' },
    stdio: ['ignore', 'ignore', 'pipe'],
  });

  let stderr = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (chunk) => { stderr += chunk; });

  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM');
    await new Promise((resolve) => {
      if (child.exitCode !== null || child.signalCode !== null) return resolve();
      child.once('exit', resolve);
      const timeout = setTimeout(() => {
        child.kill('SIGKILL');
        resolve();
      }, 1500);
      timeout.unref();
    });
    await rm(isolatedDirectory, { recursive: true, force: true });
  });

  try {
    const healthResponse = await waitForApi(`${baseUrl}/api/health`, child);
    const health = await healthResponse.json();
    assert.equal(health.ok, true);
    assert.equal(health.name, 'ProofStack API');

    const documentsResponse = await fetch(`${baseUrl}/api/documents`);
    assert.equal(documentsResponse.status, 200);
    assert.deepEqual(await documentsResponse.json(), []);

    const overviewResponse = await fetch(`${baseUrl}/api/overview`);
    assert.equal(overviewResponse.status, 200);
    const overview = await overviewResponse.json();
    assert.equal(overview.documents, 0);
    assert.equal(overview.evidenceUnits, 0);

    const invalidQueryResponse = await fetch(`${baseUrl}/api/query`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question: 'abc' }),
    });
    assert.equal(invalidQueryResponse.status, 400);
    assert.match((await invalidQueryResponse.json()).error, /at least 4 characters/i);

    const unsupported = new FormData();
    unsupported.append('files', new Blob(['not a supported document']), 'payload.exe');
    const unsupportedResponse = await fetch(`${baseUrl}/api/documents`, {
      method: 'POST',
      body: unsupported,
    });
    assert.equal(unsupportedResponse.status, 415);
    assert.match((await unsupportedResponse.json()).error, /unsupported file type/i);

    const empty = new FormData();
    empty.append('files', new Blob([]), 'empty.txt');
    const emptyResponse = await fetch(`${baseUrl}/api/documents`, {
      method: 'POST',
      body: empty,
    });
    assert.equal(emptyResponse.status, 400);
    assert.match((await emptyResponse.json()).error, /empty files/i);

    const tooMany = new FormData();
    for (let index = 0; index < 6; index += 1) {
      tooMany.append('files', new Blob([`sample document ${index}`]), `sample-${index}.txt`);
    }
    const tooManyResponse = await fetch(`${baseUrl}/api/documents`, {
      method: 'POST',
      body: tooMany,
    });
    assert.equal(tooManyResponse.status, 413);

    const valid = new FormData();
    valid.append('files', new Blob(['The launch deadline is Friday and the project owner is Alex.']), 'project-brief.txt');
    const uploadResponse = await fetch(`${baseUrl}/api/documents`, {
      method: 'POST',
      body: valid,
    });
    assert.equal(uploadResponse.status, 201);
    const uploaded = await uploadResponse.json();
    assert.equal(uploaded.documents.length, 1);
    assert.ok(uploaded.totalChunks > 0);

    const queryResponse = await fetch(`${baseUrl}/api/query`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question: 'launch deadline Friday' }),
    });
    assert.equal(queryResponse.status, 200);
    const query = await queryResponse.json();
    assert.equal(query.sources.length, 1);
    assert.match(query.sources[0].excerpt, /deadline is Friday/i);

    const afterUpload = await fetch(`${baseUrl}/api/overview`).then((response) => response.json());
    assert.equal(afterUpload.documents, 1);
    assert.ok(afterUpload.evidenceUnits > 0);

    const deleteResponse = await fetch(`${baseUrl}/api/documents/${uploaded.documents[0].id}`, {
      method: 'DELETE',
    });
    assert.equal(deleteResponse.status, 200);
    const afterDelete = await fetch(`${baseUrl}/api/overview`).then((response) => response.json());
    assert.equal(afterDelete.documents, 0);
    assert.equal(afterDelete.evidenceUnits, 0);
  } catch (error) {
    if (stderr) error.message += `\nAPI stderr: ${stderr}`;
    throw error;
  }
});
