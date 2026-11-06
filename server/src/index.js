import express from 'express';
import cors from 'cors';
import multer from 'multer';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';
import XLSX from 'xlsx';
import { parse as parseCsv } from 'csv-parse/sync';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { score, splitChunks, terms } from './search.js';

const app = express();
const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '127.0.0.1';
const DATA_DIR = path.resolve('data');
const DB_FILE = path.join(DATA_DIR, 'workspace.json');
const MAX_EXTRACTED_CHARACTERS = 5_000_000;
const ALLOWED_EXTENSIONS = new Set([
  '.pdf', '.docx', '.xlsx', '.xls', '.csv', '.txt', '.md', '.json', '.log',
]);

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 5,
    fields: 5,
    fieldNameSize: 100,
    fieldSize: 16 * 1024,
    parts: 10,
  },
  fileFilter(_req, file, callback) {
    const normalizedName = String(file.originalname || '').replaceAll('\\', '/');
    const safeName = path.posix.basename(normalizedName);
    const extension = path.extname(safeName).toLowerCase();
    if (!safeName || safeName === '.' || !ALLOWED_EXTENSIONS.has(extension)) {
      const error = new Error('Unsupported file type. Use PDF, DOCX, XLSX, XLS, CSV, TXT, MD, JSON, or LOG.');
      error.code = 'UNSUPPORTED_FILE_TYPE';
      return callback(error);
    }
    file.originalname = safeName;
    callback(null, true);
  },
});

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json({ limit: '1mb' }));

let db = { documents: [], chunks: [], reports: [] };
let workspaceMutationQueue = Promise.resolve();

await fs.mkdir(DATA_DIR, { recursive: true });
let workspaceContents;
try {
  workspaceContents = await fs.readFile(DB_FILE, 'utf8');
} catch (error) {
  if (error.code !== 'ENOENT') {
    throw new Error(`Could not read workspace data at ${DB_FILE}; refusing to overwrite it.`, { cause: error });
  }
}
if (workspaceContents !== undefined) {
  // Fail closed on corrupt or unexpected data. Never replace a user's workspace with an empty one.
  const stored = JSON.parse(workspaceContents);
  if (!stored || !Array.isArray(stored.documents) || !Array.isArray(stored.chunks)) {
    throw new Error('Workspace data has an invalid structure; refusing to overwrite it.');
  }
  db = { ...stored, reports: Array.isArray(stored.reports) ? stored.reports : [] };
} else {
  await persist();
}

async function persist() {
  const temporaryFile = path.join(DATA_DIR, `.workspace-${randomUUID()}.tmp`);
  try {
    await fs.writeFile(temporaryFile, JSON.stringify(db, null, 2), {
      encoding: 'utf8',
      mode: 0o600,
      flag: 'wx',
    });
    await fs.rename(temporaryFile, DB_FILE);
  } catch (error) {
    await fs.rm(temporaryFile, { force: true }).catch(() => {});
    throw error;
  }
}

// Serialize all workspace mutations so concurrent uploads/deletions cannot overwrite each other.
function updateWorkspace(update) {
  const operation = workspaceMutationQueue.then(async () => {
    const previous = db;
    db = { ...db, ...update(db) };
    try {
      await persist();
    } catch (error) {
      db = previous;
      throw error;
    }
  });
  workspaceMutationQueue = operation.catch(() => {});
  return operation;
}

async function extract(file) {
  const extension = path.extname(file.originalname).toLowerCase();
  if (['.txt', '.md', '.json', '.log'].includes(extension)) {
    return [{ text: file.buffer.toString('utf8'), locationPrefix: 'Section' }];
  }
  if (extension === '.pdf') {
    const parsed = await pdf(file.buffer);
    return parsed.text.split('\f')
      .map((text, index) => ({ text, locationPrefix: 'Page ' + (index + 1) }))
      .filter((page) => page.text.trim());
  }
  if (extension === '.docx') {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return [{ text: result.value, locationPrefix: 'Section' }];
  }
  if (extension === '.xlsx' || extension === '.xls') {
    const book = XLSX.read(file.buffer, { type: 'buffer', cellDates: true, sheetRows: 10000 });
    return book.SheetNames.flatMap((name) => {
      const rows = XLSX.utils.sheet_to_json(book.Sheets[name], { header: 1, defval: '' });
      return rows.map((row, index) => ({
        text: row.map((value, column) =>
          `${rows[0]?.[column] || 'Column ' + (column + 1)}: ${String(value)}`,
        ).join(' | '),
        locationPrefix: 'Sheet ' + name + ', row ' + (index + 1),
      })).filter((row) => row.text.trim());
    });
  }
  if (extension === '.csv') {
    if (file.buffer.length > 1024 * 1024) {
      throw new Error('CSV files must not exceed 1 MB.');
    }
    const rows = parseCsv(file.buffer.toString('utf8'), {
      relax_quotes: true,
      skip_empty_lines: true,
      bom: true,
      // Keep CSV ingestion bounded like spreadsheet ingestion. Include the header.
      to: 10_001,
      max_record_size: 1024 * 1024,
    });
    const headers = rows[0] || [];
    return rows.slice(1).map((row, index) => ({
      text: row.map((value, column) =>
        `${headers[column] || 'Column ' + (column + 1)}: ${value}`,
      ).join(' | '),
      locationPrefix: 'Row ' + (index + 2),
    }));
  }
  throw new Error('Unsupported file type.');
}

function buildQueryResult(question, options = {}) {
  const scopedDocument = options.documentId
    ? db.documents.find((document) => document.id === options.documentId)
    : null;
  const candidateChunks = options.documentId
    ? db.chunks.filter((chunk) => chunk.documentId === options.documentId)
    : db.chunks;
  const ranked = candidateChunks
    .map((chunk) => ({ ...chunk, score: score(question, chunk.content) }))
    .filter((chunk) => chunk.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 6);
  const sources = ranked.map((chunk, index) => ({
    citation: '[S' + (index + 1) + ']',
    document: chunk.documentName,
    location: chunk.location,
    excerpt: chunk.content.slice(0, 420),
    relevance: Math.round(Math.min(1, chunk.score / (ranked[0]?.score || 1)) * 100),
  }));
  const queryTerms = terms(question);
  const coverage = queryTerms.length
    ? Math.round(new Set(ranked.flatMap((result) => terms(result.content))).size /
      new Set(queryTerms).size * 100)
    : 0;
  return {
    question,
    scope: { documentId: scopedDocument?.id || null, documentName: scopedDocument?.name || 'All sources' },
    answer: ranked.length
      ? 'Here are the strongest matching passages from your workspace. This release uses transparent, extractive retrieval rather than generating unsupported claims. Read the cited excerpts before relying on a conclusion.'
      : 'No matching evidence was found in the current workspace. Add relevant documents or try different wording.',
    sources,
    coverage: Math.min(100, coverage),
    mode: 'extractive',
    notice: 'A match is not proof that a claim is true. Verify the original source and context.',
  };
}

function escapeMarkdown(value) {
  return String(value ?? '').replace(/[\r\n]+/g, ' ').replaceAll('|', '\\|');
}

function renderReportMarkdown(report) {
  const lines = [
    '# ' + escapeMarkdown(report.title),
    '',
    '**Created:** ' + new Date(report.createdAt).toISOString(),
    '',
    '## Research question',
    '',
    report.question,
    '',
    '## Evidence summary',
    '',
    report.answer,
    '',
    '**Evidence coverage:** ' + report.coverage + '%',
    '',
    '## Retrieved sources',
    '',
  ];
  if (!report.sources.length) lines.push('No matching evidence was found for this question.');
  for (const source of report.sources) {
    lines.push('### ' + escapeMarkdown(source.citation) + ' ' + escapeMarkdown(source.document));
    lines.push('');
    lines.push('- **Location:** ' + escapeMarkdown(source.location));
    lines.push('- **Retrieval match:** ' + source.relevance + '%');
    lines.push('');
    lines.push(...String(source.excerpt).split(/\r?\n/).map((line) => '> ' + escapeMarkdown(line)));
    lines.push('');
  }
  lines.push('## Verification note', '', report.notice, '', '---', '', 'Generated by ProofStack. Retrieval relevance is not a truth score; consult the original source before relying on a conclusion.', '');
  return lines.join('\n');
}

app.get('/api/health', (_req, res) => res.json({
  ok: true,
  name: 'ProofStack API',
  version: '0.1.0',
  documents: db.documents.length,
  chunks: db.chunks.length,
}));

app.get('/api/documents', (_req, res) => res.json(
  db.documents.map(({ id, name, type, size, createdAt, chunkCount }) =>
    ({ id, name, type, size, createdAt, chunkCount })),
));

app.post('/api/documents', upload.array('files', 5), async (req, res) => {
  const files = req.files || [];
  if (!files.length) return res.status(400).json({ error: 'Choose at least one file.' });

  try {
    // Stage every document first. A failed parser must not leave a partial workspace update.
    const stagedDocuments = [];
    const stagedChunks = [];
    for (const file of files) {
      if (!file.size) return res.status(400).json({ error: 'Empty files cannot be indexed.' });
      const pages = await extract(file);
      const extractedCharacters = pages.reduce((total, page) => total + page.text.length, 0);
      if (extractedCharacters > MAX_EXTRACTED_CHARACTERS) {
        return res.status(413).json({ error: 'Extracted text exceeds the 5 MB per-file processing limit.' });
      }

      const id = randomUUID();
      const document = {
        id,
        name: file.originalname,
        type: path.extname(file.originalname).slice(1).toUpperCase(),
        size: file.size,
        createdAt: new Date().toISOString(),
        chunkCount: 0,
      };
      const chunks = pages.flatMap((page, index) => splitChunks(page.text, {
        documentId: id,
        name: document.name,
        locationPrefix: page.locationPrefix || 'Section ' + (index + 1),
      }));
      document.chunkCount = chunks.length;
      stagedDocuments.push(document);
      stagedChunks.push(...chunks);
    }

    await updateWorkspace((current) => ({
      documents: [...current.documents, ...stagedDocuments],
      chunks: [...current.chunks, ...stagedChunks],
    }));

    res.status(201).json({
      documents: stagedDocuments,
      totalChunks: stagedDocuments.reduce((total, document) => total + document.chunkCount, 0),
    });
  } catch (error) {
    console.error('Document ingestion failed:', error.message);
    res.status(422).json({ error: 'Could not process the uploaded file. Check that it is a valid, supported document.' });
  }
});

app.get('/api/documents/:id/evidence', (req, res) => {
  const document = db.documents.find((item) => item.id === req.params.id);
  if (!document) return res.status(404).json({ error: 'Document not found.' });
  const requestedLimit = Number.parseInt(req.query.limit, 10);
  const requestedOffset = Number.parseInt(req.query.offset, 10);
  const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(100, requestedLimit)) : 30;
  const offset = Number.isFinite(requestedOffset) ? Math.max(0, requestedOffset) : 0;
  const matching = db.chunks.filter((chunk) => chunk.documentId === document.id);
  const evidence = matching.slice(offset, offset + limit).map((chunk) => ({ id: chunk.id, location: chunk.location, excerpt: String(chunk.content || '').slice(0, 800) }));
  return res.json({ document: { id: document.id, name: document.name, type: document.type, size: document.size, createdAt: document.createdAt, chunkCount: document.chunkCount }, total: matching.length, offset, limit, hasMore: offset + evidence.length < matching.length, evidence });
});

app.delete('/api/documents/:id', async (req, res) => {
  let found = false;
  try {
    await updateWorkspace((current) => {
      const documents = current.documents.filter((document) => document.id !== req.params.id);
      if (documents.length === current.documents.length) return current;
      found = true;
      return {
        documents,
        chunks: current.chunks.filter((chunk) => chunk.documentId !== req.params.id),
      };
    });
    if (!found) return res.status(404).json({ error: 'Document not found.' });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Could not save the workspace change.' });
  }
});

app.post('/api/query', (req, res) => {
  const question = String(req.body?.question || '').trim();
  if (question.length < 4 || question.length > 1000) {
    return res.status(400).json({ error: 'Ask a more specific question (at least 4 characters and no more than 1,000).' });
  }
  const documentId = req.body?.documentId ? String(req.body.documentId).trim() : null;
  if (documentId && !db.documents.some((document) => document.id === documentId)) {
    return res.status(404).json({ error: 'The selected source was not found. Refresh the source library and try again.' });
  }
  return res.json(buildQueryResult(question, { documentId }));
});

app.get('/api/reports', (_req, res) => res.json(
  db.reports.map(({ id, title, question, createdAt, sources, coverage, scope }) => ({
    id, title, question, createdAt, sourceCount: sources.length, coverage, scope: scope?.documentName || 'All sources',
  })),
));

app.post('/api/reports', async (req, res) => {
  const question = String(req.body?.question || '').trim();
  if (question.length < 4 || question.length > 1000) {
    return res.status(400).json({ error: 'Question must be between 4 and 1,000 characters.' });
  }
  if (db.reports.length >= 100) {
    return res.status(409).json({ error: 'This workspace has reached its limit of 100 saved reports. Delete an older report to continue.' });
  }
  const documentId = req.body?.documentId ? String(req.body.documentId).trim() : null;
  if (documentId && !db.documents.some((document) => document.id === documentId)) {
    return res.status(404).json({ error: 'The selected source was not found. Refresh the source library and try again.' });
  }
  const result = buildQueryResult(question, { documentId });
  const report = {
    id: randomUUID(),
    title: question.length > 100 ? question.slice(0, 97) + '...' : question,
    createdAt: new Date().toISOString(),
    ...result,
  };
  try {
    await updateWorkspace((current) => ({ reports: [report, ...(current.reports || [])] }));
    return res.status(201).json({
      id: report.id, title: report.title, question: report.question,
      createdAt: report.createdAt, sourceCount: report.sources.length,
      coverage: report.coverage, scope: report.scope.documentName,
    });
  } catch {
    return res.status(500).json({ error: 'Could not save the evidence report.' });
  }
});

app.get('/api/reports/:id/export', (req, res) => {
  const report = db.reports.find((item) => item.id === req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found.' });
  const filename = (report.title || 'proofstack-report')
    .normalize('NFKD').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'proofstack-report';
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '.md"');
  return res.send(renderReportMarkdown(report));
});

app.get('/api/reports/:id', (req, res) => {
  const report = db.reports.find((item) => item.id === req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found.' });
  return res.json(report);
});

app.delete('/api/reports/:id', async (req, res) => {
  let found = false;
  try {
    await updateWorkspace((current) => {
      const reports = (current.reports || []).filter((report) => report.id !== req.params.id);
      if (reports.length === (current.reports || []).length) return {};
      found = true;
      return { reports };
    });
    if (!found) return res.status(404).json({ error: 'Report not found.' });
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'Could not save the report deletion.' });
  }
});

app.get('/api/overview', (_req, res) => {
  const byType = {};
  db.documents.forEach((document) => {
    byType[document.type] = (byType[document.type] || 0) + 1;
  });
  res.json({
    documents: db.documents.length,
    evidenceUnits: db.chunks.length,
    types: byType,
    storage: 'local',
  });
});

// Multer errors happen before the route handler; return predictable JSON instead of HTML.
app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    const tooLarge = ['LIMIT_FILE_SIZE', 'LIMIT_FILE_COUNT', 'LIMIT_PART_COUNT'].includes(error.code);
    return res.status(tooLarge ? 413 : 400).json({
      error: tooLarge ? 'Upload exceeds the configured file or request limit.' : 'Invalid upload request.',
    });
  }
  if (error.code === 'UNSUPPORTED_FILE_TYPE') {
    return res.status(415).json({ error: error.message });
  }
  console.error('Unhandled API error:', error.message);
  res.status(500).json({ error: 'Unexpected server error.' });
});

app.listen(PORT, HOST, () => {
  console.log(`ProofStack API listening on http://${HOST}:${PORT}`);
});