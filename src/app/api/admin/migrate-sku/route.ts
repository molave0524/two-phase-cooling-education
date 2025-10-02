/**
 * Admin API to add SKU column to production database
 * Run this once by visiting /api/admin/migrate-sku
 */

import { NextResponse } from 'next/server'
import { db, products } from '@/db'
import { sql } from 'drizzle-orm'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Add SKU column if it doesn't exist (Postgres only)
    if (process.env.POSTGRES_URL) {
      try {
        await db.execute(sql`
          DO $$
          BEGIN
              IF NOT EXISTS (
                  SELECT 1 FROM information_schema.columns
                  WHERE table_name = 'products' AND column_name = 'sku'
              ) THEN
                  ALTER TABLE products ADD COLUMN sku TEXT NOT NULL DEFAULT '';
              END IF;
          END $$;
        `)

        // Update existing products with SKU values
        await db.execute(
          sql`UPDATE products SET sku = 'TPC-CASE-PRO-001' WHERE slug = 'thermosphere-pro-pc-case'`
        )
        await db.execute(
          sql`UPDATE products SET sku = 'TPC-GPU-ELITE-001' WHERE slug = 'cryoflow-elite-gpu-cooler'`
        )
        await db.execute(
          sql`UPDATE products SET sku = 'TPC-CPU-BASIC-001' WHERE slug = 'quantum-freeze-cpu-cooler'`
        )

        // Verify the changes
        const allProducts = await db.select().from(products)

        return NextResponse.json({
          success: true,
          message: 'SKU column added and products updated successfully',
          products: allProducts.map(p => ({ id: p.id, name: p.name, sku: p.sku })),
        })
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
          },
          { status: 500 }
        )
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'This migration only works with Postgres',
        },
        { status: 400 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}
