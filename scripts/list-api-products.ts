async function listProducts() {
  try {
    const response = await fetch('http://localhost:3000/api/products')
    const data = await response.json()

    console.log('=== API RESPONSE ANALYSIS ===\n')
    console.log('Total returned:', data.data.length)
    console.log('Meta:', JSON.stringify(data.meta, null, 2))

    console.log('\n=== SEARCHING FOR COOLANT ===')
    const coolant = data.data.find(
      (p: any) => p.sku === 'TPC-WCL-FLD-V01' || p.name.toLowerCase().includes('coolant')
    )

    if (coolant) {
      console.log('✅ FOUND Coolant:')
      console.log('   Name:', coolant.name)
      console.log('   SKU:', coolant.sku)
      console.log('   Product Type:', coolant.productType)
      console.log('   Available:', coolant.isAvailableForPurchase)
      console.log('   In Stock:', coolant.inStock)
    } else {
      console.log('❌ Coolant NOT found in API response')
    }

    console.log('\n=== COMPONENTS LIST (productType = "component") ===')
    const components = data.data.filter((p: any) => p.productType === 'component')
    console.log('Component count:', components.length)
    console.log()

    components.forEach((p: any, i: number) => {
      const num = (i + 1).toString().padStart(2, ' ')
      const hasKit = p.name.toLowerCase().includes('kit') ? ' [KIT]' : ''
      console.log(`${num}. ${p.name}${hasKit}`)
      console.log(`    SKU: ${p.sku}`)
    })

    console.log('\n=== STANDALONE BUILDS ===')
    const standalone = data.data.filter((p: any) => p.productType === 'standalone')
    console.log('Standalone count:', standalone.length)
    standalone.forEach((p: any) => {
      console.log(`  • ${p.name} (${p.sku})`)
    })
  } catch (error) {
    console.error('Error:', error)
  }
}

listProducts()
