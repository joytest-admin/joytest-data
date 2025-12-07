/**
 * Next.js API client
 * Communicates with Next.js API routes (which then call the backend)
 */

function getApiBaseUrl(): string {
  // Server-side: construct absolute URL
  if (typeof window === 'undefined') {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                    'http://localhost:3000';
    return baseUrl;
  }
  
  // Client-side: use relative URL
  return '/api';
}

/**
 * Make a request to Next.js API routes
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${normalizedEndpoint}`;
  
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Include cookies
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'An error occurred');
  }

  return data;
}

/**
 * GET request to API
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'GET',
  });
}

/**
 * POST request to API
 */
export async function apiPost<T>(endpoint: string, body?: any): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * PUT request to API
 */
export async function apiPut<T>(endpoint: string, body?: any): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/**
 * DELETE request to API
 */
export async function apiDelete<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'DELETE',
  });
}

/**
 * Geography API functions
 */
import type {
  RegionResponse,
  DistrictResponse,
  CityResponse,
} from '@/src/types/api.types';
import type { ApiResponse } from '@/src/types/api.types';

/**
 * Get all regions
 */
export async function getRegions(search?: string): Promise<RegionResponse[]> {
  const query = search ? `?q=${encodeURIComponent(search)}` : '';
  const response = await apiGet<ApiResponse<RegionResponse[]>>(`/geography/regions${query}`);
  return response.data || [];
}

/**
 * Get region by ID
 */
export async function getRegionById(id: number): Promise<RegionResponse | null> {
  try {
    const response = await apiGet<ApiResponse<RegionResponse>>(`/geography/regions/${id}`);
    return response.data || null;
  } catch {
    return null;
  }
}

/**
 * Get all districts, optionally filtered by region
 */
export async function getDistricts(regionId?: number, search?: string): Promise<DistrictResponse[]> {
  const params = new URLSearchParams();
  if (regionId !== undefined) {
    params.append('regionId', regionId.toString());
  }
  if (search) {
    params.append('q', search);
  }
  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await apiGet<ApiResponse<DistrictResponse[]>>(`/geography/districts${query}`);
  return response.data || [];
}

/**
 * Get district by ID
 */
export async function getDistrictById(id: number): Promise<DistrictResponse | null> {
  try {
    const response = await apiGet<ApiResponse<DistrictResponse>>(`/geography/districts/${id}`);
    return response.data || null;
  } catch {
    return null;
  }
}

/**
 * Get all cities, optionally filtered by district
 */
export async function getCities(districtId?: number, search?: string): Promise<CityResponse[]> {
  const params = new URLSearchParams();
  if (districtId !== undefined) {
    params.append('districtId', districtId.toString());
  }
  if (search) {
    params.append('q', search);
  }
  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await apiGet<ApiResponse<CityResponse[]>>(`/geography/cities${query}`);
  return response.data || [];
}

/**
 * Get city by ID
 */
export async function getCityById(id: number): Promise<CityResponse | null> {
  try {
    const response = await apiGet<ApiResponse<CityResponse>>(`/geography/cities/${id}`);
    return response.data || null;
  } catch {
    return null;
  }
}


/**
 * Get positive and negative test result statistics
 * @param filters - Filter options (search, city, startDate, endDate)
 * @param linkToken - Optional unique link token for authentication
 * @returns Statistics with positive and negative counts
 */
export async function getPositiveNegativeStatistics(
  filters: {
    search?: string;
    city?: string;
    startDate?: string;
    endDate?: string;
  } = {},
  linkToken?: string | null,
): Promise<{ positive: number; negative: number }> {
  const params = new URLSearchParams();
  if (filters.search?.trim()) {
    params.append('search', filters.search.trim());
  }
  if (filters.city?.trim()) {
    params.append('city', filters.city.trim());
  }
  if (filters.startDate) {
    params.append('startDate', new Date(filters.startDate).toISOString());
  }
  if (filters.endDate) {
    params.append('endDate', new Date(filters.endDate + 'T23:59:59').toISOString());
  }
  if (linkToken) {
    params.append('token', linkToken);
  }

  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await apiGet<ApiResponse<{ positive: number; negative: number }>>(
    `/test-results/my/statistics/positive-negative${query}`,
  );
  return response.data || { positive: 0, negative: 0 };
}

/**
 * Get positive test result statistics by age groups
 * @param filters - Filter options (search, city, startDate, endDate)
 * @param linkToken - Optional unique link token for authentication
 * @returns Statistics with positive test counts by age groups
 */
export async function getPositiveByAgeGroupsStatistics(
  filters: {
    search?: string;
    city?: string;
    startDate?: string;
    endDate?: string;
  } = {},
  linkToken?: string | null,
): Promise<{
  age0to5: number;
  age6to14: number;
  age15to24: number;
  age25to64: number;
  age65plus: number;
}> {
  const params = new URLSearchParams();
  if (filters.search?.trim()) {
    params.append('search', filters.search.trim());
  }
  if (filters.city?.trim()) {
    params.append('city', filters.city.trim());
  }
  if (filters.startDate) {
    params.append('startDate', new Date(filters.startDate).toISOString());
  }
  if (filters.endDate) {
    params.append('endDate', new Date(filters.endDate + 'T23:59:59').toISOString());
  }
  if (linkToken) {
    params.append('token', linkToken);
  }

  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await apiGet<ApiResponse<{ age0to5: number; age6to14: number; age15to24: number; age25to64: number; age65plus: number }>>(
    `/test-results/my/statistics/positive-by-age-groups${query}`,
  );
  return response.data || { age0to5: 0, age6to14: 0, age15to24: 0, age25to64: 0, age65plus: 0 };
}

/**
 * Get positive test result statistics grouped by pathogen
 * @param filters - Filter options (search, city, startDate, endDate)
 * @param linkToken - Optional unique link token for authentication
 * @returns Array of objects with pathogen name and count
 */
export async function getPositiveByPathogensStatistics(
  filters: {
    search?: string;
    city?: string;
    startDate?: string;
    endDate?: string;
  } = {},
  linkToken?: string | null,
): Promise<Array<{ pathogenName: string; count: number }>> {
  const params = new URLSearchParams();
  if (filters.search?.trim()) {
    params.append('search', filters.search.trim());
  }
  if (filters.city?.trim()) {
    params.append('city', filters.city.trim());
  }
  if (filters.startDate) {
    params.append('startDate', new Date(filters.startDate).toISOString());
  }
  if (filters.endDate) {
    params.append('endDate', new Date(filters.endDate + 'T23:59:59').toISOString());
  }
  if (linkToken) {
    params.append('token', linkToken);
  }

  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await apiGet<ApiResponse<Array<{ pathogenName: string; count: number }>>>(
    `/test-results/my/statistics/positive-by-pathogens${query}`,
  );
  return response.data || [];
}

/**
 * Get positive test result trends over time grouped by pathogen
 * @param filters - Filter options (search, city, allDoctors, regionId, cityId, startDate, endDate, period)
 * @param linkToken - Optional unique link token for authentication
 * @returns Object with byPathogen array and total array
 */
export async function getPositiveTrendsByPathogensStatistics(
  filters: {
    search?: string;
    city?: string;
    allDoctors?: boolean;
    regionId?: number | null;
    cityId?: number | null;
    startDate?: string;
    endDate?: string;
    period?: 'day' | 'week' | 'month';
  } = {},
  linkToken?: string | null,
): Promise<{
  byPathogen: Array<{ date: string; pathogenName: string; count: number }>;
  total: Array<{ date: string; count: number }>;
}> {
  const params = new URLSearchParams();
  if (filters.search?.trim()) {
    params.append('search', filters.search.trim());
  }
  if (filters.city?.trim()) {
    params.append('city', filters.city.trim());
  }
  if (filters.allDoctors) {
    params.append('allDoctors', 'true');
  }
  if (filters.regionId !== undefined && filters.regionId !== null) {
    params.append('regionId', filters.regionId.toString());
  }
  if (filters.cityId !== undefined && filters.cityId !== null) {
    params.append('cityId', filters.cityId.toString());
  }
  if (filters.startDate) {
    params.append('startDate', new Date(filters.startDate).toISOString());
  }
  if (filters.endDate) {
    params.append('endDate', new Date(filters.endDate + 'T23:59:59').toISOString());
  }
  if (filters.period) {
    params.append('period', filters.period);
  }
  if (linkToken) {
    params.append('token', linkToken);
  }

  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await apiGet<ApiResponse<{ byPathogen: Array<{ date: string; pathogenName: string; count: number }>; total: Array<{ date: string; count: number }> }>>(
    `/test-results/my/statistics/positive-trends-by-pathogens${query}`,
  );
  return response.data || { byPathogen: [], total: [] };
}

/**
 * Get positive pathogens by age groups (all doctors)
 * @param filters - Filter options (search, city, regionId, cityId, startDate, endDate)
 * @param linkToken - Optional unique link token for authentication
 * @returns Array of objects with pathogen name, age group, and count
 */
export async function getPathogensByAgeGroupsStatistics(
  filters: {
    search?: string;
    city?: string;
    regionId?: number | null;
    cityId?: number | null;
    startDate?: string;
    endDate?: string;
  } = {},
  linkToken?: string | null,
): Promise<Array<{ pathogenName: string; ageGroup: string; count: number }>> {
  const params = new URLSearchParams();
  if (filters.search) {
    params.append('search', filters.search);
  }
  if (filters.city) {
    params.append('city', filters.city);
  }
  if (filters.regionId !== undefined && filters.regionId !== null) {
    params.append('regionId', filters.regionId.toString());
  }
  if (filters.cityId !== undefined && filters.cityId !== null) {
    params.append('cityId', filters.cityId.toString());
  }
  if (filters.startDate) {
    params.append('startDate', new Date(filters.startDate).toISOString());
  }
  if (filters.endDate) {
    params.append('endDate', new Date(filters.endDate + 'T23:59:59').toISOString());
  }
  if (linkToken) {
    params.append('token', linkToken);
  }

  const response = await fetch(`/api/test-results/my/statistics/pathogens-by-age-groups?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch pathogens by age groups statistics');
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error?.message || 'Failed to fetch pathogens by age groups statistics');
  }

  return result.data;
}

/**
 * Get positive pathogen distribution by scope (Me, District, Region, Country)
 * @param filters - Filter options (startDate, endDate, regionId, cityId)
 * @param linkToken - Optional unique link token for authentication
 * @returns Object with pathogen distributions for each scope level
 */
export async function getPathogenDistributionByScope(
  filters: {
    startDate?: string;
    endDate?: string;
    regionId?: number | null;
    cityId?: number | null;
  } = {},
  linkToken?: string | null,
): Promise<{
  me: Array<{ pathogenName: string; count: number; percentage: number }>;
  district: Array<{ pathogenName: string; count: number; percentage: number }>;
  region: Array<{ pathogenName: string; count: number; percentage: number }>;
  country: Array<{ pathogenName: string; count: number; percentage: number }>;
}> {
  const params = new URLSearchParams();
  if (filters.startDate) {
    params.append('startDate', new Date(filters.startDate).toISOString());
  }
  if (filters.endDate) {
    params.append('endDate', new Date(filters.endDate + 'T23:59:59').toISOString());
  }
  if (filters.regionId !== undefined && filters.regionId !== null) {
    params.append('regionId', filters.regionId.toString());
  }
  if (filters.cityId !== undefined && filters.cityId !== null) {
    params.append('cityId', filters.cityId.toString());
  }
  if (linkToken) {
    params.append('token', linkToken);
  }

  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await apiGet<ApiResponse<{
    me: Array<{ pathogenName: string; count: number; percentage: number }>;
    district: Array<{ pathogenName: string; count: number; percentage: number }>;
    region: Array<{ pathogenName: string; count: number; percentage: number }>;
    country: Array<{ pathogenName: string; count: number; percentage: number }>;
  }>>(`/test-results/my/statistics/pathogen-distribution-by-scope${query}`);
  return response.data || { me: [], district: [], region: [], country: [] };
}

