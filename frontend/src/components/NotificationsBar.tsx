'use client';

/**
 * Notifications bar (doctor)
 * Shows up to N latest undismissed admin notifications, supports dismiss with X.
 */

import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost } from '@/src/lib/api-client';
import type { ApiResponse, NotificationResponse } from '@/src/types/api.types';

interface NotificationsBarProps {
  linkToken: string | null;
  limit?: number;
}

function typeToClasses(type: NotificationResponse['type']): { container: string; icon: string } {
  switch (type) {
    case 'warning':
      return {
        container: 'border-yellow-200 bg-yellow-50 text-yellow-900',
        icon: 'text-yellow-700',
      };
    case 'error':
      return {
        container: 'border-red-200 bg-red-50 text-red-900',
        icon: 'text-red-700',
      };
    case 'info':
    default:
      return {
        container: 'border-blue-200 bg-blue-50 text-blue-900',
        icon: 'text-blue-700',
      };
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('cs-CZ', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export default function NotificationsBar({ linkToken, limit = 3 }: NotificationsBarProps) {
  const [items, setItems] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.append('limit', String(limit));
    if (linkToken) params.append('token', linkToken);
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  }, [limit, linkToken]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiGet<ApiResponse<NotificationResponse[]>>(`/notifications/my${query}`);
        if (!cancelled) {
          setItems(res.success && res.data ? res.data : []);
        }
      } catch {
        // Fail silently: notifications should not block the app
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [query]);

  const dismiss = async (id: string) => {
    // Optimistic UI: remove immediately
    setItems((prev) => prev.filter((n) => n.id !== id));
    try {
      await apiPost<ApiResponse>(`/notifications/${id}/dismiss${linkToken ? `?token=${encodeURIComponent(linkToken)}` : ''}`);
    } catch {
      // If it fails, best-effort: refetch would be nicer, but keep minimal.
    }
  };

  if (loading && items.length === 0) return null;
  if (!items || items.length === 0) return null;

  return (
    <div className="mx-auto px-3 sm:px-4 lg:px-6 pb-3">
      <div className="space-y-2">
        {items.map((n) => {
          const cls = typeToClasses(n.type);
          return (
            <div
              key={n.id}
              className={`border rounded-md px-3 py-2 flex items-start justify-between gap-3 ${cls.container}`}
            >
              <div className="min-w-0">
                <div className="text-xs opacity-80 mb-0.5">{formatDate(n.createdAt)}</div>
                <div className="text-sm break-words">{n.message}</div>
              </div>
              <button
                type="button"
                onClick={() => dismiss(n.id)}
                className={`flex-shrink-0 rounded-md px-2 py-1 hover:bg-white/50 ${cls.icon}`}
                aria-label="Dismiss notification"
                title="Skrýt"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

