import { Resend } from 'resend';

const getResendClient = () => new Resend(process.env.RESEND_API_KEY);
const FROM = 'Velor Commerce <hello@velorcommerce.store>';

const LOGO = `<div style="background:#FF6B00;padding:24px 32px"><h1 style="margin:0;font-size:22px;font-weight:800;color:#FFF;letter-spacing:0.1em">VELOR</h1></div>`;

const FOOTER = `<div style="background:#111;padding:20px 32px;border-top:1px solid #1E1E1E">
  <p style="margin:0;font-size:12px;color:#666;line-height:1.6">
    Velor Commerce Ltd &middot; customerservice@velorcommerce.store<br>
    You are receiving this email because you have an account or pending application with Velor Commerce.
  </p>
</div>`;

const WRAP_OPEN = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0D0D0D;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="max-width:600px;margin:32px auto;background:#1A1A1A;border-radius:10px;overflow:hidden;border:1px solid #2A2A2A">
${LOGO}<div style="padding:32px">`;

const WRAP_CLOSE = `</div>${FOOTER}</div></body></html>`;

function h(text: string) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  bcc?: string;
  from?: string;
}

export async function sendEmail({ to, subject, html, bcc, from }: EmailOptions): Promise<void> {
  const { error } = await getResendClient().emails.send({ from: from || FROM, to, subject, html, ...(bcc ? { bcc } : {}) });
  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}

// ---- Order Confirmation ----

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export function buildOrderConfirmationEmail(d: {
  buyerName: string;
  orderId: string;
  items: OrderItem[];
  total: number;
  currency: string;
}): { subject: string; html: string } {
  const rows = d.items
    .map(
      item => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #2A2A2A;font-size:14px;color:#DDD">${h(item.name)}</td>
        <td style="padding:10px 0;border-bottom:1px solid #2A2A2A;font-size:14px;color:#DDD;text-align:center">${item.quantity}</td>
        <td style="padding:10px 0;border-bottom:1px solid #2A2A2A;font-size:14px;color:#DDD;text-align:right">${d.currency}${(item.price * item.quantity).toFixed(2)}</td>
      </tr>`
    )
    .join('');

  const html = `${WRAP_OPEN}
    <h2 style="color:#FFF;font-size:22px;margin:0 0 8px">Order confirmed</h2>
    <p style="color:#999;font-size:14px;margin:0 0 24px">Hi ${h(d.buyerName)}, your order has been placed successfully.</p>
    <p style="color:#777;font-size:12px;margin:0 0 16px;letter-spacing:0.06em;text-transform:uppercase">Order reference</p>
    <div style="background:#111;border:1px solid #2A2A2A;border-radius:6px;padding:12px 16px;font-family:monospace;font-size:13px;color:#FF6B00;margin-bottom:24px">${h(d.orderId)}</div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
      <thead>
        <tr>
          <th style="text-align:left;font-size:12px;color:#777;padding-bottom:8px;text-transform:uppercase;letter-spacing:0.06em">Item</th>
          <th style="text-align:center;font-size:12px;color:#777;padding-bottom:8px;text-transform:uppercase;letter-spacing:0.06em">Qty</th>
          <th style="text-align:right;font-size:12px;color:#777;padding-bottom:8px;text-transform:uppercase;letter-spacing:0.06em">Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="text-align:right;font-size:16px;font-weight:700;color:#FFF;margin-bottom:24px">Total: ${d.currency}${d.total.toFixed(2)}</div>
    <p style="color:#777;font-size:13px;margin:0">We will send you a shipping confirmation once your order is on the way.</p>
    ${WRAP_CLOSE}`;

  return { subject: `Order confirmed: ${d.orderId}`, html };
}

// ---- Welcome ----

export function buildWelcomeEmail(d: { name: string }): { subject: string; html: string } {
  const html = `${WRAP_OPEN}
    <h2 style="color:#FFF;font-size:22px;margin:0 0 16px">Welcome to Velor Commerce</h2>
    <p style="color:#BBB;font-size:15px;line-height:1.7;margin:0 0 20px">
      Hi ${h(d.name)}, your account is ready. You can now browse and purchase from our curated selection of premium sellers.
    </p>
    <a href="https://velorcommerce.store" style="display:inline-block;background:#FF6B00;color:#FFF;font-weight:600;font-size:14px;padding:12px 24px;border-radius:6px;text-decoration:none">Start shopping</a>
    ${WRAP_CLOSE}`;

  return { subject: 'Welcome to Velor Commerce', html };
}

// ---- Seller Approved ----

export function buildSellerApprovedEmail(d: {
  sellerName: string;
  storeName: string;
}): { subject: string; html: string } {
  const html = `${WRAP_OPEN}
    <h2 style="color:#4ADE80;font-size:22px;margin:0 0 16px">Your application has been approved</h2>
    <p style="color:#BBB;font-size:15px;line-height:1.7;margin:0 0 20px">
      Hi ${h(d.sellerName)}, we are pleased to confirm that <strong style="color:#FFF">${h(d.storeName)}</strong> has been approved to sell on Velor Commerce.
    </p>
    <p style="color:#BBB;font-size:15px;line-height:1.7;margin:0 0 24px">
      You can now log in to your seller dashboard to set up your store, add products, and start selling.
    </p>
    <a href="https://velorcommerce.store/seller/dashboard" style="display:inline-block;background:#FF6B00;color:#FFF;font-weight:600;font-size:14px;padding:12px 24px;border-radius:6px;text-decoration:none">Go to seller dashboard</a>
    ${WRAP_CLOSE}`;

  return { subject: `Approved: ${d.storeName} on Velor Commerce`, html };
}

// ---- Seller Rejected ----

export function buildSellerRejectedEmail(d: {
  contactName: string;
  businessName: string;
  reason: string;
}): { subject: string; html: string } {
  const html = `${WRAP_OPEN}
    <h2 style="color:#FFF;font-size:22px;margin:0 0 16px">Application update</h2>
    <p style="color:#BBB;font-size:15px;line-height:1.7;margin:0 0 20px">
      Hi ${h(d.contactName)}, thank you for applying to sell on Velor Commerce.
    </p>
    <p style="color:#BBB;font-size:15px;line-height:1.7;margin:0 0 16px">
      After reviewing your application for <strong style="color:#FFF">${h(d.businessName)}</strong>, we are unable to approve it at this time.
    </p>
    <div style="background:#1A0A0A;border-left:3px solid #5A1515;border-radius:0 6px 6px 0;padding:14px 16px;margin-bottom:20px">
      <p style="margin:0;color:#CC8080;font-size:14px;line-height:1.6">${h(d.reason)}</p>
    </div>
    <p style="color:#777;font-size:13px;line-height:1.6">
      If you believe this decision was made in error, or if your circumstances have changed, please contact us at customerservice@velorcommerce.store.
    </p>
    ${WRAP_CLOSE}`;

  return { subject: `Velor Commerce application update: ${d.businessName}`, html };
}

// ---- Return Request ----

export function buildReturnRequestEmail(d: {
  buyerName: string;
  orderId: string;
}): { subject: string; html: string } {
  const html = `${WRAP_OPEN}
    <h2 style="color:#FFF;font-size:22px;margin:0 0 16px">Return request received</h2>
    <p style="color:#BBB;font-size:15px;line-height:1.7;margin:0 0 20px">
      Hi ${h(d.buyerName)}, we have received your return request for order <strong style="color:#FF6B00;font-family:monospace">${h(d.orderId)}</strong>.
    </p>
    <p style="color:#BBB;font-size:15px;line-height:1.7;margin:0">
      Our team will review your request within 2 business days and provide further instructions.
    </p>
    ${WRAP_CLOSE}`;

  return { subject: `Return request received for order ${d.orderId}`, html };
}

// ---- Application Received ----

export function buildApplicationReceivedEmail(d: {
  contactName: string;
  businessName: string;
  applicationId: string;
}): { subject: string; html: string } {
  const html = `${WRAP_OPEN}
    <h2 style="color:#FFF;font-size:22px;margin:0 0 16px">Application received</h2>
    <p style="color:#BBB;font-size:15px;line-height:1.7;margin:0 0 20px">
      Hi ${h(d.contactName)}, we have received your seller application for <strong style="color:#FFF">${h(d.businessName)}</strong>.
    </p>
    <p style="color:#BBB;font-size:15px;line-height:1.7;margin:0 0 16px">
      Our team reviews all applications within 3-5 business days. We will be in touch once a decision has been made.
    </p>
    <p style="color:#777;font-size:12px;margin:0 0 8px;letter-spacing:0.06em;text-transform:uppercase">Your reference number</p>
    <div style="background:#111;border:1px solid #2A2A2A;border-radius:6px;padding:12px 16px;font-family:monospace;font-size:13px;color:#FF6B00;margin-bottom:20px">${h(d.applicationId)}</div>
    <p style="color:#777;font-size:13px">Please keep this reference handy if you need to contact us about your application.</p>
    ${WRAP_CLOSE}`;

  return { subject: 'Velor Commerce: Application received', html };
}

// ---- Seller Coaching ----

export function buildSellerCoachingEmail(d: { sellerName: string }): { subject: string; html: string } {
  const html = `${WRAP_OPEN}
    <h2 style="color:#FFF;font-size:22px;margin:0 0 16px">Tips to grow your Velor store</h2>
    <p style="color:#BBB;font-size:15px;line-height:1.7;margin:0 0 20px">
      Hi ${h(d.sellerName)}, our seller success team has put together some guidance to help you make the most of your Velor storefront.
    </p>
    <div style="margin-bottom:16px">
      <p style="color:#FF6B00;font-weight:600;font-size:14px;margin:0 0 6px">Photography</p>
      <p style="color:#AAA;font-size:14px;line-height:1.6;margin:0">Clean, well-lit product photos on a neutral background consistently outperform lifestyle shots in conversion. Aim for at least four angles per product.</p>
    </div>
    <div style="margin-bottom:16px">
      <p style="color:#FF6B00;font-weight:600;font-size:14px;margin:0 0 6px">Product titles</p>
      <p style="color:#AAA;font-size:14px;line-height:1.6;margin:0">Lead with the key descriptor, then material or style, then size or variant. Keep titles under 60 characters for best display across devices.</p>
    </div>
    <div style="margin-bottom:24px">
      <p style="color:#FF6B00;font-weight:600;font-size:14px;margin:0 0 6px">Pricing</p>
      <p style="color:#AAA;font-size:14px;line-height:1.6;margin:0">Sellers who price competitively within their category see 30% higher click-through rates. Review your prices against comparable listings monthly.</p>
    </div>
    <a href="https://velorcommerce.store/seller/dashboard" style="display:inline-block;background:#FF6B00;color:#FFF;font-weight:600;font-size:14px;padding:12px 24px;border-radius:6px;text-decoration:none">View your dashboard</a>
    ${WRAP_CLOSE}`;

  return { subject: 'Grow your Velor store: seller tips', html };
}

// ---- Seller Performance Report ----

export function buildSellerPerformanceEmail(d: {
  sellerName: string;
  weeklyViews: number;
  weeklySales: number;
  weeklyRevenue: number;
  conversionRate: string;
  topProduct: string;
}): { subject: string; html: string } {
  const html = `${WRAP_OPEN}
    <h2 style="color:#FFF;font-size:22px;margin:0 0 8px">Your weekly performance</h2>
    <p style="color:#999;font-size:14px;margin:0 0 24px">Hi ${h(d.sellerName)}, here is your store summary for the past 7 days.</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px">
      <div style="background:#111;border:1px solid #2A2A2A;border-radius:8px;padding:16px">
        <p style="color:#777;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 6px">Views</p>
        <p style="color:#FFF;font-size:24px;font-weight:700;margin:0">${d.weeklyViews.toLocaleString()}</p>
      </div>
      <div style="background:#111;border:1px solid #2A2A2A;border-radius:8px;padding:16px">
        <p style="color:#777;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 6px">Sales</p>
        <p style="color:#FFF;font-size:24px;font-weight:700;margin:0">${d.weeklySales}</p>
      </div>
      <div style="background:#111;border:1px solid #2A2A2A;border-radius:8px;padding:16px">
        <p style="color:#777;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 6px">Revenue</p>
        <p style="color:#FF6B00;font-size:24px;font-weight:700;margin:0">£${d.weeklyRevenue.toFixed(2)}</p>
      </div>
      <div style="background:#111;border:1px solid #2A2A2A;border-radius:8px;padding:16px">
        <p style="color:#777;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 6px">Conversion</p>
        <p style="color:#FFF;font-size:24px;font-weight:700;margin:0">${h(d.conversionRate)}</p>
      </div>
    </div>
    <div style="background:#111;border:1px solid #2A2A2A;border-radius:8px;padding:16px;margin-bottom:24px">
      <p style="color:#777;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 6px">Top product this week</p>
      <p style="color:#FFF;font-size:15px;font-weight:600;margin:0">${h(d.topProduct)}</p>
    </div>
    <a href="https://velorcommerce.store/seller/dashboard" style="display:inline-block;background:#FF6B00;color:#FFF;font-weight:600;font-size:14px;padding:12px 24px;border-radius:6px;text-decoration:none">View full analytics</a>
    ${WRAP_CLOSE}`;

  return { subject: 'Your weekly Velor performance report', html };
}

// ---- Outreach ----

export type OutreachEmailType = 'initial' | 'followup1' | 'followup2';

export interface OutreachProspect {
  name: string;
  platform: string;
  storeUrl: string;
  category: string;
  sellerType: 'individual' | 'small_business' | 'brand';
}

export function buildOutreachEmail(d: {
  prospect: OutreachProspect;
  emailType: OutreachEmailType;
  unsubscribeUrl?: string;
}): { subject: string; html: string } {
  const { prospect, emailType } = d;
  const p = prospect;
  const unsub = d.unsubscribeUrl || 'https://velorcommerce.store/unsubscribe';

  const subjects: Record<OutreachEmailType, string> = {
    initial: `List free on Velor - we open to buyers 6th August`,
    followup1: `Still free to list - Velor opens to buyers 6th August`,
    followup2: `Last call: list free before Velor opens to buyers 6th August`,
  };

  const intros: Record<OutreachEmailType, string> = {
    initial: `We came across your ${h(p.platform)} store and loved your ${h(p.category)} range. Velor is a new global marketplace, and we open our doors to buyers on 6th August. List your products now, for free, so you are front and centre the moment buyers arrive.`,
    followup1: `Following up about Velor Commerce. Listing is still free and we open to buyers on 6th August. It takes about five minutes to get your ${h(p.category)} products live.`,
    followup2: `Last note from us. Velor opens to buyers on 6th August and listing stays free until then. If a growing global marketplace suits your ${h(p.category)} business, now is the moment.`,
  };

  const html = `
  <div style='background:#0D0D0D;padding:24px 0;font-family:Arial,Helvetica,sans-serif;'>
    <div style='max-width:600px;margin:0 auto;background:#141414;border:1px solid #2A2A2A;border-radius:12px;overflow:hidden;'>
      <div style='background:#0D0D0D;padding:18px 32px;border-bottom:1px solid #2A2A2A;'>
        <span style='color:#FF6B00;font-size:22px;font-weight:800;letter-spacing:-0.5px;'>VELOR</span>
        <span style='color:#777777;font-size:11px;font-weight:700;letter-spacing:2px;margin-left:10px;'>GLOBAL MARKETPLACE</span>
      </div>
      <a href='https://velorcommerce.store/apply' style='display:block;text-decoration:none;line-height:0;'><img src='https://velorcommerce.store/email-assets/248a565b-5f33-438e-a12b-046983ea0b4b.png' width='600' alt='Velor Global Marketplace - Calling All Sellers, list for free' style='display:block;width:100%;max-width:600px;height:auto;border:0;' /></a>
      <div style='padding:32px;'>
        <div style='display:inline-block;background:#2A1A0A;color:#FF6B00;font-size:11px;font-weight:700;letter-spacing:1.5px;padding:6px 14px;border-radius:100px;margin-bottom:18px;'>OPENING TO BUYERS — 6TH AUGUST</div>
        <div style='color:#FFFFFF;font-size:28px;font-weight:800;line-height:1.15;margin-bottom:18px;'>List now &mdash; for free.</div>
        <p style='color:#CFCFCF;font-size:15px;line-height:1.7;margin:0 0 16px;'>Hi ${h(p.name)},</p>
        <p style='color:#B9B9B9;font-size:15px;line-height:1.7;margin:0 0 22px;'>${intros[emailType]}</p>
        <div style='border-top:1px solid #2A2A2A;padding-top:20px;margin-bottom:24px;'>
          <div style='margin-bottom:12px;color:#EAEAEA;font-size:14px;'><span style='color:#FF6B00;font-weight:800;margin-right:10px;'>&#10003;</span>Free to list &mdash; we only take 15% on what actually sells</div>
          <div style='margin-bottom:12px;color:#EAEAEA;font-size:14px;'><span style='color:#FF6B00;font-weight:800;margin-right:10px;'>&#10003;</span>Get set up before launch, so buyers find you on day one</div>
          <div style='margin-bottom:12px;color:#EAEAEA;font-size:14px;'><span style='color:#FF6B00;font-weight:800;margin-right:10px;'>&#10003;</span>Global marketplace &mdash; multi-currency checkout, worldwide buyers</div>
          <div style='color:#EAEAEA;font-size:14px;'><span style='color:#FF6B00;font-weight:800;margin-right:10px;'>&#10003;</span>You keep control &mdash; your brand, your prices, your customers</div>
        </div>
        <a href='https://velorcommerce.store/apply' style='display:inline-block;background:#FF6B00;color:#0D0D0D;font-size:15px;font-weight:800;text-decoration:none;padding:14px 34px;border-radius:8px;'>List now &mdash; it is free</a>
        <p style='color:#888888;font-size:13px;line-height:1.6;margin:18px 0 0;'>Takes about five minutes. No card, no listing fees.</p>
        <p style='color:#B9B9B9;font-size:15px;line-height:1.7;margin:22px 0 0;'>&mdash; The Velor Seller Team</p>
      </div>
      <div style='background:#0D0D0D;padding:20px 32px;border-top:1px solid #2A2A2A;'>
        <p style='color:#666666;font-size:12px;line-height:1.6;margin:0 0 8px;'>Velor Commerce Ltd &middot; a global online marketplace &middot; velorcommerce.store</p>
        <p style='color:#666666;font-size:12px;line-height:1.6;margin:0;'>You received this because ${h(p.name)} appeared on a public ${h(p.platform)} listing. Not interested? <a href='${unsub}' style='color:#FF6B00;text-decoration:underline;'>Unsubscribe</a> &mdash; one click and we will not contact you again.</p>
      </div>
    </div>
  </div>`;

  return { subject: subjects[emailType], html };
}
