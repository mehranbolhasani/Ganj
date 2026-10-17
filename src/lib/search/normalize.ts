/**
 * Search-query normalization. A copy of the Worker's shared `ndrop` function
 * (ganj-d1-worker/src/lib/normalize.js). Parity is enforced by golden vectors generated from
 * the Worker code: src/lib/search/normalize.golden.json, checked by normalize.test.ts.
 *
 *   Arabic yeh U+064A -> Persian yeh U+06CC
 *   Arabic kaf U+0643 -> Persian kaf U+06A9
 *   remove harakat U+064B..U+065F and U+0670
 *   remove tatweel U+0640
 *   remove ZWNJ U+200C          (ZWJ U+200D is left untouched, as in the Worker)
 */

const ARABIC_YEH = /\u064A/g;
const ARABIC_KAF = /\u0643/g;
const HARAKAT = /[\u064B-\u065F\u0670]/g;
const TATWEEL = /\u0640/g;
const ZWNJ = /\u200C/g;

export function normalizePersian(text: string | null | undefined): string {
  if (text == null) return '';
  return String(text)
    .replace(ARABIC_YEH, '\u06CC')
    .replace(ARABIC_KAF, '\u06A9')
    .replace(HARAKAT, '')
    .replace(TATWEEL, '')
    .replace(ZWNJ, '');
}

/** Same limit as the Worker's clampQuery: at most 24 Unicode code points. */
export const QUERY_MAX_CHARS = 24;
/** Byte cap on the query (a Persian letter is 2 bytes, so 24 letters is 48 bytes). */
export const QUERY_MAX_BYTES = 50;

export function utf8Length(s: string): number {
  return new TextEncoder().encode(s).length;
}

/** Trim, keep at most 24 code points, then drop trailing code points until <= 50 bytes. */
export function clampSearchQuery(raw: string | null | undefined): string {
  let s = [...String(raw ?? '').trim()].slice(0, QUERY_MAX_CHARS).join('');
  while (utf8Length(s) > QUERY_MAX_BYTES && s.length > 0) {
    s = [...s].slice(0, -1).join('');
  }
  return s.trim();
}
