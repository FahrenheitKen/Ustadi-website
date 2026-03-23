'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { Film, SignedUrlResponse } from '@/types';

type PageState = 'loading' | 'unauthorized' | 'no_access' | 'expired' | 'ready' | 'error';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function WatchPage({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [state, setState] = useState<PageState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [film, setFilm] = useState<Film | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [rental, setRental] = useState<SignedUrlResponse['rental'] | null>(null);

  // Check auth and load video
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setState('unauthorized');
      return;
    }

    const loadVideo = async () => {
      try {
        // First get film details
        const filmResponse = await api.getFilm(slug);
        if (!filmResponse.success || !filmResponse.film) {
          setError('Film not found');
          setState('error');
          return;
        }
        setFilm(filmResponse.film);

        // Then get signed URL (this also checks access)
        const signedResponse = await api.getSignedVideoUrl(filmResponse.film.id);
        if (signedResponse.success && signedResponse.signed_url) {
          setSignedUrl(signedResponse.signed_url);
          setRental(signedResponse.rental);
          setState('ready');
        } else {
          setState('no_access');
        }
      } catch (err: any) {
        if (err.response?.status === 401) {
          setState('unauthorized');
        } else if (err.response?.status === 403) {
          // Check if rental expired or no rental
          const message = err.response?.data?.message || '';
          if (message.toLowerCase().includes('expired')) {
            setState('expired');
          } else {
            setState('no_access');
          }
          // Try to get film details for the error screens
          try {
            const filmResponse = await api.getFilm(slug);
            if (filmResponse.success) {
              setFilm(filmResponse.film);
            }
          } catch {}
        } else {
          setError(err.response?.data?.message || 'Failed to load video');
          setState('error');
        }
      }
    };

    loadVideo();
  }, [slug, user, authLoading]);

  // Handle first play - mark rental as started
  const handleFirstPlay = async () => {
    if (!rental?.id || rental.first_played) return;

    try {
      await api.markRentalStarted(rental.id);
      // Refresh rental info
      if (film) {
        const signedResponse = await api.getSignedVideoUrl(film.id);
        if (signedResponse.success) {
          setRental(signedResponse.rental);
        }
      }
    } catch (err) {
      console.error('Failed to mark rental as started', err);
    }
  };

  // Format remaining time
  const formatRemainingTime = () => {
    if (!rental) return '';
    if (!rental.first_played) return '48 hours from first play';
    if (rental.remaining_hours === null) return '';

    const hours = rental.remaining_hours;
    if (hours > 24) {
      return `${Math.floor(hours / 24)} days ${Math.floor(hours % 24)} hours remaining`;
    }
    if (hours > 1) {
      return `${Math.floor(hours)} hours remaining`;
    }
    return `${Math.floor(hours * 60)} minutes remaining`;
  };

  // Loading state
  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Spinner size="lg" />
      </div>
    );
  }

  // Unauthorized - redirect to login
  if (state === 'unauthorized') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black px-4">
        <Lock className="w-16 h-16 text-gray-600 mb-6" />
        <h1 className="text-2xl font-bold text-white mb-2">Sign in required</h1>
        <p className="text-gray-400 mb-6 text-center max-w-md">
          You need to sign in to watch this film.
        </p>
        <Button
          onClick={() => router.push(`/login?redirect=/watch/${slug}`)}
          className="bg-red-600 hover:bg-red-700"
        >
          Sign In
        </Button>
      </div>
    );
  }

  // No access - needs to rent
  if (state === 'no_access') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black px-4">
        <Lock className="w-16 h-16 text-gray-600 mb-6" />
        <h1 className="text-2xl font-bold text-white mb-2">Rental Required</h1>
        <p className="text-gray-400 mb-6 text-center max-w-md">
          You need to rent this film to watch it.
        </p>
        {film && (
          <Link href={`/films/${film.slug}`}>
            <Button className="bg-red-600 hover:bg-red-700">
              Rent Now
            </Button>
          </Link>
        )}
      </div>
    );
  }

  // Expired rental
  if (state === 'expired') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black px-4">
        <Clock className="w-16 h-16 text-gray-600 mb-6" />
        <h1 className="text-2xl font-bold text-white mb-2">Rental Expired</h1>
        <p className="text-gray-400 mb-6 text-center max-w-md">
          Your 48-hour rental period has ended. Rent again to continue watching.
        </p>
        {film && (
          <Link href={`/films/${film.slug}`}>
            <Button className="bg-red-600 hover:bg-red-700">
              Rent Again
            </Button>
          </Link>
        )}
      </div>
    );
  }

  // Error state
  if (state === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black px-4">
        <AlertCircle className="w-16 h-16 text-red-500 mb-6" />
        <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
        <p className="text-gray-400 mb-6 text-center max-w-md">
          {error || 'An error occurred while loading the video.'}
        </p>
        <div className="flex gap-4">
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
          <Link href="/">
            <Button className="bg-red-600 hover:bg-red-700">
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Ready to play
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href={film ? `/films/${film.slug}` : '/library'}
            className="flex items-center gap-2 text-white hover:text-red-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back to details</span>
          </Link>

          <div className="text-center flex-1 px-4">
            <h1 className="text-white font-semibold truncate">
              {film?.title}
            </h1>
            {rental && (
              <p className="text-gray-400 text-sm flex items-center justify-center gap-1">
                <Clock className="w-4 h-4" />
                {formatRemainingTime()}
              </p>
            )}
          </div>

          <div className="hidden sm:block w-24" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Video Player */}
      <div className="h-screen flex items-center justify-center">
        {signedUrl && film && (
          <VideoPlayer
            signedUrl={signedUrl}
            posterUrl={film.poster_url || undefined}
            title={film.title}
            onFirstPlay={handleFirstPlay}
            onError={(err) => {
              console.error('Video playback error:', err);
            }}
          />
        )}
      </div>
    </div>
  );
}
