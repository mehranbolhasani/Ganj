import { test } from 'node:test';
import assert from 'node:assert/strict';
import golden from './normalize.golden.json';
import { normalizePersian, clampSearchQuery, utf8Length } from './normalize';

type Row = { input: string; normalized: string; clamped: string };
const rows = (golden as { rows: Row[] }).rows;

test('golden vectors contain at least 30 strings, incl. Arabic yeh/kaf, harakat, tatweel, ZWNJ', () => {
  assert.ok(rows.length >= 30, `only ${rows.length} vectors`);
  const all = rows.map((r) => r.input).join('');
  assert.ok(all.includes('\u064A') && all.includes('\u0643'), 'Arabic yeh and kaf');
  assert.ok(/[\u064B-\u065F\u0670]/.test(all), 'harakat');
  assert.ok(all.includes('\u0640'), 'tatweel');
  assert.ok(all.includes('\u200C'), 'ZWNJ');
});

test('normalizePersian matches the Worker output on every golden vector', () => {
  for (const r of rows) {
    assert.equal(normalizePersian(r.input), r.normalized, `input ${JSON.stringify(r.input)}`);
  }
});

test('the 24-character clamp matches the Worker clampQuery on every golden vector', () => {
  for (const r of rows) {
    if (utf8Length(r.clamped) > 50) continue; // the app adds a 50-byte cap on top, tested below
    assert.equal(clampSearchQuery(r.input), r.clamped, `input ${JSON.stringify(r.input)}`);
  }
});

test('Arabic yeh and kaf fold to Persian, harakat and tatweel and ZWNJ are removed', () => {
  assert.equal(normalizePersian('يك'), 'یک');
  assert.equal(normalizePersian('كفر'), 'کفر');
  assert.equal(normalizePersian('مِی'), 'می');
  assert.equal(normalizePersian('غـزل'), 'غزل');
  assert.equal(normalizePersian('می\u200Cرود'), 'میرود');
});

test('ZWJ is left untouched, as in the Worker', () => {
  assert.equal(normalizePersian('a\u200Db'), 'a\u200Db');
});

test('clampSearchQuery keeps at most 24 characters and at most 50 bytes', () => {
  const long = 'مرا به خاطر تو هزار حوصله باید و بیشتر';
  const out = clampSearchQuery(long);
  assert.ok([...out].length <= 24);
  assert.ok(utf8Length(out) <= 50);
  assert.equal(out, [...long].slice(0, 24).join(''));

  // 24 emoji are 96 bytes; the byte cap must bring them down to 12 (48 bytes)
  const emoji = '😀'.repeat(24);
  const capped = clampSearchQuery(emoji);
  assert.equal([...capped].length, 12);
  assert.ok(utf8Length(capped) <= 50);
});

test('clampSearchQuery trims and handles empty and null input', () => {
  assert.equal(clampSearchQuery('  حافظ  '), 'حافظ');
  assert.equal(clampSearchQuery('   '), '');
  assert.equal(clampSearchQuery(null), '');
  assert.equal(clampSearchQuery(undefined), '');
});
