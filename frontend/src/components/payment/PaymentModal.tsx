'use client';

import { useState } from 'react';
import { X, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { usePayment } from '@/hooks/usePayment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPrice, isValidKenyanPhone, normalizePhoneNumber } from '@/lib/utils';
import type { Film } from '@/types';

interface PaymentModalProps {
  film: Film;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PaymentModal({ film, isOpen, onClose, onSuccess }: PaymentModalProps) {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState(user?.name?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(user?.name?.split(' ').slice(1).join(' ') || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const {
    state,
    message,
    initiatePayment,
    reset,
    isLoading,
    isSuccess,
    isFailed,
  } = usePayment(film.id, {
    onSuccess: () => {
      onSuccess();
    },
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) newErrors.firstName = 'First name is required';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email address';
    if (!phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!isValidKenyanPhone(phone)) newErrors.phone = 'Enter a valid Kenyan phone number';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const normalizedPhone = normalizePhoneNumber(phone);
    await initiatePayment(firstName, lastName, email, normalizedPhone);
  };

  const handleClose = () => {
    if (!isLoading) {
      reset();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-gray-900 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Complete Rental</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-white disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Film Summary */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
            {film.poster_url && (
              <img
                src={film.poster_url}
                alt={film.title}
                className="w-16 h-24 object-cover rounded"
              />
            )}
            <div>
              <h3 className="text-white font-medium">{film.title}</h3>
              <p className="text-gray-400 text-sm">48-hour rental access</p>
              <p className="text-red-500 font-bold mt-1">{formatPrice(film.price)}</p>
            </div>
          </div>

          {/* Success State */}
          {isSuccess && (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Payment Successful!</h3>
              <p className="text-gray-400 mb-6">{message}</p>
              <Button onClick={onSuccess} className="bg-green-600 hover:bg-green-700">
                Start Watching
              </Button>
            </div>
          )}

          {/* Failed State */}
          {isFailed && (
            <div className="text-center py-8">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Payment Failed</h3>
              <p className="text-gray-400 mb-6">{message}</p>
              <Button onClick={reset} variant="outline">
                Try Again
              </Button>
            </div>
          )}

          {/* Loading/Waiting State */}
          {(state === 'initiating' || state === 'waiting' || state === 'polling') && (
            <div className="text-center py-8">
              <Loader2 className="w-16 h-16 text-green-500 mx-auto mb-4 animate-spin" />
              <h3 className="text-xl font-bold text-white mb-2">
                {state === 'initiating' ? 'Sending Request...' : 'Waiting for Payment'}
              </h3>
              <p className="text-gray-400">{message}</p>
              {state !== 'initiating' && (
                <div className="mt-4 p-4 bg-green-900/30 rounded-lg">
                  <p className="text-green-400 text-sm">
                    Check your phone for the M-Pesa prompt and enter your PIN to complete payment.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Form State */}
          {state === 'idle' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    First Name
                  </label>
                  <Input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Last Name
                  </label>
                  <Input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Kamau"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="bg-gray-800 border-gray-700 text-white"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  M-Pesa Phone Number
                </label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07XX XXX XXX"
                  className="bg-gray-800 border-gray-700 text-white"
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                )}
              </div>

              {/* M-Pesa Info */}
              <div className="p-4 bg-green-900/30 rounded-lg border border-green-800/50">
                <div className="flex items-center gap-2 text-green-400">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                  <span className="font-medium">Pay with M-Pesa</span>
                </div>
                <p className="text-green-300/70 text-sm mt-1">
                  You&apos;ll receive an STK push to confirm payment
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isLoading}
              >
                Pay {formatPrice(film.price)} with M-Pesa
              </Button>

              <p className="text-center text-xs text-gray-500">
                By proceeding, you agree to our{' '}
                <a href="/terms" className="text-gray-400 hover:text-white underline">
                  Terms of Service
                </a>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
