/**
 * Database-related type definitions
 */

import { Pool, PoolClient } from 'pg';

/**
 * Database pool instance type
 */
export type DatabasePool = Pool;

/**
 * Database client type (for transactions)
 */
export type DatabaseClient = PoolClient;

/**
 * Query result row type
 */
export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

