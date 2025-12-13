/**
 * JWT token utilities
 * Decodes JWT tokens to extract user information (without verification)
 * Note: Token verification is done by the backend. This utility only decodes the payload.
 */

/**
 * Decode JWT token payload without verification
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export function decodeToken(token: string): { userId: string; email: string; role: string } | null {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    
    // Base64URL decode
    // Replace URL-safe characters and add padding if needed
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    
    // Decode from base64
    const decoded = Buffer.from(padded, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded);
    
    return {
      userId: parsed.userId || parsed.sub || '',
      email: parsed.email || '',
      role: parsed.role || '',
    };
  } catch (error) {
    return null;
  }
}

/**
 * Check if token is valid (can be decoded)
 * @param token - JWT token string
 * @returns True if token can be decoded, false otherwise
 */
export function isValidToken(token: string): boolean {
  return decodeToken(token) !== null;
}

/**
 * Check if token belongs to an admin user
 * @param token - JWT token string
 * @returns True if user is admin, false otherwise (returns false for invalid tokens)
 */
export function isAdminToken(token: string): boolean {
  const payload = decodeToken(token);
  return payload?.role === 'admin';
}

