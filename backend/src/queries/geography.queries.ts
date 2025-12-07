/**
 * Geography database queries
 * Handles all database operations for Czech address hierarchy
 */

import { getDatabasePool } from '../utils/database';
import {
  RegionEntity,
  DistrictEntity,
  CityEntity,
} from '../types/geography.types';

/**
 * Map database row to RegionEntity
 */
const mapRegionRow = (row: any): RegionEntity => {
  return {
    id: row.id,
    name: row.name,
    createdAt: new Date(row.created_at),
  };
};

/**
 * Map database row to DistrictEntity
 */
const mapDistrictRow = (row: any): DistrictEntity => {
  return {
    id: row.id,
    name: row.name,
    regionId: row.region_id,
    createdAt: new Date(row.created_at),
  };
};

/**
 * Map database row to CityEntity
 */
const mapCityRow = (row: any): CityEntity => {
  return {
    id: row.id,
    name: row.name,
    districtId: row.district_id,
    createdAt: new Date(row.created_at),
  };
};


/**
 * Get all regions
 * @param search - Optional search term to filter by name (case-insensitive partial match)
 * @returns Array of region entities, ordered by name
 */
export const findAllRegions = async (search?: string): Promise<RegionEntity[]> => {
  const pool = getDatabasePool();
  let query = 'SELECT * FROM regions';
  const params: string[] = [];

  if (search && search.trim().length > 0) {
    query += ' WHERE name ILIKE $1';
    params.push(`%${search.trim()}%`);
  }

  query += ' ORDER BY name ASC';

  const result = await pool.query(query, params);
  return result.rows.map(mapRegionRow);
};

/**
 * Find region by ID
 * @param id - Region ID
 * @returns Region entity or null if not found
 */
export const findRegionById = async (id: number): Promise<RegionEntity | null> => {
  const pool = getDatabasePool();
  const result = await pool.query(
    'SELECT * FROM regions WHERE id = $1',
    [id],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapRegionRow(result.rows[0]);
};

/**
 * Get all districts with their parent region
 * @param regionId - Optional region ID to filter districts
 * @param search - Optional search term to filter by name (case-insensitive partial match)
 * @returns Array of district entities with region data, ordered by name
 */
export const findAllDistricts = async (regionId?: number, search?: string): Promise<Array<DistrictEntity & { region: RegionEntity }>> => {
  const pool = getDatabasePool();
  let query = `
    SELECT 
      d.id,
      d.name,
      d.region_id,
      d.created_at,
      r.id as region_id_full,
      r.name as region_name,
      r.created_at as region_created_at
    FROM districts d
    INNER JOIN regions r ON d.region_id = r.id
  `;
  const params: (number | string)[] = [];
  const conditions: string[] = [];

  if (regionId !== undefined) {
    conditions.push(`d.region_id = $${params.length + 1}`);
    params.push(regionId);
  }

  if (search && search.trim().length > 0) {
    conditions.push(`d.name ILIKE $${params.length + 1}`);
    params.push(`%${search.trim()}%`);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += ' ORDER BY d.name ASC';

  const result = await pool.query(query, params);
  return result.rows.map((row) => ({
    ...mapDistrictRow(row),
    region: {
      id: row.region_id_full,
      name: row.region_name,
      createdAt: new Date(row.region_created_at),
    },
  }));
};

/**
 * Find district by ID with parent region
 * @param id - District ID
 * @returns District entity with region data or null if not found
 */
export const findDistrictById = async (id: number): Promise<(DistrictEntity & { region: RegionEntity }) | null> => {
  const pool = getDatabasePool();
  const result = await pool.query(
    `SELECT 
      d.id,
      d.name,
      d.region_id,
      d.created_at,
      r.id as region_id_full,
      r.name as region_name,
      r.created_at as region_created_at
    FROM districts d
    INNER JOIN regions r ON d.region_id = r.id
    WHERE d.id = $1`,
    [id],
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    ...mapDistrictRow(row),
    region: {
      id: row.region_id_full,
      name: row.region_name,
      createdAt: new Date(row.region_created_at),
    },
  };
};

/**
 * Get all cities with their parent district and region
 * @param districtId - Optional district ID to filter cities
 * @param search - Optional search term to filter by name (case-insensitive partial match)
 * @returns Array of city entities with district and region data, ordered by name
 */
export const findAllCities = async (districtId?: number, search?: string): Promise<Array<CityEntity & { district: DistrictEntity & { region: RegionEntity } }>> => {
  const pool = getDatabasePool();
  let query = `
    SELECT 
      c.id,
      c.name,
      c.district_id,
      c.created_at,
      d.id as district_id_full,
      d.name as district_name,
      d.region_id as district_region_id,
      d.created_at as district_created_at,
      r.id as region_id_full,
      r.name as region_name,
      r.created_at as region_created_at
    FROM cities c
    INNER JOIN districts d ON c.district_id = d.id
    INNER JOIN regions r ON d.region_id = r.id
  `;
  const params: (number | string)[] = [];
  const conditions: string[] = [];

  if (districtId !== undefined) {
    conditions.push(`c.district_id = $${params.length + 1}`);
    params.push(districtId);
  }

  if (search && search.trim().length > 0) {
    conditions.push(`c.name ILIKE $${params.length + 1}`);
    params.push(`%${search.trim()}%`);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += ' ORDER BY c.name ASC';

  const result = await pool.query(query, params);
  return result.rows.map((row) => ({
    ...mapCityRow(row),
    district: {
      id: row.district_id_full,
      name: row.district_name,
      regionId: row.district_region_id,
      createdAt: new Date(row.district_created_at),
      region: {
        id: row.region_id_full,
        name: row.region_name,
        createdAt: new Date(row.region_created_at),
      },
    },
  }));
};

/**
 * Find city by ID with parent district and region
 * @param id - City ID
 * @returns City entity with district and region data or null if not found
 */
export const findCityById = async (id: number): Promise<(CityEntity & { district: DistrictEntity & { region: RegionEntity } }) | null> => {
  const pool = getDatabasePool();
  const result = await pool.query(
    `SELECT 
      c.id,
      c.name,
      c.district_id,
      c.created_at,
      d.id as district_id_full,
      d.name as district_name,
      d.region_id as district_region_id,
      d.created_at as district_created_at,
      r.id as region_id_full,
      r.name as region_name,
      r.created_at as region_created_at
    FROM cities c
    INNER JOIN districts d ON c.district_id = d.id
    INNER JOIN regions r ON d.region_id = r.id
    WHERE c.id = $1`,
    [id],
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    ...mapCityRow(row),
    district: {
      id: row.district_id_full,
      name: row.district_name,
      regionId: row.district_region_id,
      createdAt: new Date(row.district_created_at),
      region: {
        id: row.region_id_full,
        name: row.region_name,
        createdAt: new Date(row.region_created_at),
      },
    },
  };
};


