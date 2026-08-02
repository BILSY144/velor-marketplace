# Illegal Content Risk Assessment — Velor Marketplace (velorcommerce.store)

**STATUS: SIGNED — reviewed and confirmed by William Sinclair, 2026-07-30.** Nothing in this
document is adopted until signed below. Prepared 2026-07-29 following Ofcom's risk
assessment guidance for user-to-user services under the UK Online Safety Act 2023,
using the four-step methodology and the 17 kinds of priority illegal harm from
Ofcom's Risk Assessment Guidance and Risk Profiles.

**Named compliance owner:** William Sinclair, Director, Velor Commerce Ltd
(Company No. 17268133).

**Review cycle:** reassessed annually, and immediately upon any significant change
to the design or operation of the service (each new user-to-user feature launch —
Collections, Maker Journal, Workshop Feed — triggers an update to this assessment
BEFORE that feature goes live, per CLAUDE.md LAW #4).

---

## Step 1 — Understand the service

Velor Marketplace is a small global online marketplace for authentic cultural and
artisan goods. Independent sellers list physical products; buyers purchase through
Stripe checkout with funds held in escrow until delivery. UK-registered company,
users worldwide. At the date of this assessment the service is pre-buyer-launch
(buyers open 6 September 2026) with under twenty approved sellers and a catalogue
of roughly a dozen live listings, nearly all concentrated in one country.

**Existing user-to-user functionalities (live today):**

| Functionality | Description | Existing controls |
|---|---|---|
| Product listings | Sellers publish product pages (text, photos, optional video link) seen by all visitors | Automated moderation at creation (hard-block list: weapons, drugs, counterfeits, adult content, tobacco, alcohol); regulated-material certificate gating; post-listing review cron; admin takedown |
| Product reviews | Buyers post star ratings + text on products | Verified-purchase-only (server-enforced); content filter; reviewer name masked to "First L." |
| Buyer–seller messaging | Private 1:1 messages about products/orders | Shared content filter (contact details, URLs, payment-diversion patterns blocked); platform identities only (store name / "First L.") |
| Live streams + chat | Sellers broadcast live video; viewers send chat messages | Chat filtered client- and send-side; viewer report button with reasons; auto-end at 5 distinct-account reports; ops review ticket on auto-end |

**Planned user-to-user functionalities (Velor Social, per docs/velor-social-5-year-plan.md — NOT yet live; each requires this assessment updated before launch):** buyer Collections, seller Maker Journal posts, a followed-makers Workshop Feed, share-out cards.

**User base:** adults engaged in buying/selling cultural and artisan goods. No
functionality directed at children; account creation states 18+; purchases require
a payment card. No anonymity-enhancing features (no disappearing content, no
encrypted user messaging beyond platform TLS); user-generated images enter the
service only through moderated product listings.

## Step 2 — Assess risk per kind of priority illegal harm

Risk levels follow Ofcom's scale: **Negligible / Low / Medium / High.** Reasoning
records both the likelihood on this service's actual functionality and the controls
already in place.

| # | Kind of illegal harm | Risk | Reasoning and evidence |
|---|---|---|---|
| 1 | Terrorism | Negligible | No public posting/amplification surfaces; listings moderated; messaging is 1:1 commerce-scoped and filtered |
| 2 | Child sexual exploitation and abuse (CSEA, incl. grooming and CSAM) | Low | No child users targeted (18+, commerce); no user image sharing outside moderated listings; 1:1 messaging exists (grooming vector in principle) but is content-filtered, identity-masked, and commerce-scoped — kept under explicit watch; any report actioned immediately and reported to authorities |
| 3 | Encouraging or assisting suicide (or serious self-harm) | Negligible | No social feed or forums today; commerce-scoped surfaces |
| 4 | Harassment, stalking, threats and abuse | Low | Messaging and live chat are the plausible vectors; both filtered; live chat has report + auto-end; block/mute is a committed build item before social launch |
| 5 | Hate | Low | Same vectors and controls as #4; listing moderation covers hateful goods/symbols |
| 6 | Controlling or coercive behaviour | Negligible | No persistent social relationships between users today; 1:1 messaging is commerce-scoped |
| 7 | Drugs and psychoactive substances | Low | Marketplace listing risk; hard-blocked at listing creation (term list) + post-listing review + takedown |
| 8 | Firearms, knives and other weapons | Low | As #7 — hard-blocked at creation, reviewed, takedown capability |
| 9 | Unlawful immigration and human smuggling | Negligible | No services-for-people surface; goods marketplace |
| 10 | Human trafficking | Negligible | As #9; seller KYC via payout rails (Stripe/Payoneer regulated onboarding) |
| 11 | Sexual exploitation of adults | Negligible | No adult-services surface; adult content hard-blocked in listings |
| 12 | Extreme pornography | Negligible | No user image feeds; adult content hard-blocked in listings |
| 13 | Intimate image abuse | Negligible | User images enter only via moderated product listings |
| 14 | Proceeds of crime / money laundering | Low | Marketplace-inherent risk; mitigated by Stripe/Payoneer KYC on every payout, escrow, £-traceable transactions, no user-to-user payments |
| 15 | Fraud and financial services offences | **Medium** | The material risk for a marketplace: scam/counterfeit listings and payment-diversion attempts. Mitigations: escrow (buyer money held until confirmed delivery), listing moderation + counterfeit hard-block, message filter blocks off-platform payment steering, seller KYC via payout rails, dispute/return system, IP-complaint route. Rated Medium not Low because fraud attempts against marketplaces are a matter of when, not if |
| 16 | Foreign interference | Negligible | No news/civic content or amplification surfaces |
| 17 | Animal cruelty | Low | Listing risk (wildlife-derived goods): CITES/regulated-material certificate gate blocks ivory, protected species etc. at listing (see velor-global-compliance) |

**Overall service risk: LOW**, with fraud (Medium) as the priority harm, which is
consistent with Ofcom's risk profile for small marketplace services. No High risks
identified.

## Step 3 — Safety measures (decided and committed)

Measures in force today: automated listing moderation with hard-block categories
and certificate gating; verified-purchase-only reviews; shared content filter on
messages, reviews, returns, disputes and live-stream metadata; live-stream viewer
reporting with reasoned form and 5-report auto-end; escrow payments; payout-rail
KYC on all sellers; admin takedown across all content types with dated database
records (AgentLog); 24–48h action target on illegal-content reports.

Committed BEFORE any Velor Social UGC surface launches (build list, tracked in
CLAUDE.md): report button on every piece of UGC (reviews and messages included, not
only live streams and listings); a public complaints page usable by non-users;
appeals route for content takedowns and account actions; block/mute; rate limits on
new accounts for posting surfaces; this assessment updated per feature.

## Step 4 — Record, report and review

This document and each revision are kept in the service's version-controlled
repository (dated, attributable). Reports of illegal content are actioned within
24–48 hours with the action and date recorded. The assessment is reviewed annually
(next review due: 2027-07-29) and before each new user-to-user feature launch.
Ofcom correspondence, if any, is answered promptly — non-engagement is recognised
as the primary enforcement risk for small services.

---

**Sign-off (to be completed by the named compliance owner):**

Name: William Sinclair — Director, Velor Commerce Ltd

Signature/date: William Sinclair -- confirmed directly in a Cowork session, 2026-07-30 (no scanned wet-ink signature on file; this is the record of his verbal/written confirmation as the named accountable person).

**Update, 2026-08-02:** buyer-launch date corrected from 6 August to 6 September 2026, and the seller/catalogue snapshot refreshed to reflect actual figures at that date, per William Sinclair's direction in that session's Cowork conversation. No other assessment conclusion changed.
