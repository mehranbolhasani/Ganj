#!/bin/bash

# Quick fix for dependency sync issues
echo "🔧 Fixing dependency sync issues..."

# Remove problematic lock file
echo "Removing out-of-sync package-lock.json..."
rm -f package-lock.json

# Clean node_modules
echo "Cleaning node_modules..."
rm -rf node_modules

# Fresh install
echo "Installing dependencies fresh..."
npm install

echo "✅ Dependencies fixed! You can now run ./start-dev.sh"
