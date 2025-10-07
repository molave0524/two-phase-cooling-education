import { db } from '../src/db'
import { sql } from 'drizzle-orm'
import * as fs from 'fs'
import * as path from 'path'

async function seedProducts() {
  try {
    console.log('Reading seed-products.sql...')
    const sqlFilePath = path.join(process.cwd(), 'seed-products.sql')
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8')

    console.log('Executing SQL...')
    await db.execute(sql.raw(sqlContent))

    console.log('✅ Successfully inserted 12 placeholder products!')
  } catch (error) {
    console.error('❌ Error seeding products:', error)
    process.exit(1)
  }
}

seedProducts()
