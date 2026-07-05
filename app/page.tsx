'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Product = {
id: string
name: string
price: number
images?: string[]
image?: string
category?: string
seller?: { id: string; storeName: string; sellerBadge?: string | null }
reviews?: { rating: number }[]
_count?: { reviews: number }
}

type Seller = {
id: string
storeName: string
country?: string | null
sellerBadge?: string | null
_count?: { products: number }
products?: { id: string; title: string; price: number; images?: string[] }[]
}

const CATEGORIES = [
'Electronics', 'Fashion', 'Home & Garden', 'Beauty & Health',
'Sports & Outdoors', 'Jewellery & Watches', 'Toys & Games', 'Baby & Kids',
'Pet Supplies', 'Automotive', 'Books & Education', 'Art & Crafts',
'Office & Stationery', 'Travel & Luggage', 'Food & Grocery', 'Fitness & Gym',
]

const BADGES: Record<string, { label: string; color: string; bg: string }> = {
TOP_RATED: { label: 'Top Rated Seller', color: '#FFD54A', bg: 'rgba(255,213,74,0.12)' },
TRUSTED: { label: 'Trusted Seller', color: '#C7CDD6', bg: 'rgba(199,205,214,0.12)' },
ESTABLISHED: { label: 'Established Seller', color: '#CD8B5A', bg: 'rgba(205,139,90,0.12)' },
}

function money(n: number) {
return '£' + Number(n || 0).toFixed(2)
}

function Badge({ code }: { code?: string | null }) {
if (!code || !BADGES[code]) return null
const b = BADGES[code]
return (
<span
style={{
display: 'inline-block',
padding: '3px 10px',
borderRadius: 999,
fontSize: 11,
fontWeight: 700,
textTransform: 'uppercase',
letterSpacing: '0.04em',
color: b.color,
background: b.bg,
border: `1px solid ${b.color}55`,
}}
>
{b.label}
</span>
)
}

export default function Home() {
const [products, setProducts] = useState<Product[]>([])
const [sellers, setSellers] = useState<Seller[]>([])
type LiveCard = { id: string; title: string; roomName: string; status: string; sellerName: string; products: { images: string[] }[] }
const [liveStreams, setLiveStreams] = useState<LiveCard[]>([])

useEffect(() => {
fetch('/api/shop/products?limit=8')
.then((r) => r.json())
.then((d) => setProducts(Array.isArray(d.products) ? d.products : []))
.catch(() => {})
fetch('/api/sellers/featured')
.then((r) => r.json())
.then((d) => setSellers(Array.isArray(d.sellers) ? d.sellers : []))
.catch(() => {})
fetch('/api/live')
.then((r) => r.json())
.then((d) => setLiveStreams(Array.isArray(d.streams) ? d.streams.filter((x: LiveCard) => x.status === 'LIVE') : []))
.catch(() => {})
}, [])

const section: React.CSSProperties = { maxWidth: 1360, margin: '0 auto', padding: '0 24px' }
const h2: React.CSSProperties = {
fontFamily: 'var(--font-display)',
fontWeight: 800,
fontSize: 30,
letterSpacing: '-0.01em',
margin: 0,
}

return (
<main style={{ background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
{/* HERO */}
<section style={{ position: 'relative', overflow: 'hidden', borderBottom: '1px solid var(--border)' }}>
<div
style={{
position: 'absolute',
inset: 0,
background:
'radial-gradient(1100px 500px at 80% -10%, rgba(255,107,0,0.18), transparent 60%), radial-gradient(800px 500px at 0% 110%, rgba(0,230,118,0.10), transparent 55%)',
}}
/>
<div style={{ ...section, position: 'relative', padding: '86px 24px 92px' }}>
<div
style={{
display: 'inline-flex',
alignItems: 'center',
gap: 8,
padding: '6px 14px',
borderRadius: 999,
border: '1px solid var(--border)',
background: 'rgba(255,255,255,0.03)',
fontSize: 12.5,
letterSpacing: '0.05em',
textTransform: 'uppercase',
color: 'var(--muted)',
marginBottom: 22,
}}
>
<span style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--green)' }} />
The first fully AI-run marketplace
</div>

<h1
style={{
fontFamily: 'var(--font-display)',
fontWeight: 800,
fontSize: 'clamp(38px, 6vw, 68px)',
lineHeight: 1.04,
letterSpacing: '-0.02em',
margin: 0,
maxWidth: 900,
}}
>
A world of independent sellers.
<br />
<span style={{ color: 'var(--accent)' }}>Protected</span> every step of the way.
</h1>

<p style={{ color: 'var(--muted)', fontSize: 18, lineHeight: 1.6, maxWidth: 640, margin: '22px 0 34px' }}>
Buy from vetted sellers around the world with total confidence. Your payment is held
safely until you confirm your order arrived — and the whole marketplace is run,
monitored and protected by AI, around the clock.
</p>

<div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
<Link
href="/shop"
style={{
background: 'var(--accent)',
color: '#000',
fontWeight: 800,
fontSize: 15,
textDecoration: 'none',
padding: '15px 30px',
borderRadius: 999,
}}
>
Shop now
</Link>
<Link
href="/sell"
style={{
background: 'transparent',
color: 'var(--text)',
fontWeight: 700,
fontSize: 15,
textDecoration: 'none',
padding: '15px 30px',
borderRadius: 999,
border: '1px solid var(--border)',
}}
>
Start selling
</Link>
</div>
</div>
</section>

{/* TRUST STRIP */}
<section style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
<div
style={{
...section,
padding: '26px 24px',
display: 'grid',
gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
gap: 16,
}}
>
{[
['🛡️', 'Buyer protection', 'Funds are held until you confirm delivery.'],
['✔️', 'Verified & ranked sellers', 'Scored on real delivery performance.'],
['🔒', 'Secure Stripe checkout', 'Velor never sees your card details.'],
['🌍', 'Global marketplace', 'Independent sellers, one trusted account.'],
].map(([icon, t, d]) => (
<div key={t} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
<span style={{ fontSize: 20 }}>{icon}</span>
<div>
<div style={{ fontWeight: 700, fontSize: 14.5 }}>{t}</div>
<div style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.45 }}>{d}</div>
</div>
</div>
))}
</div>
</section>

<section style={{ ...section, padding: '32px 24px 20px' }}>
<div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
<span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ff3b3b', display: 'inline-block' }} />
<h2 style={h2}>Velor Live Shopping</h2>
</div>
<Link href="/live" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
See all live sellers →
</Link>
</div>
<p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 22px' }}>
Our Enterprise sellers, broadcasting live from anywhere in the world - a perk earned, not bought.
</p>
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
{Array.from({ length: 10 }).map((_, i) => {
const ls = liveStreams[i]
if (ls) {
return (
<Link
key={ls.id}
href={`/live/${ls.roomName}`}
style={{
display: 'block',
borderRadius: 14,
overflow: 'hidden',
background: 'var(--surface)',
border: '1px solid var(--border)',
textDecoration: 'none',
color: 'inherit',
}}
>
<div style={{ position: 'relative', aspectRatio: '3/4', background: '#111' }}>
<span
style={{
position: 'absolute',
top: 8,
left: 8,
background: '#ff3b3b',
color: '#fff',
fontSize: 10,
fontWeight: 700,
padding: '3px 8px',
borderRadius: 999,
zIndex: 1,
}}
>
LIVE
</span>
{ls.products?.[0]?.images?.[0] && (
<img
src={ls.products[0].images[0]}
alt=""
style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }}
/>
)}
</div>
<div style={{ padding: 8 }}>
<div style={{ fontSize: 10.5, color: 'var(--accent)', fontWeight: 700, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ls.sellerName}</div>
<div style={{ fontSize: 11.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ls.title}</div>
</div>
</Link>
)
}
return (
<div
key={`live-slot-${i}`}
style={{
borderRadius: 14,
overflow: 'hidden',
background: 'var(--surface)',
border: '1px dashed var(--border)',
display: 'flex',
flexDirection: 'column',
alignItems: 'center',
justifyContent: 'center',
gap: 6,
aspectRatio: '3/4',
color: 'var(--muted)',
}}
>
<span style={{ fontSize: 20, opacity: 0.5 }}>&#9679;</span>
<span style={{ fontSize: 11, textAlign: 'center', padding: '0 10px' }}>Live slot open</span>
</div>
)
})}
</div>
</section>{/* CATEGORIES */}
<section style={{ ...section, padding: '64px 24px 20px' }}>
<div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 22 }}>
<h2 style={h2}>Shop by category</h2>
<Link href="/shop" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
View all →
</Link>
</div>
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
{CATEGORIES.map((c) => (
<Link
key={c}
href={`/shop?category=${encodeURIComponent(c)}`}
style={{
display: 'block',
padding: '18px 18px',
borderRadius: 14,
background: 'var(--surface)',
border: '1px solid var(--border)',
color: 'var(--text)',
textDecoration: 'none',
fontWeight: 600,
fontSize: 14.5,
transition: 'border-color 0.15s',
}}
>
{c}
<div style={{ color: 'var(--accent)', fontSize: 13, marginTop: 6 }}>Browse →</div>
</Link>
))}
</div>
</section>

{/* TOP-RATED SELLERS */}
<section style={{ ...section, padding: '54px 24px 20px' }}>
<div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
<h2 style={h2}>Top-rated sellers</h2>
</div>
<p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 22px' }}>
Ranked by real delivery performance, reviews and reliability.
</p>
{sellers.length === 0 ? (
<div
style={{
border: '1px dashed var(--border)',
borderRadius: 16,
padding: '40px 24px',
textAlign: 'center',
color: 'var(--muted)',
}}
>
Our founding sellers are being onboarded now.{' '}
<Link href="/sell" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 700 }}>
Be one of the first →
</Link>
</div>
) : (
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
{sellers.map((s) => {
const thumb = s.products?.[0]?.images?.[0]
return (
<Link
key={s.id}
href={`/seller/${s.id}`}
style={{
display: 'block',
borderRadius: 16,
overflow: 'hidden',
background: 'var(--surface)',
border: '1px solid var(--border)',
textDecoration: 'none',
color: 'var(--text)',
}}
>
<div style={{ height: 120, background: '#141414', position: 'relative' }}>
{thumb ? (
<img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
) : (
<div
style={{
width: '100%',
height: '100%',
display: 'flex',
alignItems: 'center',
justifyContent: 'center',
fontFamily: 'var(--font-display)',
fontSize: 34,
fontWeight: 800,
color: 'var(--muted)',
}}
>
{s.storeName?.[0] || 'V'}
</div>
)}
</div>
<div style={{ padding: '14px 16px 16px' }}>
<div style={{ marginBottom: 8 }}>
<Badge code={s.sellerBadge} />
</div>
<div style={{ fontWeight: 700, fontSize: 16 }}>{s.storeName}</div>
<div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
{(s._count?.products ?? 0)} products{s.country ? ` · ${s.country}` : ''}
</div>
</div>
</Link>
)
})}
</div>
)}
</section>

{/* FEATURED PRODUCTS */}
<section style={{ ...section, padding: '54px 24px 20px' }}>
<div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 22 }}>
<h2 style={h2}>Fresh on Velor</h2>
<Link href="/shop" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
Browse all →
</Link>
</div>
{products.length === 0 ? (
<div
style={{
border: '1px dashed var(--border)',
borderRadius: 16,
padding: '40px 24px',
textAlign: 'center',
color: 'var(--muted)',
}}
>
New listings are arriving as our first sellers go live. Check back very soon.
</div>
) : (
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
{products.map((p) => {
const img = p.images?.[0] || p.image
const count = p._count?.reviews ?? p.reviews?.length ?? 0
const avg =
p.reviews && p.reviews.length
? p.reviews.reduce((a, r) => a + r.rating, 0) / p.reviews.length
: 0
return (
<Link
key={p.id}
href={`/shop/${p.id}`}
style={{
display: 'block',
borderRadius: 16,
overflow: 'hidden',
background: 'var(--surface)',
border: '1px solid var(--border)',
textDecoration: 'none',
color: 'var(--text)',
}}
>
<div style={{ aspectRatio: '1 / 1', background: '#141414' }}>
{img ? (
<img src={img} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
) : (
<div
style={{
width: '100%',
height: '100%',
display: 'flex',
alignItems: 'center',
justifyContent: 'center',
color: 'var(--muted)',
fontSize: 13,
}}
>
No image
</div>
)}
</div>
<div style={{ padding: '13px 14px 15px' }}>
<div style={{ fontWeight: 600, fontSize: 14.5, lineHeight: 1.3, minHeight: 38 }}>{p.name}</div>
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
<span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17 }}>{money(p.price)}</span>
{count > 0 && (
<span style={{ color: 'var(--muted)', fontSize: 12.5 }}>
★ {avg.toFixed(1)} ({count})
</span>
)}
</div>
{p.seller?.storeName && (
<div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 6 }}>{p.seller.storeName}</div>
)}
</div>
</Link>
)
})}
</div>
)}
</section>

{/* BUYER PROTECTION EXPLAINER */}
<section style={{ borderTop: '1px solid var(--border)', marginTop: 54, background: 'var(--surface)' }}>
<div style={{ ...section, padding: '60px 24px' }}>
<h2 style={{ ...h2, textAlign: 'center' }}>How Velor protects your money</h2>
<p style={{ color: 'var(--muted)', fontSize: 15, textAlign: 'center', maxWidth: 620, margin: '12px auto 40px' }}>
You should never pay and hope. On Velor, the seller only gets paid once you have your order.
</p>
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 18 }}>
{[
['1', 'You pay securely', 'Your payment is taken by Stripe and held safely by Velor — not sent to the seller.'],
['2', 'Seller ships, you receive', 'The seller dispatches your order and delivery is confirmed by tracking.'],
['3', 'Then the seller is paid', 'Funds are only released after delivery and a protection window — and never while a return or dispute is open.'],
].map(([n, t, d]) => (
<div
key={n}
style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px 22px' }}
>
<div
style={{
width: 36,
height: 36,
borderRadius: 999,
background: 'var(--accent)',
color: '#000',
fontFamily: 'var(--font-display)',
fontWeight: 800,
display: 'flex',
alignItems: 'center',
justifyContent: 'center',
marginBottom: 14,
}}
>
{n}
</div>
<div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{t}</div>
<div style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.55 }}>{d}</div>
</div>
))}
</div>
</div>
</section>

{/* SELL ON VELOR */}
<section style={{ ...section, padding: '68px 24px 20px' }}>
<div style={{ textAlign: 'center', marginBottom: 40 }}>
<h2 style={h2}>Sell on Velor</h2>
<p style={{ color: 'var(--muted)', fontSize: 15, maxWidth: 620, margin: '12px auto 0' }}>
List for free and reach buyers worldwide. Upgrade any time for lower commission and more listings.
</p>
</div>
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18, maxWidth: 1040, margin: '0 auto' }}>
{[
{ name: 'Starter', price: 'Free', comm: '15% commission', feat: ['Up to 20 listings', 'Seller dashboard', 'Buyer protection built in'], hl: false, intent: 'starter', cta: 'Get started' },
{ name: 'Pro', price: '£49/mo', comm: '8% commission', feat: ['200 listings', 'Free custom storefront', 'Priority search placement', 'Advanced analytics'], hl: true, intent: 'pro', cta: 'Choose Pro' },
{ name: 'Enterprise', price: '£199/mo', comm: '5% commission', feat: ['Unlimited listings', 'Everything in Pro', 'Dedicated account manager', 'Full API access', 'Free custom storefront'], hl: false, intent: 'enterprise', cta: 'Choose Enterprise' },
].map((t) => (
<Link
key={t.name}
href={`/dashboard/upgrade/${t.intent}`}
style={{
display: 'block',
background: 'var(--surface)',
border: t.hl ? '1px solid var(--accent)' : '1px solid var(--border)',
borderRadius: 18,
padding: '26px 24px',
position: 'relative',
color: 'inherit',
textDecoration: 'none',
cursor: 'pointer',
}}
>
{t.hl && (
<span
style={{
position: 'absolute',
top: -11,
left: 24,
background: 'var(--accent)',
color: '#000',
fontSize: 11,
fontWeight: 800,
padding: '3px 10px',
borderRadius: 999,
}}
>
Most popular
</span>
)}
<div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>{t.name}</div>
<div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '8px 0 2px' }}>
<span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30 }}>{t.price}</span>
</div>
<div style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 14, marginBottom: 16 }}>{t.comm}</div>
<ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: 18 }}>
{t.feat.map((f) => (
<li key={f} style={{ color: 'var(--muted)', fontSize: 14, padding: '6px 0', display: 'flex', gap: 8 }}>
<span style={{ color: 'var(--green)' }}>✔</span> {f}
</li>
))}
</ul>
<div
style={{
color: t.hl ? '#000' : 'var(--text)',
background: t.hl ? 'var(--accent)' : 'transparent',
border: t.hl ? 'none' : '1px solid var(--border)',
borderRadius: 999,
padding: '10px 0',
textAlign: 'center',
fontWeight: 700,
fontSize: 14,
}}
>
{t.cta} →
</div>
</Link>
))}
</div>
<p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', margin: '22px auto 0', maxWidth: 620 }}>
Payouts are automatic: funds release to your bank after delivery is confirmed — 15 days for new sellers,
72 hours once you build a trusted track record.
</p>
<div style={{ textAlign: 'center', marginTop: 26 }}>
<Link
href="/sell"
style={{
background: 'var(--accent)',
color: '#000',
fontWeight: 800,
fontSize: 15,
textDecoration: 'none',
padding: '15px 34px',
borderRadius: 999,
}}
>
Start selling today
</Link>
</div>
</section>

{/* CLOSING */}
<section style={{ ...section, padding: '70px 24px 90px' }}>
<div
style={{
borderRadius: 22,
border: '1px solid var(--border)',
background:
'radial-gradient(600px 300px at 100% 0%, rgba(255,107,0,0.16), transparent 60%), var(--surface)',
padding: 'clamp(32px, 6vw, 60px)',
textAlign: 'center',
}}
>
<h2 style={{ ...h2, fontSize: 'clamp(26px, 4vw, 40px)' }}>A marketplace that runs itself.</h2>
<p style={{ color: 'var(--muted)', fontSize: 16, maxWidth: 600, margin: '14px auto 30px' }}>
Discovery, protection, sellers and support — all operated by AI, so buying and selling
just works. Join the marketplace built for what commerce becomes next.
</p>
<div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
<Link
href="/shop"
style={{ background: 'var(--accent)', color: '#000', fontWeight: 800, fontSize: 15, textDecoration: 'none', padding: '15px 30px', borderRadius: 999 }}
>
Start shopping
</Link>
<Link
href="/sell"
style={{ background: 'transparent', color: 'var(--text)', fontWeight: 700, fontSize: 15, textDecoration: 'none', padding: '15px 30px', borderRadius: 999, border: '1px solid var(--border)' }}
>
Become a seller
</Link>
</div>
</div>
</section>
</main>
)
}
