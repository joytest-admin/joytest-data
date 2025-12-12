'use client';

/**
 * Grouped bar chart component for displaying positive pathogens by age groups
 * Shows data from all doctors
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useTranslation } from '@/src/contexts/TranslationContext';
import { PathogensByAgeGroupsStats } from '@/src/types/api.types';

interface PathogensByAgeGroupsChartProps {
  data: Array<PathogensByAgeGroupsStats>;
  loading?: boolean;
}

export default function PathogensByAgeGroupsChart({ data, loading }: PathogensByAgeGroupsChartProps) {
  const { t } = useTranslation();

  // Color palette for different pathogens (same as other charts)
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

  // Age group order
  const ageGroupOrder = ['0-5', '6-14', '15-24', '25-64', '65+'];
  const ageGroupLabels: Record<string, string> = {
    '0-5': t.pages.testResults.charts.age0to5,
    '6-14': t.pages.testResults.charts.age6to14,
    '15-24': t.pages.testResults.charts.age15to24,
    '25-64': t.pages.testResults.charts.age25to64,
    '65+': t.pages.testResults.charts.age65plus,
  };

  // Get all unique pathogens
  const pathogens = Array.from(new Set(data.map((item) => item.pathogenName))).sort();

  // Transform data for grouped bar chart
  // Structure: [{ ageGroup: '0-5', 'Pathogen1': count1, 'Pathogen2': count2, ... }, ...]
  const chartData = ageGroupOrder.map((ageGroup) => {
    const row: Record<string, string | number> = { ageGroup: ageGroupLabels[ageGroup] };
    pathogens.forEach((pathogen) => {
      const item = data.find((d) => d.ageGroup === ageGroup && d.pathogenName === pathogen);
      row[pathogen] = item ? item.count : 0;
    });
    return row;
  });

  // Calculate total for percentage calculation
  const total = data.reduce((sum, item) => sum + item.count, 0);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => {
            if (entry.value === 0) return null;
            const percentage = total > 0 ? Math.round((entry.value / total) * 100) : 0;
            return (
              <p key={index} className="text-sm text-gray-600" style={{ color: entry.color }}>
                {entry.name}: {entry.value} {t.pages.testResults.results} ({percentage}%)
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-2">{t.pages.testResults.charts.pathogensByAgeGroups}</h3>
        <div className="flex items-center justify-center h-48">
          <p className="text-gray-500 text-sm">{t.pages.testResults.charts.loading}</p>
        </div>
      </div>
    );
  }

  if (data.length === 0 || total === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-2">{t.pages.testResults.charts.pathogensByAgeGroups}</h3>
        <div className="flex items-center justify-center h-48">
          <p className="text-gray-500 text-sm">{t.pages.testResults.charts.noData}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="text-base font-semibold text-gray-900 mb-2">{t.pages.testResults.charts.pathogensByAgeGroups}</h3>
      <div className="w-full">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="ageGroup" angle={-45} textAnchor="end" height={60} />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {pathogens.map((pathogen, index) => (
              <Bar key={pathogen} dataKey={pathogen} name={pathogen} fill={COLORS[index % COLORS.length]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

