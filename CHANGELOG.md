# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added (2025-11-17)
- Hybrid chapter enrichment for Attar’s nested category only (`poetId 9`, `categoryId 152`).
- Robust Ganjoor poem parser that falls back to HTML/plain fields when `verses[]` is missing.
- Project runtime rule: always `await` `params` and `searchParams` in Next.js App Router pages.

### Fixed (2025-11-17)
- Resolved 404s on category and chapter pages caused by accessing `params` synchronously.
  - References: `src/app/poet/[id]/category/[categoryId]/page.tsx:22`, `src/app/poet/[id]/category/[categoryId]/chapter/[chapterId]/page.tsx:18`.
- Restored poem content for Attar’s sub-cat poems by parsing alternative Ganjoor response fields.
  - References: `src/lib/ganjoor-api.ts:322`.

### Security (2025-11-17)
- Wrapped verbose Supabase logs with development guards; no payloads printed in production.
  - References: `src/lib/supabase-api.ts:98`, `src/lib/supabase-api.ts:119`, `src/lib/supabase-api.ts:170`.
- Confirmed service role key is server-only; client uses anon key.

### Changed (2025-11-17)
- Special-case gating for nested chapters preserved only for Attar `152`.
  - References: `src/lib/hybrid-api.ts:151`.
- Updated Cursor project rules to codify hybrid data strategy, security, and Next.js params handling.

### Added
- **Text Selection & Dictionary Integration**
  - Text selection tooltip with Vajehyab search integration
  - Tooltip appears above selected text with search link
  - Mobile-friendly touch support for text selection
  - Automatic tooltip positioning with viewport boundary detection
  - Scroll-aware tooltip that follows selected text

- **Poem Navigation**
  - Next/Previous poem navigation links on poem pages
  - Automatic scroll to top when navigating between poems
  - Navigation based on category/chapter order
  - Smooth scroll behavior for better UX

- **Search System Enhancements**
  - Server-side pagination for unlimited search results
  - Support for 27,000+ search results (e.g., "عشق" search)
  - Total count display for each result type
  - Proper pagination with offset-based queries
  - Improved performance with per-page fetching (20 items per page)

- **Accessibility Improvements (WCAG 2.1 AA Compliance)**
  - Skip navigation link for keyboard users
  - Enhanced ARIA labels throughout the application
  - Improved keyboard navigation support
  - Better focus management
  - Fixed accessible names to match visible text
  - Added aria-hidden to decorative icons
  - Improved color contrast ratios (WCAG AA compliant)
  - Ensured single main landmark per page
  - All interactive elements have proper ARIA labels

- **Performance & Layout Stability**
  - Layout shift prevention on poem pages
  - Reserved space for conditionally rendered components
  - Fixed CLS (Cumulative Layout Shift) issues
  - Improved image loading with proper dimensions
  - Layout shift testing script for automated testing

- **Development Tools**
  - Automated layout shift testing script (`test-layout-shifts.js`)
  - Lighthouse-based CLS testing across all pages
  - Performance monitoring and reporting

- **Code Quality Improvements**
  - Converted all function declarations to const arrow functions
  - Enabled React Strict Mode
  - Added dynamic imports for modals (performance optimization)
  - Improved component organization and consistency
- **Development Workflow Improvements**
  - Automated development setup scripts (`dev-setup.js`, `start-dev.sh`, `dev-start.sh`)
  - One-click development environment setup
  - Automated dependency management with fallback strategies
  - Port conflict resolution and process cleanup
  - TypeScript and ESLint validation in development workflow
  - Build verification scripts for production readiness

- **Enhanced User Experience**
  - Smart poets dropdown with search functionality
  - Famous poets section in dropdown menu
  - Random poet display for better discovery
  - Expandable poet descriptions with show more/less functionality
  - Category-specific icons for better visual distinction
  - Responsive mobile dropdown with overlay and blur effects

- **Mobile Experience Enhancements**
  - Responsive alphabetical navigation (horizontal on mobile, vertical on desktop)
  - Mobile-optimized dropdown positioning and sizing
  - Touch-friendly interface elements
  - Professional modal-style dropdown on mobile devices
  - Improved mobile navigation and interaction patterns

- **API and Data Improvements**
  - Accurate poem count display for categories
  - Enhanced API error handling and retry mechanisms
  - Better data fetching and caching strategies
  - Improved category data structure and display

### Changed
- **UI/UX Improvements**
  - Removed theme toggle and background toggle (simplified interface)
  - Enhanced dropdown menu with search and filtering
  - Improved mobile responsiveness across all components
  - Better visual hierarchy and component organization
  - Streamlined header navigation
  - Search results now support unlimited pagination (was limited to 100 results)
  - Improved search API with offset and count parameters

- **Development Experience**
  - Simplified development startup process
  - Better error handling and debugging capabilities
  - Automated dependency synchronization
  - Improved build and deployment workflows

### Fixed
- **Accessibility Issues**
  - Fixed "Elements must have their visible text as part of their accessible name" errors
  - Fixed "Elements must meet minimum color contrast ratio thresholds" warnings
  - Fixed "ARIA hidden element must not be focusable" issues
  - Fixed "Document should have one main landmark" requirement
  - Improved accessible names for all header buttons
  - Added proper aria-hidden attributes to decorative icons
  - Enhanced color contrast for better readability

- **Layout Shift Issues (CLS)**
  - Fixed layout shifts on poem pages (FontSizeControl, control buttons)
  - Fixed layout shifts on poet pages (poet image placeholder)
  - Reserved space for all conditionally rendered components
  - Prevented main content area from shifting during load
  - Improved CLS scores across all pages

- **Build & Code Quality**
  - Fixed ESLint errors (setState in effects, unused variables)
  - Fixed TypeScript errors
  - Resolved Vercel build failures
  - Improved code consistency and maintainability

- **Mobile Responsiveness**
  - Fixed mobile dropdown width and positioning issues
  - Resolved alphabetical navigation mobile layout problems
  - Improved touch targets and mobile interaction patterns
  - Fixed tooltip positioning issues (now uses React portal)
  - Fixed initial tooltip position jump on text selection

- **Search & Navigation**
  - Fixed search results limitation (now supports unlimited results)
  - Fixed pagination to work with server-side queries
  - Fixed scroll position when navigating between poems

- **Data Display Issues**
  - Fixed poem count display for categories
  - Resolved API endpoint issues for category data
  - Improved data fetching reliability

- **Development Workflow**
  - Resolved dependency synchronization issues
  - Fixed ESLint configuration for scripts directory
  - Improved port conflict handling
  - Enhanced build process reliability

## [1.0.0] - 2024-12-19

### Added
- **Core Application Features**
  - Persian poetry web application with RTL support
  - Integration with Ganjoor API for comprehensive poetry database
  - Responsive design optimized for mobile (90% viewport width)
  - Dark/Light theme toggle with persistent user preference
  - Multi-language font support (Vazirmatn, DoranFaNum, Estedad)

- **Homepage Design**
  - Featured 6 most famous Persian poets with images
  - Alphabetical navigation system for all poets
  - Sticky sidebar navigation with scroll-based visibility
  - Animated particle background effects
  - Grid background pattern with fade effect

- **Poet Pages**
  - Individual poet pages with detailed information
  - Special styling for famous poets (amber/orange theme)
  - Distinguished poet badges with animated effects
  - Poet images for the 6 most famous poets
  - Category listings for each poet's works

- **Navigation & UX**
  - Breadcrumb navigation system
  - Dropdown menu for poets in header
  - Smooth scrolling between sections
  - Alphabetical grouping of poets
  - Clickable poet cards with hover effects

- **Performance & Optimization**
  - Client-side API caching with TTL
  - Request deduplication to prevent duplicate API calls
  - Lazy loading for background components
  - Optimized image loading with Next.js Image component
  - Bundle optimization and tree-shaking

- **SEO & Accessibility**
  - Comprehensive meta tags and Open Graph support
  - Twitter Card integration
  - Dynamic sitemap generation
  - Robots.txt configuration
  - Proper RTL language support
  - Alt text for all images

- **Technical Infrastructure**
  - Next.js 16 with Turbopack
  - TypeScript for type safety
  - Tailwind CSS v4 for styling
  - Vercel deployment ready
  - Custom domain support (ganj.directory)

### Technical Details
- **Famous Poets**: Hafez, Saadi, Moulavi, Ferdousi, Attar, Nezami
- **API Integration**: Full Ganjoor API integration with error handling
- **Font Support**: Google Fonts (Vazirmatn) + Local fonts (DoranFaNum, Estedad)
- **Theme System**: next-themes with class-based dark mode
- **Performance**: Core Web Vitals monitoring and optimization

### Fixed
- React refresh runtime errors in development
- Theme toggle functionality
- API response handling and error states
- Mobile responsiveness issues
- Image loading and optimization
- CSS specificity conflicts

### Security
- Proper error handling for API failures
- Input validation and sanitization
- Secure image loading practices

---

## Development Notes

### Performance Metrics
- **Lighthouse Score**: Optimized for 90+ performance
- **Core Web Vitals**: CLS, FID/INP, FCP, LCP, TTFB monitoring
- **Bundle Size**: Optimized with tree-shaking and lazy loading
- **API Efficiency**: Caching and request deduplication

### Browser Support
- Modern browsers with ES6+ support
- RTL language support
- Responsive design for all screen sizes
- Dark mode support across browsers

### Deployment
- **Production URL**: https://www.ganj.directory/
- **Vercel Integration**: Automatic deployments from main branch
- **Custom Domain**: Configured and SSL enabled
- **CDN**: Global content delivery for optimal performance
