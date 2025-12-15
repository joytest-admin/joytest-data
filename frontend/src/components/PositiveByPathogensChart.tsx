'use client';

/**
 * Pie chart component for displaying positive test results by pathogens
 */

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
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

  // Prepare data for the chart
  const chartData = data.map((item) => ({
    name: item.pathogenName,
    value: item.count,
  }));

  // Calculate total
  const total = data.reduce((sum, item) => sum + item.count, 0);

  // Custom label function to show count and percentage
  const renderLabel = (entry: any) => {
    const percentage = total > 0 ? Math.round((entry.value / total) * 100) : 0;
    return `${entry.value} (${percentage}%)`;
  };

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
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-2">{t.pages.testResults.charts.positiveByPathogens}</h3>
        <div className="flex items-center justify-center h-48">
          <p className="text-gray-500 text-sm">{t.pages.testResults.charts.loading}</p>
        </div>
      </div>
    );
  }

  if (data.length === 0 || total === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-2">{t.pages.testResults.charts.positiveByPathogens}</h3>
        <div className="flex items-center justify-center h-48">
          <p className="text-gray-500 text-sm">{t.pages.testResults.charts.noData}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="text-base font-semibold text-gray-900 mb-2">{t.pages.testResults.charts.positiveByPathogens}</h3>
      <div className="w-full">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <Pie
              data={chartData}
              cx="50%"
              cy="45%"
              labelLine={false}
              outerRadius={70}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              wrapperStyle={{ fontSize: '12px' }}
              formatter={(value) => {
                const entry = chartData.find((d) => d.name === value);
                if (!entry) return value;
                const percentage = total > 0 ? Math.round((entry.value / total) * 100) : 0;
                return `${value}: ${entry.value} (${percentage}%)`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

