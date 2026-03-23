'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import type { PaymentGateway, PaymentGatewayOption } from '@/types';

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
  const [gateways, setGateways] = useState<PaymentGatewayOption[]>([]);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null);
  const [gatewaysLoading, setGatewaysLoading] = useState(true);

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

  // Fetch available gateways on mount
  useEffect(() => {
    const fetchGateways = async () => {
      try {
        const response = await api.getPaymentGateways();
        if (response.success && response.gateways.length > 0) {
          setGateways(response.gateways);
          setSelectedGateway(response.gateways[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch payment gateways:', error);
      } finally {
        setGatewaysLoading(false);
      }
    };

    fetchGateways();
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

  // M-Pesa payment flow
  const initiateMpesaPayment = useCallback(
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

  // Paystack payment flow
  const initiatePaystackPayment = useCallback(
    async (email: string) => {
      cleanup();
      setState('initiating');
      setMessage('Initializing payment...');

      try {
        const response = await api.initiatePaystackPayment(filmId, email);

        if (!response.success) {
          setState('failed');
          setMessage(response.message || 'Failed to initiate payment');
          onError?.(response.message || 'Failed to initiate payment');
          return;
        }

        setTransactionId(response.transaction_id);

        // Open Paystack popup using newTransaction() with callbacks
        openPaystackPopup(
          response.public_key,
          response.email,
          response.amount,
          response.reference
        );
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

  // Open Paystack inline popup using newTransaction (supports callbacks)
  const openPaystackPopup = useCallback(
    (publicKey: string, email: string, amount: number, reference: string) => {
      setState('waiting');
      setMessage('Complete payment in the Paystack window...');

      const launchPopup = () => {
        const PaystackPop = (window as any).PaystackPop;
        if (!PaystackPop) {
          setState('failed');
          setMessage('Failed to load payment gateway. Please try again.');
          onError?.('Failed to load Paystack');
          return;
        }

        try {
          const popup = new PaystackPop();
          popup.newTransaction({
            key: publicKey,
            email,
            amount,
            reference,
            onSuccess: (transaction: any) => {
              // Payment completed — verify on backend
              verifyPaystackPayment(transaction.reference || reference);
            },
            onCancel: () => {
              // User closed popup — check if payment went through
              verifyPaystackPayment(reference);
            },
            onError: (error: any) => {
              console.error('Paystack error:', error);
              setState('failed');
              setMessage('Payment failed. Please try again.');
              onError?.('Paystack payment error');
            },
          });
        } catch (err) {
          console.error('Paystack popup error:', err);
          setState('failed');
          setMessage('Failed to open payment window. Please try again.');
          onError?.('Failed to open Paystack popup');
        }
      };

      // If already loaded (preloaded via Script component), use it directly
      if ((window as any).PaystackPop) {
        launchPopup();
        return;
      }

      // Fallback: load script dynamically if not preloaded
      const existingScript = document.querySelector('script[src*="js.paystack.co"]');
      if (existingScript) {
        existingScript.addEventListener('load', launchPopup);
        existingScript.addEventListener('error', () => {
          setState('failed');
          setMessage('Failed to load payment gateway. Please try again.');
          onError?.('Failed to load Paystack script');
        });
      } else {
        const script = document.createElement('script');
        script.src = 'https://js.paystack.co/v2/inline.js';
        script.onload = launchPopup;
        script.onerror = () => {
          setState('failed');
          setMessage('Failed to load payment gateway. Please try again.');
          onError?.('Failed to load Paystack script');
        };
        document.head.appendChild(script);
      }
    },
    [onError]
  );

  // Verify Paystack payment after popup callback
  const verifyPaystackPayment = useCallback(
    async (reference: string) => {
      setState('polling');
      setMessage('Verifying payment...');

      try {
        const result = await api.verifyPaystackPayment(reference);

        if (result.status === 'SUCCESS') {
          setState('success');
          setMessage(result.message || 'Payment successful!');
          setRentalId(result.rental_id || null);
          onSuccess?.(result.rental_id || '');
        } else if (result.status === 'FAILED' || result.status === 'CANCELLED') {
          setState('failed');
          setMessage(result.message || 'Payment failed');
          onError?.(result.message || 'Payment failed');
        } else {
          // Still pending — user may have closed popup before completing
          setState('failed');
          setMessage('Payment was not completed. Please try again.');
          onError?.('Payment not completed');
        }
      } catch (error: any) {
        setState('failed');
        const errorMessage =
          error.response?.data?.message || 'Failed to verify payment';
        setMessage(errorMessage);
        onError?.(errorMessage);
      }
    },
    [onSuccess, onError]
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
    gateways,
    selectedGateway,
    setSelectedGateway,
    gatewaysLoading,
    initiateMpesaPayment,
    initiatePaystackPayment,
    reset,
    isLoading: state === 'initiating' || state === 'waiting' || state === 'polling',
    isSuccess: state === 'success',
    isFailed: state === 'failed' || state === 'timeout',
  };
}
