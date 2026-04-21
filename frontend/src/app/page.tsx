import { FilmHero } from '@/components/films/FilmHero';
import { FilmGrid } from '@/components/films/FilmGrid';
import type { Film, FilmCard } from '@/types';

export const dynamic = 'force-dynamic';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

async function getFeaturedFilm(): Promise<Film | null> {
  try {
    const res = await fetch(`${API_URL}/films/featured`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.film || null;
  } catch {
    return null;
  }
}

async function getNewReleases(): Promise<FilmCard[]> {
  try {
    const res = await fetch(`${API_URL}/films/new-releases?limit=12`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.films || [];
  } catch {
    return [];
  }
}

async function getPopularFilms(): Promise<FilmCard[]> {
  try {
    const res = await fetch(`${API_URL}/films/popular?limit=12`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.films || [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [featuredFilm, newReleases, popularFilms] = await Promise.all([
    getFeaturedFilm(),
    getNewReleases(),
    getPopularFilms(),
  ]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      {featuredFilm && <FilmHero film={featuredFilm} />}

      {/* Film Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* New Releases */}
        {newReleases.length > 0 && (
          <FilmGrid
            films={newReleases}
            title="New Releases"
            viewAllHref="/films?sort=created_at"
          />
        )}

        {/* Popular Films */}
        {popularFilms.length > 0 && (
          <FilmGrid
            films={popularFilms}
            title="Popular Films"
            viewAllHref="/films?sort=popular"
          />
        )}

        {/* Empty state */}
        {newReleases.length === 0 && popularFilms.length === 0 && (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-white mb-4">
              No films available yet
            </h2>
            <p className="text-gray-400">
              Check back soon for new releases!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
