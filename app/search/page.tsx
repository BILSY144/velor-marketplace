'use client'

// /search — polished 2026-07-09 to the design standard. Search logic and the
// /api/search contract are unchanged; the shell, empty state and result
// cards now speak the house language. Zero-state is honest: no fake counts.

import { useEffect, useRef, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCurrencyDisplay } from '@/lib/useCurrencyDisplay'

interface SearchResult {
  id: string
  name: string
  price: number
  currency: string
  image: string | null
  category: string
  sellerId: string
  sellerName: string
}

const css = `
.vsr{background:var(--bg);color:var(--text);font-family:var(--font-body);min-height:100vh}
.vsr a{color:inherit;text-decoration:none}
.vsr-wrap{max-width:1080px;margin:0 auto;padding:64px 32px 90px}
.vsr-eyebrow{display:inline-flex;align-items:center;gap:9px;font-size:12px;letter-spacing:.13em;text-transform:uppercase;color:var(--accent);margin-bottom:18px;font-weight:600}
.vsr-dot{width:6px;height:6px;border-radius:50%;background:var(--accent)}
.vsr h1{font-family:var(--font-display);font-weight:500;letter-spacing:-0.02em;font-size:42px;line-height:1.08;margin:0 0 14px}
.vsr-lede{font-size:15.5px;color:var(--muted);line-height:1.65;margin:0 0 36px;max-width:56ch}
.vsr-bar{display:flex;gap:12px;margin-bottom:44px}
.vsr-in{flex:1;background:var(--surface);border:1px solid var(--border);border-radius:12px;color:var(--text);font-family:var(--font-body);font-size:16px;padding:16px 20px;outline:none;transition:border-color .15s}
.vsr-in:focus{border-color:var(--accent)}
.vsr-btn{background:var(--accent);color:#160a00;border:0;border-radius:12px;padding:0 30px;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit}
.vsr-note{font-size:13.5px;color:var(--muted);margin-bottom:22px}
.vsr-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:16px}
.vsr-card{background:var(--surface);border:1px solid var(--border);border-radius:14px;overflow:hidden;transition:transform .15s,border-color .15s;display:block}
.vsr-card:hover{transform:translateY(-3px);border-color:rgba(255,107,0,.5)}
.vsr-img{aspect-ratio:1;background:var(--surface-2);overflow:hidden;display:flex;align-items:center;justify-content:center}
.vsr-img img{width:100%;height:100%;object-fit:cover}
.vsr-body{padding:13px 15px}
.vsr-cat{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin:0 0 5px}
.vsr-name{font-size:14px;font-weight:500;line-height:1.35;margin:0 0 5px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.vsr-seller{font-size:12.5px;color:var(--muted);margin:0 0 6px}
.vsr-price{font-family:var(--font-display);font-size:16px;font-weight:700;color:var(--accent);margin:0}
.vsr-empty{border:1px solid var(--border);background:var(--surface);border-radius:16px;padding:44px 36px;text-align:center}
.vsr-empty h2{font-family:var(--font-display);font-weight:500;font-size:24px;letter-spacing:-0.01em;margin:0 0 10px}
.vsr-empty p{font-size:14.5px;color:var(--muted);line-height:1.65;margin:0 auto 22px;max-width:52ch}
.vsr-cta{display:inline-block;background:var(--accent);color:#160a00 !important;border-radius:10px;padding:13px 24px;font-size:14px;font-weight:600;margin:0 6px}
.vsr-cta.ghost{background:transparent;color:var(--text) !important;border:1px solid var(--border)}
@media(max-width:720px){.vsr h1{font-size:32px}.vsr-bar{flex-direction:column}.vsr-btn{padding:15px 0}}
`

function SearchContent() {
  const { symbol, convert } = useCurrencyDisplay()
  const searchParams = useSearchParams()
  const router = useRouter()
  const q = searchParams.get('q') ?? ''
  const [query, setQuery] = useState(q)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    if (q.length >= 2) {
      runSearch(q)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  async function runSearch(term: string) {
    if (term.length < 2) return
    setLoading(true)
    setSearched(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`)
      const data = await res.json()
      setResults(data.results ?? [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim().length < 2) return
    router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    runSearch(query.trim())
  }

  return (
    <div className="vsr">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="vsr-wrap">
        <div className="vsr-eyebrow"><span className="vsr-dot" /> Search</div>
        <h1>Search the world.</h1>
        <p className="vsr-lede">
          A thing, a craft, a place — search by what it is or where it is from, and the channel
          finds it.
        </p>

        <form className="vsr-bar" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            className="vsr-in"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Try a craft, a country, a thing..."
          />
          <button className="vsr-btn" type="submit">Search</button>
        </form>

        {loading && <p className="vsr-note">Searching...</p>}

        {!loading && searched && results.length === 0 && (
          <div className="vsr-empty">
            <h2>Nothing for &ldquo;{q}&rdquo; — yet.</h2>
            <p>
              The shelves are still filling: our founding sellers are opening their countries one
              by one, and every listing they add lands here the moment it is approved. Try another
              word, or browse by where things come from.
            </p>
            <div>
              <Link className="vsr-cta" href="/founding">Browse the countries</Link>
              <Link className="vsr-cta ghost" href="/shop">Open the shop</Link>
            </div>
          </div>
        )}

        {!loading && results.length > 0 && (
          <>
            <p className="vsr-note">
              {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{q}&rdquo;
            </p>
            <div className="vsr-grid">
              {results.map(item => (
                <Link key={item.id} className="vsr-card" href={`/marketplace/${item.id}`}>
                  <div className="vsr-img">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt={item.name} />
                    ) : (
                      <span style={{ color: 'var(--muted)', fontSize: 12 }}>No image</span>
                    )}
                  </div>
                  <div className="vsr-body">
                    <p className="vsr-cat">{item.category}</p>
                    <p className="vsr-name">{item.name}</p>
                    <p className="vsr-seller">by {item.sellerName}</p>
                    <p className="vsr-price">{symbol}{convert(item.price, item.currency).toFixed(2)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ color: 'var(--text)', padding: 40, textAlign: 'center', background: 'var(--bg)', minHeight: '100vh' }}>Loading...</div>}>
      <SearchContent />
    </Suspense>
  )
}
