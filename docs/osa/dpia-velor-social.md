# Data Protection Impact Assessment (DPIA) — Velor Social Layer

**STATUS: SIGNED — reviewed and confirmed by William Sinclair, 2026-07-30.** Prepared
2026-07-29 under UK GDPR Art. 35 and the ICO's DPIA guidance. Required BEFORE the
Velor Social features launch (plan §8.4): follows, public profiles, collections,
maker journal, workshop feed, notifications, share-out cards.

**Controller:** Velor Commerce Ltd (Company No. 17268133), ICO registration
ZC204644. **DPO:** not required (assessed 2026-07-24 at ICO registration); the
named accountable person is William Sinclair, Director.

## 1. Why a DPIA is required

The social layer introduces systematic new processing: public-by-choice activity
(follows, collections, journal posts), a personalised (followed-makers,
chronological) feed, and notifications — and the service cannot rule out access
by children (see the Children's Access Assessment). Innovative-use plus
potential-child-access triggers a DPIA under ICO criteria.

## 2. Processing description

- **New data:** follow relationships (buyer→seller), collection names and saved
  items, journal post content (seller text/photos), feed read state,
  notification tokens/preferences, share-card click attribution (deep-link
  parameters, no third-party pixels).
- **Visibility:** journal posts and seller profiles are public (that is their
  purpose, seller-controlled); buyer collections default PRIVATE with explicit
  opt-in to share; follows are not publicly listed by default; buyers continue to
  appear as "First L." everywhere (existing platform rule).
- **Feed logic:** reverse-chronological from followed makers plus editorial
  drops. NO engagement-optimised algorithmic ranking, no behavioural profiling,
  no ad targeting (LAW #4 healthy-by-design; also removes the DSA/OSA
  recommender-transparency burden).
- **Lawful bases:** contract (providing features the user activates); legitimate
  interests (service notifications, fraud prevention) with balancing recorded;
  consent (marketing notifications, optional sharing).
- **Retention:** social content lives while the account lives; deleted on
  account deletion (cascade), consistent with existing schema practice; images
  stored on Cloudflare R2 (EU-adjacent jurisdiction; processor terms on file
  with Cloudflare).

## 3. Risks and mitigations

| Risk | Severity/likelihood | Mitigation |
|---|---|---|
| Child accesses social features | Medium/Low | Child-safe defaults regardless of the access-assessment outcome: private-by-default, no nudge patterns, no strangers-DM surface (messaging stays commerce-scoped); re-assess access evidence quarterly post-launch |
| Over-exposure of buyer activity | Medium/Low | Collections private by default; a collection is only ever public if the buyer explicitly opts in via a named toggle with plain-language copy explaining it may appear on the Makers' Circle homepage; buyers pseudonymous ("First L.") even when a collection is public; no public follower lists at launch |
| Addictive-design harm | Low | No infinite algorithmic feed, no streaks, no engagement bounties; weekly drop ritual is time-boxed by design |
| UGC contains third-party personal data | Medium/Low | Content filter blocks contact details; report + takedown routes (Online Safety Policy §3) |
| Notification fatigue / unlawful marketing | Low | Transactional vs marketing notifications separated; marketing strictly opt-in (PECR) |
| Data breach of social graph | Low | Existing platform controls; social tables carry no new special-category data |

## 4. Consultation and sign-off

Seller and buyer-facing privacy notice to be updated for the new processing
before launch. This DPIA is reviewed at each social feature launch and annually.
Residual risk after mitigations is assessed as LOW; no prior consultation with
the ICO considered necessary. Final judgement rests with the signatory.

### Addendum, 2026-07-30 — public collections browsing surface

William confirmed sign-off on this DPIA and approved building a public
browsing surface for buyer collections (Makers' Circle homepage "Buyer's
Collections" section), which the original assessment above had deliberately
left out at launch. New processing this addendum covers: a collection is
never public unless the buyer explicitly flips a per-collection toggle;
the toggle's own copy tells the buyer plainly that a public collection may
be shown on the Makers' Circle homepage (see app/account/collections/page.tsx);
public collections show the collection name, real product thumbnails, and
the buyer's existing pseudonymous "First L." identity only -- no email, no
full name, no other account data. The privacy notice should still be
updated to mention this specific new visibility before or shortly after
this goes live, per the paragraph above.

---

**Sign-off (to be completed):**

Name: William Sinclair — Director, Velor Commerce Ltd

Signature/date: William Sinclair -- confirmed directly in a Cowork session, 2026-07-30 (no scanned wet-ink signature on file; this is the record of his verbal/written confirmation as the named accountable person).
