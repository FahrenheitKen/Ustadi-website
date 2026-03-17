'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus, Search, Edit, Trash2, Eye, Film as FilmIcon, Check, X } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { formatPrice } from '@/lib/utils';
import type { Film } from '@/types';

export default function AdminFilmsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [films, setFilms] = useState<Film[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchFilms = async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getAdminFilms({
        search: search || undefined,
        status: statusFilter || undefined,
        page,
        per_page: 10,
      });
      if (response.success) {
        setFilms(response.films);
        setMeta(response.meta);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load films');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFilms();
  }, [search, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFilms(1);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteFilm(id);
      setDeleteId(null);
      fetchFilms(meta.current_page);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete film');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Films</h1>
          <p className="text-gray-400 mt-1">Manage your film catalog</p>
        </div>
        <Link href="/admin/films/new">
          <Button className="bg-red-600 hover:bg-red-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Film
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search films..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white"
            />
          </div>
        </form>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
        >
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Films Table */}
      <div className="bg-gray-900/50 rounded-xl border border-white/10 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-400">{error}</p>
          </div>
        ) : films.length === 0 ? (
          <div className="text-center py-20">
            <FilmIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No films found</p>
            <Link href="/admin/films/new" className="mt-4 inline-block">
              <Button className="bg-red-600 hover:bg-red-700">
                <Plus className="w-4 h-4 mr-2" />
                Add First Film
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-3">
                    Film
                  </th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-3">
                    Price
                  </th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-3">
                    Status
                  </th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-3">
                    Featured
                  </th>
                  <th className="text-right text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {films.map((film) => (
                  <tr key={film.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-16 rounded overflow-hidden bg-gray-800 flex-shrink-0">
                          {film.poster_url ? (
                            <Image
                              src={film.poster_url}
                              alt={film.title}
                              width={48}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FilmIcon className="w-5 h-5 text-gray-600" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">{film.title}</p>
                          <p className="text-gray-500 text-sm">{film.release_year}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white">{formatPrice(film.price)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          film.is_published
                            ? 'bg-green-900/50 text-green-400'
                            : 'bg-gray-700 text-gray-400'
                        }`}
                      >
                        {film.is_published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {film.is_featured ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <X className="w-5 h-5 text-gray-600" />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/films/${film.slug}`}
                          target="_blank"
                          className="p-2 text-gray-400 hover:text-white transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/films/${film.id}/edit`}
                          className="p-2 text-gray-400 hover:text-white transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteId(film.id)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta.last_page > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
            <p className="text-gray-400 text-sm">
              Showing {(meta.current_page - 1) * 10 + 1} to{' '}
              {Math.min(meta.current_page * 10, meta.total)} of {meta.total} films
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={meta.current_page === 1}
                onClick={() => fetchFilms(meta.current_page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={meta.current_page === meta.last_page}
                onClick={() => fetchFilms(meta.current_page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-2">Delete Film</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete this film? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDeleteId(null)}>
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={() => handleDelete(deleteId)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
