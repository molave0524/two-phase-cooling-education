import { db, products } from '../src/db'

async function checkDevDB() {
  try {
    const all = await db.select().from(products)
    console.log(`\n✅ Total products in DEV database: ${all.length}\n`)

    all.forEach(p => {
      console.log(`- ${p.name} (${p.slug})`)
    })

    if (all.length > 0) {
      console.log(`\n📸 Sample image URL:`)
      console.log(all[0].images[0]?.url || 'No image')
    }

    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

checkDevDB()
