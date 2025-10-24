import { Poet } from './types';

const API_BASE_URL = 'https://api.ganjoor.net/api/ganjoor';

class SimpleApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'SimpleApiError';
  }
}

async function fetchApi<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new SimpleApiError(
      `API request failed: ${response.statusText}`,
      response.status
    );
  }

  return response.json();
}

export const simpleApi = {
  // Get all poets - simplified without caching
  async getPoets(): Promise<Poet[]> {
    try {
      const data = await fetchApi<any[]>(`/poets`);
      return data.map(poet => ({
        id: poet.id,
        name: poet.name,
        slug: poet.fullUrl?.replace('/', '') || '',
        description: poet.description,
        birthYear: poet.birthYearInLHijri,
        deathYear: poet.deathYearInLHijri,
      }));
    } catch (error) {
      console.error('Error fetching poets:', error);
      throw error;
    }
  },
};
