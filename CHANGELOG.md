# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
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

- **Development Experience**
  - Simplified development startup process
  - Better error handling and debugging capabilities
  - Automated dependency synchronization
  - Improved build and deployment workflows

### Fixed
- **Mobile Responsiveness**
  - Fixed mobile dropdown width and positioning issues
  - Resolved alphabetical navigation mobile layout problems
  - Improved touch targets and mobile interaction patterns

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
