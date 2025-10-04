/**
 * Drizzle Kit Configuration
 * Configuration for migrations and database introspection
 * Using PostgreSQL for both local development and production
 */

import type { Config } from 'drizzle-kit'
import { config as dotenvConfig } from 'dotenv'
import { join } from 'path'

// Load environment variables from .env.local
dotenvConfig({ path: '.env.local' })

// Use PostgreSQL by default (matching server setup)
const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  'postgresql://postgres:postgres@localhost:5432/twophase_education_dev'

const config: Config = {
  schema: './src/db/schema-pg.ts',
  out: './drizzle/postgres',
  dialect: 'postgresql',
  dbCredentials: {
    url: connectionString,
  },
}

export default config
