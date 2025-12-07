'use client';

/**
 * Doctors list component
 * Displays and manages doctors (users) with CRUD operations
 */

import { useState } from 'react';
import { User } from '@/src/types/api.types';
import { get, post, put, del } from '@/src/lib/api-client';
import DoctorForm from './DoctorForm';

interface DoctorsListProps {
  initialUsers: User[];
}

export default function DoctorsList({ initialUsers }: DoctorsListProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Opravdu chcete smazat tohoto doktora?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await del(`/users/${id}`);
      if (response.success) {
        setUsers(users.filter((u) => u.id !== id));
      } else {
        setError(response.error?.message || 'Nepodařilo se smazat doktora');
      }
    } catch (err: any) {
      setError(err.message || 'Nepodařilo se smazat doktora');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (data: {
    email?: string;
    icpNumber: string;
    cityId: number;
    requirePassword: boolean;
    password?: string;
  }) => {
    setLoading(true);
    setError('');

    try {
      if (editingUser) {
        // Update
        const response = await put<User>(
          `/users/${editingUser.id}`,
          data,
        );
        if (response.success && response.data) {
          const updatedUser = response.data;
          setUsers(
            users.map((u) => (u.id === editingUser.id ? updatedUser : u)),
          );
          setIsFormOpen(false);
          setEditingUser(null);
        } else {
          setError(response.error?.message || 'Nepodařilo se aktualizovat doktora');
        }
      } else {
        // Create
        const response = await post<User>('/users', data);
        if (response.success && response.data) {
          const newUser = response.data;
          setUsers([...users, newUser]);
          setIsFormOpen(false);
        } else {
          setError(response.error?.message || 'Nepodařilo se vytvořit doktora');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Operace selhala');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateToken = async (userId: string) => {
    if (!confirm('Opravdu chcete vygenerovat nový odkaz? Starý odkaz přestane fungovat.')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await post<User>(`/users/${userId}/regenerate-token`, {});
      if (response.success && response.data) {
        const updatedUser = response.data;
        setUsers(users.map((u) => (u.id === userId ? updatedUser : u)));
      } else {
        setError(response.error?.message || 'Nepodařilo se vygenerovat nový odkaz');
      }
    } catch (err: any) {
      setError(err.message || 'Nepodařilo se vygenerovat nový odkaz');
    } finally {
      setLoading(false);
    }
  };

  const getUniqueLink = (token: string | null | undefined): string => {
    if (!token) return '';
    // Get the current origin (e.g., http://localhost:3000 or https://example.com)
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/?token=${token}`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Odkaz zkopírován do schránky');
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Nepodařilo se zkopírovat odkaz');
    }
  };

  const handleValidate = async (userId: string, status: 'approved' | 'rejected') => {
    const action = status === 'approved' ? 'schválit' : 'zamítnout';
    if (!confirm(`Opravdu chcete ${action} tohoto doktora?`)) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await post<User>(`/users/${userId}/validate`, { status });
      if (response.success && response.data) {
        const updatedUser = response.data;
        setUsers(users.map((u) => (u.id === userId ? updatedUser : u)));
      } else {
        setError(response.error?.message || `Nepodařilo se ${action} doktora`);
      }
    } catch (err: any) {
      setError(err.message || `Operace selhala`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Celkem doktorů: <span className="font-semibold">{users.length}</span>
        </p>
        <button
          onClick={handleCreate}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Přidat doktora
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {isFormOpen && (
        <DoctorForm
          user={editingUser}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingUser(null);
          }}
          loading={loading}
        />
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                IČP
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Město
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Vyžaduje heslo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Jedinečný odkaz
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Vytvořeno
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Akce
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {users.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                  Žádní doktoři
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const uniqueLink = getUniqueLink(user.uniqueLinkToken);
                return (
                  <tr key={user.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {user.email || '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {user.icpNumber || '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {user.cityName || '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {user.status === 'pending' ? (
                        <span className="inline-flex rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">
                          Čeká na schválení
                        </span>
                      ) : user.status === 'approved' ? (
                        <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                          Schváleno
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                          Zamítnuto
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {user.requirePassword ? (
                        <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                          Ano
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800">
                          Ne
                        </span>
                      )}
                    </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                      {user.requirePassword ? (
                        <span className="text-gray-400">-</span>
                      ) : uniqueLink ? (
                      <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={uniqueLink}
                          className="min-w-[180px] flex-1 rounded border border-gray-300 px-2 py-1 text-xs font-mono"
                            onClick={(e) => (e.target as HTMLInputElement).select()}
                          />
                          <button
                            onClick={() => copyToClipboard(uniqueLink)}
                          className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
                            title="Kopírovat odkaz"
                          >
                            Kopírovat
                          </button>
                          <button
                            onClick={() => handleRegenerateToken(user.id)}
                            disabled={loading}
                          className="rounded bg-orange-600 px-3 py-1 text-xs text-white hover:bg-orange-700 disabled:opacity-50"
                            title="Vygenerovat nový odkaz"
                          >
                            Obnovit
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400">Žádný odkaz</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('cs-CZ')}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex flex-wrap justify-end gap-2">
                        {user.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleValidate(user.id, 'approved')}
                              disabled={loading}
                              className="rounded border border-green-200 px-3 py-1 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:opacity-50"
                            >
                              Schválit
                            </button>
                            <button
                              onClick={() => handleValidate(user.id, 'rejected')}
                              disabled={loading}
                              className="rounded border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                            >
                              Zamítnout
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleEdit(user)}
                          className="rounded border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                        >
                          Upravit
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          disabled={loading}
                          className="rounded border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          Smazat
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

