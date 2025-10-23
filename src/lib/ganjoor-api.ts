import { Poet, Category, Poem, ApiResponse } from './types';
import { withCache } from './api-cache';
import { withRetry, withNetworkRetry } from './retry-utils';

const API_BASE_URL = 'https://api.ganjoor.net/api/ganjoor';

class GanjoorApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'GanjoorApiError';
  }
}

async function fetchApi<T>(endpoint: string): Promise<T> {
  const fetchWithRetry = () => withNetworkRetry(async () => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new GanjoorApiError(
        `API request failed: ${response.statusText}`,
        response.status
      );
    }

    const data = await response.json();
    return data;
  });

  try {
    return await fetchWithRetry();
  } catch (error) {
    if (error instanceof GanjoorApiError) {
      throw error;
    }
    throw new GanjoorApiError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export const ganjoorApi = {
  // Get all poets
  async getPoets(): Promise<Poet[]> {
    return withCache('/poets', async () => {
      const data = await fetchApi<any[]>(`/poets`);
      return data.map(poet => ({
        id: poet.id,
        name: poet.name,
        slug: poet.fullUrl?.replace('/', '') || '',
        description: poet.description,
        birthYear: poet.birthYearInLHijri,
        deathYear: poet.deathYearInLHijri,
      }));
    });
  },

  // Get poet details and categories
  async getPoet(id: number): Promise<{ poet: Poet; categories: Category[] }> {
    return withCache(`/poet/${id}`, async () => {
      const poetResponse = await fetchApi<any>(`/poet/${id}`);
      
      // The API returns {poet: {...}, cat: {...}} structure
      const poetData = poetResponse.poet;
      const catData = poetResponse.cat;

      const poet: Poet = {
        id: poetData.id,
        name: poetData.name,
        slug: poetData.fullUrl?.replace('/', '') || '',
        description: poetData.description,
        birthYear: poetData.birthYearInLHijri,
        deathYear: poetData.deathYearInLHijri,
      };

      // Get categories from the cat.children array
      const categories: Category[] = catData.children?.map((category: any) => ({
        id: category.id,
        title: category.title,
        description: category.description,
        poetId: id,
        poemCount: category.poemCount,
      })) || [];

      return { poet, categories };
    });
  },

  // Get poems from a category
  async getCategoryPoems(poetId: number, categoryId: number): Promise<Poem[]> {
    return withCache(`/cat/${categoryId}`, async () => {
      const data = await fetchApi<any>(`/cat/${categoryId}`);
      
      // The API returns {poet: {...}, cat: {...}} structure
      const catData = data.cat;
      
      return catData.poems?.map((poem: any) => ({
        id: poem.id,
        title: poem.title,
        verses: poem.verses || [],
        poetId: poetId,
        poetName: data.poet.name || '',
        categoryId: categoryId,
        categoryTitle: catData.title,
      })) || [];
    });
  },

  // Get individual poem
  async getPoem(id: number): Promise<Poem> {
    return withCache(`/poem/${id}`, async () => {
      const data = await fetchApi<any>(`/poem/${id}`);
      
      // Extract verses text from the complex structure
      const verses = data.verses?.map((verse: any) => verse.text).filter((text: string) => text) || [];
      
      return {
        id: data.id,
        title: data.title,
        verses: verses,
        poetId: data.poetId,
        poetName: data.poetName || '',
        categoryId: data.categoryId,
        categoryTitle: data.categoryTitle,
      };
    });
  },
};
