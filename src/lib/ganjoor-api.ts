import { Poet, Category, Poem, Chapter } from './types';
import { withRetry } from './retry-utils';
import { slugFromGanjoorFullUrl } from './ganjoor-slug';
import { withDurableCache } from './durable-cache';

const API_BASE_URL = 'https://api.ganjoor.net/api/ganjoor';
const GANJOOR_TIMEOUT_MS = 1000;
const GANJOOR_RETRY_COUNT = 1;
const NETWORK_FAILURE_COOLDOWN_MS = 15 * 1000;

const CIRCUIT_WINDOW_MS = 10 * 1000;
const CIRCUIT_OPEN_MS = 30 * 1000;
const CIRCUIT_FAILURE_THRESHOLD = 3;

const GANJOOR_TTL = {
  poets: 24 * 60 * 60 * 1000,
  poet: 12 * 60 * 60 * 1000,
  category: 6 * 60 * 60 * 1000,
  chapter: 6 * 60 * 60 * 1000,
  poem: 2 * 60 * 60 * 1000,
  randomPoem: 5 * 60 * 1000,
};

let circuitOpenedUntil = 0;
let recentFailureTimestamps: number[] = [];
let networkFailureCooldownUntil = 0;

class GanjoorApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'GanjoorApiError';
  }
}

export class GanjoorUnavailableError extends GanjoorApiError {
  constructor(message: string = 'Ganjoor API is temporarily unavailable') {
    super(message);
    this.name = 'GanjoorUnavailableError';
  }
}

function isCircuitOpen(): boolean {
  return Date.now() < circuitOpenedUntil;
}

function isNetworkFailureCoolingDown(): boolean {
  return Date.now() < networkFailureCooldownUntil;
}

function resetCircuitFailures(): void {
  recentFailureTimestamps = [];
  networkFailureCooldownUntil = 0;
}

function recordCircuitFailure(): void {
  const now = Date.now();
  recentFailureTimestamps = recentFailureTimestamps.filter(
    (timestamp) => now - timestamp <= CIRCUIT_WINDOW_MS
  );
  recentFailureTimestamps.push(now);

  if (recentFailureTimestamps.length >= CIRCUIT_FAILURE_THRESHOLD) {
    circuitOpenedUntil = now + CIRCUIT_OPEN_MS;
  }
}

function isNetworkLikeError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (error.name === 'TimeoutError' || error.name === 'AbortError') return true;
  if (error.name === 'TypeError' && error.message.includes('fetch')) return true;
  const message = error.message.toLowerCase();
  return (
    message.includes('timed out') ||
    message.includes('timeout') ||
    message.includes('network') ||
    message.includes('failed to fetch') ||
    message.includes('fetch failed') ||
    message.includes('econnrefused') ||
    message.includes('enotfound')
  );
}

function openFastFailureWindow(): void {
  const now = Date.now();
  circuitOpenedUntil = Math.max(circuitOpenedUntil, now + CIRCUIT_OPEN_MS);
  networkFailureCooldownUntil = now + NETWORK_FAILURE_COOLDOWN_MS;
}

async function fetchApi<T>(endpoint: string): Promise<T> {
  if (isCircuitOpen() || isNetworkFailureCoolingDown()) {
    throw new GanjoorUnavailableError('Ganjoor API circuit is open');
  }

  const fetchWithRetry = () => withRetry(async () => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(GANJOOR_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new GanjoorApiError(
        `API request failed: ${response.statusText}`,
        response.status
      );
    }

    const data = await response.json();
    return data;
  }, {
    maxRetries: GANJOOR_RETRY_COUNT,
    baseDelay: 300,
    retryCondition: (error) => {
      if (error instanceof GanjoorUnavailableError) {
        return false;
      }
      if (error instanceof GanjoorApiError && error.status && error.status < 500) {
        return false;
      }
      // Connection/timeout failures should fail fast (no second attempt).
      if (isNetworkLikeError(error)) return false;
      if (error.status === 429) return true;
      if (error.status && error.status >= 500) return true;
      return false;
    },
  });

  try {
    const data = await fetchWithRetry();
    resetCircuitFailures();
    return data;
  } catch (error) {
    recordCircuitFailure();
    if (isNetworkLikeError(error)) {
      openFastFailureWindow();
    }
    if (error instanceof GanjoorUnavailableError) {
      throw error;
    }
    if (error instanceof GanjoorApiError) {
      throw error;
    }
    throw new GanjoorUnavailableError(
      `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export const ganjoorApi = {
  // Get all poets
  async getPoets(): Promise<Poet[]> {
    return withDurableCache('ganjoor:/poets', async () => {
      const data = await fetchApi<Array<{
        id: number;
        name: string;
        fullUrl?: string;
        description?: string;
        birthYearInLHijri?: number;
        deathYearInLHijri?: number;
      }>>(`/poets`);
      return data.map(poet => ({
        id: poet.id,
        name: poet.name,
        slug: slugFromGanjoorFullUrl(poet.fullUrl),
        description: poet.description,
        birthYear: poet.birthYearInLHijri,
        deathYear: poet.deathYearInLHijri,
      }));
    }, GANJOOR_TTL.poets);
  },

  // Get poet details and categories
  async getPoet(id: number): Promise<{ poet: Poet; categories: Category[] }> {
    return withDurableCache(`ganjoor:/poet/${id}`, async () => {
      const poetResponse = await fetchApi<{
        poet: {
          id: number;
          name: string;
          fullUrl?: string;
          description?: string;
          birthYearInLHijri?: number;
          deathYearInLHijri?: number;
        };
        cat: {
          children?: Array<{
            id: number;
            title: string;
            urlSlug: string;
            description?: string;
          }>;
        };
      }>(`/poet/${id}`);
      
      // The API returns {poet: {...}, cat: {...}} structure
      const poetData = poetResponse.poet;
      const catData = poetResponse.cat;

      const poet: Poet = {
        id: poetData.id,
        name: poetData.name,
        slug: slugFromGanjoorFullUrl(poetData.fullUrl),
        description: poetData.description,
        birthYear: poetData.birthYearInLHijri,
        deathYear: poetData.deathYearInLHijri,
      };

      // Get categories from the cat.children array
      const categories: Category[] = catData.children?.map((category) => {
        return {
          id: category.id,
          title: category.title,
          description: category.description || '',
          poetId: id,
          // The API doesn't provide poem count, so we'll fetch it separately
          poemCount: undefined, // Will be populated later
        };
      }) || [];

      // Fetch poem counts for each category (with caching)
      const categoriesWithCounts = await Promise.all(
        categories.map(async (category) => {
          try {
            // Get category data to check for chapters
            const response = await fetchApi<{
              cat: {
                poems: Array<{id: number; title: string}>;
                children?: Array<{
                  id: number;
                  title: string;
                  urlSlug: string;
                }>;
              };
            }>(`/cat/${category.id}`);
            
            let poemCount = 0;
            let hasChapters = false;
            let chapters: Chapter[] = [];
            
            // Count direct poems
            if (response.cat.poems && response.cat.poems.length > 0) {
              poemCount += response.cat.poems.length;
            }
            
            // If category has chapters (children), count poems recursively
            if (response.cat.children && response.cat.children.length > 0) {
              hasChapters = true;
              chapters = response.cat.children.map(chapter => ({
                id: chapter.id,
                title: chapter.title,
                categoryId: category.id,
                poemCount: 0,
              }));

              const countPoemsRecursive = async (catId: number): Promise<number> => {
                try {
                  const node = await fetchApi<{ cat: { poems: Array<{ id: number; title: string }>; children?: Array<{ id: number }> } }>(`/cat/${catId}`);
                  let count = node.cat.poems?.length || 0;
                  if (node.cat.children && node.cat.children.length > 0) {
                    for (const child of node.cat.children) {
                      count += await countPoemsRecursive(child.id);
                    }
                  }
                  return count;
                } catch {
                  return 0;
                }
              };

              for (const chapter of response.cat.children) {
                const c = await countPoemsRecursive(chapter.id);
                poemCount += c;
                const idx = chapters.findIndex(x => x.id === chapter.id);
                if (idx !== -1) chapters[idx].poemCount = c;
              }
            }
            
            return {
              ...category,
              poemCount,
              hasChapters,
              chapters: hasChapters ? chapters : undefined,
            };
          } catch (error) {
            console.warn(`Failed to get poem count for category ${category.id}:`, error);
            return {
              ...category,
              poemCount: 0,
              hasChapters: false,
            };
          }
        })
      );

      return { poet, categories: categoriesWithCounts };
    }, GANJOOR_TTL.poet);
  },

  // Get poems from a category (handles both direct poems and chapters)
  async getCategoryPoems(poetId: number, categoryId: number): Promise<Poem[]> {
    return withDurableCache(`ganjoor:/cat/${categoryId}`, async () => {
      const data = await fetchApi<{
        poet: { name: string };
        cat: {
          title: string;
          poems: Array<{
            id: number;
            title: string;
            verses?: Array<{ text: string }>;
          }>;
          children?: Array<{
            id: number;
            title: string;
            urlSlug: string;
            description?: string;
          }>;
        };
      }>(`/cat/${categoryId}`);

      const allPoems: Poem[] = [];

      const addPoems = (poems: Array<{ id: number; title: string; verses?: Array<{ text: string }> }>, meta: { categoryTitle: string; chapterId?: number; chapterTitle?: string }) => {
        for (const p of poems) {
          allPoems.push({
            id: p.id,
            title: p.title,
            verses: p.verses?.map(v => v.text) || [],
            poetId,
            poetName: data.poet.name || '',
            categoryId,
            categoryTitle: meta.categoryTitle,
            chapterId: meta.chapterId,
            chapterTitle: meta.chapterTitle,
          });
        }
      };

      const traverse = async (catId: number, parentTitle: string, parentChapter?: { id: number; title: string }) => {
        const node = await fetchApi<{
          cat: {
            title: string;
            poems: Array<{ id: number; title: string; verses?: Array<{ text: string }> }>;
            children?: Array<{ id: number; title: string }>;
          };
        }>(`/cat/${catId}`);

        const title = node.cat.title || parentTitle;
        if (node.cat.poems && node.cat.poems.length > 0) {
          addPoems(node.cat.poems, {
            categoryTitle: title,
            chapterId: parentChapter?.id,
            chapterTitle: parentChapter?.title,
          });
        }
        if (node.cat.children && node.cat.children.length > 0) {
          for (const child of node.cat.children) {
            await traverse(child.id, title, parentChapter || { id: child.id, title: child.title });
          }
        }
      };

      if (data.cat.poems && data.cat.poems.length > 0) {
        addPoems(data.cat.poems, { categoryTitle: data.cat.title });
      }
      if (data.cat.children && data.cat.children.length > 0) {
        for (const child of data.cat.children) {
          await traverse(child.id, data.cat.title, { id: child.id, title: child.title });
        }
      }

      return allPoems;
    }, GANJOOR_TTL.category);
  },

  // Get chapter details
  async getChapter(poetId: number, categoryId: number, chapterId: number): Promise<{ chapter: Chapter; poems: Poem[] }> {
    return withDurableCache(`ganjoor:/chapter/${chapterId}`, async () => {
      const root = await fetchApi<{
        poet: { name: string };
        cat: {
          title: string;
          poems: Array<{ id: number; title: string; verses?: Array<{ text: string }> }>;
          children?: Array<{ id: number; title: string }>;
        };
      }>(`/cat/${chapterId}`);

      const chapter: Chapter = {
        id: chapterId,
        title: root.cat.title,
        categoryId,
        poemCount: 0,
      };

      const poems: Poem[] = [];

      const addPoems = (poemsInput: Array<{ id: number; title: string; verses?: Array<{ text: string }> }>, metaTitle: string) => {
        for (const p of poemsInput) {
          poems.push({
            id: p.id,
            title: p.title,
            verses: p.verses?.map(v => v.text) || [],
            poetId,
            poetName: root.poet.name || '',
            categoryId,
            categoryTitle: '',
            chapterId: chapterId,
            chapterTitle: metaTitle,
          });
        }
      };

      const traverse = async (catId: number, title: string) => {
        const node = await fetchApi<{
          cat: {
            title: string;
            poems: Array<{ id: number; title: string; verses?: Array<{ text: string }> }>;
            children?: Array<{ id: number; title: string }>;
          };
        }>(`/cat/${catId}`);
        const currentTitle = node.cat.title || title;
        if (node.cat.poems && node.cat.poems.length > 0) {
          addPoems(node.cat.poems, currentTitle);
        }
        if (node.cat.children && node.cat.children.length > 0) {
          for (const child of node.cat.children) {
            await traverse(child.id, currentTitle);
          }
        }
      };

      if (root.cat.poems && root.cat.poems.length > 0) {
        addPoems(root.cat.poems, root.cat.title);
      }
      if (root.cat.children && root.cat.children.length > 0) {
        for (const child of root.cat.children) {
          await traverse(child.id, root.cat.title);
        }
      }

      chapter.poemCount = poems.length;
      return { chapter, poems };
    }, GANJOOR_TTL.chapter);
  },

  // Get individual poem
  async getPoem(id: number): Promise<Poem> {
    return withDurableCache(`ganjoor:/poem/${id}`, async () => {
      const data = await fetchApi<unknown>(`/poem/${id}`);

      const obj = data as Record<string, unknown>;
      const idNum = typeof obj.id === 'number' ? obj.id : id;
      const titleStr = typeof obj.title === 'string' ? obj.title : '';

      const category = obj.category as Record<string, unknown> | undefined;
      const poetObj = category?.poet as Record<string, unknown> | undefined;
      const catObj = category?.cat as Record<string, unknown> | undefined;

      const poetId = typeof poetObj?.id === 'number' ? (poetObj?.id as number) : 0;
      const poetName = typeof poetObj?.name === 'string' ? (poetObj?.name as string) : '';
      const catId = typeof catObj?.id === 'number' ? (catObj?.id as number) : undefined;
      const catTitle = typeof catObj?.title === 'string' ? (catObj?.title as string) : '';

      let verses: string[] = [];
      const versesArr = obj.verses as unknown;
      if (Array.isArray(versesArr)) {
        verses = (versesArr as Array<{ text?: string }>).map(v => (typeof v.text === 'string' ? v.text : '')).filter(Boolean);
      }

      if (verses.length === 0) {
        const htmlCandidates = ['poemHtml', 'html', 'poemHTML', 'poem_body', 'poem'];
        let html: string | undefined;
        for (const key of htmlCandidates) {
          const val = obj[key];
          if (typeof val === 'string' && val.length > 50) { html = val; break; }
        }
        if (!html && typeof obj['fullText'] === 'string') {
          html = obj['fullText'] as string;
        }
        if (!html && typeof obj['plainText'] === 'string') {
          const plain = obj['plainText'] as string;
          verses = plain.split(/\r?\n+/).map(s => s.trim()).filter(Boolean);
        }
        if (!html && verses.length === 0 && typeof obj['body'] === 'string') {
          const plain = obj['body'] as string;
          verses = plain.split(/\r?\n+/).map(s => s.trim()).filter(Boolean);
        }
        if (html) {
          const cleaned = html
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<div[^>]*>/gi, '\n')
            .replace(/<\/div>/gi, '\n')
            .replace(/<p[^>]*>/gi, '\n')
            .replace(/<\/p>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'")
            .replace(/&amp;/g, '&');
          verses = cleaned.split(/\n+/).map(s => s.trim()).filter(Boolean);
        }
      }
      
      return {
        id: idNum,
        title: titleStr,
        verses: verses,
        poetId: poetId,
        poetName: poetName,
        categoryId: catId,
        categoryTitle: catTitle,
      };
    }, GANJOOR_TTL.poem);
  },

  // Get a random poem from all poets
  async getRandomPoem(): Promise<Poem> {
    return withDurableCache('ganjoor:/random-poem', async () => {
      try {
        // Get all poets first
        const poets = await this.getPoets();
        
        // Pick a random poet
        const randomPoet = poets[Math.floor(Math.random() * poets.length)];
        
        // Get poet's categories
        const { categories } = await this.getPoet(randomPoet.id);
        
        if (categories.length === 0) {
          // Fallback to a known poem if no categories
          const fallbackPoem = await this.getPoem(2133); // Hafez poem as fallback
          return {
            ...fallbackPoem,
            poetId: randomPoet.id,
            poetName: randomPoet.name,
          };
        }
        
        // Pick a random category
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        
        // Get poems from that category
        const poems = await this.getCategoryPoems(randomPoet.id, randomCategory.id);
        
        if (poems.length === 0) {
          // Fallback to a known poem if no poems in category
          const fallbackPoem = await this.getPoem(2133);
          return {
            ...fallbackPoem,
            poetId: randomPoet.id,
            poetName: randomPoet.name,
          };
        }
        
        // Pick a random poem
        const randomPoem = poems[Math.floor(Math.random() * poems.length)];
        
        // Get the full poem details
        const fullPoem = await this.getPoem(randomPoem.id);
        
        // Ensure poet information is set correctly
        return {
          ...fullPoem,
          poetId: randomPoet.id,
          poetName: randomPoet.name,
        };
      } catch (error) {
        console.error('Error getting random poem:', error);
        // Fallback to a known poem with proper poet info
        const fallbackPoem = await this.getPoem(2133);
        return {
          ...fallbackPoem,
          poetId: 2, // Hafez ID
          poetName: 'حافظ',
        };
      }
    }, GANJOOR_TTL.randomPoem);
  },

  // Note: Search functions removed - now handled by Supabase API
  // See src/app/api/search/route.ts and src/lib/supabase-search.ts
};
