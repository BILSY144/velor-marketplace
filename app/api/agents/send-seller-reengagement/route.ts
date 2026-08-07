import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// One-off Seller Success tool: sends the 7 hand-written re-engagement emails
// to approved-but-zero-listing sellers (identified 2026-07-24 via the Pulse
// dashboard). Content is hardcoded server-side, not accepted from the
// request -- this is deliberately NOT a generic relay (see the open-relay
// finding fixed on test-outreach/route.ts). Gated the same fail-closed way:
// a required ADMIN_SECRET query param, since this needs to be triggerable
// from a plain browser URL. Lives under /api/agents so middleware.ts's
// blanket /api/admin ADMIN_SECRET header check doesn't apply -- this route
// does its own check below.
function wrap(bodyHtml: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#0D0D0D;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="max-width:600px;margin:32px auto;background:#1A1A1A;border-radius:10px;overflow:hidden;border:1px solid #2A2A2A">
<div style="background:#FF6B00;padding:24px 32px"><h1 style="margin:0;font-size:22px;font-weight:800;color:#FFF;letter-spacing:0.1em">VELOR</h1></div>
<div style="padding:32px">${bodyHtml}</div>
<div style="background:#111;padding:20px 32px;border-top:1px solid #1E1E1E">
  <p style="margin:0;font-size:12px;color:#666;line-height:1.6">
    Velor Commerce Ltd &middot; customerservice@velorglobalmarket.com<br>
    You are receiving this because you have an approved seller account on Velor.
  </p>
</div>
</div></body></html>`;
}

function p(lines: string[]): string {
  return lines
    .map(
      (line) =>
        `<p style="color:#BBB;font-size:15px;line-height:1.7;margin:0 0 18px">${line}</p>`
    )
    .join('\n');
}

const EMAILS: { key: string; to: string; subject: string; html: string }[] = [
  {
    key: 'nepal-art-shop',
    to: 'nepalartshop@gmail.com',
    subject: 'Your Velor store is approved — one thing to fix, one thing to do',
    html: wrap(
      p([
        'Hi Sharma,',
        'Your Nepal Art Shop store was approved on Velor on 18 July, and I wanted to reach out personally rather than let this sit.',
        'Two things.',
        "First — your identity verification didn't go through (Stripe couldn't confirm the document you submitted). That's worth retrying when you have a moment; it's what lets us pay you for orders. You can redo it from your seller dashboard.",
        "Second, and this is the main reason I'm writing: you haven't listed a product yet. Your application described an incredible range — Tibetan singing bowls, lokta paper products, hemp bags, felted wool crafts, walnut furniture — exactly the kind of authentic, handmade work we built Velor to showcase, not mass-produced goods. But none of it is visible to buyers until you add your first listing.",
        "It takes a few minutes: go to your dashboard, click Products, and add one item with a photo, a price, and a short description. Start with whichever piece you're proudest of.",
        "If anything about the listing process is unclear or difficult from Nepal — a confusing step, a form that doesn't fit how you'd normally describe your products — tell me directly and I'll fix it or walk you through it personally. I'd rather hear that from you than have you quietly give up.",
        'Warmly,<br>Velor Seller Success',
      ])
    ),
  },
  {
    key: 'hallory',
    to: '869152446@qq.com',
    subject: "Your porcelain store is live on Velor — let's get your first piece listed",
    html: wrap(
      p([
        'Hi Jack,',
        'HALLORY was approved on Velor on 23 July. Handmade porcelain from Jingdezhen is exactly the kind of story we want buyers around the world to see — but right now your store has no products listed, so nobody can find you yet.',
        'Could you add your first piece this week? From your seller dashboard, go to Products and add one listing — a photo, a price, a short description of the piece and how it was made. Start with your best-selling or most representative work from Jingdezhen.',
        "If it's easier for you to describe things in Chinese, that's completely fine — reply in Chinese and I (or our team) will handle it in Chinese from here. 如果用中文回复更方便，完全没问题，请直接用中文告诉我您遇到的任何问题，我们会用中文跟进。",
        'Let me know if anything is unclear or not working.',
        'Warmly,<br>Velor Seller Success',
      ])
    ),
  },
  {
    key: 'lakas-studio',
    to: 'jiweize7@gmail.com',
    subject: "LAKA's Studio is approved — your work deserves to be seen",
    html: wrap(
      p([
        'Hi Ji WeiZe,',
        "Your application for LAKA's Studio stayed with me — an architect and craftsman working across wood, metal, leather, stone and fabric, with that question of whether we own our objects or they outlast us. That's precisely the kind of maker story Velor exists to carry, not another mass-produced listing.",
        'Your store was approved on 23 July, but nothing is listed yet, so none of that work is visible to buyers. Could you add your first piece from your seller dashboard (Products → add listing) — a photo, price, and a short version of the story behind it? Even a shortened version of what you wrote in your application would make a compelling first listing description.',
        '如果用中文交流更方便，请随时用中文回复我，我们会用中文继续跟进，帮您完成第一件商品的上架。',
        "If there's anything blocking you — a technical issue, a step that's unclear, shipping from China, anything — tell me and I'll sort it out directly.",
        'Warmly,<br>Velor Seller Success',
      ])
    ),
  },
  {
    key: 'wasizo-deco',
    to: 'nugrahamedia@gmail.com',
    subject: "Your Velor store is ready — let's get your macrame and weaving listed",
    html: wrap(
      p([
        'Hi Santoz,',
        "Wasizo deco is approved on Velor, but there's nothing listed yet for buyers to find. Handmade macrame, crochet and woven pieces are exactly the kind of craft we want on the site.",
        "One note from your first submission: a listing needs at least a few clear photos of the actual piece (not a logo or stock image) — that was the one thing that held things up before. Once you've got 3+ clear photos of something you've made, go to your seller dashboard, click Products, and add it: photos, price, a short description of the materials and technique.",
        "If taking or uploading photos is the tricky part, let me know — I can walk you through it or suggest an easier way to do it from a phone.",
        'Warmly,<br>Velor Seller Success',
      ])
    ),
  },
  {
    key: 'aadya-bazaar',
    to: 'aadyabazaar@gmail.com',
    subject: 'Aadya Bazaar is approved on Velor — ready for your first listing',
    html: wrap(
      p([
        'Hi Bronwen,',
        'Aadya Bazaar was approved on 18 July — jewelry and textiles from Mexico is a great fit for what Velor is trying to build: a place where the origin and the maker actually matter, not just the product. But there\'s nothing listed yet, so the store isn\'t visible to buyers.',
        'Could you add your first piece this week? From your seller dashboard: Products → add listing, with a photo, price, and a short description — ideally naming the region or artisan tradition it comes from, since that context is exactly what sets Velor apart from a generic marketplace listing.',
        'If anything in the listing flow is confusing or not working as expected, tell me directly and I\'ll get it fixed.',
        'Warmly,<br>Velor Seller Success',
      ])
    ),
  },
  {
    key: 'hushlume',
    to: 'hello@gethushlume.com',
    subject: 'hushlume is approved on Velor — and a quick account note',
    html: wrap(
      p([
        'Hi 侯先生 / hushlume team,',
        'hushlume was approved on Velor — high-end, design-led desktop accessories with an industrial aesthetic is a strong, distinctive category for us, and different from most of what\'s currently listed.',
        'Two things.',
        'First, I noticed hushlume has two seller accounts on Velor (one signed up without a payout method selected, one with a different payout method). If one of those got stuck partway through setup, that\'s worth knowing — tell me which email you want to keep using and I\'ll help consolidate so you\'re not managing two accounts.',
        'Second, and the main thing: neither account has a product listed yet. Could you add your first piece — a photo, price, and short description of the design and materials — from your seller dashboard under Products? I\'d love to see hushlume\'s first listing go up.',
        '如果用中文回复更方便，请直接告诉我遇到的任何问题（包括支付账户设置的问题），我们会用中文跟进处理。',
        'Warmly,<br>Velor Seller Success',
      ])
    ),
  },
  {
    key: 'eastern-wisdom',
    to: 'tianyishui16@outlook.com',
    subject: 'The Eastern Wisdom is approved — let\'s get your first piece up',
    html: wrap(
      p([
        'Hi Yolanda,',
        'Your application described exactly the kind of listing Velor was built for — classical Chinese folk and Taoist culture items, self-designed (some patent-protected) and handmade in limited runs rather than mass-produced. That\'s the story we want buyers outside China to be able to find and trust.',
        'The Eastern Wisdom was approved on 23 July, but there\'s nothing listed yet. From your seller dashboard, go to Products and add your first item — a bookmark, a Zhong Kui print, an incense set, whatever you\'d like to lead with — with a photo, price, and a short description of the tradition it comes from.',
        '如果用中文交流更方便，请直接用中文回复，我们会用中文跟进，协助您完成第一件商品的上架。',
        'Let me know if anything about the process is unclear.',
        'Warmly,<br>Velor Seller Success',
      ])
    ),
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');
  const envSecret = process.env.ADMIN_SECRET;
  if (!envSecret || secret !== envSecret) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const onlyKey = searchParams.get('only');
  const dryRun = searchParams.get('dryRun') === '1';
  const targets = onlyKey ? EMAILS.filter((e) => e.key === onlyKey) : EMAILS;

  const results: { key: string; to: string; ok: boolean; error?: string }[] = [];

  for (const email of targets) {
    if (dryRun) {
      results.push({ key: email.key, to: email.to, ok: true });
      continue;
    }
    try {
      await sendEmail({
        from: 'Velor Seller Team <hello@velorglobalmarket.com>',
        to: email.to,
        subject: email.subject,
        html: email.html,
      });
      results.push({ key: email.key, to: email.to, ok: true });
    } catch (err) {
      results.push({
        key: email.key,
        to: email.to,
        ok: false,
        error: err instanceof Error ? err.message : 'error',
      });
    }
  }

  if (!dryRun) {
    try {
      await prisma.agentLog.create({
        data: {
          agentName: 'seller-success-reengagement',
          action: 'send_zero_listing_reengagement_batch',
          status: results.every((r) => r.ok) ? 'success' : 'partial',
          details: { results },
        },
      });
    } catch {
      // best-effort logging only
    }
  }

  return NextResponse.json({ ok: true, dryRun, sent: results.filter((r) => r.ok).length, total: targets.length, results });
}
