'use client';

/**
 * Bar chart component for displaying positive test results by age groups
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTranslation } from '@/src/contexts/TranslationContext';

interface PositiveByAgeGroupsChartProps {
  age0to5: number;
  age6to14: number;
  age15to24: number;
  age25to64: number;
  age65plus: number;
  loading?: boolean;
}

export default function PositiveByAgeGroupsChart({
  age0to5,
  age6to14,
  age15to24,
  age25to64,
  age65plus,
  loading,
}: PositiveByAgeGroupsChartProps) {
  const { t } = useTranslation();

  // Color palette for different age groups
  const COLORS = [
    '#3b82f6', // Blue - 0-5
    '#8b5cf6', // Purple - 6-14
    '#ec4899', // Pink - 15-24
    '#f59e0b', // Amber - 25-64
    '#ef4444', // Red - 65+
  ];

  // Prepare data for the chart
  const data = [
    { name: t.pages.testResults.charts.age0to5, value: age0to5 },
    { name: t.pages.testResults.charts.age6to14, value: age6to14 },
    { name: t.pages.testResults.charts.age15to24, value: age15to24 },
    { name: t.pages.testResults.charts.age25to64, value: age25to64 },
    { name: t.pages.testResults.charts.age65plus, value: age65plus },
  ];

  // Calculate total
  const total = age0to5 + age6to14 + age15to24 + age25to64 + age65plus;

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
        <h3 className="text-base font-semibold text-gray-900 mb-2">{t.pages.testResults.charts.positiveByAgeGroups}</h3>
        <div className="flex items-center justify-center h-48">
          <p className="text-gray-500 text-sm">{t.pages.testResults.charts.loading}</p>
        </div>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-2">{t.pages.testResults.charts.positiveByAgeGroups}</h3>
        <div className="flex items-center justify-center h-48">
          <p className="text-gray-500 text-sm">{t.pages.testResults.charts.noData}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="text-base font-semibold text-gray-900 mb-2">{t.pages.testResults.charts.positiveByAgeGroups}</h3>
      <div className="w-full">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
            <YAxis 
              tickFormatter={(value) => Math.round(value).toString()}
              domain={[0, 'dataMax']}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" name={t.pages.testResults.charts.positive}>
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

