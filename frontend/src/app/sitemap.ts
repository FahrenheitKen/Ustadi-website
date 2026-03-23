import type { MetadataRoute } from 'next';

const BASE_URL = 'https://ustadifilms.ke';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.ustadifilms.ke/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/register`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/library`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  // Dynamic film pages
  let filmPages: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/films?per_page=100`, { next: { revalidate: 3600 } });
    const data = await res.json();
    if (data.success && data.films) {
      filmPages = data.films.map((film: { slug: string; updated_at: string }) => ({
        url: `${BASE_URL}/films/${film.slug}`,
        lastModified: new Date(film.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
    }
  } catch {
    // If API is unavailable, return static pages only
  }

  return [...staticPages, ...filmPages];
}
