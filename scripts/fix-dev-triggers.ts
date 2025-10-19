/**
 * Fix DEV database triggers to use schema-qualified table names
 */

import { config as dotenvConfig } from 'dotenv'

dotenvConfig({ path: '.env.local' })

const postgres = require('postgres')

async function fixTriggers() {
  const devConnectionString = process.env.DEV_POSTGRES_URL

  if (!devConnectionString) {
    console.error('DEV_POSTGRES_URL not set')
    process.exit(1)
  }

  const sql = postgres(devConnectionString, {
    max: 1,
    onnotice: () => {},
  })

  try {
    console.log('\n=== Fixing DEV database triggers ===\n')

    // Drop existing triggers
    console.log('Dropping existing triggers...')
    await sql.unsafe(
      `DROP TRIGGER IF EXISTS check_circular_component_reference ON catalog.product_components`
    )
    console.log('  ✓ Dropped check_circular_component_reference trigger')

    await sql.unsafe(`DROP TRIGGER IF EXISTS check_component_depth ON catalog.product_components`)
    console.log('  ✓ Dropped check_component_depth trigger\n')

    // Drop existing functions
    console.log('Dropping existing functions...')
    await sql.unsafe(`DROP FUNCTION IF EXISTS public.prevent_circular_component_reference()`)
    console.log('  ✓ Dropped prevent_circular_component_reference function')

    await sql.unsafe(`DROP FUNCTION IF EXISTS public.prevent_deep_component_nesting()`)
    console.log('  ✓ Dropped prevent_deep_component_nesting function\n')

    // Create new functions with schema-qualified table names
    console.log('Creating new functions with schema-qualified table names...')

    await sql.unsafe(`
      CREATE OR REPLACE FUNCTION public.prevent_circular_component_reference()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $function$
      DECLARE
        depth_count INTEGER;
      BEGIN
        -- Check if adding this relationship would create a cycle
        WITH RECURSIVE component_tree AS (
          SELECT component_product_id, 1 as depth
          FROM catalog.product_components
          WHERE parent_product_id = NEW.component_product_id

          UNION ALL

          SELECT pc.component_product_id, ct.depth + 1
          FROM catalog.product_components pc
          INNER JOIN component_tree ct ON pc.parent_product_id = ct.component_product_id
          WHERE ct.depth < 10
        )
        SELECT COUNT(*) INTO depth_count
        FROM component_tree
        WHERE component_product_id = NEW.parent_product_id;

        IF depth_count > 0 THEN
          RAISE EXCEPTION 'Circular reference detected: % → %', NEW.parent_product_id, NEW.component_product_id;
        END IF;

        RETURN NEW;
      END;
      $function$
    `)
    console.log('  ✓ Created prevent_circular_component_reference function')

    await sql.unsafe(`
      CREATE OR REPLACE FUNCTION public.prevent_deep_component_nesting()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $function$
      DECLARE
        component_has_children BOOLEAN;
        grandchild_count INTEGER;
      BEGIN
        -- Check if the component being added has its own components
        SELECT EXISTS (
          SELECT 1 FROM catalog.product_components
          WHERE parent_product_id = NEW.component_product_id
        ) INTO component_has_children;

        IF component_has_children THEN
          -- Check if any of the component's children also have children
          SELECT COUNT(*) INTO grandchild_count
          FROM catalog.product_components pc1
          INNER JOIN catalog.product_components pc2 ON pc1.component_product_id = pc2.parent_product_id
          WHERE pc1.parent_product_id = NEW.component_product_id;

          IF grandchild_count > 0 THEN
            RAISE EXCEPTION 'Cannot add component: would create depth > 2';
          END IF;
        END IF;

        RETURN NEW;
      END;
      $function$
    `)
    console.log('  ✓ Created prevent_deep_component_nesting function\n')

    // Recreate triggers
    console.log('Creating triggers...')

    await sql.unsafe(`
      CREATE TRIGGER check_circular_component_reference
      BEFORE INSERT OR UPDATE ON catalog.product_components
      FOR EACH ROW
      EXECUTE FUNCTION prevent_circular_component_reference()
    `)
    console.log('  ✓ Created check_circular_component_reference trigger')

    await sql.unsafe(`
      CREATE TRIGGER check_component_depth
      BEFORE INSERT OR UPDATE ON catalog.product_components
      FOR EACH ROW
      EXECUTE FUNCTION prevent_deep_component_nesting()
    `)
    console.log('  ✓ Created check_component_depth trigger\n')

    console.log('✓ Triggers fixed successfully!')

    await sql.end()
    process.exit(0)
  } catch (error) {
    console.error('\n✗ Fix failed:', error)
    await sql.end()
    process.exit(1)
  }
}

fixTriggers()
