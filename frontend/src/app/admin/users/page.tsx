'use client';

import { useEffect, useState } from 'react';
import { Search, User as UserIcon, Shield, ShieldOff, Mail, Phone } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import type { User } from '@/types';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userRentals, setUserRentals] = useState<any[]>([]);
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  const fetchUsers = async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getAdminUsers({
        search: search || undefined,
        role: roleFilter || undefined,
        page,
        per_page: 20,
      });
      if (response.success) {
        setUsers(response.users);
        setMeta(response.meta);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter]);

  const handleViewUser = async (user: User) => {
    setSelectedUser(user);
    setIsLoadingUser(true);
    try {
      const response = await api.getAdminUser(user.id);
      if (response.success) {
        setUserRentals(response.rentals);
      }
    } catch (err) {
      console.error('Failed to load user details', err);
    } finally {
      setIsLoadingUser(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="text-gray-400 mt-1">Manage user accounts</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white"
            />
          </div>
        </form>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
        >
          <option value="">All Roles</option>
          <option value="CUSTOMER">Customers</option>
          <option value="ADMIN">Admins</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users List */}
        <div className="lg:col-span-2">
          <div className="bg-gray-900/50 rounded-xl border border-white/10 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Spinner size="lg" />
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <p className="text-red-400">{error}</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-20">
                <UserIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-3">
                        User
                      </th>
                      <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-3">
                        Role
                      </th>
                      <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-3">
                        Joined
                      </th>
                      <th className="text-right text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-3">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className={`border-b border-white/5 hover:bg-white/5 cursor-pointer ${
                          selectedUser?.id === user.id ? 'bg-white/5' : ''
                        }`}
                        onClick={() => handleViewUser(user)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                              {user.image ? (
                                <img
                                  src={user.image}
                                  alt={user.name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-white font-medium">
                                  {user.name.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="text-white text-sm font-medium">{user.name}</p>
                              <p className="text-gray-500 text-xs">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                              user.role === 'ADMIN'
                                ? 'bg-purple-900/50 text-purple-400'
                                : 'bg-gray-700 text-gray-400'
                            }`}
                          >
                            {user.role === 'ADMIN' ? (
                              <Shield className="w-3 h-3" />
                            ) : (
                              <UserIcon className="w-3 h-3" />
                            )}
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-400 text-sm">
                            {user.created_at
                              ? new Date(user.created_at).toLocaleDateString()
                              : '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewUser(user);
                            }}
                          >
                            View
                          </Button>
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
                  Page {meta.current_page} of {meta.last_page}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={meta.current_page === 1}
                    onClick={() => fetchUsers(meta.current_page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={meta.current_page === meta.last_page}
                    onClick={() => fetchUsers(meta.current_page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Details Panel */}
        <div className="lg:col-span-1">
          <div className="bg-gray-900/50 rounded-xl border border-white/10 p-6 sticky top-24">
            {selectedUser ? (
              isLoadingUser ? (
                <div className="flex items-center justify-center py-10">
                  <Spinner size="md" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* User Info */}
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center mx-auto">
                      {selectedUser.image ? (
                        <img
                          src={selectedUser.image}
                          alt={selectedUser.name}
                          className="w-20 h-20 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl text-white font-medium">
                          {selectedUser.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-white mt-4">
                      {selectedUser.name}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium mt-2 ${
                        selectedUser.role === 'ADMIN'
                          ? 'bg-purple-900/50 text-purple-400'
                          : 'bg-gray-700 text-gray-400'
                      }`}
                    >
                      {selectedUser.role}
                    </span>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-gray-400">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">{selectedUser.email}</span>
                    </div>
                    {selectedUser.phone && (
                      <div className="flex items-center gap-3 text-gray-400">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm">{selectedUser.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Rental History */}
                  <div>
                    <h4 className="text-sm font-medium text-white mb-3">
                      Rental History ({userRentals.length})
                    </h4>
                    {userRentals.length === 0 ? (
                      <p className="text-gray-500 text-sm">No rentals</p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {userRentals.map((rental: any) => (
                          <div
                            key={rental.id}
                            className="p-3 bg-gray-800/50 rounded-lg"
                          >
                            <p className="text-white text-sm">
                              {rental.film?.title || 'Unknown Film'}
                            </p>
                            <p className="text-gray-500 text-xs">
                              {new Date(rental.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            ) : (
              <div className="text-center py-10">
                <UserIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500">Select a user to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
