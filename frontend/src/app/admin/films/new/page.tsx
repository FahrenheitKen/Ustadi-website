'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Upload, X } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import type { Genre } from '@/types';

export default function NewFilmPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [genres, setGenres] = useState<Genre[]>([]);

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [price, setPrice] = useState('');
  const [durationMins, setDurationMins] = useState('');
  const [releaseYear, setReleaseYear] = useState('');
  const [rating, setRating] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await api.getGenres();
        if (response.success) {
          setGenres(response.genres);
        }
      } catch (err) {
        console.error('Failed to load genres', err);
      }
    };
    fetchGenres();
  }, []);

  // Auto-generate slug from title
  useEffect(() => {
    if (title && !slug) {
      setSlug(
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
      );
    }
  }, [title]);

  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPosterFile(file);
      setPosterPreview(URL.createObjectURL(file));
    }
  };

  const removePoster = () => {
    setPosterFile(null);
    setPosterPreview(null);
    setPosterUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Upload poster file first if selected
      let finalPosterUrl = posterUrl || null;
      if (posterFile) {
        setIsUploading(true);
        const uploadRes = await api.uploadPoster(posterFile);
        finalPosterUrl = uploadRes.url;
        setIsUploading(false);
      }

      const response = await api.createFilm({
        title,
        slug,
        synopsis,
        poster_url: finalPosterUrl,
        trailer_url: trailerUrl || null,
        video_url: videoUrl || undefined,
        price: parseInt(price, 10),
        duration_mins: durationMins ? parseInt(durationMins, 10) : null,
        release_year: releaseYear ? parseInt(releaseYear, 10) : null,
        rating: rating || null,
        is_published: isPublished,
        is_featured: isFeatured,
        genres: selectedGenres as any,
      });

      if (response.success) {
        router.push('/admin/films');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create film');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleGenre = (genreId: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId)
        ? prev.filter((id) => id !== genreId)
        : [...prev, genreId]
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/films"
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Add New Film</h1>
          <p className="text-gray-400 mt-1">Create a new film in your catalog</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-800 rounded-lg text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-gray-900/50 rounded-xl p-6 border border-white/10 space-y-4">
          <h2 className="text-lg font-semibold text-white mb-4">Basic Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Title *
              </label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Slug *
              </label>
              <Input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                placeholder="url-friendly-name"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Synopsis *
            </label>
            <textarea
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              required
              rows={4}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Price (KES) *
              </label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                min="0"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Duration (minutes)
              </label>
              <Input
                type="number"
                value={durationMins}
                onChange={(e) => setDurationMins(e.target.value)}
                min="0"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Release Year
              </label>
              <Input
                type="number"
                value={releaseYear}
                onChange={(e) => setReleaseYear(e.target.value)}
                min="1900"
                max={new Date().getFullYear() + 1}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Rating
            </label>
            <select
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            >
              <option value="">Select rating</option>
              <option value="G">G - General Audiences</option>
              <option value="PG">PG - Parental Guidance</option>
              <option value="PG-13">PG-13 - Parents Strongly Cautioned</option>
              <option value="R">R - Restricted</option>
              <option value="18+">18+ - Adults Only</option>
            </select>
          </div>
        </div>

        {/* Media URLs */}
        <div className="bg-gray-900/50 rounded-xl p-6 border border-white/10 space-y-4">
          <h2 className="text-lg font-semibold text-white mb-4">Media</h2>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Poster Image
            </label>
            {posterPreview ? (
              <div className="relative inline-block">
                <img
                  src={posterPreview}
                  alt="Poster preview"
                  className="w-40 h-56 object-cover rounded-lg border border-white/10"
                />
                <button
                  type="button"
                  onClick={removePoster}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-40 h-56 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-gray-500 transition-colors bg-gray-800/50">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-400">Upload poster</span>
                <span className="text-xs text-gray-500 mt-1">Max 10MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePosterChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Trailer URL
            </label>
            <Input
              type="url"
              value={trailerUrl}
              onChange={(e) => setTrailerUrl(e.target.value)}
              placeholder="https://youtube.com/... or HLS URL"
              className="bg-gray-800 border-gray-700 text-white"
            />
            <p className="text-xs text-gray-500 mt-1">
              YouTube, Vimeo, or HLS manifest URL
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Video URL (Full Film)
            </label>
            <Input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="videos/film-id/full/index.m3u8"
              className="bg-gray-800 border-gray-700 text-white"
            />
            <p className="text-xs text-gray-500 mt-1">
              S3 path to HLS manifest (will be served via CloudFront signed URLs)
            </p>
          </div>
        </div>

        {/* Genres */}
        <div className="bg-gray-900/50 rounded-xl p-6 border border-white/10">
          <h2 className="text-lg font-semibold text-white mb-4">Genres</h2>
          <div className="flex flex-wrap gap-2">
            {genres.map((genre) => (
              <button
                key={genre.id}
                type="button"
                onClick={() => toggleGenre(genre.id)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedGenres.includes(genre.id)
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {genre.name}
              </button>
            ))}
          </div>
        </div>

        {/* Publishing Options */}
        <div className="bg-gray-900/50 rounded-xl p-6 border border-white/10 space-y-4">
          <h2 className="text-lg font-semibold text-white mb-4">Publishing</h2>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-5 h-5 rounded border-gray-700 bg-gray-800 text-red-600 focus:ring-red-500"
            />
            <div>
              <span className="text-white font-medium">Published</span>
              <p className="text-gray-500 text-sm">Make this film visible to users</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="w-5 h-5 rounded border-gray-700 bg-gray-800 text-red-600 focus:ring-red-500"
            />
            <div>
              <span className="text-white font-medium">Featured</span>
              <p className="text-gray-500 text-sm">Show in the hero section on homepage</p>
            </div>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-end">
          <Link href="/admin/films">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? (
              <>
                <Spinner size="sm" />
                {isUploading && <span className="ml-2">Uploading poster...</span>}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Film
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
