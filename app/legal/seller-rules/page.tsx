// description shortened by the standing SEO agent, 2026-07-14 -- the prior
// 201-char version exceeded Google's ~155-160 char SERP display limit and
// was truncating mid-sentence in search results. Same facts, no new claim.
export const metadata = {
  title: 'Seller Rules and Product Compliance Policy — Velor Marketplace',
  description:
    'Who can sell on Velor: listing standards, prohibited items, certificate-required materials, customs/HS codes, product safety, and how listing review works.',
  alternates: { canonical: 'https://velorcommerce.store/legal/seller-rules' },
  openGraph: {
    title: 'Seller Rules and Product Compliance Policy — Velor Marketplace',
    description:
      'Who can sell on Velor: listing standards, prohibited items, certificate-required materials, customs/HS codes, product safety, and how listing review works.',
    url: 'https://velorcommerce.store/legal/seller-rules',
    siteName: 'Velor',
    // locale added by the standing SEO agent, 2026-07-13 -- see app/layout.tsx
    // for the full rationale ('en_GB', verified against lib/currency.ts's
    // real GBP default, not invented).
    locale: 'en_GB',
    type: 'website',
    // images added by the standing SEO agent, 2026-07-13 -- see app/layout.tsx
    // for the full rationale (vercel/next.js#50353: an explicit openGraph
    // object replaces the whole object, dropping the root file-convention
    // image unless listed here).
    images: [{ url: 'https://velorcommerce.store/opengraph-image', width: 1200, height: 630, alt: 'Velor - Global Marketplace' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Seller Rules and Product Compliance Policy — Velor Marketplace',
    description:
      'Who can sell on Velor: listing standards, prohibited items, certificate-required materials, customs/HS codes, product safety, and how listing review works.',
    images: ['https://velorcommerce.store/opengraph-image'],
  },
}

export default function SellerRulesPage() {
  const sections = [
    {
      title: "1. Who Can Sell on Velor",
      body: "Velor is open to businesses, independent makers, artisans, family workshops and cooperatives worldwide. During onboarding you must provide accurate identity and business details: your legal name or business name, address, contact details and, where applicable, your trade or company registration number. You must tell us whether you are selling as a business (a trader) or as a private individual -- this is shown to buyers because it affects their legal rights. Providing false or outdated information is grounds for suspension. We verify this information and may request supporting documents at any time.",
    },
    {
      title: "2. Listing Standards",
      body: "Every listing must include: at least 3 genuine photographs of the actual product (not stock images of a different item), an accurate title, a truthful description of at least 100 words, the correct category, the materials the product is made from, the true country of origin, and an accurate weight and dimensions for shipping. If your product is handmade, you may add a maker story -- it must be true. Listings that misrepresent what the buyer will receive are removed and repeated misrepresentation leads to account suspension.",
    },
    {
      title: "3. Prohibited Items (never allowed)",
      body: "The following may never be listed under any circumstances: counterfeit, replica or stolen goods; weapons, ammunition and weapon parts; illegal drugs and drug paraphernalia; ivory and tortoiseshell in any form; genuine antiques, archaeological artifacts and items of cultural or religious heritage significance (newly made cultural and artisan goods crafted for sale are welcome -- genuine antiquities are not, because their export is commonly barred by national heritage laws regardless of how they were acquired); parts or feathers of protected bird species including eagle and migratory bird feathers; fresh, refrigerated, frozen or short-shelf-life food; recalled or known-unsafe products; and any item that infringes someone else's intellectual property. There is no certificate route for items in this section -- they are rejected outright.",
    },
    {
      title: "4. Certificate-Required Materials (allowed with valid permits)",
      body: "Some genuine craft materials are internationally regulated under CITES and related law, including exotic leathers and skins, many corals, certain feathers, and certain woods such as rosewood species. Velor accepts products containing regulated materials, but only through our certificate process: you must declare the material when listing, upload the required export permit (and import permit where required) for that specific product, and the listing stays in review -- not live -- until our team verifies the documents. Because an export permit from your country does not guarantee every destination will accept import, shipping destinations for these listings are enabled per country only once matching documentation is confirmed. Permits expire (export permits are typically valid 6 months), so listings are automatically re-checked and suspended if a permit lapses. Undeclared regulated materials are treated as a serious violation.",
    },
    {
      title: "5. Plant-Derived and Wooden Goods",
      body: "Raw or minimally processed plant materials -- untreated wood, bamboo, rattan, dried botanicals and similar -- may require a phytosanitary certificate from your country's plant protection authority before they can be exported. Finished, fully processed wooden goods are often exempt, but this depends on the destination country. Declare the material accurately when listing; we will flag your listing if certification is likely to be required for its destinations.",
    },
    {
      title: "6. Food Listings",
      body: "Only shelf-stable food with at least 6 months of remaining shelf life may be listed: dried spices, coffee, tea, dried fruit and nuts, sealed sauces and condiments, confectionery and preserved goods. No fresh, refrigerated, frozen, dairy or meat products -- Velor has no cold-chain shipping. All food listings receive additional review, and some destinations (notably Australia) heavily restrict food imports, so available shipping destinations may be limited for food products.",
    },
    {
      title: "7. Restricted Shipping Categories (dangerous goods)",
      body: "Some everyday craft products are classed as dangerous goods for air transport and face quantity and packaging limits: perfumes, essential oils and alcohol-based finishes (flammable liquids), aerosols, certain resins, adhesives, dyes and pigments, and any product containing lithium batteries. These can usually still be sold, but you must declare them accurately so the correct shipping rules apply. Mis-declaring a dangerous good is a safety issue and a legal offence in most countries, and results in immediate suspension.",
    },
    {
      title: "8. Customs, Declarations and HS Codes",
      body: "Every cross-border order ships with a customs declaration based on the information in your listing. You must provide an accurate product description and a correct 6-digit HS (Harmonised System) code for every product -- vague descriptions such as \"gift\" or \"craft item\" now cause shipments to be held or rejected by customs in major markets. You must never understate the value of a shipment or mark commercial orders as gifts. Buyers may be responsible for import duties depending on destination; what matters for you as a seller is that the declaration is truthful.",
    },
    {
      title: "9. Product Safety",
      body: "Your products must comply with the product safety law of the countries you sell to. Certain categories -- toys, electrical and electronic goods, radio equipment and similar -- require formal conformity marking (such as CE or UKCA) before they can be sold into the UK and EU. Most handmade goods outside those categories do not need formal certification, but they must still be safe, and products intended for children are always held to the stricter toy-safety standard. When selling into the EU you may be asked to confirm a responsible contact for product safety purposes. Velor cooperates with product safety authorities and removes listings subject to recalls or safety notices.",
    },
    {
      title: "10. Taxes",
      body: "Where the law requires it, Velor collects and remits sales taxes on your behalf at checkout -- this applies to UK VAT on qualifying overseas-seller orders, and to marketplace-collected taxes in other jurisdictions as they are enabled. Where marketplace collection does not apply, you remain responsible for your own tax obligations. In all cases you are responsible for your own income tax and for any registrations your business independently requires. Velor does not provide tax advice.",
    },
    {
      title: "11. Authenticity and Cultural Respect",
      body: "Velor exists to connect buyers with genuine products and real makers. Do not label mass-produced goods as handmade. Do not claim a cultural tradition or origin that is not genuinely yours or your makers'. Do not use protected indigenous designs, sacred symbols or cultural trademarks without a legitimate connection to that tradition. Maker stories, origin claims and materials lists are treated as factual statements -- if they are false, the listing is removed.",
    },
    {
      title: "12. How Listing Review Works",
      body: "Every new listing is reviewed before going live. Standard listings are typically reviewed within hours. Listings flagged for certificates, food, dangerous goods or safety-marked categories go to an enhanced review queue and stay pending until documentation is verified. You will be notified by email at each stage. Approved listings can still be re-reviewed at any time, and we may request documents for a live listing -- failure to provide them within 14 days results in delisting.",
    },
    {
      title: "13. Enforcement",
      body: "Violations are handled in proportion to their severity: listing corrections and warnings for minor issues, delisting for misrepresentation, and immediate account suspension for prohibited items, undeclared regulated materials, mis-declared dangerous goods, counterfeits or fraud. Funds from affected orders may be withheld while a violation is investigated. Where the law requires it, Velor reports serious violations to the relevant authorities. Decisions can be appealed by contacting sellers@velorcommerce.store.",
    },
  ];

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
      <section style={{ maxWidth: 760, margin: '0 auto', padding: '80px 24px' }}>
        <h1 style={{ fontSize: 40, fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: 8 }}>Seller Rules and Product Compliance</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 48 }}>Last updated: 7 July 2026</p>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px 24px', marginBottom: 40 }}>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--muted)' }}>
            Velor is a global marketplace: your products can reach buyers in almost every country, which means your listings must meet the trade, customs and safety rules that apply to selling across borders. These rules exist to keep your shipments moving, your buyers protected and your account in good standing. They form part of the Seller Agreement -- by listing a product on Velor you agree to follow them.
          </p>
        </div>
        {sections.map(s => (
          <div key={s.title} style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{s.title}</h2>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--muted)' }}>{s.body}</p>
          </div>
        ))}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px 24px', marginTop: 8 }}>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--muted)' }}>
            Questions about whether your product can be listed, or what documentation it needs? Contact sellers@velorcommerce.store before listing -- we would much rather help you get it right than reject a listing.
          </p>
        </div>
      </section>
    </main>
  );
}
