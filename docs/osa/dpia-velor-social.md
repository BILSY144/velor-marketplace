# Data Protection Impact Assessment (DPIA) — Velor Social Layer

**STATUS: DRAFT — awaiting review and sign-off by William Sinclair.** Prepared
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
| Over-exposure of buyer activity | Medium/Low | Collections private by default; buyers pseudonymous ("First L."); no public follower lists at launch |
| Addictive-design harm | Low | No infinite algorithmic feed, no streaks, no engagement bounties; weekly drop ritual is time-boxed by design |
| UGC contains third-party personal data | Medium/Low | Content filter blocks contact details; report + takedown routes (Online Safety Policy §3) |
| Notification fatigue / unlawful marketing | Low | Transactional vs marketing notifications separated; marketing strictly opt-in (PECR) |
| Data breach of social graph | Low | Existing platform controls; social tables carry no new special-category data |

## 4. Consultation and sign-off

Seller and buyer-facing privacy notice to be updated for the new processing
before launch. This DPIA is reviewed at each social feature launch and annually.
Residual risk after mitigations is assessed as LOW; no prior consultation with
the ICO considered necessary. Final judgement rests with the signatory.

---

**Sign-off (to be completed):**

Name: William Sinclair — Director, Velor Commerce Ltd

Signature/date: ______________________________
