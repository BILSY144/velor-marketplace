// The closed speciality vocabulary — single source of truth.
// Signed off by William 2026-07-08 as velor-speciality-vocabulary-v2.md:
// 59 terms across six families. Sellers pick a country plus UP TO TWO
// specialities at listing time. The list is closed: sellers cannot invent a
// term, only request one (requests surface in the daily briefing as market
// signals). Country speciality lists are COMPUTED from live listings via
// /api/lattice — never typed in — so no country page can advertise a
// speciality no seller offers.
//
// Language rule (standing): the first seller "opens" a country or speciality
// and is "credited as the seller who opened it" — never "claims", "owns",
// or "is yours".

export type SpecialityKind =
  | 'Materials'
  | 'Techniques'
  | 'Consumables'
  | 'Forms'
  | 'Rituals'
  | 'Modern industry'

export interface Speciality {
  term: string
  kind: SpecialityKind
  // One-line standfirst used on masthead and lattice pages.
  line: string
  // ISO-2 codes of countries strongly associated with the term. Editorial
  // guidance for recruitment and "known for" hints only — NEVER rendered as
  // if sellers exist there. Live state always comes from /api/lattice.
  associated: string[]
}

export const SPECIALITY_MAX_PER_LISTING = 2

export const SPECIALITIES: Speciality[] = [
  // ---- Materials (15) ----
  { term: 'Clay', kind: 'Materials', line: 'Thrown, fired, glazed. The oldest technology still on the table.', associated: ['CN', 'JP', 'PT', 'MA', 'MX'] },
  { term: 'Silk', kind: 'Materials', line: 'The thread empires were built to move.', associated: ['CN', 'IN', 'TH', 'UZ'] },
  { term: 'Iron', kind: 'Materials', line: 'Cast heavy, kept forever.', associated: ['CN', 'JP', 'IN'] },
  { term: 'Steel', kind: 'Materials', line: 'Forged the way swords were.', associated: ['JP', 'DE', 'SE', 'IN'] },
  { term: 'Copper', kind: 'Materials', line: 'The same metal, hammered a different way in every place that works it.', associated: ['TR', 'MA', 'NP', 'MX', 'CL'] },
  { term: 'Brass', kind: 'Materials', line: 'Polished for centuries and still not finished.', associated: ['IN', 'TR', 'EG'] },
  { term: 'Silver', kind: 'Materials', line: 'Mined, cast and chased where it comes out of the ground.', associated: ['PE', 'MX', 'TH', 'MA'] },
  { term: 'Leather', kind: 'Materials', line: 'Tanned the slow way.', associated: ['MA', 'IT', 'ES', 'AR'] },
  { term: 'Wool', kind: 'Materials', line: 'Sheared, spun and woven within sight of the flock.', associated: ['PE', 'IE', 'TR', 'NP', 'GB'] },
  { term: 'Alpaca', kind: 'Materials', line: 'Softer than wool, older than the border it crosses.', associated: ['PE', 'BO'] },
  { term: 'Glass', kind: 'Materials', line: 'Sand, fire and breath.', associated: ['IT', 'CZ', 'EG', 'TR'] },
  { term: 'Marble', kind: 'Materials', line: 'Cut from the same mountains the ancients quarried.', associated: ['IT', 'GR', 'TR'] },
  { term: 'Amber', kind: 'Materials', line: 'Forty million years old, washed up on a Baltic beach.', associated: ['PL', 'LT', 'LV'] },
  { term: 'Cork', kind: 'Materials', line: 'Stripped by hand, and the tree grows it back.', associated: ['PT'] },
  { term: 'Paper', kind: 'Materials', line: 'Treated as a craft, not a surface.', associated: ['JP', 'IT', 'NP'] },
  // ---- Techniques (11) ----
  { term: 'Hand-forging', kind: 'Techniques', line: 'Heat, hammer, repeat.', associated: ['JP', 'DE', 'IN'] },
  { term: 'Lacquerware', kind: 'Techniques', line: 'Thirty coats deep before it shines.', associated: ['JP', 'CN', 'VN', 'MM'] },
  { term: 'Block printing', kind: 'Techniques', line: 'One carved block, one colour, one press at a time.', associated: ['IN', 'ID'] },
  { term: 'Indigo dyeing', kind: 'Techniques', line: 'The blue that has to be grown.', associated: ['JP', 'IN', 'NG', 'GT'] },
  { term: 'Kilim weaving', kind: 'Techniques', line: 'Flat-woven, and every motif means something.', associated: ['TR', 'IR', 'AF'] },
  { term: 'Embroidery', kind: 'Techniques', line: 'Hours you can count in stitches.', associated: ['IN', 'MX', 'HU', 'PS'] },
  { term: 'Filigree', kind: 'Techniques', line: 'Wire drawn finer than thread, twisted into lace.', associated: ['PT', 'PE', 'ID', 'YE'] },
  { term: 'Marquetry', kind: 'Techniques', line: 'Pictures made of wood, one sliver at a time.', associated: ['SY', 'EG', 'FR'] },
  { term: 'Zellige', kind: 'Techniques', line: 'Hand-cut tiles that never quite repeat.', associated: ['MA'] },
  { term: 'Joinery', kind: 'Techniques', line: 'No nails, no glue, no gap.', associated: ['JP', 'DK', 'DE'] },
  { term: 'Glassblowing', kind: 'Techniques', line: 'Shaped in the seconds before it sets.', associated: ['IT', 'CZ', 'SE'] },
  // ---- Consumables (12) ----
  { term: 'Tea', kind: 'Consumables', line: 'Picked at altitude, judged by the leaf.', associated: ['CN', 'JP', 'IN', 'LK', 'KE', 'TW'] },
  { term: 'Coffee', kind: 'Consumables', line: 'From the places that grew it first.', associated: ['ET', 'CO', 'TR', 'BR', 'YE'] },
  { term: 'Spice', kind: 'Consumables', line: 'The souk, by the kilo.', associated: ['IN', 'ID', 'MA', 'LK'] },
  { term: 'Chilli', kind: 'Consumables', line: 'Heat with a passport.', associated: ['MX', 'KR', 'TH', 'HU'] },
  { term: 'Salt', kind: 'Consumables', line: 'Raked, mined or dried — never just poured.', associated: ['FR', 'KR', 'BO', 'PK'] },
  { term: 'Honey', kind: 'Consumables', line: 'You can taste the hillside.', associated: ['NZ', 'GR', 'TR', 'YE'] },
  { term: 'Olive oil', kind: 'Consumables', line: 'Pressed within hours of the branch.', associated: ['GR', 'IT', 'ES', 'TN', 'PS'] },
  { term: 'Cacao', kind: 'Consumables', line: 'Chocolate, from where chocolate is from.', associated: ['EC', 'GH', 'PE', 'VE'] },
  { term: 'Argan', kind: 'Consumables', line: 'One tree, one region, one oil.', associated: ['MA'] },
  { term: 'Rice', kind: 'Consumables', line: 'A grain with a hometown.', associated: ['JP', 'TH', 'IT', 'IN'] },
  { term: 'Fermentation', kind: 'Consumables', line: 'Time, doing the cooking.', associated: ['KR', 'JP', 'GE'] },
  { term: 'Preserves', kind: 'Consumables', line: 'A season, kept.', associated: ['FR', 'TR', 'IR'] },
  // ---- Forms (7) ----
  { term: 'Knives', kind: 'Forms', line: 'Cities that have made blades for four hundred years.', associated: ['JP', 'DE', 'FI'] },
  { term: 'Rugs', kind: 'Forms', line: 'Knotted by hand, priced by the year.', associated: ['TR', 'IR', 'MA', 'AF'] },
  { term: 'Cookware', kind: 'Forms', line: 'Pans with a birthplace.', associated: ['FR', 'JP', 'MX', 'KR'] },
  { term: 'Lanterns', kind: 'Forms', line: 'Light, worked in metal and glass.', associated: ['MA', 'JP', 'EG'] },
  { term: 'Instruments', kind: 'Forms', line: 'Built where the music comes from.', associated: ['IE', 'IN', 'ES', 'BR', 'ML'] },
  { term: 'Stationery', kind: 'Forms', line: 'Notebooks that outlive the pen.', associated: ['JP', 'IT', 'DE'] },
  { term: 'Furniture', kind: 'Forms', line: 'Made to be repaired, not replaced.', associated: ['DK', 'JP', 'ID'] },
  // ---- Rituals (6) ----
  { term: 'Tea ceremony', kind: 'Rituals', line: 'The slowest way to drink tea, on purpose.', associated: ['JP', 'CN', 'MA'] },
  { term: 'The coffee table', kind: 'Rituals', line: 'Where the talking happens.', associated: ['TR', 'ET', 'IT'] },
  { term: 'Incense', kind: 'Rituals', line: 'Scent with a liturgy.', associated: ['IN', 'JP', 'OM'] },
  { term: 'The bath house', kind: 'Rituals', line: 'Steam, stone and an hour that belongs to you.', associated: ['TR', 'JP', 'KR', 'MA'] },
  { term: 'The wedding', kind: 'Rituals', line: 'What a culture wears on its biggest day.', associated: ['IN', 'NG', 'MX', 'GR'] },
  { term: 'The new year', kind: 'Rituals', line: 'Every country starts again differently.', associated: ['CN', 'IR', 'VN', 'GB'] },
  // ---- Modern industry (8) ----
  { term: 'Skincare', kind: 'Modern industry', line: 'Ten steps ahead, and it shows.', associated: ['KR', 'JP', 'FR'] },
  { term: 'Optics', kind: 'Modern industry', line: 'Ground to tolerances you cannot see.', associated: ['JP', 'DE'] },
  { term: 'Watchmaking', kind: 'Modern industry', line: 'A century of accuracy on your wrist.', associated: ['CH', 'DE', 'JP'] },
  { term: 'Engineering', kind: 'Modern industry', line: 'Over-built, on principle.', associated: ['DE', 'JP', 'CH'] },
  { term: 'Electronics', kind: 'Modern industry', line: 'Where the future gets manufactured.', associated: ['JP', 'TW', 'KR'] },
  { term: 'Tailoring', kind: 'Modern industry', line: 'Cut for one person only.', associated: ['IT', 'GB', 'IN'] },
  { term: 'Design furniture', kind: 'Modern industry', line: 'The chair museums argue about.', associated: ['DK', 'FI', 'IT'] },
  { term: 'Perfumery', kind: 'Modern industry', line: 'A place, bottled.', associated: ['FR', 'OM', 'IN'] },
]

export const SPECIALITY_KINDS: SpecialityKind[] = [
  'Materials',
  'Techniques',
  'Consumables',
  'Forms',
  'Rituals',
  'Modern industry',
]


// Buyer-facing display labels. The internal taxonomy keeps material terms
// (sellers tag "Clay"); buyers are shown the finished cultural product
// (William, 2026-07-08: "real culture is the selling point, not raw
// materials"). Terms without an entry display as themselves.
export const BUYER_LABELS: Record<string, string> = {
  'Clay': 'Ceramics & porcelain',
  'Silk': 'Silk goods',
  'Iron': 'Ironware',
  'Steel': 'Blades & steelware',
  'Copper': 'Copperware',
  'Brass': 'Brassware',
  'Silver': 'Silver jewellery',
  'Leather': 'Leather goods',
  'Wool': 'Wool & knitwear',
  'Alpaca': 'Alpaca knitwear',
  'Glass': 'Glassware',
  'Marble': 'Marble homeware',
  'Amber': 'Amber jewellery',
  'Cork': 'Cork goods',
  'Paper': 'Paper & stationery',
  'Tea': 'Teas & tea ware',
  'Coffee': 'Coffee & brewing',
  'Spice': 'Spices & blends',
  'Chilli': 'Chillies & heat',
  'Salt': 'Salts & seasoning',
  'Cacao': 'Chocolate & cacao',
  'Rice': 'Rice & grains',
}

export function buyerLabel(term: string): string {
  return BUYER_LABELS[term] ?? term
}

const byTerm = new Map(SPECIALITIES.map((s) => [s.term, s]))

export function getSpeciality(term: string): Speciality | undefined {
  return byTerm.get(term)
}

export function isValidSpeciality(term: string): boolean {
  return byTerm.has(term)
}

// Validates a listing's speciality selection: every term must exist in the
// closed vocabulary and the count must respect the cap. Enforce in the API,
// not just the UI.
export function validateSpecialitySelection(terms: string[]): { ok: boolean; error?: string } {
  if (terms.length > SPECIALITY_MAX_PER_LISTING) {
    return { ok: false, error: `Pick at most ${SPECIALITY_MAX_PER_LISTING} specialities.` }
  }
  const unknown = terms.filter((t) => !byTerm.has(t))
  if (unknown.length) {
    return { ok: false, error: `Not in the vocabulary: ${unknown.join(', ')}. Request a new term instead.` }
  }
  if (new Set(terms).size !== terms.length) {
    return { ok: false, error: 'Duplicate speciality.' }
  }
  return { ok: true }
}
