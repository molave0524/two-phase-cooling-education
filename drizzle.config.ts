/**
 * Drizzle Kit Configuration
 * Configuration for migrations and database introspection
 * Supports both PostgreSQL (production) and SQLite (local development)
 */

import type { Config } from 'drizzle-kit'
import { join } from 'path'

const usePostgres = process.env.POSTGRES_URL || process.env.DATABASE_URL?.startsWith('postgres')

const config: Config = usePostgres
  ? {
      schema: './src/db/schema-pg.ts',
      out: './drizzle/postgres',
      dialect: 'postgresql',
      dbCredentials: {
        url: process.env.POSTGRES_URL || process.env.DATABASE_URL!,
      },
    }
  : {
      schema: './src/db/schema.ts',
      out: './drizzle/sqlite',
      dialect: 'sqlite',
      dbCredentials: {
        url: process.env.DATABASE_PATH || join(process.cwd(), '.data', 'app.db'),
      },
    }

export default config
