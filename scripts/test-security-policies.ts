/**
 * Test Supabase Security Policies
 * 
 * This script tests RLS policies with both anon key (public access) and
 * service role key (admin access) to verify security is working correctly.
 * 
 * Usage: npx tsx scripts/test-security-policies.ts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Load .env.local file
const envLocalPath = resolve(process.cwd(), '.env.local');
if (existsSync(envLocalPath)) {
  config({ path: envLocalPath });
  console.log('✅ Loaded .env.local\n');
} else {
  console.warn('⚠️  .env.local not found, trying .env');
  config({ path: resolve(process.cwd(), '.env') });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!anonKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Create clients with different keys
const serviceRoleClient = createClient(supabaseUrl, serviceRoleKey);
const anonClient = createClient(supabaseUrl, anonKey);

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: string;
}

const results: TestResult[] = [];

async function testPublicReadAccess() {
  console.log('🧪 Testing Public Read Access (Anon Key)...\n');

  // Test 1: Read poets
  try {
    const { data, error } = await anonClient
      .from('poets')
      .select('id, name')
      .limit(1);

    if (error) {
      results.push({
        name: 'Read poets (anon key)',
        passed: false,
        error: error.message,
      });
      console.log('❌ Read poets failed:', error.message);
    } else if (data && data.length > 0) {
      results.push({
        name: 'Read poets (anon key)',
        passed: true,
        details: `Found ${data.length} poet(s)`,
      });
      console.log('✅ Read poets: SUCCESS');
    } else {
      results.push({
        name: 'Read poets (anon key)',
        passed: false,
        error: 'No data returned',
      });
      console.log('❌ Read poets: No data returned');
    }
  } catch (error) {
    results.push({
      name: 'Read poets (anon key)',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    console.log('❌ Read poets: Exception', error);
  }

  // Test 2: Read categories
  try {
    const { data, error } = await anonClient
      .from('categories')
      .select('id, title')
      .limit(1);

    if (error) {
      results.push({
        name: 'Read categories (anon key)',
        passed: false,
        error: error.message,
      });
      console.log('❌ Read categories failed:', error.message);
    } else {
      results.push({
        name: 'Read categories (anon key)',
        passed: true,
        details: `Found ${data?.length || 0} category(ies)`,
      });
      console.log('✅ Read categories: SUCCESS');
    }
  } catch (error) {
    results.push({
      name: 'Read categories (anon key)',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    console.log('❌ Read categories: Exception', error);
  }

  // Test 3: Read poems
  try {
    const { data, error } = await anonClient
      .from('poems')
      .select('id, title')
      .limit(1);

    if (error) {
      results.push({
        name: 'Read poems (anon key)',
        passed: false,
        error: error.message,
      });
      console.log('❌ Read poems failed:', error.message);
    } else {
      results.push({
        name: 'Read poems (anon key)',
        passed: true,
        details: `Found ${data?.length || 0} poem(s)`,
      });
      console.log('✅ Read poems: SUCCESS');
    }
  } catch (error) {
    results.push({
      name: 'Read poems (anon key)',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    console.log('❌ Read poems: Exception', error);
  }

  // Test 4: Try to write (should fail)
  try {
    const { error } = await anonClient
      .from('poets')
      .insert({ id: 999999, name: 'Test Poet', slug: 'test' });

    if (error) {
      results.push({
        name: 'Write blocked (anon key)',
        passed: true,
        details: 'Write correctly blocked',
      });
      console.log('✅ Write blocked: SUCCESS (as expected)');
    } else {
      results.push({
        name: 'Write blocked (anon key)',
        passed: false,
        error: 'Write should be blocked but succeeded',
      });
      console.log('❌ Write blocked: FAILED (write should be blocked!)');
    }
  } catch (error) {
    results.push({
      name: 'Write blocked (anon key)',
      passed: true,
      details: 'Write correctly blocked with exception',
    });
    console.log('✅ Write blocked: SUCCESS (exception thrown, as expected)');
  }
}

async function testServiceRoleAccess() {
  console.log('\n🧪 Testing Service Role Access (Admin Key)...\n');

  // Test 1: Read with service role (should work)
  try {
    const { data, error } = await serviceRoleClient
      .from('poets')
      .select('id, name')
      .limit(1);

    if (error) {
      results.push({
        name: 'Read poets (service role)',
        passed: false,
        error: error.message,
      });
      console.log('❌ Read poets failed:', error.message);
    } else {
      results.push({
        name: 'Read poets (service role)',
        passed: true,
        details: `Found ${data?.length || 0} poet(s)`,
      });
      console.log('✅ Read poets: SUCCESS');
    }
  } catch (error) {
    results.push({
      name: 'Read poets (service role)',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    console.log('❌ Read poets: Exception', error);
  }
}

async function testContactFormInsert() {
  console.log('\n🧪 Testing Contact Form Insert (Anon Key)...\n');

  try {
    const { data, error } = await anonClient
      .from('contact_messages')
      .insert({
        name: 'Test User',
        email: 'test@example.com',
        message: 'This is a test message from security test script',
      })
      .select();

    if (error) {
      results.push({
        name: 'Contact form insert (anon key)',
        passed: false,
        error: error.message,
      });
      console.log('❌ Contact form insert failed:', error.message);
    } else {
      results.push({
        name: 'Contact form insert (anon key)',
        passed: true,
        details: 'Message inserted successfully',
      });
      console.log('✅ Contact form insert: SUCCESS');
      
      // Try to read (should fail)
      const { error: readError } = await anonClient
        .from('contact_messages')
        .select('*')
        .eq('email', 'test@example.com')
        .limit(1);

      if (readError) {
        results.push({
          name: 'Contact form read blocked (anon key)',
          passed: true,
          details: 'Read correctly blocked',
        });
        console.log('✅ Contact form read blocked: SUCCESS (as expected)');
      } else {
        results.push({
          name: 'Contact form read blocked (anon key)',
          passed: false,
          error: 'Read should be blocked but succeeded',
        });
        console.log('❌ Contact form read blocked: FAILED (read should be blocked!)');
      }
    }
  } catch (error) {
    results.push({
      name: 'Contact form insert (anon key)',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    console.log('❌ Contact form insert: Exception', error);
  }
}

async function main() {
  console.log('🔒 Supabase Security Policy Test\n');
  console.log('='.repeat(60));
  console.log('Testing RLS policies with different access levels');
  console.log('='.repeat(60));
  console.log('');

  await testPublicReadAccess();
  await testServiceRoleAccess();
  await testContactFormInsert();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  console.log('');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
    if (result.details) {
      console.log(`   ${result.details}`);
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log('');
  console.log(`Total: ${results.length} tests`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ${failed > 0 ? '❌' : ''}`);
  console.log('');

  if (failed > 0) {
    console.log('⚠️  Some tests failed. Please review the RLS policies.');
    process.exit(1);
  } else {
    console.log('🎉 All security tests passed!');
    process.exit(0);
  }
}

main().catch(console.error);

