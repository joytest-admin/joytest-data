/**
 * Statistics queries
 * Database queries for test result statistics
 */

import { getDatabasePool } from '../utils/database';

/**
 * Get positive and negative test result counts for a specific doctor with filters
 * @param doctorId - Doctor ID
 * @param options - Filter options (search, city, startDate, endDate)
 * @returns Object with positive and negative counts
 */
export const getPositiveNegativeCounts = async (
  doctorId: string,
  options: {
    search?: string;
    city?: string;
    startDate?: string;
    endDate?: string;
  } = {},
): Promise<{ positive: number; negative: number }> => {
  const pool = getDatabasePool();
  const { search, city, startDate, endDate } = options;

  let query = `
    SELECT
      COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM test_result_pathogens trp WHERE trp.test_result_id = tr.id)) as positive,
      COUNT(*) FILTER (WHERE NOT EXISTS (SELECT 1 FROM test_result_pathogens trp WHERE trp.test_result_id = tr.id)) as negative
    FROM test_results tr
    LEFT JOIN test_types tt ON tr.test_type_id = tt.id
    LEFT JOIN patients pat ON tr.patient_id = pat.id
    LEFT JOIN cities c ON tr.city_id = c.id
    WHERE tr.created_by = $1
  `;
  const params: any[] = [doctorId];
  let paramIndex = 2;

  if (search) {
    query += `
      AND (
        c.name ILIKE $${paramIndex} OR
        tt.name ILIKE $${paramIndex} OR
        EXISTS (SELECT 1 FROM test_result_pathogens trp JOIN pathogens p2 ON p2.id = trp.pathogen_id WHERE trp.test_result_id = tr.id AND p2.name ILIKE $${paramIndex}) OR
        pat.identifier ILIKE $${paramIndex} OR
        tr.icp_number ILIKE $${paramIndex}
      )
    `;
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (city) {
    query += ` AND c.name ILIKE $${paramIndex}`;
    params.push(`%${city}%`);
    paramIndex++;
  }

  if (startDate) {
    query += ` AND tr.created_at >= $${paramIndex}`;
    params.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    query += ` AND tr.created_at <= $${paramIndex}`;
    params.push(endDate);
    paramIndex++;
  }

  const result = await pool.query(query, params);

  if (result.rows.length === 0) {
    return { positive: 0, negative: 0 };
  }

  const row = result.rows[0];
  return {
    positive: parseInt(row.positive, 10) || 0,
    negative: parseInt(row.negative, 10) || 0,
  };
};

/**
 * Get positive test result counts by age groups for a specific doctor with filters
 * Age groups: 0-5, 6-14, 15-24, 25-64, 65+
 * @param doctorId - Doctor ID
 * @param options - Filter options (search, city, startDate, endDate)
 * @returns Object with counts for each age group
 */
export const getPositiveByAgeGroupsCounts = async (
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
  const pool = getDatabasePool();
  const { search, city, startDate, endDate } = options;

  const pos = `EXISTS (SELECT 1 FROM test_result_pathogens trp WHERE trp.test_result_id = tr.id)`;
  let query = `
    SELECT
      COUNT(*) FILTER (WHERE ${pos} AND EXTRACT(YEAR FROM AGE(tr.created_at, tr.date_of_birth)) BETWEEN 0 AND 5) as age_0_5,
      COUNT(*) FILTER (WHERE ${pos} AND EXTRACT(YEAR FROM AGE(tr.created_at, tr.date_of_birth)) BETWEEN 6 AND 14) as age_6_14,
      COUNT(*) FILTER (WHERE ${pos} AND EXTRACT(YEAR FROM AGE(tr.created_at, tr.date_of_birth)) BETWEEN 15 AND 24) as age_15_24,
      COUNT(*) FILTER (WHERE ${pos} AND EXTRACT(YEAR FROM AGE(tr.created_at, tr.date_of_birth)) BETWEEN 25 AND 64) as age_25_64,
      COUNT(*) FILTER (WHERE ${pos} AND EXTRACT(YEAR FROM AGE(tr.created_at, tr.date_of_birth)) >= 65) as age_65_plus
    FROM test_results tr
    LEFT JOIN test_types tt ON tr.test_type_id = tt.id
    LEFT JOIN patients pat ON tr.patient_id = pat.id
    LEFT JOIN cities c ON tr.city_id = c.id
    WHERE tr.created_by = $1
  `;
  const params: any[] = [doctorId];
  let paramIndex = 2;

  if (search) {
    query += `
      AND (
        c.name ILIKE $${paramIndex} OR
        tt.name ILIKE $${paramIndex} OR
        EXISTS (SELECT 1 FROM test_result_pathogens trp JOIN pathogens p2 ON p2.id = trp.pathogen_id WHERE trp.test_result_id = tr.id AND p2.name ILIKE $${paramIndex}) OR
        pat.identifier ILIKE $${paramIndex} OR
        tr.icp_number ILIKE $${paramIndex}
      )
    `;
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (city) {
    query += ` AND c.name ILIKE $${paramIndex}`;
    params.push(`%${city}%`);
    paramIndex++;
  }

  if (startDate) {
    query += ` AND tr.created_at >= $${paramIndex}`;
    params.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    query += ` AND tr.created_at <= $${paramIndex}`;
    params.push(endDate);
    paramIndex++;
  }

  const result = await pool.query(query, params);

  if (result.rows.length === 0) {
    return {
      age0to5: 0,
      age6to14: 0,
      age15to24: 0,
      age25to64: 0,
      age65plus: 0,
    };
  }

  const row = result.rows[0];
  return {
    age0to5: parseInt(row.age_0_5, 10) || 0,
    age6to14: parseInt(row.age_6_14, 10) || 0,
    age15to24: parseInt(row.age_15_24, 10) || 0,
    age25to64: parseInt(row.age_25_64, 10) || 0,
    age65plus: parseInt(row.age_65_plus, 10) || 0,
  };
};

/**
 * Get positive test result counts grouped by pathogen for a specific doctor with filters
 * @param doctorId - Doctor ID
 * @param options - Filter options (search, city, startDate, endDate)
 * @returns Array of objects with pathogen name and count
 */
export const getPositiveByPathogensCounts = async (
  doctorId: string,
  options: {
    search?: string;
    city?: string;
    startDate?: string;
    endDate?: string;
  } = {},
): Promise<Array<{ pathogenName: string; count: number }>> => {
  const pool = getDatabasePool();
  const { search, city, startDate, endDate } = options;

  let query = `
    SELECT
      p.name as pathogen_name,
      COUNT(*) as count
    FROM test_results tr
    JOIN test_result_pathogens trp ON trp.test_result_id = tr.id
    JOIN pathogens p ON p.id = trp.pathogen_id
    LEFT JOIN test_types tt ON tr.test_type_id = tt.id
    LEFT JOIN patients pat ON tr.patient_id = pat.id
    LEFT JOIN cities c ON tr.city_id = c.id
    WHERE tr.created_by = $1
  `;
  const params: any[] = [doctorId];
  let paramIndex = 2;

  if (search) {
    query += `
      AND (
        c.name ILIKE $${paramIndex} OR
        tt.name ILIKE $${paramIndex} OR
        p.name ILIKE $${paramIndex} OR
        pat.identifier ILIKE $${paramIndex} OR
        tr.icp_number ILIKE $${paramIndex}
      )
    `;
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (city) {
    query += ` AND c.name ILIKE $${paramIndex}`;
    params.push(`%${city}%`);
    paramIndex++;
  }

  if (startDate) {
    query += ` AND tr.created_at >= $${paramIndex}`;
    params.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    query += ` AND tr.created_at <= $${paramIndex}`;
    params.push(endDate);
    paramIndex++;
  }

  query += `
    GROUP BY p.name
    ORDER BY count DESC, p.name ASC
  `;

  const result = await pool.query(query, params);

  return result.rows.map((row) => ({
    pathogenName: row.pathogen_name || 'Unknown',
    count: parseInt(row.count, 10) || 0,
  }));
};

/**
 * Get positive test result counts grouped by pathogen and age groups
 * @param doctorId - Doctor ID (null = all doctors)
 * @param options - Filter options (search, city, regionId, cityId, startDate, endDate)
 * @returns Array of objects with pathogen name, age group, and count
 */
export const getPositivePathogensByAgeGroupsCounts = async (
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
  const pool = getDatabasePool();
  const { search, city, regionId, cityId, startDate, endDate } = options;

  const params: any[] = [];
  let paramIndex = 1;

  // Build WHERE clause for doctor filtering
  let doctorFilter = '';
  if (doctorId !== null) {
    doctorFilter = `tr.created_by = $${paramIndex}`;
    params.push(doctorId);
    paramIndex++;
  }

  // Build filter conditions
  let filterConditions = '';

  if (search) {
    filterConditions += `
      AND (
        c.name ILIKE $${paramIndex} OR
        tt.name ILIKE $${paramIndex} OR
        EXISTS (SELECT 1 FROM test_result_pathogens trp JOIN pathogens p2 ON p2.id = trp.pathogen_id WHERE trp.test_result_id = tr.id AND p2.name ILIKE $${paramIndex}) OR
        pat.identifier ILIKE $${paramIndex} OR
        tr.icp_number ILIKE $${paramIndex}
      )
    `;
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (city) {
    filterConditions += ` AND c.name ILIKE $${paramIndex}`;
    params.push(`%${city}%`);
    paramIndex++;
  }

  // Add region filter
  if (regionId !== undefined) {
    filterConditions += ` AND r.id = $${paramIndex}`;
    params.push(regionId);
    paramIndex++;
  }

  // Add city filter
  if (cityId !== undefined) {
    filterConditions += ` AND c.id = $${paramIndex}`;
    params.push(cityId);
    paramIndex++;
  }

  if (startDate) {
    filterConditions += ` AND tr.created_at >= $${paramIndex}`;
    params.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    filterConditions += ` AND tr.created_at <= $${paramIndex}`;
    params.push(endDate);
    paramIndex++;
  }

  // Query to get counts by pathogen and age group
  // Use a subquery to compute age_group first, then group by it
  const query = `
    SELECT
      pathogen_name,
      age_group,
      COUNT(*) as count
    FROM (
      SELECT
        p.name as pathogen_name,
        CASE
          WHEN EXTRACT(YEAR FROM AGE(tr.created_at, tr.date_of_birth)) BETWEEN 0 AND 5 THEN '0-5'
          WHEN EXTRACT(YEAR FROM AGE(tr.created_at, tr.date_of_birth)) BETWEEN 6 AND 14 THEN '6-14'
          WHEN EXTRACT(YEAR FROM AGE(tr.created_at, tr.date_of_birth)) BETWEEN 15 AND 24 THEN '15-24'
          WHEN EXTRACT(YEAR FROM AGE(tr.created_at, tr.date_of_birth)) BETWEEN 25 AND 64 THEN '25-64'
          WHEN EXTRACT(YEAR FROM AGE(tr.created_at, tr.date_of_birth)) >= 65 THEN '65+'
          ELSE NULL
        END as age_group
      FROM test_results tr
      JOIN test_result_pathogens trp ON trp.test_result_id = tr.id
      JOIN pathogens p ON p.id = trp.pathogen_id
      LEFT JOIN test_types tt ON tr.test_type_id = tt.id
      LEFT JOIN patients pat ON tr.patient_id = pat.id
      LEFT JOIN cities c ON tr.city_id = c.id
      LEFT JOIN districts d ON c.district_id = d.id
      LEFT JOIN regions r ON d.region_id = r.id
      WHERE ${doctorFilter || '1=1'}
        ${filterConditions}
    ) subquery
    WHERE age_group IS NOT NULL
    GROUP BY pathogen_name, age_group
    ORDER BY pathogen_name ASC, age_group ASC
  `;

  const result = await pool.query(query, params);

  return result.rows.map((row) => ({
    pathogenName: row.pathogen_name || 'Unknown',
    ageGroup: row.age_group,
    count: parseInt(row.count, 10) || 0,
  }));
};

/**
 * Get positive test result trends over time grouped by pathogen with filters
 * @param doctorId - Doctor ID (null = all doctors)
 * @param options - Filter options and time period (search, city, regionId, cityId, startDate, endDate, period)
 * @returns Array of objects with date, pathogen name, and count, plus total positive tests per period
 */
export const getPositiveTrendsByPathogensCounts = async (
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
  const pool = getDatabasePool();
  const { search, city, regionId, cityId, startDate, endDate, period = 'day' } = options;

  // Determine the date truncation function based on period
  const dateTrunc = period === 'week' ? 'week' : period === 'month' ? 'month' : 'day';

  // Determine date range - use startDate and endDate (required for generating series)
  if (!startDate || !endDate) {
    throw new Error('startDate and endDate are required for trends query');
  }

  const params: any[] = [];
  let paramIndex = 1;

  // Build WHERE clause for doctor filtering
  let doctorFilter = '';
  if (doctorId !== null) {
    doctorFilter = `tr.created_by = $${paramIndex}`;
    params.push(doctorId);
    paramIndex++;
  }

  // Build filter conditions string and add parameters
  const filterParams: string[] = [];
  let filterConditions = '';

  if (search) {
    filterConditions += `
      AND (
        c.name ILIKE $${paramIndex} OR
        tt.name ILIKE $${paramIndex} OR
        p.name ILIKE $${paramIndex} OR
        pat.identifier ILIKE $${paramIndex} OR
        tr.icp_number ILIKE $${paramIndex}
      )
    `;
    params.push(`%${search}%`);
    filterParams.push(`%${search}%`);
    paramIndex++;
  }

  if (city) {
    filterConditions += ` AND c.name ILIKE $${paramIndex}`;
    params.push(`%${city}%`);
    filterParams.push(`%${city}%`);
    paramIndex++;
  }

  // Add region filter (filter by region ID)
  if (regionId !== undefined) {
    filterConditions += ` AND r.id = $${paramIndex}`;
    params.push(regionId);
    filterParams.push(regionId.toString());
    paramIndex++;
  }

  // Add city filter (filter by city ID)
  if (cityId !== undefined) {
    filterConditions += ` AND c.id = $${paramIndex}`;
    params.push(cityId);
    filterParams.push(cityId.toString());
    paramIndex++;
  }

  if (startDate) {
    filterConditions += ` AND tr.created_at >= $${paramIndex}`;
    params.push(startDate);
    filterParams.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    filterConditions += ` AND tr.created_at <= $${paramIndex}`;
    params.push(endDate);
    filterParams.push(endDate);
    paramIndex++;
  }

  // Generate date series based on period
  const dateSeriesStartParam = paramIndex;
  const dateSeriesEndParam = paramIndex + 1;
  params.push(startDate);
  params.push(endDate);
  paramIndex += 2;

  let dateSeriesQuery = '';
  if (period === 'day') {
    dateSeriesQuery = `SELECT generate_series(
      DATE_TRUNC('day', $${dateSeriesStartParam}::timestamp)::date,
      DATE_TRUNC('day', $${dateSeriesEndParam}::timestamp)::date,
      '1 day'::interval
    )::date as date`;
  } else if (period === 'week') {
    dateSeriesQuery = `SELECT generate_series(
      DATE_TRUNC('week', $${dateSeriesStartParam}::timestamp)::date,
      DATE_TRUNC('week', $${dateSeriesEndParam}::timestamp)::date,
      '1 week'::interval
    )::date as date`;
  } else {
    dateSeriesQuery = `SELECT generate_series(
      DATE_TRUNC('month', $${dateSeriesStartParam}::timestamp)::date,
      DATE_TRUNC('month', $${dateSeriesEndParam}::timestamp)::date,
      '1 month'::interval
    )::date as date`;
  }

  // Main query: cross join date series with pathogens, then left join with actual results
  // Note: pathogens_list and actual_data use the same filter conditions, so they share the same parameter indices
  // If there are no pathogens, we still want to show dates with total line, so we use a UNION to handle empty pathogens_list
  const query = `
    WITH date_series AS (${dateSeriesQuery}),
    pathogens_list AS (
      SELECT DISTINCT p.name as pathogen_name
      FROM test_results tr
      JOIN test_result_pathogens trp ON trp.test_result_id = tr.id
      JOIN pathogens p ON p.id = trp.pathogen_id
      LEFT JOIN cities c ON tr.city_id = c.id
      LEFT JOIN districts d ON c.district_id = d.id
      LEFT JOIN regions r ON d.region_id = r.id
      WHERE ${doctorFilter || '1=1'}
        ${filterConditions}
    ),
    actual_data AS (
      SELECT
        DATE_TRUNC('${dateTrunc}', tr.created_at)::date as date,
        p.name as pathogen_name,
        COUNT(*) as count
      FROM test_results tr
      JOIN test_result_pathogens trp ON trp.test_result_id = tr.id
      JOIN pathogens p ON p.id = trp.pathogen_id
      LEFT JOIN test_types tt ON tr.test_type_id = tt.id
      LEFT JOIN patients pat ON tr.patient_id = pat.id
      LEFT JOIN cities c ON tr.city_id = c.id
      LEFT JOIN districts d ON c.district_id = d.id
      LEFT JOIN regions r ON d.region_id = r.id
      WHERE ${doctorFilter || '1=1'}
        ${filterConditions}
      GROUP BY DATE_TRUNC('${dateTrunc}', tr.created_at)::date, p.name
    ),
    pathogen_data AS (
      SELECT
        ds.date,
        pl.pathogen_name,
        COALESCE(ad.count, 0) as count
      FROM date_series ds
      CROSS JOIN pathogens_list pl
      LEFT JOIN actual_data ad ON ds.date = ad.date AND pl.pathogen_name = ad.pathogen_name
    )
    SELECT
      date,
      pathogen_name,
      count
    FROM pathogen_data
    UNION ALL
    -- If pathogens_list is empty, still return dates with NULL pathogen_name for total calculation
    SELECT
      ds.date,
      NULL::varchar as pathogen_name,
      0 as count
    FROM date_series ds
    WHERE NOT EXISTS (SELECT 1 FROM pathogens_list)
    ORDER BY date ASC, pathogen_name ASC NULLS LAST
  `;

  const result = await pool.query(query, params);

  // Process results: group by pathogen and create total
  const byPathogen: Array<{ date: string; pathogenName: string; count: number }> = [];
  const totalByDate: Record<string, number> = {};

  result.rows.forEach((row) => {
    const date = row.date.toISOString().split('T')[0];
    const pathogenName = row.pathogen_name;
    const count = parseInt(row.count, 10) || 0;

    // Only add to byPathogen if pathogen_name is not NULL
    if (pathogenName) {
      byPathogen.push({
        date,
        pathogenName,
        count,
      });
    }

    // Accumulate total for this date (including NULL pathogen_name rows which represent empty state)
    totalByDate[date] = (totalByDate[date] || 0) + count;
  });

  // Get all unique dates from byPathogen (these come from the date_series, so all dates are included)
  const allDates = Array.from(new Set(byPathogen.map((item) => item.date))).sort();

  // Convert totalByDate to array, ensuring all dates are included (even if 0)
  const total = allDates.map((date) => ({
    date,
    count: totalByDate[date] || 0,
  }));

  return {
    byPathogen,
    total,
  };
};

/**
 * Get positive pathogen distribution by scope (Me, District, Region, Country)
 * @param doctorId - Doctor ID (to determine their location)
 * @param options - Filter options (startDate, endDate, regionId, cityId)
 * @returns Object with pathogen distributions for each scope level
 */
export const getPositivePathogenDistributionByScope = async (
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
  const pool = getDatabasePool();
  const { startDate, endDate, regionId, cityId } = options;

  // First, get the doctor's location (district and region)
  const doctorQuery = `
    SELECT 
      u.id,
      c_user.id as city_id,
      c_user.district_id,
      d.region_id
    FROM users u
    LEFT JOIN cities c_user ON u.city_id = c_user.id
    LEFT JOIN districts d ON c_user.district_id = d.id
    WHERE u.id = $1
  `;
  const doctorResult = await pool.query(doctorQuery, [doctorId]);
  
  if (doctorResult.rows.length === 0) {
    throw new Error('Doctor not found');
  }

  const doctorRow = doctorResult.rows[0];
  const doctorDistrictId = doctorRow.district_id;
  const doctorRegionId = doctorRow.region_id;

  // Determine filter values (use provided or doctor's default)
  const filterRegionId = regionId !== undefined ? regionId : doctorRegionId;
  const filterCityId = cityId !== undefined ? cityId : null;

  // If cityId provided, get its district and region
  let cityDistrictId: number | null = null;
  let cityRegionId: number | null = null;

  if (filterCityId) {
    const cityInfoQuery = `
      SELECT c.district_id, d.region_id
      FROM cities c
      LEFT JOIN districts d ON c.district_id = d.id
      WHERE c.id = $1
    `;
    const cityInfoResult = await pool.query(cityInfoQuery, [filterCityId]);
    if (cityInfoResult.rows.length > 0) {
      cityDistrictId = cityInfoResult.rows[0].district_id;
      cityRegionId = cityInfoResult.rows[0].region_id;
    }
  }

  // Determine scope filters:
  // - District: 
  //   - If cityId provided: use city's district
  //   - If regionId provided (but no city): aggregate all districts in that region
  //   - Otherwise: use doctor's district
  // - Region: use city's region if cityId provided, else use filterRegionId (provided or doctor's)
  // - Country: always all doctors (no filters)
  let districtWhereClause: string;
  let districtParams: any[];

  if (filterCityId) {
    // City selected: show that city's district
    districtWhereClause = 'd.id = $1';
    districtParams = cityDistrictId ? [cityDistrictId] : [];
  } else if (regionId !== undefined && regionId !== null) {
    // Region selected (but no city): aggregate all districts in that region
    districtWhereClause = 'r.id = $1';
    districtParams = [regionId];
  } else {
    // No region/city selected: use doctor's district
    districtWhereClause = 'd.id = $1';
    districtParams = doctorDistrictId ? [doctorDistrictId] : [];
  }

  const regionFilterId = filterCityId ? cityRegionId : filterRegionId;

  // Helper function to get pathogen distribution for a given scope
  const getDistributionForScope = async (
    whereClause: string,
    scopeParams: any[],
  ): Promise<Array<{ pathogenName: string; count: number; percentage: number }>> => {
    // Build date filter conditions with correct parameter indexing
    const allParams: any[] = [...scopeParams];
    let dateFilter = '';
    let paramIndex = scopeParams.length + 1;

    if (startDate) {
      dateFilter += ` AND tr.created_at >= $${paramIndex}`;
      allParams.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      dateFilter += ` AND tr.created_at <= $${paramIndex}`;
      allParams.push(endDate);
      paramIndex++;
    }

    const query = `
      WITH pathogen_counts AS (
        SELECT
          p.name as pathogen_name,
          COUNT(*) as count
        FROM test_results tr
        JOIN test_result_pathogens trp ON trp.test_result_id = tr.id
        JOIN pathogens p ON p.id = trp.pathogen_id
        LEFT JOIN cities c ON tr.city_id = c.id
        LEFT JOIN districts d ON c.district_id = d.id
        LEFT JOIN regions r ON d.region_id = r.id
        WHERE ${whereClause}
          ${dateFilter}
        GROUP BY p.name
      ),
      total_count AS (
        SELECT SUM(count) as total FROM pathogen_counts
      )
      SELECT
        pc.pathogen_name,
        pc.count,
        CASE 
          WHEN tc.total > 0 THEN ROUND((pc.count::numeric / tc.total::numeric * 100)::numeric, 2)
          ELSE 0
        END as percentage
      FROM pathogen_counts pc
      CROSS JOIN total_count tc
      ORDER BY pc.count DESC, pc.pathogen_name ASC
    `;

    const result = await pool.query(query, allParams);
    return result.rows.map((row) => ({
      pathogenName: row.pathogen_name || 'Unknown',
      count: parseInt(row.count, 10) || 0,
      percentage: parseFloat(row.percentage) || 0,
    }));
  };

  // Get distributions for each scope
  const [me, district, region, country] = await Promise.all([
    // Me: always current doctor only
    getDistributionForScope('tr.created_by = $1', [doctorId]),
    // District: use determined filter
    districtWhereClause && districtParams.length > 0
      ? getDistributionForScope(districtWhereClause, districtParams)
      : Promise.resolve([]),
    // Region: use filter or doctor's region
    regionFilterId
      ? getDistributionForScope('r.id = $1', [regionFilterId])
      : Promise.resolve([]),
    // Country: always all doctors (no filters applied)
    getDistributionForScope('1=1', []),
  ]);

  return {
    me,
    district,
    region,
    country,
  };
};

