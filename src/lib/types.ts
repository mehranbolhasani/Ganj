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
  hasChapters?: boolean;
  chapters?: Chapter[];
}

export interface Chapter {
  id: number;
  title: string;
  description?: string;
  categoryId: number;
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
  chapterId?: number;
  chapterTitle?: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface SearchResponse {
  poets: Poet[];
  categories: Category[];
  poems: Poem[];
  message?: string;
  // Pagination metadata
  totalPoets?: number;
  totalCategories?: number;
  totalPoems?: number;
  hasMore?: boolean;
}
