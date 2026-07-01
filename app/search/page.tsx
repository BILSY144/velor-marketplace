'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic'

interface SearchResult {
  id: string;
  name: string;
  price: number;
  image: string | null;
  category: string;
  sellerId: string;
  sellerName: string;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(q);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    if (q.length >= 2) {
      runSearch(q);
    }
  }, [q]);

  async function runSearch(term: string) {
    if (term.length < 2) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length < 2) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    runSearch(query.trim());
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', padding: '40px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, marginBottom: 24 }}>
          Search Products
        </h1>

        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 12, marginBottom: 40 }}>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search products..."
            style={{
              flex: 1,
              padding: '14px 18px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--text)',
              fontFamily: 'var(--font-body)',
              fontSize: 15,
              outline: 'none',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '14px 28px',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontFamily: 'var(--font-body)',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Search
          </button>
        </form>

        {loading && (
          <p style={{ color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>Searching...</p>
        )}

        {!loading && searched && results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
            <p style={{ fontSize: 18, marginBottom: 8 }}>No results found for &ldquo;{q}&rdquo;</p>
            <p style={{ fontSize: 14 }}>Try a different search term or browse our categories.</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <>
            <p style={{ color: 'var(--muted)', fontFamily: 'var(--font-body)', fontSize: 14, marginBottom: 24 }}>
              {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{q}&rdquo;
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 20,
            }}>
              {results.map(item => (
                <Link
                  key={item.id}
                  href={`/marketplace/${item.id}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    overflow: 'hidden',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.transform = '';
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '';
                  }}
                  >
                    <div style={{ aspectRatio: '1', background: '#111', overflow: 'hidden' }}>
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ color: 'var(--muted)', fontSize: 12 }}>No image</span>
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '12px 14px' }}>
                      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: 4, fontFamily: 'var(--font-body)' }}>
                        {item.category}
                      </p>
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6, fontFamily: 'var(--font-body)', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {item.name}
                      </p>
                      <p style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--font-body)', marginBottom: 4 }}>
                        by {item.sellerName}
                      </p>
                      <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-display)' }}>
                        Â£{item.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
