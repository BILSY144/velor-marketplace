'use client'

import { useState, useEffect } from 'react'
import { SUPPORTED_CURRENCIES, CURRENCY_NAMES, COUNTRY_TO_CURRENCY, symbolFor } from '@/lib/currency'
import { useSellerTier, PlanBadge, tierCardStyle } from '@/lib/dashboard-theme'
import { HALO, HaloButton } from '@/lib/halo'

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

interface ListingSuggestion { level: 'warning' | 'tip'; text: string }

function getListingSuggestions(
form: { description: string; category: string; price: string; weightGrams: string },
validImageCount: number,
categoryStats: { count: number; avgPrice: number; medianPrice: number } | null
): ListingSuggestion[] {
const suggestions: ListingSuggestion[] = []
if (validImageCount < 5) {
suggestions.push({ level: 'tip', text: `Add ${5 - validImageCount} more photo${5 - validImageCount === 1 ? '' : 's'} — listings with 5+ photos get more views and buyer trust.` })
}
const descLen = form.description.trim().length
if (descLen === 0) {
suggestions.push({ level: 'warning', text: 'Add a description — buyers skip listings with no details.' })
} else if (descLen < 100) {
suggestions.push({ level: 'tip', text: 'Your description is quite short. Mention materials, dimensions, fit, or what makes this item stand out.' })
}
if (!form.category) {
suggestions.push({ level: 'warning', text: 'Select a category so buyers can find this listing when browsing.' })
}
if (categoryStats && categoryStats.count >= 3 && form.price) {
const price = parseFloat(form.price)
if (!isNaN(price) && categoryStats.medianPrice > 0) {
const ratio = price / categoryStats.medianPrice
if (ratio > 2) {
suggestions.push({ level: 'tip', text: `This is priced well above similar listings in ${form.category}. Make sure your photos and description clearly justify the price.` })
} else if (ratio < 0.4) {
suggestions.push({ level: 'tip', text: `This is priced well below similar listings in ${form.category} — double check the price is correct.` })
}
}
}
if (!form.weightGrams) {
suggestions.push({ level: 'tip', text: 'Add a weight so shipping costs and delivery estimates are accurate.' })
}
return suggestions
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
import { CATEGORY_NAMES as PRODUCT_CATEGORIES } from '@/lib/categories'

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

// A colour/size option row (added 2026-07-27) -- see ProductVariant in
// prisma/schema.prisma. tempId is a client-only key for React list
// rendering/removal before the row has a real database id.
interface VariantRow {
tempId: string; label: string; color: string; size: string; stock: string; priceOverride: string; image: string;
}

interface Product {
id: string; name: string; description: string; price: number; stock: number;
category: string; images: string[]; status: string;
weightGrams: number | null; lengthCm: number | null; widthCm: number | null; heightCm: number | null;
hsCode: string | null; originCountry: string | null;
isHandmade: boolean; makerStory: string | null;
materials: string | null; requiresCertificate: boolean;
variants?: { id: string; label: string | null; color: string | null; size: string | null; images?: string[]; stock: number; priceOverride: number | null; sku: string | null }[];
videoUrl?: string | null; madeToOrder?: boolean; leadTimeDays?: number | null; sizeGuide?: string | null;
}

const MIN_IMAGES = 3
const MAX_IMAGES = 8
const MAX_IMAGE_DIMENSION = 1000
const MAX_IMAGE_DATA_URL_LEN = 350_000

const emptyForm = {
name: '', description: '', price: '', stock: '', category: '',
images: ['', '', '', '', '', '', '', ''],
weightGrams: '', lengthCm: '', widthCm: '', heightCm: '', hsCode: '', originCountry: '', currency: '',
isHandmade: '', makerStory: '', materials: '', containsRegulated: '',
videoUrl: '', madeToOrder: '', leadTimeDays: '', sizeGuide: '',
}

const inputStyle = {
width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.75)',
border: '1px solid rgba(26,26,29,0.12)', borderRadius: '10px', color: 'var(--text)',
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

// Compact per-option photo uploader (2026-07-28: each option is its own
// little product -- "Red" shows the red photo on the buyer's page).
function VariantPhotoBox({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
const [busy, setBusy] = useState(false)
return (
<label htmlFor={id} title={value ? 'Change photo' : 'Add a photo of this option'} style={{
width: 56, height: 56, borderRadius: 10, flexShrink: 0, cursor: 'pointer',
border: value ? '1px solid var(--border)' : '1px dashed var(--border)', background: 'var(--bg)',
display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
}}>
{value ? <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
: <span style={{ fontSize: 18, color: 'var(--muted)', lineHeight: 1 }}>{busy ? '...' : '+'}</span>}
<input id={id} type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
const file = e.target.files?.[0]; e.target.value = ''
if (!file) return
setBusy(true)
try { onChange(await resizeAndCompressImage(file)) } catch {} finally { setBusy(false) }
}} />
</label>
)
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

const CERT_TYPES = [
{ value: 'EXPORT_PERMIT', label: 'Export permit (e.g. CITES)' },
{ value: 'IMPORT_PERMIT', label: 'Import permit (destination country)' },
{ value: 'PHYTOSANITARY', label: 'Phytosanitary certificate' },
{ value: 'OTHER', label: 'Other compliance document' },
]

const MAX_CERT_DATA_URL_LEN = 1_900_000

function readFileAsDataUrl(file: File): Promise<string> {
return new Promise((resolve, reject) => {
if (!/^(image\/(png|jpeg|jpg|webp)|application\/pdf)$/.test(file.type)) {
reject(new Error('Please upload a PDF, PNG, JPG or WebP file.'))
return
}
const reader = new FileReader()
reader.onload = () => {
const dataUrl = reader.result as string
if (dataUrl.length > MAX_CERT_DATA_URL_LEN) {
reject(new Error('File too large — please upload a file under 1.4 MB.'))
return
}
resolve(dataUrl)
}
reader.onerror = () => reject(new Error('Could not read this file.'))
reader.readAsDataURL(file)
})
}

interface CertRecord {
id: string; type: string; fileName: string | null; destinationCountry: string | null;
issuedBy: string | null; expiresAt: string | null; status: string; reviewNotes: string | null; createdAt: string;
}

function CertificatePanel({ product, onClose }: { product: Product; onClose: () => void }) {
const [certs, setCerts] = useState<CertRecord[]>([])
const [loadingCerts, setLoadingCerts] = useState(true)
const [certType, setCertType] = useState('EXPORT_PERMIT')
const [certFile, setCertFile] = useState<{ data: string; name: string } | null>(null)
const [certDest, setCertDest] = useState('')
const [certIssuer, setCertIssuer] = useState('')
const [certExpiry, setCertExpiry] = useState('')
const [certBusy, setCertBusy] = useState(false)
const [certError, setCertError] = useState('')
const [certOk, setCertOk] = useState('')

async function loadCerts() {
setLoadingCerts(true)
try {
const data = await fetch('/api/dashboard/certificates?productId=' + product.id).then(r => r.json())
setCerts(data.certificates ?? [])
} catch {
setCerts([])
} finally {
setLoadingCerts(false)
}
}
useEffect(() => { loadCerts() }, []) // eslint-disable-line react-hooks/exhaustive-deps

async function onCertFile(e: React.ChangeEvent<HTMLInputElement>) {
const file = e.target.files?.[0]
e.target.value = ''
if (!file) return
setCertError('')
try {
const data = await readFileAsDataUrl(file)
setCertFile({ data, name: file.name })
} catch (err) {
setCertError(err instanceof Error ? err.message : 'Could not read this file.')
}
}

async function submitCert(e: React.FormEvent) {
e.preventDefault()
setCertError('')
setCertOk('')
if (!certFile) { setCertError('Please choose a document to upload.'); return }
setCertBusy(true)
try {
const res = await fetch('/api/dashboard/certificates', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({
productId: product.id,
type: certType,
documentData: certFile.data,
fileName: certFile.name,
destinationCountry: certDest || null,
issuedBy: certIssuer || null,
expiresAt: certExpiry || null,
}),
})
const data = await res.json()
if (!res.ok) { setCertError(data.error ?? 'Upload failed'); return }
setCertOk('Certificate submitted for review.')
setCertFile(null); setCertDest(''); setCertIssuer(''); setCertExpiry('')
await loadCerts()
} catch {
setCertError('Network error')
} finally {
setCertBusy(false)
}
}

const statusColor = (s: string) => s === 'VERIFIED' ? 'var(--green)' : s === 'REJECTED' ? 'var(--red)' : 'var(--accent)'

return (
<div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(2px)', zIndex: 1100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px', overflowY: 'auto' }}>
<div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '28px', maxWidth: '560px', width: '100%' }}>
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
<h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>Certificates</h2>
<button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 20, cursor: 'pointer' }}>&times;</button>
</div>
<div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: 16 }}>{product.name}</div>
<div style={{ fontSize: '12px', lineHeight: 1.6, color: 'var(--muted)', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', marginBottom: 18 }}>
This listing contains a regulated material, so it cannot go live until a valid permit is uploaded and verified by our team. Export permits are typically valid 6 months — we track expiry and will ask for renewal. See the <a href="/legal/seller-rules" target="_blank" style={{ color: 'var(--accent)' }}>Seller Rules</a>.
</div>

{loadingCerts ? (
<div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>Loading documents...</div>
) : certs.length > 0 ? (
<div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
{certs.map(c => (
<div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}>
<div style={{ flex: 1 }}>
<div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{CERT_TYPES.find(t => t.value === c.type)?.label ?? c.type}</div>
<div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
{c.fileName ?? 'document'}{c.destinationCountry ? ' · dest ' + c.destinationCountry : ''}{c.expiresAt ? ' · expires ' + new Date(c.expiresAt).toLocaleDateString() : ''}
</div>
{c.reviewNotes && <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 2 }}>{c.reviewNotes}</div>}
</div>
<span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, color: statusColor(c.status) }}>{c.status}</span>
</div>
))}
</div>
) : (
<div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 18 }}>No documents uploaded yet.</div>
)}

<form onSubmit={submitCert} style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
<div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Upload a document</div>
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
<div>
<label style={labelStyle}>Document type</label>
<select style={{ ...inputStyle, cursor: 'pointer' }} value={certType} onChange={e => setCertType(e.target.value)}>
{CERT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
</select>
</div>
<div>
<label style={labelStyle}>Destination country (if import permit)</label>
<select style={{ ...inputStyle, cursor: 'pointer' }} value={certDest} onChange={e => setCertDest(e.target.value)}>
<option value="">Not destination-specific</option>
{COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
</select>
</div>
</div>
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
<div>
<label style={labelStyle}>Issuing authority</label>
<input style={inputStyle} value={certIssuer} onChange={e => setCertIssuer(e.target.value)} placeholder="e.g. UK APHA, US FWS" maxLength={200} />
</div>
<div>
<label style={labelStyle}>Expiry date</label>
<input style={inputStyle} type="date" value={certExpiry} onChange={e => setCertExpiry(e.target.value)} />
</div>
</div>
<div>
<label style={labelStyle}>Document (PDF or photo, max 1.4 MB)</label>
<input type="file" accept="application/pdf,image/png,image/jpeg,image/webp" onChange={onCertFile} style={{ fontSize: 13, color: 'var(--muted)' }} />
{certFile && <div style={{ fontSize: 12, color: 'var(--green)', marginTop: 4 }}>Ready: {certFile.name}</div>}
</div>
{certError && <div style={{ fontSize: 12, color: 'var(--red)' }}>{certError}</div>}
{certOk && <div style={{ fontSize: 12, color: 'var(--green)' }}>{certOk}</div>}
<button type="submit" disabled={certBusy} style={{
padding: '10px 20px', background: certBusy ? 'var(--border)' : 'var(--accent)', color: '#fff',
border: 'none', borderRadius: 6, fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14,
cursor: certBusy ? 'not-allowed' : 'pointer', alignSelf: 'flex-start',
}}>{certBusy ? 'Uploading...' : 'Submit for review'}</button>
</form>
</div>
</div>
)
}

export default function DashboardProductsPage() {
const { tier, theme } = useSellerTier()
const isPro = tier === 'PRO'
const isElevated = tier !== 'STARTER'
const accentColor = isPro ? '#FFD54A' : isElevated ? '#4FC3F7' : 'var(--accent)'

const [products, setProducts] = useState<Product[]>([])
const [loading, setLoading] = useState(true)
const [showForm, setShowForm] = useState(false)
const [editProduct, setEditProduct] = useState<Product | null>(null)
const [form, setForm] = useState(emptyForm)
// hasVariants toggles the "multiple colours/sizes" section; variantRows
// holds the working list while it's open. Off by default -- a seller who
// never touches this gets the exact same single-price/single-stock listing
// flow as before this feature existed.
const [hasVariants, setHasVariants] = useState(false)
const [variantRows, setVariantRows] = useState<VariantRow[]>([])
// Quick-grid builder inputs (sizes x colours -> generated option rows).
const [matrixSizes, setMatrixSizes] = useState('')
const [matrixColors, setMatrixColors] = useState('')
// Guided steps (2026-07-28 "major uplift"): 1 Photos & video, 2 Basics,
// 3 Options & sizes, 4 Shipping, 5 Story & compliance. All steps stay
// mounted (display toggling) so nothing typed is ever lost moving around.
const [step, setStep] = useState(1)
const [draftRestored, setDraftRestored] = useState(false)
const [rulesAccepted, setRulesAccepted] = useState(false)
const [saving, setSaving] = useState(false)
const [error, setError] = useState('')
const [sellerCurrency, setSellerCurrency] = useState('GBP')
const [categoryStats, setCategoryStats] = useState<{ count: number; avgPrice: number; medianPrice: number } | null>(null)
const [certProduct, setCertProduct] = useState<Product | null>(null)
const [removingId, setRemovingId] = useState<string | null>(null)

useEffect(() => {
loadProducts()
fetch('/api/dashboard/settings').then((r) => r.json()).then((d) => setSellerCurrency(d.currency || 'GBP')).catch(() => {})
}, [])
useEffect(() => {
if (!form.category) {
setCategoryStats(null)
return
}
fetch(`/api/dashboard/category-stats?category=${encodeURIComponent(form.category)}`)
.then(r => r.json())
.then(setCategoryStats)
.catch(() => setCategoryStats(null))
}, [form.category])

// Draft autosave: new listings only (edits always load from the server).
useEffect(() => {
if (!showForm || editProduct) return
try {
localStorage.setItem('velor-listing-draft', JSON.stringify({ form, hasVariants, variantRows }))
} catch {}
}, [form, hasVariants, variantRows, showForm, editProduct])

async function loadProducts() {
setLoading(true)
const data = await fetch('/api/dashboard/products').then(r => r.json())
setProducts(data.products ?? [])
setLoading(false)
}

function newVariantRow(): VariantRow {
return { tempId: `v${Date.now()}${Math.random().toString(36).slice(2, 8)}`, label: '', color: '', size: '', stock: '', priceOverride: '', image: '' }
}

function openNew() {
setEditProduct(null)
setStep(1)
setDraftRestored(false)
// Draft autosave restore -- a seller who closed the form (or lost the tab)
// picks up exactly where they left off. Cleared on successful create.
try {
const raw = localStorage.getItem('velor-listing-draft')
if (raw) {
const d = JSON.parse(raw)
if (d && d.form && (d.form.name || d.form.description)) {
setForm({ ...emptyForm, ...d.form, currency: d.form.currency || sellerCurrency })
setHasVariants(!!d.hasVariants)
setVariantRows(Array.isArray(d.variantRows) ? d.variantRows : [])
setRulesAccepted(false)
setError('')
setDraftRestored(true)
setShowForm(true)
return
}
}
} catch {}
setForm({ ...emptyForm, currency: sellerCurrency })
setHasVariants(false)
setVariantRows([])
setRulesAccepted(false)
setError('')
setShowForm(true)
}

function openEdit(p: Product) {
setEditProduct(p)
setStep(1)
setDraftRestored(false)
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
isHandmade: p.isHandmade ? 'true' : '', makerStory: p.makerStory ?? '',
materials: p.materials ?? '', containsRegulated: p.requiresCertificate ? 'true' : '',
videoUrl: p.videoUrl ?? '', madeToOrder: p.madeToOrder ? 'true' : '',
leadTimeDays: p.leadTimeDays != null ? String(p.leadTimeDays) : '', sizeGuide: p.sizeGuide ?? '',
currency: sellerCurrency,
})
const existingVariants = p.variants ?? []
setHasVariants(existingVariants.length > 0)
setVariantRows(
existingVariants.length > 0
? existingVariants.map((v) => ({
tempId: v.id,
label: v.label ?? '',
image: v.images?.[0] ?? '',
color: v.color ?? '',
size: v.size ?? '',
stock: String(v.stock),
priceOverride: v.priceOverride !== null ? String(v.priceOverride) : '',
}))
: []
)
setRulesAccepted(false)
setError('')
setShowForm(true)
}

// Enterprise-only: pre-fills the New Product form with an existing
// product's data (no id attached) so submitting creates a brand new
// listing — a genuine time-saver for sellers with large catalogues.
function openDuplicate(p: Product) {
setEditProduct(null)
setStep(1)
setDraftRestored(false)
const imgs = (p.images ?? []).slice(0, MAX_IMAGES)
while (imgs.length < MAX_IMAGES) imgs.push('')
setForm({
name: `${p.name} (Copy)`, description: p.description, price: String(p.price),
stock: String(p.stock), category: p.category, images: imgs,
weightGrams: p.weightGrams !== null ? String(p.weightGrams) : '',
lengthCm: p.lengthCm !== null ? String(p.lengthCm) : '',
widthCm: p.widthCm !== null ? String(p.widthCm) : '',
heightCm: p.heightCm !== null ? String(p.heightCm) : '',
hsCode: p.hsCode ?? '', originCountry: p.originCountry ?? '',
isHandmade: p.isHandmade ? 'true' : '', makerStory: p.makerStory ?? '',
materials: p.materials ?? '', containsRegulated: p.requiresCertificate ? 'true' : '',
videoUrl: p.videoUrl ?? '', madeToOrder: p.madeToOrder ? 'true' : '',
leadTimeDays: p.leadTimeDays != null ? String(p.leadTimeDays) : '', sizeGuide: p.sizeGuide ?? '',
currency: sellerCurrency,
})
const duplicatedVariants = p.variants ?? []
setHasVariants(duplicatedVariants.length > 0)
setVariantRows(
duplicatedVariants.length > 0
? duplicatedVariants.map((v) => ({
tempId: newVariantRow().tempId,
label: v.label ?? '',
image: v.images?.[0] ?? '',
color: v.color ?? '',
size: v.size ?? '',
stock: String(v.stock),
priceOverride: v.priceOverride !== null ? String(v.priceOverride) : '',
}))
: []
)
setRulesAccepted(false)
setError('')
setShowForm(true)
}

function set(k: keyof typeof emptyForm, v: string) {
setForm(f => ({ ...f, [k]: v }))
setError('')
}

// Never been ordered -> gone for good. Has order history -> delisted
// (hidden from buyers, kept for receipts/disputes) -- the API decides which,
// see app/api/dashboard/products/route.ts's DELETE handler for why.
async function removeProduct(p: Product) {
if (!confirm(`Remove "${p.name}"? If it has never sold, it will be deleted completely. If it has order history, it will be delisted and hidden from buyers instead -- this cannot be undone from here.`)) return
setRemovingId(p.id)
try {
const res = await fetch('/api/dashboard/products?id=' + p.id, { method: 'DELETE' })
const data = await res.json()
if (!res.ok) { alert(data.error ?? 'Could not remove this listing'); return }
if (data.mode === 'delisted') alert(data.message)
await loadProducts()
} catch {
alert('Network error -- could not remove this listing')
} finally {
setRemovingId(null)
}
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
if (!rulesAccepted) {
setError('Please confirm this listing complies with the Seller Rules and Product Compliance Policy.')
return
}
if (validImageCount < MIN_IMAGES) {
setStep(1)
setError(`Please add at least ${MIN_IMAGES} product photos.`)
return
}
if (!form.name.trim() || !form.price || !form.category) {
setStep(2)
setError('Please fill in the name, price, and category.')
return
}
if (!form.originCountry) {
setStep(4)
setError('Please select the origin country.')
return
}
if (!form.weightGrams || !form.lengthCm || !form.widthCm || !form.heightCm) {
setStep(4)
setError('Please add weight and dimensions (weight, length, width, height) so shipping can be calculated.')
return
}
// Client-side variant validation mirrors the server check in
// app/api/dashboard/products/route.ts's normalizeVariants -- gives an
// immediate error instead of waiting on a round trip, but the server
// check is the real backstop since this form isn't the only caller.
let variantsPayload: { label: string | null; color: string | null; size: string | null; images: string[]; stock: number; priceOverride: number | null }[] | undefined
if (hasVariants) {
const seenKeys = new Set<string>()
for (const row of variantRows) {
const label = row.label.trim()
const color = row.color.trim()
const size = row.size.trim()
if (!label && !color && !size) {
setError('Each option needs a name (e.g. "Dragon design"), a colour, a size, or some combination.')
return
}
const key = `${label.toLowerCase()}|${color.toLowerCase()}|${size.toLowerCase()}`
if (seenKeys.has(key)) {
setError(`You have more than one option for ${[label, color, size].filter(Boolean).join(' / ')} -- remove the duplicate.`)
return
}
seenKeys.add(key)
}
if (variantRows.length === 0) {
setError('Add at least one option, or turn off the options section for a single-version listing.')
return
}
variantsPayload = variantRows.map((row) => ({
label: row.label.trim() || null,
color: row.color.trim() || null,
size: row.size.trim() || null,
images: row.image ? [row.image] : [],
stock: Math.max(0, parseInt(row.stock, 10) || 0),
priceOverride: row.priceOverride.trim() ? parseFloat(row.priceOverride) : null,
}))
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
isHandmade: form.isHandmade === 'true',
makerStory: form.makerStory.trim() || null,
materials: form.materials.trim() || null,
containsRegulatedMaterial: form.containsRegulated === 'true',
rulesAccepted: rulesAccepted,
videoUrl: form.videoUrl.trim() || null,
madeToOrder: form.madeToOrder === 'true',
leadTimeDays: form.madeToOrder === 'true' && form.leadTimeDays.trim() ? parseInt(form.leadTimeDays, 10) : null,
sizeGuide: form.sizeGuide.trim() || null,
// hasVariants=false sends [] (explicitly clears any old variants, e.g.
// a seller turning the toggle back off) -- see variantsProvided in the
// API route for why the key must be present either way, never omitted.
variants: hasVariants ? variantsPayload : [],
}
const url = editProduct ? '/api/dashboard/products?id=' + editProduct.id : '/api/dashboard/products'
const method = editProduct ? 'PATCH' : 'POST'
const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
if (res.ok && !editProduct) { try { localStorage.removeItem('velor-listing-draft') } catch {} }
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
<div style={{ padding: '32px 40px', fontFamily: 'var(--font-body)', position: 'relative', zIndex: 1 }}>
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px' }}>
<div>
<div style={{ fontFamily: HALO.fontDisplay, fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: HALO.accent, marginBottom: 4 }}>Sell</div>
<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
<h1 style={{ fontFamily: HALO.fontSerif, fontStyle: 'italic', fontWeight: 500, fontSize: '30px', color: HALO.ink, margin: 0 }}>Products</h1>
<PlanBadge tier={tier} />
</div>
</div>
<HaloButton variant="accent" onClick={openNew}>Add Product</HaloButton>
</div>

{showForm && (
<div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(2px)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px', overflowY: 'auto' }}>
<div style={tierCardStyle(theme, { padding: '32px', maxWidth: '640px', width: '100%', position: 'relative', overflow: 'hidden' })}>
{isElevated && (
<div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: isPro ? 'linear-gradient(90deg, #FFD54A, #FF6B00)' : '#4FC3F7' }} />
)}
<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
<div style={{
width: 36, height: 36, borderRadius: 9, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
background: isElevated ? `${accentColor}18` : 'var(--bg)', border: `1px solid ${isElevated ? accentColor : 'var(--border)'}`,
}}>
<svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M4 7l8-4 8 4-8 4-8-4Z" stroke={isElevated ? accentColor : 'var(--text)'} strokeWidth="1.6" strokeLinejoin="round" />
<path d="M4 7v10l8 4 8-4V7" stroke={isElevated ? accentColor : 'var(--text)'} strokeWidth="1.6" strokeLinejoin="round" />
<path d="M12 11v10" stroke={isElevated ? accentColor : 'var(--text)'} strokeWidth="1.6" />
</svg>
</div>
<div>
<h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
{editProduct ? 'Edit Product' : 'New Product'}
</h2>
<div style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: 2 }}>
{editProduct ? "Update this listing's details" : 'List a new item on Velor Marketplace'}
</div>
</div>
</div>
<div style={{ height: 1, background: 'var(--border)', margin: '20px 0 22px' }} />
<div style={{
  background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8,
  padding: '14px 16px', marginBottom: 18, fontSize: '13px', lineHeight: 1.5, color: 'var(--text)',
}}>
  <strong>Before you list:</strong> Velor only allows newly made cultural and artisan goods. Genuine antiques, artifacts, and items presented as historically or archaeologically significant are never allowed, regardless of value or how they were acquired -- see our{' '}
  <a href="/legal/seller-rules" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontWeight: 600 }}>
    Seller Rules and Product Compliance Policy
  </a>{' '}
  for the full list of prohibited items (including ivory, tortoiseshell, and protected bird feathers). Listings that violate this policy are blocked automatically.
</div>
<form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
{/* Guided step navigation + listing strength (2026-07-28 major uplift:
William, "its still box looking atm which needs a major uplift"). All
steps stay mounted via display toggling so typed values persist. */}
{(() => {
const stepTitles = ['Photos & video', 'The basics', 'Options & sizes', 'Shipping', 'Story & submit']
const checks: { done: boolean; hint: string }[] = [
{ done: validImageCount >= MIN_IMAGES, hint: `Add at least ${MIN_IMAGES} photos` },
{ done: validImageCount >= 5, hint: '5+ photos show the piece properly' },
{ done: form.videoUrl.trim().length > 0, hint: 'A video builds real buyer trust' },
{ done: form.name.trim().length >= 15, hint: 'A fuller title helps buyers find it' },
{ done: form.description.trim().length >= 80, hint: 'Describe the piece in a few sentences' },
{ done: !!form.category, hint: 'Pick a category' },
{ done: !!form.originCountry, hint: 'Set the origin country' },
{ done: !!(form.weightGrams && form.lengthCm && form.widthCm && form.heightCm), hint: 'Weight & dimensions unlock shipping' },
{ done: form.materials.trim().length > 0, hint: 'List the materials' },
{ done: form.isHandmade !== 'true' || form.makerStory.trim().length > 0, hint: 'Tell the maker story' },
]
const done = checks.filter(c => c.done).length
const pct = Math.round((done / checks.length) * 100)
const nextHints = checks.filter(c => !c.done).slice(0, 2)
return (
<div style={{ marginBottom: '4px' }}>
<div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
{stepTitles.map((t, i) => (
<button key={t} type="button" onClick={() => setStep(i + 1)}
style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 999, cursor: 'pointer', fontSize: '12px', fontWeight: 700,
border: step === i + 1 ? '1.5px solid var(--accent)' : '1px solid var(--border)',
background: step === i + 1 ? 'rgba(255,107,0,0.10)' : 'transparent',
color: step === i + 1 ? 'var(--accent)' : 'var(--muted)' }}>
<span style={{ width: 17, height: 17, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10.5px', background: step === i + 1 ? 'var(--accent)' : 'var(--border)', color: step === i + 1 ? '#160a00' : 'var(--muted)' }}>{i + 1}</span>
{t}
</button>
))}
</div>
<div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10 }}>
<div style={{ fontSize: '11.5px', fontWeight: 800, color: pct >= 70 ? 'var(--green)' : 'var(--accent)', whiteSpace: 'nowrap' }}>Listing strength {pct}%</div>
<div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
<div style={{ width: `${pct}%`, height: '100%', background: pct >= 70 ? 'var(--green)' : 'var(--accent)', transition: 'width .3s' }} />
</div>
{nextHints.length > 0 && (
<div style={{ fontSize: '11px', color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '45%' }}>
Next: {nextHints.map(h => h.hint).join(' · ')}
</div>
)}
</div>
{draftRestored && (
<div style={{ marginTop: 8, fontSize: '11.5px', color: 'var(--green)', fontWeight: 600 }}>
Draft restored — you're picking up where you left off.
</div>
)}
</div>
)
})()}

{/* STEP 2: The basics */}
<div style={{ display: step === 2 ? 'flex' : 'none', flexDirection: 'column', gap: '18px' }}>
<div>
<label style={labelStyle}>Name *</label>
<input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} />
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
<div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
Buyers worldwide see this converted live to their currency and reconfirmed at checkout. Exchange rates move, but your payout is always based on the price you set here.
</div>
</div>
</div>

<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
<div>
<label style={labelStyle}>Inventory No:</label>
{hasVariants ? (
<div style={{ ...inputStyle, display: 'flex', alignItems: 'center', color: 'var(--muted)', background: 'var(--bg)' }}>
Set per variant below
</div>
) : (
<input style={inputStyle} type="number" value={form.stock} onChange={e => set('stock', e.target.value)} />
)}
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

</div>

{/* STEP 3: Options & sizes */}
<div style={{ display: step === 3 ? 'flex' : 'none', flexDirection: 'column', gap: '0px' }}>
{/* Options & variants (2026-07-28 overhaul, William: "single listing which
has the option of different varients and prices... not just for clothes
all listings"): generic named options -- each with its own price and
stock -- plus a size x colour matrix builder for clothing sellers. */}
<div style={{ marginTop: '16px' }}>
<label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text)' }}>
<input
type="checkbox"
checked={hasVariants}
onChange={(e) => {
const checked = e.target.checked
setHasVariants(checked)
if (checked && variantRows.length === 0) setVariantRows([newVariantRow()])
}}
/>
This item comes in different options — designs, colours, sizes, sets — each with its own price and stock
</label>
{hasVariants && (
<div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
<div style={{ fontSize: '11px', color: 'var(--muted)' }}>
One listing, many versions — buyers pick an option on your product page instead of you listing the same product several times. Name each option anything that fits (&quot;Dragon design&quot;, &quot;Lavender&quot;, &quot;Set of 3&quot;) and/or use colour and size. Leave price blank to charge the main price above.
</div>
{/* Clothes/shoes shortcut: tick nothing, type sizes + colours, generate
the whole grid in one click instead of hand-adding every row. */}
<div style={{ border: '1px dashed var(--border)', borderRadius: 8, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
<div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)' }}>Quick grid for sizes &amp; colours</div>
{/* Tap-to-fill pills (William: "sellers need dropdown pills for easy
use" + "need to cover oversize people too") -- size sets through 6XL
and common colours, no typing needed. */}
<div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
{[
{ label: 'XS–2XL', value: 'XS, S, M, L, XL, 2XL' },
{ label: 'Plus 2XL–6XL', value: '2XL, 3XL, 4XL, 5XL, 6XL' },
{ label: 'Full XS–6XL', value: 'XS, S, M, L, XL, 2XL, 3XL, 4XL, 5XL, 6XL' },
{ label: 'UK shoes 3–13', value: 'UK 3, UK 4, UK 5, UK 6, UK 7, UK 8, UK 9, UK 10, UK 11, UK 12, UK 13' },
{ label: 'One size', value: 'One Size' },
].map(pz => (
<button key={pz.label} type="button" onClick={() => setMatrixSizes(pz.value)}
style={{ padding: '5px 11px', borderRadius: 999, border: matrixSizes === pz.value ? '1.5px solid var(--accent)' : '1px solid var(--border)', background: matrixSizes === pz.value ? 'rgba(255,107,0,0.10)' : 'transparent', color: matrixSizes === pz.value ? 'var(--accent)' : 'var(--muted)', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}>
{pz.label}
</button>
))}
</div>
<div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
{['Black', 'White', 'Red', 'Blue', 'Green', 'Brown', 'Beige', 'Grey', 'Natural', 'Multicolour'].map(c => {
const current = matrixColors.split(',').map(x => x.trim()).filter(Boolean)
const active = current.includes(c)
return (
<button key={c} type="button"
onClick={() => setMatrixColors(active ? current.filter(x => x !== c).join(', ') : [...current, c].join(', '))}
style={{ padding: '5px 11px', borderRadius: 999, border: active ? '1.5px solid var(--accent)' : '1px solid var(--border)', background: active ? 'rgba(255,107,0,0.10)' : 'transparent', color: active ? 'var(--accent)' : 'var(--muted)', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}>
{c}
</button>
)
})}
</div>
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', alignItems: 'center' }}>
<input style={inputStyle} placeholder="Sizes, comma-separated (e.g. S, M, L, XL)" value={matrixSizes} onChange={e => setMatrixSizes(e.target.value)} />
<input style={inputStyle} placeholder="Colours, comma-separated (e.g. Red, Black)" value={matrixColors} onChange={e => setMatrixColors(e.target.value)} />
<button
type="button"
onClick={() => {
const sizes = matrixSizes.split(',').map(x => x.trim()).filter(Boolean)
const colors = matrixColors.split(',').map(x => x.trim()).filter(Boolean)
if (sizes.length === 0 && colors.length === 0) return
const sizeList = sizes.length > 0 ? sizes : ['']
const colorList = colors.length > 0 ? colors : ['']
const existingKeys = new Set(variantRows.map(r => `${r.label.trim().toLowerCase()}|${r.color.trim().toLowerCase()}|${r.size.trim().toLowerCase()}`))
const generated: VariantRow[] = []
for (const c of colorList) {
for (const sz of sizeList) {
const key = `|${c.toLowerCase()}|${sz.toLowerCase()}`
if (existingKeys.has(key)) continue
generated.push({ ...newVariantRow(), color: c, size: sz })
}
}
const keep = variantRows.filter(r => r.label.trim() || r.color.trim() || r.size.trim() || r.stock.trim() || r.priceOverride.trim())
setVariantRows([...keep, ...generated])
}}
style={{ background: 'var(--accent)', color: '#160a00', border: 'none', borderRadius: 8, padding: '10px 16px', fontWeight: 700, fontSize: '12.5px', cursor: 'pointer', whiteSpace: 'nowrap' }}
>
Generate grid
</button>
</div>
<div style={{ fontSize: '10.5px', color: 'var(--muted)' }}>
Creates a row for every size &times; colour combination (e.g. 4 sizes &times; 3 colours = 12 rows) — then just fill in the stock for each.
</div>
</div>
{variantRows.map((row, idx) => {
const upd = (patch: Partial<VariantRow>) => {
const next = [...variantRows]
next[idx] = { ...next[idx], ...patch }
setVariantRows(next)
}
const optionTitle = [row.label.trim(), row.color.trim(), row.size.trim()].filter(Boolean).join(' · ') || `Option ${idx + 1}`
return (
<div key={row.tempId} style={{
border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface)', padding: '12px',
display: 'flex', flexDirection: 'column', gap: '10px',
}}>
<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
<VariantPhotoBox id={`variant-photo-${row.tempId}`} value={row.image} onChange={(v) => upd({ image: v })} />
<div style={{ flex: 1, minWidth: 0 }}>
<div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>{optionTitle}</div>
<input
style={inputStyle}
placeholder='Option name — "Dragon design", "Lavender", "Set of 3"...'
value={row.label}
onChange={e => upd({ label: e.target.value })}
/>
</div>
<button
type="button"
onClick={() => setVariantRows(variantRows.filter((_, i) => i !== idx))}
style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: 'var(--muted)', fontSize: '16px', lineHeight: 1, flexShrink: 0 }}
aria-label="Remove option" title="Remove option"
>
&times;
</button>
</div>
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 90px 110px', gap: '8px' }}>
<input style={inputStyle} placeholder="Colour (optional)" value={row.color} onChange={e => upd({ color: e.target.value })} />
<input style={inputStyle} placeholder="Size (optional)" value={row.size} onChange={e => upd({ size: e.target.value })} />
<input style={inputStyle} type="number" placeholder="Stock" value={row.stock} onChange={e => upd({ stock: e.target.value })} />
<input style={inputStyle} type="number" step="0.01" placeholder="Price" value={row.priceOverride} onChange={e => upd({ priceOverride: e.target.value })} />
</div>
</div>
)
})}
<button
type="button"
onClick={() => setVariantRows([...variantRows, newVariantRow()])}
style={{
alignSelf: 'flex-start', background: 'none', border: '1px dashed var(--border)', borderRadius: 6,
padding: '8px 14px', cursor: 'pointer', color: 'var(--accent)', fontSize: '12.5px', fontWeight: 600,
}}
>
+ Add another option
</button>
<div style={{ fontSize: '11px', color: 'var(--muted)' }}>
Leave price blank to use the main price above for that option. Total inventory shown to buyers is the sum of all option stock. Each option needs a name, colour, or size (any combination).
</div>
</div>
)}
</div>

{/* Video by link (William, 2026-07-28: free for now; paid upload later).
Validated server-side to YouTube/Vimeo only. */}
<div style={{ marginTop: '16px' }}>
<label style={labelStyle}>Product video (optional — YouTube or Vimeo link)</label>
<input
style={inputStyle}
type="url"
placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
value={form.videoUrl}
onChange={e => set('videoUrl', e.target.value)}
/>
<div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
A short video of the piece — or you making it — plays on your product page. Listings with video build far more buyer trust. Upload to YouTube (free) and paste the link here.
</div>
</div>

{/* Made to order -- for artisans who craft on demand rather than holding
stock. Inventory number becomes their order capacity. */}
<div style={{ marginTop: '16px' }}>
<label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text)' }}>
<input
type="checkbox"
checked={form.madeToOrder === 'true'}
onChange={(e) => set('madeToOrder', e.target.checked ? 'true' : '')}
/>
Made to order — I craft this when a buyer orders it
</label>
{form.madeToOrder === 'true' && (
<div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: '180px 1fr', gap: '10px', alignItems: 'center' }}>
<input
style={inputStyle}
type="number"
min="1"
max="120"
placeholder="Days to make &amp; ship"
value={form.leadTimeDays}
onChange={e => set('leadTimeDays', e.target.value)}
/>
<div style={{ fontSize: '11px', color: 'var(--muted)' }}>
Buyers see &quot;Made to order — crafted when you buy, ships in ~X days&quot; instead of a stock count. Set Inventory No above to how many orders you can take on at once.
</div>
</div>
)}
</div>

{/* Size guide -- free-text measurements table, shown on the product page. */}
<div style={{ marginTop: '16px' }}>
<label style={labelStyle}>Size guide (optional — for garments, shoes, jewellery)</label>
<textarea
style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' as const }}
placeholder={"e.g.\nS — chest 92cm, length 66cm\nM — chest 98cm, length 69cm\nL — chest 104cm, length 72cm"}
value={form.sizeGuide}
onChange={e => set('sizeGuide', e.target.value)}
/>
<div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
Shown as a &quot;Size guide&quot; section on your product page — fewer wrong-size returns.
</div>
</div>

</div>

{/* STEP 5: Story & compliance */}
<div style={{ display: step === 5 ? 'flex' : 'none', flexDirection: 'column', gap: '0px' }}>
<div style={{ marginTop: '0px' }}>
<label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text)' }}>
<input
type="checkbox"
checked={form.isHandmade === 'true'}
onChange={(e) => set('isHandmade', e.target.checked ? 'true' : '')}
/>
This is a handmade or artisan-made product
</label>
</div>

<div style={{ marginTop: '16px' }}>
<label style={labelStyle}>The story behind this piece (optional — but stories sell)</label>
<textarea
style={{ ...inputStyle, minHeight: '90px', resize: 'vertical' as const }}
value={form.makerStory}
onChange={(e) => set('makerStory', e.target.value)}
placeholder="Who made this, where, and what tradition does it come from? Buyers on Velor come for exactly this — it's shown on your product page."
maxLength={2000}
/>
</div>

{/* Materials & regulated-material declaration — see /legal/seller-rules */}
<div>
<label style={labelStyle}>Materials</label>
<input
style={inputStyle}
value={form.materials}
onChange={e => set('materials', e.target.value)}
placeholder="e.g. brass, cotton, sheesham wood, glass beads"
maxLength={300}
/>
<div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '6px' }}>
Listing what this product is made from builds buyer trust and is used for customs and compliance screening.
</div>
<label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text)', marginTop: '12px' }}>
<input
type="checkbox"
checked={form.containsRegulated === 'true'}
onChange={(e) => set('containsRegulated', e.target.checked ? 'true' : '')}
style={{ marginTop: '2px' }}
/>
<span>This product contains a regulated material (wildlife or plant material such as exotic leather, coral, feathers, protected wood, or similar)</span>
</label>
{form.containsRegulated === 'true' && (
<div style={{ marginTop: '10px', padding: '12px 14px', background: 'rgba(255,107,0,0.08)', border: '1px solid var(--accent)', borderRadius: '8px', fontSize: '12px', lineHeight: 1.6, color: 'var(--muted)' }}>
Regulated materials need valid permits (for example CITES export permits) before this listing can go live. After saving, upload your permit documents from the product list — the listing stays in review until our team verifies them. See the <a href="/legal/seller-rules" target="_blank" style={{ color: 'var(--accent)' }}>Seller Rules</a> for details. Declaring honestly here protects your shipments from customs seizure.
</div>
)}
</div>
</div>

{/* STEP 1: Photos & video */}
<div style={{ display: step === 1 ? 'flex' : 'none', flexDirection: 'column', gap: '18px' }}>
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
{(() => {
const suggestions = getListingSuggestions(form, validImageCount, categoryStats)
if (suggestions.length === 0) return null
return (
<div style={{ marginTop: '18px', padding: '14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
<div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>Listing Health</div>
{suggestions.map((s, i) => (
<div key={i} style={{ fontSize: '12px', color: s.level === 'warning' ? 'var(--red)' : 'var(--muted)', marginBottom: '6px' }}>
{s.level === 'warning' ? 'Warning: ' : 'Tip: '}{s.text}
</div>
))}
</div>
)
})()}
</div>

</div>

{/* STEP 4: Shipping */}
<div style={{ display: step === 4 ? 'flex' : 'none', flexDirection: 'column', gap: '0px' }}>
<div style={{ borderTop: 'none', paddingTop: '0px' }}>
<div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>Shipping & Customs</div>
<div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '14px' }}>
Weight and dimensions are used for shipping labels. HS code is recommended if this item may ever ship internationally — Velor is a global marketplace, so a buyer anywhere could order it.
</div>

<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
<div>
<label style={labelStyle}>Weight (g)</label>
<input style={inputStyle} type="number" value={form.weightGrams} onChange={e => set('weightGrams', e.target.value)} placeholder="450" />
</div>
<div>
<label style={labelStyle}>Length (cm)</label>
<input style={inputStyle} type="number" step="0.1" value={form.lengthCm} onChange={e => set('lengthCm', e.target.value)} placeholder="18" />
</div>
<div>
<label style={labelStyle}>Width (cm)</label>
<input style={inputStyle} type="number" step="0.1" value={form.widthCm} onChange={e => set('widthCm', e.target.value)} placeholder="13" />
</div>
<div>
<label style={labelStyle}>Height (cm)</label>
<input style={inputStyle} type="number" step="0.1" value={form.heightCm} onChange={e => set('heightCm', e.target.value)} placeholder="7" />
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
<div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '6px' }}>
Please tell us the true cultural origin of this item, not your own location — this places your listing on the correct country page. Only a seller’s first listing under a not-yet-claimed country earns founding-seller status for that country.
</div>
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

</div>

{error && (
<div style={{ padding: '10px 14px', background: 'rgba(255,23,68,0.08)', border: '1px solid var(--red)', borderRadius: '6px', color: 'var(--red)', fontSize: '13px' }}>
{error}
</div>
)}

{/* Seller Rules acknowledgment — required on every save, enforced server-side too */}
<label style={{ display: step === 5 ? 'flex' : 'none', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text)', lineHeight: 1.5 }}>
<input
type="checkbox"
checked={rulesAccepted}
onChange={(e) => setRulesAccepted(e.target.checked)}
style={{ marginTop: '2px' }}
/>
<span>
I confirm this listing is accurate and complies with the <a href="/legal/seller-rules" target="_blank" style={{ color: 'var(--accent)' }}>Seller Rules and Product Compliance Policy</a>, including the prohibited items and regulated materials rules.
</span>
</label>

<div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center' }}>
<HaloButton type="button" variant="soft" onClick={() => setShowForm(false)}>
Cancel
</HaloButton>
{step > 1 && (
<button type="button" onClick={() => setStep(step - 1)} style={{ padding: '11px 20px', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '999px', fontFamily: HALO.fontDisplay, fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}>
Back
</button>
)}
{step < 5 && (
<button type="button" onClick={() => setStep(step + 1)} style={{ padding: '11px 22px', background: accentColor, color: isElevated ? '#000' : '#FFF4E8', border: 'none', borderRadius: '999px', fontFamily: HALO.fontDisplay, fontWeight: 800, fontSize: '13px', letterSpacing: '0.03em', cursor: 'pointer', boxShadow: `0 10px 26px ${accentColor}40` }}>
Next
</button>
)}
<button type="submit" disabled={saving || !rulesAccepted} style={{ display: step === 5 ? 'inline-block' : 'none',
padding: '11px 22px', background: saving || !rulesAccepted ? 'rgba(26,26,29,0.14)' : accentColor, color: isElevated ? '#000' : '#FFF4E8',
border: 'none', borderRadius: '999px', fontFamily: HALO.fontDisplay, fontWeight: 800, fontSize: '13px', letterSpacing: '0.03em',
cursor: saving || !rulesAccepted ? 'not-allowed' : 'pointer',
boxShadow: saving || !rulesAccepted ? 'none' : `0 10px 26px ${accentColor}40`,
}}>
{saving ? 'Saving...' : editProduct ? 'Save Changes' : 'Create Product'}
</button>
</div>
</form>
</div>
</div>
)}

{certProduct && <CertificatePanel product={certProduct} onClose={() => { setCertProduct(null); loadProducts() }} />}

<div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
{products.map(p => (
<div key={p.id} style={tierCardStyle(theme, {
padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', overflow: 'hidden',
})}>
{isElevated && (
<div style={{
position: 'absolute', top: 0, left: 0, bottom: 0, width: 3,
background: isPro ? 'linear-gradient(180deg, #FFD54A, #FF6B00)' : '#4FC3F7',
}} />
)}
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
{p.requiresCertificate && (
<span style={{
padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em',
background: 'rgba(255,213,74,0.15)', color: '#FFD54A',
}}>Certificate Required</span>
)}
{p.requiresCertificate && (
<button onClick={() => setCertProduct(p)} title="Upload or check permit documents for this listing" style={{
padding: '7px 14px', background: 'rgba(255,213,74,0.1)', border: '1px solid rgba(255,213,74,0.4)', borderRadius: '6px',
color: '#FFD54A', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
}}>Certificates</button>
)}
<span style={{
padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em',
background: p.status === 'APPROVED' ? 'rgba(0,230,118,0.15)' : 'rgba(255,107,0,0.15)',
color: p.status === 'APPROVED' ? 'var(--green)' : 'var(--accent)',
}}>{p.status.replace('_', ' ')}</span>
{isPro && (
<button onClick={() => openDuplicate(p)} title="Create a new listing pre-filled with this product's details" style={{
padding: '7px 14px', background: 'rgba(255,213,74,0.1)', border: '1px solid rgba(255,213,74,0.4)', borderRadius: '6px',
color: '#FFD54A', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
}}>Duplicate</button>
)}
<button onClick={() => openEdit(p)} style={{
padding: '7px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px',
color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
}}>Edit</button>
<button
onClick={() => removeProduct(p)}
disabled={removingId === p.id}
title="Delete this listing completely, or delist it if it has order history"
style={{
padding: '7px 16px', background: 'var(--bg)', border: '1px solid var(--red)', borderRadius: '6px',
color: 'var(--red)', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600,
cursor: removingId === p.id ? 'default' : 'pointer', opacity: removingId === p.id ? 0.6 : 1,
}}>{removingId === p.id ? 'Removing...' : 'Remove'}</button>
</div>
))}
{products.length === 0 && (
<div style={tierCardStyle(theme, { textAlign: 'center', color: 'var(--muted)', padding: '60px 20px', fontSize: '14px' })}>
No products yet. Add your first product to get started.
</div>
)}
</div>
</div>
)
}
