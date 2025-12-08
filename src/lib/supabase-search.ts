import { SearchResponse } from './types';

// Simple in-memory cache for search results
const searchCache = new Map<string, { data: SearchResponse; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function searchAll(
  query: string,
  limit: number = 20,
  type: 'all' | 'poets' | 'categories' | 'poems' = 'all',
  offset: number = 0,
  getCount: boolean = false,
  poetId?: number
): Promise<SearchResponse> {
  if (!query || query.trim().length < 2) {
    return { poets: [], categories: [], poems: [], message: 'Query too short' };
  }

  // Check cache first (only for first page without offset)
  if (offset === 0) {
    // Include poetId in cache key to prevent cross-poet cache hits
    const cacheKey = `${query}-${limit}-${type}-${getCount}-${poetId !== undefined ? `poet-${poetId}` : 'all-poets'}`;
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }

  const params = new URLSearchParams({
    q: query,
    limit: limit.toString(),
    type: type,
    offset: offset.toString(),
  });
  
  if (getCount) {
    params.set('count', 'true');
  }
  
  if (poetId !== undefined) {
    params.set('poetId', poetId.toString());
  }

  const response = await fetch(`/api/search?${params.toString()}`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch search results');
  }

  const data = await response.json();
  
  // Store in cache (only for first page)
  if (offset === 0) {
    // Include poetId in cache key to prevent cross-poet cache hits
    const cacheKey = `${query}-${limit}-${type}-${getCount}-${poetId !== undefined ? `poet-${poetId}` : 'all-poets'}`;
    searchCache.set(cacheKey, { data, timestamp: Date.now() });
    
    // Clean old cache entries (keep last 50)
    if (searchCache.size > 50) {
      const entries = Array.from(searchCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      for (let i = 0; i < 10; i++) {
        searchCache.delete(entries[i][0]);
      }
    }
  }

  return data;
}
