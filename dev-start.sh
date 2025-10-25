#!/bin/bash

# Simple development starter that handles all common issues
echo "🚀 Starting Persian Poetry App Development Server..."

# Kill any existing Next.js processes
echo "🔧 Cleaning up existing processes..."
pkill -f "next dev" 2>/dev/null || true
lsof -ti:3000,3001,3002 | xargs kill -9 2>/dev/null || true

# Clean build cache
echo "🧹 Cleaning build cache..."
rm -rf .next

# Start development server
echo "▶️  Starting development server..."
echo "🌐 Server will be available at: http://localhost:3000"
echo "🛑 Press Ctrl+C to stop the server"
echo ""

npm run dev
