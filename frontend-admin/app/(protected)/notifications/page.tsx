'use client';

import { useEffect, useState } from 'react';
import { get, post } from '@/src/lib/api-client';
import type { CreateNotificationRequest, NotificationResponse, NotificationType } from '@/src/types/api.types';

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<NotificationType>('info');
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await get<NotificationResponse[]>('/notifications?limit=20&offset=0');
      setItems(res.data || []);
    } catch (e: any) {
      setError(e.message || 'Nepodařilo se načíst notifikace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!message.trim()) {
      setError('Zpráva je povinná');
      return;
    }
    setSaving(true);
    try {
      const payload: CreateNotificationRequest = {
        type,
        message: message.trim(),
      };
      const res = await post<NotificationResponse>('/notifications', payload);
      if (res.success && res.data) {
        setMessage('');
        setType('info');
        // Prepend newly created notification
        setItems((prev) => [res.data as any, ...prev].slice(0, 20));
      }
    } catch (e: any) {
      setError(e.message || 'Nepodařilo se vytvořit notifikaci');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">Notifikace</h1>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-3">Nová notifikace</h2>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Typ</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as NotificationType)}
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="info">Info (modrá)</option>
                <option value="warning">Varování (žlutá)</option>
                <option value="error">Chyba (červená)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zpráva</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Napište krátkou zprávu pro doktory…"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Ukládám…' : 'Publikovat'}
              </button>
              <button
                type="button"
                onClick={load}
                disabled={loading}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Načítám…' : 'Obnovit'}
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Poslední notifikace</h2>
            <span className="text-sm text-gray-500">{items.length}</span>
          </div>

          {loading ? (
            <div className="p-4 text-sm text-gray-500">Načítání…</div>
          ) : items.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">Žádné notifikace</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {items.map((n) => (
                <li key={n.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs text-gray-500 mb-1">
                        {new Date(n.createdAt).toLocaleString('cs-CZ')} • {n.type}
                      </div>
                      <div className="text-sm text-gray-900 break-words">{n.message}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
    </div>
  );
}

