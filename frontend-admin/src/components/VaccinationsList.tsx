'use client';

/**
 * Vaccinations list component
 * Displays and manages vaccinations with CRUD operations
 */

import { useState } from 'react';
import { Vaccination } from '@/src/types/api.types';
import { get, post, put, del } from '@/src/lib/api-client';
import VaccinationForm from './VaccinationForm';

interface VaccinationsListProps {
  initialVaccinations: Vaccination[];
}

export default function VaccinationsList({ initialVaccinations }: VaccinationsListProps) {
  const [vaccinations, setVaccinations] = useState<Vaccination[]>(initialVaccinations);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVaccination, setEditingVaccination] = useState<Vaccination | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = () => {
    setEditingVaccination(null);
    setIsFormOpen(true);
  };

  const handleEdit = (vaccination: Vaccination) => {
    setEditingVaccination(vaccination);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Opravdu chcete smazat tento typ vakcíny?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await del(`/vaccinations/${id}`);
      if (response.success) {
        setVaccinations(vaccinations.filter((v) => v.id !== id));
      } else {
        setError(response.error?.message || 'Nepodařilo se smazat typ vakcíny');
      }
    } catch (err: any) {
      setError(err.message || 'Nepodařilo se smazat typ vakcíny');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (name: string) => {
    setLoading(true);
    setError('');

    try {
      if (editingVaccination) {
        // Update
        const response = await put<Vaccination>(
          `/vaccinations/${editingVaccination.id}`,
          { name },
        );
        if (response.success && response.data) {
          const updatedVaccination = response.data;
          setVaccinations(
            vaccinations.map((v) => (v.id === editingVaccination.id ? updatedVaccination : v)),
          );
          setIsFormOpen(false);
          setEditingVaccination(null);
        } else {
          setError(response.error?.message || 'Nepodařilo se aktualizovat typ vakcíny');
        }
      } else {
        // Create
        const response = await post<Vaccination>('/vaccinations', {
          name,
        });
        if (response.success && response.data) {
          const newVaccination = response.data;
          setVaccinations([...vaccinations, newVaccination]);
          setIsFormOpen(false);
        } else {
          setError(response.error?.message || 'Nepodařilo se vytvořit typ vakcíny');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Operace selhala');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Celkem typů vakcín: <span className="font-semibold">{vaccinations.length}</span>
        </p>
        <button
          onClick={handleCreate}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Přidat typ vakcíny
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {isFormOpen && (
        <VaccinationForm
          vaccination={editingVaccination}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingVaccination(null);
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
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Vytvořeno
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Akce
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {vaccinations.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                  Žádné typy vakcín
                </td>
              </tr>
            ) : (
              vaccinations.map((vaccination) => (
                <tr key={vaccination.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {vaccination.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(vaccination.createdAt).toLocaleDateString('cs-CZ')}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(vaccination)}
                      className="mr-4 text-blue-600 hover:text-blue-900"
                    >
                      Upravit
                    </button>
                    <button
                      onClick={() => handleDelete(vaccination.id)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
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

