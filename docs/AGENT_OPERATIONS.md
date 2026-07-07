# Velor Agent Operations — The Constitution of the AI-Run Business

Adopted 8 July 2026 by William (director). This document is BINDING on every agent, cron,
subagent and Claude session working on Velor Marketplace. It defines who runs what, how often,
to what standard, and how failures are caught. The enforcement mechanism is real:
/api/cron/agent-watchdog verifies outcomes hourly and alerts when any duty is breached.

## Prime rules (LAW #1 applies to every agent)
1. Never fabricate: no fake stats, fake reviews, fake statuses, fake "done" claims. If an agent
   cannot verify something, it reports "unconfirmed".
2. Buyers and sellers get honest answers fast, in every timezone -- the business runs 24 hours.
3. Money rules are absolute: escrow release only after confirmed delivery + hold; disputes freeze
   funds; Stripe rail for supported countries, Payoneer for the rest; Velor withdrawals to Monzo.
4. Compliance rules are absolute: /legal/seller-rules is enforced in code (rules acknowledgment,
   regulated-material gating, certificate verification before approval).

## The agents, their duties, and their live implementation

| Agent | Duty | Implementation (verified real) | Cadence |
|-------|------|-------------------------------|---------|
| 1. Seller Prospecting | Find quality sellers worldwide | /api/cron/scout-sellers (Brave) + /api/cron/enrich-emails | every 6h |
| 2. Seller Outreach | Invite prospects (max 3 emails, personalised, logged) | /api/cron/outreach-auto -> OutreachLog | every 2h (gated by OUTREACH_ENABLED) |
| 3. Seller Onboarding | Process applications end-to-end | /api/seller/apply -> SellerApplication + /api/agents/applications review + approval/rejection emails | on event; SLA: reviewed within 24h (target 1h) |
| 4. Seller Success | Support sellers, priority for Enterprise | SupportTicket system (/api/dashboard/support, auto-PRIORITY for Enterprise, email ack + sellers@ notification) | on event; SLA: first response 24h, priority 4h |
| 5. Buyer Acquisition / Marketing | Campaigns per docs/GLOBAL_MARKETING_STRATEGY.md | Phase 1 seller recruitment live via agents 1-2; buyer waitlist popup; paid ads REQUIRE ad accounts (see Honest Gaps) | continuous |
| 6. Buyer Experience | Fast, honest buyer help | Velor AI assistant (/api/assistant/chat, Claude-powered, live on site) + returns/disputes flows + order tracking | 24/7 (assistant), events |
| 7. Listings Quality | Review every listing | /api/admin/products/auto-moderate (hard-reject banned, hold regulated + suspicious, approve clean) + certificate review queue | every 5 min |
| 8. Finance & Ops | Escrow, payouts, reconciliation | /api/cron/release-payouts (Stripe + Payoneer rails, idempotent) + Stripe webhook + payout freeze on disputes | every 4h |
| 9. Growth & Analytics | Measure and report honestly | /api/reports/daily (director briefing with real AgentLog data), /api/cron/traffic-check, /api/cron/recompute-rankings, /api/agents/growth/report | daily/nightly |

## Enforcement — the watchdog
/api/cron/agent-watchdog runs hourly and checks OUTCOMES (not self-reported status):
- Listings Quality: alerts if clean PENDING_REVIEW listings are older than 6h (moderation stalled).
- Onboarding: alerts if any SellerApplication is PENDING for over 24h.
- Seller Success: alerts if any OPEN SupportTicket has had no resolution and is older than 24h
  (4h for PRIORITY tickets).
- Prospecting: alerts if no new SellerProspect rows in 48h.
- Outreach: alerts if OUTREACH_ENABLED is on but no OutreachLog rows in 24h.
- Finance: alerts if any DELIVERED order is past its hold window with no payout row and no open
  dispute/return (excluding heldForPayoneer orders awaiting rail activation).
- Certificates: alerts if any PENDING ProductCertificate is older than 48h unreviewed.
Every run writes an AgentLog entry (agentName "agent-watchdog"). Breaches email
customerservice@velorcommerce.co.uk immediately and appear in the daily director briefing.

## Honest gaps (do not misrepresent these as running)
1. Paid advertising (Meta/TikTok/Google) is NOT live: it requires ad accounts, payment methods and
   platform approvals that only William can create. Until then, marketing means: seller outreach
   (agents 1-2), organic/SEO, the buyer waitlist, and launch PR prep per the strategy doc.
2. OUTREACH_ENABLED is currently OFF. Flipping it on is William's go signal for Phase 1 marketing.
3. Payoneer API rail awaits partner approval (application submitted 8 Jul 2026); manual batch
   payments from the Payoneer account are the interim.
4. Support tickets get an automatic acknowledgment; a full AI-drafted first response is a build
   item (next in queue). The buyer-facing AI assistant IS live.
5. Claude working sessions (this) are not literally always-on; the 24/7 layer is the crons,
   webhooks and assistant above, plus scheduled check-ins that update CLAUDE.md.

## Escalation to William (only these reach his personal email)
Daily director briefing (7am), plus immediate alerts for: payment/payout anomalies, legal or
regulatory contact, watchdog-detected system-wide failure. Everything else is handled by agents
via customerservice@velorcommerce.co.uk.
