'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { CATEGORIES, CATEGORY_NAMES } from '@/lib/categories'

interface Product {
  id: string
  name: string
  description: string
  price: number
  images: string[]
  category: string
  status: string
  createdAt: string
  seller: { storeName: string }
  discountedPrice: number | null
  percentOff: number | null
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
        // The API returns { products, pagination } — not a bare array.
        setProducts(Array.isArray(data.products) ? data.products : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

const filtered = useMemo(() => {
    let list = products.filter(p => {
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase())
      const matchCat = activeCategory === 'All' || p.category === activeCategory
      return matchSearch && matchCat
    })
    if (sort === 'newest') list = list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    if (sort === 'price-asc') list = list.sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') list = list.sort((a, b) => b.price - a.price)
    return list
  }, [products, search, activeCategory, sort])

  // Count products per category for badge display
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: products.length }
    for (const cat of CATEGORY_NAMES) {
      counts[cat] = products.filter(p => p.category === cat).length
    }
    return counts
  }, [products])

  return (
    <>
      <style>{`
        .mp-wrap { max-width: 1400px; margin: 0 auto; padding: 0 20px 60px; }
        .mp-header { display: flex; align-items: center; justify-content: space-between; padding: 32px 0 24px; gap: 16px; flex-wrap: wrap; }
        .mp-title { font-family: 'Space Grotesk', sans-serif; font-size: 28px; font-weight: 800; color: #fff; }
        .mp-count { font-size: 14px; color: #666; }
        .mp-search-sort { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
        .mp-search { background: #111; border: 1px solid #222; border-radius: 10px; padding: 10px 16px; color: #fff; font-size: 14px; width: 240px; }
        .mp-search:focus { outline: none; border-color: #FF6B00; }
        .mp-sort { background: #111; border: 1px solid #222; border-radius: 10px; padding: 10px 14px; color: #fff; font-size: 14px; cursor: pointer; }
        .mp-cats { overflow-x: auto; display: flex; gap: 8px; padding: 0 0 16px; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
        .mp-cats::-webkit-scrollbar { display: none; }
        .mp-cat-btn { white-space: nowrap; padding: 8px 16px; border-radius: 20px; border: 1px solid #222; background: transparent; color: #888; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; position: relative; }
        .mp-cat-btn.active { background: #FF6B00; border-color: #FF6B00; color: #000; }
        .mp-cat-btn:hover:not(.active) { border-color: #444; color: #fff; }
        .mp-cat-count { font-size: 10px; margin-left: 4px; opacity: 0.7; }
        .mp-subcats { display: flex; gap: 6px; padding: 0 0 20px; flex-wrap: wrap; }
        .mp-subcat-btn { padding: 5px 12px; border-radius: 14px; border: 1px solid #1a1a1a; background: transparent; color: #555; font-size: 12px; cursor: pointer; transition: all 0.2s; }
        .mp-subcat-btn.active { background: #1a1a1a; border-color: #333; color: #FF6B00; }
        .mp-subcat-btn:hover:not(.active) { border-color: #333; color: #888; }
        .mp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; }
        .mp-card { background: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 14px; overflow: hidden; display: flex; flex-direction: column; transition: border-color 0.2s; text-decoration: none; }
        .mp-card:hover { border-color: #FF6B00; }
        .mp-card-img { height: 220px; background: #111; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative; }
        .mp-card-img img { width: 100%; height: 100%; object-fit: cover; }
        .mp-card-img-placeholder { color: #333; font-size: 40px; }
        .mp-card-badge { position: absolute; top: 10px; left: 10px; background: #FF6B00; color: #000; font-size: 11px; font-weight: 800; padding: 3px 9px; border-radius: 4px; letter-spacing: 0.3px; }
        .mp-card-body { padding: 14px; flex: 1; display: flex; flex-direction: column; gap: 6px; }
        .mp-card-cat { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #FF6B00; }
        .mp-card-name { font-family: 'Space Grotesk', sans-serif; font-size: 15px; font-weight: 700; color: #fff; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.3; }
        .mp-card-seller { font-size: 12px; color: #666; }
        .mp-card-price { font-size: 17px; font-weight: 700; color: #fff; margin-top: auto; padding-top: 8px; display: flex; align-items: baseline; gap: 8px; }
        .mp-card-price-was { font-size: 13px; font-weight: 500; color: #666; text-decoration: line-through; }
        .mp-card-price-now { color: #FF6B00; }
        .mp-card-btn { margin: 0 14px 14px; background: #FF6B00; color: #000; border: none; border-radius: 8px; padding: 10px; font-size: 13px; font-weight: 700; cursor: pointer; text-align: center; display: block; text-decoration: none; }
        .mp-empty { text-align: center; padding: 80px 20px; color: #444; }
        .mp-empty-title { font-size: 20px; font-weight: 700; color: #666; margin-bottom: 8px; }
        .mp-cat-section { margin: 40px 0 24px; }
        .mp-cat-section-title { font-family: 'Space Grotesk', sans-serif; font-size: 13px; font-weight: 700; color: #444; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px; }
        @media (max-width: 600px) {
          .mp-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .mp-title { font-size: 22px; }
          .mp-search { width: 100%; }
        }
      `}</style>

      <div className="mp-wrap">
        <div className="mp-header">
          <div>
            <div className="mp-title">Marketplace</div>
            <div className="mp-count">{loading ? 'Loading...' : `${filtered.length} of ${products.length} products`}</div>
          </div>
          <div className="mp-search-sort">
            <input
              className="mp-search"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select className="mp-sort" value={sort} onChange={e => setSort(e.target.value as typeof sort)}>
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Category tabs — all 14 defined categories always visible */}
        <div className="mp-cats">
          <button
            className={`mp-cat-btn ${activeCategory === 'All' ? 'active' : ''}`}
            onClick={() => setActiveCategory('All')}
          >
            All <span className="mp-cat-count">({products.length})</span>
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.slug}
              className={`mp-cat-btn ${activeCategory === cat.name ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.name)}
            >
              {cat.name}
              <span className="mp-cat-count">({categoryCounts[cat.name] ?? 0})</span>
            </button>
          ))}
        </div>

        {/* Products grid */}
        {loading ? (
          <div className="mp-empty"><div className="mp-empty-title">Loading products...</div></div>
        ) : filtered.length === 0 ? (
          <div className="mp-empty">
            <div className="mp-empty-title">No products found</div>
            <p>{activeCategory !== 'All' ? `Be the first to list in ${activeCategory}!` : 'Try a different search term.'}</p>
          </div>
        ) : (
          <div className="mp-grid">
            {filtered.map(product => {
              const onSale = product.discountedPrice != null && product.discountedPrice < product.price
              return (
              <Link key={product.id} href={`/marketplace/${product.id}`} className="mp-card">
                <div className="mp-card-img">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} loading="lazy" />
                  ) : (
                    <span className="mp-card-img-placeholder">*</span>
                  )}
                  {onSale && <span className="mp-card-badge">{product.percentOff}% OFF</span>}
                </div>
                <div className="mp-card-body">
                  <div className="mp-card-cat">{product.category}</div>
                  <div className="mp-card-name">{product.name}</div>
                  <div className="mp-card-seller">by {product.seller?.storeName}</div>
                  {onSale ? (
                    <div className="mp-card-price">
                      <span className="mp-card-price-now">£{(product.discountedPrice as number).toFixed(2)}</span>
                      <span className="mp-card-price-was">£{product.price.toFixed(2)}</span>
                    </div>
                  ) : (
                    <div className="mp-card-price">£{product.price.toFixed(2)}</div>
                  )}
                </div>
                <span className="mp-card-btn">View Product</span>
              </Link>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
