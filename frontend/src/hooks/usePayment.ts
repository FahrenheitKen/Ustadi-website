'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import type { PaymentStatusResponse } from '@/types';

export type PaymentState =
  | 'idle'
  | 'initiating'
  | 'waiting'
  | 'polling'
  | 'success'
  | 'failed'
  | 'timeout';

interface UsePaymentOptions {
  onSuccess?: (rentalId: string) => void;
  onError?: (message: string) => void;
  pollingTimeout?: number; // in milliseconds
}

export function usePayment(filmId: string, options: UsePaymentOptions = {}) {
  const { onSuccess, onError, pollingTimeout = 60000 } = options;

  const [state, setState] = useState<PaymentState>('idle');
  const [message, setMessage] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [rentalId, setRentalId] = useState<string | null>(null);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const reset = useCallback(() => {
    cleanup();
    setState('idle');
    setMessage('');
    setTransactionId(null);
    setRentalId(null);
  }, [cleanup]);

  const initiatePayment = useCallback(
    async (
      firstName: string,
      lastName: string,
      email: string,
      phone: string
    ) => {
      cleanup();
      setState('initiating');
      setMessage('Sending payment request...');

      try {
        const response = await api.initiatePayment(
          filmId,
          firstName,
          lastName,
          email,
          phone
        );

        if (!response.success) {
          setState('failed');
          setMessage(response.message || 'Failed to initiate payment');
          onError?.(response.message || 'Failed to initiate payment');
          return;
        }

        setTransactionId(response.transaction_id);
        setState('waiting');
        setMessage(response.message || 'Check your phone and enter M-Pesa PIN');

        // Start polling
        startPolling(response.transaction_id);
      } catch (error: any) {
        setState('failed');
        const errorMessage =
          error.response?.data?.message || 'Failed to initiate payment';
        setMessage(errorMessage);
        onError?.(errorMessage);
      }
    },
    [filmId, cleanup, onError]
  );

  const startPolling = useCallback(
    (txnId: string) => {
      setState('polling');

      // Set timeout for giving up
      timeoutRef.current = setTimeout(() => {
        cleanup();
        setState('timeout');
        setMessage('Payment request timed out. Please try again.');
        onError?.('Payment request timed out');
      }, pollingTimeout);

      // Start polling every 2 seconds
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const status = await api.checkPaymentStatus(txnId);

          if (status.status === 'SUCCESS') {
            cleanup();
            setState('success');
            setMessage(status.message || 'Payment successful!');
            setRentalId(status.rental_id || null);
            onSuccess?.(status.rental_id || '');
          } else if (status.status === 'FAILED' || status.status === 'CANCELLED') {
            cleanup();
            setState('failed');
            setMessage(status.message || 'Payment failed');
            onError?.(status.message || 'Payment failed');
          }
          // If still PENDING, continue polling
        } catch (error) {
          // Ignore polling errors, continue trying
          console.error('Payment status poll error:', error);
        }
      }, 2000);
    },
    [cleanup, pollingTimeout, onSuccess, onError]
  );

  return {
    state,
    message,
    transactionId,
    rentalId,
    initiatePayment,
    reset,
    isLoading: state === 'initiating' || state === 'waiting' || state === 'polling',
    isSuccess: state === 'success',
    isFailed: state === 'failed' || state === 'timeout',
  };
}
