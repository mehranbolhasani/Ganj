# 🚀 Development Guide - Persian Poetry App

This guide will help you avoid all the common development headaches and get your Persian poetry app running smoothly.

## 🎯 Quick Start (One-Click Solution)

### Option 1: Automated Script (Recommended)
```bash
# Just run this one command and everything will be set up automatically!
./start-dev.sh
```

### Option 2: NPM Scripts
```bash
# Clean setup with automatic dependency management
npm run dev:setup
```

## 🛠️ Available Commands

### Development Commands
```bash
# Start development server (with automatic checks)
npm run dev

# Clean development setup (removes cache, reinstalls deps)
npm run dev:clean

# Complete reset (removes everything and starts fresh)
npm run dev:reset

# Automated development setup with error handling
npm run dev:setup
```

### Build & Production Commands
```bash
# Build the project
npm run build

# Check if build is successful
npm run build:check

# Verify production readiness
npm run build:verify

# Start production server
npm start
```

### Code Quality Commands
```bash
# Run TypeScript type checking
npm run type-check

# Run ESLint
npm run lint

# Fix ESLint errors automatically
npm run lint:fix
```

## 🔧 Troubleshooting Common Issues

### Issue 1: "Module not found" errors
**Solution:**
```bash
# Clean and reinstall dependencies
npm run dev:clean
```

### Issue 2: TypeScript compilation errors
**Solution:**
```bash
# Check TypeScript errors
npm run type-check

# If errors persist, try a complete reset
npm run dev:reset
```

### Issue 3: Build failures
**Solution:**
```bash
# Check what's causing the build to fail
npm run build:check

# If issues persist, try a clean build
npm run dev:clean && npm run build
```

### Issue 4: Port already in use
**Solution:**
```bash
# Kill processes using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### Issue 5: Cache issues
**Solution:**
```bash
# Clear all caches
npm run dev:clean

# Or complete reset
npm run dev:reset
```

## 🎨 Development Workflow

### Daily Development
1. **Start your day:**
   ```bash
   ./start-dev.sh
   ```

2. **Make your changes** in the code

3. **Check for issues:**
   ```bash
   npm run type-check
   npm run lint
   ```

4. **Build before committing:**
   ```bash
   npm run build:check
   ```

### When Things Go Wrong
1. **First try:** `npm run dev:clean`
2. **If that fails:** `npm run dev:reset`
3. **If still failing:** Check the error messages and fix the specific issues

## 🚀 Production Deployment

### Pre-deployment Checklist
```bash
# 1. Run all checks
npm run build:verify

# 2. Build the project
npm run build

# 3. Test production build locally
npm start
```

### Deployment Commands
```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
├── scripts/
│   ├── dev-setup.js      # Automated development setup
│   └── build-check.js    # Build verification
├── start-dev.sh          # One-click development launcher
├── src/
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   ├── lib/              # Utility functions
│   └── data/             # Static data
└── package.json          # Enhanced with new scripts
```

## 🔍 What Each Script Does

### `./start-dev.sh`
- Checks Node.js version compatibility
- Cleans project cache and build files
- Installs dependencies with error handling
- Runs TypeScript type checking
- Runs ESLint
- Starts development server

### `npm run dev:setup`
- JavaScript version of the launcher
- Cross-platform compatibility
- Detailed error reporting
- Automatic dependency management

### `npm run build:check`
- Verifies build process
- Checks TypeScript compilation
- Runs ESLint
- Reports production readiness

## 💡 Pro Tips

1. **Always use the automated scripts** - they handle 90% of common issues
2. **Run `npm run build:verify` before committing** - catches issues early
3. **Use `npm run dev:reset` if you're stuck** - nuclear option that fixes most problems
4. **Check the console output** - the scripts provide detailed error information
5. **Keep your Node.js updated** - the scripts check for compatibility

## 🆘 Emergency Recovery

If everything is broken:
```bash
# Nuclear option - complete reset
rm -rf node_modules package-lock.json .next
npm install
npm run dev
```

## 📞 Need Help?

The scripts provide detailed error messages and suggestions. If you're still stuck:

1. Check the console output for specific error messages
2. Try the troubleshooting steps above
3. Use `npm run dev:reset` as a last resort
4. Check that you're using Node.js 18 or higher

---

**Happy coding! 🎉** Your Persian poetry app should now be headache-free to develop!
