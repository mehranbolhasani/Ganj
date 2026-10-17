/**
 * Unit tests for the /api/content/* parameter validation and cache presets.
 * Phase 5: batch poem ids for bookmark hydration must reject bad input with the
 * same rules the D1 Worker enforces (100 id cap, digits only, safe range).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CACHE_HEADERS,
  CACHE_NONE,
  MAX_HYDRATE_IDS,
  parsePoemIdsParam,
  parsePositiveInt,
} from './content-params';

test('parsePositiveInt: digits only, positive, 53-bit safe', () => {
  assert.equal(parsePositiveInt('12'), 12);
  assert.equal(parsePositiveInt('007'), 7);
  assert.equal(parsePositiveInt(null), null);
  assert.equal(parsePositiveInt(''), null);
  assert.equal(parsePositiveInt('abc'), null);
  assert.equal(parsePositiveInt('-3'), null);
  assert.equal(parsePositiveInt('1.5'), null);
  assert.equal(parsePositiveInt('0'), null);
  assert.equal(parsePositiveInt(String(2 ** 53)), null);
  assert.equal(parsePositiveInt(String(2 ** 53 - 1)), 2 ** 53 - 1);
});

test('parsePoemIdsParam: valid list, dedupe, first-occurrence order', () => {
  assert.deepEqual(parsePoemIdsParam('9,3,9,1'), [9, 3, 1]);
});

test('parsePoemIdsParam: rejects missing, empty and malformed input', () => {
  for (const raw of [null, '', 'abc', '1,,2', '1,x', '-1', '0', '1.5']) {
    assert.equal(parsePoemIdsParam(raw), null, `expected null for ${raw}`);
  }
});

test(`parsePoemIdsParam: hard cap at ${MAX_HYDRATE_IDS} ids per request`, () => {
  const tooMany = Array.from({ length: MAX_HYDRATE_IDS + 1 }, (_, i) => String(i + 1)).join(',');
  assert.equal(parsePoemIdsParam(tooMany), null);
  const atCap = Array.from({ length: MAX_HYDRATE_IDS }, (_, i) => String(i + 1)).join(',');
  assert.equal(parsePoemIdsParam(atCap)?.length, MAX_HYDRATE_IDS);
});

test('cache presets: long for lists and items, errors never cached', () => {
  assert.match(CACHE_HEADERS.list, /public/);
  assert.match(CACHE_HEADERS.list, /s-maxage=3600/);
  assert.match(CACHE_HEADERS.list, /stale-while-revalidate=86400/);
  assert.match(CACHE_HEADERS.item, /s-maxage=86400/);
  assert.equal(CACHE_NONE, 'no-store');
});
