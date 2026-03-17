'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Film,
  Users,
  CreditCard,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Spinner } from '@/components/ui/spinner';
import { formatPrice } from '@/lib/utils';

interface DashboardStats {
  total_films: number;
  published_films: number;
  total_users: number;
  total_rentals: number;
  revenue_30_days: number;
  rentals_30_days: number;
}

interface Transaction {
  id: string;
  user: { name: string; email: string };
  film: { title: string };
  amount: number;
  status: string;
  mpesa_receipt: string | null;
  created_at: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.getAdminDashboard();
        if (response.success) {
          setStats(response.stats);
          setTransactions(response.recent_transactions);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  const statCards = [
    {
      name: 'Total Films',
      value: stats?.total_films || 0,
      subtext: `${stats?.published_films || 0} published`,
      icon: Film,
      color: 'bg-blue-500',
      href: '/admin/films',
    },
    {
      name: 'Total Users',
      value: stats?.total_users || 0,
      subtext: 'Registered accounts',
      icon: Users,
      color: 'bg-green-500',
      href: '/admin/users',
    },
    {
      name: 'Total Rentals',
      value: stats?.total_rentals || 0,
      subtext: `${stats?.rentals_30_days || 0} in last 30 days`,
      icon: CreditCard,
      color: 'bg-purple-500',
      href: '/admin/transactions',
    },
    {
      name: 'Revenue (30 days)',
      value: formatPrice(stats?.revenue_30_days || 0),
      subtext: 'From successful payments',
      icon: TrendingUp,
      color: 'bg-red-500',
      href: '/admin/transactions',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Overview of your platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="bg-gray-900/50 rounded-xl p-6 border border-white/10 hover:border-white/20 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm">{stat.name}</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                </p>
                <p className="text-gray-500 text-xs mt-1">{stat.subtext}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="bg-gray-900/50 rounded-xl border border-white/10">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent Transactions</h2>
          <Link
            href="/admin/transactions"
            className="text-sm text-red-500 hover:text-red-400 transition-colors"
          >
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-3">
                  User
                </th>
                <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-3">
                  Film
                </th>
                <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-3">
                  Amount
                </th>
                <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-3">
                  Status
                </th>
                <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-3">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No transactions yet
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white text-sm">{tx.user?.name || 'Unknown'}</p>
                        <p className="text-gray-500 text-xs">{tx.user?.email || ''}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white text-sm">{tx.film?.title || 'Unknown'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white text-sm">{formatPrice(tx.amount)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          tx.status === 'SUCCESS'
                            ? 'bg-green-900/50 text-green-400'
                            : tx.status === 'PENDING'
                              ? 'bg-yellow-900/50 text-yellow-400'
                              : 'bg-red-900/50 text-red-400'
                        }`}
                      >
                        {tx.status === 'SUCCESS' && <ArrowUpRight className="w-3 h-3 mr-1" />}
                        {tx.status === 'FAILED' && <ArrowDownRight className="w-3 h-3 mr-1" />}
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-400 text-sm">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/admin/films/new"
          className="flex items-center gap-4 p-6 bg-gray-900/50 rounded-xl border border-white/10 hover:border-red-500/50 transition-colors"
        >
          <div className="p-3 rounded-lg bg-red-500">
            <Film className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-white font-medium">Add New Film</h3>
            <p className="text-gray-400 text-sm">Upload a new film to the catalog</p>
          </div>
        </Link>
        <Link
          href="/admin/transactions"
          className="flex items-center gap-4 p-6 bg-gray-900/50 rounded-xl border border-white/10 hover:border-red-500/50 transition-colors"
        >
          <div className="p-3 rounded-lg bg-purple-500">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-white font-medium">View All Transactions</h3>
            <p className="text-gray-400 text-sm">Monitor payments and rentals</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
