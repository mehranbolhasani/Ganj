import { test } from 'node:test';
import assert from 'node:assert/strict';
import { searchBackendFromEnv } from './backend';

test('default (unset) keeps the legacy Supabase search', () => {
  assert.equal(searchBackendFromEnv({}), 'supabase');
});

test('SEARCH_BACKEND=d1 switches search to the Worker', () => {
  assert.equal(searchBackendFromEnv({ SEARCH_BACKEND: 'd1' }), 'd1');
});

test('CONTENT_BACKEND=d1 does NOT switch search by itself', () => {
  assert.equal(searchBackendFromEnv({ CONTENT_BACKEND: 'd1' }), 'supabase');
  assert.equal(searchBackendFromEnv({ CONTENT_BACKEND: 'd1', SEARCH_BACKEND: 'supabase' }), 'supabase');
});

test('any other value keeps the legacy search (values are exact, case-sensitive)', () => {
  for (const v of ['', 'D1', 'true', 'worker', 'supabase', ' d1']) {
    assert.equal(searchBackendFromEnv({ SEARCH_BACKEND: v }), 'supabase', JSON.stringify(v));
  }
});
