/**
 * Clear Supabase Data Script
 * Deletes all data from poems, categories, and poets tables
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearData() {
  console.log('🗑️  Clearing Supabase data...\n');
  
  try {
    // Delete in order (poems → categories → poets) due to foreign keys
    console.log('Deleting poems...');
    const { error: poemsError } = await supabase.from('poems').delete().neq('id', 0);
    if (poemsError) {
      console.error('❌ Error deleting poems:', poemsError);
    } else {
      console.log('✅ Poems deleted');
    }
    
    console.log('Deleting categories...');
    const { error: categoriesError } = await supabase.from('categories').delete().neq('id', 0);
    if (categoriesError) {
      console.error('❌ Error deleting categories:', categoriesError);
    } else {
      console.log('✅ Categories deleted');
    }
    
    console.log('Deleting poets...');
    const { error: poetsError } = await supabase.from('poets').delete().neq('id', 0);
    if (poetsError) {
      console.error('❌ Error deleting poets:', poetsError);
    } else {
      console.log('✅ Poets deleted');
    }
    
    console.log('\n✅ All data cleared! Ready for re-migration.');
    
  } catch (error) {
    console.error('❌ Failed to clear data:', error);
    process.exit(1);
  }
}

clearData();

