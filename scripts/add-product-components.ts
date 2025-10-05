import { db } from '../src/db/index'
import { productComponents } from '../src/db/schema-pg'

async function addProductComponents() {
  try {
    console.log('Adding product components...')

    // Add components to Cooling System Pro
    const proComponents = await db.insert(productComponents).values([
      {
        parentProductId: 'cool_pro_v1',
        componentProductId: 'pump_a02_v1',
        quantity: 1,
        isRequired: true,
        isIncluded: true,
        displayOrder: 1,
      },
      {
        parentProductId: 'cool_pro_v1',
        componentProductId: 'radi_r02_v1',
        quantity: 1,
        isRequired: true,
        isIncluded: true,
        displayOrder: 2,
      },
      {
        parentProductId: 'cool_pro_v1',
        componentProductId: 'rgbc_c01_v1',
        quantity: 1,
        isRequired: true,
        isIncluded: true,
        displayOrder: 3,
      },
    ]).returning()

    console.log('Added components to Cooling System Pro:', proComponents.length)

    // Add components to Cooling System Standard
    const stdComponents = await db.insert(productComponents).values([
      {
        parentProductId: 'cool_std_v1',
        componentProductId: 'pump_a01_v1',
        quantity: 1,
        isRequired: true,
        isIncluded: true,
        displayOrder: 1,
      },
      {
        parentProductId: 'cool_std_v1',
        componentProductId: 'radi_r01_v1',
        quantity: 1,
        isRequired: true,
        isIncluded: true,
        displayOrder: 2,
      },
      {
        parentProductId: 'cool_std_v1',
        componentProductId: 'rgbc_c01_v1',
        quantity: 1,
        isRequired: true,
        isIncluded: true,
        displayOrder: 3,
      },
    ]).returning()

    console.log('Added components to Cooling System Standard:', stdComponents.length)

    console.log('✅ Successfully added all product components')
    process.exit(0)
  } catch (error) {
    console.error('Error adding product components:', error)
    process.exit(1)
  }
}

addProductComponents()
