'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { RentalAccess } from '@/types';

export function useRentalAccess(filmId: string | undefined) {
  const { isAuthenticated } = useAuth();
  const [access, setAccess] = useState<RentalAccess | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAccess = useCallback(async () => {
    if (!filmId || !isAuthenticated) {
      setAccess(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.checkAccess(filmId);
      setAccess({
        has_access: response.has_access,
        rental: response.rental,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to check access');
      setAccess(null);
    } finally {
      setIsLoading(false);
    }
  }, [filmId, isAuthenticated]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  const refetch = useCallback(() => {
    checkAccess();
  }, [checkAccess]);

  return {
    access,
    hasAccess: access?.has_access ?? false,
    rental: access?.rental ?? null,
    isLoading,
    error,
    refetch,
  };
}

export function useRentals() {
  const { isAuthenticated } = useAuth();
  const [rentals, setRentals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRentals = useCallback(async () => {
    if (!isAuthenticated) {
      setRentals([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.getRentals();
      setRentals(response.rentals);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch rentals');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchRentals();
  }, [fetchRentals]);

  return {
    rentals,
    isLoading,
    error,
    refetch: fetchRentals,
  };
}
