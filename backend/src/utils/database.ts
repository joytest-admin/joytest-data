/**
 * Database connection utility
 * Creates and manages PostgreSQL connection pool
 */

import { Pool, PoolConfig } from 'pg';
import { DatabasePool } from '../types/database.types';

let pool: DatabasePool | null = null;

/**
 * Initialize database connection pool
 * Uses DATABASE_URL connection string or individual config parameters
 * @returns Database pool instance
 */
export const getDatabasePool = (): DatabasePool => {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;

    let config: PoolConfig;

    if (connectionString) {
      // Use connection string if provided
      config = {
        connectionString,
        max: 20, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      };
    } else {
      // Fallback to individual config (for backwards compatibility or local dev)
      config = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME || 'joytest',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        max: 20, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      };
    }


    pool = new Pool(config);

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  return pool;
};

/**
 * Close database connection pool
 * Should be called on application shutdown
 */
export const closeDatabasePool = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};

