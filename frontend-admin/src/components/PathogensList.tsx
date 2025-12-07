'use client';

/**
 * Pathogens list component
 * Displays and manages pathogens with CRUD operations
 */

import { useState } from 'react';
import { Pathogen } from '@/src/types/api.types';
import { get, post, put, del } from '@/src/lib/api-client';
import PathogenForm from './PathogenForm';

interface PathogensListProps {
  initialPathogens: Pathogen[];
}

export default function PathogensList({ initialPathogens }: PathogensListProps) {
  const [pathogens, setPathogens] = useState<Pathogen[]>(initialPathogens);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPathogen, setEditingPathogen] = useState<Pathogen | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = () => {
    setEditingPathogen(null);
    setIsFormOpen(true);
  };

  const handleEdit = (pathogen: Pathogen) => {
    setEditingPathogen(pathogen);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Opravdu chcete smazat tento patogen?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await del(`/pathogens/${id}`);
      if (response.success) {
        setPathogens(pathogens.filter((p) => p.id !== id));
      } else {
        setError(response.error?.message || 'Nepodařilo se smazat patogen');
      }
    } catch (err: any) {
      setError(err.message || 'Nepodařilo se smazat patogen');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (name: string) => {
    setLoading(true);
    setError('');

    try {
      if (editingPathogen) {
        // Update existing pathogen
        const response = await put<Pathogen>(`/pathogens/${editingPathogen.id}`, { name });
        if (response.success && response.data) {
          setPathogens(
            pathogens.map((p) => (p.id === editingPathogen.id ? response.data! : p)),
          );
          setIsFormOpen(false);
          setEditingPathogen(null);
        } else {
          setError(response.error?.message || 'Nepodařilo se aktualizovat patogen');
        }
      } else {
        // Create new pathogen
        const response = await post<Pathogen>('/pathogens', { name });
        if (response.success && response.data) {
          setPathogens([...pathogens, response.data]);
          setIsFormOpen(false);
        } else {
          setError(response.error?.message || 'Nepodařilo se vytvořit patogen');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Nepodařilo se uložit patogen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Celkem patogenů: <span className="font-semibold">{pathogens.length}</span>
        </p>
        <button
          onClick={handleCreate}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Přidat patogen
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {isFormOpen && (
        <PathogenForm
          pathogen={editingPathogen}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingPathogen(null);
          }}
          loading={loading}
        />
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Název
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Akce
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {pathogens.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-6 py-4 text-center text-sm text-gray-500">
                  Žádné patogeny
                </td>
              </tr>
            ) : (
              pathogens.map((pathogen) => (
                <tr key={pathogen.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {pathogen.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(pathogen)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Upravit
                    </button>
                    <button
                      onClick={() => handleDelete(pathogen.id)}
                      className="ml-4 text-red-600 hover:text-red-900"
                    >
                      Smazat
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

