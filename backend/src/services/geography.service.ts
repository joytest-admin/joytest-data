/**
 * Geography service
 * Contains business logic for geography operations
 */

import {
  RegionResponse,
  DistrictResponse,
  CityResponse,
} from '../types/geography.types';
import {
  findAllRegions,
  findAllDistricts,
  findAllCities,
  findRegionById,
  findDistrictById,
  findCityById,
} from '../queries/geography.queries';

/**
 * Get all regions
 * @param search - Optional search term to filter by name
 * @returns Array of region responses
 */
export const getAllRegions = async (search?: string): Promise<RegionResponse[]> => {
  const regions = await findAllRegions(search);
  return regions.map((region) => ({
    id: region.id,
    name: region.name,
    createdAt: region.createdAt,
  }));
};

/**
 * Get all districts, optionally filtered by region
 * @param regionId - Optional region ID to filter districts
 * @param search - Optional search term to filter by name
 * @returns Array of district responses with parent region
 */
export const getAllDistricts = async (regionId?: number, search?: string): Promise<DistrictResponse[]> => {
  const districts = await findAllDistricts(regionId, search);
  return districts.map((district) => ({
    id: district.id,
    name: district.name,
    regionId: district.regionId,
    region: {
      id: district.region.id,
      name: district.region.name,
      createdAt: district.region.createdAt,
    },
    createdAt: district.createdAt,
  }));
};

/**
 * Get all cities, optionally filtered by district
 * @param districtId - Optional district ID to filter cities
 * @param search - Optional search term to filter by name
 * @returns Array of city responses with parent district and region
 */
export const getAllCities = async (districtId?: number, search?: string): Promise<CityResponse[]> => {
  const cities = await findAllCities(districtId, search);
  return cities.map((city) => ({
    id: city.id,
    name: city.name,
    districtId: city.districtId,
    district: {
      id: city.district.id,
      name: city.district.name,
      regionId: city.district.regionId,
      region: {
        id: city.district.region.id,
        name: city.district.region.name,
        createdAt: city.district.region.createdAt,
      },
      createdAt: city.district.createdAt,
    },
    createdAt: city.createdAt,
  }));
};

/**
 * Get region by ID
 * @param id - Region ID
 * @returns Region response or null if not found
 */
export const getRegionById = async (id: number): Promise<RegionResponse | null> => {
  const region = await findRegionById(id);
  if (!region) {
    return null;
  }
  return {
    id: region.id,
    name: region.name,
    createdAt: region.createdAt,
  };
};

/**
 * Get district by ID with parent region
 * @param id - District ID
 * @returns District response with parent region or null if not found
 */
export const getDistrictById = async (id: number): Promise<DistrictResponse | null> => {
  const district = await findDistrictById(id);
  if (!district) {
    return null;
  }
  return {
    id: district.id,
    name: district.name,
    regionId: district.regionId,
    region: {
      id: district.region.id,
      name: district.region.name,
      createdAt: district.region.createdAt,
    },
    createdAt: district.createdAt,
  };
};

/**
 * Get city by ID with parent district and region
 * @param id - City ID
 * @returns City response with parent district and region or null if not found
 */
export const getCityById = async (id: number): Promise<CityResponse | null> => {
  const city = await findCityById(id);
  if (!city) {
    return null;
  }
  return {
    id: city.id,
    name: city.name,
    districtId: city.districtId,
    district: {
      id: city.district.id,
      name: city.district.name,
      regionId: city.district.regionId,
      region: {
        id: city.district.region.id,
        name: city.district.region.name,
        createdAt: city.district.region.createdAt,
      },
      createdAt: city.district.createdAt,
    },
    createdAt: city.createdAt,
  };
};


