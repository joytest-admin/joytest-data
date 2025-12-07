/**
 * API client utility
 * Handles communication with Next.js API routes
 */

import { ApiResponse } from '@/src/types/api.types';

const API_BASE = '/api';

/**
 * Get the base URL for API requests
 * In server-side context, we need an absolute URL
 * In client-side context, relative URLs work fine
 */
function getApiBaseUrl(): string {
  // Check if we're in a server-side context (Node.js)
  if (typeof window === 'undefined') {
    // Server-side: use absolute URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL 
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || 'http://localhost:3000';
    return `${appUrl}${API_BASE}`;
  }
  // Client-side: use relative URL
  return API_BASE;
}

/**
 * Make a request to an API route
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  // Ensure endpoint starts with a slash
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  // Get the appropriate base URL (absolute for server, relative for client)
  const baseUrl = getApiBaseUrl();
  // Ensure base URL doesn't end with a slash
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const url = `${cleanBase}${normalizedEndpoint}`;
  
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Include cookies in the request
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'An error occurred');
  }

  return data;
}

/**
 * GET request
 */
export async function get<T>(endpoint: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { method: 'GET' });
}

/**
 * POST request
 */
export async function post<T>(
  endpoint: string,
  body?: any,
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * PUT request
 */
export async function put<T>(
  endpoint: string,
  body?: any,
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/**
 * DELETE request
 */
export async function del<T>(endpoint: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { method: 'DELETE' });
}

/**
 * Geography API functions
 */
import type {
  RegionResponse,
  DistrictResponse,
  CityResponse,
} from '@/src/types/api.types';

/**
 * Get all cities, optionally filtered by district or search query
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
  const response = await get<CityResponse[]>(`/geography/cities${query}`);
  return response.data || [];
}

/**
 * Get city by ID
 */
export async function getCityById(id: number): Promise<CityResponse | null> {
  try {
    const response = await get<CityResponse>(`/geography/cities/${id}`);
    return response.data || null;
  } catch {
    return null;
  }
}

