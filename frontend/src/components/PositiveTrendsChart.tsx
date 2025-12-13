'use client';

/**
 * Line chart component for displaying positive test result trends over time by pathogens
 */

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTranslation } from '@/src/contexts/TranslationContext';
import { getRegions, getCities } from '@/src/lib/api-client';

interface PositiveTrendsChartProps {
  byPathogen: Array<{ date: string; pathogenName: string; count: number }>;
  total: Array<{ date: string; count: number }>;
  period: 'day' | 'week' | 'month';
  onPeriodChange: (period: 'day' | 'week' | 'month') => void;
  allDoctors: boolean;
  onAllDoctorsChange: (allDoctors: boolean) => void;
  regionId: number | null;
  onRegionChange: (regionId: number | null) => void;
  cityId: number | null;
  onCityChange: (cityId: number | null) => void;
  loading?: boolean;
}

interface Region {
  id: number;
  name: string;
}

interface City {
  id: number;
  name: string;
  district?: {
    id: number;
    name: string;
    regionId: number;
    region?: {
      id: number;
      name: string;
    };
  };
}

export default function PositiveTrendsChart({
  byPathogen,
  total,
  period,
  onPeriodChange,
  allDoctors,
  onAllDoctorsChange,
  regionId,
  onRegionChange,
  cityId,
  onCityChange,
  loading,
}: PositiveTrendsChartProps) {
  const { t } = useTranslation();
  const [regions, setRegions] = useState<Region[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [regionsLoading, setRegionsLoading] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(false);

  // Fetch regions on mount
  useEffect(() => {
    const fetchRegions = async () => {
      setRegionsLoading(true);
      try {
        const data = await getRegions();
        setRegions(data);
      } catch (error) {
        console.error('Error fetching regions:', error);
      } finally {
        setRegionsLoading(false);
      }
    };
    fetchRegions();
  }, []);

  // Fetch cities when region is selected
  useEffect(() => {
    const fetchCities = async () => {
      if (regionId === null) {
        setCities([]);
        return;
      }
      setCitiesLoading(true);
      try {
        // Get all cities and filter by regionId on frontend
        // (Backend doesn't have a direct regionId filter for cities, so we fetch all and filter)
        const allCities = await getCities();
        const filteredCities = allCities
          .filter((city) => city.district?.regionId === regionId)
          .map((city) => ({
            id: city.id,
            name: city.name,
            district: city.district,
          }));
        setCities(filteredCities);
      } catch (error) {
        console.error('Error fetching cities:', error);
      } finally {
        setCitiesLoading(false);
      }
    };
    fetchCities();
  }, [regionId]);

  // Clear city when region changes
  useEffect(() => {
    if (regionId === null) {
      onCityChange(null);
    }
  }, [regionId, onCityChange]);

  // Color palette for different pathogens (same as pathogens chart)
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

  // Get unique dates from both byPathogen and total
  const allDates = new Set<string>();
  byPathogen.forEach((item) => allDates.add(item.date));
  total.forEach((item) => allDates.add(item.date));
  const sortedDates = Array.from(allDates).sort();

  // Get unique pathogens
  const uniquePathogens = Array.from(new Set(byPathogen.map((item) => item.pathogenName)));

  // Transform data for the chart
  // Create an object for each date with all pathogens and total
  const chartData = sortedDates.map((date) => {
    const dataPoint: any = {
      date: formatDate(date, period),
    };

    // Add count for each pathogen
    uniquePathogens.forEach((pathogenName) => {
      const item = byPathogen.find((p) => p.date === date && p.pathogenName === pathogenName);
      dataPoint[pathogenName] = item ? item.count : 0;
    });

    // Add total
    const totalItem = total.find((t) => t.date === date);
    dataPoint[t.pages.testResults.charts.total] = totalItem ? totalItem.count : 0;

    return dataPoint;
  });

  // Format date based on period
  function formatDate(dateString: string, period: 'day' | 'week' | 'month'): string {
    const date = new Date(dateString);
    if (period === 'month') {
      return date.toLocaleDateString('cs-CZ', { month: 'short', year: 'numeric' });
    } else if (period === 'week') {
      return date.toLocaleDateString('cs-CZ', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('cs-CZ', { month: 'short', day: 'numeric' });
    }
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="mb-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900">{t.pages.testResults.charts.positiveTrends}</h3>
            <div className="flex gap-2">
              <button
                onClick={() => onPeriodChange('day')}
                className={`px-3 py-1 text-sm rounded ${
                  period === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {t.pages.testResults.charts.day}
              </button>
              <button
                onClick={() => onPeriodChange('week')}
                className={`px-3 py-1 text-sm rounded ${
                  period === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {t.pages.testResults.charts.week}
              </button>
              <button
                onClick={() => onPeriodChange('month')}
                className={`px-3 py-1 text-sm rounded ${
                  period === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {t.pages.testResults.charts.month}
              </button>
            </div>
          </div>

          {/* Doctor scope toggle */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex gap-2">
              <button
                onClick={() => onAllDoctorsChange(false)}
                className={`px-3 py-1 text-sm rounded ${
                  !allDoctors ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {t.pages.testResults.charts.onlyMine}
              </button>
              <button
                onClick={() => onAllDoctorsChange(true)}
                className={`px-3 py-1 text-sm rounded ${
                  allDoctors ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {t.pages.testResults.charts.allDoctors}
              </button>
            </div>
          </div>

          {/* Geographic filters */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">{t.pages.testResults.charts.region}:</label>
              <select
                value={regionId || ''}
                onChange={(e) => onRegionChange(e.target.value ? parseInt(e.target.value, 10) : null)}
                className="px-3 py-1 text-sm font-medium border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ color: '#000000' }}
                disabled={regionsLoading}
              >
                <option value="">{t.pages.testResults.charts.allCzechRepublic}</option>
                {regions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">{t.pages.testResults.charts.city}:</label>
              <select
                value={cityId || ''}
                onChange={(e) => onCityChange(e.target.value ? parseInt(e.target.value, 10) : null)}
                className="px-3 py-1 text-sm font-medium border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ color: '#000000' }}
                disabled={citiesLoading || regionId === null}
              >
                <option value="">{t.pages.testResults.charts.allCzechRepublic}</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center h-48">
          <p className="text-gray-500 text-sm">{t.pages.testResults.charts.loading}</p>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="mb-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900">{t.pages.testResults.charts.positiveTrends}</h3>
            <div className="flex gap-2">
              <button
                onClick={() => onPeriodChange('day')}
                className={`px-3 py-1 text-sm rounded ${
                  period === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {t.pages.testResults.charts.day}
              </button>
              <button
                onClick={() => onPeriodChange('week')}
                className={`px-3 py-1 text-sm rounded ${
                  period === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {t.pages.testResults.charts.week}
              </button>
              <button
                onClick={() => onPeriodChange('month')}
                className={`px-3 py-1 text-sm rounded ${
                  period === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {t.pages.testResults.charts.month}
              </button>
            </div>
          </div>

          {/* Doctor scope toggle */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex gap-2">
              <button
                onClick={() => onAllDoctorsChange(false)}
                className={`px-3 py-1 text-sm rounded ${
                  !allDoctors ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {t.pages.testResults.charts.onlyMine}
              </button>
              <button
                onClick={() => onAllDoctorsChange(true)}
                className={`px-3 py-1 text-sm rounded ${
                  allDoctors ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {t.pages.testResults.charts.allDoctors}
              </button>
            </div>
          </div>

          {/* Geographic filters */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">{t.pages.testResults.charts.region}:</label>
              <select
                value={regionId || ''}
                onChange={(e) => onRegionChange(e.target.value ? parseInt(e.target.value, 10) : null)}
                className="px-3 py-1 text-sm font-medium border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ color: '#000000' }}
                disabled={regionsLoading}
              >
                <option value="">{t.pages.testResults.charts.allCzechRepublic}</option>
                {regions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">{t.pages.testResults.charts.city}:</label>
              <select
                value={cityId || ''}
                onChange={(e) => onCityChange(e.target.value ? parseInt(e.target.value, 10) : null)}
                className="px-3 py-1 text-sm font-medium border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ color: '#000000' }}
                disabled={citiesLoading || regionId === null}
              >
                <option value="">{t.pages.testResults.charts.allCzechRepublic}</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center h-48">
          <p className="text-gray-500 text-sm">{t.pages.testResults.charts.noData}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="mb-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-900">{t.pages.testResults.charts.positiveTrends}</h3>
          <div className="flex gap-2">
            <button
              onClick={() => onPeriodChange('day')}
              className={`px-3 py-1 text-sm rounded ${
                period === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {t.pages.testResults.charts.day}
            </button>
            <button
              onClick={() => onPeriodChange('week')}
              className={`px-3 py-1 text-sm rounded ${
                period === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {t.pages.testResults.charts.week}
            </button>
            <button
              onClick={() => onPeriodChange('month')}
              className={`px-3 py-1 text-sm rounded ${
                period === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {t.pages.testResults.charts.month}
            </button>
          </div>
        </div>

        {/* Doctor scope toggle */}
        <div className="flex items-center gap-4 mb-3">
          <div className="flex gap-2">
            <button
              onClick={() => onAllDoctorsChange(false)}
              className={`px-3 py-1 text-sm rounded ${
                !allDoctors ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {t.pages.testResults.charts.onlyMine}
            </button>
            <button
              onClick={() => onAllDoctorsChange(true)}
              className={`px-3 py-1 text-sm rounded ${
                allDoctors ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {t.pages.testResults.charts.allDoctors}
            </button>
          </div>
        </div>

        {/* Geographic filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">{t.pages.testResults.charts.region}:</label>
            <select
              value={regionId || ''}
              onChange={(e) => onRegionChange(e.target.value ? parseInt(e.target.value, 10) : null)}
              className="px-3 py-1 text-sm border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ color: '#000000' }}
              disabled={regionsLoading}
            >
              <option value="">{t.pages.testResults.charts.allCzechRepublic}</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">{t.pages.testResults.charts.city}:</label>
            <select
              value={cityId || ''}
              onChange={(e) => onCityChange(e.target.value ? parseInt(e.target.value, 10) : null)}
              className="px-3 py-1 text-sm border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ color: '#000000' }}
              disabled={citiesLoading || regionId === null}
            >
              <option value="">{t.pages.testResults.charts.allCzechRepublic}</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="w-full">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {/* Lines for each pathogen */}
            {uniquePathogens.map((pathogenName, index) => (
              <Line
                key={pathogenName}
                type="monotone"
                dataKey={pathogenName}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                name={pathogenName}
              />
            ))}
            {/* Total line - thicker and dashed */}
            <Line
              type="monotone"
              dataKey={t.pages.testResults.charts.total}
              stroke="#000000"
              strokeWidth={3}
              strokeDasharray="5 5"
              dot={{ r: 4 }}
              name={t.pages.testResults.charts.total}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

