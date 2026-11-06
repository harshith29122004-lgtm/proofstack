import test from 'node:test';
import assert from 'node:assert/strict';
import { score, splitChunks, terms } from './search.js';

test('terms removes common stop words and normalizes case', () => {
  assert.deepEqual(terms('The Project deadline is FRIDAY'), ['project', 'deadline', 'friday']);
});

test('terms supports Unicode text and single-character technical identifiers', () => {
  assert.deepEqual(terms('C SQL ಕನ್ನಡ café'), ['c', 'sql', 'ಕನ್ನಡ', 'café']);
});

test('score ranks a relevant passage above unrelated text', () => {
  const relevant = score('project delivery deadline', 'The project delivery deadline is Friday.');
  const unrelated = score('project delivery deadline', 'A recipe for vegetable soup and rice.');
  assert.ok(relevant > unrelated);
  assert.equal(score('   ', 'some text'), 0);
  assert.equal(score('missing phrase', 'unrelated words only'), 0);
});

test('score rewards query coverage and token-exact phrases', () => {
  const broadCoverage = score('project delivery deadline', 'Project delivery is on schedule.');
  const narrowCoverage = score('project delivery deadline', 'Project project project project.');
  assert.ok(broadCoverage > narrowCoverage);
  assert.ok(score('cat', 'A cat sleeps.') > score('cat', 'Education matters.'));
});

test('splitChunks preserves document provenance and bounded excerpts', () => {
  const chunks = splitChunks('Alpha paragraph.\n\nBeta paragraph.\n\nGamma paragraph.', {
    documentId: 'doc-1',
    name: 'brief.md'
  }, 25);
  assert.ok(chunks.length >= 2);
  assert.ok(chunks.every((chunk) => chunk.documentId === 'doc-1' && chunk.documentName === 'brief.md'));
  assert.ok(chunks.every((chunk) => chunk.content.length <= 25));
});

test('splitChunks preserves page and row locators', () => {
  const page = splitChunks('Page contents here.', {
    documentId: 'd',
    name: 'file.pdf',
    locationPrefix: 'Page 3'
  });
  const row = splitChunks('Amount: 42', {
    documentId: 'd',
    name: 'file.csv',
    locationPrefix: 'Row'
  });
  assert.equal(page[0].location, 'Page 3');
  assert.equal(row[0].location, 'Row 1');
});

test('splitChunks never splits a Unicode surrogate pair', () => {
  const chunks = splitChunks('A😀B😀C', { documentId: 'd', name: 'unicode.txt' }, 2);
  assert.deepEqual(chunks.map((chunk) => chunk.content), ['A😀', 'B😀', 'C']);
  assert.equal(chunks.map((chunk) => chunk.content).join(''), 'A😀B😀C');
});

test('splitChunks rejects invalid chunk sizes', () => {
  assert.throws(() => splitChunks('text', { documentId: 'd', name: 'x.txt' }, 0), {
    name: 'RangeError'
  });
});
