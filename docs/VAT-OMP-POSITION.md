# Velor's VAT position as an online marketplace (OMP)

_Drafted 2026-07-29 after William asked where the checkout "Duties & taxes"
money goes. Researched against current HMRC guidance and the July 2026
consultation. THIS IS NOT PROFESSIONAL TAX ADVICE -- a UK accountant must
confirm this before buyers launch. LAW #1 applies: everything below is
either verified against a source or marked as needing confirmation._

## What the code does today (verified in code, 2026-07-29)

- On international orders, checkout charges the buyer an estimated
  "Duties & taxes" line (lib/duty-rates.ts calculateLandedCost -- for
  CN->GB this is 20% UK VAT on the goods value).
- That money is passed to the SELLER in full, commission-free
  (payment-intent: sellerShareGBP includes dutiesGBP), held in escrow,
  released after delivery. Velor keeps none of it.
- The implicit model: the seller ships duties-paid (DDP) and uses that
  money to cover the customs charge. Nothing enforces or verifies this
  on self-ship (seller-flat-rate) lanes.

## The legal reality (UK, current rules since 2021)

1. **Imports <= GBP 135 (intrinsic goods value) sold to UK consumers
   through an online marketplace: the MARKETPLACE is the deemed
   supplier.** Velor -- not the seller -- is responsible for charging 20%
   UK VAT at the point of sale and paying it to HMRC on its own VAT
   return. No import VAT is then due at the border; the parcel should
   carry the OMP's VAT number so it isn't taxed twice.
2. **Goods of ANY value already located in the UK, sold by an OVERSEAS
   seller through an OMP: the OMP is deemed supplier too.** (Relevant
   later if overseas sellers ever hold UK stock.)
3. **Imports > GBP 135:** normal import rules -- the buyer (or a DDP
   arrangement) pays import VAT + any duty at the border. The
   marketplace is not the deemed supplier for these.

Sources: HMRC VAT registration manual VATREG37210; the 2020 policy paper
"VAT: Alternative VAT treatment of Goods from Overseas" (gov.uk);
industry guides (Passport, J&P, Shorts) all consistent.

## Why the current code is wrong for <= GBP 135 UK imports

Two problems at once on a lane like the Door God print (CN -> GB, GBP 6.77):

- The GBP 1.35 charged as tax should be remitted BY VELOR TO HMRC (once
  VAT-registered), not passed to a seller in China who cannot remit UK
  VAT.
- Velor is (assumed -- CONFIRM WITH WILLIAM/ACCOUNTANT) not yet
  VAT-registered. An unregistered business must not charge VAT at all.

## Registration question

Velor Commerce Ltd is UK-established, so the GBP 90k/12-month taxable
turnover threshold applies -- deemed supplies count toward it. Pre-revenue,
registration is not yet compulsory. BUT the deemed-supplier mechanism only
works properly once registered, so the practical answer is likely
**voluntary VAT registration at or before buyer launch**. Accountant to
confirm the exact timing and whether deemed-supplier status changes the
threshold analysis.

## What the fix looks like (NOT built -- needs William's go-ahead)

End state, once VAT-registered:
1. Checkout keeps charging 20% VAT on <= GBP 135 UK-destination imports
   (the buyer experience doesn't change).
2. That VAT routes to VELOR's ledger (a vatCollectedGBP field on Order,
   excluded from sellerEarnings), reported and paid to HMRC quarterly.
3. Seller receives item + shipping minus commission only; seller emails/
   docs explain the parcel should be labelled with Velor's VAT number so
   the border doesn't charge again.
4. > GBP 135 orders keep today's behaviour (estimate passed through for a
   DDP-style arrangement) -- but self-ship lanes need honesty about
   whether the parcel is actually DDP, else buyers can be double-charged
   at the door.

Interim (before registration): decide with the accountant whether to stop
charging the tax line on <= GBP 135 UK imports or to register early.
Do not change the money routing without William's explicit decision.

## EU and beyond (later, flagged only)

- EU has the same concept: marketplaces are deemed supplier for <= EUR 150
  imports, handled via IOSS registration. Needed once EU buyer volume is
  real.
- US: de minimis rules changed in 2025 -- verify current state before
  relying on any US duty-free assumption.

## Coming UK changes to watch

- **HMRC consultation open 23 Jun - 18 Aug 2026**: proposes extending
  deemed-supplier liability to UK-BASED sellers on marketplaces (today it
  is overseas sellers only). Possible small-platform revenue threshold
  under discussion. Outcome will directly affect Velor -- watch for the
  response document.
- The government has signalled it plans to **remove the GBP 135 customs
  duty exemption** for low-value imports -- if that lands, duty (not just
  VAT) enters the low-value calculation.

## Related margin finding (same conversation)

Stripe's processing fee applies to the GROSS charge including VAT/duties
and shipping (standard card processing; the fee is not deductible from
VAT owed to HMRC). On micro-orders via fee-free seller-shipping lanes the
20p fixed component can exceed Velor's commission entirely -- the GBP 8.12
Door God order earns GBP 0.27 commission against ~GBP 0.32 Stripe fee, a
~5p loss. Options if William wants to address it: minimum order value, or
accept small losses on cheap items. No change made.
