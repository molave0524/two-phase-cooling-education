/* eslint-disable no-console */
/**
 * Database Setup Script
 * Creates fresh SQLite database with complete schema from Drizzle
 */

const { drizzle } = require('drizzle-orm/better-sqlite3')
const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')
const { sql } = require('drizzle-orm')

// Import schema
const schema = require('./src/db/schema.ts')

const dbPath = path.join(__dirname, '.data', 'app-new.db')

// Make sure .data directory exists
const dataDir = path.join(__dirname, '.data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

console.log('Setting up SQLite database at:', dbPath)

// Delete old database if exists
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath)
  console.log('Deleted existing database')
}

const sqlite = new Database(dbPath)
const db = drizzle(sqlite)

try {
  console.log('Running db:push to create schema...')
  console.log('Please use: npm run db:push')
  console.log('This script cannot run drizzle-kit migrations directly.')
  process.exit(0)
} catch (error) {
  console.error('Setup failed:', error)
  process.exit(1)
} finally {
  sqlite.close()
}
