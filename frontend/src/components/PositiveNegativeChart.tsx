'use client';

/**
 * Pie chart component for displaying positive vs negative test results
 */

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useTranslation } from '@/src/contexts/TranslationContext';

interface PositiveNegativeChartProps {
  positive: number;
  negative: number;
  loading?: boolean;
}

export default function PositiveNegativeChart({ positive, negative, loading }: PositiveNegativeChartProps) {
  const { t } = useTranslation();

  // Prepare data for the chart
  const data = [
    { name: t.pages.testResults.charts.positive, value: positive },
    { name: t.pages.testResults.charts.negative, value: negative },
  ];

  // Colors for the chart segments
  const COLORS = ['#ef4444', '#10b981']; // Red for positive, green for negative

  // Calculate total and percentages
  const total = positive + negative;
  const positivePercentage = total > 0 ? Math.round((positive / total) * 100) : 0;
  const negativePercentage = total > 0 ? Math.round((negative / total) * 100) : 0;

  // Custom label function to show count and percentage
  const renderLabel = (entry: any) => {
    const percentage = entry.name === t.pages.testResults.charts.positive ? positivePercentage : negativePercentage;
    return `${entry.value} (${percentage}%)`;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = data.name === t.pages.testResults.charts.positive ? positivePercentage : negativePercentage;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            {t.pages.testResults.charts.positive === data.name ? positive : negative} {t.pages.testResults.results} ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-2">{t.pages.testResults.charts.positiveNegative}</h3>
        <div className="flex items-center justify-center h-48">
          <p className="text-gray-500 text-sm">{t.pages.testResults.charts.loading}</p>
        </div>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-2">{t.pages.testResults.charts.positiveNegative}</h3>
        <div className="flex items-center justify-center h-48">
          <p className="text-gray-500 text-sm">{t.pages.testResults.charts.noData}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="text-base font-semibold text-gray-900 mb-2">{t.pages.testResults.charts.positiveNegative}</h3>
      <div className="w-full">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              labelLine={false}
              outerRadius={70}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => {
                const entry = data.find((d) => d.name === value);
                if (!entry) return value;
                const percentage = value === t.pages.testResults.charts.positive ? positivePercentage : negativePercentage;
                return `${value}: ${entry.value} (${percentage}%)`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

