/**
 * Backend API client
 * Communicates with the Express backend
 */

function getBackendUrl(): string {
  // Try to get from environment variable, with fallback
  const envUrl = process.env.BACKEND_URL;
  const url = envUrl || 'http://localhost:3001';
  
  // Validate that we have a proper URL
  if (!url || url.trim() === '') {
    throw new Error('BACKEND_URL environment variable is not set. Please set it in .env.local file.');
  }
  
  // Ensure URL doesn't end with a slash
  const cleanUrl = url.trim().endsWith('/') ? url.trim().slice(0, -1) : url.trim();
  
  // Ensure it's a valid absolute URL
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
  // Ensure endpoint starts with a slash
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${normalizedEndpoint}`;
  
  // Validate URL before making request
  if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    const errorMsg = `Invalid backend URL: "${url}". BACKEND_URL="${process.env.BACKEND_URL || 'undefined'}" must be a full URL (e.g., http://localhost:3001)`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  
  // Merge headers properly - Authorization should come from options.headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  
  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[backend-client] Making request to: ${url}`);
    console.log(`[backend-client] Method: ${options.method || 'GET'}`);
    console.log(`[backend-client] Headers:`, JSON.stringify(headers, null, 2));
    const authHeader = headers.Authorization || headers.authorization;
    console.log(`[backend-client] Authorization header: ${authHeader ? 'Present' : 'Missing'}${authHeader ? ` (${authHeader.substring(0, 20)}...)` : ''}`);
  }
  
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
    // If it's a URL parsing error, provide more context
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
): Promise<T> {
  return backendRequest<T>(endpoint, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

/**
 * POST request to backend
 */
export async function backendPost<T>(
  endpoint: string,
  body?: any,
  token?: string,
): Promise<T> {
  return backendRequest<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

/**
 * PUT request to backend
 */
export async function backendPut<T>(
  endpoint: string,
  body?: any,
  token?: string,
): Promise<T> {
  return backendRequest<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

/**
 * DELETE request to backend
 */
export async function backendDelete<T>(
  endpoint: string,
  token?: string,
): Promise<T> {
  return backendRequest<T>(endpoint, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

