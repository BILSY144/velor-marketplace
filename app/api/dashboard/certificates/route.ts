import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// Seller-facing certificate endpoints for regulated-material listings
// (/legal/seller-rules section 4). Sellers attach export/import permits or
// phytosanitary certificates to their own products; documents go into an
// admin review queue (app/api/admin/certificates) and the product cannot be
// approved until a certificate is VERIFIED.

const VALID_TYPES = ['EXPORT_PERMIT', 'IMPORT_PERMIT', 'PHYTOSANITARY', 'OTHER'] as const
type CertType = (typeof VALID_TYPES)[number]

// Documents are stored as data URLs in Postgres (same zero-new-infrastructure
// pattern as Seller.storeLogo). Cap the payload so a single upload cannot
// bloat the table -- roughly a 1.5 MB file after base64 encoding.
const MAX_DOCUMENT_DATA_LEN = 2_000_000

async function getOwnedProduct(userId: string, productId: string) {
  const seller = await prisma.seller.findUnique({ where: { userId } })
  if (!seller) return { seller: null, product: null }
  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product || product.sellerId !== seller.id) return { seller, product: null }
  return { seller, product }
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const productId = searchParams.get('productId')
  if (!productId) return NextResponse.json({ error: 'Missing productId' }, { status: 400 })

  const { product } = await getOwnedProduct(session.user.id, productId)
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  const certificates = await prisma.productCertificate.findMany({
    where: { productId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      type: true,
      fileName: true,
      destinationCountry: true,
      issuedBy: true,
      expiresAt: true,
      status: true,
      reviewNotes: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ certificates })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { productId, type, documentData, fileName, destinationCountry, issuedBy, expiresAt } = body as {
    productId?: string
    type?: string
    documentData?: string
    fileName?: string
    destinationCountry?: string
    issuedBy?: string
    expiresAt?: string
  }

  if (!productId || !documentData) {
    return NextResponse.json({ error: 'productId and documentData are required' }, { status: 400 })
  }
  if (typeof documentData !== 'string' || !documentData.startsWith('data:')) {
    return NextResponse.json({ error: 'documentData must be a data URL (image or PDF)' }, { status: 400 })
  }
  if (documentData.length > MAX_DOCUMENT_DATA_LEN) {
    return NextResponse.json({ error: 'Document too large -- please upload a file under 1.5 MB' }, { status: 400 })
  }

  const certType: CertType = VALID_TYPES.includes(type as CertType) ? (type as CertType) : 'EXPORT_PERMIT'

  const { product } = await getOwnedProduct(session.user.id, productId)
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  let parsedExpiry: Date | null = null
  if (expiresAt) {
    const d = new Date(expiresAt)
    if (isNaN(d.getTime())) return NextResponse.json({ error: 'Invalid expiresAt date' }, { status: 400 })
    if (d < new Date()) return NextResponse.json({ error: 'This certificate has already expired' }, { status: 400 })
    parsedExpiry = d
  }

  const certificate = await prisma.productCertificate.create({
    data: {
      productId,
      type: certType,
      documentData,
      fileName: fileName ? String(fileName).slice(0, 200) : null,
      destinationCountry: destinationCountry ? String(destinationCountry).slice(0, 2).toUpperCase() : null,
      issuedBy: issuedBy ? String(issuedBy).slice(0, 200) : null,
      expiresAt: parsedExpiry,
      status: 'PENDING',
    },
  })

  // Uploading a certificate marks the product as being on the certificate
  // track even if the seller did not tick the declaration checkbox.
  if (!product.requiresCertificate) {
    await prisma.product.update({ where: { id: productId }, data: { requiresCertificate: true } })
  }

  return NextResponse.json({
    certificate: { id: certificate.id, status: certificate.status, createdAt: certificate.createdAt },
    message: 'Certificate submitted for review. Your listing stays in review until it is verified.',
  }, { status: 201 })
}
