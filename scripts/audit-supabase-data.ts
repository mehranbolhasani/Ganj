/**
 * Audit Supabase Data
 * 
 * This script checks what data is currently in Supabase and compares with Ganjoor API
 * Run with: npx tsx scripts/audit-supabase-data.ts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Load .env.local file
const envLocalPath = resolve(process.cwd(), '.env.local');
if (existsSync(envLocalPath)) {
  config({ path: envLocalPath });
  console.log('✅ Loaded .env.local');
} else {
  console.warn('⚠️  .env.local not found, trying .env');
  config({ path: resolve(process.cwd(), '.env') });
}

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Try service role key first, fallback to anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ Missing Supabase credentials\n');
  console.error('Missing variables:');
  if (!supabaseUrl) {
    console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  }
  if (!supabaseKey) {
    console.error('  - SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  console.error('\nPlease ensure these are set in .env.local');
  console.error('Current env file:', envLocalPath);
  console.error('\nTip: Make sure your .env.local file exists and has the correct variables.');
  console.error('\nExample .env.local:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function auditSupabaseData(): Promise<{ totals: { poets: number; categories: number; poems: number }, famous: Record<string, number> }> {
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

    const totals = {
      poets: poetsCount.count || 0,
      categories: categoriesCount.count || 0,
      poems: poemsCount.count || 0,
    };
    console.log(`Poets:      ${totals.poets}`);
    console.log(`Categories: ${totals.categories}`);
    console.log(`Poems:      ${totals.poems}`);

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

    // 4b. Exact counts for famous poets
    console.log('\n🏷️ Famous Poets (Exact Counts):');
    console.log('-'.repeat(60));
    const famousPoets = [
      { id: 2, name: 'حافظ شیرازی' },
      { id: 7, name: 'سعدی شیرازی' },
      { id: 5, name: 'جلال الدین محمد مولوی' },
      { id: 4, name: 'ابوالقاسم فردوسی' },
      { id: 9, name: 'عطار نیشابوری' },
      { id: 6, name: 'نظامی گنجوی' },
    ];
    const famousCounts: Record<string, number> = {};
    for (const poet of famousPoets) {
      const { count } = await supabase
        .from('poems')
        .select('id', { count: 'exact', head: true })
        .eq('poet_id', poet.id);
      const c = count || 0;
      famousCounts[poet.name] = c;
      console.log(`${poet.name}: ${c} poems`);
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
    console.log(`   - ${totals.poets} poets in Supabase`);
    console.log(`   - ${totals.categories} categories in Supabase`);
    console.log(`   - ${totals.poems} poems in Supabase`);
    console.log('\n');
    return { totals, famous: famousCounts };

  } catch (error) {
    console.error('\n❌ Error during audit:', error);
    process.exit(1);
  }
}

const args = process.argv.slice(2);
const watch = args.includes('--watch');
const intervalArg = args.find(a => a.startsWith('--interval='));
const intervalSec = intervalArg ? Math.max(15, parseInt(intervalArg.split('=')[1], 10) || 120) : 120;

async function watchLoop() {
  console.log(`\n⏱️  Watch mode: every ${intervalSec} seconds`);
  let prev: { totals: { poets: number; categories: number; poems: number }, famous: Record<string, number> } | null = null;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const res = await auditSupabaseData();
    if (prev) {
      console.log('📈 Delta since last audit:');
      const deltaTotalPoems = res.totals.poems - prev.totals.poems;
      console.log(`   Total poems: ${res.totals.poems} (${deltaTotalPoems >= 0 ? '+' : ''}${deltaTotalPoems})`);
      Object.keys(res.famous).forEach(name => {
        const prevCount = prev!.famous[name] || 0;
        const diff = res.famous[name] - prevCount;
        console.log(`   ${name}: ${res.famous[name]} (${diff >= 0 ? '+' : ''}${diff})`);
      });
    }
    prev = res;
    await new Promise(r => setTimeout(r, intervalSec * 1000));
  }
}

if (watch) {
  watchLoop();
} else {
  auditSupabaseData();
}
