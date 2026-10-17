import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSearchParams } from './query';

function parse(qs: string) {
  return parseSearchParams(new URLSearchParams(qs));
}

test('rejects an empty or whitespace-only query with 400', () => {
  for (const qs of ['', 'q=', 'q=%20%20']) {
    const r = parse(qs);
    assert.equal(r.ok, false, qs);
    if (!r.ok) {
      assert.equal(r.status, 400);
      assert.equal(r.error, 'Query is required');
    }
  }
});

test('rejects an unknown type with 400', () => {
  const r = parse('q=حافظ&type=books');
  assert.equal(r.ok, false);
});

test('defaults: type all, limit 20, offset 0, count false, no poet filter', () => {
  const r = parse('q=حافظ');
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.deepEqual(r.value, { q: 'حافظ', type: 'all', limit: 20, offset: 0, count: false, poetIdParam: { kind: 'none' } });
  }
});

test('limit is clamped to 1..100 and offset to 0..5000; non-numeric values fall back', () => {
  const big = parse('q=حافظ&limit=9999&offset=999999');
  const small = parse('q=حافظ&limit=0&offset=-5');
  const junk = parse('q=حافظ&limit=abc&offset=xyz');
  assert.ok(big.ok && big.value.limit === 100 && big.value.offset === 5000);
  assert.ok(small.ok && small.value.limit === 1 && small.value.offset === 0);
  assert.ok(junk.ok && junk.value.limit === 20 && junk.value.offset === 0);
});

test('poetId: numeric is valid, empty means no filter, non-numeric is invalid', () => {
  const valid = parse('q=حافظ&poetId=22');
  const empty = parse('q=حافظ&poetId=');
  const junk = parse('q=حافظ&poetId=abc');
  assert.ok(valid.ok && valid.value.poetIdParam.kind === 'valid' && valid.value.poetIdParam.id === 22);
  assert.ok(empty.ok && empty.value.poetIdParam.kind === 'none');
  assert.ok(junk.ok && junk.value.poetIdParam.kind === 'invalid');
});

test('the query is clamped to 24 characters and 50 bytes', () => {
  const r = parse('q=' + encodeURIComponent('مرا به خاطر تو هزار حوصله باید و بیشتر'));
  assert.ok(r.ok);
  if (r.ok) {
    assert.ok([...r.value.q].length <= 24);
    assert.ok(new TextEncoder().encode(r.value.q).length <= 50);
  }
});

test('count=true is recognised only as the literal string true', () => {
  assert.ok(parse('q=حافظ&count=true').ok && (parse('q=حافظ&count=true') as { value: { count: boolean } }).value.count);
  assert.equal((parse('q=حافظ&count=1') as { value: { count: boolean } }).value.count, false);
});
