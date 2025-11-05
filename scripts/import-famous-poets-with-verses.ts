/**
 * Import Famous Poets with FULL VERSES
 * 
 * This script properly fetches each poem individually to get verses
 * 
 * Usage: npx tsx scripts/import-famous-poets-with-verses.ts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';
import { ganjoorApi } from '../src/lib/ganjoor-api';

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

// Famous poet IDs
const FAMOUS_POETS = [
  { id: 2, name: 'حافظ' },
  { id: 7, name: 'سعدی' },
  { id: 5, name: 'مولوی' },
  { id: 4, name: 'فردوسی' },
  { id: 9, name: 'عطار' },
  { id: 6, name: 'نظامی' },
];

/**
 * Import a single poet with all categories and poems WITH VERSES
 */
async function importPoet(poetId: number, poetName: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📚 Importing: ${poetName} (ID: ${poetId})`);
  console.log('='.repeat(60));
  
  try {
    // Step 1: Fetch poet data
    console.log('📡 Fetching poet data...');
    const { poet, categories } = await ganjoorApi.getPoet(poetId);
    
    console.log(`✅ Poet: ${poet.name} (${categories.length} categories)`);
    
    // Step 2: Upsert poet
    console.log('💾 Upserting poet...');
    await supabase
      .from('poets')
      .upsert({
        id: poet.id,
        name: poet.name,
        slug: poet.slug || '',
        description: poet.description || '',
        birth_year: poet.birthYear || null,
        death_year: poet.deathYear || null,
      }, { onConflict: 'id' });
    
    // Step 3: Upsert categories
    console.log('💾 Upserting categories...');
    for (const category of categories) {
      await supabase
        .from('categories')
        .upsert({
          id: category.id,
          poet_id: category.poetId,
          title: category.title,
          url_slug: '',
          poem_count: category.poemCount || 0,
        }, { onConflict: 'id' });
    }
    
    // Step 4: Import poems WITH VERSES (fetch individually)
    console.log('📜 Importing poems with verses...');
    let totalPoems = 0;
    let poemsWithVerses = 0;
    let poemsWithoutVerses = 0;
    
    for (const category of categories) {
      try {
        // Get poem IDs from category
        const categoryPoems = await ganjoorApi.getCategoryPoems(poetId, category.id);
        
        if (categoryPoems.length === 0) {
          console.log(`  ⚠️  ${category.title}: No poems`);
          continue;
        }
        
        console.log(`  📝 ${category.title}: Fetching ${categoryPoems.length} poems...`);
        
        // Fetch each poem individually to get verses
        const poemsWithFullVerses = [];
        
        for (const poemMeta of categoryPoems) {
          try {
            // Fetch full poem with verses
            const fullPoem = await ganjoorApi.getPoem(poemMeta.id);
            
            if (fullPoem.verses && fullPoem.verses.length > 0) {
              poemsWithFullVerses.push(fullPoem);
              poemsWithVerses++;
            } else {
              poemsWithoutVerses++;
              console.log(`     ⚠️  Poem ${poemMeta.id} has no verses`);
            }
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 50));
            
          } catch (error) {
            console.error(`     ❌ Failed to fetch poem ${poemMeta.id}`);
          }
        }
        
        // Batch insert poems with verses
        if (poemsWithFullVerses.length > 0) {
          const batchSize = 50;
          for (let i = 0; i < poemsWithFullVerses.length; i += batchSize) {
            const batch = poemsWithFullVerses.slice(i, i + batchSize);
            
            const poemsData = batch.map(poem => ({
              id: poem.id,
              poet_id: poem.poetId,
              category_id: poem.categoryId,
              title: poem.title,
              verses: poem.verses.join(' '), // For full-text search
              verses_array: poem.verses,
            }));
            
            const { error } = await supabase
              .from('poems')
              .upsert(poemsData, { onConflict: 'id' });
            
            if (error) {
              console.error(`     ❌ Batch insert failed:`, error.message);
            }
          }
          
          totalPoems += poemsWithFullVerses.length;
        }
        
        // Update category poem count
        await supabase
          .from('categories')
          .update({ poem_count: poemsWithFullVerses.length })
          .eq('id', category.id);
        
        console.log(`     ✅ Saved ${poemsWithFullVerses.length} poems with verses`);
        
      } catch (error) {
        console.error(`  ❌ Failed ${category.title}:`, error);
      }
    }
    
    console.log(`\n✅ ${poetName}: ${totalPoems} poems (${poemsWithVerses} with verses, ${poemsWithoutVerses} without)`);
    
  } catch (error) {
    console.error(`❌ Failed to import ${poetName}:`, error);
  }
}

/**
 * Main import function
 */
async function main() {
  console.log('🚀 Starting Famous Poets Import WITH VERSES');
  console.log('This will properly fetch each poem to get verse text\n');
  
  const startTime = Date.now();
  
  for (const poet of FAMOUS_POETS) {
    await importPoet(poet.id, poet.name);
  }
  
  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Import Complete!');
  console.log('='.repeat(60));
  console.log(`⏱️  Total time: ${duration} minutes`);
  console.log('\n📊 Run audit to verify verses:');
  console.log('   npx tsx scripts/audit-supabase-data.ts\n');
}

main().catch(console.error);

