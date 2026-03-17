'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { FilmHero } from '@/components/films/FilmHero';
import { FilmGrid } from '@/components/films/FilmGrid';
import { Spinner } from '@/components/ui/spinner';
import type { Film, FilmCard } from '@/types';

export default function HomePage() {
  const [featuredFilm, setFeaturedFilm] = useState<Film | null>(null);
  const [newReleases, setNewReleases] = useState<FilmCard[]>([]);
  const [popularFilms, setPopularFilms] = useState<FilmCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);

        const [featuredRes, newReleasesRes, popularRes] = await Promise.all([
          api.getFeaturedFilm().catch(() => null),
          api.getNewReleases(12),
          api.getPopularFilms(12),
        ]);

        if (featuredRes?.film) {
          setFeaturedFilm(featuredRes.film);
        }

        if (newReleasesRes?.films) {
          setNewReleases(newReleasesRes.films);
        }

        if (popularRes?.films) {
          setPopularFilms(popularRes.films);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load films');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-white underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

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
