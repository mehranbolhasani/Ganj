/**
 * Supabase Search Client
 * Client-side wrapper for the search API
 */

import { Poet, Category, Poem } from './types';

interface SearchResults {
  poets: Poet[];
  categories: Category[];
  poems: Poem[];
}

/**
 * Search across poets, categories, and poems using Supabase
 */
export async function searchAll(query: string, limit: number = 20): Promise<SearchResults> {
  if (!query || query.trim().length < 2) {
    return { poets: [], categories: [], poems: [] };
  }
  
  try {
    const response = await fetch(
      `/api/search?q=${encodeURIComponent(query)}&type=all&limit=${limit}`
    );
    
    if (!response.ok) {
      console.error('Search API error:', response.status, response.statusText);
      return { poets: [], categories: [], poems: [] };
    }
    
    const data = await response.json();
    return {
      poets: data.poets || [],
      categories: data.categories || [],
      poems: data.poems || [],
    };
  } catch (error) {
    console.error('Search error:', error);
    return { poets: [], categories: [], poems: [] };
  }
}

/**
 * Search only poets
 */
export async function searchPoets(query: string, limit: number = 10): Promise<Poet[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }
  
  try {
    const response = await fetch(
      `/api/search?q=${encodeURIComponent(query)}&type=poets&limit=${limit}`
    );
    
    if (!response.ok) {
      console.error('Search poets API error:', response.status);
      return [];
    }
    
    const data = await response.json();
    return data.poets || [];
  } catch (error) {
    console.error('Search poets error:', error);
    return [];
  }
}

/**
 * Search only categories
 */
export async function searchCategories(query: string, limit: number = 10): Promise<Category[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }
  
  try {
    const response = await fetch(
      `/api/search?q=${encodeURIComponent(query)}&type=categories&limit=${limit}`
    );
    
    if (!response.ok) {
      console.error('Search categories API error:', response.status);
      return [];
    }
    
    const data = await response.json();
    return data.categories || [];
  } catch (error) {
    console.error('Search categories error:', error);
    return [];
  }
}

/**
 * Search only poems
 */
export async function searchPoems(query: string, limit: number = 50): Promise<Poem[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }
  
  try {
    const response = await fetch(
      `/api/search?q=${encodeURIComponent(query)}&type=poems&limit=${limit}`
    );
    
    if (!response.ok) {
      console.error('Search poems API error:', response.status);
      return [];
    }
    
    const data = await response.json();
    return data.poems || [];
  } catch (error) {
    console.error('Search poems error:', error);
    return [];
  }
}

