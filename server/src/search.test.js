import test from 'node:test';
import assert from 'node:assert/strict';
import { score, splitChunks, terms } from './search.js';
test('terms removes common stop words and normalizes case', () => assert.deepEqual(terms('The Project deadline is FRIDAY'), ['project', 'deadline', 'friday']));
test('terms supports Unicode marks and single-character identifiers', () => {
  const kannada = String.fromCodePoint(0x0c95, 0x0ca8, 0x0ccd, 0x0ca8, 0x0ca1);
  const cafe = 'caf' + String.fromCodePoint(0x00e9);
  assert.deepEqual(terms('C SQL ' + kannada + ' ' + cafe), ['c', 'sql', kannada, cafe]);
});
test('score ranks a relevant passage above unrelated text', () => {
  assert.ok(score('project delivery deadline', 'The project delivery deadline is Friday.') > score('project delivery deadline', 'A recipe for vegetable soup and rice.'));
  assert.equal(score('   ', 'some text'), 0);
  assert.equal(score('missing phrase', 'unrelated words only'), 0);
});
test('score rewards query coverage and token-exact phrases', () => {
  assert.ok(score('project delivery deadline', 'Project delivery is on schedule.') > score('project delivery deadline', 'Project project project project.'));
  assert.ok(score('cat', 'A cat sleeps.') > score('cat', 'Education matters.'));
});
test('splitChunks preserves document provenance and bounded excerpts', () => {
  const chunks = splitChunks('Alpha paragraph.\n\nBeta paragraph.\n\nGamma paragraph.', { documentId: 'doc-1', name: 'brief.md' }, 25);
  assert.ok(chunks.length >= 2);
  assert.ok(chunks.every((x) => x.documentId === 'doc-1' && x.documentName === 'brief.md' && x.content.length <= 25));
});
test('splitChunks preserves page and row locators', () => {
  assert.equal(splitChunks('Page contents here.', { documentId: 'd', name: 'file.pdf', locationPrefix: 'Page 3' })[0].location, 'Page 3');
  assert.equal(splitChunks('Amount: 42', { documentId: 'd', name: 'file.csv', locationPrefix: 'Row' })[0].location, 'Row 1');
});
test('splitChunks never breaks a Unicode character', () => {
  const smile = String.fromCodePoint(0x1f600);
  const chunks = splitChunks('A' + smile + 'B' + smile + 'C', { documentId: 'd', name: 'unicode.txt' }, 2);
  assert.deepEqual(chunks.map((x) => x.content), ['A' + smile, 'B' + smile, 'C']);
});
test('splitChunks rejects invalid chunk sizes', () => assert.throws(() => splitChunks('text', { documentId: 'd', name: 'x.txt' }, 0), { name: 'RangeError' }));
