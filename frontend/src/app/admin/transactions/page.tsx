'use client';

import { useEffect, useState } from 'react';
import { Download, Search, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { formatPrice } from '@/lib/utils';

interface Transaction {
  id: string;
  user: { id: string; name: string; email: string } | null;
  film: { id: string; title: string; slug: string } | null;
  phone: string;
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  mpesa_receipt: string | null;
  checkout_request_id: string | null;
  result_desc: string | null;
  created_at: string;
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [isExporting, setIsExporting] = useState(false);

  const fetchTransactions = async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getAdminTransactions({
        status: statusFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        page,
        per_page: 20,
      });
      if (response.success) {
        setTransactions(response.transactions);
        setMeta(response.meta);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [statusFilter, dateFrom, dateTo]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await api.exportTransactions({
        status: statusFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError('Failed to export transactions');
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <ArrowUpRight className="w-3 h-3" />;
      case 'FAILED':
      case 'CANCELLED':
        return <ArrowDownRight className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-green-900/50 text-green-400';
      case 'PENDING':
        return 'bg-yellow-900/50 text-yellow-400';
      case 'FAILED':
      case 'CANCELLED':
        return 'bg-red-900/50 text-red-400';
      default:
        return 'bg-gray-700 text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
          <p className="text-gray-400 mt-1">View and export payment history</p>
        </div>
        <Button
          onClick={handleExport}
          disabled={isExporting}
          variant="outline"
        >
          {isExporting ? (
            <Spinner size="sm" />
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </>
          )}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
        >
          <option value="">All Status</option>
          <option value="SUCCESS">Success</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-gray-800 border-gray-700 text-white"
          />
          <span className="text-gray-500">to</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-gray-800 border-gray-700 text-white"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-gray-900/50 rounded-xl border border-white/10 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-400">{error}</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400">No transactions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-3">
                    Date
                  </th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-3">
                    User
                  </th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-3">
                    Film
                  </th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-3">
                    Phone
                  </th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-3">
                    Amount
                  </th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-3">
                    Status
                  </th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-3">
                    M-Pesa Receipt
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-6 py-4">
                      <span className="text-white text-sm">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </span>
                      <br />
                      <span className="text-gray-500 text-xs">
                        {new Date(tx.created_at).toLocaleTimeString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {tx.user ? (
                        <div>
                          <p className="text-white text-sm">{tx.user.name}</p>
                          <p className="text-gray-500 text-xs">{tx.user.email}</p>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">Unknown</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white text-sm">
                        {tx.film?.title || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-300 text-sm font-mono">
                        {tx.phone}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white text-sm font-medium">
                        {formatPrice(tx.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(tx.status)}`}
                      >
                        {getStatusIcon(tx.status)}
                        {tx.status}
                      </span>
                      {tx.result_desc && tx.status !== 'SUCCESS' && (
                        <p className="text-gray-500 text-xs mt-1 max-w-[150px] truncate">
                          {tx.result_desc}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {tx.mpesa_receipt ? (
                        <span className="text-green-400 text-sm font-mono">
                          {tx.mpesa_receipt}
                        </span>
                      ) : (
                        <span className="text-gray-600 text-sm">-</span>
                      )}
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
              Showing {(meta.current_page - 1) * 20 + 1} to{' '}
              {Math.min(meta.current_page * 20, meta.total)} of {meta.total} transactions
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={meta.current_page === 1}
                onClick={() => fetchTransactions(meta.current_page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={meta.current_page === meta.last_page}
                onClick={() => fetchTransactions(meta.current_page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
