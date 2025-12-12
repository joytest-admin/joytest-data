/**
 * Token validation utility
 * Validates link tokens server-side before allowing access
 */

import { backendPost } from './backend-client';
import { ApiResponse, IdentifyResponse, IdentifyByTokenRequest } from '@/src/types/api.types';

/**
 * Validate a link token
 * @param token - Link token to validate
 * @returns Object with validation result and optional error message
 */
export async function validateLinkToken(token: string): Promise<{ 
  valid: boolean; 
  error?: string;
  user?: IdentifyResponse;
}> {
  try {
    const response = await backendPost<ApiResponse<IdentifyResponse>>(
      '/api/auth/identify-by-token',
      { token } as IdentifyByTokenRequest,
    );

    if (response.success && response.data) {
      // Backend already validates:
      // - Token exists
      // - User is APPROVED
      // - User doesn't require password
      return { valid: true, user: response.data };
    }

    return { valid: false, error: 'invalid_token' };
  } catch (error: any) {
    // Check error message to determine specific issue
    const errorMessage = error.message || '';
    if (errorMessage.includes('schválení') || errorMessage.includes('pending') || errorMessage.includes('rejected')) {
      return { valid: false, error: 'account_pending' };
    }
    if (errorMessage.includes('hesla') || errorMessage.includes('password')) {
      return { valid: false, error: 'password_required' };
    }
    return { valid: false, error: 'invalid_token' };
  }
}

