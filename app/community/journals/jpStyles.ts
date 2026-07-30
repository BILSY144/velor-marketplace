// Shared styles for the Makers' Circle journal page design (William's
// second design) -- used by the showcase at /community/journals and the
// real per-seller page at /community/journals/[sellerId].
export const jpCss = `
.jp-page {
  --mc-bg: #0b0906;
  --mc-card: #131008;
  --mc-card2: rgba(255,255,255,0.04);
  --mc-goldline: rgba(212,175,55,0.55);
  --mc-text: #f4efe6;
  --mc-muted: #a99f8c;
  --mc-gold: #D4AF37;
  --mc-shadow: 0 18px 44px rgba(0,0,0,0.4);
  background: var(--mc-bg); color: var(--mc-text);
  padding: 0 clamp(8px, 1vw, 14px) 50px;
}
html[data-theme='light'] .jp-page {
  --mc-bg: var(--bg);
  --mc-card: var(--surface);
  --mc-card2: rgba(0,0,0,0.045);
  --mc-goldline: #c9a227;
  --mc-text: var(--text);
  --mc-muted: var(--muted);
  --mc-gold: #a8811a;
  --mc-shadow: 0 10px 28px rgba(26,20,10,0.09);
}

.jp-crumbs { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 16px 4px 14px; font-size: 12px; color: var(--mc-muted); }
.jp-crumbs a { color: var(--mc-muted); }
.jp-crumbs a:hover { color: var(--mc-gold); }
.jp-crumb-here { color: var(--mc-text); }

.jp-grid { display: grid; grid-template-columns: 1fr 310px; gap: 20px; align-items: start; }
@media (max-width: 980px) { .jp-grid { grid-template-columns: 1fr; } }
.jp-main { display: flex; flex-direction: column; gap: 18px; min-width: 0; }
.jp-side { display: flex; flex-direction: column; gap: 16px; min-width: 0; }

.jp-card { background: var(--mc-card); border-radius: 16px; padding: 16px; box-shadow: var(--mc-shadow); }
.jp-sidetitle { font-size: 16px; margin-bottom: 9px; }
.jp-note { font-size: 12.5px; color: var(--mc-muted); line-height: 1.6; }
.jp-viewall { display: inline-flex; align-items: center; gap: 5px; font-family: var(--font-display); font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--mc-gold); margin-top: 8px; }
.jp-viewall:hover { color: var(--accent); }
.jp-sechead { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
.jp-sectitle { font-size: 20px; }
.jp-chip-gold { display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 6px; border: 1px solid var(--mc-goldline); color: var(--mc-gold); font-family: var(--font-display); font-size: 10.5px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; align-self: flex-start; }

.jp-back { display: inline-flex; align-items: center; gap: 7px; padding: 7px 14px; border-radius: 7px; background: var(--mc-card2); color: var(--mc-text); font-size: 12px; align-self: flex-start; }
.jp-back:hover { color: var(--mc-gold); }

/* hero */
.jp-hero { display: grid; grid-template-columns: 1fr 1.15fr; gap: 0; background: var(--mc-card); border-radius: 16px; overflow: hidden; box-shadow: var(--mc-shadow); }
@media (max-width: 760px) { .jp-hero { grid-template-columns: 1fr; } }
.jp-hero-text { padding: 20px; display: flex; flex-direction: column; gap: 13px; }
.jp-title { font-size: clamp(26px, 3.2vw, 38px); line-height: 1.12; }
.jp-intro { font-size: 13.5px; color: var(--mc-muted); line-height: 1.7; }
.jp-hero-media { min-height: 260px; }
.jp-hero-media img { width: 100%; height: 100%; object-fit: cover; }
.jp-meta { display: flex; flex-wrap: wrap; gap: 18px; margin-top: auto; }
.jp-meta-item { display: inline-flex; align-items: center; gap: 9px; }
.jp-meta-avatar { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; }
.jp-meta-ico { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; background: var(--mc-card2); color: var(--mc-gold); }
.jp-meta-flag { font-size: 22px; }
.jp-meta-strong { display: flex; align-items: center; font-size: 12.5px; font-weight: 600; color: var(--mc-text); }
.jp-meta-sub { display: block; font-size: 11px; color: var(--mc-muted); }
.jp-verified { display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--mc-gold); color: #14110c; margin-left: 6px; }

/* engagement */
.jp-engage { display: flex; align-items: center; flex-wrap: wrap; gap: 20px; padding: 2px 4px; }
.jp-engage-stat { display: inline-flex; align-items: center; gap: 7px; color: var(--mc-text); font-size: 13px; }
.jp-engage-stat svg { color: var(--mc-gold); }
.jp-share { background: none; border: none; padding: 0; font-family: inherit; color: var(--mc-text); cursor: pointer; }
.jp-share:hover { color: var(--mc-gold); }
.jp-loved { display: inline-flex; align-items: center; gap: 9px; margin-left: auto; font-size: 12px; color: var(--mc-muted); }
.jp-loved img { height: 26px; width: auto; border-radius: 999px; }

/* tabs */
.jp-tabs { display: flex; flex-wrap: wrap; gap: 4px; border-bottom: 1px solid var(--mc-card2); padding: 0 2px; }
.jp-tab { padding: 9px 14px; font-family: var(--font-display); font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--mc-muted); border-bottom: 2px solid transparent; }
.jp-tab-on { color: var(--mc-gold); border-bottom-color: var(--accent); }

/* story */
.jp-story { display: grid; grid-template-columns: 1fr 1.05fr; gap: 18px; }
@media (max-width: 760px) { .jp-story { grid-template-columns: 1fr; } }
.jp-story-text { display: flex; flex-direction: column; gap: 12px; font-size: 13.5px; color: var(--mc-muted); line-height: 1.75; }
.jp-story-text p { margin: 0; }
.jp-showless { color: var(--mc-gold); font-size: 12.5px; }
.jp-gallery { display: flex; flex-direction: column; gap: 10px; }
.jp-gal-main { width: 100%; border-radius: 12px; object-fit: cover; aspect-ratio: 298 / 174; }
.jp-gal-thumbs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.jp-gal-thumbs img { width: 100%; border-radius: 10px; object-fit: cover; aspect-ratio: 96 / 104; }

/* products */
.jp-section { display: flex; flex-direction: column; }
.jp-prod-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
@media (max-width: 760px) { .jp-prod-grid { grid-template-columns: repeat(2, 1fr); } }
.jp-prod { display: flex; flex-direction: column; background: var(--mc-card); border-radius: 12px; overflow: hidden; box-shadow: var(--mc-shadow); }
.jp-prod:hover { filter: brightness(1.08); }
.jp-prod img { width: 100%; aspect-ratio: 155 / 114; object-fit: cover; }
.jp-prod-name { padding: 9px 11px 0; font-size: 12.5px; font-weight: 600; color: var(--mc-text); }
.jp-prod-price { padding: 2px 11px 0; font-family: var(--font-serif); font-size: 16px; color: var(--mc-text); }
.jp-prod-foot { display: flex; align-items: center; justify-content: space-between; padding: 6px 11px 11px; }
.jp-prod-loves { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--mc-muted); }
.jp-prod-loves svg { color: var(--red); }
.jp-prod-view { font-size: 10.5px; font-family: var(--font-display); font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--mc-gold); }

/* comments */
.jp-sort { font-size: 12px; color: var(--mc-muted); }
.jp-sort-val { color: var(--mc-text); }
.jp-cinput { display: flex; align-items: center; gap: 10px; background: var(--mc-card); border-radius: 12px; padding: 10px 12px; margin-bottom: 14px; box-shadow: var(--mc-shadow); }
.jp-cinput:hover { filter: brightness(1.1); }
.jp-cinput-avatar { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 50%; background: var(--mc-card2); border: 1px solid var(--mc-goldline); color: var(--mc-gold); flex-shrink: 0; }
.jp-cinput-ph { flex: 1; font-size: 13px; color: var(--mc-muted); }
.jp-cinput-send { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%; color: var(--mc-gold); }
.jp-comments { display: flex; flex-direction: column; gap: 14px; }
.jp-comment { display: flex; gap: 11px; background: var(--mc-card); border-radius: 12px; padding: 13px; box-shadow: var(--mc-shadow); }
.jp-comment-avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
.jp-comment-body { flex: 1; min-width: 0; }
.jp-comment-top { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.jp-comment-name { font-size: 12.5px; font-weight: 700; }
.jp-comment-country { font-size: 11.5px; color: var(--mc-muted); }
.jp-comment-time { font-size: 11px; color: var(--mc-muted); margin-left: auto; }
.jp-comment-menu { color: var(--mc-muted); }
.jp-comment-text { font-size: 13px; color: var(--mc-muted); margin: 6px 0 8px; line-height: 1.6; }
.jp-comment-loves { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--mc-muted); }
.jp-comment-loves svg { color: var(--red); }

/* more journals */
.jp-mj-rail { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; }
@media (max-width: 980px) { .jp-mj-rail { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 540px) { .jp-mj-rail { grid-template-columns: repeat(2, 1fr); } }
.jp-mj { display: flex; flex-direction: column; gap: 3px; background: var(--mc-card); border-radius: 10px; overflow: hidden; padding-bottom: 9px; box-shadow: var(--mc-shadow); }
.jp-mj:hover { filter: brightness(1.1); }
.jp-mj img { width: 100%; aspect-ratio: 101 / 90; object-fit: cover; margin-bottom: 5px; }
.jp-mj-day { padding: 0 9px; font-size: 10.5px; font-weight: 700; color: var(--accent); font-family: var(--font-display); letter-spacing: 0.05em; }
.jp-mj-title { padding: 0 9px; font-size: 11.5px; color: var(--mc-text); line-height: 1.4; }
.jp-mj .jp-prod-loves { padding: 2px 9px 0; }

/* sidebar: maker card */
.jp-maker { display: flex; align-items: center; gap: 12px; }
.jp-maker-avatar { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; border: 2px solid var(--mc-gold); flex-shrink: 0; }
.jp-maker-name { display: flex; align-items: center; font-family: var(--font-serif); font-size: 17px; }
.jp-maker-craft { font-size: 12px; color: var(--mc-muted); }
.jp-maker-loc { font-size: 11.5px; color: var(--mc-muted); display: flex; align-items: center; gap: 6px; margin-top: 2px; }
.jp-maker-actions { display: flex; gap: 8px; margin: 13px 0; }
.jp-followbtn { flex: 1; display: inline-flex; align-items: center; justify-content: center; min-height: 38px; border-radius: 7px; background: var(--accent); color: #fff; font-family: var(--font-display); font-size: 11.5px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
.jp-followbtn:hover { filter: brightness(1.08); }
.jp-followbtn-wide { width: 100%; }
.jp-msgbtn { display: inline-flex; align-items: center; justify-content: center; width: 38px; min-height: 38px; border-radius: 7px; border: 1px solid var(--mc-goldline); color: var(--mc-gold); flex-shrink: 0; }
.jp-msgbtn:hover { border-color: var(--mc-gold); }
.jp-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.jp-stat { background: var(--mc-card2); border-radius: 10px; padding: 9px 6px; text-align: center; }
.jp-stat-num { display: flex; align-items: center; justify-content: center; gap: 4px; font-family: var(--font-serif); font-size: 16px; color: var(--mc-text); }
.jp-stat-star { color: var(--mc-gold); display: inline-flex; }
.jp-stat-label { display: block; font-size: 10px; color: var(--mc-muted); font-family: var(--font-display); letter-spacing: 0.05em; text-transform: uppercase; margin-top: 2px; }

/* founding */
.jp-founding { display: flex; align-items: center; gap: 12px; border: 1px solid var(--mc-goldline); }
.jp-founding-ico { display: inline-flex; align-items: center; justify-content: center; width: 38px; height: 38px; border-radius: 50%; border: 1.3px solid var(--mc-gold); color: var(--mc-gold); flex-shrink: 0; }
.jp-founding-title { font-family: var(--font-display); font-size: 11.5px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--mc-gold); }

/* live */
.jp-live { display: block; border-radius: 12px; overflow: hidden; }
.jp-live img { width: 100%; aspect-ratio: 224 / 122; object-fit: cover; }
.jp-live:hover { filter: brightness(1.08); }
.jp-live-title { font-size: 14px; font-weight: 600; margin-top: 9px; }
.jp-live-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 9px; }
.jp-live-watching { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--red); }
.jp-goldbtn { display: inline-flex; align-items: center; justify-content: center; min-height: 34px; padding: 6px 16px; border-radius: 7px; background: var(--mc-gold); color: #14110c; font-family: var(--font-display); font-size: 10.5px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
.jp-goldbtn:hover { filter: brightness(1.08); }

/* people also loved */
.jp-pal { display: flex; flex-direction: column; gap: 10px; }
.jp-pal-row { display: flex; align-items: center; gap: 10px; }
.jp-pal-row:hover { filter: brightness(1.15); }
.jp-pal-row img { width: 48px; height: 48px; border-radius: 9px; object-fit: cover; flex-shrink: 0; }
.jp-pal-text { display: flex; flex-direction: column; gap: 2px; }
.jp-pal-title { font-size: 12px; color: var(--mc-text); line-height: 1.4; }

/* buyer love */
.jp-quote-ico { color: var(--mc-gold); margin-bottom: 4px; }
.jp-quote { font-size: 13px; color: var(--mc-text); line-height: 1.7; font-style: italic; }
.jp-quote-by { font-size: 11.5px; color: var(--mc-muted); margin-top: 9px; }
.jp-dots { display: flex; gap: 6px; margin-top: 11px; }
.jp-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--mc-goldline); opacity: 0.4; }
.jp-dot-on { background: var(--mc-gold); opacity: 1; }

/* collections */
.jp-colls { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.jp-coll { border-radius: 10px; overflow: hidden; }
.jp-coll:hover { filter: brightness(1.1); }
.jp-coll img { width: 100%; aspect-ratio: 110 / 98; object-fit: cover; }

/* never miss a story */
.jp-email { display: flex; align-items: center; background: var(--mc-card2); border-radius: 8px; padding: 11px 14px; margin: 11px 0 10px; font-size: 12.5px; color: var(--mc-muted); }
.jp-email:hover { filter: brightness(1.15); }
.jp-nms-actions { display: flex; gap: 8px; }

/* trust strip */
.jp-trust { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; border-top: 1px solid var(--mc-card2); padding-top: 24px; margin-top: 28px; }
@media (max-width: 980px) { .jp-trust { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 540px) { .jp-trust { grid-template-columns: 1fr; } }
.jp-trust-item { display: flex; align-items: flex-start; gap: 11px; }
.jp-trust-ico { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; border: 1.3px solid var(--mc-gold); color: var(--mc-gold); flex-shrink: 0; }
.jp-trust-title { font-family: var(--font-display); font-size: 12.5px; font-weight: 700; letter-spacing: 0.06em; color: var(--mc-text); }
.jp-trust-sub { font-size: 12px; color: var(--mc-muted); }
`
