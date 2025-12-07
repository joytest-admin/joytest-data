/**
 * Pathogen-related type definitions
 */

/**
 * Pathogen entity (stored in database)
 */
export interface PathogenEntity {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create pathogen request (admin only)
 */
export interface CreatePathogenRequest {
  name: string;
}

/**
 * Update pathogen request (admin only)
 */
export interface UpdatePathogenRequest {
  name?: string;
}

/**
 * Response types
 */
export interface PathogenResponse {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

