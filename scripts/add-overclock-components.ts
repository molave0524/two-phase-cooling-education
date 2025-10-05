import { db } from '../src/db/index'
import { productComponents } from '../src/db/schema-pg'

async function addOverclockComponents() {
  try {
    console.log('Adding components to Cooling System Overclock...')

    // Add components to Cooling System Overclock
    const overclockComponents = await db.insert(productComponents).values([
      {
        parentProductId: 'cool_overclock_v1',
        componentProductId: 'pump_a02_v1', // Premium Pump Assembly A2
        quantity: 1,
        isRequired: true,
        isIncluded: true,
        displayOrder: 1,
      },
      {
        parentProductId: 'cool_overclock_v1',
        componentProductId: 'radi_r02_v1', // Performance Radiator R2 (360mm)
        quantity: 1,
        isRequired: true,
        isIncluded: true,
        displayOrder: 2,
      },
      {
        parentProductId: 'cool_overclock_v1',
        componentProductId: 'rgbc_c01_v1', // RGB Controller C1
        quantity: 1,
        isRequired: true,
        isIncluded: true,
        displayOrder: 3,
      },
    ]).returning()

    console.log('Added components to Cooling System Overclock:', overclockComponents.length)
    console.log('✅ Successfully added overclock product components')
    process.exit(0)
  } catch (error) {
    console.error('Error adding overclock components:', error)
    process.exit(1)
  }
}

addOverclockComponents()
