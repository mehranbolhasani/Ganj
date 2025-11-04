/**
 * Standalone Import Script for Supabase
 * No dependencies on Next.js or browser APIs
 * 
 * Usage: npx tsx scripts/import-to-supabase.ts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Load environment variables
const envLocalPath = resolve(process.cwd(), '.env.local');
if (existsSync(envLocalPath)) {
  config({ path: envLocalPath });
  console.log('✅ Loaded .env.local\n');
} else {
  config({ path: resolve(process.cwd(), '.env') });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const API_BASE_URL = 'https://api.ganjoor.net/api/ganjoor';

// Famous poet IDs
const FAMOUS_POETS = [
  { id: 2, name: 'حافظ' },
  { id: 7, name: 'سعدی' },
  { id: 5, name: 'مولوی' },
  { id: 4, name: 'فردوسی' },
  { id: 9, name: 'عطار' },
  { id: 6, name: 'نظامی' },
];

interface ApiPoet {
  id: number;
  name: string;
  description?: string;
  birthYearInLHijri?: number;
  deathYearInLHijri?: number;
}

interface ApiCategory {
  id: number;
  title: string;
  urlSlug?: string;
}

interface ApiPoem {
  id: number;
  title: string;
}

interface ApiVerse {
  vOrder: number;
  position: number;
  text: string;
}

/**
 * Fetch from Ganjoor API with retry
 */
async function fetchGanjoor(endpoint: string, retries = 3): Promise<unknown> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (i === retries - 1) {
          throw new Error(`API request failed: ${response.statusText} (${response.status})`);
        }
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
        continue;
      }

      return await response.json();
    } catch (error) {
      if (i === retries - 1) {
        throw error;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
  throw new Error('Failed after all retries');
}

/**
 * Import a single poet
 */
async function importPoet(poetId: number, poetName: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📚 Importing: ${poetName} (ID: ${poetId})`);
  console.log('='.repeat(60));

  try {
    // Step 1: Fetch poet data
    console.log('📡 Fetching poet data...');
    const poetData = await fetchGanjoor(`/poet/${poetId}`) as {
      poet: ApiPoet;
      cat: ApiCategory & { children?: ApiCategory[] };
    };

    if (!poetData.poet) {
      console.error('❌ No poet data found');
      return;
    }

    console.log(`📋 Poet: ${poetData.poet.name}`);

    // Step 2: Upsert poet
    const { error: poetError } = await supabase
      .from('poets')
      .upsert({
        id: poetData.poet.id,
        name: poetData.poet.name,
        slug: poetData.cat?.urlSlug || '',
        description: poetData.poet.description || '',
        birth_year: poetData.poet.birthYearInLHijri || null,
        death_year: poetData.poet.deathYearInLHijri || null,
      }, { onConflict: 'id' });

    if (poetError) {
      console.error('❌ Poet upsert failed:', poetError.message);
      return;
    }
    console.log('✅ Poet upserted');

    // Step 3: Get all categories (flatten tree)
    const categories: ApiCategory[] = [];
    function flattenCategories(cat: ApiCategory & { children?: ApiCategory[] }) {
      categories.push(cat);
      if (cat.children) {
        cat.children.forEach(child => flattenCategories(child));
      }
    }
    if (poetData.cat) {
      flattenCategories(poetData.cat);
    }

    console.log(`📂 Found ${categories.length} categories`);

    // Step 4: Upsert categories
    for (const category of categories) {
      await supabase
        .from('categories')
        .upsert({
          id: category.id,
          poet_id: poetId,
          title: category.title,
          url_slug: category.urlSlug || '',
          poem_count: 0,
        }, { onConflict: 'id' });
    }
    console.log('✅ Categories upserted');

    // Step 5: Import poems for each leaf category
    console.log('📜 Importing poems...');
    let totalPoems = 0;

    for (const category of categories) {
      // Skip if has children (parent category)
      const hasChildren = categories.some(c => 
        categories.some(child => child.id !== category.id)
      );

      try {
        // Fetch category with poems
        const catData = await fetchGanjoor(`/poet/${poetId}/category/${category.id}?poems=true`) as {
          cat?: {
            poems?: Array<{
              id: number;
              title: string;
              verses: ApiVerse[];
            }>;
          };
        };

        const poems = catData.cat?.poems || [];

        if (poems.length === 0) {
          console.log(`  ⚠️  ${category.title}: No poems`);
          continue;
        }

        console.log(`  📝 ${category.title}: ${poems.length} poems`);

        // Insert poems in batches
        const batchSize = 50;
        for (let i = 0; i < poems.length; i += batchSize) {
          const batch = poems.slice(i, i + batchSize);

          const poemsData = batch.map(poem => ({
            id: poem.id,
            poet_id: poetId,
            category_id: category.id,
            title: poem.title,
            verses_array: poem.verses
              .sort((a, b) => a.vOrder - b.vOrder)
              .map(v => v.text),
          }));

          const { error: poemError } = await supabase
            .from('poems')
            .upsert(poemsData, { onConflict: 'id' });

          if (poemError) {
            console.error(`    ❌ Batch failed:`, poemError.message);
          }
        }

        totalPoems += poems.length;

        // Update category poem count
        await supabase
          .from('categories')
          .update({ poem_count: poems.length })
          .eq('id', category.id);

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        const err = error as Error;
        if (!err.message.includes('404') && !err.message.includes('Not Found')) {
          console.error(`  ❌ ${category.title}:`, err.message);
        }
      }
    }

    console.log(`✅ Imported ${totalPoems} poems for ${poetName}`);

  } catch (error) {
    console.error(`❌ Failed to import ${poetName}:`, error);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting Supabase Import');
  console.log('Source: Ganjoor API');
  console.log('Destination: Supabase\n');

  const startTime = Date.now();

  for (const poet of FAMOUS_POETS) {
    await importPoet(poet.id, poet.name);
  }

  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);

  console.log('\n' + '='.repeat(60));
  console.log('✅ Import Complete!');
  console.log('='.repeat(60));
  console.log(`⏱️  Total time: ${duration} minutes\n');
}

main().catch(console.error);

