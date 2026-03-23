'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Film, Play, Clock, RefreshCw, Library as LibraryIcon } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn, formatPrice } from '@/lib/utils';
import type { Rental } from '@/types';

function getRentalStatusInfo(rental: Rental) {
  if (rental.status === 'EXPIRED') {
    return {
      label: 'Expired',
      color: 'bg-gray-600',
      action: 'Rent Again',
      icon: RefreshCw,
    };
  }

  if (rental.status === 'NOT_STARTED') {
    return {
      label: '48 hours from first play',
      color: 'bg-blue-600',
      action: 'Play',
      icon: Play,
    };
  }

  // ACTIVE
  const hoursLeft = rental.remaining_hours ?? 0;
  const label = hoursLeft > 1
    ? `Expires in ${Math.floor(hoursLeft)} hours`
    : hoursLeft > 0
      ? `Expires in ${Math.floor(hoursLeft * 60)} minutes`
      : 'Expiring soon';

  return {
    label,
    color: 'bg-green-600',
    action: 'Play',
    icon: Play,
  };
}

function RentalCard({ rental }: { rental: Rental }) {
  const film = rental.film;
  const statusInfo = getRentalStatusInfo(rental);
  const StatusIcon = statusInfo.icon;
  const isExpired = rental.status === 'EXPIRED';

  const href = isExpired ? `/films/${film.slug}` : `/watch/${film.slug}`;

  return (
    <div className="group relative bg-gray-900/50 rounded-lg overflow-hidden border border-white/10 hover:border-white/20 transition-colors">
      {/* Poster */}
      <Link href={href}>
        <div className="relative aspect-[2/3] overflow-hidden">
          {film.poster_url ? (
            <Image
              src={film.poster_url}
              alt={film.title}
              fill
              className={cn(
                'object-cover transition-transform duration-300 group-hover:scale-105',
                isExpired && 'grayscale'
              )}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <Film className="w-12 h-12 text-gray-600" />
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

          {/* Status badge */}
          <div className={cn(
            'absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium text-white flex items-center gap-1',
            statusInfo.color
          )}>
            <Clock className="w-3 h-3" />
            {statusInfo.label}
          </div>

          {/* Play overlay */}
          {!isExpired && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-16 h-16 rounded-full bg-red-600/90 flex items-center justify-center">
                <Play className="w-8 h-8 text-white ml-1" fill="white" />
              </div>
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="p-4">
        <Link href={href}>
          <h3 className="text-white font-medium line-clamp-1 group-hover:text-red-500 transition-colors">
            {film.title}
          </h3>
        </Link>
        <p className="text-gray-500 text-sm mt-1">
          Rented {new Date(rental.created_at).toLocaleDateString()}
        </p>

        {/* Action button */}
        <Link href={href}>
          <Button
            size="sm"
            className={cn(
              'w-full mt-3',
              isExpired
                ? 'bg-gray-700 hover:bg-gray-600'
                : 'bg-red-600 hover:bg-red-700'
            )}
          >
            <StatusIcon className="w-4 h-4 mr-2" />
            {statusInfo.action}
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function LibraryPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/library');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    const fetchRentals = async () => {
      try {
        const response = await api.getRentals();
        if (response.success) {
          setRentals(response.rentals);
        }
      } catch (err: any) {
        setError('Failed to load your library');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRentals();
  }, [user]);

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Separate active and expired rentals
  const activeRentals = rentals.filter(r => r.status !== 'EXPIRED');
  const expiredRentals = rentals.filter(r => r.status === 'EXPIRED');

  return (
    <div className="min-h-screen py-24 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <LibraryIcon className="w-8 h-8 text-red-500" />
          <h1 className="text-3xl font-bold text-white">My Library</h1>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </div>
        ) : rentals.length === 0 ? (
          // Empty state
          <div className="text-center py-20">
            <Film className="w-20 h-20 text-gray-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Your library is empty
            </h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              You haven&apos;t rented any films yet. Browse our collection and start watching today!
            </p>
            <Link href="/">
              <Button className="bg-red-600 hover:bg-red-700">
                Browse Films
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Active rentals */}
            {activeRentals.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <Play className="w-5 h-5 text-green-500" />
                  Available to Watch ({activeRentals.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
                  {activeRentals.map((rental) => (
                    <RentalCard key={rental.id} rental={rental} />
                  ))}
                </div>
              </section>
            )}

            {/* Expired rentals */}
            {expiredRentals.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-500" />
                  Previously Rented ({expiredRentals.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
                  {expiredRentals.map((rental) => (
                    <RentalCard key={rental.id} rental={rental} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
