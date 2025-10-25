import { Poet, Category, Poem } from './types';
import { withCache } from './api-cache';
import { withRetry } from './retry-utils';

const API_BASE_URL = 'https://api.ganjoor.net/api/ganjoor';

class GanjoorApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'GanjoorApiError';
  }
}

async function fetchApi<T>(endpoint: string): Promise<T> {
  const fetchWithRetry = () => withRetry(async () => {
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
        slug: poetData.fullUrl?.replace('/', '') || '',
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
            // Use the correct API endpoint structure for getting category poems
            const response = await fetchApi<{cat: {poems: Array<{id: number; title: string}>}}>(`/cat/${category.id}`);
            const poemCount = response.cat?.poems?.length || 0;
            
            return {
              ...category,
              poemCount,
            };
          } catch (error) {
            console.warn(`Failed to get poem count for category ${category.id}:`, error);
            return {
              ...category,
              poemCount: 0,
            };
          }
        })
      );

      return { poet, categories: categoriesWithCounts };
    });
  },

  // Get poems from a category
  async getCategoryPoems(poetId: number, categoryId: number): Promise<Poem[]> {
    return withCache(`/cat/${categoryId}`, async () => {
      const data = await fetchApi<{
        poet: {name: string};
        cat: {
          title: string;
          poems: Array<{
            id: number;
            title: string;
            verses?: Array<{text: string}>;
          }>;
        };
      }>(`/cat/${categoryId}`);
      
      // The API returns {poet: {...}, cat: {...}} structure
      const catData = data.cat;
      
      return catData.poems?.map((poem) => ({
        id: poem.id,
        title: poem.title,
        verses: poem.verses?.map(verse => verse.text) || [],
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
      const data = await fetchApi<{id: number; title: string; verses: {text: string}[]; poetId: number; poetName: string; categoryId: number; categoryTitle: string}>(`/poem/${id}`);
      
      // Extract verses text from the complex structure
      const verses = data.verses?.map((verse: {text: string}) => verse.text).filter((text: string) => text) || [];
      
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

  // Get a random poem from all poets
  async getRandomPoem(): Promise<Poem> {
    return withCache('/random-poem', async () => {
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
    }, 5 * 60 * 1000); // Cache for 5 minutes
  },
};
