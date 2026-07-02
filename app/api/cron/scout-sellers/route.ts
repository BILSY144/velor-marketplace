import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ---------------------------------------------------------------------------
// Seller Scout Agent — runs every 6 hours via Vercel Cron
// Searches real seller platforms for prospects, scores them, deduplicates,
// and saves to SellerProspect table. NEVER fabricates data.
// ---------------------------------------------------------------------------

interface EtsyShop {
  shop_id: number;
  shop_name: string;
  title: string | null;
  announcement: string | null;
  transaction_sold_count: number;
  review_count: number;
  listing_active_count: number;
  digital_listing_count: number;
  location: string | null;
  url: string;
}

interface EtsyListing {
  listing_id: number;
  shop_id: number;
}

interface EtsyListingsResponse {
  count: number;
  results: EtsyListing[];
}

const SEARCH_TARGETS = [
  { keywords: 'handmade jewellery', category: 'Jewellery', sellerType: 'individual' },
  { keywords: 'handmade home decor', category: 'Home & Living', sellerType: 'individual' },
  { keywords: 'art prints illustration', category: 'Art & Prints', sellerType: 'individual' },
  { keywords: 'leather accessories handmade', category: 'Accessories', sellerType: 'individual' },
  { keywords: 'personalised gifts handmade', category: 'Gifts', sellerType: 'individual' },
  { keywords: 'natural skincare beauty handmade', category: 'Beauty', sellerType: 'individual' },
  { keywords: 'ceramic pottery handmade', category: 'Home & Living', sellerType: 'individual' },
  { keywords: 'silver gold jewellery handmade', category: 'Jewellery', sellerType: 'brand' },
  { keywords: 'luxury candles wax melt', category: 'Home & Living', sellerType: 'brand' },
  { keywords: 'vintage accessories clothing', category: 'Vintage', sellerType: 'individual' },
];

function scoreProspect(sales: number, reviews: number, listings: number): number {
  const salesScore = Math.min(40, Math.floor(sales / 100));
  const reviewScore = Math.min(30, Math.floor(reviews / 50));
  const listingScore = Math.min(20, Math.floor(listings / 5) * 2);
  return salesScore + reviewScore + listingScore + 10;
}

function extractEmail(text: string | null): string | null {
  if (!text) return null;
  const match = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : null;
}

function inferSellerType(shop: EtsyShop): 'individual' | 'brand' {
  if ((shop.transaction_sold_count ?? 0) > 2000 || (shop.listing_active_count ?? 0) > 100) return 'brand';
  return 'individual';
}

export async function GET() {
  const apiKey = process.env.ETSY_API_KEY;
  if (!apiKey) {
    await prisma.agentLog.create({
      data: { agentName: 'seller-scout', action: 'scout_skipped', status: 'warning',
        details: { reason: 'ETSY_API_KEY not configured — add it to Vercel environment variables' } },
    });
    return NextResponse.json({ ok: false, message: 'ETSY_API_KEY not configured' }, { status: 503 });
  }
  let totalProspected = 0, totalSkipped = 0, totalDuplicates = 0;
  const errors: string[] = [];
  for (const target of SEARCH_TARGETS) {
    try {
      const searchUrl = new URL('https://openapi.etsy.com/v3/application/listings/active');
      searchUrl.searchParams.set('keywords', target.keywords);
      searchUrl.searchParams.set('limit', '25');
      searchUrl.searchParams.set('sort_on', 'score');
      searchUrl.searchParams.set('sort_order', 'desc');
      const listingsRes = await fetch(searchUrl.toString(), {
        headers: { 'x-api-key': apiKey }, next: { revalidate: 0 },
      });
      if (!listingsRes.ok) { errors.push(`Etsy search failed for "${target.keywords}": HTTP ${listingsRes.status}`); continue; }
      const listingsData: EtsyListingsResponse = await listingsRes.json();
      const shopIds = [...new Set<number>((listingsData.results ?? []).map((l) => l.shop_id))];
      for (const shopId of shopIds.slice(0, 8)) {
        try {
          const shopRes = await fetch(`https://openapi.etsy.com/v3/application/shops/${shopId}`,
            { headers: { 'x-api-key': apiKey }, next: { revalidate: 0 } });
          if (!shopRes.ok) continue;
          const shop: EtsyShop = await shopRes.json();
          const storeUrl = `https://www.etsy.com/shop/${shop.shop_name}`;
          const exists = await prisma.sellerProspect.findFirst({ where: { storeUrl }, select: { id: true } });
          if (exists) { totalDuplicates++; continue; }
          const score = scoreProspect(shop.transaction_sold_count ?? 0, shop.review_count ?? 0, shop.listing_active_count ?? 0);
          if (score < 15) { totalSkipped++; continue; }
          await prisma.sellerProspect.create({
            data: {
              name: shop.shop_name, platform: 'etsy', storeUrl,
              email: extractEmail(shop.announcement),
              category: target.category, score,
              country: shop.location ?? null,
              sellerType: inferSellerType(shop),
              status: 'prospected',
              notes: [`Sales: ${shop.transaction_sold_count ?? 0}`, `Listings: ${shop.listing_active_count ?? 0}`, `Reviews: ${shop.review_count ?? 0}`, shop.title ? `Title: ${shop.title}` : null].filter(Boolean).join(' | '),
            },
          });
          totalProspected++;
        } catch (shopErr) { errors.push(`Shop ${shopId}: ${shopErr instanceof Error ? shopErr.message : 'unknown'}`); }
        await new Promise((r) => setTimeout(r, 150));
      }
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) { errors.push(`Search "${target.keywords}": ${err instanceof Error ? err.message : 'unknown'}`); }
  }
  const status = errors.length === 0 ? 'success' : totalProspected > 0 ? 'partial' : 'error';
  await prisma.agentLog.create({
    data: { agentName: 'seller-scout', action: 'scout_complete', status,
      details: { totalProspected, totalSkipped, totalDuplicates, errorCount: errors.length, errors: errors.slice(0, 10), sources: ['etsy'], searchTargets: SEARCH_TARGETS.length } },
  });
  return NextResponse.json({ ok: true, totalProspected, totalSkipped, totalDuplicates, errors });
}
