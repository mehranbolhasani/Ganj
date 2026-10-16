/**
 * Pure mapping from the Worker /search poem rows to the bot's Poem list.
 * Separated from telegram/search.ts (which imports server-only modules) so it
 * stays unit-testable with node --test.
 */

import type { WorkerSearchRaw } from '../search/handler';
import type { Poem } from '../types';

/**
 * The keyboard only renders title and poetName; the excerpt couplet the Worker
 * returns in verses is never shown by the bot list (full text comes from
 * getPoemById). Kept verbatim so the Poem shape stays complete.
 */
export function mapWorkerSearchToPoems(raw: WorkerSearchRaw): Poem[] {
  return (raw.poems ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    verses: row.verses ?? [],
    poetId: row.poetId,
    poetName: row.poetName || '',
    categoryId: row.categoryId,
    categoryTitle: row.categoryTitle || '',
  }));
}
