import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireCronSecret } from '@/lib/cronAuth';

// ---------------------------------------------------------------------------
// Global Seller Scout Agent -- runs every 6 hours via Vercel Cron
// Sources: Etsy, eBay (multi-market), Google Custom Search, Bing Web Search,
//          Brave Search
//
// REBUILT 2026-07-08 (William): Velor recruits real makers of authentic
// CULTURAL goods -- country + maker on every listing -- never factory /
// dropship product lines and never service businesses (hotels, restaurants,
// agencies, tours, clinics...). Every target below is a craft + country
// query tied to the six culture-reel categories on the homepage (Ceramics &
// porcelain, Rugs/cloth & thread, The world's kitchen, Adornment, Tea/
// coffee & pantry, Light/scent & self) and to lib/specialities.ts. Coverage
// is weighted toward the Global South and East per standing instruction --
// Morocco, Turkey, India, Peru, Mexico, Vietnam, Thailand, Indonesia, Ghana,
// Ethiopia, Uzbekistan, Nepal, Ecuador, Sri Lanka, Kenya -- alongside a few
// Western craft traditions that are equally origin-specific (Japan, Italy,
// Portugal, Poland, Greece). Every Google/Bing query gets a shared negative
// suffix (see NEGATIVE_SUFFIX below) that excludes marketplaces, B2B
// wholesale directories, AND service/hospitality businesses. NEVER fabricates
// data.
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

// ââ Etsy types âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
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

// ââ eBay types âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
interface EbayTokenResponse { access_token: string; }
interface EbaySeller { username: string; feedbackScore: number; feedbackPercentage: string; }
interface EbayItemSummary { seller?: EbaySeller; title: string; itemWebUrl: string; }
interface EbaySearchResponse { itemSummaries?: EbayItemSummary[]; }

// ââ Web search types (Google + Bing) âââââââââââââââââââââââââââââââââââââââââ
interface GoogleItem { title: string; link: string; displayLink: string; snippet: string; }
interface GoogleSearchResponse { items?: GoogleItem[]; }
interface BingWebPage { name: string; url: string; displayUrl: string; snippet: string; }
interface BingSearchResponse { webPages?: { value?: BingWebPage[] }; }

// ââ Etsy search targets (global â all niches, all sizes) âââââââââââââââââââââ
const ETSY_TARGETS = [
  // Ceramics & porcelain
  { keywords: 'moroccan tagine pottery handmade ceramic', category: 'Ceramics & porcelain' },
  { keywords: 'talavera pottery mexican handmade ceramic', category: 'Ceramics & porcelain' },
  { keywords: 'japanese kintsugi ceramic pottery handmade', category: 'Ceramics & porcelain' },
  { keywords: 'turkish iznik ceramic tile handmade', category: 'Ceramics & porcelain' },
  { keywords: 'polish boleslawiec pottery stoneware handmade', category: 'Ceramics & porcelain' },
  { keywords: 'vietnamese lacquerware handmade bowl tray', category: 'Ceramics & porcelain' },
  { keywords: 'portuguese azulejo tile handmade ceramic', category: 'Ceramics & porcelain' },
  // Rugs, cloth & thread
  { keywords: 'turkish kilim rug handwoven vintage wool', category: 'Rugs, cloth & thread' },
  { keywords: 'moroccan berber rug handwoven wool authentic', category: 'Rugs, cloth & thread' },
  { keywords: 'peruvian alpaca poncho scarf handwoven', category: 'Rugs, cloth & thread' },
  { keywords: 'ghana kente cloth handwoven authentic', category: 'Rugs, cloth & thread' },
  { keywords: 'uzbek ikat silk fabric handwoven suzani', category: 'Rugs, cloth & thread' },
  { keywords: 'indonesian batik handmade fabric authentic', category: 'Rugs, cloth & thread' },
  { keywords: 'indian block print handmade textile natural dye', category: 'Rugs, cloth & thread' },
  { keywords: 'japanese furoshiki fabric handmade cotton', category: 'Rugs, cloth & thread' },
  { keywords: 'guatemalan huipil textile handwoven maya', category: 'Rugs, cloth & thread' },
  // The world's kitchen
  { keywords: 'japanese hand forged kitchen knife artisan', category: "The world's kitchen" },
  { keywords: 'turkish copper cookware handmade artisan', category: "The world's kitchen" },
  { keywords: 'mexican molcajete stone handmade', category: "The world's kitchen" },
  { keywords: 'moroccan tagine cooking pot ceramic handmade', category: "The world's kitchen" },
  { keywords: 'ethiopian jebena coffee pot handmade clay', category: "The world's kitchen" },
  // Adornment
  { keywords: 'indian brass jewellery handmade artisan', category: 'Adornment' },
  { keywords: 'moroccan berber silver jewellery handmade', category: 'Adornment' },
  { keywords: 'peruvian silver filigree jewellery handmade', category: 'Adornment' },
  { keywords: 'turkish evil eye nazar jewellery handmade', category: 'Adornment' },
  { keywords: 'baltic amber jewellery handmade poland', category: 'Adornment' },
  { keywords: 'maasai beaded jewellery handmade kenya', category: 'Adornment' },
  { keywords: 'indian kundan jewellery handmade traditional', category: 'Adornment' },
  // Tea, coffee & pantry
  { keywords: 'japanese matcha tea ceremony handmade set', category: 'Tea, coffee & pantry' },
  { keywords: 'turkish tea glass handmade copper set', category: 'Tea, coffee & pantry' },
  { keywords: 'ethiopian coffee ceremony set handmade', category: 'Tea, coffee & pantry' },
  { keywords: 'moroccan mint tea set handmade silver', category: 'Tea, coffee & pantry' },
  { keywords: 'sri lanka ceylon tea handmade artisan', category: 'Tea, coffee & pantry' },
  // Light, scent & self
  { keywords: 'moroccan argan oil handmade cosmetic natural', category: 'Light, scent & self' },
  { keywords: 'moroccan mosaic lamp handmade lantern brass', category: 'Light, scent & self' },
  { keywords: 'handmade incense india natural artisan', category: 'Light, scent & self' },
  { keywords: 'ghana shea butter handmade natural artisan', category: 'Light, scent & self' },
];

// ââ eBay search targets âââââââââââââââââââââââââââââââââââââââââââââââââââââââ
const EBAY_TARGETS = [
  // NOTE: category IDs are best-effort (Pottery & Glass 870, Jewelry &
  // Watches 10968, Home & Garden 11700, Kitchen Dining & Bar 20625, Health &
  // Beauty 26395) -- verify against eBay's Taxonomy API before this cron
  // runs against production credentials.
  { query: 'moroccan tagine handmade ceramic pottery', categoryId: '870', category: 'Ceramics & porcelain' },
  { query: 'talavera pottery mexican handmade', categoryId: '870', category: 'Ceramics & porcelain' },
  { query: 'japanese kintsugi pottery handmade', categoryId: '870', category: 'Ceramics & porcelain' },
  { query: 'turkish iznik ceramic tile handmade', categoryId: '870', category: 'Ceramics & porcelain' },
  { query: 'polish boleslawiec pottery stoneware handmade', categoryId: '870', category: 'Ceramics & porcelain' },
  { query: 'turkish kilim rug handwoven vintage wool', categoryId: '11700', category: 'Rugs, cloth & thread' },
  { query: 'moroccan berber rug handwoven wool', categoryId: '11700', category: 'Rugs, cloth & thread' },
  { query: 'peruvian alpaca poncho scarf handwoven', categoryId: '11700', category: 'Rugs, cloth & thread' },
  { query: 'ghana kente cloth authentic handwoven', categoryId: '11700', category: 'Rugs, cloth & thread' },
  { query: 'indonesian batik handmade fabric authentic', categoryId: '11700', category: 'Rugs, cloth & thread' },
  { query: 'japanese hand forged kitchen knife artisan', categoryId: '20625', category: "The world's kitchen" },
  { query: 'turkish copper cookware handmade artisan', categoryId: '20625', category: "The world's kitchen" },
  { query: 'mexican molcajete stone handmade', categoryId: '20625', category: "The world's kitchen" },
  { query: 'moroccan tagine cooking pot ceramic', categoryId: '20625', category: "The world's kitchen" },
  { query: 'indian brass jewelry handmade artisan', categoryId: '10968', category: 'Adornment' },
  { query: 'moroccan berber silver jewelry handmade', categoryId: '10968', category: 'Adornment' },
  { query: 'peruvian silver filigree jewelry handmade', categoryId: '10968', category: 'Adornment' },
  { query: 'turkish evil eye nazar jewelry handmade', categoryId: '10968', category: 'Adornment' },
  { query: 'baltic amber jewelry handmade poland', categoryId: '10968', category: 'Adornment' },
  { query: 'ethiopian jebena coffee pot handmade', categoryId: '20625', category: 'Tea, coffee & pantry' },
  { query: 'moroccan argan oil skincare handmade', categoryId: '26395', category: 'Light, scent & self' },
  { query: 'moroccan mosaic lantern lamp handmade', categoryId: '11700', category: 'Light, scent & self' },
];

// eBay marketplaces to search â global coverage
const EBAY_MARKETS = [
  { id: 'EBAY_GB', label: 'UK' },
  { id: 'EBAY_US', label: 'US' },
  { id: 'EBAY_AU', label: 'AU' },
  { id: 'EBAY_DE', label: 'DE' },
  { id: 'EBAY_FR', label: 'FR' },
  { id: 'EBAY_CA', label: 'CA' },
  { id: 'EBAY_IT', label: 'IT' },
  { id: 'EBAY_ES', label: 'ES' },
  { id: 'EBAY_NL', label: 'NL' },
  { id: 'EBAY_IE', label: 'IE' },
  { id: 'EBAY_PL', label: 'PL' },
  // Weighted East / Global South additions (William, 2026-07-08) -- verify
  // these marketplace IDs are still current in eBay's Buy API docs.
  { id: 'EBAY_HK', label: 'HK' },
  { id: 'EBAY_SG', label: 'SG' },
  { id: 'EBAY_MY', label: 'MY' },
  { id: 'EBAY_PH', label: 'PH' },
  { id: 'EBAY_TH', label: 'TH' },
];

// ââ Google search targets âââââââââââââââââââââââââââââââââââââââââââââââââââââ
const GOOGLE_TARGETS = [
  // Ceramics & porcelain
  { query: 'handmade moroccan tagine artisan ceramic shop buy', category: 'Ceramics & porcelain', market: 'ma' },
  { query: 'talavera pottery artisan workshop mexico shop buy', category: 'Ceramics & porcelain', market: 'mx' },
  { query: 'independent turkish iznik ceramic tile artisan shop', category: 'Ceramics & porcelain', market: 'tr' },
  { query: 'japanese pottery kintsugi artisan studio shop buy', category: 'Ceramics & porcelain', market: 'jp' },
  { query: 'polish boleslawiec pottery artisan shop buy online', category: 'Ceramics & porcelain', market: 'pl' },
  { query: 'vietnamese lacquerware artisan workshop shop buy', category: 'Ceramics & porcelain', market: 'vn' },
  // Rugs, cloth & thread
  { query: 'turkish kilim rug weaver artisan shop buy online', category: 'Rugs, cloth & thread', market: 'tr' },
  { query: 'moroccan berber rug weaver cooperative shop buy', category: 'Rugs, cloth & thread', market: 'ma' },
  { query: 'peruvian alpaca weaver artisan cooperative shop buy', category: 'Rugs, cloth & thread', market: 'pe' },
  { query: 'ghana kente cloth weaver artisan shop buy authentic', category: 'Rugs, cloth & thread', market: 'gh' },
  { query: 'uzbek ikat suzani textile artisan shop buy', category: 'Rugs, cloth & thread', market: 'uz' },
  { query: 'indonesian batik artisan workshop shop buy authentic', category: 'Rugs, cloth & thread', market: 'id' },
  { query: 'indian block print textile artisan shop buy natural dye', category: 'Rugs, cloth & thread', market: 'in' },
  // The world's kitchen
  { query: 'japanese hand forged knife blacksmith shop buy', category: "The world's kitchen", market: 'jp' },
  { query: 'turkish copper cookware artisan workshop shop buy', category: "The world's kitchen", market: 'tr' },
  { query: 'mexican molcajete stone carver artisan shop buy', category: "The world's kitchen", market: 'mx' },
  // Adornment
  { query: 'indian brass jewellery artisan workshop shop buy', category: 'Adornment', market: 'in' },
  { query: 'moroccan berber silver jewellery artisan shop buy', category: 'Adornment', market: 'ma' },
  { query: 'peruvian silver filigree jewellery artisan shop buy', category: 'Adornment', market: 'pe' },
  { query: 'turkish evil eye jewellery artisan shop buy handmade', category: 'Adornment', market: 'tr' },
  { query: 'baltic amber jewellery artisan shop buy poland', category: 'Adornment', market: 'pl' },
  { query: 'maasai beadwork jewellery artisan shop buy kenya', category: 'Adornment', market: 'ke' },
  // Tea, coffee & pantry
  { query: 'ethiopian coffee ceremony jebena artisan shop buy', category: 'Tea, coffee & pantry', market: 'et' },
  { query: 'japanese matcha tea artisan producer shop buy', category: 'Tea, coffee & pantry', market: 'jp' },
  { query: 'sri lanka ceylon tea estate small batch shop buy', category: 'Tea, coffee & pantry', market: 'lk' },
  { query: 'turkish delight artisan producer shop buy authentic', category: 'Tea, coffee & pantry', market: 'tr' },
  // Light, scent & self
  { query: 'moroccan argan oil cooperative artisan shop buy', category: 'Light, scent & self', market: 'ma' },
  { query: 'moroccan mosaic lantern artisan workshop shop buy', category: 'Light, scent & self', market: 'ma' },
  { query: 'ghana shea butter cooperative artisan shop buy', category: 'Light, scent & self', market: 'gh' },
  // Broader craft-cooperative / global searches
  { query: 'artisan cooperative handmade export shop buy fair trade', category: 'Adornment', market: 'global' },
  { query: 'independent ceramic studio artisan potter shop buy', category: 'Ceramics & porcelain', market: 'global' },
  { query: 'handwoven textile artisan cooperative shop buy global', category: 'Rugs, cloth & thread', market: 'global' },
];

// ââ Bing search targets (complementary â different phrasing to surface new sellers) ââ
const BING_TARGETS = [
  // Craft cooperatives seeking export / global buyers -- a genuine positive
  // signal for makers who ship internationally, distinct from western
  // wholesale-brand searches.
  { query: 'moroccan artisan cooperative handmade export wholesale', category: 'Light, scent & self' },
  { query: 'peruvian alpaca weaver cooperative export wholesale handmade', category: 'Rugs, cloth & thread' },
  { query: 'turkish kilim rug weaver export wholesale handmade', category: 'Rugs, cloth & thread' },
  { query: 'indian block print textile artisan export wholesale', category: 'Rugs, cloth & thread' },
  { query: 'ghana kente cloth weaver export wholesale handmade', category: 'Rugs, cloth & thread' },
  // Social-commerce discovery (same craft/country pairing)
  { query: 'moroccan tagine ceramic artisan instagram shop buy', category: 'Ceramics & porcelain' },
  { query: 'turkish evil eye jewellery artisan instagram shop buy', category: 'Adornment' },
  { query: 'peruvian silver filigree jewellery artisan instagram shop', category: 'Adornment' },
  { query: 'japanese pottery kintsugi artisan instagram shop buy', category: 'Ceramics & porcelain' },
  { query: 'ethiopian coffee ceremony jebena artisan shop buy online', category: 'Tea, coffee & pantry' },
  // Global-shipping independent craft shops
  { query: 'handmade ceramic pottery artisan online store worldwide shipping', category: 'Ceramics & porcelain' },
  { query: 'handwoven rug textile artisan online store worldwide shipping', category: 'Rugs, cloth & thread' },
  { query: 'artisan jewellery handmade online store worldwide shipping origin', category: 'Adornment' },
  { query: 'vietnamese lacquerware artisan shop buy online', category: 'Ceramics & porcelain' },
  { query: 'indonesian batik artisan shop buy online authentic', category: 'Rugs, cloth & thread' },
  { query: 'uzbek ikat suzani textile artisan shop buy online', category: 'Rugs, cloth & thread' },
  { query: 'nepali copper singing bowl artisan shop buy online', category: "The world's kitchen" },
  { query: 'ecuadorian panama hat weaver artisan shop buy online', category: 'Adornment' },
  { query: 'georgian felt wool artisan shop buy online handmade', category: 'Rugs, cloth & thread' },
  { query: 'moroccan zellige tile artisan workshop shop buy online', category: 'Ceramics & porcelain' },
];
// ââ Helpers ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

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
  // B2B wholesale / factory directories -- not real single-maker storefronts
  'alibaba.com', 'aliexpress.com', 'dhgate.com', 'made-in-china.com',
  'indiamart.com', 'globalsources.com', 'tradeindia.com', 'exportersindia.com',
  // Hospitality / service businesses -- outreach must never hit these
  'booking.com', 'tripadvisor.com', 'expedia.com', 'airbnb.com', 'opentable.com',
  'yelp.com',
];

// Appended to every Google/Bing query on top of any per-target exclusions.
// William, 2026-07-08: outreach was hitting "a lot of service based
// companies" -- this excludes hospitality/service businesses and B2B
// wholesale/factory directories at the query level, not just post-hoc via
// WEB_EXCLUDED_DOMAINS, so those results never get fetched in the first place.
const NEGATIVE_SUFFIX =
  ' -wholesale -factory -manufacturer -supplier -"trade only" -hotel -restaurant' +
  ' -tour -booking -consulting -agency -salon -clinic -rental -tripadvisor' +
  ' -site:etsy.com -site:ebay.com -site:amazon.com -site:pinterest.com' +
  ' -site:alibaba.com -site:dhgate.com';

function isExcluded(displayLink: string): boolean {
  const domain = displayLink.replace(/^www\./, '');
  return WEB_EXCLUDED_DOMAINS.some((ex) => domain.includes(ex));
}

// ââ Source: Etsy âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

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
      const shopIds = [...new Set((data.results ?? []).map((l) => l.shop_id))].slice(0, 20);
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

// ââ Source: eBay (multi-marketplace) âââââââââââââââââââââââââââââââââââââââââ

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

  // Rotate through markets â run 3 targets per market to stay within time budget
  for (const market of EBAY_MARKETS) {
    const targetsForMarket = EBAY_TARGETS.slice(0, 8); // 8 searches per market for higher-volume scouting
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
            : market.id === 'EBAY_PL' ? 'ebay.pl'
            : market.id === 'EBAY_HK' ? 'ebay.com.hk'
            : market.id === 'EBAY_MY' ? 'ebay.com.my'
            : market.id === 'EBAY_PH' ? 'ebay.ph'
            : market.id === 'EBAY_TH' ? 'ebay.co.th'
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
// ââ Source: Google Custom Search âââââââââââââââââââââââââââââââââââââââââââââ
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
      url.searchParams.set('q', target.query + NEGATIVE_SUFFIX);
      url.searchParams.set('num', '10');
      const res = await fetch(url.toString(), { next: { revalidate: 0 } });
      if (!res.ok) { errors.push(`Google "${target.query}": HTTP ${res.status}`); continue; }
      const data: GoogleSearchResponse = await res.json();
      for (const item of (data.items ?? [])) {
        const domain = item.displayLink?.replace(/^www\./, '');
        if (!domain || seenDomains.has(domain) || isExcluded(item.displayLink)) continue;
        seenDomains.add(domain);
        const name = (item.title?.split('|')[0]?.split('â')[0]?.split('-')[0]?.trim() ?? domain).slice(0, 100);
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

// ââ Source: Bing Web Search âââââââââââââââââââââââââââââââââââââââââââââââââââ
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
      url.searchParams.set('q', target.query + NEGATIVE_SUFFIX);
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
        const name = (page.name?.split('|')[0]?.split('â')[0]?.split('-')[0]?.trim() ?? domain).slice(0, 100);
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

// ââ Main Handler âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

// -- Brave Search: compliant independent-seller discovery (Shopify / DTC stores) --
const BRAVE_TARGETS: Array<{ query: string; category: string }> = [
  { query: '"powered by Shopify" moroccan ceramic tagine artisan store', category: 'Ceramics & porcelain' },
  { query: '"proudly powered by WooCommerce" japanese pottery artisan shop', category: 'Ceramics & porcelain' },
  { query: '"powered by Shopify" portuguese hand painted ceramics shop', category: 'Ceramics & porcelain' },
  { query: '"powered by Shopify" turkish iznik tile ceramics store', category: 'Ceramics & porcelain' },
  { query: '"powered by Shopify" mexican talavera pottery shop', category: 'Ceramics & porcelain' },
  { query: '"powered by Shopify" turkish handwoven kilim rug store', category: 'Rugs, cloth & thread' },
  { query: '"proudly powered by WooCommerce" peruvian alpaca textile shop', category: 'Rugs, cloth & thread' },
  { query: '"powered by Shopify" moroccan berber rug artisan store', category: 'Rugs, cloth & thread' },
  { query: '"powered by Shopify" guatemalan handwoven textile shop', category: 'Rugs, cloth & thread' },
  { query: '"proudly powered by WooCommerce" indian block print textile store', category: 'Rugs, cloth & thread' },
  { query: '"powered by Shopify" ghanaian kente cloth store', category: 'Rugs, cloth & thread' },
  { query: '"powered by Shopify" uzbek suzani embroidery shop', category: 'Rugs, cloth & thread' },
  { query: '"powered by Shopify" japanese matcha tea artisan store', category: "The world's kitchen" },
  { query: '"proudly powered by WooCommerce" moroccan spice souk shop', category: "The world's kitchen" },
  { query: '"powered by Shopify" turkish delight artisan food store', category: "The world's kitchen" },
  { query: '"powered by Shopify" ethiopian coffee roastery shop', category: "The world's kitchen" },
  { query: '"powered by Shopify" indian handmade jewellery artisan store', category: 'Adornment' },
  { query: '"proudly powered by WooCommerce" moroccan silver jewellery shop', category: 'Adornment' },
  { query: '"powered by Shopify" peruvian silver jewellery artisan store', category: 'Adornment' },
  { query: '"powered by Shopify" kenyan beaded jewellery shop', category: 'Adornment' },
  { query: '"powered by Shopify" turkish evil eye jewellery store', category: 'Adornment' },
  { query: '"powered by Shopify" polish amber jewellery artisan shop', category: 'Adornment' },
  { query: '"powered by Shopify" japanese green tea artisan store', category: 'Tea, coffee & pantry' },
  { query: '"proudly powered by WooCommerce" sri lankan ceylon tea shop', category: 'Tea, coffee & pantry' },
  { query: '"powered by Shopify" turkish coffee artisan store', category: 'Tea, coffee & pantry' },
  { query: '"powered by Shopify" ethiopian single origin coffee shop', category: 'Tea, coffee & pantry' },
  { query: '"powered by Shopify" moroccan argan oil artisan store', category: 'Light, scent & self' },
  { query: '"proudly powered by WooCommerce" indian ayurvedic skincare shop', category: 'Light, scent & self' },
  { query: '"powered by Shopify" ghanaian shea butter artisan store', category: 'Light, scent & self' },
  { query: '"powered by Shopify" moroccan rose water perfume shop', category: 'Light, scent & self' },
];

const BRAVE_BLOCKLIST = [
  'amazon.', 'ebay.', 'etsy.', 'walmart.', 'aliexpress.', 'alibaba.', 'wish.com',
  'temu.', 'target.com', 'bestbuy.', 'facebook.', 'instagram.', 'pinterest.',
  'tiktok.', 'youtube.', 'reddit.', 'wikipedia.', 'google.', 'bing.', 'yelp.',
  'trustpilot.', 'www.shopify.com', 'shopify.dev', 'apps.shopify.com',
  'dhgate.', 'made-in-china.', 'indiamart.', 'globalsources.', 'tradeindia.',
  'exportersindia.', 'booking.com', 'tripadvisor.', 'expedia.', 'airbnb.',
  'opentable.',
];

function braveCountry(host: string): string | null {
  if (host.endsWith('.co.uk') || host.endsWith('.uk')) return 'GB';
  if (host.endsWith('.ca')) return 'CA';
  if (host.endsWith('.com.au') || host.endsWith('.au')) return 'AU';
  if (host.endsWith('.de')) return 'DE';
  if (host.endsWith('.fr')) return 'FR';
  if (host.endsWith('.ie')) return 'IE';
  if (host.endsWith('.ma')) return 'MA';
  if (host.endsWith('.jp')) return 'JP';
  if (host.endsWith('.pt')) return 'PT';
  if (host.endsWith('.mx')) return 'MX';
  if (host.endsWith('.pe')) return 'PE';
  if (host.endsWith('.gt')) return 'GT';
  if (host.endsWith('.in')) return 'IN';
  if (host.endsWith('.gh')) return 'GH';
  if (host.endsWith('.uz')) return 'UZ';
  if (host.endsWith('.et')) return 'ET';
  if (host.endsWith('.lk')) return 'LK';
  if (host.endsWith('.ke')) return 'KE';
  if (host.endsWith('.tr')) return 'TR';
  if (host.endsWith('.pl')) return 'PL';
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
      url.searchParams.set('q', target.query + NEGATIVE_SUFFIX);
      url.searchParams.set('count', '20');
      const res = await fetch(url.toString(), {
        headers: { 'X-Subscription-Token': apiKey, Accept: 'application/json' },
        next: { revalidate: 0 },
      });
      if (!res.ok) { const b = await res.text(); errors.push('Brave [' + target.category + ']: HTTP ' + res.status + ' ' + b.slice(0, 180)); continue; }
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

export async function GET(req: NextRequest) {
  const authError = requireCronSecret(req);
  if (authError) return authError;

  const sources: Array<{ name: string; result: { candidates: ProspectCandidate[]; errors: string[] } }> = [];

  // Brave Search - compliant independent-seller discovery
  if (process.env.BRAVE_SEARCH_API_KEY) {
    sources.push({ name: 'brave', result: await scoutBrave(process.env.BRAVE_SEARCH_API_KEY) });
  } else {
    await prisma.agentLog.create({ data: { agentName: 'seller-scout', action: 'source_skipped', status: 'warning', details: { source: 'brave', reason: 'BRAVE_SEARCH_API_KEY not set' } } });
  }

  // Etsy â official Etsy Open API v3
  if (process.env.ETSY_API_KEY) {
    sources.push({ name: 'etsy', result: await scoutEtsy(process.env.ETSY_API_KEY) });
  } else {
    await prisma.agentLog.create({ data: { agentName: 'seller-scout', action: 'source_skipped', status: 'warning', details: { source: 'etsy', reason: 'ETSY_API_KEY not set' } } });
  }

  // eBay â official eBay Browse API (OAuth2), 8 global marketplaces
  if (process.env.EBAY_APP_ID && process.env.EBAY_CERT_ID) {
    sources.push({ name: 'ebay', result: await scoutEbay(process.env.EBAY_APP_ID, process.env.EBAY_CERT_ID) });
  } else {
    await prisma.agentLog.create({ data: { agentName: 'seller-scout', action: 'source_skipped', status: 'warning', details: { source: 'ebay', reason: 'EBAY_APP_ID or EBAY_CERT_ID not set' } } });
  }

  // Google â official Google Custom Search JSON API
  if (process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_CX) {
    sources.push({ name: 'google', result: await scoutGoogle(process.env.GOOGLE_SEARCH_API_KEY, process.env.GOOGLE_SEARCH_CX) });
  } else {
    await prisma.agentLog.create({ data: { agentName: 'seller-scout', action: 'source_skipped', status: 'warning', details: { source: 'google', reason: 'GOOGLE_SEARCH_API_KEY or GOOGLE_SEARCH_CX not set' } } });
  }

  // Bing â official Microsoft Bing Web Search API v7
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
