import { Poet, Category, Poem } from './types';

interface SearchResponse {
  poets: Poet[];
  categories: Category[];
  poems: Poem[];
  message?: string;
}

// Simple in-memory cache for search results
const searchCache = new Map<string, { data: SearchResponse; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function searchAll(
  query: string,
  limit: number = 20,
  type: 'all' | 'poets' | 'categories' | 'poems' = 'all'
): Promise<SearchResponse> {
  if (!query || query.trim().length < 2) {
    return { poets: [], categories: [], poems: [], message: 'Query too short' };
  }

  // Check cache first
  const cacheKey = `${query}-${limit}-${type}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[SearchCache] Hit for "${query}"`);
    return cached.data;
  }

  const params = new URLSearchParams({
    q: query,
    limit: limit.toString(),
    type: type,
  });

  const response = await fetch(`/api/search?${params.toString()}`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch search results');
  }

  const data = await response.json();
  
  // Store in cache
  searchCache.set(cacheKey, { data, timestamp: Date.now() });
  
  // Clean old cache entries (keep last 50)
  if (searchCache.size > 50) {
    const entries = Array.from(searchCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    for (let i = 0; i < 10; i++) {
      searchCache.delete(entries[i][0]);
    }
  }

  return data;
}
