/**
 * Import Famous Poets from Ganjoor API to Supabase
 * 
 * This script fetches poets, categories, and poems from Ganjoor API
 * and imports them into Supabase with proper relationships.
 * 
 * Usage: npx tsx scripts/import-famous-poets.ts
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

// Famous poet IDs from Ganjoor API
const FAMOUS_POETS = [
  { id: 2, name: 'حافظ' },
  { id: 7, name: 'سعدی' },
  { id: 5, name: 'مولوی' },
  { id: 4, name: 'فردوسی' },
  { id: 9, name: 'عطار' },
  { id: 6, name: 'نظامی' },
];

interface GanjoorPoet {
  id: number;
  name: string;
  description: string;
  birthYearInLHijri?: number;
  deathYearInLHijri?: number;
  cat?: GanjoorCategory;
}

interface GanjoorCategory {
  id: number;
  title: string;
  urlSlug: string;
  children?: GanjoorCategory[];
}

interface GanjoorPoem {
  id: number;
  title: string;
  verses: Array<{
    vOrder: number;
    position: number;
    text: string;
  }>;
}

/**
 * Fetch poet data from Ganjoor API
 */
async function fetchPoetFromGanjoor(poetId: number): Promise<GanjoorPoet> {
  const response = await fetch(`https://api.ganjoor.net/api/ganjoor/poet/${poetId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch poet ${poetId}: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch category poems from Ganjoor API
 */
async function fetchCategoryPoems(poetId: number, catId: number): Promise<GanjoorPoem[]> {
  const response = await fetch(
    `https://api.ganjoor.net/api/ganjoor/poet/${poetId}/category/${catId}?poems=true`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch category ${catId}: ${response.statusText}`);
  }
  const data = await response.json();
  return data.cat?.poems || [];
}

/**
 * Flatten category tree to get all leaf categories
 */
function flattenCategories(category: GanjoorCategory, poetId: number): Array<{ id: number; title: string; urlSlug: string; poetId: number; parentId: number | null }> {
  const result: Array<{ id: number; title: string; urlSlug: string; poetId: number; parentId: number | null }> = [];
  
  function traverse(cat: GanjoorCategory, parentId: number | null = null) {
    result.push({
      id: cat.id,
      title: cat.title,
      urlSlug: cat.urlSlug,
      poetId: poetId,
      parentId: parentId,
    });
    
    if (cat.children && cat.children.length > 0) {
      for (const child of cat.children) {
        traverse(child, cat.id);
      }
    }
  }
  
  traverse(category);
  return result;
}

/**
 * Import a single poet with all categories and poems
 */
async function importPoet(poetId: number, poetName: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📚 Importing: ${poetName} (ID: ${poetId})`);
  console.log('='.repeat(60));
  
  try {
    // Step 1: Fetch poet data from Ganjoor
    console.log('📡 Fetching poet data from Ganjoor API...');
    const ganjoorPoet = await fetchPoetFromGanjoor(poetId);
    
    // Step 2: Upsert poet into Supabase
    console.log('💾 Upserting poet into Supabase...');
    const { error: poetError } = await supabase
      .from('poets')
      .upsert({
        id: ganjoorPoet.id,
        name: ganjoorPoet.name,
        slug: ganjoorPoet.cat?.urlSlug || '',
        description: ganjoorPoet.description || '',
        birth_year: ganjoorPoet.birthYearInLHijri || null,
        death_year: ganjoorPoet.deathYearInLHijri || null,
      }, { onConflict: 'id' });
    
    if (poetError) {
      console.error('❌ Poet upsert failed:', poetError);
      return;
    }
    console.log('✅ Poet upserted');
    
    // Step 3: Get all categories
    if (!ganjoorPoet.cat) {
      console.log('⚠️  No categories found for this poet');
      return;
    }
    
    const categories = flattenCategories(ganjoorPoet.cat, poetId);
    console.log(`📂 Found ${categories.length} categories`);
    
    // Step 4: Upsert categories
    console.log('💾 Upserting categories into Supabase...');
    for (const category of categories) {
      const { error: catError } = await supabase
        .from('categories')
        .upsert({
          id: category.id,
          poet_id: category.poetId,
          title: category.title,
          url_slug: category.urlSlug,
          poem_count: 0, // Will be updated after importing poems
        }, { onConflict: 'id' });
      
      if (catError) {
        console.error(`❌ Category ${category.id} failed:`, catError);
      }
    }
    console.log('✅ Categories upserted');
    
    // Step 5: Import poems for each category
    console.log('📜 Importing poems...');
    let totalPoems = 0;
    
    for (const category of categories) {
      // Skip parent categories (they don't have poems, only children do)
      const hasChildren = categories.some(c => c.parentId === category.id);
      if (hasChildren) {
        console.log(`  ⏭️  Skipping parent category: ${category.title}`);
        continue;
      }
      
      try {
        const poems = await fetchCategoryPoems(poetId, category.id);
        
        if (poems.length === 0) {
          console.log(`  ⚠️  ${category.title}: No poems`);
          continue;
        }
        
        console.log(`  📝 ${category.title}: ${poems.length} poems`);
        
        // Upsert poems in batches of 50
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
            console.error(`    ❌ Poem batch ${i}-${i + batch.length} failed:`, poemError);
          }
        }
        
        totalPoems += poems.length;
        
        // Update category poem_count
        await supabase
          .from('categories')
          .update({ poem_count: poems.length })
          .eq('id', category.id);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`  ❌ Failed to import poems for ${category.title}:`, error);
      }
    }
    
    console.log(`✅ Imported ${totalPoems} poems for ${poetName}`);
    
  } catch (error) {
    console.error(`❌ Failed to import ${poetName}:`, error);
  }
}

/**
 * Main import function
 */
async function main() {
  console.log('🚀 Starting Famous Poets Import');
  console.log('Source: Ganjoor API (https://api.ganjoor.net)');
  console.log('Destination: Supabase\n');
  
  const startTime = Date.now();
  
  for (const poet of FAMOUS_POETS) {
    await importPoet(poet.id, poet.name);
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Import Complete!');
  console.log('='.repeat(60));
  console.log(`⏱️  Total time: ${duration}s`);
  console.log('\n📊 Run audit script to verify:');
  console.log('   npx tsx scripts/audit-supabase-data.ts\n');
}

main().catch(console.error);

