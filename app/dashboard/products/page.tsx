'use client';

import { useState } from 'react';

type ProductStatus = 'active' | 'draft' | 'pending';

interface SellerProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  status: ProductStatus;
  category: string;
  sales: number;
}

const mockProducts: SellerProduct[] = [];

function StatusBadge({ status }: { status: ProductStatus }) {
  const map: Record<ProductStatus, { label: string; color: string }> = {
    active: { label: 'Active', color: 'var(--green)' },
    draft: { label: 'Draft', color: 'var(--muted)' },
    pending: { label: 'Pending Review', color: 'var(--accent)' },
  };
  const { label, color } = map[status];
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 4,
      fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
      background: `${color}22`, color, border: `1px solid ${color}44`,
    }}>
      {label}
    </span>
  );
}

export default function ProductsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', category: '', description: '', stock: '' });
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => { setShowAddModal(false); setSubmitted(false); setForm({ name: '', price: '', category: '', description: '', stock: '' }); }, 1500);
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontSize: 28, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
            Products
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>
            Manage your product listings
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 8,
            padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >
          + Add Product
        </button>
      </div>

      {/* Product table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12 }}>
          <input
            placeholder="Search products..."
            style={{
              background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6,
              padding: '8px 14px', color: 'var(--text)', fontSize: 14, width: 260,
              outline: 'none',
            }}
          />
          <select style={{
            background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6,
            padding: '8px 14px', color: 'var(--muted)', fontSize: 14, cursor: 'pointer',
          }}>
            <option>All Status</option>
            <option>Active</option>
            <option>Draft</option>
            <option>Pending Review</option>
          </select>
        </div>

        {mockProducts.length === 0 ? (
          <div style={{ padding: '64px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, color: 'var(--border)', marginBottom: 16 }}>--</div>
            <div style={{ color: 'var(--text)', fontSize: 16, fontWeight: 600, marginBottom: 6 }}>No products yet</div>
            <div style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>
              Add your first product to start selling on Velor Marketplace
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 8,
                padding: '10px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Add Your First Product
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                {['Product', 'Category', 'Price', 'Stock', 'Sales', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '12px 24px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockProducts.map(p => (
                <tr key={p.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '14px 24px', color: 'var(--text)', fontSize: 14, fontWeight: 600 }}>{p.name}</td>
                  <td style={{ padding: '14px 24px', color: 'var(--muted)', fontSize: 13 }}>{p.category}</td>
                  <td style={{ padding: '14px 24px', color: 'var(--text)', fontSize: 13, fontWeight: 600 }}>£{p.price.toFixed(2)}</td>
                  <td style={{ padding: '14px 24px', color: p.stock < 5 ? 'var(--red)' : 'var(--text)', fontSize: 13 }}>{p.stock}</td>
                  <td style={{ padding: '14px 24px', color: 'var(--muted)', fontSize: 13 }}>{p.sales}</td>
                  <td style={{ padding: '14px 24px' }}><StatusBadge status={p.status} /></td>
                  <td style={{ padding: '14px 24px' }}>
                    <button style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 14px', color: 'var(--muted)', fontSize: 12, cursor: 'pointer' }}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add product modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, width: 520, maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                Add Product
              </h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>x</button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {submitted ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ color: 'var(--green)', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Submitted for Review</div>
                  <div style={{ color: 'var(--muted)', fontSize: 14 }}>Your product will be reviewed within 24 hours.</div>
                </div>
              ) : (
                <>
                  {[
                    { label: 'Product Name', key: 'name', placeholder: 'e.g. Adjustable Dumbbell Set', type: 'text' },
                    { label: 'Price (GBP)', key: 'price', placeholder: '0.00', type: 'number' },
                    { label: 'Stock Quantity', key: 'stock', placeholder: '0', type: 'number' },
                  ].map(field => (
                    <div key={field.key}>
                      <label style={{ display: 'block', color: 'var(--muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                        {field.label}
                      </label>
                      <input
                        type={field.type}
                        placeholder={field.placeholder}
                        value={form[field.key as keyof typeof form]}
                        onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                        required
                        style={{
                          width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
                          borderRadius: 6, padding: '10px 14px', color: 'var(--text)', fontSize: 14,
                          outline: 'none', boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  ))}
                  <div>
                    <label style={{ display: 'block', color: 'var(--muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                      Category
                    </label>
                    <select
                      value={form.category}
                      onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      required
                      style={{
                        width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
                        borderRadius: 6, padding: '10px 14px', color: 'var(--text)', fontSize: 14, outline: 'none',
                      }}
                    >
                      <option value="">Select a category</option>
                      <option>Fitness & Gym</option>
                      <option>Electronics</option>
                      <option>Home & Garden</option>
                      <option>Sports & Outdoors</option>
                      <option>Beauty & Health</option>
                      <option>Toys & Games</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: 'var(--muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                      Description
                    </label>
                    <textarea
                      placeholder="Describe your product..."
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      rows={4}
                      style={{
                        width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
                        borderRadius: 6, padding: '10px 14px', color: 'var(--text)', fontSize: 14,
                        outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    style={{
                      background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 8,
                      padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 8,
                    }}
                  >
                    Submit for Review
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
