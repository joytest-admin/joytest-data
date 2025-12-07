/**
 * Authentication service
 * Contains business logic for authentication operations
 */

import crypto from 'crypto';
import {
  CreateAdminRequest,
  UpdateAdminRequest,
  CreateUserRequest,
  UpdateUserRequest,
  SetupUserPasswordRequest,
  LoginRequest,
  IdentifyByIcpRequest,
  IdentifyByTokenRequest,
  PreregisterRequest,
  ValidateUserRequest,
  UpdateDoctorProfileRequest,
  AuthResponse,
  UserResponse,
  UserRole,
  UserStatus,
} from '../types/auth.types';
import {
  findUserByEmail,
  findUserById,
  findUserByIcpNumber,
  findUserByUniqueLinkToken,
  createUser,
  updateUser,
  deleteUser,
  findAllAdmins,
  findAllUsers,
  findPendingUsers,
  emailExists,
  icpNumberExists,
} from '../queries/user.queries';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
} from '../utils/errors';

/**
 * Create a new admin (superadmin only)
 * @param data - Admin creation data
 * @returns Created admin response
 */
export const createAdmin = async (data: CreateAdminRequest): Promise<UserResponse> => {
  // Validate email doesn't exist
  if (await emailExists(data.email)) {
    throw new ConflictError('Email already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(data.password);

  // Create admin user
  const admin = await createUser(
    data.email,
    UserRole.ADMIN,
    passwordHash,
    null, // ICP number is null for admins
    null, // cityId is null for admins
    true, // Admins always require password
  );

  return {
    id: admin.id,
    email: admin.email,
    role: admin.role,
    cityId: null, // Admins don't have city
    requirePassword: admin.requirePassword,
    status: admin.status,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
  };
};

/**
 * Update an admin (superadmin only)
 * @param adminId - Admin ID to update
 * @param data - Admin update data
 * @returns Updated admin response
 */
export const updateAdmin = async (
  adminId: string,
  data: UpdateAdminRequest,
): Promise<UserResponse> => {
  // Check if admin exists
  const existingAdmin = await findUserById(adminId);
  if (!existingAdmin) {
    throw new NotFoundError('Admin not found');
  }

  if (existingAdmin.role !== UserRole.ADMIN) {
    throw new BadRequestError('User is not an admin');
  }

  // Check email uniqueness if updating email
  if (data.email && data.email !== existingAdmin.email) {
    if (await emailExists(data.email, adminId)) {
      throw new ConflictError('Email already exists');
    }
  }

  // Prepare update data
  const updates: {
    email?: string;
    passwordHash?: string | null;
    requirePassword?: boolean;
  } = {};

  if (data.email) {
    updates.email = data.email;
  }

  if (data.password) {
    updates.passwordHash = await hashPassword(data.password);
  }

  // Admins always require password
  updates.requirePassword = true;

  // Update admin
  const updatedAdmin = await updateUser(adminId, updates);

  return {
    id: updatedAdmin.id,
    email: updatedAdmin.email,
    role: updatedAdmin.role,
    cityId: null, // Admins don't have city
    requirePassword: updatedAdmin.requirePassword,
    status: updatedAdmin.status,
    createdAt: updatedAdmin.createdAt,
    updatedAt: updatedAdmin.updatedAt,
  };
};

/**
 * Delete an admin (superadmin only)
 * @param adminId - Admin ID to delete
 * @returns True if deleted successfully
 */
export const deleteAdmin = async (adminId: string): Promise<boolean> => {
  // Check if admin exists
  const admin = await findUserById(adminId);
  if (!admin) {
    throw new NotFoundError('Admin not found');
  }

  if (admin.role !== UserRole.ADMIN) {
    throw new BadRequestError('User is not an admin');
  }

  return await deleteUser(adminId);
};

/**
 * Get all admins (superadmin only)
 * @returns Array of admin responses
 */
export const getAllAdmins = async (): Promise<UserResponse[]> => {
  const admins = await findAllAdmins();
  return admins.map((admin) => ({
    id: admin.id,
    email: admin.email,
    role: admin.role,
    cityId: null, // Admins don't have city
    requirePassword: admin.requirePassword,
    status: admin.status,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
  }));
};

/**
 * Create a new user (admin only)
 * @param data - User creation data
 * @returns Created user response
 */
export const createRegularUser = async (data: CreateUserRequest): Promise<UserResponse> => {
  // Validate password requirement
  const requirePassword = data.requirePassword ?? false;
  
  if (!data.cityId) {
    throw new BadRequestError('City part ID is required');
  }

  // Validate city part exists
  const { findCityById } = await import('../queries/geography.queries');
  const city = await findCityById(data.cityId);
  if (!city) {
    throw new BadRequestError('Invalid city part ID');
  }

  // Email is required if requirePassword is true
  if (requirePassword && !data.email) {
    throw new BadRequestError('Email is required when requirePassword is true');
  }

  // Validate email doesn't exist (only if email is provided)
  if (data.email && await emailExists(data.email)) {
    throw new ConflictError('Email already exists');
  }

  // Validate ICP number doesn't exist
  if (await icpNumberExists(data.icpNumber)) {
    throw new ConflictError('ICP number already exists');
  }

  if (requirePassword && !data.password) {
    throw new BadRequestError('Password is required when requirePassword is true');
  }

  // Hash password if provided
  const passwordHash = requirePassword && data.password
    ? await hashPassword(data.password)
    : null;

  // Generate unique link token for users without password requirement
  // Using crypto.randomUUID() for secure token generation
  const uniqueLinkToken = !requirePassword
    ? crypto.randomUUID()
    : null;

  // Create user with approved status (admin-created users are automatically approved)
  const user = await createUser(
    data.email || null, // Allow null email if password not required
    UserRole.USER,
    passwordHash,
    data.icpNumber,
    data.cityId,
    requirePassword,
    uniqueLinkToken,
    UserStatus.APPROVED, // Admin-created users are automatically approved
  );

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    icpNumber: user.icpNumber,
    cityId: user.cityId,
    cityName: city.name, // Use city name from validation above
    uniqueLinkToken: user.uniqueLinkToken, // Include token in response for admin
    requirePassword: user.requirePassword,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

/**
 * Update a user (admin only)
 * @param userId - User ID to update
 * @param data - User update data
 * @returns Updated user response
 */
export const updateRegularUser = async (
  userId: string,
  data: UpdateUserRequest,
): Promise<UserResponse> => {
  // Check if user exists
  const existingUser = await findUserById(userId);
  if (!existingUser) {
    throw new NotFoundError('User not found');
  }

  if (existingUser.role !== UserRole.USER) {
    throw new BadRequestError('User is not a regular user');
  }

  // Determine final requirePassword value
  const finalRequirePassword = data.requirePassword !== undefined 
    ? data.requirePassword 
    : existingUser.requirePassword;

  // Email is required if requirePassword is true
  const finalEmail = data.email !== undefined ? data.email : existingUser.email;
  if (finalRequirePassword && !finalEmail) {
    throw new BadRequestError('Email is required when requirePassword is true');
  }

  if (data.cityId !== undefined) {
    // Validate city exists
    const { findCityById } = await import('../queries/geography.queries');
    const city = await findCityById(data.cityId);
    if (!city) {
      throw new BadRequestError('Invalid city ID');
    }
  }

  // Check email uniqueness if updating email
  if (data.email && data.email !== existingUser.email) {
    if (await emailExists(data.email, userId)) {
      throw new ConflictError('Email already exists');
    }
  }

  // Check ICP number uniqueness if updating ICP number
  if (data.icpNumber && data.icpNumber !== existingUser.icpNumber) {
    if (await icpNumberExists(data.icpNumber, userId)) {
      throw new ConflictError('ICP number already exists');
    }
  }

  // Prepare update data
  const updates: {
    email?: string | null;
    passwordHash?: string | null;
    icpNumber?: string | null;
    cityId?: number | null;
    requirePassword?: boolean;
    uniqueLinkToken?: string | null;
  } = {};

  if (data.email !== undefined) {
    updates.email = data.email || null; // Allow null if email is empty string
  }

  if (data.icpNumber) {
    updates.icpNumber = data.icpNumber;
  }

  if (data.cityId !== undefined) {
    updates.cityId = data.cityId;
  }

  if (data.requirePassword !== undefined) {
    updates.requirePassword = data.requirePassword;

    // If requirePassword is set to true, password must be provided
    if (data.requirePassword && !data.password) {
      throw new BadRequestError('Password is required when requirePassword is set to true');
    }

    // If password is provided, hash it
    if (data.password) {
      updates.passwordHash = await hashPassword(data.password);
    }

    // If requirePassword is set to false, generate a unique link token
    // If requirePassword is set to true, remove the token
    if (!data.requirePassword) {
      updates.uniqueLinkToken = crypto.randomUUID();
    } else {
      updates.uniqueLinkToken = null;
    }
  } else if (data.password) {
    // If password is provided without changing requirePassword, hash it
    updates.passwordHash = await hashPassword(data.password);
    // If password is being set, requirePassword should be true
    updates.requirePassword = true;
    // Remove token when password is set
    updates.uniqueLinkToken = null;
  } else if (!finalRequirePassword && !existingUser.uniqueLinkToken) {
    // If user doesn't require password and doesn't have a token, generate one
    updates.uniqueLinkToken = crypto.randomUUID();
  }

  // Update user
  const updatedUser = await updateUser(userId, updates);

  // Get city name if cityId exists
  let cityName: string | null = null;
  if (updatedUser.cityId) {
    const { findCityById } = await import('../queries/geography.queries');
    const city = await findCityById(updatedUser.cityId);
    cityName = city?.name || null;
  }

  return {
    id: updatedUser.id,
    email: updatedUser.email,
    role: updatedUser.role,
    icpNumber: updatedUser.icpNumber,
    cityId: updatedUser.cityId,
    cityName: cityName,
    uniqueLinkToken: updatedUser.uniqueLinkToken, // Include token in response for admin
    requirePassword: updatedUser.requirePassword,
    status: updatedUser.status,
    createdAt: updatedUser.createdAt,
    updatedAt: updatedUser.updatedAt,
  };
};

/**
 * Delete a user (admin only)
 * @param userId - User ID to delete
 * @returns True if deleted successfully
 */
export const deleteRegularUser = async (userId: string): Promise<boolean> => {
  // Check if user exists
  const user = await findUserById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (user.role !== UserRole.USER) {
    throw new BadRequestError('User is not a regular user');
  }

  return await deleteUser(userId);
};

/**
 * Get all users (admin only)
 * @returns Array of user responses
 */
export const getAllUsers = async (): Promise<UserResponse[]> => {
  const users = await findAllUsers();
  return users.map((user) => ({
    id: user.id,
    email: user.email,
    role: user.role,
    icpNumber: user.icpNumber,
    cityId: user.cityId,
    cityName: user.cityName || null,
    uniqueLinkToken: user.uniqueLinkToken, // Include token for admin to display links
    requirePassword: user.requirePassword,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }));
};

/**
 * Setup password for a user (user self-service)
 * @param userId - User ID
 * @param data - Password setup data
 * @returns Updated user response
 */
export const setupUserPassword = async (
  userId: string,
  data: SetupUserPasswordRequest,
): Promise<UserResponse> => {
  // Check if user exists
  const user = await findUserById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (user.role !== UserRole.USER) {
    throw new BadRequestError('Only regular users can set up passwords');
  }

  // Hash password
  const passwordHash = await hashPassword(data.password);

  // Update user with password and set requirePassword to true
  const updatedUser = await updateUser(userId, {
    passwordHash,
    requirePassword: true,
  });

  // Get city name if cityId exists
  let cityName: string | null = null;
  if (updatedUser.cityId) {
    const { findCityById } = await import('../queries/geography.queries');
    const city = await findCityById(updatedUser.cityId);
    cityName = city?.name || null;
  }

  return {
    id: updatedUser.id,
    email: updatedUser.email,
    role: updatedUser.role,
    icpNumber: updatedUser.icpNumber,
    cityId: updatedUser.cityId,
    cityName: cityName,
    requirePassword: updatedUser.requirePassword,
    status: updatedUser.status,
    createdAt: updatedUser.createdAt,
    updatedAt: updatedUser.updatedAt,
  };
};

/**
 * Get doctor profile (self-service)
 */
export const getDoctorProfile = async (userId: string): Promise<UserResponse> => {
  const user = await findUserById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (user.role !== UserRole.USER) {
    throw new BadRequestError('Only regular users have profiles');
  }

  // Get city name if cityId exists
  let cityName: string | null = null;
  if (user.cityId) {
    const { findCityById } = await import('../queries/geography.queries');
    const city = await findCityById(user.cityId);
    cityName = city?.name || null;
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    icpNumber: user.icpNumber,
    cityId: user.cityId,
    cityName: cityName,
    uniqueLinkToken: user.uniqueLinkToken,
    requirePassword: user.requirePassword,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

/**
 * Login with email and password (for admins and users with password)
 * @param data - Login credentials
 * @returns Authentication response with token
 */
export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  // Find user by email
  const user = await findUserByEmail(data.email);
  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // Check if user has password
  if (!user.passwordHash) {
    throw new UnauthorizedError('Password not set for this user');
  }

  // Verify password
  const isValid = await verifyPassword(data.password, user.passwordHash);
  if (!isValid) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // Generate token
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      icpNumber: user.icpNumber,
      requirePassword: user.requirePassword,
      cityId: user.cityId,
      status: user.status,
    },
  };
};

/**
 * Identify user by ICP number
 * @param data - ICP identification data
 * @returns User information (without sensitive data)
 */
export const identifyByIcp = async (data: IdentifyByIcpRequest): Promise<UserResponse> => {
  // Find user by ICP number
  const user = await findUserByIcpNumber(data.icpNumber);
  if (!user) {
    throw new NotFoundError('Uživatel s tímto IČP nebyl nalezen');
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    icpNumber: user.icpNumber,
    cityId: user.cityId,
    requirePassword: user.requirePassword,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

/**
 * Identify user by unique link token
 * @param data - Token identification data
 * @returns User information (without sensitive data)
 */
export const identifyByToken = async (data: IdentifyByTokenRequest): Promise<UserResponse> => {
  // Find user by unique link token
  const user = await findUserByUniqueLinkToken(data.token);
  if (!user) {
    throw new NotFoundError('Uživatel s tímto tokenem nebyl nalezen');
  }

  // Check if user is approved
  if (user.status !== UserStatus.APPROVED) {
    throw new UnauthorizedError('Váš účet čeká na schválení nebo byl zamítnut');
  }

  // Check if user requires password (if yes, they should use token auth instead)
  if (user.requirePassword) {
    throw new UnauthorizedError('Tento uživatel vyžaduje přihlášení pomocí hesla');
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    icpNumber: user.icpNumber,
    requirePassword: user.requirePassword,
    cityId: user.cityId,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

/**
 * Regenerate unique link token for a user (admin only)
 * @param userId - User ID
 * @returns Updated user response with new token
 */
export const regenerateUserToken = async (userId: string): Promise<UserResponse> => {
  // Check if user exists
  const user = await findUserById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (user.role !== UserRole.USER) {
    throw new BadRequestError('Only regular users can have unique link tokens');
  }

  if (user.requirePassword) {
    throw new BadRequestError('Users with password requirement cannot have unique link tokens');
  }

  // Generate new token
  const newToken = crypto.randomUUID();

  // Update user with new token
  const updatedUser = await updateUser(userId, {
    uniqueLinkToken: newToken,
  });

  // Get city name if cityId exists
  let cityName: string | null = null;
  if (updatedUser.cityId) {
    const { findCityById } = await import('../queries/geography.queries');
    const city = await findCityById(updatedUser.cityId);
    cityName = city?.name || null;
  }

  return {
    id: updatedUser.id,
    email: updatedUser.email,
    role: updatedUser.role,
    icpNumber: updatedUser.icpNumber,
    cityId: updatedUser.cityId,
    cityName: cityName,
    uniqueLinkToken: updatedUser.uniqueLinkToken,
    requirePassword: updatedUser.requirePassword,
    status: updatedUser.status,
    createdAt: updatedUser.createdAt,
    updatedAt: updatedUser.updatedAt,
  };
};

/**
 * Preregister a new user (public, no auth required)
 * Creates a user with 'pending' status awaiting admin approval
 * @param data - Preregistration data
 * @returns Created user response with pending status
 */
export const preregisterUser = async (data: PreregisterRequest): Promise<UserResponse> => {
  // Validate password requirement
  const requirePassword = data.requirePassword ?? false;

  if (!data.cityId) {
    throw new BadRequestError('City part ID is required');
  }

  // Validate city part exists
  const { findCityById } = await import('../queries/geography.queries');
  const city = await findCityById(data.cityId);
  if (!city) {
    throw new BadRequestError('Invalid city part ID');
  }
  
  // Email is required if requirePassword is true
  if (requirePassword && !data.email) {
    throw new BadRequestError('Email is required when requirePassword is true');
  }

  // Validate email doesn't exist (only if email is provided)
  if (data.email && await emailExists(data.email)) {
    throw new ConflictError('Email already exists');
  }

  // Validate ICP number doesn't exist
  if (await icpNumberExists(data.icpNumber)) {
    throw new ConflictError('ICP number already exists');
  }

  if (requirePassword && !data.password) {
    throw new BadRequestError('Password is required when requirePassword is true');
  }

  // Hash password if provided
  const passwordHash = requirePassword && data.password
    ? await hashPassword(data.password)
    : null;

  // Generate unique link token for users without password requirement
  // Note: Token is generated even for pending users, but they can't use it until approved
  const uniqueLinkToken = !requirePassword
    ? crypto.randomUUID()
    : null;

  // Create user with PENDING status (awaiting admin approval)
  const user = await createUser(
    data.email || null,
    UserRole.USER,
    passwordHash,
    data.icpNumber,
    data.cityId,
    requirePassword,
    uniqueLinkToken,
    UserStatus.PENDING, // Preregistered users start as pending
  );

  // Get city name if cityId exists
  let cityName: string | null = null;
  if (user.cityId) {
    const { findCityById } = await import('../queries/geography.queries');
    const city = await findCityById(user.cityId);
    cityName = city?.name || null;
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    icpNumber: user.icpNumber,
    cityId: user.cityId,
    cityName: cityName,
    uniqueLinkToken: user.uniqueLinkToken,
    requirePassword: user.requirePassword,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

/**
 * Validate (approve or reject) a preregistered user (admin only)
 * @param userId - User ID to validate
 * @param data - Validation data (approve or reject)
 * @returns Updated user response
 */
export const validateUser = async (
  userId: string,
  data: ValidateUserRequest,
): Promise<UserResponse> => {
  // Check if user exists
  const user = await findUserById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (user.role !== UserRole.USER) {
    throw new BadRequestError('Only regular users can be validated');
  }

  // Only allow changing status from pending to approved or rejected
  if (user.status !== UserStatus.PENDING) {
    throw new BadRequestError(`User is already ${user.status}. Only pending users can be validated.`);
  }

  // Update user status
  const updatedUser = await updateUser(userId, {
    status: data.status,
  });

  return {
    id: updatedUser.id,
    email: updatedUser.email,
    role: updatedUser.role,
    icpNumber: updatedUser.icpNumber,
    uniqueLinkToken: updatedUser.uniqueLinkToken,
    requirePassword: updatedUser.requirePassword,
    status: updatedUser.status,
    createdAt: updatedUser.createdAt,
    updatedAt: updatedUser.updatedAt,
  };
};

/**
 * Get all pending users (admin only)
 * @returns Array of pending user responses
 */
export const getPendingUsers = async (): Promise<UserResponse[]> => {
  const users = await findPendingUsers();
  return users.map((user) => ({
    id: user.id,
    email: user.email,
    role: user.role,
    icpNumber: user.icpNumber,
    cityId: user.cityId,
    uniqueLinkToken: user.uniqueLinkToken,
    requirePassword: user.requirePassword,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }));
};

/**
 * Update doctor profile (doctor self-service)
 * Allows toggling between password and link authentication
 */
export const updateDoctorProfile = async (
  userId: string,
  data: UpdateDoctorProfileRequest,
): Promise<UserResponse> => {
  const user = await findUserById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (user.role !== UserRole.USER) {
    throw new BadRequestError('Only regular users can update their profile');
  }

  const targetRequirePassword =
    data.requirePassword !== undefined ? data.requirePassword : user.requirePassword;

  const targetEmail = data.email !== undefined ? data.email : user.email;

  if (targetRequirePassword && !targetEmail) {
    throw new BadRequestError('Email is required when requirePassword is true');
  }

  if (data.cityId !== undefined) {
    // Validate city exists
    const { findCityById } = await import('../queries/geography.queries');
    const city = await findCityById(data.cityId);
    if (!city) {
      throw new BadRequestError('Invalid city ID');
    }
  }

  if (data.email && data.email !== user.email) {
    if (await emailExists(data.email, userId)) {
      throw new ConflictError('Email already exists');
    }
  }

  const updates: {
    email?: string | null;
    cityId?: number | null;
    passwordHash?: string | null;
    requirePassword?: boolean;
    uniqueLinkToken?: string | null;
  } = {};

  if (data.email !== undefined) {
    updates.email = data.email || null;
  }

  if (data.cityId !== undefined) {
    updates.cityId = data.cityId;
  }

  if (data.requirePassword !== undefined && data.requirePassword !== user.requirePassword) {
    updates.requirePassword = data.requirePassword;
    if (data.requirePassword) {
      if (!data.password) {
        throw new BadRequestError('Password is required when enabling password authentication');
      }
      updates.passwordHash = await hashPassword(data.password);
      updates.uniqueLinkToken = null;
    } else {
      updates.passwordHash = null;
      updates.uniqueLinkToken = crypto.randomUUID();
    }
  } else if (data.password) {
    if (!targetRequirePassword) {
      throw new BadRequestError('Password can only be set when requirePassword is true');
    }
    updates.passwordHash = await hashPassword(data.password);
  }

  const updatedUser = await updateUser(userId, updates);

  // Get city name if cityId exists
  let cityName: string | null = null;
  if (updatedUser.cityId) {
    const { findCityById } = await import('../queries/geography.queries');
    const city = await findCityById(updatedUser.cityId);
    cityName = city?.name || null;
  }

  return {
    id: updatedUser.id,
    email: updatedUser.email,
    role: updatedUser.role,
    icpNumber: updatedUser.icpNumber,
    cityId: updatedUser.cityId,
    cityName: cityName,
    uniqueLinkToken: updatedUser.uniqueLinkToken,
    requirePassword: updatedUser.requirePassword,
    status: updatedUser.status,
    createdAt: updatedUser.createdAt,
    updatedAt: updatedUser.updatedAt,
  };
};

