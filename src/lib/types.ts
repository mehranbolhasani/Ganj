export interface Poet {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  birthYear?: number;
  deathYear?: number;
}

export interface Category {
  id: number;
  title: string;
  description?: string;
  poetId: number;
  poemCount?: number;
}

export interface Poem {
  id: number;
  title: string;
  verses: string[];
  poetId: number;
  poetName: string;
  categoryId?: number;
  categoryTitle?: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}
