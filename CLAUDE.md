# VELOR GLOBAL MARKETPLACE

## What This Project Is

Velor is the world's first 100% AI-operated global commerce marketplace.

This is NOT a dropshipping store. There is NO single supplier. There is NO CJ Dropshipping integration. The legacy velorcommerce.co.uk dropshipping store is a completely separate project.

Every platform function is executed by a coordinated team of specialised AI agents.

- **Entity**: Velor Commerce Ltd (UK limited company)
- **Marketplace domain**: velorcommerce.store
- **GitHub repo**: BILSY144/velor-marketplace
- **Vercel project**: velor1/velor-marketplace
- **Tech stack**: Next.js 15, App Router, TypeScript, Prisma, PostgreSQL, Stripe Connect, Vercel
- **Director**: William Sinclair

---

## Revenue Model

| Tier | Monthly Fee | Commission | Listings |
|------|------------|------------|---------|
| STARTER | Free | 15% | 50 products |
| PRO | $59/month | 8% | Unlimited |
| ENTERPRISE | Custom | 3-5% | Unlimited + API |

---

## The Nine AI Agents

| Agent | Role |
|-------|------|
| HUNTER | Global seller prospecting and outreach, 190+ countries |
| CURATOR | Seller onboarding, registration to live listing in under 24 hours |
| ORACLE | AI listing optimisation, SEO, descriptions, pricing, any language |
| SCOUT | Real-time competitive pricing intelligence, Amazon, eBay, regional |
| SENTINEL | Fraud detection, counterfeit detection, listing quality enforcement |
| HERALD | Buyer customer service, sub-60-second response, 24/7/365 |
| LEDGER | Seller SLA enforcement, performance scoring, automated coaching |
| ARBITER | Omnichannel marketing, SEO, email, paid, social, A/B testing |
| COMPASS | Business intelligence, daily KPI reporting for director |

CEO Agent (Claude/Anthropic): Orchestrating intelligence, cross-domain decisions, weekly director summary.

---

## Email Configuration

- FROM: customerservice@velorcommerce.co.uk
- Domain: velorcommerce.co.uk (Resend, verified)
- Admin briefing recipient: willsinclair144@gmail.com (director only)

---

## Vercel Environment Variables

| Variable | Status |
|----------|--------|
| RESEND_API_KEY | SET |
| DATABASE_URL | SET |
| DIRECT_URL | SET |
| ANTHROPIC_API_KEY | MISSING - add to Vercel |
| CRON_SECRET | MISSING - add to Vercel |

---

## Immediate Security Priorities

1. CRITICAL: Add ADMIN_SECRET env var check to all /admin/* routes
2. HIGH: Patch Next.js to 14.2.25+ (CVE-2025-29927, CVSS 9.1)
3. HIGH: Rate limiting on /api/chat, /api/contact, /api/checkout

---

## Standing Rules

- Never fabricate prospect data
- Never share one seller's data with another
- Never release payouts for disputed orders
- Never approve prohibited items
- Never send more than 3 emails to the same seller
- No emojis in code or emails
- No Tailwind utility classes
- Never lie, fabricate, or invent API responses or outcomes
- Never assume a build passed - always verify in Vercel deployments

---

## GitHub Push Workflow

Always use GitHub Trees API for multi-file commits:
1. GET /git/refs/heads/main
2. GET /git/commits/{sha}
3. POST /git/trees
4. POST /git/commits
5. PATCH /git/refs/heads/main

Owner: BILSY144 | Repo: velor-marketplace | Branch: main
