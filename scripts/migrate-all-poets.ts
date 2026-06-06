#!/usr/bin/env node
/**
 * Robust Full Migration Script
 * Imports ALL poets from the Ganjoor API into Supabase.
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
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
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
const MAX_POEM_RETRIES = 3;
const PROGRESS_FILE = 'scripts/migration-progress.json';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface ProgressFile {
  completedPoetIds: number[];
  completedCategoryIds: number[];
  failedPoemIds: number[];
  startedAt: string;
  lastUpdatedAt: string;
}

interface GanjoorPoet {
  id: number;
  name: string;
  fullUrl?: string;
  description?: string;
  birthYearInLHijri?: number;
  deathYearInLHijri?: number;
}

interface GanjoorCategory {
  id: number;
  title: string;
  urlSlug?: string;
}

interface GanjoorPoemSummary {
  id: number;
  title: string;
}

interface GanjoorPoemFull {
  id: number;
  title: string;
  verses?: Array<{ text: string }>;
  poemHtml?: string;
  html?: string;
  plainText?: string;
  fullText?: string;
  body?: string;
  category?: {
    poet?: { id: number; name: string };
    cat?: { id: number; title: string };
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL STATE
// ─────────────────────────────────────────────────────────────────────────────

const recentResults: boolean[] = [];

let totalPoetsImported = 0;
let totalCategoriesImported = 0;
let totalPoemsImported = 0;
let totalPoemsSkipped = 0;
let totalPoemsWithoutVerses = 0;
let totalPoemsFailed = 0;

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
      // Validate shape
      return {
        completedPoetIds: Array.isArray(parsed.completedPoetIds) ? parsed.completedPoetIds : [],
        completedCategoryIds: Array.isArray(parsed.completedCategoryIds) ? parsed.completedCategoryIds : [],
        failedPoemIds: Array.isArray(parsed.failedPoemIds) ? parsed.failedPoemIds : [],
        startedAt: typeof parsed.startedAt === 'string' ? parsed.startedAt : new Date().toISOString(),
        lastUpdatedAt: typeof parsed.lastUpdatedAt === 'string' ? parsed.lastUpdatedAt : new Date().toISOString(),
      };
    } catch {
      console.warn('⚠️  Failed to parse progress file — starting fresh.');
    }
  }
  return {
    completedPoetIds: [],
    completedCategoryIds: [],
    failedPoemIds: [],
    startedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
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

async function fetchWithTimeout<T>(url: string, timeoutMs: number): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
    (error as Error & { status: number }).status = response.status;
    throw error;
  }

  return response.json() as Promise<T>;
}

async function fetchWithRetry<T>(url: string, retries: number): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const data = await fetchWithTimeout<T>(url, FETCH_TIMEOUT_MS);
      return data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const status = (lastError as Error & { status?: number }).status;

      if (status === 429 || (status && status >= 500)) {
        if (attempt < retries) {
          await sleep(BACKOFF_DELAY_MS);
          continue;
        }
      }
      throw lastError;
    }
  }

  throw lastError || new Error(`Failed after ${retries} retries`);
}

// ─────────────────────────────────────────────────────────────────────────────
// VERSE & SLUG HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function extractVerses(poem: GanjoorPoemFull): string[] {
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
// PREFLIGHT
// ─────────────────────────────────────────────────────────────────────────────

async function loadExistingPoemIds(supabase: SupabaseClient): Promise<Set<number>> {
  const existing = new Set<number>();
  let from = 0;
  const pageSize = 10_000;

  while (true) {
    const { data, error } = await supabase
      .from('poems')
      .select('id')
      .range(from, from + pageSize - 1);

    if (error) throw new Error(`Failed to load existing poems: ${error.message}`);
    if (!data || data.length === 0) break;

    data.forEach(row => existing.add(row.id));
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return existing;
}

// ─────────────────────────────────────────────────────────────────────────────
// POEM COLLECTION (recursive)
// ─────────────────────────────────────────────────────────────────────────────

async function collectPoemIdsFromCategory(categoryId: number): Promise<GanjoorPoemSummary[]> {
  const poems: GanjoorPoemSummary[] = [];
  const visited = new Set<number>();

  async function traverse(catId: number) {
    if (visited.has(catId)) return;
    visited.add(catId);

    const data = await fetchWithRetry<{
      cat: {
        poems?: Array<{ id: number; title: string }>;
        children?: Array<{ id: number; title: string }>;
      };
    }>(`${GANJOOR_BASE}/cat/${catId}`, MAX_POEM_RETRIES);

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

// ─────────────────────────────────────────────────────────────────────────────
// POET IMPORT
// ─────────────────────────────────────────────────────────────────────────────

async function importPoet(
  poetId: number,
  poetName: string,
  supabase: SupabaseClient,
  progress: ProgressFile,
  existingPoemIds: Set<number>,
  logFile: string
): Promise<void> {
  const poetStart = Date.now();
  let categoriesProcessed = 0;
  let poemsSaved = 0;
  let poemsSkipped = 0;
  let poemsFailed = 0;
  let poemsWithoutVerses = 0;

  // 1. Upsert poet
  try {
    const poetData = await fetchWithRetry<GanjoorPoet>(`${GANJOOR_BASE}/poet/${poetId}`, MAX_POEM_RETRIES);
    const { error: poetError } = await supabase.from('poets').upsert({
      id: poetData.id,
      name: poetData.name,
      slug: slugFromFullUrl(poetData.fullUrl),
      description: poetData.description || '',
      birth_year: poetData.birthYearInLHijri || null,
      death_year: poetData.deathYearInLHijri || null,
    });
    if (poetError) {
      log(`⚠️  Poet upsert error for ${poetName}: ${poetError.message}`, logFile);
    }
  } catch (error) {
    log(`⚠️  Poet fetch/upsert failed for ${poetName} (ID: ${poetId}): ${error instanceof Error ? error.message : String(error)}`, logFile);
  }

  // 2. Fetch categories
  let categories: GanjoorCategory[] = [];
  try {
    const poetResponse = await fetchWithRetry<{
      cat: {
        children?: Array<{ id: number; title: string; urlSlug?: string }>;
      };
    }>(`${GANJOOR_BASE}/poet/${poetId}`, MAX_POEM_RETRIES);
    categories = poetResponse.cat.children?.map(c => ({
      id: c.id,
      title: c.title,
      urlSlug: c.urlSlug || '',
    })) || [];
  } catch (error) {
    log(`❌ Failed to fetch categories for ${poetName}: ${error instanceof Error ? error.message : String(error)}`, logFile);
    return;
  }

  // 3. Process each category
  for (const category of categories) {
    if (progress.completedCategoryIds.includes(category.id)) {
      continue;
    }

    // 3a. Upsert category
    const { error: catError } = await supabase.from('categories').upsert({
      id: category.id,
      poet_id: poetId,
      title: category.title,
      url_slug: category.urlSlug || '',
      poem_count: 0,
    });
    if (catError) {
      log(`⚠️  Category upsert error ${category.title}: ${catError.message}`, logFile);
    }

    // 3b. Collect all poems recursively
    let poemList: GanjoorPoemSummary[] = [];
    try {
      poemList = await collectPoemIdsFromCategory(category.id);
    } catch (error) {
      log(`⚠️  Failed to collect poems for category ${category.title}: ${error instanceof Error ? error.message : String(error)}`, logFile);
      continue;
    }

    log(`📂 Category: ${category.title} (ID: ${category.id}) — ${poemList.length} poems`, logFile);

    // 3c. Fetch poems and accumulate batch
    const poemBatch: Array<{
      id: number;
      poet_id: number;
      category_id: number;
      title: string;
      verses: string;
      verses_array: string[];
    }> = [];

    let categoryPoemsSaved = 0;
    let categoryPoemsSkipped = 0;
    let categoryPoemsFailed = 0;
    let categoryPoemsNoVerses = 0;

    for (const poemSummary of poemList) {
      // Skip if already in DB
      if (existingPoemIds.has(poemSummary.id)) {
        poemsSkipped++;
        totalPoemsSkipped++;
        categoryPoemsSkipped++;
        continue;
      }

      // Skip if permanently failed
      if (progress.failedPoemIds.includes(poemSummary.id)) {
        poemsSkipped++;
        totalPoemsSkipped++;
        categoryPoemsSkipped++;
        continue;
      }

      // Adaptive delay
      await sleep(BASE_DELAY_MS);

      let poemData: GanjoorPoemFull | undefined;
      let fetchSuccess = false;
      try {
        poemData = await fetchWithRetry<GanjoorPoemFull>(
          `${GANJOOR_BASE}/poem/${poemSummary.id}`,
          MAX_POEM_RETRIES
        );
        fetchSuccess = true;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        log(`⚠️  Poem ${poemSummary.id} failed after retries: ${msg}`, logFile);
        poemsFailed++;
        totalPoemsFailed++;
        categoryPoemsFailed++;
        if (!progress.failedPoemIds.includes(poemSummary.id)) {
          progress.failedPoemIds.push(poemSummary.id);
        }
        recordResult(false);

        if (shouldPause()) {
          log(`⚠️  Error rate exceeded ${ERROR_RATE_THRESHOLD * 100}% — pausing ${LONG_PAUSE_MS / 1000}s`, logFile);
          await sleep(LONG_PAUSE_MS);
          recentResults.length = 0;
        }
        continue;
      }

      if (!poemData) continue;

      const verses = extractVerses(poemData);
      if (verses.length === 0) {
        log(`⚠️  Poem ${poemSummary.id} has no verses — skipping`, logFile);
        poemsWithoutVerses++;
        totalPoemsWithoutVerses++;
        categoryPoemsNoVerses++;
        recordResult(true);
        continue;
      }

      poemBatch.push({
        id: poemData.id,
        poet_id: poetId,
        category_id: category.id,
        title: poemData.title || poemSummary.title,
        verses: verses.join(' '),
        verses_array: verses,
      });

      poemsSaved++;
      categoryPoemsSaved++;
      totalPoemsImported++;
      recordResult(true);

      // Upsert batch when full
      if (poemBatch.length >= SUPABASE_BATCH_SIZE) {
        try {
          const { error: batchError } = await supabase.from('poems').upsert(poemBatch);
          if (batchError) {
            log(`⚠️  Batch upsert error: ${batchError.message} — IDs: ${poemBatch.map(p => p.id).join(', ')}`, logFile);
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          log(`⚠️  Batch upsert exception: ${msg} — IDs: ${poemBatch.map(p => p.id).join(', ')}`, logFile);
        }
        poemBatch.length = 0;
      }

      if (shouldPause()) {
        log(`⚠️  Error rate exceeded ${ERROR_RATE_THRESHOLD * 100}% — pausing ${LONG_PAUSE_MS / 1000}s`, logFile);
        await sleep(LONG_PAUSE_MS);
        recentResults.length = 0;
      }
    }

    // Upsert remaining poems in batch
    if (poemBatch.length > 0) {
      try {
        const { error: batchError } = await supabase.from('poems').upsert(poemBatch);
        if (batchError) {
          log(`⚠️  Final batch upsert error for category ${category.title}: ${batchError.message} — IDs: ${poemBatch.map(p => p.id).join(', ')}`, logFile);
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        log(`⚠️  Final batch upsert exception for category ${category.title}: ${msg} — IDs: ${poemBatch.map(p => p.id).join(', ')}`, logFile);
      }
      poemBatch.length = 0;
    }

    // 3e. Update category poem_count
    const actualSaved = categoryPoemsSaved;
    if (actualSaved > 0) {
      const { error: countError } = await supabase
        .from('categories')
        .update({ poem_count: actualSaved })
        .eq('id', category.id);
      if (countError) {
        log(`⚠️  Failed to update poem_count for category ${category.title}: ${countError.message}`, logFile);
      }
    }

    log(`✅ ${categoryPoemsSaved}/${poemList.length} poems saved (${categoryPoemsSkipped} skipped, ${categoryPoemsFailed} failed, ${categoryPoemsNoVerses} no verses)`, logFile);

    // 3f. Mark category complete
    if (!progress.completedCategoryIds.includes(category.id)) {
      progress.completedCategoryIds.push(category.id);
    }
    categoriesProcessed++;
    totalCategoriesImported++;
    saveProgress(progress);
  }

  // 4. Mark poet complete
  if (!progress.completedPoetIds.includes(poetId)) {
    progress.completedPoetIds.push(poetId);
  }
  saveProgress(progress);

  // 5. Per-poet summary
  totalPoetsImported++;
  const elapsedMs = Date.now() - poetStart;
  const elapsedMin = Math.floor(elapsedMs / 60000);
  const elapsedSec = Math.floor((elapsedMs % 60000) / 1000);
  log(`✅ ${poetName} (ID: ${poetId}): ${categoriesProcessed} categories, ${poemsSaved} poems saved, ${poemsSkipped} skipped, ${poemsFailed} failed — ${elapsedMin}m ${elapsedSec}s`, logFile);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const overallStart = Date.now();

  // 1. Init Supabase
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

  // 3. Progress
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

  // 5. Pre-flight existing poems
  log('📊 Loading existing poem IDs from Supabase...', logFile);
  const existingPoemIds = await loadExistingPoemIds(supabase);
  log(`📊 Found ${existingPoemIds.size} poems already in Supabase — will skip these`, logFile);

  // 6. Fetch all poets
  log('📚 Fetching poet list from Ganjoor...', logFile);
  const allPoets = await fetchWithRetry<GanjoorPoet[]>(`${GANJOOR_BASE}/poets`, MAX_POEM_RETRIES);
  log(`✅ Found ${allPoets.length} poets total`, logFile);

  // 7. Filter already completed
  const poetsToImport = allPoets.filter(p => !progress.completedPoetIds.includes(p.id));
  const completedCount = allPoets.length - poetsToImport.length;
  log(`⏭️  ${completedCount} already complete — importing ${poetsToImport.length} remaining`, logFile);

  if (poetsToImport.length === 0) {
    log('🎉 All poets already imported! Nothing to do.', logFile);
    return;
  }

  // 8. Import each poet
  for (let i = 0; i < poetsToImport.length; i++) {
    const poet = poetsToImport[i];
    log(`\n${'═'.repeat(60)}`, logFile);
    log(`📚 [${i + 1}/${poetsToImport.length}] ${poet.name} (ID: ${poet.id})`, logFile);
    log(`${'═'.repeat(60)}`, logFile);

    try {
      await importPoet(poet.id, poet.name, supabase, progress, existingPoemIds, logFile);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      log(`❌ Fatal error importing ${poet.name}: ${msg}`, logFile);
      // Continue to next poet
    }

    // Brief pause between poets
    if (i < poetsToImport.length - 1) {
      await sleep(500);
    }
  }

  // 9. Final report
  const totalMs = Date.now() - overallStart;
  const totalMin = Math.floor(totalMs / 60000);
  const totalSec = Math.floor((totalMs % 60000) / 1000);

  log(`\n${'═'.repeat(60)}`, logFile);
  log('🎉 MIGRATION COMPLETE', logFile);
  log(`${'═'.repeat(60)}`, logFile);
  log(`📊 Total poets imported: ${totalPoetsImported}`, logFile);
  log(`📁 Total categories imported: ${totalCategoriesImported}`, logFile);
  log(`📖 Total poems imported: ${totalPoemsImported}`, logFile);
  log(`⏭️  Total poems skipped (already existed): ${totalPoemsSkipped}`, logFile);
  log(`📄 Total poems with no verses: ${totalPoemsWithoutVerses}`, logFile);
  log(`❌ Total poems failed after retries: ${totalPoemsFailed}`, logFile);
  log(`⏱️  Total time elapsed: ${totalMin}m ${totalSec}s`, logFile);
  log('📋 Run audit to verify: npx tsx scripts/audit-supabase-data.ts', logFile);
  log(`${'═'.repeat(60)}`, logFile);
}

main().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
