import { db, products } from '../src/db'
import { eq } from 'drizzle-orm'

async function addProductPlaceholderImages() {
  console.log('Adding placeholder images to products...')

  try {
    // Get all products
    const allProducts = await db.select().from(products)

    console.log(`Found ${allProducts.length} products`)

    // Define placeholder images for each product category
    const placeholders = {
      cooling_system: [
        'https://placehold.co/600x400/1e3a8a/ffffff?text=Two-Phase+Cooling',
        'https://placehold.co/600x400/1e40af/ffffff?text=Front+View',
        'https://placehold.co/600x400/1e40af/ffffff?text=Side+View',
        'https://placehold.co/600x400/0f172a/ffffff?text=Internal+Components',
      ],
      radiator: [
        'https://placehold.co/600x400/7c3aed/ffffff?text=Dual+Radiator',
        'https://placehold.co/600x400/6d28d9/ffffff?text=Front+View',
        'https://placehold.co/600x400/5b21b6/ffffff?text=Mounting+Hardware',
      ],
      reservoir: [
        'https://placehold.co/600x400/059669/ffffff?text=Reservoir+Tank',
        'https://placehold.co/600x400/047857/ffffff?text=Fill+Port',
        'https://placehold.co/600x400/065f46/ffffff?text=Drain+Port',
      ],
      cpu_block: [
        'https://placehold.co/600x400/dc2626/ffffff?text=CPU+Block',
        'https://placehold.co/600x400/b91c1c/ffffff?text=Top+View',
        'https://placehold.co/600x400/991b1b/ffffff?text=Mounting',
      ],
      tubing: [
        'https://placehold.co/600x400/ea580c/ffffff?text=Tubing+Kit',
        'https://placehold.co/600x400/c2410c/ffffff?text=Fittings',
        'https://placehold.co/600x400/9a3412/ffffff?text=Installation',
      ],
      coolant: [
        'https://placehold.co/600x400/0891b2/ffffff?text=Premium+Coolant',
        'https://placehold.co/600x400/0e7490/ffffff?text=Bottle',
      ],
      controller: [
        'https://placehold.co/600x400/4f46e5/ffffff?text=Controller+Hub',
        'https://placehold.co/600x400/4338ca/ffffff?text=Display',
        'https://placehold.co/600x400/3730a3/ffffff?text=Connections',
      ],
      fans: [
        'https://placehold.co/600x400/65a30d/ffffff?text=Fan+Pack',
        'https://placehold.co/600x400/4d7c0f/ffffff?text=RGB+Lighting',
        'https://placehold.co/600x400/3f6212/ffffff?text=Installation',
      ],
      gpu_block: [
        'https://placehold.co/600x400/be123c/ffffff?text=GPU+Block',
        'https://placehold.co/600x400/9f1239/ffffff?text=Backplate',
        'https://placehold.co/600x400/881337/ffffff?text=Thermal+Pads',
      ],
      distribution: [
        'https://placehold.co/600x400/475569/ffffff?text=Distribution+Plate',
        'https://placehold.co/600x400/334155/ffffff?text=Ports',
        'https://placehold.co/600x400/1e293b/ffffff?text=Installation',
      ],
      fittings: [
        'https://placehold.co/600x400/a16207/ffffff?text=Fitting+Set',
        'https://placehold.co/600x400/854d0e/ffffff?text=Types',
        'https://placehold.co/600x400/713f12/ffffff?text=O-Rings',
      ],
      maintenance: [
        'https://placehold.co/600x400/0d9488/ffffff?text=Prep+Kit',
        'https://placehold.co/600x400/0f766e/ffffff?text=Cleaning+Solution',
        'https://placehold.co/600x400/115e59/ffffff?text=Tools',
      ],
    }

    // Product category mapping
    const productCategories: Record<string, keyof typeof placeholders> = {
      'two-phase-cooling-system-pro': 'cooling_system',
      'arctic-flow-dual-radiator-kit': 'radiator',
      'frostbyte-reservoir-tank': 'reservoir',
      'thermalmax-cpu-block': 'cpu_block',
      'chillstream-tubing-kit': 'tubing',
      'hydroforce-premium-coolant': 'coolant',
      'silentflow-controller-hub': 'controller',
      'arcticbreeze-fan-pack': 'fans',
      'cryocore-gpu-block': 'gpu_block',
      'flowmaster-distribution-plate': 'distribution',
      'quickconnect-fitting-set': 'fittings',
      'ultraclean-prep-kit': 'maintenance',
    }

    // Update each product
    for (const product of allProducts) {
      const category = productCategories[product.slug]

      if (category) {
        const productPlaceholders = placeholders[category]

        // Create image objects with alt text
        const images = productPlaceholders.map((url, index) => ({
          url,
          altText: `${product.name} - Image ${index + 1}`,
          isPrimary: index === 0,
        }))

        console.log(`Updating ${product.name} with ${images.length} placeholder images`)

        await db
          .update(products)
          .set({ images: images as any })
          .where(eq(products.id, product.id))

        console.log(`✓ Updated ${product.name}`)
      } else {
        console.log(`⚠ No category mapping for ${product.slug}`)
      }
    }

    console.log('\n✅ All products updated with placeholder images!')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }

  process.exit(0)
}

addProductPlaceholderImages()
