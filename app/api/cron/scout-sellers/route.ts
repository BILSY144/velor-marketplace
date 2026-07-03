import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ---------------------------------------------------------------------------
// Global Seller Scout Agent — runs every 6 hours via Vercel Cron
// Sources: Etsy · eBay (multi-market) · Google Custom Search · Bing Web Search
// Scouts ALL sellers — individual makers, small businesses, and large brands —
// across every major market worldwide. NEVER fabricates data.
// ---------------------------------------------------------------------------

interface ProspectCandidate {
  name: string;
  platform: string;
  storeUrl: string;
  email: string | null;
  category: string;
  score: number;
  country: string | null;
  sellerType: 'individual' | 'brand';
  notes: string;
}

// ── Etsy types ───────────────────────────────────────────────────────────────
interface EtsyShop {
  shop_name: string;
  title: string | null;
  announcement: string | null;
  transaction_sold_count: number;
  review_count: number;
  listing_active_count: number;
  location: string | null;
}
interface EtsyListing { listing_id: number; shop_id: number; }
interface EtsyListingsResponse { results: EtsyListing[]; }

// ── eBay types ───────────────────────────────────────────────────────────────
interface EbayTokenResponse { access_token: string; }
interface EbaySeller { username: string; feedbackScore: number; feedbackPercentage: string; }
interface EbayItemSummary { seller?: EbaySeller; title: string; itemWebUrl: string; }
interface EbaySearchResponse { itemSummaries?: EbayItemSummary[]; }

// ── Web search types (Google + Bing) ─────────────────────────────────────────
interface GoogleItem { title: string; link: string; displayLink: string; snippet: string; }
interface GoogleSearchResponse { items?: GoogleItem[]; }
interface BingWebPage { name: string; url: string; displayUrl: string; snippet: string; }
interface BingSearchResponse { webPages?: { value?: BingWebPage[] }; }

// ── Etsy search targets (global — all niches, all sizes) ─────────────────────
const ETSY_TARGETS = [
  { keywords: 'handmade jewellery silver gold artisan', category: 'Jewellery' },
  { keywords: 'luxury jewellery brand fine jewelry', category: 'Jewellery' },
  { keywords: 'crystal gemstone healing jewellery', category: 'Jewellery' },
  { keywords: 'resin jewellery handmade art', category: 'Jewellery' },
  { keywords: 'handmade home decor ceramics pottery', category: 'Home & Living' },
  { keywords: 'luxury candles wax melt scented gift', category: 'Home & Living' },
  { keywords: 'handmade wooden accessories homeware', category: 'Home & Living' },
  { keywords: 'macrame wall art textile decor', category: 'Home & Living' },
  { keywords: 'stained glass art window panel', category: 'Art & Prints' },
  { keywords: 'art prints illustration watercolour', category: 'Art & Prints' },
  { keywords: 'hand painted original artwork', category: 'Art & Prints' },
  { keywords: 'pressed flower botanical art', category: 'Art & Prints' },
  { keywords: 'leather accessories handmade bag wallet', category: 'Accessories' },
  { keywords: 'enamel pin badge art accessory', category: 'Accessories' },
  { keywords: 'personalised gifts engraved custom name', category: 'Gifts' },
  { keywords: 'natural skincare organic handmade soap', category: 'Beauty' },
  { keywords: 'handmade bath beauty gift set luxury', category: 'Beauty' },
  { keywords: 'vintage accessories antique jewellery', category: 'Vintage' },
  { keywords: 'hand embroidery textile hoop art', category: 'Art & Prints' },
  { keywords: 'glass bead jewellery handmade lampwork', category: 'Jewellery' },
];

// ── eBay search targets ───────────────────────────────────────────────────────
const EBAY_TARGETS = [
  { query: 'handmade jewellery silver artisan gold', categoryId: '10968', category: 'Jewellery' },
  { query: 'luxury jewellery brand fine necklace bracelet', categoryId: '10968', category: 'Jewellery' },
  { query: 'handmade ceramic pottery vase homeware', categoryId: '870', category: 'Home & Living' },
  { query: 'luxury scented candle gift set premium', categoryId: '116722', category: 'Home & Living' },
  { query: 'vintage leather bag handbag designer', categoryId: '169291', category: 'Accessories' },
  { query: 'original art print illustration painting', categoryId: '550', category: 'Art & Prints' },
  { query: 'natural organic skincare handmade beauty', categoryId: '26395', category: 'Beauty' },
  { query: 'personalised engraved custom gift premium', categoryId: '16', category: 'Gifts' },
  { query: 'vintage antique jewellery brooch pin collectible', categoryId: '48579', category: 'Vintage' },
  { query: 'handmade textile knitwear accessories luxury', categoryId: '15724', category: 'Accessories' },
  { query: 'crystal gemstone jewellery healing stone', categoryId: '10968', category: 'Jewellery' },
  { query: 'woodwork handmade home decor gift artisan', categoryId: '183446', category: 'Home & Living' },
];

// eBay marketplaces to search — global coverage
const EBAY_MARKETS = [
  { id: 'EBAY_GB', label: 'UK' },
  { id: 'EBAY_US', label: 'US' },
  { id: 'EBAY_AU', label: 'AU' },
  { id: 'EBAY_DE', label: 'DE' },
  { id: 'EBAY_FR', label: 'FR' },
  { id: 'EBAY_CA', label: 'CA' },
  { id: 'EBAY_IT', label: 'IT' },
  { id: 'EBAY_ES', label: 'ES' },
];

// ── Google search targets ─────────────────────────────────────────────────────
const GOOGLE_TARGETS = [
  // UK
  { query: 'independent handmade jewellery brand uk shop buy', category: 'Jewellery', market: 'uk' },
  { query: 'luxury handmade candle brand independent uk shop', category: 'Home & Living', market: 'uk' },
  { query: 'independent natural skincare organic brand uk', category: 'Beauty', market: 'uk' },
  { query: 'handmade leather goods accessories independent uk brand', category: 'Accessories', market: 'uk' },
  { query: 'independent art prints illustration studio uk shop', category: 'Art & Prints', market: 'uk' },
  { query: 'independent personalised gifts brand uk shop online', category: 'Gifts', market: 'uk' },
  // US
  { query: 'independent handmade jewelry brand us shop buy online', category: 'Jewellery', market: 'us' },
  { query: 'small batch luxury candle brand us independent shop', category: 'Home & Living', market: 'us' },
  { query: 'independent skincare beauty brand us handmade organic', category: 'Beauty', market: 'us' },
  { query: 'independent art print studio shop us buy', category: 'Art & Prints', market: 'us' },
  { query: 'handmade accessories leather goods brand shop us', category: 'Accessories', market: 'us' },
  // Australia
  { query: 'independent handmade jewellery brand australia shop', category: 'Jewellery', market: 'au' },
  { query: 'independent artisan brand australia gifts shop buy', category: 'Gifts', market: 'au' },
  // Europe
  { query: 'independent handmade jewellery brand europe shop english', category: 'Jewellery', market: 'eu' },
  { query: 'luxury artisan home decor brand europe independent shop', category: 'Home & Living', market: 'eu' },
  // Canada
  { query: 'independent handmade brand canada shop buy online artisan', category: 'Accessories', market: 'ca' },
  // Shopify stores specifically
  { query: 'handmade jewellery luxury brand site:myshopify.com OR shopify', category: 'Jewellery', market: 'global' },
  { query: 'luxury candles accessories brand site:myshopify.com OR shopify', category: 'Home & Living', market: 'global' },
  { query: 'independent beauty skincare brand site:myshopify.com OR shopify', category: 'Beauty', market: 'global' },
  // Large brands looking for distribution
  { query: 'luxury lifestyle brand wholesale stockist independent retailer', category: 'Accessories', market: 'global' },
  { query: 'artisan food drink gift brand independent online shop', category: 'Gifts', market: 'global' },
  { query: 'independent vintage accessories shop online buy', category: 'Vintage', market: 'global' },
  { query: 'ceramic pottery studio independent shop handmade global', category: 'Home & Living', market: 'global' },
  { query: 'independent illustration art studio print shop buy', category: 'Art & Prints', market: 'global' },
  { query: 'premium wellness beauty brand independent online shop', category: 'Beauty', market: 'global' },
];

// ── Bing search targets (complementary — different phrasing to surface new sellers) ──
const BING_TARGETS = [
  // Wholesale and B2B brands
  { query: 'handmade jewellery brand wholesale trade stockist wanted', category: 'Jewellery' },
  { query: 'luxury candle brand uk wholesale trade stockist', category: 'Home & Living' },
  { query: 'artisan skincare beauty brand wholesale uk trade', category: 'Beauty' },
  { query: 'handmade accessories leather brand wholesale trade', category: 'Accessories' },
  // Social commerce
  { query: 'handmade jewellery brand instagram shop link bio buy', category: 'Jewellery' },
  { query: 'small business handmade gifts uk buy instagram shop', category: 'Gifts' },
  { query: 'independent art prints shop buy online artist', category: 'Art & Prints' },
  // Global markets
  { query: 'handmade jewellery artisan brand online store worldwide shipping', category: 'Jewellery' },
  { query: 'independent homeware decor brand global shipping buy', category: 'Home & Living' },
  { query: 'artisan food gift brand luxury uk online buy', category: 'Gifts' },
  // More niches
  { query: 'handmade glass art studio shop buy online', category: 'Art & Prints' },
  { query: 'independent luxury home fragrance brand online shop', category: 'Home & Living' },
  { query: 'crystal mineral gemstone shop independent brand buy', category: 'Jewellery' },
  { query: 'vintage antique shop online buy independent', category: 'Vintage' },
  { query: 'sustainable eco brand accessories gifts handmade shop', category: 'Gifts' },
  { query: 'handmade ceramic tableware pottery brand shop buy', category: 'Home & Living' },
  { query: 'independent wellbeing wellness brand uk shop buy', category: 'Beauty' },
  { query: 'luxury stationery paper goods independent brand shop', category: 'Gifts' },
  { query: 'handmade resin art jewellery home decor shop', category: 'Art & Prints' },
  { query: 'artisan woodwork furniture accessories brand buy online', category: 'Home & Living' },
];
// ── Helpers ──────────────────────────────────────────────────────────────────

function extractEmail(text: string | null): string | null {
  if (!text) return null;
  const m = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  return m ? m[0] : null;
}

function scoreEtsy(sales: number, reviews: number, listings: number): number {
  return Math.min(40, Math.floor(sales / 100)) +
    Math.min(30, Math.floor(reviews / 50)) +
    Math.min(20, Math.floor(listings / 5) * 2) + 10;
}

function scoreEbay(feedbackScore: number, feedbackPct: number): number {
  return Math.min(50, Math.floor(feedbackScore / 100)) +
    (feedbackPct >= 99 ? 30 : feedbackPct >= 97 ? 20 : feedbackPct >= 95 ? 10 : 0) + 10;
}

const WEB_EXCLUDED_DOMAINS = [
  'etsy.com', 'ebay.com', 'ebay.co.uk', 'amazon.com', 'amazon.co.uk', 'amazon.com.au',
  'pinterest.com', 'instagram.com', 'facebook.com', 'tiktok.com', 'reddit.com',
  'youtube.com', 'twitter.com', 'x.com', 'wikipedia.org', 'trustpilot.com',
  'notonthehighstreet.com', 'folksy.com', 'depop.com', 'vinted.co.uk',
  'bing.com', 'google.com', 'gov.uk', 'bbc.co.uk', 'theguardian.com',
];

function isExcluded(displayLink: string): boolean {
  const domain = displayLink.replace(/^www\./, '');
  return WEB_EXCLUDED_DOMAINS.some((ex) => domain.includes(ex));
}

// ── Source: Etsy ─────────────────────────────────────────────────────────────

async function scoutEtsy(
  apiKey: string
): Promise<{ candidates: ProspectCandidate[]; errors: string[] }> {
  const candidates: ProspectCandidate[] = [];
  const errors: string[] = [];
  for (const target of ETSY_TARGETS) {
    try {
      const url = new URL('https://openapi.etsy.com/v3/application/listings/active');
      url.searchParams.set('keywords', target.keywords);
      url.searchParams.set('limit', '25');
      url.searchParams.set('sort_on', 'score');
      url.searchParams.set('sort_order', 'desc');
      const res = await fetch(url.toString(), { headers: { 'x-api-key': apiKey }, next: { revalidate: 0 } });
      if (!res.ok) { errors.push(`Etsy "${target.keywords}": HTTP ${res.status}`); continue; }
      const data: EtsyListingsResponse = await res.json();
      const shopIds = [...new Set((data.results ?? []).map((l) => l.shop_id))].slice(0, 8);
      for (const shopId of shopIds) {
        try {
          const shopRes = await fetch(
            `https://openapi.etsy.com/v3/application/shops/${shopId}`,
            { headers: { 'x-api-key': apiKey }, next: { revalidate: 0 } }
          );
          if (!shopRes.ok) continue;
          const shop: EtsyShop = await shopRes.json();
          const score = scoreEtsy(shop.transaction_sold_count ?? 0, shop.review_count ?? 0, shop.listing_active_count ?? 0);
          if (score < 12) continue;
          const sellerType: 'individual' | 'brand' =
            (shop.transaction_sold_count ?? 0) > 2000 || (shop.listing_active_count ?? 0) > 100
              ? 'brand' : 'individual';
          candidates.push({
            name: shop.shop_name,
            platform: 'etsy',
            storeUrl: `https://www.etsy.com/shop/${shop.shop_name}`,
            email: extractEmail(shop.announcement),
            category: target.category,
            score,
            country: shop.location ?? null,
            sellerType,
            notes: `Sales: ${shop.transaction_sold_count ?? 0} | Listings: ${shop.listing_active_count ?? 0} | Reviews: ${shop.review_count ?? 0}`,
          });
          await new Promise((r) => setTimeout(r, 120));
        } catch (e) { errors.push(`Etsy shop ${shopId}: ${e instanceof Error ? e.message : 'error'}`); }
      }
      await new Promise((r) => setTimeout(r, 400));
    } catch (e) { errors.push(`Etsy "${target.keywords}": ${e instanceof Error ? e.message : 'error'}`); }
  }
  return { candidates, errors };
}

// ── Source: eBay (multi-marketplace) ─────────────────────────────────────────

async function scoutEbay(
  appId: string, certId: string
): Promise<{ candidates: ProspectCandidate[]; errors: string[] }> {
  const candidates: ProspectCandidate[] = [];
  const errors: string[] = [];

  // Get OAuth2 token (one token covers all eBay marketplaces)
  let token: string;
  try {
    const creds = Buffer.from(`${appId}:${certId}`).toString('base64');
    const tokenRes = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
      method: 'POST',
      headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope',
      next: { revalidate: 0 },
    });
    if (!tokenRes.ok) { errors.push(`eBay auth: HTTP ${tokenRes.status}`); return { candidates, errors }; }
    const td: EbayTokenResponse = await tokenRes.json();
    token = td.access_token;
  } catch (e) { errors.push(`eBay auth: ${e instanceof Error ? e.message : 'error'}`); return { candidates, errors }; }

  const seenSellers = new Set<string>();

  // Rotate through markets — run 3 targets per market to stay within time budget
  for (const market of EBAY_MARKETS) {
    const targetsForMarket = EBAY_TARGETS.slice(0, 3); // 3 searches per market = 24 total
    for (const target of targetsForMarket) {
      try {
        const url = new URL('https://api.ebay.com/buy/browse/v1/item_summary/search');
        url.searchParams.set('q', target.query);
        url.searchParams.set('category_ids', target.categoryId);
        url.searchParams.set('limit', '50');
        url.searchParams.set('filter', 'buyingOptions:{FIXED_PRICE}');
        const res = await fetch(url.toString(), {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-EBAY-C-MARKETPLACE-ID': market.id,
          },
          next: { revalidate: 0 },
        });
        if (!res.ok) { errors.push(`eBay ${market.id} "${target.query}": HTTP ${res.status}`); continue; }
        const data: EbaySearchResponse = await res.json();
        for (const item of (data.itemSummaries ?? [])) {
          const seller = item.seller;
          const sellerKey = `${market.id}:${seller?.username}`;
          if (!seller?.username || seenSellers.has(sellerKey)) continue;
          seenSellers.add(sellerKey);
          const pct = parseFloat(seller.feedbackPercentage ?? '0');
          const score = scoreEbay(seller.feedbackScore ?? 0, pct);
          if (score < 12) continue;
          const sellerType: 'individual' | 'brand' = (seller.feedbackScore ?? 0) > 500 ? 'brand' : 'individual';
          // Use market-appropriate eBay domain
          const ebayDomain = market.id === 'EBAY_GB' ? 'ebay.co.uk'
            : market.id === 'EBAY_AU' ? 'ebay.com.au'
            : market.id === 'EBAY_DE' ? 'ebay.de'
            : market.id === 'EBAY_FR' ? 'ebay.fr'
            : market.id === 'EBAY_IT' ? 'ebay.it'
            : market.id === 'EBAY_ES' ? 'ebay.es'
            : market.id === 'EBAY_CA' ? 'ebay.ca'
            : 'ebay.com';
          candidates.push({
            name: seller.username,
            platform: `ebay-${market.label.toLowerCase()}`,
            storeUrl: `https://www.${ebayDomain}/usr/${seller.username}`,
            email: null,
            category: target.category,
            score,
            country: market.label,
            sellerType,
            notes: `Feedback: ${seller.feedbackScore ?? 0} | Rating: ${seller.feedbackPercentage ?? '0'}% | Market: ${market.id}`,
          });
        }
        await new Promise((r) => setTimeout(r, 250));
      } catch (e) { errors.push(`eBay ${market.id} "${target.query}": ${e instanceof Error ? e.message : 'error'}`); }
    }
  }
  return { candidates, errors };
}
// ── Source: Google Custom Search ─────────────────────────────────────────────
// Uses Google's official Custom Search JSON API only. Legal: authenticated API
// call returning public web results. Emails extracted only from publicly listed
// text in search snippets that sellers have voluntarily published.

async function scoutGoogle(
  apiKey: string, cx: string
): Promise<{ candidates: ProspectCandidate[]; errors: string[] }> {
  const candidates: ProspectCandidate[] = [];
  const errors: string[] = [];
  const seenDomains = new Set<string>();
  for (const target of GOOGLE_TARGETS) {
    try {
      const url = new URL('https://www.googleapis.com/customsearch/v1');
      url.searchParams.set('key', apiKey);
      url.searchParams.set('cx', cx);
      url.searchParams.set('q', target.query + ' -site:etsy.com -site:ebay.com -site:amazon.com -site:pinterest.com');
      url.searchParams.set('num', '10');
      const res = await fetch(url.toString(), { next: { revalidate: 0 } });
      if (!res.ok) { errors.push(`Google "${target.query}": HTTP ${res.status}`); continue; }
      const data: GoogleSearchResponse = await res.json();
      for (const item of (data.items ?? [])) {
        const domain = item.displayLink?.replace(/^www\./, '');
        if (!domain || seenDomains.has(domain) || isExcluded(item.displayLink)) continue;
        seenDomains.add(domain);
        const name = (item.title?.split('|')[0]?.split('–')[0]?.split('-')[0]?.trim() ?? domain).slice(0, 100);
        candidates.push({
          name,
          platform: 'independent',
          storeUrl: `https://${item.displayLink}`,
          email: extractEmail(item.snippet),
          category: target.category,
          score: 25,
          country: target.market !== 'global' ? target.market.toUpperCase() : null,
          sellerType: 'brand',
          notes: `Google discovery (${target.market}): ${item.snippet?.slice(0, 120) ?? ''}`,
        });
      }
      await new Promise((r) => setTimeout(r, 180));
    } catch (e) { errors.push(`Google "${target.query}": ${e instanceof Error ? e.message : 'error'}`); }
  }
  return { candidates, errors };
}

// ── Source: Bing Web Search ───────────────────────────────────────────────────
// Uses Microsoft Bing Web Search API v7 only. Legal: authenticated official API.
// Surfaces independent sellers not indexed prominently in Google.

async function scoutBing(
  apiKey: string
): Promise<{ candidates: ProspectCandidate[]; errors: string[] }> {
  const candidates: ProspectCandidate[] = [];
  const errors: string[] = [];
  const seenDomains = new Set<string>();
  for (const target of BING_TARGETS) {
    try {
      const url = new URL('https://api.bing.microsoft.com/v7.0/search');
      url.searchParams.set('q', target.query + ' -site:etsy.com -site:ebay.com -site:amazon.com');
      url.searchParams.set('count', '20');
      url.searchParams.set('responseFilter', 'Webpages');
      const res = await fetch(url.toString(), {
        headers: { 'Ocp-Apim-Subscription-Key': apiKey },
        next: { revalidate: 0 },
      });
      if (!res.ok) { errors.push(`Bing "${target.query}": HTTP ${res.status}`); continue; }
      const data: BingSearchResponse = await res.json();
      for (const page of (data.webPages?.value ?? [])) {
        const displayLink = page.displayUrl?.split('/')[0] ?? '';
        const domain = displayLink.replace(/^www\./, '');
        if (!domain || seenDomains.has(domain) || isExcluded(displayLink)) continue;
        seenDomains.add(domain);
        const name = (page.name?.split('|')[0]?.split('–')[0]?.split('-')[0]?.trim() ?? domain).slice(0, 100);
        candidates.push({
          name,
          platform: 'independent',
          storeUrl: `https://${displayLink}`,
          email: extractEmail(page.snippet),
          category: target.category,
          score: 22,
          country: null,
          sellerType: 'brand',
          notes: `Bing discovery: ${page.snippet?.slice(0, 120) ?? ''}`,
        });
      }
      await new Promise((r) => setTimeout(r, 150));
    } catch (e) { errors.push(`Bing "${target.query}": ${e instanceof Error ? e.message : 'error'}`); }
  }
  return { candidates, errors };
}

// ── Main Handler ─────────────────────────────────────────────────────────────

// -- Brave Search: compliant independent-seller discovery (Shopify / DTC stores) --
const BRAVE_TARGETS: Array<{ query: string; category: string }> = [
  { query: '"powered by Shopify" electronics gadgets store', category: 'Electronics' },
  { query: '"powered by Shopify" home decor store', category: 'Home & Garden' },
  { query: 'independent skincare brand online shop', category: 'Beauty & Health' },
  { query: '"powered by Shopify" toys and games store', category: 'Toys & Games' },
  { query: 'independent pet supplies online store', category: 'Pet Supplies' },
  { query: '"powered by Shopify" handmade jewellery store', category: 'Jewellery & Watches' },
];

const BRAVE_BLOCKLIST = [
  'amazon.', 'ebay.', 'etsy.', 'walmart.', 'aliexpress.', 'alibaba.', 'wish.com',
  'temu.', 'target.com', 'bestbuy.', 'facebook.', 'instagram.', 'pinterest.',
  'tiktok.', 'youtube.', 'reddit.', 'wikipedia.', 'google.', 'bing.', 'yelp.',
  'trustpilot.', 'www.shopify.com', 'shopify.dev', 'apps.shopify.com',
];

function braveCountry(host: string): string | null {
  if (host.endsWith('.co.uk') || host.endsWith('.uk')) return 'GB';
  if (host.endsWith('.ca')) return 'CA';
  if (host.endsWith('.com.au') || host.endsWith('.au')) return 'AU';
  if (host.endsWith('.de')) return 'DE';
  if (host.endsWith('.fr')) return 'FR';
  if (host.endsWith('.ie')) return 'IE';
  return null;
}

async function scoutBrave(
  apiKey: string
): Promise<{ candidates: ProspectCandidate[]; errors: string[] }> {
  const candidates: ProspectCandidate[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const target of BRAVE_TARGETS) {
    try {
      const url = new URL('https://api.search.brave.com/res/v1/web/search');
      url.searchParams.set('q', target.query);
      url.searchParams.set('count', '20');
      const res = await fetch(url.toString(), {
        headers: { 'X-Subscription-Token': apiKey, Accept: 'application/json' },
        next: { revalidate: 0 },
      });
      if (!res.ok) { errors.push('Brave [' + target.category + ']: HTTP ' + res.status); continue; }
      const data = await res.json();
      const results = (data && data.web && data.web.results) || [];
      for (const r of results) {
        let host = '';
        try { host = new URL(r.url).hostname.replace(/^www\./, ''); } catch { continue; }
        if (!host || seen.has(host)) continue;
        if (BRAVE_BLOCKLIST.some((b) => host.includes(b))) continue;
        seen.add(host);
        const isShopify = host.endsWith('myshopify.com') || /shopify/i.test(r.description || '');
        const rawName = String(r.title || host).split(/[|\u2013\u2014\-\u00b7]/)[0].trim();
        candidates.push({
          name: (rawName || host).slice(0, 120),
          platform: isShopify ? 'shopify' : 'web',
          storeUrl: 'https://' + host,
          email: null,
          category: target.category,
          score: 55 + (isShopify ? 15 : 0),
          country: braveCountry(host),
          sellerType: 'brand',
          notes: String(r.description || '').slice(0, 240),
        });
      }
    } catch (e) {
      errors.push('Brave [' + target.category + ']: ' + (e instanceof Error ? e.message : String(e)));
    }
  }
  return { candidates, errors };
}

export async function GET() {
  const sources: Array<{ name: string; result: { candidates: ProspectCandidate[]; errors: string[] } }> = [];

  // Brave Search - compliant independent-seller discovery
  if (process.env.BRAVE_SEARCH_API_KEY) {
    sources.push({ name: 'brave', result: await scoutBrave(process.env.BRAVE_SEARCH_API_KEY) });
  } else {
    await prisma.agentLog.create({ data: { agentName: 'seller-scout', action: 'source_skipped', status: 'warning', details: { source: 'brave', reason: 'BRAVE_SEARCH_API_KEY not set' } } });
  }

  // Etsy — official Etsy Open API v3
  if (process.env.ETSY_API_KEY) {
    sources.push({ name: 'etsy', result: await scoutEtsy(process.env.ETSY_API_KEY) });
  } else {
    await prisma.agentLog.create({ data: { agentName: 'seller-scout', action: 'source_skipped', status: 'warning', details: { source: 'etsy', reason: 'ETSY_API_KEY not set' } } });
  }

  // eBay — official eBay Browse API (OAuth2), 8 global marketplaces
  if (process.env.EBAY_APP_ID && process.env.EBAY_CERT_ID) {
    sources.push({ name: 'ebay', result: await scoutEbay(process.env.EBAY_APP_ID, process.env.EBAY_CERT_ID) });
  } else {
    await prisma.agentLog.create({ data: { agentName: 'seller-scout', action: 'source_skipped', status: 'warning', details: { source: 'ebay', reason: 'EBAY_APP_ID or EBAY_CERT_ID not set' } } });
  }

  // Google — official Google Custom Search JSON API
  if (process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_CX) {
    sources.push({ name: 'google', result: await scoutGoogle(process.env.GOOGLE_SEARCH_API_KEY, process.env.GOOGLE_SEARCH_CX) });
  } else {
    await prisma.agentLog.create({ data: { agentName: 'seller-scout', action: 'source_skipped', status: 'warning', details: { source: 'google', reason: 'GOOGLE_SEARCH_API_KEY or GOOGLE_SEARCH_CX not set' } } });
  }

  // Bing — official Microsoft Bing Web Search API v7
  if (process.env.BING_SEARCH_API_KEY) {
    sources.push({ name: 'bing', result: await scoutBing(process.env.BING_SEARCH_API_KEY) });
  } else {
    await prisma.agentLog.create({ data: { agentName: 'seller-scout', action: 'source_skipped', status: 'warning', details: { source: 'bing', reason: 'BING_SEARCH_API_KEY not set' } } });
  }

  // Aggregate, deduplicate within batch, then check against DB
  let totalProspected = 0, totalDuplicates = 0, totalSkipped = 0;
  const allErrors: string[] = [];
  const seenUrls = new Set<string>();
  const sourceStats: Record<string, number> = {};

  for (const { name, result } of sources) {
    allErrors.push(...result.errors.map((e) => `[${name}] ${e}`));
    let sourceCount = 0;
    for (const c of result.candidates) {
      if (seenUrls.has(c.storeUrl)) { totalDuplicates++; continue; }
      seenUrls.add(c.storeUrl);
      try {
        const exists = await prisma.sellerProspect.findFirst({ where: { storeUrl: c.storeUrl }, select: { id: true } });
        if (exists) { totalDuplicates++; continue; }
        await prisma.sellerProspect.create({
          data: {
            name: c.name, platform: c.platform, storeUrl: c.storeUrl,
            email: c.email, category: c.category, score: c.score,
            country: c.country, sellerType: c.sellerType,
            status: 'prospected', notes: c.notes,
          },
        });
        totalProspected++;
        sourceCount++;
      } catch (e) {
        allErrors.push(`[${name}] DB save ${c.storeUrl}: ${e instanceof Error ? e.message : 'error'}`);
        totalSkipped++;
      }
    }
    sourceStats[name] = sourceCount;
  }

  const status = allErrors.length === 0 ? 'success' : totalProspected > 0 ? 'partial' : 'error';

  await prisma.agentLog.create({
    data: {
      agentName: 'seller-scout', action: 'scout_complete', status,
      details: {
        totalProspected, totalDuplicates, totalSkipped,
        sourceStats,
        sources: sources.map((s) => s.name),
        errorCount: allErrors.length,
        errors: allErrors.slice(0, 20),
      },
    },
  });

  return NextResponse.json({ ok: true, totalProspected, totalDuplicates, totalSkipped, sourceStats, errors: allErrors });
}
