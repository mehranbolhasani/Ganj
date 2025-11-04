/**
 * Audit Supabase Data
 * 
 * This script checks what data is currently in Supabase and compares with Ganjoor API
 * Run with: npx tsx scripts/audit-supabase-data.ts
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function auditSupabaseData() {
  console.log('\n📊 Auditing Supabase Data...\n');
  console.log('='.repeat(60));

  try {
    // 1. Count total records
    console.log('\n📈 Total Records:');
    console.log('-'.repeat(60));

    const [poetsCount, categoriesCount, poemsCount] = await Promise.all([
      supabase.from('poets').select('id', { count: 'exact', head: true }),
      supabase.from('categories').select('id', { count: 'exact', head: true }),
      supabase.from('poems').select('id', { count: 'exact', head: true }),
    ]);

    console.log(`Poets:      ${poetsCount.count || 0}`);
    console.log(`Categories: ${categoriesCount.count || 0}`);
    console.log(`Poems:      ${poemsCount.count || 0}`);

    // 2. List all poets
    console.log('\n📚 Poets in Supabase:');
    console.log('-'.repeat(60));

    const { data: poets, error: poetsError } = await supabase
      .from('poets')
      .select('id, name, slug')
      .order('name', { ascending: true });

    if (poetsError) {
      console.error('Error fetching poets:', poetsError);
    } else {
      poets?.forEach((poet, index) => {
        console.log(`${(index + 1).toString().padStart(2, '0')}. ${poet.name} (ID: ${poet.id}, Slug: ${poet.slug})`);
      });
    }

    // 3. Category distribution per poet
    console.log('\n📂 Categories per Poet:');
    console.log('-'.repeat(60));

    const { data: categoryStats, error: categoryError } = await supabase
      .from('categories')
      .select(`
        poet_id,
        poets (
          name
        )
      `);

    if (categoryError) {
      console.error('Error fetching categories:', categoryError);
    } else {
      // Group by poet
      const poetCategoryCount: Record<number, { name: string; count: number }> = {};
      
      categoryStats?.forEach(cat => {
        const poetData = cat.poets as unknown;
        const poet = (Array.isArray(poetData) ? poetData[0] : poetData) as { name: string } | null;
        if (poet) {
          if (!poetCategoryCount[cat.poet_id]) {
            poetCategoryCount[cat.poet_id] = { name: poet.name, count: 0 };
          }
          poetCategoryCount[cat.poet_id].count++;
        }
      });

      Object.entries(poetCategoryCount)
        .sort((a, b) => b[1].count - a[1].count)
        .forEach(([poetId, data]) => {
          console.log(`${data.name}: ${data.count} categories`);
        });
    }

    // 4. Poem distribution per poet
    console.log('\n📜 Poems per Poet:');
    console.log('-'.repeat(60));

    const { data: poemStats, error: poemError } = await supabase
      .from('poems')
      .select(`
        poet_id,
        poets (
          name
        )
      `);

    if (poemError) {
      console.error('Error fetching poems:', poemError);
    } else {
      // Group by poet
      const poetPoemCount: Record<number, { name: string; count: number }> = {};
      
      poemStats?.forEach(poem => {
        const poetData = poem.poets as unknown;
        const poet = (Array.isArray(poetData) ? poetData[0] : poetData) as { name: string } | null;
        if (poet) {
          if (!poetPoemCount[poem.poet_id]) {
            poetPoemCount[poem.poet_id] = { name: poet.name, count: 0 };
          }
          poetPoemCount[poem.poet_id].count++;
        }
      });

      Object.entries(poetPoemCount)
        .sort((a, b) => b[1].count - a[1].count)
        .forEach(([poetId, data]) => {
          console.log(`${data.name}: ${data.count} poems`);
        });
    }

    // 5. Data completeness check
    console.log('\n✅ Data Completeness:');
    console.log('-'.repeat(60));

    const { data: incompletePoets } = await supabase
      .from('poets')
      .select('id, name, description, birth_year, death_year')
      .or('description.is.null,birth_year.is.null,death_year.is.null');

    console.log(`Poets with incomplete data: ${incompletePoets?.length || 0}`);
    
    if (incompletePoets && incompletePoets.length > 0) {
      incompletePoets.slice(0, 5).forEach(poet => {
        const missing = [];
        if (!poet.description) missing.push('description');
        if (!poet.birth_year) missing.push('birth_year');
        if (!poet.death_year) missing.push('death_year');
        console.log(`  - ${poet.name}: missing ${missing.join(', ')}`);
      });
      if (incompletePoets.length > 5) {
        console.log(`  ... and ${incompletePoets.length - 5} more`);
      }
    }

    // 6. Sample data check
    console.log('\n🔍 Sample Data Check:');
    console.log('-'.repeat(60));

    const { data: samplePoem } = await supabase
      .from('poems')
      .select(`
        id,
        title,
        verses_array,
        poets (name),
        categories (title)
      `)
      .limit(1)
      .single();

    if (samplePoem) {
      const poetData = samplePoem.poets as unknown;
      const categoryData = samplePoem.categories as unknown;
      const poet = (Array.isArray(poetData) ? poetData[0] : poetData) as { name: string } | null;
      const category = (Array.isArray(categoryData) ? categoryData[0] : categoryData) as { title: string } | null;
      
      console.log('Sample Poem:');
      console.log(`  Title: ${samplePoem.title}`);
      console.log(`  Poet: ${poet?.name || 'N/A'}`);
      console.log(`  Category: ${category?.title || 'N/A'}`);
      console.log(`  Verses: ${samplePoem.verses_array?.length || 0} lines`);
      if (samplePoem.verses_array && samplePoem.verses_array.length > 0) {
        console.log(`  First verse: ${samplePoem.verses_array[0]}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Audit complete!');
    console.log('\n💡 Summary:');
    console.log(`   - ${poetsCount.count || 0} poets in Supabase`);
    console.log(`   - ${categoriesCount.count || 0} categories in Supabase`);
    console.log(`   - ${poemsCount.count || 0} poems in Supabase`);
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Error during audit:', error);
    process.exit(1);
  }
}

// Run audit
auditSupabaseData();

