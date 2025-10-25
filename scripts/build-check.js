#!/usr/bin/env node

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { execSync } = require('child_process');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Check if build is successful
function checkBuild() {
  log(`${colors.bright}${colors.magenta}🔨 Building Persian Poetry App${colors.reset}`);
  
  try {
    logInfo('Starting build process...');
    execSync('npm run build', { stdio: 'inherit' });
    logSuccess('Build completed successfully!');
    
    // Check if .next directory exists
    const nextDir = path.join(process.cwd(), '.next');
    if (fs.existsSync(nextDir)) {
      logSuccess('Build artifacts created successfully');
    } else {
      logWarning('Build artifacts not found');
    }
    
    return true;
  } catch (error) {
    logError('Build failed!');
    logError(error.message);
    return false;
  }
}

// Check production readiness
function checkProductionReadiness() {
  log(`${colors.cyan}Checking production readiness...${colors.reset}`);
  
  const checks = [
    {
      name: 'TypeScript compilation',
      command: 'npx tsc --noEmit',
      critical: true
    },
    {
      name: 'ESLint check',
      command: 'npm run lint',
      critical: false
    },
    {
      name: 'Build process',
      command: 'npm run build',
      critical: true
    }
  ];
  
  let allPassed = true;
  
  checks.forEach(check => {
    try {
      execSync(check.command, { stdio: 'pipe' });
      logSuccess(`${check.name} passed`);
    } catch (error) {
      if (check.critical) {
        logError(`${check.name} failed - CRITICAL`);
        allPassed = false;
      } else {
        logWarning(`${check.name} failed - non-critical`);
      }
    }
  });
  
  return allPassed;
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const checkOnly = args.includes('--check-only');
  
  if (checkOnly) {
    const ready = checkProductionReadiness();
    if (ready) {
      logSuccess('Project is production ready!');
      process.exit(0);
    } else {
      logError('Project has critical issues that need to be fixed');
      process.exit(1);
    }
  } else {
    const buildSuccess = checkBuild();
    if (buildSuccess) {
      logSuccess('Build verification completed successfully!');
      logInfo('You can now run: npm start');
    } else {
      logError('Build verification failed');
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { checkBuild, checkProductionReadiness };
