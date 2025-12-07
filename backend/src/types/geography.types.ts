/**
 * Geography-related type definitions
 * Represents Czech address hierarchy: regions -> districts -> cities
 * Note: City parts have been removed - cities are now the lowest level
 */

/**
 * Region entity (stored in database)
 * Represents Czech regions (kraje)
 */
export interface RegionEntity {
  id: number;
  name: string;
  createdAt: Date;
}

/**
 * District entity (stored in database)
 * Represents Czech districts (okresy)
 */
export interface DistrictEntity {
  id: number;
  name: string;
  regionId: number;
  createdAt: Date;
}

/**
 * City entity (stored in database)
 * Represents Czech cities (města)
 */
export interface CityEntity {
  id: number;
  name: string;
  districtId: number;
  createdAt: Date;
}

/**
 * Response types for API
 */
export interface RegionResponse {
  id: number;
  name: string;
  createdAt: Date;
}

export interface DistrictResponse {
  id: number;
  name: string;
  regionId: number;
  region?: RegionResponse; // Parent region
  createdAt: Date;
}

export interface CityResponse {
  id: number;
  name: string;
  districtId: number;
  district?: DistrictResponse; // Parent district (includes region)
  createdAt: Date;
}


