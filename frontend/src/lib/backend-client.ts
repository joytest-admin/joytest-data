/**
 * Backend API client
 * Communicates with the Express backend
 */

function getBackendUrl(): string {
  const envUrl = process.env.BACKEND_URL;
  const url = envUrl || 'http://localhost:3001';
  
  if (!url || url.trim() === '') {
    throw new Error('BACKEND_URL environment variable is not set. Please set it in .env.local file.');
  }
  
  const cleanUrl = url.trim().endsWith('/') ? url.trim().slice(0, -1) : url.trim();
  
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    throw new Error(`BACKEND_URL must be a full URL starting with http:// or https://. Current value: "${cleanUrl}"`);
  }
  
  return cleanUrl;
}

/**
 * Make a request to the backend API
 */
async function backendRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const baseUrl = getBackendUrl();
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${normalizedEndpoint}`;
  
  if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    const errorMsg = `Invalid backend URL: "${url}". BACKEND_URL="${process.env.BACKEND_URL || 'undefined'}" must be a full URL (e.g., http://localhost:3001)`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  
  // Merge headers: start with default Content-Type, then add options headers (which may include Authorization, x-link-token, etc.)
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  const headers: Record<string, string> = {
    ...defaultHeaders,
    ...(options.headers as Record<string, string>),
  };
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'An error occurred');
    }

    return data;
  } catch (error: any) {
    if (error.message?.includes('Failed to parse URL') || error.message?.includes('Invalid URL')) {
      throw new Error(`Failed to parse URL: "${url}". Check that BACKEND_URL is set correctly. Current value: "${process.env.BACKEND_URL || 'undefined'}"`);
    }
    throw error;
  }
}

/**
 * GET request to backend
 */
export async function backendGet<T>(
  endpoint: string,
  token?: string,
  extraHeaders: Record<string, string> = {},
): Promise<T> {
  return backendRequest<T>(endpoint, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extraHeaders,
    },
  });
}

/**
 * POST request to backend
 */
export async function backendPost<T>(
  endpoint: string,
  body?: any,
  token?: string,
  extraHeaders: Record<string, string> = {},
): Promise<T> {
  return backendRequest<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extraHeaders,
    },
  });
}

/**
 * PUT request to backend
 */
export async function backendPut<T>(
  endpoint: string,
  body?: any,
  token?: string,
  extraHeaders: Record<string, string> = {},
): Promise<T> {
  return backendRequest<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extraHeaders,
    },
  });
}

/**
 * DELETE request to backend
 */
export async function backendDelete<T>(
  endpoint: string,
  token?: string,
  extraHeaders: Record<string, string> = {},
): Promise<T> {
  return backendRequest<T>(endpoint, {
    method: 'DELETE',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extraHeaders,
    },
  });
}

