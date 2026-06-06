/**
 * Structured Data (JSON-LD) Component
 * Adds structured data for better SEO and rich search results
 */

interface OrganizationSchema {
  name: string;
  url: string;
  logo?: string;
  description?: string;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface ArticleSchema {
  headline: string;
  description: string;
  author: {
    name: string;
  };
  datePublished?: string;
  dateModified?: string;
  image?: string;
  url: string;
}

export function OrganizationStructuredData({ name, url, logo, description }: OrganizationSchema) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    ...(logo && { logo }),
    ...(description && { description }),
  };

  return (
    <script
      id="organization-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function WebsiteStructuredData({ url }: { url: string }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'دفتر گنج',
    url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      id="website-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function BreadcrumbStructuredData({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      id="breadcrumb-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function ArticleStructuredData({
  headline,
  description,
  author,
  datePublished,
  dateModified,
  image,
  url,
}: ArticleSchema) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    author: {
      '@type': 'Person',
      name: author.name,
    },
    ...(datePublished && { datePublished }),
    ...(dateModified && { dateModified }),
    ...(image && {
      image: {
        '@type': 'ImageObject',
        url: image,
      },
    }),
    url,
  };

  return (
    <script
      id="article-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface PersonSchema {
  name: string;
  description?: string;
  birthDate?: string;
  deathDate?: string;
  url: string;
  image?: string;
}

export function PersonStructuredData({
  name,
  description,
  birthDate,
  deathDate,
  url,
  image,
}: PersonSchema) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    url,
    ...(description && { description }),
    ...(birthDate && { birthDate }),
    ...(deathDate && { deathDate }),
    ...(image && { image }),
    jobTitle: 'شاعر',
    nationality: {
      '@type': 'Country',
      name: 'Iran',
    },
  };

  return (
    <script
      id="person-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface CreativeWorkSchema {
  name: string;
  text: string;
  author: {
    name: string;
    url: string;
  };
  url: string;
  inLanguage?: string;
}

export function CreativeWorkStructuredData({
  name,
  text,
  author,
  url,
  inLanguage = 'fa',
}: CreativeWorkSchema) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name,
    text,
    url,
    inLanguage,
    author: {
      '@type': 'Person',
      name: author.name,
      url: author.url,
    },
  };

  return (
    <script
      id="creative-work-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

