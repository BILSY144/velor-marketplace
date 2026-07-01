'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  description: string
  price: number
  images: string[]
  category: string
  status: string
  createdAt: string
  seller: { businessName: string }
}

export default function MarketplaceGrid() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [sort, setSort] = useState<'newest' | 'price-asc' | 'price-desc'>('newest')

  useEffect(() => {
    fetch('/api/marketplace/products')
      .then(r => r.json())
      .then(data => {
        setProducts(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category))).sort()
    return ['All', ...cats]
  }, [products])

  const filtered = useMemo(() => {
    let list = products.filter(p => {
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
      const matchCat = activeCategory === 'All' || p.category === activeCategory
      return matchSearch && matchCat
    })
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price)
    else if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price)
    return list
  }, [products, search, activeCategory, sort])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700;800&family=Inter:wght@400;600&display=swap');
        .mp-root { background: #0D0D0D; min-height: 100vh; font-family: 'Inter', sans-serif; color: #fff; }
        .mp-hero { padding: 64px 48px 40px; border-bottom: 1px solid #2A2A2A; }
        .mp-hero h1 { font-family: 'Space Grotesk', sans-serif; font-size: 52px; font-weight: 800; margin: 0 0 8px; }
        .mp-hero h1 span { color: #FF6B00; }
        .mp-hero p { color: #999; font-size: 16px; margin: 0; }
        .mp-controls { padding: 24px 48px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap; border-bottom: 1px solid #2A2A2A; }
        .mp-search { flex: 1; min-width: 220px; background: #1A1A1A; border: 1px solid #2A2A2A; border-radius: 8px; padding: 10px 16px; color: #fff; font-size: 14px; outline: none; }
        .mp-search:focus { border-color: #FF6B00; }
        .mp-search::placeholder { color: #666; }
        .mp-sort { background: #1A1A1A; border: 1px solid #2A2A2A; border-radius: 8px; padding: 10px 16px; color: #fff; font-size: 14px; cursor: pointer; outline: none; }
        .mp-cats { padding: 16px 48px; display: flex; gap: 8px; flex-wrap: wrap; border-bottom: 1px solid #2A2A2A; }
        .mp-cat { padding: 6px 16px; border-radius: 20px; border: 1px solid #2A2A2A; background: transparent; color: #999; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
        .mp-cat:hover { border-color: #FF6B00; color: #FF6B00; }
        .mp-cat.active { background: #FF6B00; border-color: #FF6B00; color: #000; }
        .mp-grid { padding: 40px 48px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        @media (max-width: 1100px) { .mp-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 768px) { .mp-grid { grid-template-columns: repeat(2, 1fr); padding: 20px 16px; } .mp-hero { padding: 40px 16px 24px; } .mp-hero h1 { font-size: 36px; } .mp-controls { padding: 16px; } .mp-cats { padding: 12px 16px; } }
        .mp-card { background: #1A1A1A; border: 1px solid #2A2A2A; border-radius: 12px; overflow: hidden; text-decoration: none; display: flex; flex-direction: column; transition: transform 0.15s, box-shadow 0.15s; }
        .mp-card:hover { transform: translateY(-4px); box-shadow: 0 8px 32px rgba(255,107,0,0.12); }
        .mp-card-img { aspect-ratio: 1; background: #111; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative; }
        .mp-card-img img { width: 100%; height: 100%; object-fit: cover; }
        .mp-card-img-placeholder { color: #333; font-size: 40px; }
        .mp-card-body { padding: 14px; flex: 1; display: flex; flex-direction: column; gap: 6px; }
        .mp-card-cat { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #FF6B00; }
        .mp-card-name { font-family: 'Space Grotesk', sans-serif; font-size: 15px; font-weight: 700; color: #fff; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.3; }
        .mp-card-seller { font-size: 12px; color: #666; }
        .mp-card-price { font-size: 17px; font-weight: 700; color: #fff; margin-top: auto; padding-top: 8px; }
        .mp-card-btn { margin: 0 14px 14px; background: #FF6B00; color: #000; border: none; border-radius: 8px; padding: 10px; font-size: 13px; font-weight: 700; cursor: pointer; text-align: center; text-decoration: none; display: block; transition: opacity 0.15s; }
        .mp-card-btn:hover { opacity: 0.85; }
        .mp-empty { padding: 80px 48px; text-align: center; color: #666; }
        .mp-empty h3 { font-size: 24px; color: #fff; margin-bottom: 8px; }
        .mp-count { padding: 0 48px 8px; color: #666; font-size: 13px; }
        @media (max-width: 768px) { .mp-count { padding: 0 16px 8px; } }
        .mp-spinner { display: flex; align-items: center; justify-content: center; padding: 80px; }
        .mp-spin { width: 32px; height: 32px; border: 3px solid #2A2A2A; border-top-color: #FF6B00; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="mp-root">
        <div className="mp-hero">
          <h1>Velor <span>Marketplace</span></h1>
          <p>Shop unique products from independent sellers</p>
        </div>

        <div className="mp-controls">
          <input
            className="mp-search"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="mp-sort" value={sort} onChange={e => setSort(e.target.value as any)}>
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>

        <div className="mp-cats">
          {categories.map(cat => (
            <button
              key={cat}
              className={`mp-cat ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mp-spinner"><div className="mp-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="mp-empty">
            <h3>No products found</h3>
            <p>Try a different search or category</p>
          </div>
        ) : (
          <>
            <div className="mp-count">{filtered.length} product{filtered.length !== 1 ? 's' : ''}</div>
            <div className="mp-grid">
              {filtered.map(product => (
                <div key={product.id} style={{ display: 'flex', flexDirection: 'column' }}>
                  <Link href={`/marketplace/${product.id}`} className="mp-card">
                    <div className="mp-card-img">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.name} />
                      ) : (
                        <div className="mp-card-img-placeholder">+</div>
                      )}
                    </div>
                    <div className="mp-card-body">
                      <div className="mp-card-cat">{product.category}</div>
                      <div className="mp-card-name">{product.name}</div>
                      <div className="mp-card-seller">{product.seller.businessName}</div>
                      <div className="mp-card-price">£{product.price.toFixed(2)}</div>
                    </div>
                  </Link>
                  <Link href={`/marketplace/${product.id}`} className="mp-card-btn">
                    View Product
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
