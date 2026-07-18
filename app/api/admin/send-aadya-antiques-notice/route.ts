import { NextRequest, NextResponse } from 'next/server'
import { isAuthorizedAdmin } from '@/lib/adminAuth'
import { sendEmail } from '@/lib/email'

// One-off admin endpoint: sends Aadya Bazaar (US-based founding seller,
// approved 2026-07-18) the specific list of their external catalogue items
// that are currently blocked from listing on Velor under the antiques /
// cultural-heritage hard-reject policy (see lib/prohibitedListingContent.ts
// and /legal/seller-rules section 3). Requested by William so the seller
// gets the concrete list instead of a generic policy notice, and so Velor
// doesn't lose the relationship over items that just need rewording.
//
// Full audit of aadyabazaar.com/collections/all (13 pages, 414 listings):
// 68 flagged, 346 clean and listable today with no changes needed.
export async function POST(req: NextRequest) {
  const authorized = await isAuthorizedAdmin(req)
  if (!authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const FLAGGED: Array<{ title: string; reason: string }> = [
    { title: 'Fabulous Vintage Fulani Multi-Strand Necklace Nigeria, Africa', reason: 'vintage' },
    { title: '5 Old Mayan Crystal Necklaces from Guatemala. 2836', reason: 'old + Mayan' },
    { title: 'Vintage Hmong Embroidered Handbag. 4326', reason: 'vintage' },
    { title: 'Vintage Oxchuc Mexican Huipil. Vibrant Mayan Textile.', reason: 'vintage' },
    { title: 'Vintage Mexican Arracadas. Sterling Silver & Moonstone! Oaxaca. Mexico. Frida Kahlo. 4401', reason: 'vintage' },
    { title: 'Vintage Embroidered and Hand-Quilted Quilt from Gujarat, India. Textile Art.', reason: 'vintage' },
    { title: 'Vintage Mexican Arracadas. Sterling Silver & Pearl. Oaxaca. Mexico. Frida Kahlo', reason: 'vintage' },
    { title: 'Ancient Jade & Stone Pendants. Zapotec Beads from Oaxaca, Mexico. 2837', reason: 'ancient' },
    { title: 'Vintage Guatemalan Wrap. Colotenango. Fine Example. 0012', reason: 'vintage' },
    { title: 'Old African Trade Dogon Annular Beaded Necklace. 2843', reason: 'old + African trade' },
    { title: 'Vintage Oaxacan Filigree Earrings. Pearl & Silver. Mexico. Frida Kahlo. 2809', reason: 'vintage' },
    { title: 'Antique Oaxacan Filigree Earrings. Turquoise. Sterling Silver. Mexico. Frida Kahlo. 2830', reason: 'antique' },
    { title: 'Vintage Filigree Earrings. Arracadas. Mexico. Frida Kahlo. AP-462', reason: 'vintage' },
    { title: 'Vintage Totonicapan Huipil. Hand-Woven & Embroidered. Ikat.', reason: 'vintage' },
    { title: "Pair Vintage Banjara Bracelets. Beaded Tassel Accessories and Decor! 4274", reason: 'vintage' },
    { title: 'Vintage Zinacantan Men\'s Poncho Tassels. Mayan. Chiapas Mexico. Hand-Woven & Embroidered. Rare', reason: 'vintage' },
    { title: 'Vintage Banni Embroidered Drawstring Skirt. 0561', reason: 'vintage' },
    { title: 'Vintage Banjara Embroidered Drawstring Skirt.', reason: 'vintage' },
    { title: 'Fine Vintage Patchwork Quilt from Gujarat, India. Textile Art. 4233', reason: 'vintage' },
    { title: 'Pair Vintage Kuch Brass Bangles. 0899', reason: 'vintage' },
    { title: 'Vintage Uzbek Earrings with Antique Coral. Handmade Sterling Silver. 0465', reason: 'vintage & antique' },
    { title: 'Vintage Fang Mask. Cameroon, Africa. African Mask. 4362', reason: 'vintage' },
    { title: 'Vintage Uzbek Earrings. Jhumkas with Turquoise and Coral Earrings. Handmade Sterling Silver. 2564', reason: 'vintage' },
    { title: 'Dogon Granary Door. Mali. Antique African Wooden Sculpture. 4245', reason: 'antique' },
    { title: 'Antique Coral and Sterling Ring from Rajasthan, India. Size 8.5 1066', reason: 'antique' },
    { title: 'Vintage Rabari Long Embroidered Skirt. Hand Embroidered. 4311', reason: 'vintage' },
    { title: 'Antique Tuareg Tizabaten Silver Hoop Earring Earweight Tribal Tsabit. 0804', reason: 'antique' },
    { title: 'Vintage Uzbek Coral Earrings. Sterling Silver. 2352. Bukhari.', reason: 'vintage' },
    { title: 'Antique Turquoise and Sterling Ring. India. size 8. 1371', reason: 'antique' },
    { title: 'Vintage Uzbek Bukhara Earrings. Silver & Pearl. Long Dangles. 0495', reason: 'vintage' },
    { title: 'Vintage Churrancho Hand-Woven Guatemala Huipil. 4317', reason: 'vintage' },
    { title: 'Vintage Kantha Wrap Jacket. Kimono Style. All Cotton Hand Quilted. 4366', reason: 'vintage' },
    { title: 'Vintage Uzbek Filigree Earrings. Vermeil. Bukhari. 0546', reason: 'vintage' },
    { title: 'Vintage Uzbek Filigree Earrings. Vermeil. Bukhari. Pearls & Semi-Precious Stones. 0224', reason: 'vintage' },
    { title: 'Vintage Sari Sundress. All Cotton and One Size.', reason: 'vintage' },
    { title: 'Vintage Uzbek Hoop Earrings. Bukhari Sterling Silver Earrings. 2637', reason: 'vintage' },
    { title: 'Antique Nagaland Necklace. Collectible Multistrand Jewelry. India', reason: 'antique' },
    { title: 'Vintage Sari Sundress. One Size.', reason: 'vintage' },
    { title: 'Old African Trade Dogon Annular Beaded Necklace.', reason: 'old + African trade' },
    { title: 'Old Amulet Necklace. Toothpick! Antique. India. Sterling Silver. 1028', reason: 'antique' },
    { title: 'Ancient Roman Glass Necklace with Antique Silver. Handmade Designer Jewelry. 2572', reason: 'ancient & antique' },
    { title: 'Dogon Granary Door. Mali. Antique African Wooden Sculpture. 4224', reason: 'antique' },
    { title: 'Vintage Kantha Coat. Fantastic Textile Art Treasure. One Size. 4212', reason: 'vintage' },
    { title: 'Vintage Ecuadorian Gold Earrings With Crystal. 18kt. 0393', reason: 'vintage' },
    { title: 'Long Vintage Yellow Calcite Necklace. Beautiful Melon Shaped Beads. Handmade Beads.', reason: 'vintage' },
    { title: 'Antique Tibetan Turquoise Cuff Bracelet. Dragons and Filigree. Beautiful Piece!', reason: 'antique' },
    { title: 'Vintage Uzbek Bukhara Silver Earrings. Rare Sterling Silver Earrings from Central Asia. 0689', reason: 'vintage' },
    { title: 'Vintage Uzbek Hoop Earrings. Bukhara Silver and Coral Earrings. 2626', reason: 'vintage' },
    { title: 'Vintage Moroccan Throw Pillow. Wedding Blanket. Handira. Wool and Cotton.', reason: 'vintage' },
    { title: 'Vintage Kantha Coat.', reason: 'vintage' },
    { title: 'Vintage Oaxacan Coral and Amber Necklace. Mexico. Sterling Silver. 2638', reason: 'vintage' },
    { title: 'Vintage Indian Bangle. 2573', reason: 'vintage' },
    { title: 'Antique Hindu Goddess Feet Amulet Necklace. Adjustable Length. 1051', reason: 'antique' },
    { title: 'Vintage Uzbek Bukhara Silver Earrings. 1153. Rare!', reason: 'vintage' },
    { title: 'Antique Hindu Goddess Feet Amulet Necklace. Handpainted. 1027', reason: 'antique' },
    { title: 'Vintage Peacock Turquoise Pendant Necklace. Heavy Sterling Silver Chain. India. 2225', reason: 'vintage' },
    { title: 'Carnelian Necklace with Ancient Beads. Multi Strand. 1387', reason: 'ancient' },
    { title: 'Vintage Oaxacan Filigree & Coral Earrings. Sterling Silver. Mexico. Frida Kahlo', reason: 'vintage' },
    { title: 'Old Amulets Necklace. Antique. India. Sterling Silver. 1031.', reason: 'antique' },
    { title: 'Vintage Ecuadorian Gold Earrings With Pearls. 18kt. 0395', reason: 'vintage' },
    { title: 'Multi-Strand Necklace. Glass, Serpentine and Ancient Metal Beads.', reason: 'ancient' },
    { title: 'Vintage Uzbek Bukhara Silver Jumkha Earrings Silver.', reason: 'vintage' },
    { title: 'Vintage Uzbek Hoop Earrings. Bukhari Silver and Pearl Earrings. 0323', reason: 'vintage' },
    { title: 'Antique Nagaland Multi-strand Necklace Collectible. Naga. 4341', reason: 'antique' },
  ]

  const itemsHtml = FLAGGED.map(
    (f) =>
      `<li style="margin-bottom:6px;"><strong>${f.title}</strong> <span style="color:#888;">(flagged for: ${f.reason})</span></li>`
  ).join('\n')

  const html = `
<p>Hi Bronwen,</p>

<p>Welcome again to Velor -- we're genuinely glad to have Aadya Bazaar as one of our founding sellers, and we don't want this email to feel like a setback. It's just some quick housekeeping so your listings go live smoothly.</p>

<p>Velor's Seller Rules currently draw a hard line on genuine antiques and items presented as historically or culturally "old": we only allow newly made cultural and artisan goods, because export of genuine antiquities is commonly restricted by national heritage law regardless of how an item was acquired. You can read the full policy here: <a href="https://velorcommerce.store/legal/seller-rules">velorcommerce.store/legal/seller-rules</a> (see section 3, "Prohibited Items").</p>

<p>We went through your full catalogue at aadyabazaar.com (414 listings) and found <strong>${FLAGGED.length} items</strong> whose titles use wording like "vintage," "antique," or "ancient" that would currently get auto-flagged if listed as-is. The other <strong>346 items are completely clean</strong> and can be listed on Velor today with no changes at all -- so there's a lot you can get started with right away while you work through the list below.</p>

<p>For the ${FLAGGED.length} flagged items: if the piece is newly made in a traditional or vintage-inspired style, the simplest fix is usually just rewording the title/description to describe the craft technique or design tradition rather than calling the item itself "vintage," "antique," or "old" -- e.g. "Fulani-Style Multi-Strand Necklace" instead of "Vintage Fulani Multi-Strand Necklace." If an item is a genuine antique, it isn't eligible for listing on Velor at this time (this is a policy we're deliberately keeping simple for now while we're in our early growth phase -- see below).</p>

<p style="margin-bottom:4px;">The flagged items:</p>
<ol style="padding-left:20px;">
${itemsHtml}
</ol>

<p>One more thing worth knowing: this antiques policy is intentionally strict right now because we don't yet have a system for verifying genuine antique provenance and export documentation. It's something we're actively planning to build out properly in the future so genuine antique dealers can eventually sell on Velor too -- it's just not ready yet, so for now the newly-made-goods rule applies across the board to every seller, not just Aadya Bazaar.</p>

<p>No rush on any of this -- list what's ready whenever suits you, and reword or hold back the rest at your own pace. If anything here is unclear or you think an item's been flagged in error, just reply to this email and we'll sort it out.</p>

<p>Thanks for being one of our founding sellers,<br/>The Velor Seller Team</p>
`.trim()

  await sendEmail({
    to: 'aadyabazaar@gmail.com',
    from: 'Velor Seller Team <sellers@velorcommerce.store>',
    subject: `Aadya Bazaar on Velor: ${FLAGGED.length} listings need a quick reword before they can go live`,
    html,
  })

  return NextResponse.json({ ok: true, flaggedCount: FLAGGED.length, sentTo: 'aadyabazaar@gmail.com' })
}
