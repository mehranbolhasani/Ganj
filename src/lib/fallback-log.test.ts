import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatFallbackLine } from './fallback-log';

test('fallback line has the [d1-fallback] prefix, a scope, a reason and no newlines', () => {
  const line = formatFallbackLine('content', 'timeout', { method: 'getPoem' });
  assert.equal(line, '[d1-fallback] scope=content reason=timeout method=getPoem');
  assert.equal(line.includes('\n'), false);
});

test('whitespace in reason or detail values is collapsed so the line stays single', () => {
  const line = formatFallbackLine('search', 'bad json', { action: 'supa base' });
  assert.equal(line, '[d1-fallback] scope=search reason=bad_json action=supa_base');
});
