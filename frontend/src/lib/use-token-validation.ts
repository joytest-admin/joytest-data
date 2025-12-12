/**
 * Client-side hook for validating link tokens
 * Redirects to login if token is invalid
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from './api-client';
import { ApiResponse, IdentifyResponse, IdentifyByTokenRequest } from '@/src/types/api.types';

/**
 * Hook to validate link token and redirect if invalid
 * @param linkToken - Link token to validate
 * @param skipValidation - Skip validation if true (e.g., if JWT token exists)
 */
export function useTokenValidation(linkToken: string | null, skipValidation: boolean = false) {
  const router = useRouter();

  useEffect(() => {
    // Skip validation if no token or if explicitly skipped
    if (!linkToken || skipValidation) {
      return;
    }

    // Validate token
    const validateToken = async () => {
      try {
        const response = await apiPost<ApiResponse<IdentifyResponse>>('/auth/identify-by-token', {
          token: linkToken,
        } as IdentifyByTokenRequest);

        if (!response.success || !response.data) {
          // Invalid token - redirect to login
          router.replace('/login?error=invalid_token');
        }
        // Token is valid - no action needed
      } catch (error: any) {
        // Check error message to determine specific issue
        const errorMessage = error.message || '';
        if (errorMessage.includes('schválení') || errorMessage.includes('pending') || errorMessage.includes('rejected')) {
          router.replace('/login?error=account_pending');
        } else if (errorMessage.includes('hesla') || errorMessage.includes('password')) {
          router.replace('/login?error=password_required');
        } else {
          router.replace('/login?error=invalid_token');
        }
      }
    };

    validateToken();
  }, [linkToken, skipValidation, router]);
}

