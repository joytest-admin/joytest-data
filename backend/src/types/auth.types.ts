/**
 * Authentication-related type definitions
 */

import { Request } from 'express';

/**
 * User role enum
 */
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

/**
 * User status enum
 */
export enum UserStatus {
  PENDING = 'pending', // Awaiting admin approval
  APPROVED = 'approved', // Active user
  REJECTED = 'rejected', // Denied by admin
}

/**
 * Base user entity (stored in database)
 */
export interface UserEntity {
  id: string;
  email: string;
  role: UserRole;
  passwordHash: string | null; // null if password not required
  icpNumber: string | null; // null for admins, required for users
  cityId: number | null; // City ID (null for admins, required for users)
  uniqueLinkToken: string | null; // unique token for passwordless authentication (only for users without password requirement)
  requirePassword: boolean; // true if user must authenticate with password
  status: UserStatus; // pending, approved, or rejected
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Admin entity (subset of UserEntity with role = ADMIN)
 */
export interface AdminEntity extends Omit<UserEntity, 'icpNumber'> {
  role: UserRole.ADMIN;
  icpNumber: null;
}

/**
 * Regular user entity (subset of UserEntity with role = USER)
 */
export interface RegularUserEntity extends Omit<UserEntity, 'icpNumber'> {
  role: UserRole.USER;
  icpNumber: string;
}

/**
 * JWT payload structure
 */
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

/**
 * Request with authenticated user (after auth middleware)
 */
export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

/**
 * Create admin request (superadmin only)
 */
export interface CreateAdminRequest {
  email: string;
  password: string;
}

/**
 * Update admin request (superadmin only)
 */
export interface UpdateAdminRequest {
  email?: string;
  password?: string;
}

/**
 * Create user request (admin only)
 */
export interface CreateUserRequest {
  email?: string; // required if requirePassword is true
  icpNumber: string;
  cityId: number; // City ID (required)
  requirePassword?: boolean;
  password?: string; // required if requirePassword is true
}

/**
 * Update user request (admin only)
 */
export interface UpdateUserRequest {
  email?: string;
  icpNumber?: string;
  cityId?: number; // City ID
  requirePassword?: boolean;
  password?: string; // required if requirePassword is set to true
}

/**
 * User setup password request (for users who need to set their password)
 */
export interface SetupUserPasswordRequest {
  password: string;
}

/**
 * Login request (for admins and users with password)
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * User identification by ICP request (deprecated - use IdentifyByTokenRequest)
 */
export interface IdentifyByIcpRequest {
  icpNumber: string;
}

/**
 * User identification by unique link token request
 */
export interface IdentifyByTokenRequest {
  token: string;
}

/**
 * Response types
 */
export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
    icpNumber?: string | null;
    cityId?: number | null; // City ID
    requirePassword: boolean;
    status?: UserStatus;
  };
}

export interface UserResponse {
  id: string;
  email: string;
  role: UserRole;
  icpNumber?: string | null;
  cityId?: number | null; // City ID
  cityName?: string | null; // City name (populated when joining with cities)
  uniqueLinkToken?: string | null; // Only included for admins viewing users
  requirePassword: boolean;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Preregistration request (public, no auth required)
 */
export interface PreregisterRequest {
  email?: string; // required if requirePassword is true
  icpNumber: string;
  cityId: number; // City ID (required)
  requirePassword: boolean;
  password?: string; // required if requirePassword is true
}

/**
 * Validate user request (admin only - approve or reject)
 */
export interface ValidateUserRequest {
  status: UserStatus.APPROVED | UserStatus.REJECTED;
}

/**
 * Update doctor profile request (doctor self-service)
 */
export interface UpdateDoctorProfileRequest {
  email?: string;
  cityId?: number; // City ID
  requirePassword?: boolean;
  password?: string;
}

