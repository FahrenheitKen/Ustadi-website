'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Clock, Calendar, Star, User, X, Film as FilmIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useRentalAccess } from '@/hooks/useRental';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { PaymentModal } from '@/components/payment/PaymentModal';
import { TrailerPlayer } from '@/components/player/TrailerPlayer';
import { formatPrice, formatDuration, getRatingColor } from '@/lib/utils';
import type { Film, Review } from '@/types';

export default function FilmDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { isAuthenticated, user } = useAuth();

  const [film, setFilm] = useState<Film | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTrailerModal, setShowTrailerModal] = useState(false);

  // Review state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  const { hasAccess, rental, refetch: refetchAccess } = useRentalAccess(film?.id);

  useEffect(() => {
    async function loadFilm() {
      try {
        setIsLoading(true);
        const response = await api.getFilm(slug);
        setFilm(response.film);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Film not found');
      } finally {
        setIsLoading(false);
      }
    }

    if (slug) {
      loadFilm();
    }
  }, [slug]);

  // Load reviews when film is loaded
  useEffect(() => {
    if (!film) return;

    async function loadReviews() {
      try {
        const res = await api.getReviews(film!.id);
        setReviews(res.reviews);
        setAverageRating(res.average_rating);
      } catch {}
    }

    async function loadMyReview() {
      if (!isAuthenticated) return;
      try {
        const res = await api.getMyReview(film!.id);
        if (res.review) {
          setMyReview(res.review);
          setReviewRating(res.review.rating);
          setReviewTitle(res.review.title || '');
          setReviewContent(res.review.content || '');
        }
      } catch {}
    }

    loadReviews();
    loadMyReview();
  }, [film, isAuthenticated]);

  const handleSubmitReview = async () => {
    if (!film || reviewRating === 0) return;

    setIsSubmittingReview(true);
    setReviewError(null);
    setReviewSuccess(null);

    try {
      const res = await api.createReview(
        film.id,
        reviewRating,
        reviewTitle || undefined,
        reviewContent || undefined
      );
      setMyReview(res.review);
      setReviewSuccess('Review submitted successfully!');
      // Reload reviews
      const updated = await api.getReviews(film.id);
      setReviews(updated.reviews);
      setAverageRating(updated.average_rating);
    } catch (err: any) {
      setReviewError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleWatchClick = () => {
    if (!isAuthenticated) {
      window.location.href = `/login?redirect=/films/${slug}`;
      return;
    }

    if (hasAccess) {
      window.location.href = `/watch/${slug}`;
      return;
    }

    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    refetchAccess();
    // Optionally redirect to watch page
    window.location.href = `/watch/${slug}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !film) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Film Not Found</h1>
          <p className="text-gray-400 mb-6">{error || 'The film you are looking for does not exist.'}</p>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative">
        {/* Background */}
        <div className="absolute inset-0 h-[50vh] min-h-[300px] sm:min-h-[400px]">
          {film.poster_url && (
            <Image
              src={film.poster_url}
              alt={film.title}
              fill
              className="object-cover opacity-30"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/70 to-black" />
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Poster */}
            <div className="flex-shrink-0">
              <div className="relative w-full max-w-[280px] sm:max-w-[340px] md:w-[340px] lg:w-[410px] aspect-[2/3] rounded-lg overflow-hidden shadow-2xl mx-auto md:mx-0">
                {film.poster_url ? (
                  <Image
                    src={film.poster_url}
                    alt={film.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <span className="text-gray-500">No image</span>
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 md:pt-12 lg:pt-24">
              {/* Genres */}
              {film.genres && film.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {film.genres.map((genre) => (
                    <Link
                      key={genre.id}
                      href={`/genres/${genre.slug}`}
                      className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-xs font-medium text-white transition-colors"
                    >
                      {genre.name}
                    </Link>
                  ))}
                </div>
              )}

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                {film.title}
              </h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 text-gray-300 text-sm mb-6">
                {film.release_year && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {film.release_year}
                  </span>
                )}
                {film.duration_mins && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatDuration(film.duration_mins)}
                  </span>
                )}
                {film.rating && (
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRatingColor(film.rating)} text-white`}>
                    {film.rating}
                  </span>
                )}
                {film.average_rating && (
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    {film.average_rating.toFixed(1)}
                    {film.review_count && (
                      <span className="text-gray-500">({film.review_count} reviews)</span>
                    )}
                  </span>
                )}
              </div>

              {/* Synopsis */}
              <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-6 sm:mb-8 max-w-2xl">
                {film.synopsis}
              </p>

              {/* Director */}
              {film.director && (
                <p className="text-gray-400 mb-6">
                  <span className="text-gray-500">Directed by </span>
                  <span className="text-white font-medium">{film.director.name}</span>
                </p>
              )}

              {/* Access Status & CTA */}
              <div className="space-y-4">
                {hasAccess ? (
                  <div className="space-y-2">
                    {rental && rental.status === 'NOT_STARTED' && (
                      <p className="text-green-500 text-sm">
                        You have access! 48 hours starts when you press play.
                      </p>
                    )}
                    {rental && rental.status === 'ACTIVE' && rental.remaining_hours && (
                      <p className="text-green-500 text-sm">
                        You have access for {rental.remaining_hours} more hours.
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3">
                      <Link href={`/watch/${slug}`}>
                        <Button size="lg" className="bg-red-600 hover:bg-red-700">
                          <Play className="w-5 h-5 mr-2" />
                          Play Now
                        </Button>
                      </Link>
                      {film.trailer_url && (
                        <Button
                          size="lg"
                          variant="outline"
                          className="border-white/20 text-white hover:bg-white/10"
                          onClick={() => setShowTrailerModal(true)}
                        >
                          <FilmIcon className="w-5 h-5 mr-2" />
                          Watch Trailer
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-gray-400 text-sm">
                      48-hour rental access
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        size="lg"
                        className="bg-red-600 hover:bg-red-700"
                        onClick={handleWatchClick}
                      >
                        <Play className="w-5 h-5 mr-2" />
                        Watch Now - {formatPrice(film.price)}
                      </Button>
                      {film.trailer_url && (
                        <Button
                          size="lg"
                          variant="outline"
                          className="border-white/20 text-white hover:bg-white/10"
                          onClick={() => setShowTrailerModal(true)}
                        >
                          <FilmIcon className="w-5 h-5 mr-2" />
                          Watch Trailer
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cast Section */}
      {film.cast && film.cast.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold text-white mb-6">Cast</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
            {film.cast.map((person) => (
              <div
                key={person.id}
                className="flex-shrink-0 w-32 text-center"
              >
                <div className="w-20 h-20 mx-auto rounded-full overflow-hidden bg-gray-800">
                  {person.photo_url ? (
                    <Image
                      src={person.photo_url}
                      alt={person.name}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-600" />
                    </div>
                  )}
                </div>
                <p className="text-white font-medium mt-2 text-sm">{person.name}</p>
                {person.character_name && (
                  <p className="text-gray-500 text-xs">{person.character_name}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Reviews Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-2xl font-bold text-white">Reviews</h2>
          {averageRating && (
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.round(averageRating)
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-gray-600'
                    }`}
                  />
                ))}
              </div>
              <span className="text-gray-400 text-sm">
                {averageRating.toFixed(1)} ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          )}
        </div>

        {/* Write a Review */}
        {isAuthenticated ? (
          !myReview ? (
            <div className="bg-gray-900/50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">Write a Review</h3>

              {/* Star Rating */}
              <div className="mb-4">
                <label className="text-sm text-gray-400 mb-2 block">Your Rating</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      onMouseEnter={() => setReviewHover(star)}
                      onMouseLeave={() => setReviewHover(0)}
                      className="p-0.5 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= (reviewHover || reviewRating)
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-600'
                        } transition-colors`}
                      />
                    </button>
                  ))}
                  {reviewRating > 0 && (
                    <span className="text-gray-400 text-sm ml-2">
                      {reviewRating}/5
                    </span>
                  )}
                </div>
              </div>

              {/* Title */}
              <div className="mb-4">
                <label className="text-sm text-gray-400 mb-2 block">Title (optional)</label>
                <input
                  type="text"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="Sum up your experience"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              {/* Content */}
              <div className="mb-4">
                <label className="text-sm text-gray-400 mb-2 block">Your Review (optional)</label>
                <textarea
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  placeholder="What did you think of this film?"
                  rows={4}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors resize-none"
                />
              </div>

              {reviewError && (
                <p className="text-red-500 text-sm mb-4">{reviewError}</p>
              )}
              {reviewSuccess && (
                <p className="text-green-500 text-sm mb-4">{reviewSuccess}</p>
              )}

              <Button
                onClick={handleSubmitReview}
                disabled={reviewRating === 0 || isSubmittingReview}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>
          ) : (
            <div className="bg-gray-900/50 border border-green-500/20 rounded-lg p-6 mb-8">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-green-500 fill-green-500" />
                <p className="text-green-500 font-medium">You reviewed this film</p>
              </div>
              <div className="flex items-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < myReview.rating
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-gray-600'
                    }`}
                  />
                ))}
              </div>
              {myReview.title && <p className="text-white font-medium">{myReview.title}</p>}
              {myReview.content && <p className="text-gray-400 mt-1">{myReview.content}</p>}
            </div>
          )
        ) : (
          <div className="bg-gray-900/50 rounded-lg p-6 mb-8 text-center">
            <p className="text-gray-400 mb-4">Sign in to leave a review</p>
            <Link href={`/login?redirect=/films/${slug}`}>
              <Button className="bg-red-600 hover:bg-red-700">Sign In to Review</Button>
            </Link>
          </div>
        )}

        {/* Reviews List */}
        {reviews.length > 0 ? (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-gray-900/50 rounded-lg p-6"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                    {review.user.image ? (
                      <Image
                        src={review.user.image}
                        alt={review.user.name}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <span className="text-white font-medium">
                        {review.user.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-white font-medium">{review.user.name}</p>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                {review.title && (
                  <h3 className="text-white font-medium mb-2">{review.title}</h3>
                )}
                {review.content && (
                  <p className="text-gray-400">{review.content}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review!</p>
        )}
      </section>

      {/* Trailer Modal */}
      {showTrailerModal && film.trailer_url && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowTrailerModal(false)}
          />
          <div className="relative w-full max-w-4xl mx-4">
            <button
              onClick={() => setShowTrailerModal(false)}
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

      {/* Payment Modal */}
      {film && (
        <PaymentModal
          film={film}
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
