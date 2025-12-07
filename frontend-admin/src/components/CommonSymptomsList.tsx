'use client';

/**
 * Common symptoms list component
 * Displays and manages common symptoms with CRUD operations
 */

import { useState } from 'react';
import { CommonSymptom } from '@/src/types/api.types';
import { get, post, put, del } from '@/src/lib/api-client';
import CommonSymptomForm from './CommonSymptomForm';

interface CommonSymptomsListProps {
  initialCommonSymptoms: CommonSymptom[];
}

export default function CommonSymptomsList({ initialCommonSymptoms }: CommonSymptomsListProps) {
  const [commonSymptoms, setCommonSymptoms] = useState<CommonSymptom[]>(initialCommonSymptoms);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSymptom, setEditingSymptom] = useState<CommonSymptom | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = () => {
    setEditingSymptom(null);
    setIsFormOpen(true);
  };

  const handleEdit = (symptom: CommonSymptom) => {
    setEditingSymptom(symptom);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Opravdu chcete smazat tento běžný příznak?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await del(`/common-symptoms/${id}`);
      if (response.success) {
        setCommonSymptoms(commonSymptoms.filter((s) => s.id !== id));
      } else {
        setError(response.error?.message || 'Nepodařilo se smazat běžný příznak');
      }
    } catch (err: any) {
      setError(err.message || 'Nepodařilo se smazat běžný příznak');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (name: string) => {
    setLoading(true);
    setError('');

    try {
      if (editingSymptom) {
        // Update
        const response = await put<CommonSymptom>(
          `/common-symptoms/${editingSymptom.id}`,
          { name },
        );
        if (response.success && response.data) {
          const updatedSymptom = response.data;
          setCommonSymptoms(
            commonSymptoms.map((s) => (s.id === editingSymptom.id ? updatedSymptom : s)),
          );
          setIsFormOpen(false);
          setEditingSymptom(null);
        } else {
          setError(response.error?.message || 'Nepodařilo se aktualizovat běžný příznak');
        }
      } else {
        // Create
        const response = await post<CommonSymptom>('/common-symptoms', {
          name,
        });
        if (response.success && response.data) {
          const newSymptom = response.data;
          setCommonSymptoms([...commonSymptoms, newSymptom]);
          setIsFormOpen(false);
        } else {
          setError(response.error?.message || 'Nepodařilo se vytvořit běžný příznak');
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
          Celkem běžných příznaků: <span className="font-semibold">{commonSymptoms.length}</span>
        </p>
        <button
          onClick={handleCreate}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Přidat běžný příznak
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {isFormOpen && (
        <CommonSymptomForm
          symptom={editingSymptom}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingSymptom(null);
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
            {commonSymptoms.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                  Žádné běžné příznaky
                </td>
              </tr>
            ) : (
              commonSymptoms.map((symptom) => (
                <tr key={symptom.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {symptom.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(symptom.createdAt).toLocaleDateString('cs-CZ')}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(symptom)}
                      className="mr-4 text-blue-600 hover:text-blue-900"
                    >
                      Upravit
                    </button>
                    <button
                      onClick={() => handleDelete(symptom.id)}
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

