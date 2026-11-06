import test from 'node:test';
import assert from 'node:assert/strict';
import { terms, score, splitChunks } from './search.js';

test('terms normalize compatibility forms and case while preserving technical identifiers', () => {
  assert.deepEqual(terms('THE ＰＲＯＯＦ and proof'), ['proof', 'proof']);
  assert.deepEqual(terms('C x'), ['c', 'x']);
});

test('terms keep Kannada combining marks inside a single token', () => {
  const kannada = String.fromCodePoint(0x0C95, 0x0CA8, 0x0CCD, 0x0CA8, 0x0CA1);
  const normalized = kannada.normalize('NFKC').toLocaleLowerCase();
  assert.deepEqual(terms(kannada), [normalized]);
});

test('score rewards matched query terms and returns zero for unrelated text', () => {
  assert.ok(score('launch deadline Friday', 'The launch deadline is Friday.') > 0);
  assert.equal(score('launch deadline', 'budget spending report'), 0);
  assert.ok(score('alpha beta gamma', 'alpha beta gamma') > score('alpha beta gamma', 'alpha only'));
});

test('score boosts exact token phrases without rewarding repeated query terms', () => {
  assert.ok(score('alpha beta', 'alpha beta gamma') > score('alpha beta', 'beta alpha gamma'));
  assert.equal(score('alpha alpha', 'alpha'), score('alpha', 'alpha'));
});

test('splitChunks preserves row and spreadsheet row locators across long-cell chunks', () => {
  const csvChunks = splitChunks('abcdefghij', { documentId: 'doc-1', name: 'costs.csv', locationPrefix: 'Row 8' }, 4);
  assert.equal(csvChunks.length, 3);
  assert.deepEqual(csvChunks.map((chunk) => chunk.location), ['Row 8', 'Row 8', 'Row 8']);

  const sheetChunks = splitChunks('abcdefghij', { documentId: 'doc-1', name: 'costs.xlsx', locationPrefix: 'Sheet Forecast, row 12' }, 4);
  assert.deepEqual(sheetChunks.map((chunk) => chunk.location), [
    'Sheet Forecast, row 12', 'Sheet Forecast, row 12', 'Sheet Forecast, row 12',
  ]);
});

test('splitChunks numbers generic sections and preserves Unicode code points', () => {
  const content = 'ab' + String.fromCodePoint(0x1F680) + 'cdef';
  const chunks = splitChunks(content, { documentId: 'doc-1', name: 'notes.txt', locationPrefix: 'Section' }, 3);
  assert.deepEqual(chunks.map((chunk) => chunk.location), ['Section 1', 'Section 2', 'Section 3']);
  assert.ok(chunks.every((chunk) => Array.from(chunk.content).length <= 3));
  assert.equal(chunks.map((chunk) => chunk.content).join(''), content);
});

test('splitChunks rejects invalid chunk sizes', () => {
  assert.throws(() => splitChunks('text', { documentId: 'doc-1', name: 'notes.txt' }, 0), RangeError);
  assert.throws(() => splitChunks('text', { documentId: 'doc-1', name: 'notes.txt' }, 1.5), RangeError);
});
