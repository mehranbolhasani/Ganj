#!/usr/bin/env node

/**
 * Script to test the entire project for layout shift issues
 * Uses Lighthouse CI or Playwright to check CLS scores across all pages
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// List of pages to test
const pagesToTest = [
  '/',
  '/poet/1', // Hafez
  '/poet/2', // Saadi
  '/poem/1',
  '/poem/2135',
  '/search?q=عشق',
  '/bookmarks',
  '/history',
];

// Check if required tools are installed
function checkDependencies() {
  try {
    execSync('which lighthouse', { stdio: 'ignore' });
    return 'lighthouse';
  } catch {
    try {
      execSync('which npx', { stdio: 'ignore' });
      return 'npx-lighthouse';
    } catch {
      console.error('❌ Lighthouse not found. Install with: npm install -g lighthouse');
      process.exit(1);
    }
  }
}

// Run Lighthouse audit for a single page
function auditPage(url, baseUrl = 'http://localhost:3000') {
  const fullUrl = `${baseUrl}${url}`;
  console.log(`\n🔍 Testing: ${fullUrl}`);
  
  try {
    const lighthouse = checkDependencies();
    const command = lighthouse === 'lighthouse' 
      ? `lighthouse "${fullUrl}" --only-categories=performance --output=json --quiet --chrome-flags="--headless"`
      : `npx lighthouse "${fullUrl}" --only-categories=performance --output=json --quiet --chrome-flags="--headless"`;
    
    const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
    const report = JSON.parse(output);
    
    const cls = report.audits['cumulative-layout-shift']?.numericValue || 0;
    const clsScore = report.audits['cumulative-layout-shift']?.score || 0;
    
    const status = clsScore === 1 ? '✅' : clsScore >= 0.75 ? '⚠️' : '❌';
    console.log(`   ${status} CLS: ${cls.toFixed(3)} (Score: ${(clsScore * 100).toFixed(0)})`);
    
    // List layout shifts if any
    if (cls > 0.1) {
      console.log(`   ⚠️  Layout shifts detected!`);
      const shifts = report.audits['layout-shifts']?.details?.items || [];
      shifts.forEach((shift, index) => {
        console.log(`      ${index + 1}. ${shift.node?.snippet || 'Unknown element'}`);
        console.log(`         Score: ${shift.score.toFixed(3)}`);
      });
    }
    
    return { url, cls, clsScore, report };
  } catch (error) {
    console.error(`   ❌ Error testing ${url}:`, error.message);
    return { url, error: error.message };
  }
}

// Main function
async function main() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const results = [];
  
  console.log('🚀 Starting Layout Shift Testing');
  console.log(`📍 Base URL: ${baseUrl}`);
  console.log(`📄 Pages to test: ${pagesToTest.length}`);
  
  // Check if server is running
  try {
    execSync(`curl -s -o /dev/null -w "%{http_code}" ${baseUrl}`, { stdio: 'ignore' });
  } catch {
    console.error(`\n❌ Server not running at ${baseUrl}`);
    console.error('   Please start the dev server: npm run dev');
    process.exit(1);
  }
  
  // Test each page
  for (const page of pagesToTest) {
    const result = auditPage(page, baseUrl);
    results.push(result);
  }
  
  // Summary
  console.log('\n📊 Summary:');
  const passed = results.filter(r => r.clsScore >= 0.75).length;
  const warnings = results.filter(r => r.clsScore >= 0.5 && r.clsScore < 0.75).length;
  const failed = results.filter(r => r.clsScore < 0.5).length;
  
  console.log(`   ✅ Passed (CLS < 0.1): ${passed}`);
  console.log(`   ⚠️  Warnings (0.1 ≤ CLS < 0.25): ${warnings}`);
  console.log(`   ❌ Failed (CLS ≥ 0.25): ${failed}`);
  
  // Save results to file
  const resultsFile = path.join(process.cwd(), 'layout-shift-results.json');
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved to: ${resultsFile}`);
  
  // Exit with error code if any failed
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(console.error);

