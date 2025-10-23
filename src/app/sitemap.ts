import { MetadataRoute } from 'next';
import { ganjoorApi } from '@/lib/ganjoor-api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://ganjoor-modern.vercel.app';
  
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ];

  try {
    // Get all poets for dynamic routes
    const poets = await ganjoorApi.getPoets();
    
    // Add poet pages
    const poetPages: MetadataRoute.Sitemap = poets.map((poet) => ({
      url: `${baseUrl}/poet/${poet.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    // Get categories for each poet (limited to avoid too many requests)
    const categoryPages: MetadataRoute.Sitemap = [];
    
    for (const poet of poets.slice(0, 10)) { // Limit to first 10 poets
      try {
        const { categories } = await ganjoorApi.getPoet(poet.id);
        
        // Add category pages
        categories.forEach((category) => {
          categoryPages.push({
            url: `${baseUrl}/poet/${poet.id}/category/${category.id}`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.6,
          });
        });
      } catch (error) {
        console.error(`Error fetching categories for poet ${poet.id}:`, error);
      }
    }

    return [...staticPages, ...poetPages, ...categoryPages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return staticPages;
  }
}
