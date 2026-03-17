'use client';

import { FilmCard } from './FilmCard';
import type { FilmCard as FilmCardType } from '@/types';

interface FilmGridProps {
  films: FilmCardType[];
  title?: string;
  viewAllHref?: string;
}

export function FilmGrid({ films, title, viewAllHref }: FilmGridProps) {
  if (films.length === 0) {
    return null;
  }

  return (
    <section className="py-8">
      {title && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          {viewAllHref && (
            <a
              href={viewAllHref}
              className="text-sm text-red-500 hover:text-red-400 font-medium"
            >
              View All
            </a>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {films.map((film) => (
          <FilmCard key={film.id} film={film} />
        ))}
      </div>
    </section>
  );
}
