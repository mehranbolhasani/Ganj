#!/usr/bin/env node
/**
 * Replace all stone-* color classes with semantic Tailwind tokens
 */

const fs = require('fs');
const path = require('path');

const replacements = [
  // ===== TEXT (with dark variants first - most specific) =====
  { from: /text-stone-900 dark:text-stone-100/g, to: 'text-foreground' },
  { from: /text-stone-900 dark:text-stone-300/g, to: 'text-foreground' },
  { from: /text-stone-700 dark:text-stone-300/g, to: 'text-secondary-foreground' },
  { from: /text-stone-600 dark:text-stone-400/g, to: 'text-muted-foreground' },
  { from: /text-stone-500 dark:text-stone-400/g, to: 'text-muted-foreground' },
  { from: /text-stone-500 dark:text-stone-500/g, to: 'text-muted-foreground' },
  { from: /text-stone-400 dark:text-stone-400/g, to: 'text-muted-foreground' },
  { from: /text-stone-800 dark:text-stone-200/g, to: 'text-foreground' },
  { from: /text-stone-300 dark:text-stone-300/g, to: 'text-secondary-foreground' },
  // Single text-stone-*
  { from: /text-stone-900/g, to: 'text-foreground' },
  { from: /text-stone-800/g, to: 'text-foreground' },
  { from: /text-stone-700/g, to: 'text-secondary-foreground' },
  { from: /text-stone-600/g, to: 'text-muted-foreground' },
  { from: /text-stone-500/g, to: 'text-muted-foreground' },
  { from: /text-stone-400/g, to: 'text-muted-foreground' },
  { from: /text-stone-300/g, to: 'text-secondary-foreground' },
  { from: /text-stone-200/g, to: 'text-secondary-foreground' },
  { from: /text-stone-100/g, to: 'text-background' },
  { from: /text-stone-50/g, to: 'text-background' },
  // Text white variants
  { from: /text-white/g, to: 'text-primary-foreground' },
  // dark:text-white (already handled by text-white → text-primary-foreground)
  { from: /dark:text-white/g, to: 'text-primary-foreground' },

  // ===== BACKGROUND (with dark variants first) =====
  { from: /bg-white dark:bg-stone-800/g, to: 'bg-card' },
  { from: /bg-white\/95 dark:bg-stone-800\/95/g, to: 'bg-card/95' },
  { from: /bg-white\/95/g, to: 'bg-card/95' },
  { from: /bg-white\/80 dark:bg-stone-800\/80/g, to: 'bg-card/80' },
  { from: /bg-white\/80/g, to: 'bg-card/80' },
  { from: /bg-white\/75/g, to: 'bg-card/75' },
  { from: /bg-white\/70 dark:bg-stone-900\/30/g, to: 'bg-card/70' },
  { from: /bg-white\/70/g, to: 'bg-card/70' },
  { from: /bg-white\/50 dark:bg-stone-800\/50/g, to: 'bg-card/50' },
  { from: /bg-white\/50/g, to: 'bg-card/50' },
  { from: /bg-white\/40/g, to: 'bg-card/40' },
  { from: /bg-white\/20/g, to: 'bg-card/20' },
  { from: /bg-white\/10/g, to: 'bg-card/10' },
  { from: /bg-white\/5/g, to: 'bg-card/5' },
  { from: /bg-white/g, to: 'bg-card' },
  // bg-stone-* with dark variants
  { from: /bg-stone-50 dark:bg-stone-900/g, to: 'bg-background' },
  { from: /bg-stone-100 dark:bg-stone-800/g, to: 'bg-muted' },
  { from: /bg-stone-200 dark:bg-stone-700/g, to: 'bg-muted' },
  { from: /bg-stone-300 dark:bg-stone-600/g, to: 'bg-muted' },
  { from: /bg-stone-400 dark:bg-stone-500/g, to: 'bg-muted' },
  { from: /bg-stone-800 dark:bg-stone-200/g, to: 'bg-primary' },
  { from: /bg-stone-900 dark:bg-stone-100/g, to: 'bg-primary' },
  // Single bg-stone-*
  { from: /bg-stone-950/g, to: 'bg-background' },
  { from: /bg-stone-900/g, to: 'bg-primary' },
  { from: /bg-stone-900\/80/g, to: 'bg-primary/80' },
  { from: /bg-stone-900\/30/g, to: 'bg-primary/30' },
  { from: /bg-stone-900\/20/g, to: 'bg-primary/20' },
  { from: /bg-stone-900\/10/g, to: 'bg-primary/10' },
  { from: /bg-stone-900\/5/g, to: 'bg-primary/5' },
  { from: /bg-stone-800/g, to: 'bg-primary' },
  { from: /bg-stone-800\/95/g, to: 'bg-primary/95' },
  { from: /bg-stone-800\/80/g, to: 'bg-primary/80' },
  { from: /bg-stone-800\/60/g, to: 'bg-primary/60' },
  { from: /bg-stone-800\/50/g, to: 'bg-primary/50' },
  { from: /bg-stone-800\/40/g, to: 'bg-primary/40' },
  { from: /bg-stone-800\/30/g, to: 'bg-primary/30' },
  { from: /bg-stone-800\/20/g, to: 'bg-primary/20' },
  { from: /bg-stone-800\/10/g, to: 'bg-primary/10' },
  { from: /bg-stone-800\/5/g, to: 'bg-primary/5' },
  { from: /bg-stone-700/g, to: 'bg-secondary' },
  { from: /bg-stone-700\/50/g, to: 'bg-secondary/50' },
  { from: /bg-stone-700\/30/g, to: 'bg-secondary/30' },
  { from: /bg-stone-700\/20/g, to: 'bg-secondary/20' },
  { from: /bg-stone-700\/10/g, to: 'bg-secondary/10' },
  { from: /bg-stone-700\/5/g, to: 'bg-secondary/5' },
  { from: /bg-stone-600/g, to: 'bg-muted' },
  { from: /bg-stone-600\/40/g, to: 'bg-muted/40' },
  { from: /bg-stone-600\/20/g, to: 'bg-muted/20' },
  { from: /bg-stone-600\/10/g, to: 'bg-muted/10' },
  { from: /bg-stone-500/g, to: 'bg-muted' },
  { from: /bg-stone-400/g, to: 'bg-muted' },
  { from: /bg-stone-400\/40/g, to: 'bg-muted/40' },
  { from: /bg-stone-400\/20/g, to: 'bg-muted/20' },
  { from: /bg-stone-400\/10/g, to: 'bg-muted/10' },
  { from: /bg-stone-300/g, to: 'bg-muted' },
  { from: /bg-stone-300\/50/g, to: 'bg-muted/50' },
  { from: /bg-stone-300\/20/g, to: 'bg-muted/20' },
  { from: /bg-stone-300\/10/g, to: 'bg-muted/10' },
  { from: /bg-stone-200/g, to: 'bg-muted' },
  { from: /bg-stone-200\/70/g, to: 'bg-muted/70' },
  { from: /bg-stone-200\/75/g, to: 'bg-muted/75' },
  { from: /bg-stone-200\/30/g, to: 'bg-muted/30' },
  { from: /bg-stone-200\/20/g, to: 'bg-muted/20' },
  { from: /bg-stone-200\/10/g, to: 'bg-muted/10' },
  { from: /bg-stone-100/g, to: 'bg-muted' },
  { from: /bg-stone-100\/80/g, to: 'bg-muted/80' },
  { from: /bg-stone-100\/20/g, to: 'bg-muted/20' },
  { from: /bg-stone-100\/10/g, to: 'bg-muted/10' },
  { from: /bg-stone-50/g, to: 'bg-background' },
  { from: /bg-stone-50\/20/g, to: 'bg-background/20' },
  { from: /bg-stone-50\/10/g, to: 'bg-background/10' },

  // ===== BORDER (with dark variants first) =====
  { from: /border-stone-200 dark:border-stone-700/g, to: 'border-border' },
  { from: /border-stone-300 dark:border-stone-600/g, to: 'border-input' },
  { from: /border-stone-100 dark:border-stone-800/g, to: 'border-border' },
  { from: /border-stone-400 dark:border-stone-500/g, to: 'border-input' },
  // Single border-stone-*
  { from: /border-stone-900/g, to: 'border-border' },
  { from: /border-stone-800/g, to: 'border-border' },
  { from: /border-stone-700/g, to: 'border-border' },
  { from: /border-stone-600/g, to: 'border-input' },
  { from: /border-stone-500/g, to: 'border-input' },
  { from: /border-stone-400/g, to: 'border-input' },
  { from: /border-stone-300/g, to: 'border-input' },
  { from: /border-stone-200/g, to: 'border-border' },
  { from: /border-stone-100/g, to: 'border-border' },
  // Border-t variants
  { from: /border-t-stone-800 dark:border-t-stone-200/g, to: 'border-t-primary' },
  { from: /border-t-stone-600 dark:border-t-stone-300/g, to: 'border-t-muted-foreground' },
  { from: /border-t-stone-800/g, to: 'border-t-primary' },
  { from: /border-t-stone-600/g, to: 'border-t-muted-foreground' },
  { from: /border-t-stone-300/g, to: 'border-t-muted-foreground' },
  { from: /border-t-stone-200/g, to: 'border-t-border' },
  // Border-b variants
  { from: /border-b-stone-200/g, to: 'border-b-border' },
  { from: /border-b-stone-300/g, to: 'border-b-input' },
  // Border opacity variants
  { from: /border-stone-200\/50/g, to: 'border-border/50' },
  { from: /border-stone-300\/50/g, to: 'border-input/50' },

  // ===== HOVER TEXT (with dark variants first) =====
  { from: /hover:text-stone-800 dark:hover:text-stone-200/g, to: 'hover:text-foreground' },
  { from: /hover:text-stone-900 dark:hover:text-stone-100/g, to: 'hover:text-foreground' },
  { from: /hover:text-stone-700 dark:hover:text-stone-300/g, to: 'hover:text-secondary-foreground' },
  { from: /hover:text-stone-600 dark:hover:text-stone-400/g, to: 'hover:text-muted-foreground' },
  { from: /hover:text-stone-500 dark:hover:text-stone-400/g, to: 'hover:text-muted-foreground' },
  // Single hover:text-stone-*
  { from: /hover:text-stone-900/g, to: 'hover:text-foreground' },
  { from: /hover:text-stone-800/g, to: 'hover:text-foreground' },
  { from: /hover:text-stone-700/g, to: 'hover:text-secondary-foreground' },
  { from: /hover:text-stone-600/g, to: 'hover:text-muted-foreground' },
  { from: /hover:text-stone-500/g, to: 'hover:text-muted-foreground' },
  { from: /hover:text-stone-400/g, to: 'hover:text-muted-foreground' },
  { from: /hover:text-stone-300/g, to: 'hover:text-secondary-foreground' },
  { from: /hover:text-stone-200/g, to: 'hover:text-secondary-foreground' },
  { from: /hover:text-stone-100/g, to: 'hover:text-background' },

  // ===== HOVER BACKGROUND (with dark variants first) =====
  { from: /hover:bg-stone-100 dark:hover:bg-stone-700/g, to: 'hover:bg-muted' },
  { from: /hover:bg-stone-200 dark:hover:bg-stone-600/g, to: 'hover:bg-muted' },
  { from: /hover:bg-stone-300 dark:hover:bg-stone-600/g, to: 'hover:bg-muted' },
  { from: /hover:bg-stone-50 dark:hover:bg-stone-800/g, to: 'hover:bg-muted' },
  { from: /hover:bg-stone-700 dark:hover:bg-stone-300/g, to: 'hover:bg-primary' },
  { from: /hover:bg-stone-800 dark:hover:bg-stone-200/g, to: 'hover:bg-primary' },
  { from: /hover:bg-stone-800\/50 dark:hover:bg-stone-800\/50/g, to: 'hover:bg-primary/50' },
  { from: /hover:bg-stone-700\/30 dark:hover:bg-stone-700\/30/g, to: 'hover:bg-secondary/30' },
  // Single hover:bg-stone-*
  { from: /hover:bg-stone-900/g, to: 'hover:bg-primary' },
  { from: /hover:bg-stone-800/g, to: 'hover:bg-primary' },
  { from: /hover:bg-stone-700/g, to: 'hover:bg-primary' },
  { from: /hover:bg-stone-700\/50/g, to: 'hover:bg-secondary/50' },
  { from: /hover:bg-stone-700\/30/g, to: 'hover:bg-secondary/30' },
  { from: /hover:bg-stone-600/g, to: 'hover:bg-muted' },
  { from: /hover:bg-stone-500/g, to: 'hover:bg-muted' },
  { from: /hover:bg-stone-400/g, to: 'hover:bg-muted' },
  { from: /hover:bg-stone-300/g, to: 'hover:bg-muted' },
  { from: /hover:bg-stone-300\/50/g, to: 'hover:bg-muted/50' },
  { from: /hover:bg-stone-200/g, to: 'hover:bg-muted' },
  { from: /hover:bg-stone-200\/50/g, to: 'hover:bg-muted/50' },
  { from: /hover:bg-stone-100/g, to: 'hover:bg-muted' },
  { from: /hover:bg-stone-100\/50/g, to: 'hover:bg-muted/50' },
  { from: /hover:bg-stone-50/g, to: 'hover:bg-muted' },

  // ===== ACTIVE BACKGROUND (with dark variants first) =====
  { from: /active:bg-stone-200 dark:active:bg-stone-600/g, to: 'active:bg-muted' },
  { from: /active:bg-stone-300 dark:active:bg-stone-500/g, to: 'active:bg-muted' },
  { from: /active:bg-stone-400 dark:active:bg-stone-500/g, to: 'active:bg-muted' },
  { from: /active:bg-stone-700 dark:active:bg-stone-300/g, to: 'active:bg-primary' },
  // Single active:bg-stone-*
  { from: /active:bg-stone-900/g, to: 'active:bg-primary' },
  { from: /active:bg-stone-800/g, to: 'active:bg-primary' },
  { from: /active:bg-stone-700/g, to: 'active:bg-primary' },
  { from: /active:bg-stone-600/g, to: 'active:bg-muted' },
  { from: /active:bg-stone-500/g, to: 'active:bg-muted' },
  { from: /active:bg-stone-400/g, to: 'active:bg-muted' },
  { from: /active:bg-stone-300/g, to: 'active:bg-muted' },
  { from: /active:bg-stone-200/g, to: 'active:bg-muted' },
  { from: /active:bg-stone-100/g, to: 'active:bg-muted' },

  // ===== PLACEHOLDER =====
  { from: /placeholder-stone-500 dark:placeholder-stone-400/g, to: 'placeholder-muted-foreground' },
  { from: /placeholder-stone-500/g, to: 'placeholder-muted-foreground' },
  { from: /placeholder-stone-400/g, to: 'placeholder-muted-foreground' },

  // ===== FOCUS RING =====
  { from: /focus:ring-stone-500 dark:focus:ring-stone-400/g, to: 'focus:ring-ring' },
  { from: /focus:ring-stone-300 dark:focus:ring-stone-600/g, to: 'focus:ring-ring' },
  { from: /focus:ring-stone-500/g, to: 'focus:ring-ring' },
  { from: /focus:ring-stone-400/g, to: 'focus:ring-ring' },
  { from: /focus:ring-stone-300/g, to: 'focus:ring-ring' },
  { from: /focus:ring-stone-200/g, to: 'focus:ring-ring' },
  // Focus border
  { from: /focus:border-stone-500/g, to: 'focus:border-input' },
  { from: /focus:border-stone-400/g, to: 'focus:border-input' },
  { from: /focus:border-stone-300/g, to: 'focus:border-input' },

  // ===== DIVIDE =====
  { from: /divide-stone-200 dark:divide-stone-700/g, to: 'divide-border' },
  { from: /divide-stone-200/g, to: 'divide-border' },
  { from: /dark:divide-stone-700/g, to: 'divide-border' },
  { from: /dark:divide-stone-700\/50/g, to: 'divide-border/50' },

  // ===== GROUP-HOVER TEXT =====
  { from: /group-hover:text-stone-600/g, to: 'group-hover:text-muted-foreground' },
  { from: /group-hover:text-stone-700 dark:group-hover:text-stone-200/g, to: 'group-hover:text-secondary-foreground' },
  { from: /group-hover:text-stone-900 dark:group-hover:text-stone-200/g, to: 'group-hover:text-foreground' },
  { from: /dark:group-hover:text-stone-200/g, to: 'group-hover:text-foreground' },
  { from: /dark:group-hover:text-stone-300/g, to: 'group-hover:text-muted-foreground' },
  { from: /group-hover:text-stone-700/g, to: 'group-hover:text-secondary-foreground' },
  { from: /group-hover:text-stone-900/g, to: 'group-hover:text-foreground' },
  { from: /group-hover:text-stone-800/g, to: 'group-hover:text-foreground' },
  { from: /group-hover:text-stone-500/g, to: 'group-hover:text-muted-foreground' },
  { from: /group-hover:text-stone-400/g, to: 'group-hover:text-muted-foreground' },

  // ===== GROUP-HOVER BACKGROUND =====
  { from: /group-hover:bg-stone-100/g, to: 'group-hover:bg-muted' },
  { from: /group-hover:bg-stone-200/g, to: 'group-hover:bg-muted' },
  { from: /group-hover:bg-stone-800/g, to: 'group-hover:bg-primary' },
  { from: /group-hover:bg-stone-900/g, to: 'group-hover:bg-primary' },

  // ===== HOVER BORDER =====
  { from: /hover:border-stone-300 dark:hover:border-stone-600/g, to: 'hover:border-input' },
  { from: /hover:border-stone-300/g, to: 'hover:border-input' },
  { from: /hover:border-stone-400/g, to: 'hover:border-input' },
  { from: /dark:hover:border-stone-600/g, to: 'hover:border-input' },
  { from: /dark:hover:border-stone-500/g, to: 'hover:border-input' },

  // ===== GRADIENT =====
  { from: /from-stone-50 dark:from-stone-800/g, to: 'from-muted' },
  { from: /from-stone-50/g, to: 'from-muted' },
  { from: /from-stone-100/g, to: 'from-muted' },
  { from: /from-stone-200/g, to: 'from-muted' },
  { from: /from-stone-800/g, to: 'from-primary' },
  { from: /from-stone-900/g, to: 'from-primary' },
  { from: /dark:from-stone-800/g, to: 'from-primary' },
  { from: /dark:from-stone-900/g, to: 'from-primary' },
  { from: /to-stone-100 dark:to-stone-900/g, to: 'to-background' },
  { from: /to-stone-100/g, to: 'to-background' },
  { from: /to-stone-200/g, to: 'to-muted' },
  { from: /to-stone-800/g, to: 'to-primary' },
  { from: /to-stone-900/g, to: 'to-primary' },
  { from: /dark:to-stone-900/g, to: 'to-primary' },
  { from: /dark:to-stone-800/g, to: 'to-primary' },
  { from: /via-stone-100/g, to: 'via-muted' },
  { from: /via-stone-200/g, to: 'via-muted' },

  // ===== STROKE / FILL =====
  { from: /stroke-stone-800 dark:stroke-stone-200/g, to: 'stroke-primary' },
  { from: /stroke-stone-800/g, to: 'stroke-primary' },
  { from: /stroke-stone-700/g, to: 'stroke-secondary' },
  { from: /stroke-stone-600/g, to: 'stroke-muted-foreground' },
  { from: /stroke-stone-500/g, to: 'stroke-muted-foreground' },
  { from: /stroke-stone-400/g, to: 'stroke-muted-foreground' },
  { from: /stroke-stone-300/g, to: 'stroke-muted-foreground' },
  { from: /stroke-stone-200/g, to: 'stroke-border' },
  { from: /dark:stroke-stone-200/g, to: 'stroke-primary' },
  { from: /dark:stroke-stone-300/g, to: 'stroke-muted-foreground' },
  { from: /dark:stroke-stone-400/g, to: 'stroke-muted-foreground' },
  { from: /dark:stroke-stone-500/g, to: 'stroke-muted-foreground' },
  { from: /dark:stroke-stone-600/g, to: 'stroke-muted-foreground' },
  { from: /fill-stone-800/g, to: 'fill-primary' },
  { from: /fill-stone-700/g, to: 'fill-secondary' },
  { from: /fill-stone-600/g, to: 'fill-muted-foreground' },
  { from: /fill-stone-500/g, to: 'fill-muted-foreground' },
  { from: /fill-stone-400/g, to: 'fill-muted-foreground' },
  { from: /fill-stone-300/g, to: 'fill-muted-foreground' },
  { from: /fill-stone-200/g, to: 'fill-border' },
  { from: /fill-stone-100/g, to: 'fill-background' },

  // ===== MARK HIGHLIGHT (used in search) =====
  { from: /bg-yellow-200 dark:bg-yellow-600\/40/g, to: 'bg-accent' },
  { from: /bg-yellow-200/g, to: 'bg-accent' },
  { from: /dark:bg-yellow-600\/40/g, to: 'bg-accent' },
  // But we need to keep the text-foreground for mark text
  { from: /text-stone-900 dark:text-stone-100/g, to: 'text-foreground' },

  // ===== OPACITY TEXT =====
  { from: /text-stone-900\/50/g, to: 'text-foreground/50' },
  { from: /text-stone-800\/50/g, to: 'text-foreground/50' },
  { from: /text-stone-700\/50/g, to: 'text-secondary-foreground/50' },
  { from: /text-stone-600\/50/g, to: 'text-muted-foreground/50' },
  { from: /text-stone-500\/50/g, to: 'text-muted-foreground/50' },
  { from: /text-stone-400\/50/g, to: 'text-muted-foreground/50' },
  { from: /text-stone-300\/50/g, to: 'text-secondary-foreground/50' },

  // ===== OPACITY BACKGROUND (remaining) =====
  { from: /bg-stone-950\/80/g, to: 'bg-background/80' },
  { from: /bg-stone-950\/50/g, to: 'bg-background/50' },
  { from: /bg-stone-950\/20/g, to: 'bg-background/20' },
  { from: /bg-stone-950\/10/g, to: 'bg-background/10' },
  { from: /bg-stone-950\/5/g, to: 'bg-background/5' },
  { from: /bg-stone-50\/80/g, to: 'bg-background/80' },
  { from: /bg-stone-50\/50/g, to: 'bg-background/50' },
  { from: /bg-stone-50\/40/g, to: 'bg-background/40' },
  { from: /bg-stone-50\/30/g, to: 'bg-background/30' },

  // ===== OUTLINE =====
  { from: /outline-stone-300/g, to: 'outline-ring' },
  { from: /outline-stone-400/g, to: 'outline-ring' },
  { from: /outline-stone-500/g, to: 'outline-ring' },
  { from: /outline-stone-600/g, to: 'outline-ring' },

  // ===== RING =====
  { from: /ring-stone-500/g, to: 'ring-ring' },
  { from: /ring-stone-400/g, to: 'ring-ring' },
  { from: /ring-stone-300/g, to: 'ring-ring' },
  { from: /ring-stone-200/g, to: 'ring-ring' },

  // ===== DECORATION (text decoration) =====
  { from: /decoration-stone-400/g, to: 'decoration-muted-foreground' },
  { from: /decoration-stone-500/g, to: 'decoration-muted-foreground' },
  { from: /decoration-stone-600/g, to: 'decoration-muted-foreground' },

  // ===== CARET (input cursor) =====
  { from: /caret-stone-500/g, to: 'caret-foreground' },
  { from: /caret-stone-600/g, to: 'caret-foreground' },
  { from: /caret-stone-700/g, to: 'caret-foreground' },

  // ===== SCROLLBAR (if any) =====
  { from: /scrollbar-thumb-stone-400/g, to: 'scrollbar-thumb-muted-foreground' },
  { from: /scrollbar-thumb-stone-500/g, to: 'scrollbar-thumb-muted-foreground' },
  { from: /scrollbar-track-stone-200/g, to: 'scrollbar-track-muted' },
  { from: /scrollbar-track-stone-100/g, to: 'scrollbar-track-muted' },

  // ===== SHADOW (remove stone color shadows, use standard) =====
  { from: /shadow-stone-200/g, to: 'shadow-border' },
  { from: /shadow-stone-300/g, to: 'shadow-border' },
  { from: /shadow-stone-400/g, to: 'shadow-muted-foreground' },
  { from: /shadow-stone-500/g, to: 'shadow-muted-foreground' },
  { from: /shadow-stone-900/g, to: 'shadow-foreground' },
  { from: /shadow-stone-950/g, to: 'shadow-foreground' },
  { from: /dark:shadow-stone-800/g, to: 'shadow-primary' },
  { from: /dark:shadow-stone-900/g, to: 'shadow-foreground' },

  // ===== REMOVE STANDALONE dark: PREFIXES =====
  // These should be handled by the semantic tokens, so remove them when they stand alone
  { from: /dark:bg-stone-900/g, to: 'bg-background' },
  { from: /dark:bg-stone-800/g, to: 'bg-card' },
  { from: /dark:bg-stone-800\/95/g, to: 'bg-card/95' },
  { from: /dark:bg-stone-800\/80/g, to: 'bg-card/80' },
  { from: /dark:bg-stone-800\/60/g, to: 'bg-card/60' },
  { from: /dark:bg-stone-800\/50/g, to: 'bg-card/50' },
  { from: /dark:bg-stone-800\/40/g, to: 'bg-card/40' },
  { from: /dark:bg-stone-800\/30/g, to: 'bg-card/30' },
  { from: /dark:bg-stone-800\/20/g, to: 'bg-card/20' },
  { from: /dark:bg-stone-700/g, to: 'bg-secondary' },
  { from: /dark:bg-stone-700\/50/g, to: 'bg-secondary/50' },
  { from: /dark:bg-stone-700\/30/g, to: 'bg-secondary/30' },
  { from: /dark:bg-stone-600/g, to: 'bg-muted' },
  { from: /dark:bg-stone-600\/40/g, to: 'bg-muted/40' },
  { from: /dark:bg-stone-500/g, to: 'bg-muted' },
  { from: /dark:bg-stone-400/g, to: 'bg-muted-foreground' },
  { from: /dark:bg-stone-300/g, to: 'bg-muted-foreground' },
  { from: /dark:bg-stone-200/g, to: 'bg-primary' },
  { from: /dark:bg-stone-100/g, to: 'bg-primary' },
  { from: /dark:bg-stone-50/g, to: 'bg-background' },

  { from: /dark:text-stone-100/g, to: 'text-foreground' },
  { from: /dark:text-stone-200/g, to: 'text-secondary-foreground' },
  { from: /dark:text-stone-300/g, to: 'text-secondary-foreground' },
  { from: /dark:text-stone-400/g, to: 'text-muted-foreground' },
  { from: /dark:text-stone-500/g, to: 'text-muted-foreground' },
  { from: /dark:text-stone-600/g, to: 'text-muted-foreground' },
  { from: /dark:text-stone-700/g, to: 'text-secondary-foreground' },
  { from: /dark:text-stone-800/g, to: 'text-foreground' },
  { from: /dark:text-stone-900/g, to: 'text-primary-foreground' },
  { from: /dark:text-stone-950/g, to: 'text-primary-foreground' },

  { from: /dark:border-stone-900/g, to: 'border-border' },
  { from: /dark:border-stone-800/g, to: 'border-border' },
  { from: /dark:border-stone-700/g, to: 'border-border' },
  { from: /dark:border-stone-700\/50/g, to: 'border-border/50' },
  { from: /dark:border-stone-600/g, to: 'border-input' },
  { from: /dark:border-stone-500/g, to: 'border-input' },
  { from: /dark:border-stone-400/g, to: 'border-input' },
  { from: /dark:border-stone-300/g, to: 'border-input' },
  { from: /dark:border-stone-200/g, to: 'border-border' },
  { from: /dark:border-stone-100/g, to: 'border-border' },

  { from: /dark:hover:bg-stone-900/g, to: 'hover:bg-primary' },
  { from: /dark:hover:bg-stone-800/g, to: 'hover:bg-primary' },
  { from: /dark:hover:bg-stone-800\/50/g, to: 'hover:bg-primary/50' },
  { from: /dark:hover:bg-stone-700/g, to: 'hover:bg-secondary' },
  { from: /dark:hover:bg-stone-700\/30/g, to: 'hover:bg-secondary/30' },
  { from: /dark:hover:bg-stone-600/g, to: 'hover:bg-muted' },
  { from: /dark:hover:bg-stone-500/g, to: 'hover:bg-muted' },
  { from: /dark:hover:bg-stone-400/g, to: 'hover:bg-muted' },
  { from: /dark:hover:bg-stone-300/g, to: 'hover:bg-primary' },
  { from: /dark:hover:bg-stone-200/g, to: 'hover:bg-primary' },
  { from: /dark:hover:bg-stone-100/g, to: 'hover:bg-muted' },
  { from: /dark:hover:bg-stone-50/g, to: 'hover:bg-muted' },

  { from: /dark:hover:text-stone-100/g, to: 'hover:text-foreground' },
  { from: /dark:hover:text-stone-200/g, to: 'hover:text-foreground' },
  { from: /dark:hover:text-stone-300/g, to: 'hover:text-secondary-foreground' },
  { from: /dark:hover:text-stone-400/g, to: 'hover:text-muted-foreground' },
  { from: /dark:hover:text-stone-500/g, to: 'hover:text-muted-foreground' },
  { from: /dark:hover:text-stone-600/g, to: 'hover:text-muted-foreground' },
  { from: /dark:hover:text-stone-700/g, to: 'hover:text-secondary-foreground' },
  { from: /dark:hover:text-stone-800/g, to: 'hover:text-foreground' },
  { from: /dark:hover:text-stone-900/g, to: 'hover:text-primary-foreground' },

  { from: /dark:hover:border-stone-900/g, to: 'hover:border-border' },
  { from: /dark:hover:border-stone-800/g, to: 'hover:border-border' },
  { from: /dark:hover:border-stone-700/g, to: 'hover:border-border' },
  { from: /dark:hover:border-stone-600/g, to: 'hover:border-input' },
  { from: /dark:hover:border-stone-500/g, to: 'hover:border-input' },
  { from: /dark:hover:border-stone-400/g, to: 'hover:border-input' },
  { from: /dark:hover:border-stone-300/g, to: 'hover:border-input' },
  { from: /dark:hover:border-stone-200/g, to: 'hover:border-border' },
  { from: /dark:hover:border-stone-100/g, to: 'hover:border-border' },

  { from: /dark:focus:ring-stone-900/g, to: 'focus:ring-ring' },
  { from: /dark:focus:ring-stone-800/g, to: 'focus:ring-ring' },
  { from: /dark:focus:ring-stone-700/g, to: 'focus:ring-ring' },
  { from: /dark:focus:ring-stone-600/g, to: 'focus:ring-ring' },
  { from: /dark:focus:ring-stone-500/g, to: 'focus:ring-ring' },
  { from: /dark:focus:ring-stone-400/g, to: 'focus:ring-ring' },
  { from: /dark:focus:ring-stone-300/g, to: 'focus:ring-ring' },
  { from: /dark:focus:ring-stone-200/g, to: 'focus:ring-ring' },
  { from: /dark:focus:border-stone-900/g, to: 'focus:border-input' },
  { from: /dark:focus:border-stone-800/g, to: 'focus:border-input' },
  { from: /dark:focus:border-stone-700/g, to: 'focus:border-input' },
  { from: /dark:focus:border-stone-600/g, to: 'focus:border-input' },
  { from: /dark:focus:border-stone-500/g, to: 'focus:border-input' },
  { from: /dark:focus:border-stone-400/g, to: 'focus:border-input' },
  { from: /dark:focus:border-stone-300/g, to: 'focus:border-input' },
  { from: /dark:focus:border-stone-200/g, to: 'focus:border-input' },

  { from: /dark:active:bg-stone-900/g, to: 'active:bg-primary' },
  { from: /dark:active:bg-stone-800/g, to: 'active:bg-primary' },
  { from: /dark:active:bg-stone-700/g, to: 'active:bg-secondary' },
  { from: /dark:active:bg-stone-600/g, to: 'active:bg-muted' },
  { from: /dark:active:bg-stone-500/g, to: 'active:bg-muted' },
  { from: /dark:active:bg-stone-400/g, to: 'active:bg-muted' },
  { from: /dark:active:bg-stone-300/g, to: 'active:bg-primary' },
  { from: /dark:active:bg-stone-200/g, to: 'active:bg-muted' },
  { from: /dark:active:bg-stone-100/g, to: 'active:bg-muted' },
  { from: /dark:active:bg-stone-50/g, to: 'active:bg-muted' },

  { from: /dark:placeholder-stone-900/g, to: 'placeholder-muted-foreground' },
  { from: /dark:placeholder-stone-800/g, to: 'placeholder-muted-foreground' },
  { from: /dark:placeholder-stone-700/g, to: 'placeholder-muted-foreground' },
  { from: /dark:placeholder-stone-600/g, to: 'placeholder-muted-foreground' },
  { from: /dark:placeholder-stone-500/g, to: 'placeholder-muted-foreground' },
  { from: /dark:placeholder-stone-400/g, to: 'placeholder-muted-foreground' },
  { from: /dark:placeholder-stone-300/g, to: 'placeholder-muted-foreground' },
  { from: /dark:placeholder-stone-200/g, to: 'placeholder-muted-foreground' },
  { from: /dark:placeholder-stone-100/g, to: 'placeholder-muted-foreground' },

  { from: /dark:from-stone-900/g, to: 'from-primary' },
  { from: /dark:from-stone-800/g, to: 'from-primary' },
  { from: /dark:from-stone-700/g, to: 'from-secondary' },
  { from: /dark:from-stone-600/g, to: 'from-muted' },
  { from: /dark:from-stone-500/g, to: 'from-muted' },
  { from: /dark:from-stone-400/g, to: 'from-muted' },
  { from: /dark:from-stone-300/g, to: 'from-primary' },
  { from: /dark:from-stone-200/g, to: 'from-primary' },
  { from: /dark:from-stone-100/g, to: 'from-muted' },

  { from: /dark:to-stone-900/g, to: 'to-primary' },
  { from: /dark:to-stone-800/g, to: 'to-primary' },
  { from: /dark:to-stone-700/g, to: 'to-secondary' },
  { from: /dark:to-stone-600/g, to: 'to-muted' },
  { from: /dark:to-stone-500/g, to: 'to-muted' },
  { from: /dark:to-stone-400/g, to: 'to-muted' },
  { from: /dark:to-stone-300/g, to: 'to-primary' },
  { from: /dark:to-stone-200/g, to: 'to-primary' },
  { from: /dark:to-stone-100/g, to: 'to-muted' },

  { from: /dark:via-stone-900/g, to: 'via-primary' },
  { from: /dark:via-stone-800/g, to: 'via-primary' },
  { from: /dark:via-stone-700/g, to: 'via-secondary' },
  { from: /dark:via-stone-600/g, to: 'via-muted' },
  { from: /dark:via-stone-500/g, to: 'via-muted' },
  { from: /dark:via-stone-400/g, to: 'via-muted' },
  { from: /dark:via-stone-300/g, to: 'via-primary' },
  { from: /dark:via-stone-200/g, to: 'via-primary' },
  { from: /dark:via-stone-100/g, to: 'via-muted' },

  { from: /dark:outline-stone-900/g, to: 'outline-ring' },
  { from: /dark:outline-stone-800/g, to: 'outline-ring' },
  { from: /dark:outline-stone-700/g, to: 'outline-ring' },
  { from: /dark:outline-stone-600/g, to: 'outline-ring' },
  { from: /dark:outline-stone-500/g, to: 'outline-ring' },
  { from: /dark:outline-stone-400/g, to: 'outline-ring' },
  { from: /dark:outline-stone-300/g, to: 'outline-ring' },
  { from: /dark:outline-stone-200/g, to: 'outline-ring' },

  { from: /dark:ring-stone-900/g, to: 'ring-ring' },
  { from: /dark:ring-stone-800/g, to: 'ring-ring' },
  { from: /dark:ring-stone-700/g, to: 'ring-ring' },
  { from: /dark:ring-stone-600/g, to: 'ring-ring' },
  { from: /dark:ring-stone-500/g, to: 'ring-ring' },
  { from: /dark:ring-stone-400/g, to: 'ring-ring' },
  { from: /dark:ring-stone-300/g, to: 'ring-ring' },
  { from: /dark:ring-stone-200/g, to: 'ring-ring' },

  { from: /dark:shadow-stone-900/g, to: 'shadow-foreground' },
  { from: /dark:shadow-stone-800/g, to: 'shadow-primary' },
  { from: /dark:shadow-stone-700/g, to: 'shadow-primary' },
  { from: /dark:shadow-stone-600/g, to: 'shadow-muted' },
  { from: /dark:shadow-stone-500/g, to: 'shadow-muted' },
  { from: /dark:shadow-stone-400/g, to: 'shadow-muted-foreground' },
  { from: /dark:shadow-stone-300/g, to: 'shadow-border' },
  { from: /dark:shadow-stone-200/g, to: 'shadow-border' },

  { from: /dark:fill-stone-900/g, to: 'fill-primary' },
  { from: /dark:fill-stone-800/g, to: 'fill-primary' },
  { from: /dark:fill-stone-700/g, to: 'fill-secondary' },
  { from: /dark:fill-stone-600/g, to: 'fill-muted-foreground' },
  { from: /dark:fill-stone-500/g, to: 'fill-muted-foreground' },
  { from: /dark:fill-stone-400/g, to: 'fill-muted-foreground' },
  { from: /dark:fill-stone-300/g, to: 'fill-muted-foreground' },
  { from: /dark:fill-stone-200/g, to: 'fill-border' },
  { from: /dark:fill-stone-100/g, to: 'fill-background' },

  { from: /dark:stroke-stone-900/g, to: 'stroke-primary' },
  { from: /dark:stroke-stone-800/g, to: 'stroke-primary' },
  { from: /dark:stroke-stone-700/g, to: 'stroke-secondary' },
  { from: /dark:stroke-stone-600/g, to: 'stroke-muted-foreground' },
  { from: /dark:stroke-stone-500/g, to: 'stroke-muted-foreground' },
  { from: /dark:stroke-stone-400/g, to: 'stroke-muted-foreground' },
  { from: /dark:stroke-stone-300/g, to: 'stroke-muted-foreground' },
  { from: /dark:stroke-stone-200/g, to: 'stroke-border' },
  { from: /dark:stroke-stone-100/g, to: 'stroke-background' },

  { from: /dark:divide-stone-900/g, to: 'divide-border' },
  { from: /dark:divide-stone-800/g, to: 'divide-border' },
  { from: /dark:divide-stone-700/g, to: 'divide-border' },
  { from: /dark:divide-stone-700\/50/g, to: 'divide-border/50' },
  { from: /dark:divide-stone-600/g, to: 'divide-input' },
  { from: /dark:divide-stone-500/g, to: 'divide-input' },
  { from: /dark:divide-stone-400/g, to: 'divide-input' },
  { from: /dark:divide-stone-300/g, to: 'divide-input' },
  { from: /dark:divide-stone-200/g, to: 'divide-border' },
  { from: /dark:divide-stone-100/g, to: 'divide-border' },

  { from: /dark:decoration-stone-900/g, to: 'decoration-muted-foreground' },
  { from: /dark:decoration-stone-800/g, to: 'decoration-muted-foreground' },
  { from: /dark:decoration-stone-700/g, to: 'decoration-muted-foreground' },
  { from: /dark:decoration-stone-600/g, to: 'decoration-muted-foreground' },
  { from: /dark:decoration-stone-500/g, to: 'decoration-muted-foreground' },
  { from: /dark:decoration-stone-400/g, to: 'decoration-muted-foreground' },
  { from: /dark:decoration-stone-300/g, to: 'decoration-muted-foreground' },
  { from: /dark:decoration-stone-200/g, to: 'decoration-muted-foreground' },

  { from: /dark:caret-stone-900/g, to: 'caret-foreground' },
  { from: /dark:caret-stone-800/g, to: 'caret-foreground' },
  { from: /dark:caret-stone-700/g, to: 'caret-foreground' },
  { from: /dark:caret-stone-600/g, to: 'caret-foreground' },
  { from: /dark:caret-stone-500/g, to: 'caret-foreground' },
  { from: /dark:caret-stone-400/g, to: 'caret-foreground' },
  { from: /dark:caret-stone-300/g, to: 'caret-foreground' },
  { from: /dark:caret-stone-200/g, to: 'caret-foreground' },
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  let changes = [];

  for (const { from, to } of replacements) {
    if (from.test(content)) {
      const matches = content.match(from);
      if (matches) {
        changes.push(`${from.source} → ${to} (${matches.length} matches)`);
      }
      content = content.replace(from, to);
    }
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`\n=== ${filePath} ===`);
    changes.forEach(c => console.log(`  ${c}`));
  }
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.next') {
      walkDir(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts') || entry.name.endsWith('.css'))) {
      processFile(fullPath);
    }
  }
}

console.log('Starting semantic color replacement...');
walkDir(path.join(__dirname, '..', 'src'));
console.log('\nDone!');
