'use client';

/**
 * Test types list component
 * Displays and manages test types with CRUD operations
 */

import { useState } from 'react';
import { TestType } from '@/src/types/api.types';
import { get, post, put, del } from '@/src/lib/api-client';
import TestTypeForm from './TestTypeForm';

interface TestTypesListProps {
  initialTestTypes: TestType[];
}

export default function TestTypesList({ initialTestTypes }: TestTypesListProps) {
  const [testTypes, setTestTypes] = useState<TestType[]>(initialTestTypes);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTestType, setEditingTestType] = useState<TestType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = () => {
    setEditingTestType(null);
    setIsFormOpen(true);
  };

  const handleEdit = (testType: TestType) => {
    setEditingTestType(testType);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Opravdu chcete smazat tento typ testu?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await del(`/test-types/${id}`);
      if (response.success) {
        setTestTypes(testTypes.filter((tt) => tt.id !== id));
      } else {
        setError(response.error?.message || 'Nepodařilo se smazat typ testu');
      }
    } catch (err: any) {
      setError(err.message || 'Nepodařilo se smazat typ testu');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (name: string, pathogenIds: string[]) => {
    setLoading(true);
    setError('');

    try {
      if (editingTestType) {
        // Update
        const response = await put<TestType>(
          `/test-types/${editingTestType.id}`,
          { name, pathogenIds },
        );
        if (response.success && response.data) {
          const updatedTestType = response.data;
          setTestTypes(
            testTypes.map((tt) => (tt.id === editingTestType.id ? updatedTestType : tt)),
          );
          setIsFormOpen(false);
          setEditingTestType(null);
        } else {
          setError(response.error?.message || 'Nepodařilo se aktualizovat typ testu');
        }
      } else {
        // Create
        const response = await post<TestType>('/test-types', {
          name,
          pathogenIds,
        });
        if (response.success && response.data) {
          const newTestType = response.data;
          setTestTypes([...testTypes, newTestType]);
          setIsFormOpen(false);
        } else {
          setError(response.error?.message || 'Nepodařilo se vytvořit typ testu');
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
          Celkem typů testů: <span className="font-semibold">{testTypes.length}</span>
        </p>
        <button
          onClick={handleCreate}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Přidat typ testu
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {isFormOpen && (
        <TestTypeForm
          testType={editingTestType}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingTestType(null);
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
            {testTypes.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                  Žádné typy testů
                </td>
              </tr>
            ) : (
              testTypes.map((testType) => (
                <tr key={testType.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {testType.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(testType.createdAt).toLocaleDateString('cs-CZ')}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(testType)}
                      className="mr-4 text-blue-600 hover:text-blue-900"
                    >
                      Upravit
                    </button>
                    <button
                      onClick={() => handleDelete(testType.id)}
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

