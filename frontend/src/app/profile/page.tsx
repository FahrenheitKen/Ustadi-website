'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock, History, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { formatPrice, isValidKenyanPhone, normalizePhoneNumber } from '@/lib/utils';
import type { Rental } from '@/types';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading: authLoading, refreshUser } = useAuth();

  // Profile form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Rental history
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [rentalsLoading, setRentalsLoading] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/profile');
    }
  }, [user, authLoading, router]);

  // Populate form with user data
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone || '');
    }
  }, [user]);

  // Fetch rental history
  useEffect(() => {
    if (!user) return;

    const fetchRentals = async () => {
      try {
        const response = await api.getRentals();
        if (response.success) {
          setRentals(response.rentals);
        }
      } catch (err) {
        console.error('Failed to load rentals', err);
      } finally {
        setRentalsLoading(false);
      }
    };

    fetchRentals();
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    setProfileLoading(true);

    // Validate phone if provided
    if (phone && !isValidKenyanPhone(phone)) {
      setProfileMessage({ type: 'error', text: 'Please enter a valid Kenyan phone number' });
      setProfileLoading(false);
      return;
    }

    try {
      const updates: { name: string; phone?: string } = { name };
      if (phone) {
        updates.phone = normalizePhoneNumber(phone);
      }

      const response = await api.updateProfile(updates);
      if (response.success) {
        setProfileMessage({ type: 'success', text: 'Profile updated successfully' });
        await refreshUser();
      }
    } catch (err: any) {
      setProfileMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update profile',
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await api.updateProfile({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });

      if (response.success) {
        setPasswordMessage({ type: 'success', text: 'Password changed successfully' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setPasswordMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to change password',
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Check if user signed up with OAuth (no password)
  const hasPassword = !user?.email?.includes('@gmail.') || user?.email_verified_at;

  return (
    <div className="min-h-screen py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Account Settings</h1>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Profile Section */}
          <div className="bg-gray-900/50 rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-2 mb-6">
              <User className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-semibold text-white">Profile Information</h2>
            </div>

            {profileMessage && (
              <div
                className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${
                  profileMessage.type === 'success'
                    ? 'bg-green-900/50 border border-green-800 text-green-400'
                    : 'bg-red-900/50 border border-red-800 text-red-400'
                }`}
              >
                {profileMessage.type === 'success' ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                {profileMessage.text}
              </div>
            )}

            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Full Name
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={email}
                  disabled
                  className="bg-gray-800 border-gray-700 text-gray-400"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email cannot be changed
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Phone Number
                </label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07XX XXX XXX"
                  className="bg-gray-800 border-gray-700 text-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Used for M-Pesa payments
                </p>
              </div>

              <Button
                type="submit"
                disabled={profileLoading}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                {profileLoading ? <Spinner size="sm" /> : 'Save Changes'}
              </Button>
            </form>
          </div>

          {/* Password Section */}
          <div className="bg-gray-900/50 rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-2 mb-6">
              <Lock className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-semibold text-white">Change Password</h2>
            </div>

            {!hasPassword ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-gray-400">
                  You signed in with Google and don&apos;t have a password set.
                </p>
              </div>
            ) : (
              <>
                {passwordMessage && (
                  <div
                    className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${
                      passwordMessage.type === 'success'
                        ? 'bg-green-900/50 border border-green-800 text-green-400'
                        : 'bg-red-900/50 border border-red-800 text-red-400'
                    }`}
                  >
                    {passwordMessage.type === 'success' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    {passwordMessage.text}
                  </div>
                )}

                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Current Password
                    </label>
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      New Password
                    </label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Confirm New Password
                    </label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={passwordLoading}
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    {passwordLoading ? <Spinner size="sm" /> : 'Change Password'}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>

        {/* Rental History */}
        <div className="mt-8 bg-gray-900/50 rounded-xl p-6 border border-white/10">
          <div className="flex items-center gap-2 mb-6">
            <History className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-semibold text-white">Rental History</h2>
          </div>

          {rentalsLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : rentals.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No rental history yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-gray-400 text-sm font-medium pb-3 pr-4">
                      Film
                    </th>
                    <th className="text-left text-gray-400 text-sm font-medium pb-3 pr-4">
                      Date
                    </th>
                    <th className="text-left text-gray-400 text-sm font-medium pb-3 pr-4">
                      Amount
                    </th>
                    <th className="text-left text-gray-400 text-sm font-medium pb-3">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rentals.map((rental) => (
                    <tr key={rental.id} className="border-b border-white/5">
                      <td className="py-3 pr-4">
                        <span className="text-white">{rental.film.title}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-gray-400">
                          {new Date(rental.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-white">{formatPrice(rental.amount)}</span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            rental.status === 'ACTIVE'
                              ? 'bg-green-900/50 text-green-400'
                              : rental.status === 'NOT_STARTED'
                                ? 'bg-blue-900/50 text-blue-400'
                                : 'bg-gray-700 text-gray-400'
                          }`}
                        >
                          {rental.status === 'NOT_STARTED'
                            ? 'Not Started'
                            : rental.status === 'ACTIVE'
                              ? 'Active'
                              : 'Expired'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
