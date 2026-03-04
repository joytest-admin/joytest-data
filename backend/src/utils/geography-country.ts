/**
 * Country helpers for geography entities based on ID ranges.
 *
 * This provides a lightweight way to distinguish between Czech and Slovak
 * regions/districts/cities without changing the database schema.
 *
 * Offsets are aligned with the import script:
 * - Regions:   Czech < 100,  Slovak >= 100
 * - Districts: Czech < 1000, Slovak >= 1000
 * - Cities:    Czech < 100000, Slovak >= 100000
 */

export type SupportedCountry = 'CZ' | 'SK';

// Region ID thresholds
export const CZECH_REGION_MAX_ID = 99;

// District ID thresholds
export const CZECH_DISTRICT_MAX_ID = 999;

// City ID thresholds
export const CZECH_CITY_MAX_ID = 99_999;

/**
 * Determine if a region ID belongs to the Czech Republic.
 */
export const isCzechRegionId = (id: number | null | undefined): boolean => {
  // Null / undefined means we cannot decide, so treat as non‑Czech
  if (id === null || id === undefined) {
    return false;
  }
  return id <= CZECH_REGION_MAX_ID;
};

/**
 * Determine if a region ID belongs to Slovakia.
 */
export const isSlovakRegionId = (id: number | null | undefined): boolean => {
  if (id === null || id === undefined) {
    return false;
  }
  return id > CZECH_REGION_MAX_ID;
};

/**
 * Determine if a district ID belongs to the Czech Republic.
 */
export const isCzechDistrictId = (id: number | null | undefined): boolean => {
  if (id === null || id === undefined) {
    return false;
  }
  return id <= CZECH_DISTRICT_MAX_ID;
};

/**
 * Determine if a district ID belongs to Slovakia.
 */
export const isSlovakDistrictId = (id: number | null | undefined): boolean => {
  if (id === null || id === undefined) {
    return false;
  }
  return id > CZECH_DISTRICT_MAX_ID;
};

/**
 * Determine if a city ID belongs to the Czech Republic.
 */
export const isCzechCityId = (id: number | null | undefined): boolean => {
  if (id === null || id === undefined) {
    return false;
  }
  return id <= CZECH_CITY_MAX_ID;
};

/**
 * Determine if a city ID belongs to Slovakia.
 */
export const isSlovakCityId = (id: number | null | undefined): boolean => {
  if (id === null || id === undefined) {
    return false;
  }
  return id > CZECH_CITY_MAX_ID;
};

/**
 * Resolve country from a region ID using ID ranges.
 */
export const getCountryFromRegionId = (id: number | null | undefined): SupportedCountry | null => {
  if (isCzechRegionId(id)) {
    return 'CZ';
  }
  if (isSlovakRegionId(id)) {
    return 'SK';
  }
  return null;
};

/**
 * Comparator that sorts Czech regions first, then Slovak regions,
 * and alphabetically by name inside each group.
 */
export const compareRegionsCzFirst = <
  T extends {
    id: number;
    name: string;
  },
>(
  a: T,
  b: T,
): number => {
  const countryA = getCountryFromRegionId(a.id);
  const countryB = getCountryFromRegionId(b.id);

  // Ensure deterministic ordering even if country cannot be resolved
  const rank = (country: SupportedCountry | null): number => {
    if (country === 'CZ') {
      return 0;
    }
    if (country === 'SK') {
      return 1;
    }
    return 2;
  };

  const rankDiff = rank(countryA) - rank(countryB);
  if (rankDiff !== 0) {
    return rankDiff;
  }

  // Same country bucket: sort alphabetically by name
  return a.name.localeCompare(b.name, 'cs-CZ');
};

