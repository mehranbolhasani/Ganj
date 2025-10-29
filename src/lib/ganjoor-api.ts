import { Poet, Category, Poem, Chapter } from './types';
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
            
            // If category has chapters (children), count poems from chapters too
            if (response.cat.children && response.cat.children.length > 0) {
              hasChapters = true;
              chapters = response.cat.children.map(chapter => ({
                id: chapter.id,
                title: chapter.title,
                categoryId: category.id,
                poemCount: 0, // Will be calculated separately if needed
              }));
              
              // Calculate total poem count from all chapters
              for (const chapter of response.cat.children) {
                try {
                  const chapterResponse = await fetchApi<{cat: {poems: Array<{id: number; title: string}>}}>(`/cat/${chapter.id}`);
                  const chapterPoemCount = chapterResponse.cat?.poems?.length || 0;
                  poemCount += chapterPoemCount;
                  
                  // Update chapter poem count
                  const chapterIndex = chapters.findIndex(c => c.id === chapter.id);
                  if (chapterIndex !== -1) {
                    chapters[chapterIndex].poemCount = chapterPoemCount;
                  }
                } catch (error) {
                  console.warn(`Failed to get poem count for chapter ${chapter.id}:`, error);
                }
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
    });
  },

  // Get poems from a category (handles both direct poems and chapters)
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
          children?: Array<{
            id: number;
            title: string;
            urlSlug: string;
            description?: string;
          }>;
        };
      }>(`/cat/${categoryId}`);
      
      // The API returns {poet: {...}, cat: {...}} structure
      const catData = data.cat;
      
      const allPoems: Poem[] = [];
      
      // If category has direct poems, add them
      if (catData.poems && catData.poems.length > 0) {
        const directPoems = catData.poems.map((poem) => ({
          id: poem.id,
          title: poem.title,
          verses: poem.verses?.map(verse => verse.text) || [],
          poetId: poetId,
          poetName: data.poet.name || '',
          categoryId: categoryId,
          categoryTitle: catData.title,
        }));
        allPoems.push(...directPoems);
      }
      
      // If category has chapters (children), get poems from all chapters
      if (catData.children && catData.children.length > 0) {
        for (const chapter of catData.children) {
          try {
            const chapterData = await fetchApi<{
              poet: {name: string};
              cat: {
                title: string;
                poems: Array<{
                  id: number;
                  title: string;
                  verses?: Array<{text: string}>;
                }>;
              };
            }>(`/cat/${chapter.id}`);
            
            const chapterPoems = chapterData.cat.poems?.map((poem) => ({
              id: poem.id,
              title: poem.title,
              verses: poem.verses?.map(verse => verse.text) || [],
              poetId: poetId,
              poetName: data.poet.name || '',
              categoryId: categoryId,
              categoryTitle: catData.title,
              chapterId: chapter.id,
              chapterTitle: chapter.title,
            })) || [];
            
            allPoems.push(...chapterPoems);
          } catch (error) {
            console.warn(`Failed to get poems from chapter ${chapter.id}:`, error);
          }
        }
      }
      
      return allPoems;
    });
  },

  // Get chapter details
  async getChapter(poetId: number, categoryId: number, chapterId: number): Promise<{ chapter: Chapter; poems: Poem[] }> {
    return withCache(`/chapter/${chapterId}`, async () => {
      // Get the chapter data
      const chapterData = await fetchApi<{
        poet: {name: string};
        cat: {
          title: string;
          poems: Array<{
            id: number;
            title: string;
            verses?: Array<{text: string}>;
          }>;
        };
      }>(`/cat/${chapterId}`);
      
      const chapter: Chapter = {
        id: chapterId,
        title: chapterData.cat.title,
        categoryId: categoryId,
        poemCount: chapterData.cat.poems?.length || 0,
      };
      
      const poems: Poem[] = chapterData.cat.poems?.map((poem) => ({
        id: poem.id,
        title: poem.title,
        verses: poem.verses?.map(verse => verse.text) || [],
        poetId: poetId,
        poetName: chapterData.poet.name || '',
        categoryId: categoryId,
        categoryTitle: '', // Will be filled by the calling code
        chapterId: chapterId,
        chapterTitle: chapter.title,
      })) || [];
      
      return { chapter, poems };
    });
  },

  // Get individual poem
  async getPoem(id: number): Promise<Poem> {
    return withCache(`/poem/${id}`, async () => {
      const data = await fetchApi<{
        id: number;
        title: string;
        verses: {text: string}[];
        category: {
          poet: {
            id: number;
            name: string;
          };
          cat: {
            id: number;
            title: string;
          };
        };
      }>(`/poem/${id}`);
      
      // Extract verses text from the complex structure
      const verses = data.verses?.map((verse: {text: string}) => verse.text).filter((text: string) => text) || [];
      
      return {
        id: data.id,
        title: data.title,
        verses: verses,
        poetId: data.category.poet.id,
        poetName: data.category.poet.name,
        categoryId: data.category.cat.id,
        categoryTitle: data.category.cat.title,
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

  // Search poems by title or content (client-side search)
  async searchPoems(query: string, limit: number = 20): Promise<Poem[]> {
    return withCache(`/search/poems/${encodeURIComponent(query)}/${limit}`, async () => {
      const poets = await this.getPoets();
      const allPoems: Poem[] = [];
      const lowercaseQuery = query.toLowerCase();
      
      // Priority poets (famous poets more likely to have poems about common themes)
      const priorityPoetIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // First 10 poets are usually the most famous
      
      // First search through priority poets
      for (const poetId of priorityPoetIds) {
        const poet = poets.find(p => p.id === poetId);
        if (!poet) continue;
        
        try {
          const { categories } = await this.getPoet(poet.id);
          
          // Search through all categories for priority poets
          for (const category of categories) {
            const poems = await this.getCategoryPoems(poet.id, category.id);
            
            const matchingPoems = poems.filter(poem => 
              poem.title.toLowerCase().includes(lowercaseQuery) ||
              poem.verses.some(verse => verse.toLowerCase().includes(lowercaseQuery))
            );
            
            allPoems.push(...matchingPoems);
          }
        } catch (err) {
          console.warn(`Failed to get poems for priority poet ${poet.id}:`, err);
        }
      }
      
      // If we don't have enough results, search through more poets
      if (allPoems.length < limit) {
        for (const poet of poets.slice(10, 30)) { // Next 20 poets
          try {
            const { categories } = await this.getPoet(poet.id);
            
            for (const category of categories.slice(0, 5)) { // First 5 categories per poet
              const poems = await this.getCategoryPoems(poet.id, category.id);
              
              const matchingPoems = poems.filter(poem => 
                poem.title.toLowerCase().includes(lowercaseQuery) ||
                poem.verses.some(verse => verse.toLowerCase().includes(lowercaseQuery))
              );
              
              allPoems.push(...matchingPoems);
              
              if (allPoems.length >= limit * 2) break;
            }
            if (allPoems.length >= limit * 2) break;
          } catch (err) {
            console.warn(`Failed to get poems for poet ${poet.id}:`, err);
          }
        }
      }
      
      // Sort by relevance (title matches first, then content matches)
      return allPoems
        .sort((a, b) => {
          const aTitleMatch = a.title.toLowerCase().includes(lowercaseQuery);
          const bTitleMatch = b.title.toLowerCase().includes(lowercaseQuery);
          
          if (aTitleMatch && !bTitleMatch) return -1;
          if (!aTitleMatch && bTitleMatch) return 1;
          return 0;
        })
        .slice(0, limit);
    }, 10 * 60 * 1000); // Cache for 10 minutes
  },

  // Search categories by title (client-side search)
  async searchCategories(query: string, limit: number = 20): Promise<Category[]> {
    return withCache(`/search/categories/${encodeURIComponent(query)}/${limit}`, async () => {
      const poets = await this.getPoets();
      const allCategories: Category[] = [];
      
      for (const poet of poets.slice(0, 20)) { // Limit to first 20 poets
        try {
          const { categories } = await this.getPoet(poet.id);
          allCategories.push(...categories);
        } catch (err) {
          console.warn(`Failed to get categories for poet ${poet.id}:`, err);
        }
      }
      
      const lowercaseQuery = query.toLowerCase();
      return allCategories
        .filter(category => 
          category.title.toLowerCase().includes(lowercaseQuery) ||
          category.description?.toLowerCase().includes(lowercaseQuery)
        )
        .slice(0, limit);
    }, 10 * 60 * 1000); // Cache for 10 minutes
  },

  // Search poets by name (client-side only)
  async searchPoets(query: string, limit: number = 20): Promise<Poet[]> {
    return withCache(`/search/poets/${encodeURIComponent(query)}/${limit}`, async () => {
      const poets = await this.getPoets();
      const lowercaseQuery = query.toLowerCase();
      
      return poets
        .filter(poet => 
          poet.name.toLowerCase().includes(lowercaseQuery) ||
          poet.description?.toLowerCase().includes(lowercaseQuery)
        )
        .slice(0, limit);
    }, 30 * 60 * 1000); // Cache for 30 minutes
  },
};
