import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'Velor Commerce <noreply@velorcommerce.store>';

interface EmailOptions { to: string; subject: string; html: string; }

export async function sendEmail({ to, subject, html }: EmailOptions): Promise<void> {
  if (!process.env.RESEND_API_KEY) { console.warn('[email] RESEND_API_KEY not set'); return; }
  try { await resend.emails.send({ from: FROM, to, subject, html }); }
  catch (err) { console.error('[email] error:', err); }
}

export function buildOrderConfirmationEmail(d: {
  buyerName: string; orderId: string;
  items: { name: string; quantity: number; price: number }[];
  total: number; currency: string;
}): { subject: string; html: string } {
  const rows = d.items.map(i =>
    `<tr><td style="padding:10px;border-bottom:1px solid #2A2A2A">${i.name}</td>
    <td style="padding:10px;text-align:center;border-bottom:1px solid #2A2A2A">${i.quantity}</td>
    <td style="padding:10px;text-align:right;border-bottom:1px solid #2A2A2A">${d.currency} ${i.price.toFixed(2)}</td></tr>`
  ).join('');
  return {
    subject: `Order confirmed — ${d.orderId}`,
    html: `<!DOCTYPE html><html><body style="margin:0;background:#0D0D0D;font-family:Inter,Arial,sans-serif;color:#FFF">
<div style="max-width:600px;margin:40px auto;background:#1A1A1A;border-radius:12px;border:1px solid #2A2A2A;overflow:hidden">
<div style="background:#FF6B00;padding:24px 32px"><h1 style="margin:0;font-size:22px;font-weight:800;color:#FFF">VELOR</h1></div>
<div style="padding:32px">
<h2 style="margin:0 0 8px;font-size:20px;font-weight:700">Order Confirmed</h2>
<p style="margin:0 0 24px;color:#999">Hi ${d.buyerName}, your order is confirmed.</p>
<div style="background:#0D0D0D;border-radius:8px;padding:16px;margin-bottom:24px">
<p style="margin:0;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1.5px">Order Reference</p>
<p style="margin:6px 0 0;font-family:monospace;color:#FF6B00">${d.orderId}</p></div>
<table style="width:100%;border-collapse:collapse">
<thead><tr style="border-bottom:2px solid #2A2A2A">
<th style="padding:10px;text-align:left;font-size:11px;color:#999;text-transform:uppercase">Item</th>
<th style="padding:10px;text-align:center;font-size:11px;color:#999;text-transform:uppercase">Qty</th>
<th style="padding:10px;text-align:right;font-size:11px;color:#999;text-transform:uppercase">Price</th>
</tr></thead><tbody>${rows}</tbody>
<tfoot><tr><td colspan="2" style="padding:12px 10px;font-weight:700">Total</td>
<td style="padding:12px 10px;text-align:right;font-weight:700;color:#FF6B00">${d.currency} ${d.total.toFixed(2)}</td></tr></tfoot>
</table></div>
<div style="padding:20px 32px;border-top:1px solid #2A2A2A">
<p style="margin:0;font-size:13px;color:#999">Questions? <a href="https://velorcommerce.store/help" style="color:#FF6B00">Visit our help centre</a></p>
</div></div></body></html>`,
  };
}

export function buildWelcomeEmail(d: { name: string }): { subject: string; html: string } {
  return {
    subject: 'Welcome to Velor Commerce',
    html: `<!DOCTYPE html><html><body style="margin:0;background:#0D0D0D;font-family:Inter,Arial,sans-serif;color:#FFF">
<div style="max-width:600px;margin:40px auto;background:#1A1A1A;border-radius:12px;border:1px solid #2A2A2A;overflow:hidden">
<div style="background:#FF6B00;padding:24px 32px"><h1 style="margin:0;font-size:22px;font-weight:800;color:#FFF">VELOR</h1></div>
<div style="padding:32px">
<h2 style="margin:0 0 8px;font-size:20px;font-weight:700">Welcome, ${d.name}</h2>
<p style="margin:0 0 24px;color:#999">Your Velor account is ready. Discover products from verified sellers worldwide.</p>
<a href="https://velorcommerce.store/shop" style="display:inline-block;background:#FF6B00;color:#FFF;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600">Start Shopping</a>
</div></div></body></html>`,
  };
}

export function buildSellerApprovedEmail(d: { sellerName: string; storeName: string }): { subject: string; html: string } {
  return {
    subject: `${d.storeName} is approved on Velor`,
    html: `<!DOCTYPE html><html><body style="margin:0;background:#0D0D0D;font-family:Inter,Arial,sans-serif;color:#FFF">
<div style="max-width:600px;margin:40px auto;background:#1A1A1A;border-radius:12px;border:1px solid #2A2A2A;overflow:hidden">
<div style="background:#FF6B00;padding:24px 32px"><h1 style="margin:0;font-size:22px;font-weight:800;color:#FFF">VELOR</h1></div>
<div style="padding:32px">
<h2 style="margin:0 0 8px;font-size:20px;font-weight:700">Your store is live</h2>
<p style="margin:0 0 8px;color:#999">Hi ${d.sellerName},</p>
<p style="margin:0 0 24px;color:#999"><strong style="color:#FFF">${d.storeName}</strong> is now live on Velor and visible to buyers worldwide.</p>
<a href="https://velorcommerce.store/dashboard" style="display:inline-block;background:#FF6B00;color:#FFF;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600">Go to Dashboard</a>
</div></div></body></html>`,
  };
}

export function buildReturnRequestEmail(d: { buyerName: string; orderId: string }): { subject: string; html: string } {
  return {
    subject: `Return request received — ${d.orderId}`,
    html: `<!DOCTYPE html><html><body style="margin:0;background:#0D0D0D;font-family:Inter,Arial,sans-serif;color:#FFF">
<div style="max-width:600px;margin:40px auto;background:#1A1A1A;border-radius:12px;border:1px solid #2A2A2A;overflow:hidden">
<div style="background:#FF6B00;padding:24px 32px"><h1 style="margin:0;font-size:22px;font-weight:800;color:#FFF">VELOR</h1></div>
<div style="padding:32px">
<h2 style="margin:0 0 8px;font-size:20px;font-weight:700">Return Request Received</h2>
<p style="margin:0 0 24px;color:#999">Hi ${d.buyerName}, we have received your return request for order <strong style="color:#FF6B00">${d.orderId}</strong>. We will review it within 2 business days.</p>
<a href="https://velorcommerce.store/orders" style="display:inline-block;background:#FF6B00;color:#FFF;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600">View Orders</a>
</div></div></body></html>`,
  };
}
