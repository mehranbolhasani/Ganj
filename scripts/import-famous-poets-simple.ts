/**
 * Simple Import Script Using Existing ganjoorApi
 * 
 * This version uses the existing working API client instead of
 * reimplementing the API calls.
 * 
 * Usage: npx tsx scripts/import-famous-poets-simple.ts
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
 * Import a single poet with all categories and poems
 */
async function importPoet(poetId: number, poetName: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📚 Importing: ${poetName} (ID: ${poetId})`);
  console.log('='.repeat(60));
  
  try {
    // Step 1: Fetch poet data using our existing API client
    console.log('📡 Fetching poet data from Ganjoor API...');
    const { poet, categories } = await ganjoorApi.getPoet(poetId);
    
    console.log('📋 Poet data:', {
      id: poet.id,
      name: poet.name,
      hasDescription: !!poet.description,
      categoriesCount: categories.length,
    });
    
    // Step 2: Upsert poet into Supabase
    console.log('💾 Upserting poet into Supabase...');
    const { error: poetError } = await supabase
      .from('poets')
      .upsert({
        id: poet.id,
        name: poet.name,
        slug: poet.slug || '',
        description: poet.description || '',
        birth_year: poet.birthYear || null,
        death_year: poet.deathYear || null,
      }, { onConflict: 'id' });
    
    if (poetError) {
      console.error('❌ Poet upsert failed:', poetError);
      return;
    }
    console.log('✅ Poet upserted');
    
    // Step 3: Upsert categories
    console.log(`📂 Found ${categories.length} categories`);
    console.log('💾 Upserting categories into Supabase...');
    
    for (const category of categories) {
      const { error: catError } = await supabase
        .from('categories')
        .upsert({
          id: category.id,
          poet_id: category.poetId,
          title: category.title,
          url_slug: '', // ganjoorApi doesn't provide this
          poem_count: 0, // Will be updated after importing poems
        }, { onConflict: 'id' });
      
      if (catError) {
        console.error(`❌ Category ${category.id} failed:`, catError);
      }
    }
    console.log('✅ Categories upserted');
    
    // Step 4: Import poems for each category
    console.log('📜 Importing poems...');
    let totalPoems = 0;
    
    for (const category of categories) {
      try {
        // Use existing API to fetch poems
        const poems = await ganjoorApi.getCategoryPoems(poetId, category.id);
        
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
            poet_id: poem.poetId,
            category_id: poem.categoryId,
            title: poem.title,
            verses_array: poem.verses,
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
        await new Promise(resolve => setTimeout(resolve, 200));
        
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
  console.log('🚀 Starting Famous Poets Import (Simple Version)');
  console.log('Using: Existing ganjoorApi client');
  console.log('Destination: Supabase\n');
  
  const startTime = Date.now();
  
  for (const poet of FAMOUS_POETS) {
    await importPoet(poet.id, poet.name);
  }
  
  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Import Complete!');
  console.log('='.repeat(60));
  console.log(`⏱️  Total time: ${duration} minutes`);
  console.log('\n📊 Run audit script to verify:');
  console.log('   npx tsx scripts/audit-supabase-data.ts\n');
}

main().catch(console.error);

