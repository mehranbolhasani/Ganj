/**
 * Client-side search index for fast, offline search
 * Uses FlexSearch for full-text search with Persian/Farsi support
 * 
 * CHUNKED INDEXING APPROACH:
 * - Builds index incrementally in small chunks
 * - Makes index searchable as soon as first chunk completes
 * - Saves chunks to IndexedDB progressively
 * - Continues building in background
 */

import { Index } from 'flexsearch';
import { Poet, Category, Poem } from './types';
import { ganjoorApi } from './ganjoor-api';

interface SearchablePoet {
  id: number;
  name: string;
  description?: string;
  type: 'poet';
}

interface SearchableCategory {
  id: number;
  title: string;
  description?: string;
  poetId: number;
  poetName: string;
  type: 'category';
}

interface SearchablePoem {
  id: number;
  title: string;
  versesText: string; // All verses joined for search
  poetId: number;
  poetName: string;
  categoryId?: number;
  categoryTitle?: string;
  type: 'poem';
}

// Most famous poets IDs (based on Ganjoor API order and famous poets list)
// These are: Hafez, Saadi, Molavi, Ferdowsi, Attar, Nezami, and a few more
const FAMOUS_POET_IDS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]; // Top 10 famous poets

interface IndexChunk {
  poets: SearchablePoet[];
  categories: SearchableCategory[];
  poems: SearchablePoem[];
  chunkNumber: number;
  totalChunks: number;
}

class SearchIndex {
  private poetsIndex: Index | null = null;
  private categoriesIndex: Index | null = null;
  private poemsIndex: Index | null = null;
  
  private poets: SearchablePoet[] = [];
  private categories: SearchableCategory[] = [];
  private poems: SearchablePoem[] = [];
  
  // Track which poets are famous for prioritization
  private readonly famousPoetIds = new Set<number>(FAMOUS_POET_IDS);
  
  private isIndexing = false;
  private indexPromise: Promise<void> | null = null;
  private indexedAt: number = 0;
  private indexingProgress = { current: 0, total: 0 };
  
  // Index freshness: rebuild if older than 24 hours
  private readonly INDEX_TTL = 24 * 60 * 60 * 1000;
  
  // Version of the index format - increment this to force rebuild
  private readonly INDEX_VERSION = 4; // Incremented to 4 for full poem indexing of famous poets
  
  // IndexedDB version - must be consistent across all operations
  private readonly DB_VERSION = 4; // Version 4 for chunked storage
  
  /**
   * Initialize and build the search index
   * This should be called once on app startup
   */
  async initialize(): Promise<void> {
    if (this.indexPromise) {
      return this.indexPromise;
    }

    // Check if index is still fresh
    if (this.isIndexed && Date.now() - this.indexedAt < this.INDEX_TTL) {
      return Promise.resolve();
    }

    this.indexPromise = this.buildIndexIncrementally();
    return this.indexPromise;
  }

  /**
   * Build index incrementally in chunks
   * Makes index searchable after first chunk completes
   */
  private async buildIndexIncrementally(): Promise<void> {
    if (this.isIndexing) {
      return;
    }

    this.isIndexing = true;
    console.log('[SearchIndex] Starting incremental index building...');

    try {
      // Try to load existing chunks from IndexedDB first
      const existingChunks = await this.loadChunksFromIndexedDB();
      if (existingChunks.length > 0) {
        console.log(`[SearchIndex] Found ${existingChunks.length} existing chunks, loading...`);
        // Merge existing chunks
        for (const chunk of existingChunks) {
          this.poets.push(...chunk.poets);
          this.categories.push(...chunk.categories);
          this.poems.push(...chunk.poems);
        }
        this.rebuildFlexSearchIndexes();
        console.log(`[SearchIndex] Loaded existing data: ${this.poets.length} poets, ${this.categories.length} categories, ${this.poems.length} poems`);
      }

      // Get all poets to determine chunks
      const allPoets = await ganjoorApi.getPoets();
      this.poets = allPoets.map(poet => ({
        id: poet.id,
        name: poet.name,
        description: poet.description,
        type: 'poet' as const,
      }));

      // Build poets and categories index first (fast, no poems yet)
      const categoryPromises: Promise<void>[] = [];
      const poetsToIndex = allPoets.slice(0, 20); // Index top 20 poets in chunks
      
      for (const poet of poetsToIndex) {
        categoryPromises.push(
          ganjoorApi.getPoet(poet.id).then(({ categories }) => {
            const poetCategories = categories.map(cat => ({
              id: cat.id,
              title: cat.title,
              description: cat.description,
              poetId: poet.id,
              poetName: poet.name,
              type: 'category' as const,
            }));
            this.categories.push(...poetCategories);
          }).catch(() => {
            // Silently skip failed poets
          })
        );
      }

      await Promise.all(categoryPromises);
      
      // Rebuild indexes with poets and categories (makes it searchable immediately)
      this.rebuildFlexSearchIndexes();
      console.log('[SearchIndex] Initial index ready: poets and categories indexed');

      // Now build poem chunks incrementally (non-blocking - happens in background)
      // Don't await - let it continue in background
      this.buildPoemChunksIncrementally(poetsToIndex).then(() => {
        // Final save to IndexedDB after all chunks done
        this.saveToIndexedDB().catch(() => {
          // Ignore save errors
        });
      }).catch((err) => {
        console.warn('[SearchIndex] Error building poem chunks:', err);
      });

      this.indexedAt = Date.now();
      console.log(`[SearchIndex] Index build completed: ${this.poets.length} poets, ${this.categories.length} categories, ${this.poems.length} poems`);
    } catch (error) {
      console.error('[SearchIndex] Failed to build index:', error);
      throw error;
    } finally {
      this.isIndexing = false;
      this.indexPromise = null;
    }
  }

  /**
   * Build poem chunks incrementally - one poet at a time
   */
  private async buildPoemChunksIncrementally(poets: Array<{ id: number; name: string }>): Promise<void> {
    const chunkSize = 1; // One poet per chunk
    const totalChunks = Math.ceil(poets.length / chunkSize);
    
    this.indexingProgress = { current: 0, total: totalChunks };

    for (let i = 0; i < poets.length; i += chunkSize) {
      const chunkPoets = poets.slice(i, i + chunkSize);
      const chunkNumber = Math.floor(i / chunkSize) + 1;

      // Process one poet at a time
      for (const poet of chunkPoets) {
        try {
          const { categories } = await ganjoorApi.getPoet(poet.id);
          const isFamous = this.famousPoetIds.has(poet.id);
          
          if (isFamous) {
            // For famous poets: Fetch ALL poems from top 3 categories
            console.log(`[SearchIndex] Indexing famous poet: ${poet.name}`);
            const topCategories = categories.slice(0, 3);
            
            for (const category of topCategories) {
              try {
                const poemsList = await ganjoorApi.getCategoryPoems(poet.id, category.id);
                console.log(`[SearchIndex] ${poet.name} - ${category.title}: ${poemsList.length} poems to index`);
                
                // Fetch ALL full poems (with batching and rate limiting)
                const batchSize = 5; // Fetch 5 poems at a time
                let successCount = 0;
                
                for (let j = 0; j < poemsList.length; j += batchSize) {
                  const batch = poemsList.slice(j, j + batchSize);
                  
                  // Fetch batch of full poems in parallel
                  const batchPromises = batch.map(async (poem) => {
                    try {
                      const fullPoem = await ganjoorApi.getPoem(poem.id);
                      successCount++;
                      return {
                        id: fullPoem.id,
                        title: fullPoem.title,
                        versesText: fullPoem.verses ? fullPoem.verses.filter((v: string) => v && v.trim()).join(' ') : '',
                        poetId: poet.id,
                        poetName: fullPoem.poetName,
                        categoryId: fullPoem.categoryId,
                        categoryTitle: fullPoem.categoryTitle,
                        type: 'poem' as const,
                      };
                    } catch {
                      // On error, just index the title (better than nothing)
                      return {
                        id: poem.id,
                        title: poem.title,
                        versesText: '', // No verses available
                        poetId: poet.id,
                        poetName: poem.poetName,
                        categoryId: poem.categoryId,
                        categoryTitle: poem.categoryTitle,
                        type: 'poem' as const,
                      };
                    }
                  });
                  
                  const batchResults = await Promise.all(batchPromises);
                  
                  // Add to index immediately (progressive indexing)
                  this.poems.push(...batchResults);
                  this.rebuildFlexSearchIndexes();
                  
                  // Rate limiting: Wait between batches
                  if (j + batchSize < poemsList.length) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                  }
                }
                
                console.log(
                  `[SearchIndex] ${poet.name} - ${category.title}: ` +
                  `${successCount}/${poemsList.length} poems indexed with full verses ` +
                  `(${Math.round(successCount * 100 / poemsList.length)}%)`
                );
                
              } catch (error) {
                console.warn(`[SearchIndex] Failed to index category ${category.title}:`, error);
              }
            }
          } else {
            // For non-famous poets: Just index titles from top 2 categories (no full poems)
            const topCategories = categories.slice(0, 2);
            
            for (const category of topCategories) {
              try {
                const poemsList = await ganjoorApi.getCategoryPoems(poet.id, category.id);
                
                // Index titles only (category endpoint doesn't provide full verses)
                const searchablePoems = poemsList.map(poem => ({
                  id: poem.id,
                  title: poem.title,
                  versesText: '', // Skip verses for non-famous poets
                  poetId: poet.id,
                  poetName: poem.poetName,
                  categoryId: poem.categoryId,
                  categoryTitle: poem.categoryTitle,
                  type: 'poem' as const,
                }));
                
                this.poems.push(...searchablePoems);
                this.rebuildFlexSearchIndexes();
                
              } catch {
                // Silently skip failed categories
              }
            }
          }
        } catch (error) {
          console.warn(`[SearchIndex] Failed to index poet ${poet.name}:`, error);
        }

        // Save chunk to IndexedDB periodically (every 3 poets) - non-blocking
        if (chunkNumber % 3 === 0) {
          this.saveChunkToIndexedDB(chunkNumber, totalChunks).catch(() => {
            // Silently ignore chunk save errors - it's optional
          });
        }
      }

      this.indexingProgress.current = chunkNumber;
      
      // Small delay between poets to avoid overwhelming API
      if (i + chunkSize < poets.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Final chunk save - non-blocking
    this.saveChunkToIndexedDB(totalChunks, totalChunks).catch(() => {
      // Silently ignore chunk save errors
    });
    
    console.log('[SearchIndex] Incremental poem indexing complete');
    console.log(`[SearchIndex] Final index: ${this.poems.length} poems, ${this.categories.length} categories, ${this.poets.length} poets`);
    const poemsWithVerses = this.poems.filter(p => p.versesText && p.versesText.length > 50);
    console.log(`[SearchIndex] Poems with full verses: ${poemsWithVerses.length}/${this.poems.length} (${Math.round(poemsWithVerses.length * 100 / this.poems.length)}%)`);
  }

  /**
   * Rebuild FlexSearch indexes from current data
   */
  private rebuildFlexSearchIndexes(): void {
    // FlexSearch configuration optimized for Persian text
    // More permissive for better Persian/Farsi matching
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const flexSearchOptions: any = {
      threshold: 7, // Very permissive (0-9) - increased from 6 to 7 for better Persian text matching
      resolution: 9, // Higher = more accurate
      depth: 4, // Increased from 3 to 4 for deeper matching
      // Note: Higher threshold helps with Persian text variations
    };

    // Create poets index
    this.poetsIndex = new Index(flexSearchOptions);
    for (let i = 0; i < this.poets.length; i++) {
      const poet = this.poets[i];
      const searchText = `${poet.name} ${poet.description || ''}`;
      this.poetsIndex.add(i, searchText);
    }

    // Create categories index
    this.categoriesIndex = new Index(flexSearchOptions);
    for (let i = 0; i < this.categories.length; i++) {
      const category = this.categories[i];
      const searchText = `${category.title} ${category.description || ''} ${category.poetName}`;
      this.categoriesIndex.add(i, searchText);
    }

    // Create poems index
    this.poemsIndex = new Index(flexSearchOptions);
    for (let i = 0; i < this.poems.length; i++) {
      const poem = this.poems[i];
      // Normalize text for better Persian search: remove extra spaces, join properly
      const normalizedVerses = poem.versesText ? poem.versesText.replace(/\s+/g, ' ').trim() : '';
      
      // Build searchable text: title + verses + poet name
      // This gives FlexSearch multiple fields to search
      const searchText = `${poem.title} ${normalizedVerses} ${poem.poetName}`.trim();
      
      if (searchText.length > 0) {
        this.poemsIndex.add(i, searchText);
      }
    }
  }

  /**
   * Check if index is built and ready
   */
  get isIndexed(): boolean {
    // Index is ready as soon as we have any poems indexed (incremental approach)
    return this.poemsIndex !== null && this.poems.length > 0;
  }

  /**
   * Search poets with prioritization for famous poets
   */
  searchPoets(query: string, limit: number = 20): Poet[] {
    if (!this.isIndexed || !this.poetsIndex) {
      return [];
    }

    const results = this.poetsIndex.search(query, limit * 2) as number[];
    
    // Map FlexSearch indices to Poets
    let matchedPoets = results
      .map((index: number) => this.poets[index])
      .filter((poet: SearchablePoet | undefined): poet is SearchablePoet => poet !== undefined)
      .map((poet: SearchablePoet) => ({
        id: poet.id,
        name: poet.name,
        slug: '',
        description: poet.description,
        birthYear: undefined,
        deathYear: undefined,
      }));

    // Prioritize famous poets
    matchedPoets = matchedPoets.sort((a: Poet, b: Poet) => {
      const aIsFamous = this.famousPoetIds.has(a.id);
      const bIsFamous = this.famousPoetIds.has(b.id);
      
      if (aIsFamous && !bIsFamous) return -1;
      if (!aIsFamous && bIsFamous) return 1;
      return 0;
    });

    return matchedPoets.slice(0, limit);
  }

  /**
   * Search categories
   */
  searchCategories(query: string, limit: number = 20): Category[] {
    if (!this.isIndexed || !this.categoriesIndex) {
      return [];
    }

    const results = this.categoriesIndex.search(query, limit) as number[];
    
    return results
      .map((index: number) => this.categories[index])
      .filter((category: SearchableCategory | undefined): category is SearchableCategory => category !== undefined)
      .map((category: SearchableCategory) => ({
        id: category.id,
        title: category.title,
        description: category.description || '',
        poetId: category.poetId,
        poemCount: undefined,
        hasChapters: false,
      }));
  }

  /**
   * Search poems with prioritization for famous poets
   */
  searchPoems(query: string, limit: number = 20): Poem[] {
    if (!this.isIndexed || !this.poemsIndex) {
      console.warn('[SearchIndex] Index not ready, returning empty results');
      return [];
    }

    // Search with much higher limit to get all possible results for sorting
    // FlexSearch can handle large limits efficiently
    // Use very high limit to ensure we find all matches
    const searchLimit = Math.max(limit * 10, 500); // Get up to 500 results for sorting
    
    // Try searching with the query as-is first
    let results = this.poemsIndex.search(query, searchLimit) as number[];
    
    // If results are too few, try searching with normalized query (remove spaces for Persian)
    if (results.length < 5) {
      const normalizedQuery = query.replace(/\s+/g, '').trim();
      if (normalizedQuery.length > 0 && normalizedQuery !== query) {
        console.log(`[SearchIndex] Trying normalized query: "${normalizedQuery}"`);
        const normalizedResults = this.poemsIndex.search(normalizedQuery, searchLimit) as number[];
        // Combine results (remove duplicates)
        const combined = [...new Set([...results, ...normalizedResults])];
        if (combined.length > results.length) {
          console.log(`[SearchIndex] Normalized search found ${combined.length} total matches`);
          results = combined;
        }
      }
    }
    
    console.log(`[SearchIndex] Search "${query}": Found ${results.length} matches out of ${this.poems.length} indexed poems`);
    
    // Debug: Show sample matches if results are low
    if (results.length < 10 && results.length > 0) {
      const sampleMatches = results.slice(0, 3).map(idx => {
        const poem = this.poems[idx];
        return { 
          id: poem.id, 
          title: poem.title.substring(0, 40), 
          hasVerses: !!poem.versesText,
          versesLength: poem.versesText?.length || 0,
          containsQuery: poem.versesText?.includes(query) || poem.title.includes(query)
        };
      });
      console.log('[SearchIndex] Sample matches:', sampleMatches);
      
      // Also check if any poems contain the query in their verses
      const poemsWithQuery = this.poems.filter(p => 
        p.versesText?.includes(query) || p.title.includes(query)
      );
      console.log(`[SearchIndex] Found ${poemsWithQuery.length} poems that manually contain "${query}"`);
    }
    
    // Map to Poem objects and prioritize famous poets
    let matchedPoems = results
      .map((index: number) => this.poems[index])
      .filter((poem: SearchablePoem | undefined): poem is SearchablePoem => poem !== undefined)
      .map((poem: SearchablePoem) => ({
        id: poem.id,
        title: poem.title,
        // Reconstruct verses - versesText is already joined with spaces
        // For display, split back into array (one verse per line roughly)
        verses: poem.versesText ? [poem.versesText.substring(0, 100) + '...'] : [], // Preview for display
        poetId: poem.poetId,
        poetName: poem.poetName,
        categoryId: poem.categoryId,
        categoryTitle: poem.categoryTitle,
      }));

    // Prioritize: famous poets first, then by relevance score
    matchedPoems = matchedPoems.sort((a: Poem, b: Poem) => {
      const aIsFamous = this.famousPoetIds.has(a.poetId);
      const bIsFamous = this.famousPoetIds.has(b.poetId);
      
      // Famous poets come first
      if (aIsFamous && !bIsFamous) return -1;
      if (!aIsFamous && bIsFamous) return 1;
      
      // Within same group, maintain FlexSearch's relevance order
      return 0;
    });
    
    return matchedPoems.slice(0, limit);
  }

  /**
   * Save chunk to IndexedDB (incremental saves)
   */
  private async saveChunkToIndexedDB(chunkNumber: number, totalChunks: number): Promise<void> {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return;
    }

    try {
      const dbName = 'ganj-search-index';
      const storeName = 'chunks';
      
      await new Promise<void>((resolve) => {
        const request = indexedDB.open(dbName, this.DB_VERSION);
        
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName);
          }
          if (!db.objectStoreNames.contains('main')) {
            db.createObjectStore('main');
          }
        };

        request.onsuccess = () => {
          const db = request.result;
          
          // Check if object store exists, if not, trigger upgrade
          if (!db.objectStoreNames.contains(storeName)) {
            db.close();
            // Try with higher version to trigger upgrade
            // Note: If DB already exists at higher version, this will fail - that's okay, we'll use main store
            const upgradeRequest = indexedDB.open(dbName, this.DB_VERSION + 1);
            upgradeRequest.onupgradeneeded = (event) => {
              const upgradeDb = (event.target as IDBOpenDBRequest).result;
              if (!upgradeDb.objectStoreNames.contains(storeName)) {
                upgradeDb.createObjectStore(storeName);
              }
              if (!upgradeDb.objectStoreNames.contains('main')) {
                upgradeDb.createObjectStore('main');
              }
            };
            upgradeRequest.onsuccess = () => {
              const upgradeDb = upgradeRequest.result;
              try {
                const transaction = upgradeDb.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                
                const chunk: IndexChunk = {
                  poets: this.poets,
                  categories: this.categories,
                  poems: this.poems,
                  chunkNumber,
                  totalChunks,
                };
                
                store.put(chunk, `chunk-${chunkNumber}`);
                resolve();
              } catch {
                resolve(); // Don't fail on save errors
              }
            };
            upgradeRequest.onerror = () => resolve();
            return;
          }
          
          try {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            const chunk: IndexChunk = {
              poets: this.poets,
              categories: this.categories,
              poems: this.poems,
              chunkNumber,
              totalChunks,
            };
            
            store.put(chunk, `chunk-${chunkNumber}`);
            resolve();
          } catch {
            resolve(); // Don't fail on save errors
          }
        };

        request.onerror = () => {
          resolve(); // Don't fail on save errors
        };
      });
      } catch {
        // Silently ignore save errors - chunks are optional
      }
  }

  /**
   * Load chunks from IndexedDB
   */
  private async loadChunksFromIndexedDB(): Promise<IndexChunk[]> {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return [];
    }

    try {
      const dbName = 'ganj-search-index';
      const storeName = 'chunks';
      
      return new Promise<IndexChunk[]>((resolve) => {
        const request = indexedDB.open(dbName, this.DB_VERSION);
        
        request.onsuccess = () => {
          const db = request.result;
          
          if (!db.objectStoreNames.contains(storeName)) {
            resolve([]);
            return;
          }
          
          const transaction = db.transaction([storeName], 'readonly');
          const store = transaction.objectStore(storeName);
          const getAllRequest = store.getAll();
          
          getAllRequest.onsuccess = () => {
            const chunks = getAllRequest.result as IndexChunk[];
            // Sort by chunk number
            chunks.sort((a, b) => a.chunkNumber - b.chunkNumber);
            
            // Check if chunks are from current version
            if (chunks.length > 0 && chunks[0].totalChunks) {
              resolve(chunks);
            } else {
              resolve([]);
            }
          };
          
          getAllRequest.onerror = () => {
            resolve([]);
          };
        };
        
        request.onerror = () => {
          resolve([]);
        };
      });
    } catch {
      return [];
    }
  }

  /**
   * Save index to IndexedDB for persistence
   */
  private async saveToIndexedDB(): Promise<void> {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return;
    }

    return new Promise((resolve) => {
      try {
        const dbName = 'ganj-search-index';
        const storeName = 'main';
        
        const request = indexedDB.open(dbName, this.DB_VERSION);
        
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName);
          }
          if (!db.objectStoreNames.contains('chunks')) {
            db.createObjectStore('chunks');
          }
        };

        request.onsuccess = () => {
          const db = request.result;
          
          if (!db.objectStoreNames.contains(storeName)) {
            db.close();
            const retryRequest = indexedDB.open(dbName, this.DB_VERSION + 1);
            retryRequest.onupgradeneeded = (event) => {
              const retryDb = (event.target as IDBOpenDBRequest).result;
              if (!retryDb.objectStoreNames.contains(storeName)) {
                retryDb.createObjectStore(storeName);
              }
              if (!retryDb.objectStoreNames.contains('chunks')) {
                retryDb.createObjectStore('chunks');
              }
            };
            retryRequest.onsuccess = () => {
              const retryDb = retryRequest.result;
              try {
                const transaction = retryDb.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                store.put({
                  poets: this.poets,
                  categories: this.categories,
                  poems: this.poems,
                  timestamp: Date.now(),
                  version: this.INDEX_VERSION, // Save version with index
                }, 'main');
                resolve();
              } catch (error: unknown) {
                console.warn('[SearchIndex] Error in retry save:', error);
                resolve();
              }
            };
            retryRequest.onerror = () => {
              console.warn('[SearchIndex] Retry failed:', retryRequest.error);
              resolve();
            };
            return;
          }
          
          try {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const putRequest = store.put({
              poets: this.poets,
              categories: this.categories,
              poems: this.poems,
              timestamp: Date.now(),
              version: this.INDEX_VERSION, // Save version with index
            }, 'main');
            
            putRequest.onsuccess = () => {
              resolve();
            };
            
            putRequest.onerror = () => {
              console.warn('[SearchIndex] Failed to save to IndexedDB:', putRequest.error);
              resolve();
            };
          } catch (error: unknown) {
            console.warn('[SearchIndex] Error creating transaction:', error);
            resolve();
          }
        };

        request.onerror = () => {
          const error = request.error;
          // If version error, try to detect current version and use higher version
          if (error && (error as DOMException).name === 'VersionError') {
            // Try to open without version to get current version
            const versionCheck = indexedDB.open(dbName);
            versionCheck.onsuccess = () => {
              const currentDb = versionCheck.result;
              const currentVersion = currentDb.version;
              currentDb.close();
              
              // Try opening with current version + 1
              const retryRequest = indexedDB.open(dbName, currentVersion + 1);
              retryRequest.onupgradeneeded = (event) => {
                const retryDb = (event.target as IDBOpenDBRequest).result;
                if (!retryDb.objectStoreNames.contains(storeName)) {
                  retryDb.createObjectStore(storeName);
                }
                if (!retryDb.objectStoreNames.contains('main')) {
                  retryDb.createObjectStore('main');
                }
              };
              retryRequest.onsuccess = () => {
                // Note: We can't update readonly property, but version is handled now
                // Try saving again
                this.saveToIndexedDB().then(() => resolve()).catch(() => resolve());
              };
              retryRequest.onerror = () => resolve();
            };
            versionCheck.onerror = () => resolve();
            return;
          }
          console.warn('[SearchIndex] Failed to open IndexedDB:', error);
          resolve();
        };
      } catch (error) {
        console.warn('[SearchIndex] IndexedDB not available:', error);
        resolve();
      }
    });
  }

  /**
   * Load index from IndexedDB
   */
  private async loadFromIndexedDB(): Promise<{
    poets: SearchablePoet[];
    categories: SearchableCategory[];
    poems: SearchablePoem[];
    timestamp: number;
    version?: number; // Index format version
  } | null> {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return null;
    }

    try {
      return new Promise((resolve) => {
        const dbName = 'ganj-search-index';
        const storeName = 'main';
        
        const request = indexedDB.open(dbName, this.DB_VERSION);
        
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName);
          }
          if (!db.objectStoreNames.contains('chunks')) {
            db.createObjectStore('chunks');
          }
          resolve(null);
        };

        request.onsuccess = () => {
          const db = request.result;
          
          if (!db.objectStoreNames.contains(storeName)) {
            resolve(null);
            return;
          }
          
          try {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const getRequest = store.get('main');

            getRequest.onsuccess = () => {
              resolve(getRequest.result || null);
            };

            getRequest.onerror = () => {
              resolve(null);
            };
          } catch (error) {
            console.warn('[SearchIndex] Transaction error:', error);
            resolve(null);
          }
        };

        request.onerror = () => {
          resolve(null);
        };
      });
    } catch (error) {
      console.warn('[SearchIndex] Failed to load from IndexedDB:', error);
      return null;
    }
  }

  /**
   * Get index statistics
   */
  getStats() {
    return {
      isIndexed: this.isIndexed,
      indexedAt: this.indexedAt,
      poetsCount: this.poets.length,
      categoriesCount: this.categories.length,
      poemsCount: this.poems.length,
      isIndexing: this.isIndexing,
    };
  }

  /**
   * Get progress information for UI display
   */
  getProgress(): { status: 'ready' | 'loading' | 'building'; progress: number; message?: string } {
    if (this.isIndexed && this.indexingProgress.current >= this.indexingProgress.total) {
      return { status: 'ready', progress: 100 };
    }
    
    if (this.isIndexing) {
      // Progress based on chunks completed
      const progress = this.indexingProgress.total > 0
        ? Math.min(95, Math.round((this.indexingProgress.current / this.indexingProgress.total) * 100))
        : Math.min(95, Math.round((this.poems.length / 5000) * 100)); // Fallback estimate
      
      let message = '';
      if (progress < 20) {
        message = 'در حال بارگذاری شاعران...';
      } else if (progress < 50) {
        message = 'در حال بارگذاری مجموعه‌ها...';
      } else if (progress < 80) {
        message = 'در حال بارگذاری اشعار...';
      } else {
        message = 'در حال آماده‌سازی نهایی...';
      }
      
      return { status: 'building', progress: Math.max(5, progress), message };
    }
    
    return { status: 'loading', progress: 0 };
  }

  /**
   * Get index version (for debugging)
   */
  get indexVersion(): number {
    return this.INDEX_VERSION;
  }

  /**
   * Force rebuild the index
   */
  async rebuild(): Promise<void> {
    this.indexedAt = 0;
    this.indexPromise = null;
    this.poems = [];
    this.categories = [];
    await this.buildIndexIncrementally();
  }
}

// Export singleton instance
export const searchIndex = new SearchIndex();
