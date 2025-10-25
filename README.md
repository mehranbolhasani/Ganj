# دفتر گنج (Defter Ganj)

A modern, minimal web application for reading Persian poetry, built with Next.js 14 and TypeScript.

## Features

- **Modern Design**: Clean, minimal interface with RTL support
- **Persian Typography**: Beautiful Estedad and DoranFaNum fonts
- **Smart Navigation**: Search-enabled poets dropdown with famous poets section
- **Mobile Optimized**: Responsive design with mobile-specific dropdown behavior
- **Performance Optimized**: API caching, lazy loading, and Core Web Vitals monitoring
- **SEO Ready**: Comprehensive meta tags, sitemap, and structured data
- **Enhanced UX**: Expandable descriptions, category icons, and improved mobile experience
- **Client-Side Features**: View history, bookmarks, and font size control without user login
- **Accessibility**: Font size controls, keyboard shortcuts, and ARIA labels
- **Offline-Ready**: Local storage for user preferences and data persistence

## Client-Side Features

- **View History**: Automatically tracks recently viewed poems (last 50 items)
- **Bookmarks**: Save favorite poems locally with search and filtering
- **Font Size Control**: Adjustable text size for better accessibility
- **User Preferences**: Persistent settings for theme, font size, and display options
- **Performance Monitoring**: Real-time tracking of Core Web Vitals and custom metrics
- **Offline Storage**: All user data stored locally using localStorage and IndexedDB

## Tech Stack

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS v4** for styling
- **next-themes** for dark/light mode
- **Ganjoor API** for Persian poetry data
- **IndexedDB** for view history storage
- **localStorage** for user preferences and bookmarks

## Getting Started

### Quick Start (Recommended)

For the easiest development experience, use our automated setup:

```bash
# One-click development setup
npm run dev:setup

# Or use the simple script
./dev-start.sh
```

### Manual Setup

If you prefer manual setup:

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Development Scripts

We provide several development scripts for different scenarios:

```bash
# Automated setup with error handling
npm run dev:setup

# Simple development start
npm run dev:simple

# Clean and reset everything
npm run dev:clean

# Full reset (nuclear option)
npm run dev:reset

# Build verification
npm run build:check
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Live Demo

Visit [https://www.ganj.directory](https://www.ganj.directory) to see the live application.

## Performance Features

- **API Caching**: Smart caching with TTL and request deduplication
- **Error Handling**: Exponential backoff retry logic
- **Canvas Optimization**: Performance-optimized particle backgrounds
- **Bundle Optimization**: Tree shaking and lazy loading
- **SEO Optimization**: Dynamic sitemap generation and meta tags

## Deployment

The application is deployed on Vercel and automatically updates on push to the main branch.

## Contributing

This project is open source and contributions are welcome!
