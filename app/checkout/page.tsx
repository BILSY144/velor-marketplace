'use client'

import { useState, useEffect, useCallback } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useCurrencyDisplay } from '@/lib/useCurrencyDisplay'
import { useCart } from '@/lib/cart'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const CURRENCIES: Record<string, string> = {
  GB: 'GBP', US: 'USD', EU: 'EUR', DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR',
  NL: 'EUR', BE: 'EUR', AT: 'EUR', SE: 'SEK', NO: 'NOK', DK: 'DKK', CH: 'CHF',
  AU: 'AUD', CA: 'CAD', JP: 'JPY', SG: 'SGD', AE: 'AED', CN: 'CNY',
}

const COUNTRIES = [
  { code: 'GB', name: 'United Kingdom' }, { code: 'US', name: 'United States' },
  { code: 'DE', name: 'Germany' }, { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' }, { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' }, { code: 'BE', name: 'Belgium' },
  { code: 'SE', name: 'Sweden' }, { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' }, { code: 'FI', name: 'Finland' },
  { code: 'PL', name: 'Poland' }, { code: 'CH', name: 'Switzerland' },
  { code: 'AT', name: 'Austria' }, { code: 'AU', name: 'Australia' },
  { code: 'CA', name: 'Canada' }, { code: 'JP', name: 'Japan' },
  { code: 'SG', name: 'Singapore' }, { code: 'AE', name: 'UAE' },
  { code: 'HK', name: 'Hong Kong' }, { code: 'IN', name: 'India' },
]

// Full global list for the phone country-code selector -- intentionally
// separate from COUNTRIES (the shipping-destination dropdown), since the
// buyer's phone country may differ from where the order ships, and this
// covers every ITU-assigned calling code, not just Velor's current
// shipping-supported destinations.
const PHONE_COUNTRIES = [
  { code: 'AD', name: 'Andorra' }, { code: 'AE', name: 'United Arab Emirates' }, { code: 'AF', name: 'Afghanistan' }, { code: 'AG', name: 'Antigua and Barbuda' }, { code: 'AI', name: 'Anguilla' }, { code: 'AL', name: 'Albania' }, { code: 'AM', name: 'Armenia' }, { code: 'AO', name: 'Angola' }, { code: 'AR', name: 'Argentina' }, { code: 'AS', name: 'American Samoa' }, { code: 'AT', name: 'Austria' }, { code: 'AU', name: 'Australia' }, { code: 'AW', name: 'Aruba' }, { code: 'AX', name: 'Aland Islands' }, { code: 'AZ', name: 'Azerbaijan' }, { code: 'BA', name: 'Bosnia and Herzegovina' }, { code: 'BB', name: 'Barbados' }, { code: 'BD', name: 'Bangladesh' }, { code: 'BE', name: 'Belgium' }, { code: 'BF', name: 'Burkina Faso' }, { code: 'BG', name: 'Bulgaria' }, { code: 'BH', name: 'Bahrain' }, { code: 'BI', name: 'Burundi' }, { code: 'BJ', name: 'Benin' }, { code: 'BL', name: 'Saint Barthelemy' }, { code: 'BM', name: 'Bermuda' }, { code: 'BN', name: 'Brunei' }, { code: 'BO', name: 'Bolivia' }, { code: 'BQ', name: 'Caribbean Netherlands' }, { code: 'BR', name: 'Brazil' }, { code: 'BS', name: 'Bahamas' }, { code: 'BT', name: 'Bhutan' }, { code: 'BV', name: 'Bouvet Island' }, { code: 'BW', name: 'Botswana' }, { code: 'BY', name: 'Belarus' }, { code: 'BZ', name: 'Belize' }, { code: 'CA', name: 'Canada' }, { code: 'CC', name: 'Cocos (Keeling) Islands' }, { code: 'CD', name: 'DR Congo' }, { code: 'CF', name: 'Central African Republic' }, { code: 'CG', name: 'Republic of the Congo' }, { code: 'CH', name: 'Switzerland' }, { code: 'CI', name: 'Ivory Coast' }, { code: 'CK', name: 'Cook Islands' }, { code: 'CL', name: 'Chile' }, { code: 'CM', name: 'Cameroon' }, { code: 'CN', name: 'China' }, { code: 'CO', name: 'Colombia' }, { code: 'CR', name: 'Costa Rica' }, { code: 'CU', name: 'Cuba' }, { code: 'CV', name: 'Cape Verde' }, { code: 'CW', name: 'Curacao' }, { code: 'CX', name: 'Christmas Island' }, { code: 'CY', name: 'Cyprus' }, { code: 'CZ', name: 'Czechia' }, { code: 'DE', name: 'Germany' }, { code: 'DJ', name: 'Djibouti' }, { code: 'DK', name: 'Denmark' }, { code: 'DM', name: 'Dominica' }, { code: 'DO', name: 'Dominican Republic' }, { code: 'DZ', name: 'Algeria' }, { code: 'EC', name: 'Ecuador' }, { code: 'EE', name: 'Estonia' }, { code: 'EG', name: 'Egypt' }, { code: 'EH', name: 'Western Sahara' }, { code: 'ER', name: 'Eritrea' }, { code: 'ES', name: 'Spain' }, { code: 'ET', name: 'Ethiopia' }, { code: 'FI', name: 'Finland' }, { code: 'FJ', name: 'Fiji' }, { code: 'FK', name: 'Falkland Islands' }, { code: 'FM', name: 'Micronesia' }, { code: 'FO', name: 'Faroe Islands' }, { code: 'FR', name: 'France' }, { code: 'GA', name: 'Gabon' }, { code: 'GB', name: 'United Kingdom' }, { code: 'GD', name: 'Grenada' }, { code: 'GE', name: 'Georgia' }, { code: 'GF', name: 'French Guiana' }, { code: 'GG', name: 'Guernsey' }, { code: 'GH', name: 'Ghana' }, { code: 'GI', name: 'Gibraltar' }, { code: 'GL', name: 'Greenland' }, { code: 'GM', name: 'Gambia' }, { code: 'GN', name: 'Guinea' }, { code: 'GP', name: 'Guadeloupe' }, { code: 'GQ', name: 'Equatorial Guinea' }, { code: 'GR', name: 'Greece' }, { code: 'GS', name: 'South Georgia' }, { code: 'GT', name: 'Guatemala' }, { code: 'GU', name: 'Guam' }, { code: 'GW', name: 'Guinea-Bissau' }, { code: 'GY', name: 'Guyana' }, { code: 'HK', name: 'Hong Kong' }, { code: 'HN', name: 'Honduras' }, { code: 'HR', name: 'Croatia' }, { code: 'HT', name: 'Haiti' }, { code: 'HU', name: 'Hungary' }, { code: 'ID', name: 'Indonesia' }, { code: 'IE', name: 'Ireland' }, { code: 'IL', name: 'Israel' }, { code: 'IM', name: 'Isle of Man' }, { code: 'IN', name: 'India' }, { code: 'IO', name: 'British Indian Ocean Territory' }, { code: 'IQ', name: 'Iraq' }, { code: 'IR', name: 'Iran' }, { code: 'IS', name: 'Iceland' }, { code: 'IT', name: 'Italy' }, { code: 'JE', name: 'Jersey' }, { code: 'JM', name: 'Jamaica' }, { code: 'JO', name: 'Jordan' }, { code: 'JP', name: 'Japan' }, { code: 'KE', name: 'Kenya' }, { code: 'KG', name: 'Kyrgyzstan' }, { code: 'KH', name: 'Cambodia' }, { code: 'KI', name: 'Kiribati' }, { code: 'KM', name: 'Comoros' }, { code: 'KN', name: 'Saint Kitts and Nevis' }, { code: 'KP', name: 'North Korea' }, { code: 'KR', name: 'South Korea' }, { code: 'KW', name: 'Kuwait' }, { code: 'KY', name: 'Cayman Islands' }, { code: 'KZ', name: 'Kazakhstan' }, { code: 'LA', name: 'Laos' }, { code: 'LB', name: 'Lebanon' }, { code: 'LC', name: 'Saint Lucia' }, { code: 'LI', name: 'Liechtenstein' }, { code: 'LK', name: 'Sri Lanka' }, { code: 'LR', name: 'Liberia' }, { code: 'LS', name: 'Lesotho' }, { code: 'LT', name: 'Lithuania' }, { code: 'LU', name: 'Luxembourg' }, { code: 'LV', name: 'Latvia' }, { code: 'LY', name: 'Libya' }, { code: 'MA', name: 'Morocco' }, { code: 'MC', name: 'Monaco' }, { code: 'MD', name: 'Moldova' }, { code: 'ME', name: 'Montenegro' }, { code: 'MF', name: 'Saint Martin' }, { code: 'MG', name: 'Madagascar' }, { code: 'MH', name: 'Marshall Islands' }, { code: 'MK', name: 'North Macedonia' }, { code: 'ML', name: 'Mali' }, { code: 'MM', name: 'Myanmar' }, { code: 'MN', name: 'Mongolia' }, { code: 'MO', name: 'Macau' }, { code: 'MP', name: 'Northern Mariana Islands' }, { code: 'MQ', name: 'Martinique' }, { code: 'MR', name: 'Mauritania' }, { code: 'MS', name: 'Montserrat' }, { code: 'MT', name: 'Malta' }, { code: 'MU', name: 'Mauritius' }, { code: 'MV', name: 'Maldives' }, { code: 'MW', name: 'Malawi' }, { code: 'MX', name: 'Mexico' }, { code: 'MY', name: 'Malaysia' }, { code: 'MZ', name: 'Mozambique' }, { code: 'NA', name: 'Namibia' }, { code: 'NC', name: 'New Caledonia' }, { code: 'NE', name: 'Niger' }, { code: 'NF', name: 'Norfolk Island' }, { code: 'NG', name: 'Nigeria' }, { code: 'NI', name: 'Nicaragua' }, { code: 'NL', name: 'Netherlands' }, { code: 'NO', name: 'Norway' }, { code: 'NP', name: 'Nepal' }, { code: 'NR', name: 'Nauru' }, { code: 'NU', name: 'Niue' }, { code: 'NZ', name: 'New Zealand' }, { code: 'OM', name: 'Oman' }, { code: 'PA', name: 'Panama' }, { code: 'PE', name: 'Peru' }, { code: 'PF', name: 'French Polynesia' }, { code: 'PG', name: 'Papua New Guinea' }, { code: 'PH', name: 'Philippines' }, { code: 'PK', name: 'Pakistan' }, { code: 'PL', name: 'Poland' }, { code: 'PM', name: 'Saint Pierre and Miquelon' }, { code: 'PN', name: 'Pitcairn Islands' }, { code: 'PR', name: 'Puerto Rico' }, { code: 'PS', name: 'Palestine' }, { code: 'PT', name: 'Portugal' }, { code: 'PW', name: 'Palau' }, { code: 'PY', name: 'Paraguay' }, { code: 'QA', name: 'Qatar' }, { code: 'RE', name: 'Reunion' }, { code: 'RO', name: 'Romania' }, { code: 'RS', name: 'Serbia' }, { code: 'RU', name: 'Russia' }, { code: 'RW', name: 'Rwanda' }, { code: 'SA', name: 'Saudi Arabia' }, { code: 'SB', name: 'Solomon Islands' }, { code: 'SC', name: 'Seychelles' }, { code: 'SD', name: 'Sudan' }, { code: 'SE', name: 'Sweden' }, { code: 'SG', name: 'Singapore' }, { code: 'SH', name: 'Saint Helena, Ascension and Tristan da Cunha' }, { code: 'SI', name: 'Slovenia' }, { code: 'SJ', name: 'Svalbard and Jan Mayen' }, { code: 'SK', name: 'Slovakia' }, { code: 'SL', name: 'Sierra Leone' }, { code: 'SM', name: 'San Marino' }, { code: 'SN', name: 'Senegal' }, { code: 'SO', name: 'Somalia' }, { code: 'SR', name: 'Suriname' }, { code: 'SS', name: 'South Sudan' }, { code: 'ST', name: 'Sao Tome and Principe' }, { code: 'SV', name: 'El Salvador' }, { code: 'SX', name: 'Sint Maarten' }, { code: 'SY', name: 'Syria' }, { code: 'SZ', name: 'Eswatini' }, { code: 'TC', name: 'Turks and Caicos Islands' }, { code: 'TD', name: 'Chad' }, { code: 'TF', name: 'French Southern and Antarctic Lands' }, { code: 'TG', name: 'Togo' }, { code: 'TH', name: 'Thailand' }, { code: 'TJ', name: 'Tajikistan' }, { code: 'TK', name: 'Tokelau' }, { code: 'TL', name: 'Timor-Leste' }, { code: 'TM', name: 'Turkmenistan' }, { code: 'TN', name: 'Tunisia' }, { code: 'TO', name: 'Tonga' }, { code: 'TR', name: 'Turkey' }, { code: 'TT', name: 'Trinidad and Tobago' }, { code: 'TV', name: 'Tuvalu' }, { code: 'TW', name: 'Taiwan' }, { code: 'TZ', name: 'Tanzania' }, { code: 'UA', name: 'Ukraine' }, { code: 'UG', name: 'Uganda' }, { code: 'UM', name: 'United States Minor Outlying Islands' }, { code: 'US', name: 'United States' }, { code: 'UY', name: 'Uruguay' }, { code: 'UZ', name: 'Uzbekistan' }, { code: 'VA', name: 'Vatican City' }, { code: 'VC', name: 'Saint Vincent and the Grenadines' }, { code: 'VE', name: 'Venezuela' }, { code: 'VG', name: 'British Virgin Islands' }, { code: 'VI', name: 'United States Virgin Islands' }, { code: 'VN', name: 'Vietnam' }, { code: 'VU', name: 'Vanuatu' }, { code: 'WF', name: 'Wallis and Futuna' }, { code: 'WS', name: 'Samoa' }, { code: 'XK', name: 'Kosovo' }, { code: 'YE', name: 'Yemen' }, { code: 'YT', name: 'Mayotte' }, { code: 'ZA', name: 'South Africa' }, { code: 'ZM', name: 'Zambia' }, { code: 'ZW', name: 'Zimbabwe' },
]

const DIAL_CODES: Record<string, string> = {
  AD: '+376', AE: '+971', AF: '+93', AG: '+1268', AI: '+1264', AL: '+355', AM: '+374', AO: '+244', AR: '+54', AS: '+1684', AT: '+43', AU: '+61', AW: '+297', AX: '+35818', AZ: '+994', BA: '+387', BB: '+1246', BD: '+880', BE: '+32', BF: '+226', BG: '+359', BH: '+973', BI: '+257', BJ: '+229', BL: '+590', BM: '+1441', BN: '+673', BO: '+591', BQ: '+599', BR: '+55', BS: '+1242', BT: '+975', BV: '+47', BW: '+267', BY: '+375', BZ: '+501', CA: '+1', CC: '+61', CD: '+243', CF: '+236', CG: '+242', CH: '+41', CI: '+225', CK: '+682', CL: '+56', CM: '+237', CN: '+86', CO: '+57', CR: '+506', CU: '+53', CV: '+238', CW: '+599', CX: '+61', CY: '+357', CZ: '+420', DE: '+49', DJ: '+253', DK: '+45', DM: '+1767', DO: '+1809', DZ: '+213', EC: '+593', EE: '+372', EG: '+20', EH: '+212', ER: '+291', ES: '+34', ET: '+251', FI: '+358', FJ: '+679', FK: '+500', FM: '+691', FO: '+298', FR: '+33', GA: '+241', GB: '+44', GD: '+1473', GE: '+995', GF: '+594', GG: '+44', GH: '+233', GI: '+350', GL: '+299', GM: '+220', GN: '+224', GP: '+590', GQ: '+240', GR: '+30', GS: '+500', GT: '+502', GU: '+1671', GW: '+245', GY: '+592', HK: '+852', HN: '+504', HR: '+385', HT: '+509', HU: '+36', ID: '+62', IE: '+353', IL: '+972', IM: '+44', IN: '+91', IO: '+246', IQ: '+964', IR: '+98', IS: '+354', IT: '+39', JE: '+44', JM: '+1876', JO: '+962', JP: '+81', KE: '+254', KG: '+996', KH: '+855', KI: '+686', KM: '+269', KN: '+1869', KP: '+850', KR: '+82', KW: '+965', KY: '+1345', KZ: '+7', LA: '+856', LB: '+961', LC: '+1758', LI: '+423', LK: '+94', LR: '+231', LS: '+266', LT: '+370', LU: '+352', LV: '+371', LY: '+218', MA: '+212', MC: '+377', MD: '+373', ME: '+382', MF: '+590', MG: '+261', MH: '+692', MK: '+389', ML: '+223', MM: '+95', MN: '+976', MO: '+853', MP: '+1670', MQ: '+596', MR: '+222', MS: '+1664', MT: '+356', MU: '+230', MV: '+960', MW: '+265', MX: '+52', MY: '+60', MZ: '+258', NA: '+264', NC: '+687', NE: '+227', NF: '+672', NG: '+234', NI: '+505', NL: '+31', NO: '+47', NP: '+977', NR: '+674', NU: '+683', NZ: '+64', OM: '+968', PA: '+507', PE: '+51', PF: '+689', PG: '+675', PH: '+63', PK: '+92', PL: '+48', PM: '+508', PN: '+64', PR: '+1787', PS: '+970', PT: '+351', PW: '+680', PY: '+595', QA: '+974', RE: '+262', RO: '+40', RS: '+381', RU: '+7', RW: '+250', SA: '+966', SB: '+677', SC: '+248', SD: '+249', SE: '+46', SG: '+65', SH: '+290', SI: '+386', SJ: '+4779', SK: '+421', SL: '+232', SM: '+378', SN: '+221', SO: '+252', SR: '+597', SS: '+211', ST: '+239', SV: '+503', SX: '+1721', SY: '+963', SZ: '+268', TC: '+1649', TD: '+235', TF: '+262', TG: '+228', TH: '+66', TJ: '+992', TK: '+690', TL: '+670', TM: '+993', TN: '+216', TO: '+676', TR: '+90', TT: '+1868', TV: '+688', TW: '+886', TZ: '+255', UA: '+380', UG: '+256', UM: '+268', US: '+1', UY: '+598', UZ: '+998', VA: '+379', VC: '+1784', VE: '+58', VG: '+1284', VI: '+1340', VN: '+84', VU: '+678', WF: '+681', WS: '+685', XK: '+383', YE: '+967', YT: '+262', ZA: '+27', ZM: '+260', ZW: '+263',
}

interface CartItem {
  id?: string; productId: string; name: string; price: number; quantity: number;
  image: string; sellerId?: string;
}
interface ShippingRate {
  rateId: string; carrier: string; service: string;
  amount: number; currency: string; estimatedDays: number | null;
  isDDP: boolean;
}
interface LandedCost {
  dutyAmountGBP: number; vatAmountGBP: number; totalTaxGBP: number;
  belowDeMinimis: boolean; deMinimisGBP: number; isDomestic: boolean;
}
interface AppliedAutoDiscount {
  discountId: string
  code: string
  amountGBP: number
  description: string
}
interface AutoDiscountResult {
  totalDiscountGBP: number
  applied: AppliedAutoDiscount[]
}
interface ConfirmedBreakdown {
  currency: string
  productSubtotal: number
  shippingCost: number
  dutiesAmount: number
  discountAmount: number
  discountCodes: string[]
  total: number
}


function CheckoutForm({ clientSecret, total, currency, onSuccess }: {
  clientSecret: string; total: number; currency: string; onSuccess: () => void;
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [paying, setPaying] = useState(false)
  const [err, setErr] = useState('')
  const [elementsReady, setElementsReady] = useState(false)

  async function handlePay(e: React.FormEvent) {
    e.preventDefault()
    // Guard against the Payment Element iframe not being fully mounted yet --
    // useElements() returns a non-null object as soon as <Elements> renders,
    // which is BEFORE the child <PaymentElement> has finished mounting. Without
    // this ready check, clicking Pay in that gap makes stripe.confirmPayment()
    // throw "elements should have a mounted Payment Element", which (with no
    // try/catch below) left "paying" stuck true forever -- the reported
    // Processing... hang.
    if (!stripe || !elements || !elementsReady) return
    setPaying(true)
    setErr('')
    try {
      // Validates and finalizes the Payment Element's current state before
      // confirming -- required by Stripe so integration errors come back as a
      // normal { error } result instead of a thrown exception.
      const { error: submitError } = await elements.submit()
      if (submitError) {
        setErr(submitError.message ?? 'Payment failed')
        return
      }
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: window.location.origin + '/checkout/confirmation' },
      })
      if (error) setErr(error.message ?? 'Payment failed')
    } catch (e) {
      // Defense in depth: never leave the button stuck on "Processing..." even
      // if Stripe throws instead of resolving with an error.
      setErr(e instanceof Error ? e.message : 'Payment failed. Please try again.')
    } finally {
      setPaying(false)
    }
  }

  const fmt = (val: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(val)

  return (
    <form onSubmit={handlePay} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PaymentElement onReady={() => setElementsReady(true)} />
      {err && (
        <div style={{ padding: '10px 14px', background: 'rgba(255,23,68,0.08)', border: '1px solid var(--red)', borderRadius: '6px', color: 'var(--red)', fontSize: '13px' }}>
          {err}
        </div>
      )}
      <button type="submit" disabled={!stripe || !elementsReady || paying} style={{
        padding: '14px', background: paying ? 'var(--border)' : 'var(--accent)',
        color: '#fff', border: 'none', borderRadius: '8px',
        fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '16px',
        cursor: paying ? 'not-allowed' : 'pointer', width: '100%',
      }}>
        {paying ? 'Processing...' : 'Pay ' + fmt(total) + ' (DDP — No Surprise Charges)'}
      </button>
      <p style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5 }}>
        Duties and taxes are included in your total. Velor is a global marketplace, so this was reconfirmed at today's exchange rate right before you paid — you will not be charged anything extra on delivery.
      </p>
    </form>
  )
}

export default function CheckoutPage() {
  const { items, removeItem: removeCartItem } = useCart()
  const handleRemoveItem = (productId: string) => {
    removeCartItem(productId)
    // If a Stripe PaymentIntent was already created, its amount is now stale.
    // Invalidate it and send the buyer back to shipping so the total is re-quoted
    // fresh before any payment can be submitted.
    if (clientSecret || confirmed) {
      setClientSecret('')
      setConfirmed(null)
      setStep('shipping')
    }
  }
  const [step, setStep] = useState<'shipping' | 'payment'>('shipping')
  const [address, setAddress] = useState({ name: '', email: '', phone: '', phoneCountry: 'GB', line1: '', line2: '', city: '', state: '', postalCode: '', country: 'GB' })
  const [rates, setRates] = useState<ShippingRate[]>([])
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null)
  const [landedCost, setLandedCost] = useState<LandedCost | null>(null)
  const [loadingRates, setLoadingRates] = useState(false)
  const [rateError, setRateError] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [creatingIntent, setCreatingIntent] = useState(false)
  const [paymentSetupError, setPaymentSetupError] = useState('')
  const { displayCurrency: currency, convert } = useCurrencyDisplay()
  const fmtRaw = (val: number, fromCurrency: string = 'GBP') => new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(convert(val, fromCurrency))
  const fmtDisplay = (val: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(val)
  const fmtConfirmed = (val: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: (confirmed && confirmed.currency) || currency }).format(val)
  const [confirmed, setConfirmed] = useState<ConfirmedBreakdown | null>(null)

  // Discounts are automatic — the seller applies them to the listing, the
  // buyer sees them on the listing/product page, and the exact same amount
  // is looked up again here from lib/discount.ts. There is nothing for the
  // buyer to type. Only ever discounts the product subtotal, never shipping
  // or duties/taxes.
  const [autoDiscount, setAutoDiscount] = useState<AutoDiscountResult | null>(null)
  const [autoDiscountLoading, setAutoDiscountLoading] = useState(false)

  const [itemCurrencies, setItemCurrencies] = useState<Record<string, string>>({})

  useEffect(() => {
    const missing = Array.from(new Set(items.map((i) => i.productId))).filter((id) => !(id in itemCurrencies))
    if (missing.length === 0) return
    let cancelled = false
    Promise.all(missing.map((id) =>
      fetch(`/api/shop/products/${id}`).then((r) => (r.ok ? r.json() : null)).catch(() => null)
    )).then((results) => {
      if (cancelled) return
      setItemCurrencies((prev) => {
        const next = { ...prev }
        results.forEach((data, idx) => {
          next[missing[idx]] = data?.seller?.currency || 'GBP'
        })
        return next
      })
    })
    return () => { cancelled = true }
  }, [items, itemCurrencies])

  const productSubtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const productSubtotalConverted = items.reduce((s, i) => s + convert(i.price * i.quantity, itemCurrencies[i.productId] || 'GBP'), 0)
  const shippingCost = Number(selectedRate?.amount) || 0
  const dutiesAmount = landedCost?.totalTaxGBP ?? 0
  const discountAmount = autoDiscount?.totalDiscountGBP ?? 0
  // NOTE: productSubtotal/total below are kept in each seller's native currency
  // (unconverted) intentionally -- they must never be passed to fmtRaw/fmtDisplay
  // directly. shippingCost/dutiesAmount/discountAmount are GBP-denominated.
  // The buyer-facing total MUST be built from productSubtotalConverted (already
  // converted to the buyer's display currency) plus the GBP-denominated pieces
  // converted once via convert(x, 'GBP') -- never via fmtRaw, which assumes its
  // input is raw GBP and would double-convert or misread a non-GBP raw sum.
  const total = Math.max(0, productSubtotal - discountAmount) + shippingCost + dutiesAmount
  const totalConverted = Math.max(0, productSubtotalConverted - convert(discountAmount, 'GBP')) + convert(shippingCost, selectedRate?.currency || 'GBP') + convert(dutiesAmount, 'GBP')

  useEffect(() => {
    if (items.length === 0) return
    const sellerId = items[0]?.sellerId
    if (!sellerId) return
    setAutoDiscountLoading(true)
    fetch('/api/discount/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sellerId,
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
      }),
    })
      .then(res => res.json())
      .then(data => setAutoDiscount(data))
      .catch(() => setAutoDiscount(null))
      .finally(() => setAutoDiscountLoading(false))
  }, [items])

  function setAddr(k: keyof typeof address, v: string) {
    setAddress(a => ({ ...a, [k]: v }))
    if (k === 'country') {
      setRates([])
      setSelectedRate(null)
      setLandedCost(null)
    }
  }

  async function fetchRatesAndDuties() {
    setLoadingRates(true)
    setRateError('')
    try {
      const [rateRes, dutyRes] = await Promise.all([
        fetch('/api/shipping/rates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cartItems: items.map(i => ({ productId: i.productId, sellerId: i.sellerId, quantity: i.quantity })),
            shippingAddress: { street1: address.line1, city: address.city, zip: address.postalCode, country: address.country },
          }),
        }),
        fetch('/api/shipping/landed-cost', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cartItems: items.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.price })),
            destinationCountry: address.country,
            originCountry: 'GB',
            shippingCostGBP: 0,
          }),
        }),
      ])
      const [rateData, dutyData] = await Promise.all([rateRes.json(), dutyRes.json()])
      if (rateData.rates) { setRates(rateData.rates); if (rateData.rates[0]) setSelectedRate(rateData.rates[0]) }
      if (dutyData.totalTaxGBP !== undefined) setLandedCost(dutyData)
    } catch {
      setRateError('Could not fetch shipping rates. Please try again.')
    } finally {
      setLoadingRates(false)
    }
  }

  async function handleShippingSubmit(e: React.FormEvent) {
    e.preventDefault()
    await fetchRatesAndDuties()
  }

  async function proceedToPayment() {
    if (!selectedRate) return
    setCreatingIntent(true)
    setPaymentSetupError('')
    try {
      const res = await fetch('/api/stripe/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
          currency,
          shippingAmount: selectedRate?.amount ?? 0,
          shippingCurrency: selectedRate?.currency ?? 'GBP',
          dutiesAmountGBP: landedCost?.totalTaxGBP ?? 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setPaymentSetupError(data.error || 'Could not set up payment. Please try again.')
        return
      }
      if (data.clientSecret) {
        if (data.breakdown) setConfirmed(data.breakdown)
        const piId = (data.clientSecret as string).split('_secret_')[0]
        localStorage.setItem('velor-last-order', JSON.stringify({
          orderNumber: 'VLR-' + Date.now(),
          paymentIntentId: piId,
          items,
          shipping: {
            firstName: address.name.split(' ')[0] ?? address.name,
            lastName: address.name.split(' ').slice(1).join(' ') ?? '',
            email: address.email,
            phone: `${DIAL_CODES[address.phoneCountry] || ''} ${address.phone}`.trim(),
            address: [address.line1, address.line2].filter(Boolean).join(', '),
            city: address.city,
            state: address.state,
            postcode: address.postalCode,
            country: address.country,
          },
          shippingMethod: selectedRate?.service ?? '',
          shippingCost: data.breakdown ? data.breakdown.shippingCost : shippingCost,
          subtotal: data.breakdown ? data.breakdown.productSubtotal : productSubtotal,
          discountCodes: data.breakdown ? data.breakdown.discountCodes : (autoDiscount?.applied.map(a => a.code) ?? []),
          discountAmount: data.breakdown ? data.breakdown.discountAmount : discountAmount,
          total: data.breakdown ? data.breakdown.total : total,
          currency: data.breakdown ? data.breakdown.currency : currency,
          placedAt: new Date().toISOString(),
          sellerId: items[0]?.sellerId ?? null,
          rateId: selectedRate?.rateId ?? null,
        }))
        setClientSecret(data.clientSecret)
        setStep('payment')
      }
    } finally {
      setCreatingIntent(false)
    }
  }

  const fmt = (val: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(val)
  const surface = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '28px' }
  const inputStyle = {
    width: '100%', padding: '10px 12px', background: 'var(--bg)',
    border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)',
    fontFamily: 'var(--font-body)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const,
  }
  const labelStyle = {
    display: 'block', fontSize: '12px', fontWeight: 600 as const, color: 'var(--muted)',
    textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '6px',
  }

  if (items.length === 0) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body)', color: 'var(--muted)' }}>
        Your cart is empty.
      </div>
    )
  }

  const confirmedCodes = confirmed?.discountCodes ?? []
  const displayedCodes = confirmedCodes.length > 0 ? confirmedCodes : (autoDiscount?.applied.map(a => a.code) ?? [])

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 20px 80px', fontFamily: 'var(--font-body)' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: '40px' }}>
        Checkout
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px', alignItems: 'flex-start' }}>
        {/* LEFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {step === 'shipping' && (
            <>
              <div style={surface}>
                <div style={{ background: 'rgba(255,140,0,0.08)', border: '1px solid rgba(255,140,0,0.25)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '12px', color: 'var(--text)', lineHeight: 1.5 }}>
                  Velor is a global marketplace — prices convert live using current exchange rates, and we reconfirm your exact total right before you pay. No surprise charges, ever.
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '20px' }}>
                  Shipping Address
                </h2>
                <form onSubmit={handleShippingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={labelStyle}>Full Name *</label>
                      <input style={inputStyle} value={address.name} onChange={e => setAddr('name', e.target.value)} required />
                    </div>
                    <div>
                      <label style={labelStyle}>Email *</label>
                      <input style={inputStyle} type="email" value={address.email} onChange={e => setAddr('email', e.target.value)} required />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Phone Number *</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select style={{ ...inputStyle, flex: '0 0 150px' }} value={address.phoneCountry} onChange={e => setAddr('phoneCountry', e.target.value)}>
                        {PHONE_COUNTRIES.map(c => (
                          <option key={c.code} value={c.code}>{c.name} ({DIAL_CODES[c.code]})</option>
                        ))}
                      </select>
                      <input style={{ ...inputStyle, flex: 1 }} type="tel" value={address.phone} onChange={e => setAddr('phone', e.target.value)} placeholder="e.g. 7123456789" required />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Address Line 1 *</label>
                    <input style={inputStyle} value={address.line1} onChange={e => setAddr('line1', e.target.value)} required />
                  </div>
                  <div>
                    <label style={labelStyle}>Address Line 2</label>
                    <input style={inputStyle} value={address.line2} onChange={e => setAddr('line2', e.target.value)} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={labelStyle}>City *</label>
                      <input style={inputStyle} value={address.city} onChange={e => setAddr('city', e.target.value)} required />
                    </div>
                    <div>
                      <label style={labelStyle}>State / County</label>
                      <input style={inputStyle} value={address.state} onChange={e => setAddr('state', e.target.value)} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={labelStyle}>Postcode / ZIP *</label>
                      <input style={inputStyle} value={address.postalCode} onChange={e => setAddr('postalCode', e.target.value)} required />
                    </div>
                    <div>
                      <label style={labelStyle}>Country *</label>
                      <select style={{ ...inputStyle, cursor: 'pointer' }} value={address.country} onChange={e => setAddr('country', e.target.value)}>
                        {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                  {rateError && (
                    <div style={{ padding: '10px 14px', background: 'rgba(255,23,68,0.08)', border: '1px solid var(--red)', borderRadius: '6px', color: 'var(--red)', fontSize: '13px' }}>
                      {rateError}
                    </div>
                  )}
                  <button type="submit" disabled={loadingRates} style={{
                    padding: '12px', background: loadingRates ? 'var(--border)' : 'var(--accent)',
                    color: '#fff', border: 'none', borderRadius: '6px',
                    fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '15px',
                    cursor: loadingRates ? 'not-allowed' : 'pointer',
                  }}>
                    {loadingRates ? 'Fetching Rates...' : 'Get Shipping Rates'}
                  </button>
                </form>
              </div>

              {rates.length > 0 && (
                <div style={surface}>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '16px' }}>
                    Shipping Options
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {rates.map(rate => (
                      <label key={rate.rateId} style={{
                        display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px',
                        border: '1px solid ' + (selectedRate?.rateId === rate.rateId ? 'var(--accent)' : 'var(--border)'),
                        borderRadius: '8px', cursor: 'pointer',
                        background: selectedRate?.rateId === rate.rateId ? 'rgba(255,107,0,0.05)' : 'var(--bg)',
                      }}>
                        <input type="radio" name="rate" checked={selectedRate?.rateId === rate.rateId} onChange={() => setSelectedRate(rate)} style={{ accentColor: 'var(--accent)' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                            {rate.carrier} — {rate.service}
                            {rate.isDDP && (
                              <span style={{ marginLeft: '8px', padding: '2px 8px', background: 'rgba(0,230,118,0.15)', color: 'var(--green)', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                                DDP
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                            {rate.estimatedDays ? rate.estimatedDays + ' business days' : 'Estimated delivery varies'}
                          </div>
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
                          {fmtRaw(rate.amount, rate.currency || 'GBP')}
                        </div>
                      </label>
                    ))}
                  </div>

                  {paymentSetupError && (
                    <div style={{ marginTop: '16px', padding: '10px 14px', background: 'rgba(255,23,68,0.08)', border: '1px solid var(--red)', borderRadius: '6px', color: 'var(--red)', fontSize: '13px' }}>
                      {paymentSetupError}
                    </div>
                  )}

                  {selectedRate && (
                    <>
                      <button
                        onClick={proceedToPayment}
                        disabled={creatingIntent}
                        style={{
                          marginTop: '20px', padding: '13px', width: '100%',
                          background: creatingIntent ? 'var(--border)' : 'var(--accent)',
                          color: '#fff', border: 'none', borderRadius: '8px',
                          fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '15px',
                          cursor: creatingIntent ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {creatingIntent ? 'Setting Up Payment...' : 'Continue to Payment'}
                      </button>
                      <p style={{ fontSize: '11px', color: 'var(--muted)', textAlign: 'center', marginTop: '8px', lineHeight: 1.4 }}>
                        Your total will be reconfirmed at today's exchange rate on the next screen — exactly what you see is exactly what you pay.
                      </p>
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {step === 'payment' && clientSecret && (
            <div style={surface}>
              <button onClick={() => setStep('shipping')} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '14px', cursor: 'pointer', marginBottom: '16px', padding: 0 }}>
                &larr; Back to shipping
              </button>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '20px' }}>Payment</h2>
              <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night', variables: { colorPrimary: '#FF6B00', colorBackground: '#0D0D0D', colorText: '#FFFFFF', colorDanger: '#FF1744', fontFamily: 'Inter, sans-serif', borderRadius: '6px' } } }}>
                <CheckoutForm clientSecret={clientSecret} total={confirmed ? confirmed.total : total} currency={confirmed ? confirmed.currency : currency} onSuccess={() => {}} />
              </Elements>
            </div>
          )}
        </div>

        {/* RIGHT — Order Summary */}
        <div style={{ ...surface, position: 'sticky', top: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: '16px' }}>Order Summary</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            {items.map(item => (
              <div key={item.productId} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {item.image && (
                  <img src={item.image} alt={item.name} style={{ width: '44px', height: '44px', objectFit: 'contain', borderRadius: '6px', background: 'var(--bg)' }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>{item.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Qty {item.quantity}</div>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{confirmed && productSubtotal > 0 ? fmtConfirmed((item.price * item.quantity / productSubtotal) * (confirmed.productSubtotal + confirmed.discountAmount)) : fmtRaw(item.price * item.quantity, itemCurrencies[item.productId] || 'GBP')}</div>
                {!creatingIntent && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id || item.productId)}
                    aria-label={`Remove ${item.name} from cart`}
                    style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '18px', cursor: 'pointer', padding: '4px 0 4px 8px', lineHeight: 1 }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          {step === 'shipping' && autoDiscountLoading && (
            <div style={{ marginBottom: '16px', fontSize: '12px', color: 'var(--muted)' }}>Checking for available discounts...</div>
          )}
          {step === 'shipping' && !autoDiscountLoading && autoDiscount && autoDiscount.totalDiscountGBP > 0 && (
            <div style={{ marginBottom: '16px', padding: '10px 12px', background: 'rgba(0,230,118,0.08)', border: '1px solid var(--green)', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--green)' }}>
                Discount applied automatically — {fmtRaw(autoDiscount.totalDiscountGBP)} off
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                No code needed — this was already reflected in the product price you saw.
              </div>
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--muted)' }}>Subtotal</span>
              <span style={{ color: 'var(--text)' }}>{confirmed ? fmtConfirmed(confirmed.productSubtotal + confirmed.discountAmount) : fmtDisplay(productSubtotalConverted)}</span>
            </div>
            {(confirmed ? confirmed.discountAmount > 0 : discountAmount > 0) && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--green)' }}>Discount{displayedCodes.length > 0 ? ` (${displayedCodes.join(', ')})` : ''}</span>
                <span style={{ color: 'var(--green)' }}>-{confirmed ? fmtConfirmed(confirmed.discountAmount) : fmtRaw(discountAmount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--muted)' }}>Shipping</span>
              <span style={{ color: 'var(--text)' }}>{selectedRate ? (confirmed ? fmtConfirmed(confirmed.shippingCost) : fmtRaw(shippingCost, selectedRate?.currency || 'GBP')) : '—'}</span>
            </div>
            {landedCost && !landedCost.isDomestic && dutiesAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--muted)' }}>
                  Duties and Taxes (DDP)
                  {landedCost.belowDeMinimis && <span style={{ color: 'var(--green)', fontSize: '11px', marginLeft: '4px' }}>below threshold</span>}
                </span>
                <span style={{ color: 'var(--text)' }}>{confirmed ? fmtConfirmed(confirmed.dutiesAmount) : fmtRaw(dutiesAmount)}</span>
              </div>
            )}
            {landedCost?.isDomestic && (
              <div style={{ fontSize: '12px', color: 'var(--green)', textAlign: 'right' }}>Domestic — no import duties</div>
            )}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700 }}>
              <span style={{ color: 'var(--text)' }}>Total</span>
              <span style={{ color: 'var(--accent)' }}>{confirmed ? fmtConfirmed(confirmed.total) : fmtDisplay(totalConverted)}</span>
            </div>
            <div style={{ fontSize: '11px', color: confirmed ? 'var(--green)' : 'var(--muted)', textAlign: 'right', marginTop: '4px' }}>
              {confirmed ? 'Reconfirmed just now — exactly what you pay, no surprise charges' : 'Estimated — reconfirmed live the moment you continue to payment'}
            </div>
          </div>
          {dutiesAmount > 0 && (
            <div style={{ marginTop: '14px', padding: '10px 12px', background: 'rgba(0,230,118,0.07)', border: '1px solid rgba(0,230,118,0.2)', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--green)', marginBottom: '2px' }}>
                Delivered Duty Paid (DDP)
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: 1.5 }}>
                All import duties and taxes are included in your total. Nothing to pay at the door.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
