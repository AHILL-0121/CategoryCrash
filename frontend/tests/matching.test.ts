import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesKnownAnswer, normalizeText, tokenize } from '../lib/answer-matching.ts';

// A realistic pre-fetched list for "Things that are RED" x "Things found in a KITCHEN".
const AI_ANSWERS = [
  'tomato',
  'apple',
  'chili pepper',
  'ketchup',
  'strawberry',
  'red onion',
  'paprika',
  'cherry',
];

test('normalizeText strips punctuation, case and extra whitespace', () => {
  assert.equal(normalizeText('  Red   APPLE!! '), 'red apple');
  assert.equal(normalizeText('...'), '');
});

test('tokenize drops stopwords but leaves words intact', () => {
  assert.deepEqual(tokenize('the tomatoes'), ['tomatoes']);
  assert.deepEqual(tokenize('a bunch of cherries'), ['bunch', 'cherries']);
});

// ── The regression suite for the exploit this replaced ──
// The previous substring matcher returned true for all of these, because
// `"tomato".includes("")` is true and single letters are substrings of real
// answers. An empty answer scored 500 + the uniqueness bonus.
test('degenerate answers are rejected', () => {
  for (const bogus of ['', ' ', '   ', 'a', 'e', 'p', 'to', '!!', '...']) {
    assert.equal(
      matchesKnownAnswer(bogus, AI_ANSWERS),
      false,
      `expected ${JSON.stringify(bogus)} to be rejected`
    );
  }
});

test('gibberish padded with a real word is rejected', () => {
  assert.equal(matchesKnownAnswer('asdfghjkl tomato', AI_ANSWERS), false);
});

test('a negated answer is rejected', () => {
  assert.equal(matchesKnownAnswer('not a tomato at all', AI_ANSWERS), false);
});

test('a fragment of a multi-word answer is rejected', () => {
  // "chili" alone is not "chili pepper"; "onion" alone is not "red onion".
  assert.equal(matchesKnownAnswer('chili', AI_ANSWERS), false);
  assert.equal(matchesKnownAnswer('onion', AI_ANSWERS), false);
});

test('genuinely wrong answers are rejected', () => {
  assert.equal(matchesKnownAnswer('zebra', AI_ANSWERS), false);
  assert.equal(matchesKnownAnswer('banana', AI_ANSWERS), false);
});

// ── Answers that must still be accepted without an API round-trip ──
test('exact answers are accepted', () => {
  assert.equal(matchesKnownAnswer('tomato', AI_ANSWERS), true);
  assert.equal(matchesKnownAnswer('chili pepper', AI_ANSWERS), true);
});

test('casing, whitespace and punctuation do not matter', () => {
  assert.equal(matchesKnownAnswer('  ToMaTo  ', AI_ANSWERS), true);
  assert.equal(matchesKnownAnswer('Chili  Pepper!', AI_ANSWERS), true);
});

test('plurals and articles are accepted', () => {
  assert.equal(matchesKnownAnswer('tomatoes', AI_ANSWERS), true);
  assert.equal(matchesKnownAnswer('the tomato', AI_ANSWERS), true);
  assert.equal(matchesKnownAnswer('cherries', AI_ANSWERS), true);
});

test('an empty answer list accepts nothing', () => {
  assert.equal(matchesKnownAnswer('tomato', []), false);
});

test('plural matching survives words a naive stemmer would mangle', () => {
  // A rule that strips "es" turns "shoes" into "sho"; one that strips only "s"
  // turns "tomatoes" into "tomatoe". Both directions have to line up.
  assert.equal(matchesKnownAnswer('tomatoes', ['tomato']), true);
  assert.equal(matchesKnownAnswer('tomato', ['tomatoes']), true);
  assert.equal(matchesKnownAnswer('shoes', ['shoe']), true);
  assert.equal(matchesKnownAnswer('shoe', ['shoes']), true);
  assert.equal(matchesKnownAnswer('boxes', ['box']), true);
  assert.equal(matchesKnownAnswer('cherry', ['cherries']), true);
});

test('word count must line up, so supersets stay rejected', () => {
  assert.equal(matchesKnownAnswer('red apple', ['apple']), false);
  assert.equal(matchesKnownAnswer('apple', ['red apple']), false);
});
