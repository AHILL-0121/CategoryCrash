// ─── Answer text normalisation and matching ───
//
// Pure, dependency-free, and shared by the PartyKit server (via a relative
// import, so the bundler needs no path alias) and the test suite.

const STOPWORDS = new Set(['a', 'an', 'the', 'of', 'some', 'any', 'my', 'your']);

/** Lowercase, strip punctuation, collapse whitespace. */
export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Normalised, stop-worded token list. Words are left un-stemmed. */
export function tokenize(input: string): string[] {
  return normalizeText(input)
    .split(' ')
    .filter(w => w.length > 0 && !STOPWORDS.has(w));
}

/**
 * Plural spellings of a singular word.
 *
 * We compare both directions with this rather than stemming to a canonical
 * form, because English stemming is lossy in a way that bites here: a rule that
 * turns "tomatoes" into "tomato" also turns "shoes" into "sho".
 */
function pluralForms(word: string): string[] {
  const forms = [`${word}s`, `${word}es`];
  if (word.endsWith('y') && word.length > 2) forms.push(`${word.slice(0, -1)}ies`);
  return forms;
}

/** Same word, allowing for either side being the plural. */
function wordsMatch(a: string, b: string): boolean {
  if (a === b) return true;
  return pluralForms(b).includes(a) || pluralForms(a).includes(b);
}

/**
 * Fast-path match against the pre-fetched answer list.
 *
 * Deliberately CONSERVATIVE: it accepts an answer only when it is the same
 * answer, modulo casing, punctuation, spacing, articles and plurals. Anything
 * else — a fragment, a superset, a near-miss — returns false and is escalated to
 * the AI judge, which is the only thing that can actually reason about the two
 * categories.
 *
 * The version this replaced used bidirectional `String.includes`, which accepted
 * the empty string (`"tomato".includes("")` is `true`), single letters, and
 * gibberish padded with one real word. See `tests/matching.test.ts`.
 */
export function matchesKnownAnswer(playerAnswer: string, possibleAnswers: string[]): boolean {
  const answerTokens = tokenize(playerAnswer);
  if (answerTokens.length === 0) return false;

  return possibleAnswers.some(possible => {
    const possibleTokens = tokenize(possible);
    if (possibleTokens.length === 0) return false;
    if (possibleTokens.length !== answerTokens.length) return false;
    return answerTokens.every((token, i) => wordsMatch(token, possibleTokens[i]));
  });
}

/**
 * Key for the uniqueness bonus: two players "said the same thing" when their
 * answers normalise identically.
 */
export function uniquenessKey(text: string): string {
  return tokenize(text).join(' ');
}
