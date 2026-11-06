import { randomUUID } from 'node:crypto';
const STOP = new Set('the a an and or but if then is are was were be been being to of in on for from by with as at into about this that these those it its we you your our their they them he she his her what which when where who why how can could should would may might will do does did not no yes'.split(' '));
const TOKEN_PATTERN = /[\p{L}\p{M}\p{N}]+(?:[._-][\p{L}\p{M}\p{N}]+)*/gu;
export function terms(value) {
  if (typeof value !== 'string' || !value) return [];
  return (value.normalize('NFKC').toLocaleLowerCase().match(TOKEN_PATTERN) || []).filter((term) => !STOP.has(term));
}
export function score(query, content) {
  const queryTerms = terms(query), documentTerms = terms(content);
  if (!queryTerms.length || !documentTerms.length) return 0;
  const frequencies = new Map();
  for (const term of documentTerms) frequencies.set(term, (frequencies.get(term) || 0) + 1);
  const uniqueQueryTerms = [...new Set(queryTerms)];
  let value = 0, matchedTerms = 0;
  for (const term of uniqueQueryTerms) {
    const frequency = frequencies.get(term) || 0;
    if (!frequency) continue;
    matchedTerms += 1;
    value += (1 + Math.log(frequency)) * (1 + Math.log(1 + documentTerms.length / (1 + frequency)));
  }
  if (!matchedTerms) return 0;
  value *= 1 + matchedTerms / uniqueQueryTerms.length;
  if (queryTerms.length > 1) {
    const phraseFound = documentTerms.some((term, index) => term === queryTerms[0] && queryTerms.every((item, offset) => documentTerms[index + offset] === item));
    if (phraseFound) value += 2.5;
  }
  return value / Math.sqrt(documentTerms.length);
}
export function splitChunks(text, source, max = 900) {
  if (!Number.isInteger(max) || max < 1) throw new RangeError('Chunk size must be a positive integer.');
  const paragraphs = text.replace(/\r/g, '').split(/\n{2,}|(?<=\.)\s+(?=[A-Z])/).map((x) => x.trim()).filter(Boolean);
  const chunks = []; let current = '', part = 1;
  function make(content, number) {
    return { id: randomUUID(), documentId: source.documentId, documentName: source.name,
      location: source.locationPrefix ? (source.locationPrefix.toLowerCase() === 'section' ? source.locationPrefix + ' ' + number : source.locationPrefix) : 'Section ' + number, content };
  }
  function pushLarge(paragraph) {
    const characters = Array.from(paragraph);
    for (let index = 0; index < characters.length; index += max) chunks.push(make(characters.slice(index, index + max).join(''), part++));
  }
  for (const paragraph of paragraphs) {
    if ((current + ' ' + paragraph).length > max && current) { chunks.push(make(current, part++)); current = ''; }
    if (Array.from(paragraph).length > max) {
      if (current) { chunks.push(make(current, part++)); current = ''; }
      pushLarge(paragraph);
    } else current += (current ? '\n' : '') + paragraph;
  }
  if (current) chunks.push(make(current, part));
  return chunks;
}
