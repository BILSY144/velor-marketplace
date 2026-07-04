'use client'

import { useState, useEffect } from 'react'
import { SUPPORTED_CURRENCIES, CURRENCY_NAMES, COUNTRY_TO_CURRENCY, symbolFor } from '@/lib/currency'

const HS_CATEGORY_MAP: Record<string, { label: string; example: string }> = {
  '01': { label: 'Live Animals', example: '010110 — horses' },
  '10': { label: 'Cereals', example: '100110 — wheat' },
  '39': { label: 'Plastics & Articles', example: '392690 — plastic articles' },
  '44': { label: 'Wood & Articles', example: '441900 — wooden household goods' },
  '49': { label: 'Books & Printed Media', example: '490110 — books' },
  '61': { label: 'Clothing (knitted)', example: '610910 — T-shirts' },
  '62': { label: 'Clothing (woven)', example: '620411 — suits' },
  '63': { label: 'Home Textiles', example: '630120 — bedding' },
  '64': { label: 'Footwear', example: '640299 — shoes' },
  '84': { label: 'Machinery & Equipment', example: '847130 — laptops' },
  '85': { label: 'Electronics', example: '851712 — smartphones' },
  '87': { label: 'Vehicles & Parts', example: '871190 — motorcycles' },
  '90': { label: 'Optical & Medical Instruments', example: '901831 — syringes' },
  '91': { label: 'Clocks & Watches', example: '910111 — wristwatches' },
  '94': { label: 'Furniture & Lighting', example: '940360 — wooden furniture' },
  '95': { label: 'Toys & Games', example: '950300 — toys' },
  '96': { label: 'Miscellaneous Articles', example: '960910 — pencils' },
}

function hsChapterInfo(hsCode: string) {
  if (!hsCode || hsCode.length < 2) return null
  const chapter = hsCode.slice(0, 2)
  return HS_CATEGORY_MAP[chapter] ?? null
}

const DUTY_GUIDANCE: Record<string, string> = {
  '61': 'UK 12% | EU 12% | US 18% | AU 17.5%',
  '62': 'UK 12% | EU 12% | US 18% | AU 17.5%',
  '63': 'UK 12% | EU 12% | US 9% | AU 10%',
  '64': 'UK 4% | EU 3.7% | US 10% | AU 17.5%',
  '84': 'UK 0% | EU 0% | US 0% | AU 0%',
  '85': 'UK 0% | EU 0% | US 0% | AU 0%',
  '87': 'UK 6.5% | EU 6.5% | US 2.5% | AU 5%',
  '90': 'UK 0% | EU 0% | US 0% | AU 0%',
  '91': 'UK 4.5% | EU 4.5% | US 0% | AU 5%',
  '94': 'UK 5.7% | EU 5.7% | US 0% | AU 5%',
  '95': 'UK 0% | EU 4.7% | US 0% | AU 0%',
}

// The 16 categories used site-wide (matches components/GlobalHeader.tsx nav
// and app/shop/page.tsx filters exactly). The shop's products API does a
// strict string match on category, so a listing only shows up under a
// category page when this value matches one of these 16 names exactly.
const PRODUCT_CATEGORIES = [
  'Electronics',
  'Fashion',
  'Home & Garden',
  'Beauty & Health',
  'Sports & Outdoors',
  'Jewellery & Watches',
  'Toys & Games',
  'Baby & Kids',
  'Pet Supplies',
  'Automotive',
  'Books & Education',
  'Art & Crafts',
  'Office & Stationery',
  'Travel & Luggage',
  'Food & Grocery',
  'Fitness & Gym',
]

const COUNTRIES = [
  { code: 'AF', name: 'Afghanistan' }, { code: 'AL', name: 'Albania' }, { code: 'DZ', name: 'Algeria' },
  { code: 'AD', name: 'Andorra' }, { code: 'AO', name: 'Angola' }, { code: 'AG', name: 'Antigua and Barbuda' },
  { code: 'AR', name: 'Argentina' }, { code: 'AM', name: 'Armenia' }, { code: 'AU', name: 'Australia' },
  { code: 'AT', name: 'Austria' }, { code: 'AZ', name: 'Azerbaijan' }, { code: 'BS', name: 'Bahamas' },
  { code: 'BH', name: 'Bahrain' }, { code: 'BD', name: 'Bangladesh' }, { code: 'BB', name: 'Barbados' },
  { code: 'BY', name: 'Belarus' }, { code: 'BE', name: 'Belgium' }, { code: 'BZ', name: 'Belize' },
  { code: 'BJ', name: 'Benin' }, { code: 'BT', name: 'Bhutan' }, { code: 'BO', name: 'Bolivia' },
  { code: 'BA', name: 'Bosnia and Herzegovina' }, { code: 'BW', name: 'Botswana' }, { code: 'BR', name: 'Brazil' },
  { code: 'BN', name: 'Brunei' }, { code: 'BG', name: 'Bulgaria' }, { code: 'BF', name: 'Burkina Faso' },
  { code: 'BI', name: 'Burundi' }, { code: 'KH', name: 'Cambodia' }, { code: 'CM', name: 'Cameroon' },
  { code: 'CA', name: 'Canada' }, { code: 'CV', name: 'Cape Verde' }, { code: 'CF', name: 'Central African Republic' },
  { code: 'TD', name: 'Chad' }, { code: 'CL', name: 'Chile' }, { code: 'CN', name: 'China' },
  { code: 'CO', name: 'Colombia' }, { code: 'KM', name: 'Comoros' }, { code: 'CG', name: 'Congo' },
  { code: 'CD', name: 'Congo (DRC)' }, { code: 'CR', name: 'Costa Rica' }, { code: 'HR', name: 'Croatia' },
  { code: 'CU', name: 'Cuba' }, { code: 'CY', name: 'Cyprus' }, { code: 'CZ', name: 'Czechia' },
  { code: 'DK', name: 'Denmark' }, { code: 'DJ', name: 'Djibouti' }, { code: 'DM', name: 'Dominica' },
  { code: 'DO', name: 'Dominican Republic' }, { code: 'EC', name: 'Ecuador' }, { code: 'EG', name: 'Egypt' },
  { code: 'SV', name: 'El Salvador' }, { code: 'GQ', name: 'Equatorial Guinea' }, { code: 'ER', name: 'Eritrea' },
  { code: 'EE', name: 'Estonia' }, { code: 'SZ', name: 'Eswatini' }, { code: 'ET', name: 'Ethiopia' },
  { code: 'FJ', name: 'Fiji' }, { code: 'FI', name: 'Finland' }, { code: 'FR', name: 'France' },
  { code: 'GA', name: 'Gabon' }, { code: 'GM', name: 'Gambia' }, { code: 'GE', name: 'Georgia' },
  { code: 'DE', name: 'Germany' }, { code: 'GH', name: 'Ghana' }, { code: 'GR', name: 'Greece' },
  { code: 'GD', name: 'Grenada' }, { code: 'GT', name: 'Guatemala' }, { code: 'GN', name: 'Guinea' },
  { code: 'GW', name: 'Guinea-Bissau' }, { code: 'GY', name: 'Guyana' }, { code: 'HT', name: 'Haiti' },
  { code: 'HN', name: 'Honduras' }, { code: 'HK', name: 'Hong Kong' }, { code: 'HU', name: 'Hungary' },
  { code: 'IS', name: 'Iceland' }, { code: 'IN', name: 'India' }, { code: 'ID', name: 'Indonesia' },
  { code: 'IR', name: 'Iran' }, { code: 'IQ', name: 'Iraq' }, { code: 'IE', name: 'Ireland' },
  { code: 'IL', name: 'Israel' }, { code: 'IT', name: 'Italy' }, { code: 'CI', name: "Ivory Coast" },
  { code: 'JM', name: 'Jamaica' }, { code: 'JP', name: 'Japan' }, { code: 'JO', name: 'Jordan' },
  { code: 'KZ', name: 'Kazakhstan' }, { code: 'KE', name: 'Kenya' }, { code: 'KI', name: 'Kiribati' },
  { code: 'KW', name: 'Kuwait' }, { code: 'KG', name: 'Kyrgyzstan' }, { code: 'LA', name: 'Laos' },
  { code: 'LV', name: 'Latvia' }, { code: 'LB', name: 'Lebanon' }, { code: 'LS', name: 'Lesotho' },
  { code: 'LR', name: 'Liberia' }, { code: 'LY', name: 'Libya' }, { code: 'LI', name: 'Liechtenstein' },
  { code: 'LT', name: 'Lithuania' }, { code: 'LU', name: 'Luxembourg' }, { code: 'MO', name: 'Macau' },
  { code: 'MG', name: 'Madagascar' }, { code: 'MW', name: 'Malawi' }, { code: 'MY', name: 'Malaysia' },
  { code: 'MV', name: 'Maldives' }, { code: 'ML', name: 'Mali' }, { code: 'MT', name: 'Malta' },
  { code: 'MR', name: 'Mauritania' }, { code: 'MU', name: 'Mauritius' }, { code: 'MX', name: 'Mexico' },
  { code: 'MD', name: 'Moldova' }, { code: 'MC', name: 'Monaco' }, { code: 'MN', name: 'Mongolia' },
  { code: 'ME', name: 'Montenegro' }, { code: 'MA', name: 'Morocco' }, { code: 'MZ', name: 'Mozambique' },
  { code: 'MM', name: 'Myanmar' }, { code: 'NA', name: 'Namibia' }, { code: 'NR', name: 'Nauru' },
  { code: 'NP', name: 'Nepal' }, { code: 'NL', name: 'Netherlands' }, { code: 'NZ', name: 'New Zealand' },
  { code: 'NI', name: 'Nicaragua' }, { code: 'NE', name: 'Niger' }, { code: 'NG', name: 'Nigeria' },
  { code: 'KP', name: 'North Korea' }, { code: 'MK', name: 'North Macedonia' }, { code: 'NO', name: 'Norway' },
  { code: 'OM', name: 'Oman' }, { code: 'PK', name: 'Pakistan' }, { code: 'PW', name: 'Palau' },
  { code: 'PA', name: 'Panama' }, { code: 'PG', name: 'Papua New Guinea' }, { code: 'PY', name: 'Paraguay' },
  { code: 'PE', name: 'Peru' }, { code: 'PH', name: 'Philippines' }, { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' }, { code: 'QA', name: 'Qatar' }, { code: 'RO', name: 'Romania' },
  { code: 'RU', name: 'Russia' }, { code: 'RW', name: 'Rwanda' }, { code: 'KN', name: 'Saint Kitts and Nevis' },
  { code: 'LC', name: 'Saint Lucia' }, { code: 'VC', name: 'Saint Vincent and the Grenadines' },
  { code: 'WS', name: 'Samoa' }, { code: 'SM', name: 'San Marino' }, { code: 'ST', name: 'Sao Tome and Principe' },
  { code: 'SA', name: 'Saudi Arabia' }, { code: 'SN', name: 'Senegal' }, { code: 'RS', name: 'Serbia' },
  { code: 'SC', name: 'Seychelles' }, { code: 'SL', name: 'Sierra Leone' }, { code: 'SG', name: 'Singapore' },
  { code: 'SK', name: 'Slovakia' }, { code: 'SI', name: 'Slovenia' }, { code: 'SB', name: 'Solomon Islands' },
  { code: 'SO', name: 'Somalia' }, { code: 'ZA', name: 'South Africa' }, { code: 'KR', name: 'South Korea' },
  { code: 'SS', name: 'South Sudan' }, { code: 'ES', name: 'Spain' }, { code: 'LK', name: 'Sri Lanka' },
  { code: 'SD', name: 'Sudan' }, { code: 'SR', name: 'Suriname' }, { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' }, { code: 'SY', name: 'Syria' }, { code: 'TW', name: 'Taiwan' },
  { code: 'TJ', name: 'Tajikistan' }, { code: 'TZ', name: 'Tanzania' }, { code: 'TH', name: 'Thailand' },
  { code: 'TL', name: 'Timor-Leste' }, { code: 'TG', name: 'Togo' }, { code: 'TO', name: 'Tonga' },
  { code: 'TT', name: 'Trinidad and Tobago' }, { code: 'TN', name: 'Tunisia' }, { code: 'TR', name: 'Turkey' },
  { code: 'TM', name: 'Turkmenistan' }, { code: 'TV', name: 'Tuvalu' }, { code: 'UG', name: 'Uganda' },
  { code: 'UA', name: 'Ukraine' }, { code: 'AE', name: 'United Arab Emirates' }, { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' }, { code: 'UY', name: 'Uruguay' }, { code: 'UZ', name: 'Uzbekistan' },
  { code: 'VU', name: 'Vanuatu' }, { code: 'VA', name: 'Vatican City' }, { code: 'VE', name: 'Venezuela' },
  { code: 'VN', name: 'Vietnam' }, { code: 'YE', name: 'Yemen' }, { code: 'ZM', name: 'Zambia' },
  { code: 'ZW', name: 'Zimbabwe' },
]

interface Product {
  id: string; name: string; description: string; price: number; stock: number;
  category: string; images: string[]; status: string;
  weightGrams: number | null; lengthCm: number | null; widthCm: number | null; heightCm: number | null;
  hsCode: string | null; originCountry: string | null;
}

const MIN_IMAGES = 3
const MAX_IMAGES = 8
const MAX_IMAGE_DIMENSION = 1000
const MAX_IMAGE_DATA_URL_LEN = 350_000

const emptyForm = {
  name: '', description: '', price: '', stock: '', category: '',
  images: ['', '', '', '', '', '', '', ''],
  weightGrams: '', lengthCm: '', widthCm: '', heightCm: '', hsCode: '', originCountry: '', currency: '',
}

const inputStyle = {
  width: '100%', padding: '10px 12px', background: 'var(--bg)',
  border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)',
  fontFamily: 'var(--font-body)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const,
}
const labelStyle = {
  display: 'block', fontSize: '12px', fontWeight: 600 as const,
  color: 'var(--muted)', textTransform: 'uppercase' as const,
  letterSpacing: '0.05em', marginBottom: '6px',
}

function resizeAndCompressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!/^image\/(png|jpeg|jpg|webp)$/.test(file.type)) {
      reject(new Error('Please choose a PNG, JPG or WebP image.'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
          const scale = Math.min(MAX_IMAGE_DIMENSION / width, MAX_IMAGE_DIMENSION / height)
          width = Math.round(width * scale)
          height = Math.round(height * scale)
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('Could not process this image.')); return }
        ctx.drawImage(img, 0, 0, width, height)
        let quality = 0.85
        let dataUrl = canvas.toDataURL('image/jpeg', quality)
        while (dataUrl.length > MAX_IMAGE_DATA_URL_LEN && quality > 0.35) {
          quality -= 0.1
          dataUrl = canvas.toDataURL('image/jpeg', quality)
        }
        if (dataUrl.length > MAX_IMAGE_DATA_URL_LEN) {
          reject(new Error('This image is still too large after compression — try a smaller photo.'))
          return
        }
        resolve(dataUrl)
      }
      img.onerror = () => reject(new Error('Could not read this image.'))
      img.src = reader.result as string
    }
    reader.onerror = () => reject(new Error('Could not read this file.'))
    reader.readAsDataURL(file)
  })
}

function ImageUploadBox({
  index,
  value,
  onChange,
}: {
  index: number
  value: string
  onChange: (v: string) => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const inputId = `product-image-input-${index}`

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError('')
    setBusy(true)
    try {
      const dataUrl = await resizeAndCompressImage(file)
      onChange(dataUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not process this image.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <label
        htmlFor={inputId}
        style={{
          width: '64px', height: '64px', borderRadius: '8px', flexShrink: 0, cursor: 'pointer',
          border: '1px dashed var(--border)', background: 'var(--bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        }}
      >
        {value ? (
          <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : busy ? (
          <span style={{ fontSize: '10px', color: 'var(--muted)' }}>...</span>
        ) : (
          <span style={{ fontSize: '22px', color: 'var(--muted)', lineHeight: 1 }}>+</span>
        )}
        <input
          id={inputId}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={onFile}
          style={{ display: 'none' }}
        />
      </label>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 600 }}>
          Image {index + 1}{index < MIN_IMAGES ? ' (required)' : ' (optional)'}
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '2px' }}>
          <label htmlFor={inputId} style={{ fontSize: '12px', color: 'var(--accent)', cursor: 'pointer' }}>
            {value ? 'Replace' : 'Upload photo'}
          </label>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              style={{ fontSize: '12px', color: 'var(--red)', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              Remove
            </button>
          )}
        </div>
        {error && <div style={{ fontSize: '11px', color: 'var(--red)', marginTop: '4px' }}>{error}</div>}
      </div>
    </div>
  )
}

export default function DashboardProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [sellerCurrency, setSellerCurrency] = useState('GBP')

  useEffect(() => {
    loadProducts()
    fetch('/api/dashboard/settings').then((r) => r.json()).then((d) => setSellerCurrency(d.currency || 'GBP')).catch(() => {})
  }, [])

  async function loadProducts() {
    setLoading(true)
    const data = await fetch('/api/dashboard/products').then(r => r.json())
    setProducts(data.products ?? [])
    setLoading(false)
  }

  function openNew() {
    setEditProduct(null)
    setForm({ ...emptyForm, currency: sellerCurrency })
    setError('')
    setShowForm(true)
  }

  function openEdit(p: Product) {
    setEditProduct(p)
    const imgs = (p.images ?? []).slice(0, MAX_IMAGES)
    while (imgs.length < MAX_IMAGES) imgs.push('')
    setForm({
      name: p.name, description: p.description, price: String(p.price),
      stock: String(p.stock), category: p.category, images: imgs,
      weightGrams: p.weightGrams !== null ? String(p.weightGrams) : '',
      lengthCm: p.lengthCm !== null ? String(p.lengthCm) : '',
      widthCm: p.widthCm !== null ? String(p.widthCm) : '',
      heightCm: p.heightCm !== null ? String(p.heightCm) : '',
      hsCode: p.hsCode ?? '', originCountry: p.originCountry ?? '',
      currency: sellerCurrency,
    })
    setError('')
    setShowForm(true)
  }

  function set(k: keyof typeof emptyForm, v: string) {
    setForm(f => ({ ...f, [k]: v }))
    setError('')
  }

  // Picking an origin country auto-suggests the matching currency — the
  // seller can still override it with the Currency dropdown right after.
  function setOriginCountry(v: string) {
    setForm(f => ({ ...f, originCountry: v, currency: COUNTRY_TO_CURRENCY[v] ?? f.currency }))
    setError('')
  }

  // Currency here IS the seller's account-wide currency (products don't each
  // have their own) — so changing it saves immediately to the seller profile,
  // no separate trip to Settings required.
  function setCurrency(v: string) {
    setForm(f => ({ ...f, currency: v }))
    setSellerCurrency(v)
    fetch('/api/dashboard/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currency: v }),
    }).catch(() => {})
  }

  function setImage(index: number, v: string) {
    setForm(f => {
      const images = [...f.images]
      images[index] = v
      return { ...f, images }
    })
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const validImages = form.images.map(u => u.trim()).filter(Boolean)
    if (validImages.length < MIN_IMAGES) {
      setError(`Please add at least ${MIN_IMAGES} product images (you have ${validImages.length}).`)
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: form.name, description: form.description,
        price: parseFloat(form.price), stock: parseInt(form.stock, 10) || 0,
        category: form.category,
        images: validImages,
        weightGrams: form.weightGrams ? parseInt(form.weightGrams, 10) : null,
        lengthCm: form.lengthCm ? parseFloat(form.lengthCm) : null,
        widthCm: form.widthCm ? parseFloat(form.widthCm) : null,
        heightCm: form.heightCm ? parseFloat(form.heightCm) : null,
        hsCode: form.hsCode || null,
        originCountry: form.originCountry || null,
      }
      const url = editProduct ? '/api/dashboard/products?id=' + editProduct.id : '/api/dashboard/products'
      const method = editProduct ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Save failed'); return }
      setShowForm(false)
      await loadProducts()
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  const hsInfo = hsChapterInfo(form.hsCode)
  const dutyGuide = form.hsCode?.length >= 2 ? DUTY_GUIDANCE[form.hsCode.slice(0, 2)] : null
  const validImageCount = form.images.map(u => u.trim()).filter(Boolean).length
  const categoryIsKnown = !form.category || PRODUCT_CATEGORIES.includes(form.category)

  if (loading) return <div style={{ padding: '40px', color: 'var(--text)', fontFamily: 'var(--font-body)' }}>Loading...</div>

  return (
    <div style={{ padding: '32px 40px', fontFamily: 'var(--font-body)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>Products</h1>
        <button onClick={openNew} style={{
          padding: '10px 20px', background: 'var(--accent)', color: '#fff',
          border: 'none', borderRadius: '6px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
        }}>
          Add Product
        </button>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px', overflowY: 'auto' }}>
          <div style={{ background: 'var(--surface)', borderRadius: '12px', padding: '32px', maxWidth: '640px', width: '100%' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', marginBottom: '24px' }}>
              {editProduct ? 'Edit Product' : 'New Product'}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={labelStyle}>Name *</label>
                <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} />
              </div>

              {/* Currency — auto-suggested from Origin Country below, but always
                  editable here so pricing is never blocked on visiting Settings. */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Currency</label>
                  <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.currency || sellerCurrency} onChange={e => setCurrency(e.target.value)}>
                    {SUPPORTED_CURRENCIES.map(c => <option key={c} value={c}>{c} — {CURRENCY_NAMES[c]}</option>)}
                  </select>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '6px' }}>
                    Auto-suggested from Origin Country below. Applies to all your listings — buyers abroad see it converted automatically.
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Price ({form.currency || sellerCurrency}) *</label>
                  <input style={inputStyle} type="number" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Inventory No:</label>
                  <input style={inputStyle} type="number" value={form.stock} onChange={e => set('stock', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Category</label>
                  <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.category} onChange={e => set('category', e.target.value)}>
                    <option value="">Select category</option>
                    {!categoryIsKnown && (
                      <option value={form.category}>{form.category} (existing)</option>
                    )}
                    {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '6px' }}>
                    Matches Velor&apos;s live categories — your listing goes straight to the right category page.
                  </div>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Product Photos</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {form.images.map((url, i) => (
                    <ImageUploadBox key={i} index={i} value={url} onChange={(v) => setImage(i, v)} />
                  ))}
                </div>
                <div style={{ fontSize: '12px', color: validImageCount >= MIN_IMAGES ? 'var(--muted)' : 'var(--red)', marginTop: '8px' }}>
                  {validImageCount} of {MAX_IMAGES} added — minimum {MIN_IMAGES} required
                </div>
              </div>

              {/* Shipping section */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '18px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>Shipping & Customs</div>
                <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '14px' }}>
                  Weight and dimensions are used for shipping labels. HS code is recommended if this item may ever ship internationally — Velor is a global marketplace, so a buyer anywhere could order it.
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={labelStyle}>Weight (g)</label>
                    <input style={inputStyle} type="number" value={form.weightGrams} onChange={e => set('weightGrams', e.target.value)} placeholder="500" />
                  </div>
                  <div>
                    <label style={labelStyle}>Length (cm)</label>
                    <input style={inputStyle} type="number" step="0.1" value={form.lengthCm} onChange={e => set('lengthCm', e.target.value)} placeholder="20" />
                  </div>
                  <div>
                    <label style={labelStyle}>Width (cm)</label>
                    <input style={inputStyle} type="number" step="0.1" value={form.widthCm} onChange={e => set('widthCm', e.target.value)} placeholder="15" />
                  </div>
                  <div>
                    <label style={labelStyle}>Height (cm)</label>
                    <input style={inputStyle} type="number" step="0.1" value={form.heightCm} onChange={e => set('heightCm', e.target.value)} placeholder="10" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={labelStyle}>HS Code (6-digit, recommended)</label>
                    <input style={inputStyle} value={form.hsCode} onChange={e => set('hsCode', e.target.value.replace(/[^0-9]/g, '').slice(0, 6))} placeholder="851712" maxLength={6} />
                  </div>
                  <div>
                    <label style={labelStyle}>Origin Country</label>
                    <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.originCountry} onChange={e => setOriginCountry(e.target.value)}>
                      <option value="">Select country</option>
                      {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* HS code guidance panel */}
                {hsInfo && (
                  <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px 16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
                      Chapter {form.hsCode.slice(0, 2)} — {hsInfo.label}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>
                      Example: {hsInfo.example}
                    </div>
                    {dutyGuide && (
                      <div style={{ fontSize: '12px', color: 'var(--accent)' }}>
                        Typical duty rates: {dutyGuide}
                      </div>
                    )}
                    {!dutyGuide && (
                      <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                        Duty rates vary by destination country — confirm with your carrier or the destination country's customs authority.
                      </div>
                    )}
                  </div>
                )}
                {!hsInfo && form.hsCode.length === 0 && (
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    Recommended: enter your product&apos;s HS code to see duty rate guidance for international orders. You can find it using your country's official customs tariff lookup tool.
                  </div>
                )}
              </div>

              {error && (
                <div style={{ padding: '10px 14px', background: 'rgba(255,23,68,0.08)', border: '1px solid var(--red)', borderRadius: '6px', color: 'var(--red)', fontSize: '13px' }}>
                  {error}
                </div>
              )}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowForm(false)} style={{
                  padding: '10px 20px', background: 'var(--bg)', color: 'var(--text)',
                  border: '1px solid var(--border)', borderRadius: '6px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} style={{
                  padding: '10px 20px', background: saving ? 'var(--border)' : 'var(--accent)', color: '#fff',
                  border: 'none', borderRadius: '6px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '14px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}>
                  {saving ? 'Saving...' : editProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {products.map(p => (
          <div key={p.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            {p.images?.[0] && (
              <img src={p.images[0]} alt={p.name} style={{ width: '52px', height: '52px', objectFit: 'cover', borderRadius: '6px' }} />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>{p.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                {symbolFor(sellerCurrency)}{p.price.toFixed(2)} &middot; Inventory No: {p.stock} &middot;
                {p.hsCode ? ' HS: ' + p.hsCode : ' No HS code'} &middot;
                {p.weightGrams ? ' ' + p.weightGrams + 'g' : ' No weight'}
              </div>
            </div>
            <span style={{
              padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em',
              background: p.status === 'APPROVED' ? 'rgba(0,230,118,0.15)' : 'rgba(255,107,0,0.15)',
              color: p.status === 'APPROVED' ? 'var(--green)' : 'var(--accent)',
            }}>{p.status.replace('_', ' ')}</span>
            <button onClick={() => openEdit(p)} style={{
              padding: '7px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px',
              color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            }}>Edit</button>
          </div>
        ))}
        {products.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '60px 20px', fontSize: '14px' }}>
            No products yet. Add your first product to get started.
          </div>
        )}
      </div>
    </div>
  )
}
