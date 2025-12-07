/**
 * Statistics service
 * Business logic for test result statistics
 */

import { BadRequestError } from '../utils/errors';
import {
  getPositiveNegativeCounts,
  getPositiveByAgeGroupsCounts,
  getPositiveByPathogensCounts,
  getPositiveTrendsByPathogensCounts,
  getPositivePathogenDistributionByScope,
  getPositivePathogensByAgeGroupsCounts,
} from '../queries/statistics.queries';

/**
 * Get positive and negative test result statistics for a doctor with filters
 * @param doctorId - Doctor user ID
 * @param options - Filter options (search, city, startDate, endDate)
 * @returns Object with positive and negative counts
 */
export const getPositiveNegativeStatistics = async (
  doctorId: string,
  options: {
    search?: string;
    city?: string;
    startDate?: string;
    endDate?: string;
  } = {},
): Promise<{ positive: number; negative: number }> => {
  // Validate dates if provided
  if (options.startDate) {
    const start = new Date(options.startDate);
    if (isNaN(start.getTime())) {
      throw new BadRequestError('Invalid start date format');
    }
  }

  if (options.endDate) {
    const end = new Date(options.endDate);
    if (isNaN(end.getTime())) {
      throw new BadRequestError('Invalid end date format');
    }
  }

  if (options.startDate && options.endDate) {
    const start = new Date(options.startDate);
    const end = new Date(options.endDate);
    if (start > end) {
      throw new BadRequestError('Start date must be before end date');
    }
  }

  return await getPositiveNegativeCounts(doctorId, options);
};

/**
 * Get positive test result statistics by age groups for a doctor with filters
 * @param doctorId - Doctor user ID
 * @param options - Filter options (search, city, startDate, endDate)
 * @returns Object with counts for each age group (0-5, 6-14, 15-24, 25-64, 65+)
 */
export const getPositiveByAgeGroupsStatistics = async (
  doctorId: string,
  options: {
    search?: string;
    city?: string;
    startDate?: string;
    endDate?: string;
  } = {},
): Promise<{
  age0to5: number;
  age6to14: number;
  age15to24: number;
  age25to64: number;
  age65plus: number;
}> => {
  // Validate dates if provided
  if (options.startDate) {
    const start = new Date(options.startDate);
    if (isNaN(start.getTime())) {
      throw new BadRequestError('Invalid start date format');
    }
  }

  if (options.endDate) {
    const end = new Date(options.endDate);
    if (isNaN(end.getTime())) {
      throw new BadRequestError('Invalid end date format');
    }
  }

  if (options.startDate && options.endDate) {
    const start = new Date(options.startDate);
    const end = new Date(options.endDate);
    if (start > end) {
      throw new BadRequestError('Start date must be before end date');
    }
  }

  return await getPositiveByAgeGroupsCounts(doctorId, options);
};

/**
 * Get positive test result statistics grouped by pathogen for a doctor with filters
 * @param doctorId - Doctor user ID
 * @param options - Filter options (search, city, startDate, endDate)
 * @returns Array of objects with pathogen name and count, sorted by count descending
 */
export const getPositiveByPathogensStatistics = async (
  doctorId: string,
  options: {
    search?: string;
    city?: string;
    startDate?: string;
    endDate?: string;
  } = {},
): Promise<Array<{ pathogenName: string; count: number }>> => {
  // Validate dates if provided
  if (options.startDate) {
    const start = new Date(options.startDate);
    if (isNaN(start.getTime())) {
      throw new BadRequestError('Invalid start date format');
    }
  }

  if (options.endDate) {
    const end = new Date(options.endDate);
    if (isNaN(end.getTime())) {
      throw new BadRequestError('Invalid end date format');
    }
  }

  if (options.startDate && options.endDate) {
    const start = new Date(options.startDate);
    const end = new Date(options.endDate);
    if (start > end) {
      throw new BadRequestError('Start date must be before end date');
    }
  }

  return await getPositiveByPathogensCounts(doctorId, options);
};

/**
 * Get positive test result trends over time grouped by pathogen with filters
 * @param doctorId - Doctor user ID (null = all doctors)
 * @param options - Filter options and time period (search, city, regionId, cityId, startDate, endDate, period)
 * @returns Object with byPathogen array and total array
 */
export const getPositiveTrendsByPathogensStatistics = async (
  doctorId: string | null,
  options: {
    search?: string;
    city?: string;
    regionId?: number;
    cityId?: number;
    startDate?: string;
    endDate?: string;
    period?: 'day' | 'week' | 'month';
  } = {},
): Promise<{
  byPathogen: Array<{ date: string; pathogenName: string; count: number }>;
  total: Array<{ date: string; count: number }>;
}> => {
  // Validate dates if provided
  if (options.startDate) {
    const start = new Date(options.startDate);
    if (isNaN(start.getTime())) {
      throw new BadRequestError('Invalid start date format');
    }
  }

  if (options.endDate) {
    const end = new Date(options.endDate);
    if (isNaN(end.getTime())) {
      throw new BadRequestError('Invalid end date format');
    }
  }

  if (options.startDate && options.endDate) {
    const start = new Date(options.startDate);
    const end = new Date(options.endDate);
    if (start > end) {
      throw new BadRequestError('Start date must be before end date');
    }
  }

  // Validate period
  if (options.period && !['day', 'week', 'month'].includes(options.period)) {
    throw new BadRequestError('Period must be one of: day, week, month');
  }

  // Validate regionId and cityId if provided (optional validation - let database handle invalid IDs)
  // We could add validation here to check if region/city exists, but it's not critical for performance

  return await getPositiveTrendsByPathogensCounts(doctorId, options);
};

/**
 * Get positive pathogens by age groups statistics
 * @param doctorId - Doctor user ID (null = all doctors)
 * @param options - Filter options (search, city, regionId, cityId, startDate, endDate)
 * @returns Array of objects with pathogen name, age group, and count
 */
export const getPositivePathogensByAgeGroupsStatistics = async (
  doctorId: string | null,
  options: {
    search?: string;
    city?: string;
    regionId?: number;
    cityId?: number;
    startDate?: string;
    endDate?: string;
  } = {},
): Promise<Array<{ pathogenName: string; ageGroup: string; count: number }>> => {
  // Validate dates if provided
  if (options.startDate && isNaN(Date.parse(options.startDate))) {
    throw new Error('Invalid startDate format');
  }
  if (options.endDate && isNaN(Date.parse(options.endDate))) {
    throw new Error('Invalid endDate format');
  }

  return await getPositivePathogensByAgeGroupsCounts(doctorId, options);
};

/**
 * Get positive pathogen distribution by scope (Me, District, Region, Country)
 * @param doctorId - Doctor user ID
 * @param options - Filter options (startDate, endDate, regionId, cityId)
 * @returns Object with pathogen distributions for each scope level
 */
export const getPositivePathogenDistributionByScopeStatistics = async (
  doctorId: string,
  options: {
    startDate?: string;
    endDate?: string;
    regionId?: number;
    cityId?: number;
  } = {},
): Promise<{
  me: Array<{ pathogenName: string; count: number; percentage: number }>;
  district: Array<{ pathogenName: string; count: number; percentage: number }>;
  region: Array<{ pathogenName: string; count: number; percentage: number }>;
  country: Array<{ pathogenName: string; count: number; percentage: number }>;
}> => {
  // Validate dates if provided
  if (options.startDate) {
    const start = new Date(options.startDate);
    if (isNaN(start.getTime())) {
      throw new BadRequestError('Invalid start date format');
    }
  }

  if (options.endDate) {
    const end = new Date(options.endDate);
    if (isNaN(end.getTime())) {
      throw new BadRequestError('Invalid end date format');
    }
  }

  if (options.startDate && options.endDate) {
    const start = new Date(options.startDate);
    const end = new Date(options.endDate);
    if (start > end) {
      throw new BadRequestError('Start date must be before end date');
    }
  }

  return await getPositivePathogenDistributionByScope(doctorId, options);
};

