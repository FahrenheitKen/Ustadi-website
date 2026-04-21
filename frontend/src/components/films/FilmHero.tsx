import Image from 'next/image';
import Link from 'next/link';
import { Play, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice, truncate } from '@/lib/utils';
import type { Film } from '@/types';

interface FilmHeroProps {
  film: Film;
}

export function FilmHero({ film }: FilmHeroProps) {
  return (
    <section className="relative h-[60vh] sm:h-[70vh] min-h-[400px] sm:min-h-[500px] max-h-[800px]">
      {/* Background Image */}
      <div className="absolute inset-0">
        {film.poster_url ? (
          <Image
            src={film.poster_url}
            alt={film.title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gray-900" />
        )}
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />
      </div>

      {/* Content */}
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
        <div className="max-w-2xl">
          {/* Genres */}
          {film.genres && film.genres.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {film.genres.slice(0, 3).map((genre) => (
                <span
                  key={genre.id}
                  className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium text-white"
                >
                  {genre.name}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
            {film.title}
          </h1>

          {/* Meta info */}
          <div className="flex items-center gap-4 text-gray-300 text-sm mb-4">
            {film.release_year && <span>{film.release_year}</span>}
            {film.duration_mins && (
              <span>
                {Math.floor(film.duration_mins / 60)}h {film.duration_mins % 60}m
              </span>
            )}
            {film.rating && (
              <span className="px-2 py-0.5 border border-gray-500 rounded text-xs">
                {film.rating}
              </span>
            )}
          </div>

          {/* Synopsis */}
          <p className="text-gray-300 text-lg mb-6 line-clamp-3">
            {truncate(film.synopsis, 200)}
          </p>

          {/* Price & CTA */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <Link href={`/films/${film.slug}`}>
              <Button size="lg" className="w-full sm:w-auto bg-red-600 hover:bg-red-700">
                <Play className="w-5 h-5 mr-2" />
                Watch Now - {formatPrice(film.price)}
              </Button>
            </Link>
            <Link href={`/films/${film.slug}`}>
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10">
                <Info className="w-5 h-5 mr-2" />
                More Info
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
