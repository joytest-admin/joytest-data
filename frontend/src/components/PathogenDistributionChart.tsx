'use client';

/**
 * Pie chart component for displaying positive pathogen distribution by scope (Me, District, Region, Country)
 * Shows 4 pie charts side-by-side for comparison
 */

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useTranslation } from '@/src/contexts/TranslationContext';
import { getRegions, getCities } from '@/src/lib/api-client';

interface PathogenDistributionChartProps {
  me: Array<{ pathogenName: string; count: number; percentage: number }>;
  district: Array<{ pathogenName: string; count: number; percentage: number }>;
  region: Array<{ pathogenName: string; count: number; percentage: number }>;
  country: Array<{ pathogenName: string; count: number; percentage: number }>;
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

export default function PathogenDistributionChart({
  me,
  district,
  region,
  country,
  regionId,
  onRegionChange,
  cityId,
  onCityChange,
  loading,
}: PathogenDistributionChartProps) {
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

  // Get all unique pathogens across all scopes to maintain consistent colors
  const allPathogens = new Set<string>();
  [me, district, region, country].forEach((scope) => {
    scope.forEach((item) => allPathogens.add(item.pathogenName));
  });
  const sortedPathogens = Array.from(allPathogens).sort();

  // Create color mapping for consistent colors across charts
  const pathogenColorMap = new Map<string, string>();
  sortedPathogens.forEach((pathogen, index) => {
    pathogenColorMap.set(pathogen, COLORS[index % COLORS.length]);
  });

  // Helper function to prepare data for pie chart
  const prepareChartData = (data: Array<{ pathogenName: string; count: number; percentage: number }>) => {
    const total = data.reduce((sum, item) => sum + item.count, 0);
    return data.map((item) => ({
      name: item.pathogenName,
      value: item.count,
      percentage: item.percentage,
      total,
    }));
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            {data.value} {t.pages.testResults.results} ({data.payload.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  // Helper component for a single pie chart
  const SinglePieChart = ({
    title,
    data,
    hasData,
  }: {
    title: string;
    data: Array<{ name: string; value: number; percentage: number }>;
    hasData: boolean;
  }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);

    return (
      <div className="flex flex-col items-center">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">{title}</h4>
        {!hasData || total === 0 ? (
          <div className="flex items-center justify-center h-48 w-full">
            <p className="text-gray-500 text-sm">{t.pages.testResults.charts.noData}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, payload }) => {
                  const percentage = payload?.total > 0 ? ((payload?.value || 0) / payload.total * 100) : 0;
                  return `${name}: ${Math.round(percentage)}%`;
                }}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={pathogenColorMap.get(entry.name) || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="mb-3">
          <h3 className="text-base font-semibold text-gray-900">{t.pages.testResults.charts.pathogenDistribution}</h3>
          <p className="text-xs text-gray-600 mt-1">{t.pages.testResults.charts.comparison}</p>
        </div>

        {/* Geographic filters */}
        <div className="flex items-center gap-4 flex-wrap mb-3">
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
              <option value="">{regionId ? t.pages.testResults.charts.entireRegion : t.pages.testResults.charts.allCzechRepublic}</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-center h-48">
          <p className="text-gray-500 text-sm">{t.pages.testResults.charts.loading}</p>
        </div>
      </div>
    );
  }

  const meData = prepareChartData(me);
  const districtData = prepareChartData(district);
  const regionData = prepareChartData(region);
  const countryData = prepareChartData(country);

  const hasAnyData = me.length > 0 || district.length > 0 || region.length > 0 || country.length > 0;

  if (!hasAnyData) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="mb-3">
          <h3 className="text-base font-semibold text-gray-900">{t.pages.testResults.charts.pathogenDistribution}</h3>
          <p className="text-xs text-gray-600 mt-1">{t.pages.testResults.charts.comparison}</p>
        </div>

        {/* Geographic filters */}
        <div className="flex items-center gap-4 flex-wrap mb-3">
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
              <option value="">{regionId ? t.pages.testResults.charts.entireRegion : t.pages.testResults.charts.allCzechRepublic}</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
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
        <h3 className="text-base font-semibold text-gray-900">{t.pages.testResults.charts.pathogenDistribution}</h3>
        <p className="text-xs text-gray-600 mt-1">{t.pages.testResults.charts.comparison}</p>

        {/* Geographic filters */}
        <div className="flex items-center gap-4 flex-wrap mt-3">
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
              <option value="">{regionId ? t.pages.testResults.charts.entireRegion : t.pages.testResults.charts.allCzechRepublic}</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SinglePieChart title={t.pages.testResults.charts.me} data={meData} hasData={me.length > 0} />
        <SinglePieChart title={t.pages.testResults.charts.country} data={countryData} hasData={country.length > 0} />
        <SinglePieChart title={t.pages.testResults.charts.region} data={regionData} hasData={region.length > 0} />
        <SinglePieChart title={t.pages.testResults.charts.district} data={districtData} hasData={district.length > 0} />
      </div>
    </div>
  );
}

