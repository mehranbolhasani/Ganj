/**
 * Migration Script: Import Ganjoor API data into Supabase
 * 
 * This script fetches all poets, categories, and poems from the Ganjoor API
 * and imports them into Supabase for fast full-text search.
 * 
 * Run with: npx tsx scripts/migrate-to-supabase.ts
 */

import { createClient } from '@supabase/supabase-js';

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Ganjoor API base URL
const GANJOOR_API_BASE = 'https://api.ganjoor.net/api';

// Configuration
const FAMOUS_POET_COUNT = 15; // Import all poems from top 15 poets
const OTHER_POET_COUNT = 10; // Import limited poems from next 10 poets
const BATCH_SIZE = 50; // Insert in batches
const DELAY_MS = 100; // Delay between API calls

// Utility: Fetch from Ganjoor API
async function fetchGanjoor<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${GANJOOR_API_BASE}${endpoint}`);
  if (!response.ok) {
    throw new Error(`Ganjoor API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

// Utility: Delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Step 1: Import Poets
async function importPoets() {
  console.log('\n📚 Step 1: Importing poets...');
  
  const poetsData = await fetchGanjoor<Array<{
    id: number;
    name: string;
    fullUrl?: string;
    description?: string;
    birthYearInLHijri?: number;
    deathYearInLHijri?: number;
  }>>('/poets');
  
  console.log(`Found ${poetsData.length} poets`);
  
  // Transform and insert
  const poets = poetsData.map(poet => ({
    id: poet.id,
    name: poet.name,
    slug: poet.fullUrl?.replace('/', '') || '',
    description: poet.description || null,
    birth_year: poet.birthYearInLHijri || null,
    death_year: poet.deathYearInLHijri || null,
  }));
  
  // Insert in batches
  for (let i = 0; i < poets.length; i += BATCH_SIZE) {
    const batch = poets.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('poets').upsert(batch);
    
    if (error) {
      console.error(`❌ Error inserting poets batch ${i}-${i + BATCH_SIZE}:`, error);
    } else {
      console.log(`✅ Inserted poets ${i + 1}-${Math.min(i + BATCH_SIZE, poets.length)}/${poets.length}`);
    }
  }
  
  return poets;
}

// Step 2: Import Categories for a poet
async function importCategoriesForPoet(poetId: number, poetName: string) {
  try {
    const data = await fetchGanjoor<{
      poet: { name: string };
      cat: {
        id: number;
        title: string;
        urlSlug?: string;
        children?: Array<{
          id: number;
          title: string;
          urlSlug?: string;
          poemCount?: number;
        }>;
      };
    }>(`/poet/${poetId}`);
    
    const categories: Array<{
      id: number;
      poet_id: number;
      parent_id: number | null;
      title: string;
      url_slug: string | null;
      poem_count: number;
    }> = [];
    
    // Root category
    categories.push({
      id: data.cat.id,
      poet_id: poetId,
      parent_id: null,
      title: data.cat.title,
      url_slug: data.cat.urlSlug || null,
      poem_count: 0,
    });
    
    // Child categories
    if (data.cat.children) {
      for (const child of data.cat.children) {
        categories.push({
          id: child.id,
          poet_id: poetId,
          parent_id: data.cat.id,
          title: child.title,
          url_slug: child.urlSlug || null,
          poem_count: child.poemCount || 0,
        });
      }
    }
    
    // Insert categories
    if (categories.length > 0) {
      const { error } = await supabase.from('categories').upsert(categories);
      
      if (error) {
        console.error(`❌ Error inserting categories for ${poetName}:`, error);
      } else {
        console.log(`✅ Inserted ${categories.length} categories for ${poetName}`);
      }
    }
    
    return categories;
  } catch (error) {
    console.error(`❌ Error fetching categories for poet ${poetId}:`, error);
    return [];
  }
}

// Step 3: Import Poems for a category
async function importPoemsForCategory(
  poetId: number,
  categoryId: number,
  categoryTitle: string,
  fetchFullPoems: boolean
) {
  try {
    const data = await fetchGanjoor<{
      poet: { name: string };
      cat: {
        title: string;
        poems: Array<{
          id: number;
          title: string;
          verses?: Array<{ text: string }>;
        }>;
        children?: Array<{
          id: number;
          title: string;
        }>;
      };
    }>(`/cat/${categoryId}`);
    
    const poems: Array<{
      id: number;
      poet_id: number;
      category_id: number;
      title: string;
      verses: string;
      verses_array: string[];
    }> = [];
    
    // Process direct poems
    if (data.cat.poems && data.cat.poems.length > 0) {
      for (const poem of data.cat.poems) {
        if (fetchFullPoems) {
          // Fetch full poem with all verses
          try {
            const fullPoem = await fetchGanjoor<{
              id: number;
              title: string;
              verses: Array<{ text: string }>;
            }>(`/poem/${poem.id}`);
            
            const versesArray = fullPoem.verses.map(v => v.text).filter(v => v && v.trim());
            const versesText = versesArray.join(' ');
            
            poems.push({
              id: fullPoem.id,
              poet_id: poetId,
              category_id: categoryId,
              title: fullPoem.title,
              verses: versesText,
              verses_array: versesArray,
            });
            
            await delay(DELAY_MS);
          } catch (error) {
            console.warn(`⚠️  Failed to fetch full poem ${poem.id}, using preview`);
            
            // Fallback to preview verses
            const versesArray = poem.verses?.map(v => v.text).filter(v => v && v.trim()) || [];
            const versesText = versesArray.join(' ');
            
            poems.push({
              id: poem.id,
              poet_id: poetId,
              category_id: categoryId,
              title: poem.title,
              verses: versesText,
              verses_array: versesArray,
            });
          }
        } else {
          // Use preview verses only (for non-famous poets)
          const versesArray = poem.verses?.map(v => v.text).filter(v => v && v.trim()) || [];
          const versesText = versesArray.join(' ');
          
          poems.push({
            id: poem.id,
            poet_id: poetId,
            category_id: categoryId,
            title: poem.title,
            verses: versesText,
            verses_array: versesArray,
          });
        }
      }
    }
    
    // Process chapters
    if (data.cat.children) {
      for (const chapter of data.cat.children) {
        await delay(DELAY_MS);
        const chapterPoems = await importPoemsForCategory(poetId, chapter.id, chapter.title, fetchFullPoems);
        poems.push(...chapterPoems);
      }
    }
    
    // Insert poems in batches
    if (poems.length > 0) {
      for (let i = 0; i < poems.length; i += BATCH_SIZE) {
        const batch = poems.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from('poems').upsert(batch);
        
        if (error) {
          console.error(`❌ Error inserting poems for ${categoryTitle}:`, error);
        } else {
          console.log(`   ✅ Inserted ${Math.min(i + BATCH_SIZE, poems.length)}/${poems.length} poems for ${categoryTitle}`);
        }
      }
    }
    
    return poems;
  } catch (error) {
    console.error(`❌ Error fetching poems for category ${categoryId}:`, error);
    return [];
  }
}

// Main migration function
async function migrate() {
  console.log('🚀 Starting Ganjoor → Supabase migration...\n');
  
  const startTime = Date.now();
  
  try {
    // Step 1: Import poets
    const poets = await importPoets();
    
    // Step 2 & 3: Import categories and poems
    console.log('\n📖 Step 2 & 3: Importing categories and poems...');
    
    let totalCategories = 0;
    let totalPoems = 0;
    
    for (let i = 0; i < poets.length; i++) {
      const poet = poets[i];
      const isFamous = i < FAMOUS_POET_COUNT;
      const shouldImport = i < (FAMOUS_POET_COUNT + OTHER_POET_COUNT);
      
      if (!shouldImport) {
        console.log(`⏭️  Skipping ${poet.name} (poet ${i + 1}/${poets.length})`);
        continue;
      }
      
      console.log(`\n📝 [${i + 1}/${poets.length}] Processing ${poet.name}${isFamous ? ' (FAMOUS)' : ''}...`);
      
      // Import categories
      const categories = await importCategoriesForPoet(poet.id, poet.name);
      totalCategories += categories.length;
      
      await delay(DELAY_MS);
      
      // Import poems from top 3 categories
      const topCategories = categories.filter(c => c.parent_id !== null).slice(0, 3);
      
      for (const category of topCategories) {
        console.log(`   📂 Category: ${category.title}`);
        const poems = await importPoemsForCategory(
          poet.id,
          category.id,
          category.title,
          isFamous // Fetch full poems only for famous poets
        );
        totalPoems += poems.length;
        
        await delay(DELAY_MS);
      }
    }
    
    // Step 4: Refresh materialized view
    console.log('\n🔄 Refreshing famous poets view...');
    await supabase.rpc('refresh_famous_poets');
    
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
    
    console.log('\n✅ Migration complete!');
    console.log(`📊 Stats:`);
    console.log(`   - Poets: ${poets.length}`);
    console.log(`   - Categories: ${totalCategories}`);
    console.log(`   - Poems: ${totalPoems}`);
    console.log(`   - Duration: ${duration} minutes`);
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrate();

