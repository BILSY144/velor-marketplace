// One-time (idempotent) data migration: renames the old generic category
// names to the new culture/craft taxonomy in lib/categories.ts, for every
// existing Product and SellerApplication row. Safe to run on every deploy --
// once a row already has the new name, the update is a no-op, so this can
// stay wired into the build permanently rather than needing to be removed
// after one run.
//
// William, 2026-07-19: migrating categories as part of the culture-based
// category rework (see lib/categories.ts LEGACY_CATEGORY_MIGRATION). Runs as
// part of the production build (see package.json "build" script), right
// after "prisma db push" -- applies automatically, no manual admin step.
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Kept in sync with lib/categories.ts LEGACY_CATEGORY_MIGRATION. Not
// imported directly since this script runs standalone via plain node,
// outside the Next.js/TypeScript build graph.
const RENAMES = {
  'Electronics': 'Precision Craft',
  'Home & Garden': 'Home Craft & Décor',
  'Beauty & Health': 'Light, Scent & Self',
  'Sports & Outdoors': 'Outdoor & Field Craft',
  'Jewellery & Watches': 'Adornment',
  'Pet Supplies': 'Artisan Pet Goods',
  'Musical Instruments': 'Instruments & Music',
  'Office & Stationery': 'Paper & Stationery',
  'Specialty & Gourmet Foods': 'Spice & Pantry Staples',
}

async function main() {
  let productsRenamed = 0
  for (const [oldName, newName] of Object.entries(RENAMES)) {
    const result = await prisma.product.updateMany({
      where: { category: oldName },
      data: { category: newName },
    })
    productsRenamed += result.count
  }

  // productCategories is a String[] on SellerApplication -- Prisma has no
  // "replace one element of an array" update, so fetch the rows that still
  // contain an old name and rewrite the whole array for each.
  const oldNames = Object.keys(RENAMES)
  const applications = await prisma.sellerApplication.findMany({
    where: { productCategories: { hasSome: oldNames } },
    select: { id: true, productCategories: true },
  })
  for (const app of applications) {
    const next = app.productCategories.map((c) => RENAMES[c] ?? c)
    await prisma.sellerApplication.update({
      where: { id: app.id },
      data: { productCategories: next },
    })
  }

  console.log(`[migrate-categories] renamed ${productsRenamed} product row(s), ${applications.length} application row(s)`)
}

main()
  .catch((err) => {
    // Non-fatal -- don't fail the whole deploy over a data-migration hiccup.
    // Old category strings still render fine site-wide, just under the old
    // name, until this script succeeds on a later deploy.
    console.error('[migrate-categories] failed:', err)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
