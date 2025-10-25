#!/usr/bin/env node

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { execSync, spawn } = require('child_process');
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

function logStep(step, message) {
  log(`\n${colors.cyan}🔧 Step ${step}: ${message}${colors.reset}`);
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

// Check if command exists
function commandExists(command) {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Check Node.js version
function checkNodeVersion() {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion < 18) {
    logError(`Node.js version ${nodeVersion} is not supported. Please upgrade to Node.js 18 or higher.`);
    process.exit(1);
  }
  
  logSuccess(`Node.js version ${nodeVersion} is compatible`);
}

// Check if package.json exists
function checkProjectStructure() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    logError('package.json not found. Are you in the correct project directory?');
    process.exit(1);
  }
  logSuccess('Project structure looks good');
}

// Clean previous builds and cache
function cleanProject() {
  logStep(1, 'Cleaning project cache and build files');
  
  const dirsToClean = [
    '.next',
    'node_modules/.cache',
    'dist',
    'build'
  ];
  
  dirsToClean.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      try {
        execSync(`rm -rf "${dirPath}"`, { stdio: 'ignore' });
        logSuccess(`Cleaned ${dir}`);
      } catch (error) {
        logWarning(`Could not clean ${dir}: ${error.message}`);
      }
    }
  });
}

// Install dependencies
function installDependencies() {
  logStep(2, 'Installing dependencies');
  
  try {
    // Check if package-lock.json exists
    const lockFileExists = fs.existsSync(path.join(process.cwd(), 'package-lock.json'));
    
    if (lockFileExists) {
      logInfo('Found package-lock.json, checking if it\'s in sync...');
      
      // Try npm ci first, if it fails, fall back to npm install
      try {
        execSync('npm ci', { stdio: 'inherit' });
        logSuccess('Dependencies installed with npm ci');
      } catch (ciError) {
        logWarning('package-lock.json is out of sync, updating with npm install');
        execSync('npm install', { stdio: 'inherit' });
        logSuccess('Dependencies installed with npm install');
      }
    } else {
      logInfo('No lock file found, running npm install');
      execSync('npm install', { stdio: 'inherit' });
      logSuccess('Dependencies installed successfully');
    }
  } catch (error) {
    logError('Failed to install dependencies');
    logError(error.message);
    
    // Try alternative installation methods
    logInfo('Trying alternative installation methods...');
    
    try {
      logInfo('Trying with --legacy-peer-deps flag...');
      execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });
      logSuccess('Dependencies installed with --legacy-peer-deps');
    } catch (error2) {
      logError('All installation methods failed');
      logError('Please check your internet connection and try running: npm install --legacy-peer-deps');
      process.exit(1);
    }
  }
}

// Check TypeScript configuration
function checkTypeScript() {
  logStep(3, 'Checking TypeScript configuration');
  
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    logSuccess('TypeScript compilation successful');
  } catch (error) {
    logWarning('TypeScript errors found:');
    console.log(error.stdout?.toString() || error.message);
    logInfo('Continuing with development server...');
  }
}

// Run linting
function runLinting() {
  logStep(4, 'Running ESLint');
  
  try {
    execSync('npm run lint', { stdio: 'inherit' });
    logSuccess('No linting errors found');
  } catch (error) {
    logWarning('Linting errors found, but continuing...');
    logInfo('You can fix these later with: npm run lint -- --fix');
  }
}

// Start development server
function startDevServer() {
  logStep(5, 'Starting development server');
  
  logInfo('Starting Next.js development server on http://localhost:3000');
  logInfo('Press Ctrl+C to stop the server');
  
  const devProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  });
  
  // Handle process termination
  process.on('SIGINT', () => {
    logInfo('\nShutting down development server...');
    devProcess.kill('SIGINT');
    process.exit(0);
  });
  
  devProcess.on('error', (error) => {
    logError(`Failed to start development server: ${error.message}`);
    process.exit(1);
  });
}

// Main execution
function main() {
  log(`${colors.bright}${colors.magenta}🚀 Persian Poetry App - Development Setup${colors.reset}`);
  log(`${colors.cyan}Setting up your development environment...${colors.reset}`);
  
  try {
    checkNodeVersion();
    checkProjectStructure();
    cleanProject();
    installDependencies();
    checkTypeScript();
    runLinting();
    startDevServer();
  } catch (error) {
    logError(`Setup failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };
