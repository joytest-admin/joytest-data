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

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200 table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-[180px]">
                Email
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-[100px]">
                IČP
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-[120px]">
                Město
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-[90px]">
                Status
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-[100px]">
                Heslo
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 min-w-[250px]">
                Odkaz
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-[100px]">
                Vytvořeno
              </th>
              <th className="px-2 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500 sticky right-0 bg-gray-50 z-10 min-w-[200px]">
                Akce
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {users.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-2 py-3 text-center text-sm text-gray-500">
                  Žádní doktoři
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const uniqueLink = getUniqueLink(user.uniqueLinkToken);
                return (
                  <tr key={user.id} className="group hover:bg-gray-50">
                    <td className="px-2 py-2 text-sm font-medium text-gray-900">
                      <div className="max-w-[180px] truncate" title={user.email || ''}>
                        {user.email || '-'}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500">
                      {user.icpNumber || '-'}
                    </td>
                    <td className="px-2 py-2 text-sm text-gray-500">
                      <div className="max-w-[120px] truncate" title={user.cityName || ''}>
                        {user.cityName || '-'}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500">
                      {user.status === 'pending' ? (
                        <span className="inline-flex rounded-full bg-yellow-100 px-1.5 py-0.5 text-xs font-semibold text-yellow-800">
                          Čeká
                        </span>
                      ) : user.status === 'approved' ? (
                        <span className="inline-flex rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-semibold text-green-800">
                          OK
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-800">
                          Ne
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500">
                      {user.requirePassword ? (
                        <span className="inline-flex rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-semibold text-green-800">
                          Ano
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-gray-100 px-1.5 py-0.5 text-xs font-semibold text-gray-800">
                          Ne
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-sm text-gray-500">
                      {user.requirePassword ? (
                        <span className="text-gray-400">-</span>
                      ) : uniqueLink ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            readOnly
                            value={uniqueLink}
                            className="min-w-[180px] max-w-[220px] flex-1 rounded border border-gray-300 px-1.5 py-0.5 text-xs font-mono"
                            onClick={(e) => (e.target as HTMLInputElement).select()}
                          />
                          <button
                            onClick={() => copyToClipboard(uniqueLink)}
                            className="shrink-0 rounded bg-blue-600 px-1.5 py-0.5 text-xs text-white hover:bg-blue-700 whitespace-nowrap"
                            title="Kopírovat odkaz"
                          >
                            Kopírovat
                          </button>
                          <button
                            onClick={() => handleRegenerateToken(user.id)}
                            disabled={loading}
                            className="shrink-0 rounded bg-orange-600 px-1.5 py-0.5 text-xs text-white hover:bg-orange-700 disabled:opacity-50 whitespace-nowrap"
                            title="Vygenerovat nový odkaz"
                          >
                            Obnovit
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </td>
                    <td className="px-2 py-2 text-sm font-medium sticky right-0 bg-white group-hover:bg-gray-50 z-10">
                      <div className="flex justify-end gap-1">
                        {user.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleValidate(user.id, 'approved')}
                              disabled={loading}
                              className="rounded border border-green-200 px-1.5 py-0.5 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:opacity-50 whitespace-nowrap"
                            >
                              Schválit
                            </button>
                            <button
                              onClick={() => handleValidate(user.id, 'rejected')}
                              disabled={loading}
                              className="rounded border border-red-200 px-1.5 py-0.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50 whitespace-nowrap"
                            >
                              Zamítnout
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleEdit(user)}
                          className="rounded border border-blue-200 px-1.5 py-0.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 whitespace-nowrap"
                        >
                          Upravit
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          disabled={loading}
                          className="rounded border border-red-200 px-1.5 py-0.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 whitespace-nowrap"
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

