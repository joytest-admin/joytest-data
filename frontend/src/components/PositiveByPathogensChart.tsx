'use client';

/**
 * Bar chart component for displaying positive test results by pathogens
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useTranslation } from '@/src/contexts/TranslationContext';

interface PositiveByPathogensChartProps {
  data: Array<{ pathogenName: string; count: number }>;
  loading?: boolean;
}

export default function PositiveByPathogensChart({ data, loading }: PositiveByPathogensChartProps) {
  const { t } = useTranslation();

  // Color palette for different pathogens
  const COLORS = [
    '#3b82f6', // Blue
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#f59e0b', // Amber
    '#10b981', // Green
    '#ef4444', // Red
    '#06b6d4', // Cyan
    '#f97316', // Orange
    '#6366f1', // Indigo
    '#14b8a6', // Teal
  ];

  // Calculate total
  const total = data.reduce((sum, item) => sum + item.count, 0);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = total > 0 ? Math.round((data.value / total) * 100) : 0;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            {data.value} {t.pages.testResults.results} ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.pages.testResults.charts.positiveByPathogens}</h3>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">{t.pages.testResults.charts.loading}</p>
        </div>
      </div>
    );
  }

  if (data.length === 0 || total === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.pages.testResults.charts.positiveByPathogens}</h3>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">{t.pages.testResults.charts.noData}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.pages.testResults.charts.positiveByPathogens}</h3>
      <div className="w-full">
        <ResponsiveContainer width="100%" height={Math.max(300, data.length * 50)}>
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="pathogenName" type="category" width={90} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="count" name={t.pages.testResults.charts.positive}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

