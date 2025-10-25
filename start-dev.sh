#!/bin/bash

# Persian Poetry App - Development Launcher
# This script handles all the common development headaches automatically

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${CYAN}🔧 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Node.js version
check_node_version() {
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 18 or higher."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version $(node -v) is not supported. Please upgrade to Node.js 18 or higher."
        exit 1
    fi
    
    print_success "Node.js version $(node -v) is compatible"
}

# Function to clean project
clean_project() {
    print_status "Cleaning project cache and build files..."
    
    # Remove build artifacts
    rm -rf .next
    rm -rf node_modules/.cache
    rm -rf dist
    rm -rf build
    
    print_success "Project cleaned successfully"
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    if [ -f "package-lock.json" ]; then
        print_info "Found package-lock.json, checking if it's in sync..."
        
        # Try npm ci first, if it fails, fall back to npm install
        if npm ci 2>/dev/null; then
            print_success "Dependencies installed with npm ci"
        else
            print_warning "package-lock.json is out of sync, updating with npm install"
            npm install
        fi
    else
        print_info "No lock file found, running npm install"
        npm install
    fi
    
    print_success "Dependencies installed successfully"
}

# Function to run type checking
run_type_check() {
    print_status "Running TypeScript type checking..."
    
    if npm run type-check; then
        print_success "TypeScript compilation successful"
    else
        print_warning "TypeScript errors found, but continuing..."
    fi
}

# Function to run linting
run_linting() {
    print_status "Running ESLint..."
    
    if npm run lint; then
        print_success "No linting errors found"
    else
        print_warning "Linting errors found, but continuing..."
        print_info "You can fix these later with: npm run lint:fix"
    fi
}

# Function to start development server
start_dev_server() {
    print_status "Starting development server..."
    print_info "Development server will be available at: http://localhost:3000"
    print_info "Press Ctrl+C to stop the server"
    print_info ""
    
    # Start the development server
    npm run dev
}

# Main execution
main() {
    echo -e "${MAGENTA}${BOLD}🚀 Persian Poetry App - Development Launcher${NC}"
    echo -e "${CYAN}Setting up your development environment...${NC}"
    echo ""
    
    # Check Node.js version
    check_node_version
    
    # Clean project
    clean_project
    
    # Install dependencies
    install_dependencies
    
    # Run type checking
    run_type_check
    
    # Run linting
    run_linting
    
    # Start development server
    start_dev_server
}

# Handle script arguments
case "${1:-}" in
    "clean")
        print_status "Cleaning project..."
        clean_project
        print_success "Project cleaned successfully"
        ;;
    "reset")
        print_status "Resetting project (removing node_modules and reinstalling)..."
        rm -rf node_modules package-lock.json
        install_dependencies
        print_success "Project reset successfully"
        ;;
    "build")
        print_status "Building project..."
        npm run build
        print_success "Build completed successfully"
        ;;
    "check")
        print_status "Checking project health..."
        npm run build:verify
        ;;
    *)
        main
        ;;
esac
