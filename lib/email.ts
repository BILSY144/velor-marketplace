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
  activationLink?: string;
}): { subject: string; html: string } {
  const cta = d.activationLink
    ? `<a href="${d.activationLink}" style="display:inline-block;background:#FF6B00;color:#FFF;font-weight:600;font-size:14px;padding:12px 24px;border-radius:6px;text-decoration:none">Activate your account</a>
    <p style="color:#777;font-size:12px;line-height:1.6;margin:16px 0 0">This link expires in 7 days. You will be asked to set a password to finish setting up your account.</p>`
    : `<a href="https://velorcommerce.store/seller/dashboard" style="display:inline-block;background:#FF6B00;color:#FFF;font-weight:600;font-size:14px;padding:12px 24px;border-radius:6px;text-decoration:none">Go to seller dashboard</a>`;

  const html = `${WRAP_OPEN}
    <h2 style="color:#4ADE80;font-size:22px;margin:0 0 16px">Your application has been approved</h2>
    <p style="color:#BBB;font-size:15px;line-height:1.7;margin:0 0 20px">
      Hi ${h(d.sellerName)}, we are pleased to confirm that <strong style="color:#FFF">${h(d.storeName)}</strong> has been approved to sell on Velor Commerce.
    </p>
    <p style="color:#BBB;font-size:15px;line-height:1.7;margin:0 0 24px">
      ${d.activationLink ? 'Set a password to activate your seller account, then you can log in to your dashboard to set up your store, add products, and start selling.' : 'You can now log in to your seller dashboard to set up your store, add products, and start selling.'}
    </p>
    ${cta}
    ${WRAP_CLOSE}`;

  return { subject: `Approved: ${d.storeName} on Velor Commerce`, html };
}

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

// ---- Outreach (Founding Seller campaign, redesigned 2026-07-08) ----
//
// Three-touch sequence, each email visually and editorially distinct:
//   initial   -> the invitation: founding-seller framing, full value pitch
//   followup1 -> the proof: trust/payments/global reach, shorter
//   followup2 -> the personal last call: short note, minimal chrome
// Tone adapts to sellerType (individual/artisan: warm; brand/business:
// professional). Every claim is verifiably true of the live platform:
// free listing on the Starter plan, 15% commission only on completed sales,
// buyers in 190+ shipping destinations, live prices in 20 currencies,
// escrow-protected payments, payouts via Stripe or Payoneer worldwide,
// buyers arrive 6 August 2026. Unsubscribe link is mandatory in every email.

export type OutreachEmailType = 'initial' | 'followup1' | 'followup2';

export interface OutreachProspect {
  name: string;
  platform: string;
  storeUrl: string;
  category: string;
  sellerType: 'individual' | 'small_business' | 'brand';
}

const OUTREACH_HEADER = `<div style='background:#0D0D0D;padding:18px 32px;border-bottom:1px solid #2A2A2A;'>
  <span style='color:#FF6B00;font-size:22px;font-weight:800;letter-spacing:-0.5px;'>VELOR</span>
  <span style='color:#777777;font-size:11px;font-weight:700;letter-spacing:2px;margin-left:10px;'>GLOBAL MARKETPLACE</span>
</div>`;

function outreachFooter(name: string, platform: string, unsubUrl: string) {
  return `<div style='background:#0D0D0D;padding:20px 32px;border-top:1px solid #2A2A2A;'>
    <p style='color:#666666;font-size:12px;line-height:1.6;margin:0 0 8px;'>Velor Commerce Ltd &middot; a global online marketplace &middot; velorcommerce.store</p>
    <p style='color:#666666;font-size:12px;line-height:1.6;margin:0;'>You received this because ${h(name)} appeared on a public ${h(platform)} listing. Not interested? <a href='${unsubUrl}' style='color:#FF6B00;text-decoration:underline;'>Unsubscribe</a> &mdash; one click and we will not contact you again.</p>
  </div>`;
}

function benefitRow(title: string, body: string) {
  return `<table role='presentation' width='100%' cellpadding='0' cellspacing='0' style='margin-bottom:14px;'><tr>
    <td width='36' valign='top' style='padding-top:2px;'><div style='width:26px;height:26px;border-radius:6px;background:#2A1A0A;color:#FF6B00;font-weight:800;font-size:14px;text-align:center;line-height:26px;'>&#10003;</div></td>
    <td valign='top'><div style='color:#FFFFFF;font-size:14px;font-weight:700;margin-bottom:2px;'>${title}</div><div style='color:#A9A9A9;font-size:13px;line-height:1.6;'>${body}</div></td>
  </tr></table>`;
}

export function buildOutreachEmail(d: {
  prospect: OutreachProspect;
  emailType: OutreachEmailType;
  unsubscribeUrl?: string;
}): { subject: string; html: string } {
  const { prospect, emailType } = d;
  const p = prospect;
  const unsub = d.unsubscribeUrl || 'https://velorcommerce.store/unsubscribe';
  const isBrand = p.sellerType === 'brand';

  const subjects: Record<OutreachEmailType, string> = {
    initial: isBrand
      ? `Founding seller invitation: ${p.category} on Velor before buyers arrive 6 August`
      : `${p.name}, a founding seller spot on Velor — free before buyers arrive 6 August`,
    followup1: `How Velor protects your sales — and pays you anywhere in the world`,
    followup2: `Last note from Velor — buyers arrive 6 August`,
  };

  const cta = (label: string) =>
    `<a href='https://velorcommerce.store/apply' style='display:inline-block;background:#FF6B00;color:#0D0D0D;font-size:15px;font-weight:800;text-decoration:none;padding:14px 34px;border-radius:8px;'>${label}</a>`;

  const wrapOpen = `<div style='background:#0D0D0D;padding:24px 0;font-family:Arial,Helvetica,sans-serif;'><div style='max-width:600px;margin:0 auto;background:#141414;border:1px solid #2A2A2A;border-radius:12px;overflow:hidden;'>${OUTREACH_HEADER}`;
  const wrapClose = `${outreachFooter(p.name, p.platform, unsub)}</div></div>`;

  let body = '';

  if (emailType === 'initial') {
    const intro = isBrand
      ? `We found ${h(p.name)} through your ${h(p.platform)} presence, and your ${h(p.category)} range is exactly the calibre we are curating for launch. Velor is a new global marketplace opening to buyers on <strong style='color:#FFFFFF;'>6 August</strong>. We are inviting a limited group of founding sellers to be live on day one &mdash; positioned in front of every buyer who walks through the door.`
      : `We came across your work on ${h(p.platform)} and genuinely admired your ${h(p.category)} pieces. Velor is a new global marketplace opening to buyers on <strong style='color:#FFFFFF;'>6 August</strong> &mdash; and we are inviting makers and independent sellers we rate to join as founding sellers, live and visible from the very first day.`;
    body = `
      <img src='https://velorcommerce.store/velor-email-hero.jpg' width='600' alt='Velor Global Marketplace' style='display:block;width:100%;max-width:600px;height:auto;border:0;' />
      <div style='padding:32px;'>
        <div style='display:inline-block;background:#2A1A0A;color:#FF6B00;font-size:11px;font-weight:700;letter-spacing:1.5px;padding:6px 14px;border-radius:100px;margin-bottom:18px;'>FOUNDING SELLER INVITATION</div>
        <div style='color:#FFFFFF;font-size:28px;font-weight:800;line-height:1.15;margin-bottom:18px;'>Sell to the world.<br/>Free to start.</div>
        <p style='color:#CFCFCF;font-size:15px;line-height:1.7;margin:0 0 8px;'>Hi ${h(p.name)},</p>
        <p style='color:#B9B9B9;font-size:15px;line-height:1.7;margin:0 0 24px;'>${intro}</p>
        <div style='border-top:1px solid #2A2A2A;padding-top:20px;margin-bottom:8px;'>
          ${benefitRow('Reach buyers worldwide', 'Ship to 190+ destinations. Your prices display live in 20 currencies, so a buyer in Tokyo or Toronto sees your work in their own money.')}
          ${benefitRow('Zero cost to start', 'No listing fees, no monthly charge on the free plan. We take 15% commission only when something actually sells.')}
          ${benefitRow('Your money, protected and paid anywhere', 'Every payment is held in escrow until the buyer confirms delivery, then paid to your bank via Stripe &mdash; or Payoneer where Stripe is not available. Sellers in nearly every country can get paid.')}
          ${benefitRow('The founding seller advantage', 'List before 6 August and you are on the shelves the moment buyers arrive, with the visibility only an early catalogue can give.')}
        </div>
        ${cta('Claim your founding seller spot')}
        <p style='color:#888888;font-size:13px;line-height:1.6;margin:18px 0 0;'>The application takes about five minutes. No card required.</p>
        <p style='color:#B9B9B9;font-size:15px;line-height:1.7;margin:22px 0 0;'>&mdash; The Velor Seller Team</p>
      </div>`;
  } else if (emailType === 'followup1') {
    body = `
      <div style='padding:32px;'>
        <div style='display:inline-block;background:#2A1A0A;color:#FF6B00;font-size:11px;font-weight:700;letter-spacing:1.5px;padding:6px 14px;border-radius:100px;margin-bottom:18px;'>BUYERS ARRIVE 6 AUGUST</div>
        <div style='color:#FFFFFF;font-size:24px;font-weight:800;line-height:1.2;margin-bottom:18px;'>The part most marketplaces get wrong: getting you paid.</div>
        <p style='color:#CFCFCF;font-size:15px;line-height:1.7;margin:0 0 8px;'>Hi ${h(p.name)},</p>
        <p style='color:#B9B9B9;font-size:15px;line-height:1.7;margin:0 0 20px;'>Following up on our invitation. Before you decide, here is exactly how selling your ${h(p.category)} range on Velor works &mdash; because trust should run both ways:</p>
        <div style='background:#0D0D0D;border:1px solid #2A2A2A;border-radius:10px;padding:20px 22px;margin-bottom:22px;'>
          <div style='color:#EAEAEA;font-size:14px;line-height:1.8;'>
            <div style='margin-bottom:10px;'><span style='color:#FF6B00;font-weight:800;'>1.</span>&nbsp; A buyer anywhere in the world orders &mdash; checkout is handled by Stripe, in their currency.</div>
            <div style='margin-bottom:10px;'><span style='color:#FF6B00;font-weight:800;'>2.</span>&nbsp; The money is held safely in escrow while you ship &mdash; no chargeback roulette.</div>
            <div style='margin-bottom:10px;'><span style='color:#FF6B00;font-weight:800;'>3.</span>&nbsp; Delivery confirmed &rarr; your share is released to your bank, via Stripe or Payoneer, wherever you are.</div>
            <div><span style='color:#FF6B00;font-weight:800;'>4.</span>&nbsp; You keep 85% on the free plan &mdash; more on paid tiers. No sale, no fee. Ever.</div>
          </div>
        </div>
        ${cta('List your products free')}
        <p style='color:#888888;font-size:13px;line-height:1.6;margin:18px 0 0;'>Five minutes to apply. Live before the doors open on 6 August.</p>
        <p style='color:#B9B9B9;font-size:15px;line-height:1.7;margin:22px 0 0;'>&mdash; The Velor Seller Team</p>
      </div>`;
  } else {
    const signoff = isBrand
      ? `If the timing is wrong, no hard feelings &mdash; the door stays open. But founding sellers get the launch-day spotlight, and that only happens once.`
      : `If now is not the right moment, that is completely fine &mdash; the door stays open. But the launch-day spotlight is a one-time thing, and we would love your ${h(p.category)} work to be part of it.`;
    body = `
      <div style='padding:36px 32px;'>
        <p style='color:#CFCFCF;font-size:15px;line-height:1.8;margin:0 0 16px;'>Hi ${h(p.name)},</p>
        <p style='color:#B9B9B9;font-size:15px;line-height:1.8;margin:0 0 16px;'>Last note from us, as promised. Velor opens to buyers on <strong style='color:#FFFFFF;'>6 August</strong>, and listing stays free &mdash; no fees unless you sell.</p>
        <p style='color:#B9B9B9;font-size:15px;line-height:1.8;margin:0 0 24px;'>${signoff}</p>
        ${cta('List before launch')}
        <p style='color:#888888;font-size:13px;line-height:1.6;margin:18px 0 0;'>Either way, we will not email you again after this.</p>
        <p style='color:#B9B9B9;font-size:15px;line-height:1.8;margin:22px 0 0;'>&mdash; The Velor Seller Team</p>
      </div>`;
  }

  return { subject: subjects[emailType], html: `${wrapOpen}${body}${wrapClose}` };
}


export function buildNewSellerAlertEmail(d: {
  name: string;
  email: string;
  storeName: string;
  tier: string;
  signedUpAt: Date;
}): { subject: string; html: string } {
  const html = `${WRAP_OPEN}
    <h2 style="color:#FFF;font-size:22px;margin:0 0 16px">New seller signed up</h2>
    <p style="color:#BBB;font-size:15px;line-height:1.7;margin:0 0 20px">
      A new seller just registered on Velor Marketplace.
    </p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 20px">
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #2A2A2A;color:#777;font-size:12px;letter-spacing:0.06em;text-transform:uppercase">Name</td>
        <td style="padding:8px 0;border-bottom:1px solid #2A2A2A;color:#FFF;font-size:14px;text-align:right">${h(d.name)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #2A2A2A;color:#777;font-size:12px;letter-spacing:0.06em;text-transform:uppercase">Email</td>
        <td style="padding:8px 0;border-bottom:1px solid #2A2A2A;color:#FFF;font-size:14px;text-align:right">${h(d.email)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #2A2A2A;color:#777;font-size:12px;letter-spacing:0.06em;text-transform:uppercase">Store name</td>
        <td style="padding:8px 0;border-bottom:1px solid #2A2A2A;color:#FFF;font-size:14px;text-align:right">${h(d.storeName)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #2A2A2A;color:#777;font-size:12px;letter-spacing:0.06em;text-transform:uppercase">Tier</td>
        <td style="padding:8px 0;border-bottom:1px solid #2A2A2A;color:#FFF;font-size:14px;text-align:right">${h(d.tier)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#777;font-size:12px;letter-spacing:0.06em;text-transform:uppercase">Signed up</td>
        <td style="padding:8px 0;color:#FFF;font-size:14px;text-align:right">${h(d.signedUpAt.toUTCString())}</td>
      </tr>
    </table>
    <p style="color:#777;font-size:12px;line-height:1.6;margin:0">
      This seller is unapproved by default until verified in the admin dashboard.
    </p>
  ${WRAP_CLOSE}`;
  return { subject: `New seller signup: ${d.storeName}`, html };
}
