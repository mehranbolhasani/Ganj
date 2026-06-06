import { MetadataRoute } from 'next';
import { hybridApi } from '@/lib/hybrid-api';

const BASE_URL = 'https://www.ganj.directory';
const CONCURRENCY = 5; // max parallel requests to Ganjoor API

/** Run an array of async tasks with a max concurrency limit */
async function batchedAsync<T>(
  items: T[],
  fn: (item: T) => Promise<MetadataRoute.Sitemap>,
  concurrency: number
): Promise<MetadataRoute.Sitemap> {
  const results: MetadataRoute.Sitemap = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    const settled = await Promise.allSettled(chunk.map(fn));
    for (const result of settled) {
      if (result.status === 'fulfilled') {
        results.push(...result.value);
      }
      // silently skip failed poets — their pages just won't appear in sitemap
    }
  }
  return results;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/faal`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  try {
    const poets = await hybridApi.getPoets();

    const poetPages: MetadataRoute.Sitemap = poets.map((poet) => ({
      url: `${BASE_URL}/poet/${poet.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    const categoryPages = await batchedAsync(
      poets,
      async (poet) => {
        const { categories } = await hybridApi.getPoet(poet.id);
        return categories.map((category) => ({
          url: `${BASE_URL}/poet/${poet.id}/category/${category.id}`,
          lastModified: new Date(),
          changeFrequency: 'monthly' as const,
          priority: 0.6,
        }));
      },
      CONCURRENCY
    );

    return [...staticPages, ...poetPages, ...categoryPages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return staticPages;
  }
}
