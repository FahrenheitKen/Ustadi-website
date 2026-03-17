'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, X } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { TrailerPlayer } from '@/components/player/TrailerPlayer';
import type { FilmCard as FilmCardType } from '@/types';

interface FilmCardProps {
  film: FilmCardType;
  className?: string;
}

export function FilmCard({ film, className }: FilmCardProps) {
  const [showTrailer, setShowTrailer] = useState(false);

  return (
    <>
      <div className={cn('group block', className)}>
        <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-gray-900">
          <Link href={`/films/${film.slug}`}>
            {film.poster_url ? (
              <Image
                src={film.poster_url}
                alt={film.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <span className="text-gray-500 text-sm">No image</span>
              </div>
            )}
          </Link>

          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

          {/* Price badge */}
          <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
            {formatPrice(film.price)}
          </div>

          {/* Play trailer button on hover */}
          {film.trailer_url && (
            <button
              onClick={(e) => {
                e.preventDefault();
                setShowTrailer(true);
              }}
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <div className="w-14 h-14 rounded-full bg-red-600/90 flex items-center justify-center hover:bg-red-600 hover:scale-110 transition-all shadow-lg">
                <Play className="w-7 h-7 text-white ml-1" fill="white" />
              </div>
            </button>
          )}

          {/* Info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform pointer-events-none">
            <h3 className="text-white font-semibold text-sm line-clamp-2">
              {film.title}
            </h3>
            {film.release_year && (
              <p className="text-gray-300 text-xs mt-1">{film.release_year}</p>
            )}
          </div>
        </div>

        {/* Title below card (always visible) */}
        <Link href={`/films/${film.slug}`}>
          <h3 className="mt-2 text-white font-medium text-sm line-clamp-1 group-hover:text-red-500 transition-colors">
            {film.title}
          </h3>
        </Link>
      </div>

      {/* Trailer Modal */}
      {showTrailer && film.trailer_url && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowTrailer(false)}
          />
          <div className="relative w-full max-w-4xl mx-4">
            <button
              onClick={() => setShowTrailer(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
            <TrailerPlayer
              trailerUrl={film.trailer_url}
              posterUrl={film.poster_url || undefined}
              title={film.title}
            />
          </div>
        </div>
      )}
    </>
  );
}
