/**
 * Unit tests for the Telegram search mapping from the Worker /search rows.
 * The keyboard renders only title and poetName; verses pass through untouched.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapWorkerSearchToPoems } from './worker-poems';
import type { WorkerSearchRaw } from '../search/handler';

test('maps worker rows to the bot Poem shape', () => {
  const raw: WorkerSearchRaw = {
    poems: [
      {
        id: 2206,
        title: 'غزل',
        verses: ['مصرع اول', 'مصرع دوم'],
        poetId: 2,
        poetName: 'حافظ',
        categoryId: 24,
        categoryTitle: 'غزلیات',
      },
    ],
  };
  const poems = mapWorkerSearchToPoems(raw);
  assert.equal(poems.length, 1);
  assert.equal(poems[0].id, 2206);
  assert.equal(poems[0].title, 'غزل');
  assert.equal(poems[0].poetName, 'حافظ');
  assert.equal(poems[0].categoryId, 24);
  assert.equal(poems[0].categoryTitle, 'غزلیات');
  assert.deepEqual(poems[0].verses, ['مصرع اول', 'مصرع دوم']);
});

test('missing or empty poems key yields an empty list (bot replies NO_RESULTS)', () => {
  assert.deepEqual(mapWorkerSearchToPoems({}), []);
  assert.deepEqual(mapWorkerSearchToPoems({ poems: [] }), []);
});
