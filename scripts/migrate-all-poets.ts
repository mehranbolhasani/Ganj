#!/usr/bin/env node
/**
 * migrate-all-poets.ts
 * Correct-by-construction full migration from Ganjoor API to Supabase.
 *
 * Run with: npx tsx scripts/migrate-all-poets.ts
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { existsSync, readFileSync, writeFileSync, appendFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

// ─────────────────────────────────────────────────────────────────────────────
// ENVIRONMENT
// ─────────────────────────────────────────────────────────────────────────────

config({ path: '.env.local' });
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  config({ path: '.env' });
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const GANJOOR_BASE = 'https://api.ganjoor.net/api/ganjoor';
const FETCH_TIMEOUT_MS = 15_000;
const BASE_DELAY_MS = 150;
const BACKOFF_DELAY_MS = 5_000;
const LONG_PAUSE_MS = 30_000;
const ERROR_RATE_WINDOW = 20;
const ERROR_RATE_THRESHOLD = 0.10;
const SUPABASE_BATCH_SIZE = 50;
const MAX_FETCH_RETRIES = 3;
const PROGRESS_FILE = 'scripts/migration-progress.json';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface ProgressFile {
  completedPoetIds: number[];
  startedAt: string;
  lastUpdatedAt: string;
}

interface GanjoorPoetListEntry {
  id: number;
  name: string;
  fullUrl?: string;
  description?: string;
  birthYearInLHijri?: number;
  deathYearInLHijri?: number;
}

interface GanjoorPoetResponse {
  poet: {
    id: number;
    name: string;
    fullUrl?: string;
    description?: string;
    birthYearInLHijri?: number;
    deathYearInLHijri?: number;
  };
  cat: {
    children?: Array<{ id: number; title: string; urlSlug?: string }>;
  };
}

interface GanjoorCatResponse {
  poet: { name: string };
  cat: {
    title: string;
    poems?: Array<{ id: number; title: string; verses?: Array<{ text: string }> }>;
    children?: Array<{ id: number; title: string }>;
  };
}

interface GanjoorPoemResponse {
  id: number;
  title: string;
  verses?: Array<{ text: string }>;
  plainText?: string;
  fullText?: string;
  body?: string;
  poemHtml?: string;
  html?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL STATE
// ─────────────────────────────────────────────────────────────────────────────

const recentResults: boolean[] = [];

// ─────────────────────────────────────────────────────────────────────────────
// CORE UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function log(message: string, logFile: string): void {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}`;
  console.log(line);
  try {
    appendFileSync(logFile, line + '\n');
  } catch (e) {
    console.error(`Failed to write to log file: ${e}`);
  }
}

function loadProgress(): ProgressFile {
  if (existsSync(PROGRESS_FILE)) {
    try {
      const raw = readFileSync(PROGRESS_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as ProgressFile;
      return {
        completedPoetIds: Array.isArray(parsed.completedPoetIds) ? parsed.completedPoetIds : [],
        startedAt: typeof parsed.startedAt === 'string' ? parsed.startedAt : new Date().toISOString(),
        lastUpdatedAt: typeof parsed.lastUpdatedAt === 'string' ? parsed.lastUpdatedAt : new Date().toISOString(),
      };
    } catch {
      console.warn('⚠️  Failed to parse progress file — starting fresh.');
    }
  }
  const now = new Date().toISOString();
  return {
    completedPoetIds: [],
    startedAt: now,
    lastUpdatedAt: now,
  };
}

function saveProgress(progress: ProgressFile): void {
  progress.lastUpdatedAt = new Date().toISOString();
  try {
    const dir = dirname(PROGRESS_FILE);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
  } catch (e) {
    console.error(`Failed to save progress: ${e}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ERROR RATE TRACKER
// ─────────────────────────────────────────────────────────────────────────────

function recordResult(success: boolean): void {
  recentResults.push(success);
  if (recentResults.length > ERROR_RATE_WINDOW) {
    recentResults.shift();
  }
}

function shouldPause(): boolean {
  if (recentResults.length < ERROR_RATE_WINDOW) return false;
  const failures = recentResults.filter(r => !r).length;
  return failures / recentResults.length > ERROR_RATE_THRESHOLD;
}

// ─────────────────────────────────────────────────────────────────────────────
// FETCH UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

async function fetchWithTimeout<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
    (error as Error & { status: number }).status = response.status;
    throw error;
  }

  return response.json() as Promise<T>;
}

function isRetryableError(error: Error): boolean {
  const status = (error as Error & { status?: number }).status;
  if (status === 429) return true;
  if (status !== undefined && status >= 500) return true;
  if (error.name === 'AbortError' || error.name === 'TimeoutError') return true;
  const msg = error.message.toLowerCase();
  if (
    msg.includes('fetch') ||
    msg.includes('network') ||
    msg.includes('timeout') ||
    msg.includes('abort') ||
    msg.includes('econnrefused') ||
    msg.includes('enotfound') ||
    msg.includes('failed to fetch')
  ) {
    return true;
  }
  return false;
}

async function fetchWithRetry<T>(url: string): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < MAX_FETCH_RETRIES; attempt++) {
    try {
      const data = await fetchWithTimeout<T>(url);
      return data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const status = (lastError as Error & { status?: number }).status;

      if (status === 429 || isRetryableError(lastError)) {
        if (attempt < MAX_FETCH_RETRIES - 1) {
          await sleep(BACKOFF_DELAY_MS);
          continue;
        }
      }
      throw lastError;
    }
  }

  throw lastError || new Error(`Failed after ${MAX_FETCH_RETRIES} attempts`);
}

// ─────────────────────────────────────────────────────────────────────────────
// VERSE & SLUG HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function extractVerses(poem: GanjoorPoemResponse): string[] {
  if (Array.isArray(poem.verses) && poem.verses.length > 0) {
    return poem.verses
      .map(v => v.text?.trim())
      .filter((t): t is string => Boolean(t));
  }

  const plain = poem.plainText || poem.fullText || poem.body;
  if (plain) {
    return plain.split(/\r?\n+/).map(s => s.trim()).filter(Boolean);
  }

  const html = poem.poemHtml || poem.html;
  if (html) {
    const stripped = html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<div[^>]*>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<p[^>]*>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&apos;/g, "'");
    return stripped.split(/\n+/).map(s => s.trim()).filter(Boolean);
  }

  return [];
}

function slugFromFullUrl(fullUrl?: string): string {
  if (!fullUrl) return '';
  const parts = fullUrl.split('/').filter(Boolean);
  return parts[parts.length - 1] || '';
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 1 — POETS
// ─────────────────────────────────────────────────────────────────────────────

async function importAllPoets(supabase: SupabaseClient, logFile: string): Promise<Map<number, string>> {
  const poetsData = await fetchWithRetry<GanjoorPoetListEntry[]>(`${GANJOOR_BASE}/poets`);

  const validPoets: GanjoorPoetListEntry[] = [];
  for (const entry of poetsData) {
    if (typeof entry.id === 'number' && Number.isFinite(entry.id) && entry.id > 0 && typeof entry.name === 'string' && entry.name.trim().length > 0) {
      validPoets.push(entry);
    } else {
      log(`⚠️  Skipping invalid poet entry: ${JSON.stringify(entry)}`, logFile);
    }
  }

  const poetRows = validPoets.map(p => ({
    id: p.id,
    name: p.name,
    slug: slugFromFullUrl(p.fullUrl),
    description: p.description ?? null,
    birth_year: p.birthYearInLHijri ?? null,
    death_year: p.deathYearInLHijri ?? null,
  }));

  // Upsert in batches
  for (let i = 0; i < poetRows.length; i += SUPABASE_BATCH_SIZE) {
    const batch = poetRows.slice(i, i + SUPABASE_BATCH_SIZE);
    const { error } = await supabase.from('poets').upsert(batch);
    if (error) {
      log(`⚠️  Poet batch upsert error (${batch.map(p => p.id).join(', ')}): ${error.message}`, logFile);
    }
  }

  // Verify: query all ids from Supabase
  const confirmedIds = new Set<number>();
  let from = 0;
  const pageSize = 10_000;
  while (true) {
    const { data, error } = await supabase.from('poets').select('id').range(from, from + pageSize - 1);
    if (error) {
      log(`⚠️  Failed to read poets for verification: ${error.message}`, logFile);
      break;
    }
    if (!data || data.length === 0) break;
    for (const row of data) {
      if (typeof row.id === 'number') {
        confirmedIds.add(row.id);
      }
    }
    if (data.length < pageSize) break;
    from += pageSize;
  }

  const confirmedMap = new Map<number, string>();
  const missingIds: number[] = [];
  for (const p of validPoets) {
    if (confirmedIds.has(p.id)) {
      confirmedMap.set(p.id, p.name);
    } else {
      missingIds.push(p.id);
    }
  }

  log(`Phase 1 complete: ${confirmedMap.size}/${validPoets.length} poets confirmed in Supabase`, logFile);
  for (const id of missingIds) {
    log(`❌ Missing poet id in Supabase: ${id}`, logFile);
  }

  return confirmedMap;
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 2 — CATEGORIES + POEMS (per confirmed poet)
// ─────────────────────────────────────────────────────────────────────────────

async function collectPoemSummaries(categoryId: number): Promise<Array<{ id: number; title: string }>> {
  const poems: Array<{ id: number; title: string }> = [];
  const visited = new Set<number>();

  async function traverse(catId: number) {
    if (visited.has(catId)) return;
    visited.add(catId);

    const data = await fetchWithRetry<GanjoorCatResponse>(`${GANJOOR_BASE}/cat/${catId}`);

    if (data.cat.poems) {
      for (const p of data.cat.poems) {
        poems.push({ id: p.id, title: p.title });
      }
    }

    if (data.cat.children) {
      for (const child of data.cat.children) {
        await traverse(child.id);
      }
    }
  }

  await traverse(categoryId);
  return poems;
}

async function importPoetContent(
  poetId: number,
  poetName: string,
  supabase: SupabaseClient,
  existingPoemIds: Set<number>,
  logFile: string,
  progress: ProgressFile
): Promise<void> {
  const poetStart = Date.now();
  let categoriesProcessed = 0;
  let verifiedPoems = 0;
  let noVerses = 0;
  let failedCount = 0;

  const poetResponse = await fetchWithRetry<GanjoorPoetResponse>(`${GANJOOR_BASE}/poet/${poetId}`);
  const categories = poetResponse.cat.children?.map(c => ({
    id: c.id,
    title: c.title,
    urlSlug: c.urlSlug,
  })) || [];

  for (const category of categories) {
    // 2a. Upsert category
    const { error: catUpsertError } = await supabase.from('categories').upsert({
      id: category.id,
      poet_id: poetId,
      title: category.title,
      url_slug: category.urlSlug ?? '',
      poem_count: 0,
    });

    if (catUpsertError) {
      log(`⚠️  Category upsert error ${category.title} (ID ${category.id}): ${catUpsertError.message}`, logFile);
    }

    // 2b. Verify category exists
    const { data: catVerify, error: catVerifyError } = await supabase
      .from('categories')
      .select('id')
      .eq('id', category.id)
      .maybeSingle();

    if (catVerifyError || !catVerify) {
      log(`⚠️  Category ${category.title} (ID ${category.id}) not verified after upsert — skipping its poems`, logFile);
      categoriesProcessed++;
      continue;
    }

    // 2c. Collect poem summaries recursively
    let poemSummaries: Array<{ id: number; title: string }> = [];
    try {
      poemSummaries = await collectPoemSummaries(category.id);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      log(`⚠️  Failed to collect poems for category ${category.title}: ${msg}`, logFile);
      categoriesProcessed++;
      continue;
    }

    // 2d. Fetch poems and stage for insert
    const poemBatch: Array<{
      id: number;
      poet_id: number;
      category_id: number;
      title: string;
      verses: string;
      verses_array: string[];
    }> = [];

    for (const summary of poemSummaries) {
      if (existingPoemIds.has(summary.id)) {
        continue;
      }

      let poemData: GanjoorPoemResponse | undefined;
      try {
        poemData = await fetchWithRetry<GanjoorPoemResponse>(`${GANJOOR_BASE}/poem/${summary.id}`);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        log(`⚠️  Poem ${summary.id} failed after retries: ${msg}`, logFile);
        failedCount++;
        recordResult(false);
        if (shouldPause()) {
          log(`⚠️  Error rate exceeded ${ERROR_RATE_THRESHOLD * 100}% — pausing ${LONG_PAUSE_MS / 1000}s`, logFile);
          await sleep(LONG_PAUSE_MS);
          recentResults.length = 0;
        }
        continue;
      }

      if (!poemData) {
        failedCount++;
        recordResult(false);
        continue;
      }

      const verses = extractVerses(poemData);
      if (verses.length === 0) {
        log(`⚠️  Poem ${summary.id} has no verses — skipping`, logFile);
        noVerses++;
        recordResult(true);
        await sleep(BASE_DELAY_MS);
        if (shouldPause()) {
          log(`⚠️  Error rate exceeded ${ERROR_RATE_THRESHOLD * 100}% — pausing ${LONG_PAUSE_MS / 1000}s`, logFile);
          await sleep(LONG_PAUSE_MS);
          recentResults.length = 0;
        }
        continue;
      }

      poemBatch.push({
        id: poemData.id ?? summary.id,
        poet_id: poetId,
        category_id: category.id,
        title: poemData.title || summary.title,
        verses: verses.join(' '),
        verses_array: verses,
      });

      recordResult(true);
      await sleep(BASE_DELAY_MS);

      if (shouldPause()) {
        log(`⚠️  Error rate exceeded ${ERROR_RATE_THRESHOLD * 100}% — pausing ${LONG_PAUSE_MS / 1000}s`, logFile);
        await sleep(LONG_PAUSE_MS);
        recentResults.length = 0;
      }
    }

    // 2e. Upsert staged poems in batches
    let categoryImportedCount = 0;
    for (let i = 0; i < poemBatch.length; i += SUPABASE_BATCH_SIZE) {
      const batch = poemBatch.slice(i, i + SUPABASE_BATCH_SIZE);
      const { error: batchError } = await supabase.from('poems').upsert(batch, { onConflict: 'id' });
      if (batchError) {
        log(`⚠️  Poem batch upsert error: ${batchError.message} — IDs: ${batch.map(p => p.id).join(', ')}`, logFile);
        failedCount += batch.length;
      } else {
        categoryImportedCount += batch.length;
      }
    }

    // 2f. Update category poem_count to verified count
    const { count: verifiedCategoryPoemCount, error: countError } = await supabase
      .from('poems')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', category.id)
      .eq('poet_id', poetId);

    if (countError) {
      log(`⚠️  Failed to count poems for category ${category.title}: ${countError.message}`, logFile);
    } else {
      const exactCount = verifiedCategoryPoemCount ?? 0;
      const { error: updateError } = await supabase
        .from('categories')
        .update({ poem_count: exactCount })
        .eq('id', category.id);
      if (updateError) {
        log(`⚠️  Failed to update poem_count for category ${category.title}: ${updateError.message}`, logFile);
      }
    }

    categoriesProcessed++;
    verifiedPoems += categoryImportedCount;
  }

  // 3. Verify poet has poems
  const { count: finalCount, error: finalCountError } = await supabase
    .from('poems')
    .select('*', { count: 'exact', head: true })
    .eq('poet_id', poetId);

  const finalVerifiedPoems = finalCountError ? verifiedPoems : (finalCount ?? 0);
  const elapsedMs = Date.now() - poetStart;
  const elapsedMin = Math.floor(elapsedMs / 60000);
  const elapsedSec = Math.floor((elapsedMs % 60000) / 1000);
  const elapsed = `${elapsedMin}m ${elapsedSec}s`;

  if (finalVerifiedPoems > 0) {
    if (!progress.completedPoetIds.includes(poetId)) {
      progress.completedPoetIds.push(poetId);
    }
    saveProgress(progress);
    log(
      `✅ ${poetName} (ID ${poetId}): ${categoriesProcessed} categories, ${finalVerifiedPoems} poems verified in Supabase (${noVerses} skipped no-verse, ${failedCount} failed) — ${elapsed}`,
      logFile
    );
  } else {
    log(
      `❌ ${poetName} (ID ${poetId}): ${categoriesProcessed} categories, 0 poems verified in Supabase (${noVerses} skipped no-verse, ${failedCount} failed) — ${elapsed}. Poet NOT marked complete.`,
      logFile
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STARTUP RECONCILIATION
// ─────────────────────────────────────────────────────────────────────────────

async function reconcileProgress(supabase: SupabaseClient, progress: ProgressFile, logFile: string): Promise<void> {
  const validated: number[] = [];
  let dropped = 0;
  for (const id of progress.completedPoetIds) {
    const { count, error } = await supabase
      .from('poems')
      .select('*', { count: 'exact', head: true })
      .eq('poet_id', id);
    if (error) {
      log(`⚠️  Could not verify poet ${id} during reconciliation: ${error.message}`, logFile);
      continue;
    }
    if ((count ?? 0) > 0) {
      validated.push(id);
    } else {
      dropped++;
    }
  }
  if (dropped > 0) {
    log(`⚠️  Dropped ${dropped} falsely-marked-complete poet(s) from progress file`, logFile);
  }
  progress.completedPoetIds = validated;
  saveProgress(progress);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const overallStart = Date.now();

  // 1. Env
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 2. Log file
  const today = new Date().toISOString().split('T')[0];
  const logFile = `scripts/migration-${today}.log`;

  // 3. Progress + reconciliation
  const progress = loadProgress();

  // 4. SIGINT handler
  let shuttingDown = false;
  process.on('SIGINT', () => {
    if (shuttingDown) return;
    shuttingDown = true;
    saveProgress(progress);
    console.log('\n⚠️  Interrupted — progress saved. Re-run to continue.');
    process.exit(0);
  });

  log('🚀 Starting full Ganjoor → Supabase migration', logFile);
  log(`📋 Progress file: ${PROGRESS_FILE}`, logFile);
  log(`📝 Log file: ${logFile}`, logFile);

  await reconcileProgress(supabase, progress, logFile);

  // 5. Existing poem IDs
  log('📊 Loading existing poem IDs from Supabase...', logFile);
  const existingPoemIds = new Set<number>();
  let from = 0;
  const pageSize = 10_000;
  while (true) {
    const { data, error } = await supabase.from('poems').select('id').range(from, from + pageSize - 1);
    if (error) throw new Error(`Failed to load existing poems: ${error.message}`);
    if (!data || data.length === 0) break;
    for (const row of data) {
      if (typeof row.id === 'number') {
        existingPoemIds.add(row.id);
      }
    }
    if (data.length < pageSize) break;
    from += pageSize;
  }
  log(`📊 Found ${existingPoemIds.size} poems already in Supabase — will skip these`, logFile);
  const startupPoemCount = existingPoemIds.size;

  // 6. Phase 1
  const confirmedPoets = await importAllPoets(supabase, logFile);

  // 7. Work list
  const workList: Array<{ id: number; name: string }> = [];
  for (const [id, name] of confirmedPoets) {
    if (!progress.completedPoetIds.includes(id)) {
      workList.push({ id, name });
    }
  }
  log(
    `${confirmedPoets.size} poets confirmed, ${progress.completedPoetIds.length} already complete, ${workList.length} to import`,
    logFile
  );

  if (workList.length === 0) {
    log('🎉 All confirmed poets already imported! Nothing to do.', logFile);
  }

  // 8. Import each poet
  for (let i = 0; i < workList.length; i++) {
    const poet = workList[i];
    log(`\n${'═'.repeat(60)}`, logFile);
    log(`📚 [${i + 1}/${workList.length}] ${poet.name} (ID: ${poet.id})`, logFile);
    log(`${'═'.repeat(60)}`, logFile);

    try {
      await importPoetContent(poet.id, poet.name, supabase, existingPoemIds, logFile, progress);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      log(`❌ Fatal error importing ${poet.name}: ${msg}`, logFile);
    }

    if (i < workList.length - 1) {
      await sleep(500);
    }
  }

  // 10. Final self-audit
  const { count: poetsCount } = await supabase.from('poets').select('*', { count: 'exact', head: true });
  const { count: categoriesCount } = await supabase.from('categories').select('*', { count: 'exact', head: true });
  const { count: poemsCount } = await supabase.from('poems').select('*', { count: 'exact', head: true });

  const poetsCompletedThisRun = progress.completedPoetIds.length;
  const totalMs = Date.now() - overallStart;
  const totalMin = Math.floor(totalMs / 60000);
  const totalSec = Math.floor((totalMs % 60000) / 1000);

  log(`\n${'═'.repeat(60)}`, logFile);
  log('📊 FINAL SELF-AUDIT', logFile);
  log(`${'═'.repeat(60)}`, logFile);
  log(`Poets in Supabase: ${poetsCount ?? 0}`, logFile);
  log(`Categories in Supabase: ${categoriesCount ?? 0}`, logFile);
  log(`Poems in Supabase: ${poemsCount ?? 0}`, logFile);
  log(`Poets fully completed this run: ${poetsCompletedThisRun}`, logFile);
  log(`Total time elapsed: ${totalMin}m ${totalSec}s`, logFile);

  const finalPoemCount = poemsCount ?? 0;
  const delta = finalPoemCount - startupPoemCount;
  if (delta > 0) {
    log(`✅ Import added ${delta} poems`, logFile);
  } else {
    log(`❌ WARNING: poem count did not increase — investigate before trusting this run.`, logFile);
  }
  log(`${'═'.repeat(60)}`, logFile);
}

main().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
