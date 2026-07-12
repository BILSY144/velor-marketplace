# Velor Marketplace — SEO Working Log

Maintained by the hourly "Velor Marketplace SEO agent" scheduled task. Read this file, alongside CLAUDE.md, at the start of every run to pick up where the last run left off -- each run is a fresh session with no memory of prior runs.

## Rules for this agent

- LAW #1 (honesty) from CLAUDE.md applies here without exception: never fabricate cultural, country, or product content; never invent facts; never claim a push succeeded without verifying the Vercel deployment actually reached Ready.
- This is velorcommerce.store (Velor Marketplace) work only. Never reference or apply CJ Dropshipping, the gold/cream brand, or anything from the separate velorcommerce.co.uk business, and never use the velor-advertising skill for this project -- use velor-cultural-marketplace positioning instead.
- No emojis anywhere. No Tailwind -- inline CSS plus the existing CSS variables only.
- Additive by default: prefer changes that cannot break existing functionality (meta tags, schema markup, alt text, new researched content) over risky structural changes. Never fabricate /origins country profiles -- real researched facts only, per William's standing rule.
- Push mechanism: try direct network access (Bash/curl or a script) to api.github.com first; if unavailable, try Chrome MCP browser tools (may be absent in headless/unattended runs); if neither works, do the research and drafting work anyway and log clearly that the push step was skipped this cycle so a later interactive session can apply it.
- If the GitHub PAT returns 401 Unauthorized, the token has likely expired or been rotated -- log this clearly, do not keep retrying pushes, and continue with read-only research/drafting work only.
- Do not run a full fresh technical audit more than once per 24 hours -- check this log's timestamps first. Otherwise, work the backlog below, highest-priority item first.
- Every run ends with a dated entry in the Completed log below, however small (even "read the site, backlog unchanged, no safe action this cycle" is a valid honest entry).

## Backlog (prioritized, top = next)

_(empty -- the first run should populate this from a full audit: sitemap.xml and robots.txt correctness, meta titles/descriptions, schema.org structured data (Organization, WebSite, BreadcrumbList, FAQPage), heading structure, image alt text, internal linking across the origin x speciality lattice, broken links, /origins and /specialities content depth against William's "15+ researched items per country, do not invent" rule, keyword and content-gap research for seller-recruitment and cultural-heritage terms, competitor gaps vs Etsy/eBay, and AI-visibility/answer-engine readiness.)_

## Completed log

_(newest first -- one dated entry per run, honest about what was and was not verified)_
