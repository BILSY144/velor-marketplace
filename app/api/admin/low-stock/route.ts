import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

const LOW_STOCK_THRESHOLD = 5;
const ALERT_RECIPIENT = 'customerservice@velorcommerce.co.uk';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') return null;
  return session;
}

function buildLowStockEmail(
  products: { id: string; name: string; stock: number; sellerStoreName: string }[]
) {
  const rows = products
    .map(
      (p) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee">${p.title}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee">${p.sellerStoreName}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;color:${
            p.stock === 0 ? '#dc2626' : '#f59e0b'
          };font-weight:bold">${p.stock}</td>
        </tr>`
    )
    .join('');

  const count = products.length;
  const subject = `Low Stock Alert â ${count} product${count !== 1 ? 's' : ''} need restocking`;
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#1a1a1a">Low Stock Alert</h2>
      <p style="color:#555">
        ${count} product${count !== 1 ? 's' : ''} ${count !== 1 ? 'have' : 'has'}
        stock below ${LOW_STOCK_THRESHOLD} units.
      </p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px">
        <thead>
          <tr style="background:#f5f5f5">
            <th style="padding:10px 12px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:.05em">Product</th>
            <th style="padding:10px 12px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:.05em">Seller</th>
            <th style="padding:10px 12px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:.05em">Stock</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="color:#888;font-size:12px;margin-top:24px">Velor Marketplace â automated low-stock monitor</p>
    </div>
  `;
  return { subject, html };
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const lowStockProducts = await prisma.product.findMany({
    where: { stock: { lt: LOW_STOCK_THRESHOLD } },
    select: {
      id: true,
      title: true,
      stock: true,
      seller: { select: { storeName: true } },
    },
    orderBy: { stock: 'asc' },
  });

  if (lowStockProducts.length === 0) {
    await prisma.agentLog.create({
      data: {
        agentName: 'low-stock-monitor',
        action: 'scan',
        status: 'success',
        details: { alertsSent: 0, message: 'All products adequately stocked' },
      },
    });
    return NextResponse.json({ ok: true, lowStockCount: 0, products: [] });
  }

  const flat = lowStockProducts.map((p) => ({
    id: p.id,
    name: p.title,
    stock: p.stock,
    sellerStoreName: p.seller.storeName,
  }));

  const { subject, html } = buildLowStockEmail(flat);
  await sendEmail({ to: ALERT_RECIPIENT, subject, html });

  await prisma.agentLog.create({
    data: {
      agentName: 'low-stock-monitor',
      action: 'alert_sent',
      status: 'success',
      details: {
        alertsSent: flat.length,
        recipient: ALERT_RECIPIENT,
        products: flat.map((p) => ({ id: p.id, name: p.title, stock: p.stock })),
      },
    },
  });

  return NextResponse.json({ ok: true, lowStockCount: flat.length, products: flat });
}
