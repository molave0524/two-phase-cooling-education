import { db, products } from '../src/db'

async function testInsert() {
  try {
    const testProduct = {
      id: 'test_' + Date.now(),
      name: 'Test Product - DEV Insert',
      slug: 'test-product-dev-insert-' + Date.now(),
      sku: 'TST-TEST-001-V01',
      skuPrefix: 'TST',
      skuCategory: 'TEST',
      skuProductCode: '001',
      skuVersion: 'V01',
      price: 99.99,
      description: 'Test product inserted via script to DEV database',
      shortDescription: 'Test product',
      features: ['Feature 1', 'Feature 2'],
      inStock: true,
      stockQuantity: 10,
      specifications: { test: 'value' },
      images: [
        {
          url: 'https://picsum.photos/seed/test/600/400',
          altText: 'Test Product',
          isPrimary: true,
        },
      ],
      categories: ['Test'],
      tags: ['test'],
      status: 'active' as const,
      isAvailableForPurchase: true,
      productType: 'standalone' as const,
    }

    const result = await db.insert(products).values(testProduct).returning()

    console.log('✅ Successfully inserted test product to DEV database:')
    console.log(`   ID: ${result[0].id}`)
    console.log(`   Name: ${result[0].name}`)
    console.log(`   Slug: ${result[0].slug}`)

    // Clean up - delete the test product
    await db.delete(products).where((fields, { eq }) => eq(fields.id, result[0].id))
    console.log('\n🧹 Test product deleted (cleanup)')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

testInsert()
