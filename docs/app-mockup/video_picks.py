# Country-dive video sourcing — "SHOPPING <country>" strip (2026-07-14)
# Method: 380 Pexels video-search queries (2 per country, from HINTS top crafts),
# top-10 candidates parsed per query (portrait mp4 + poster slug), slug-relevance
# pre-filter (154/380 keys had >=1 slug-matched candidate; 226 auto-rejected to
# zero-state), then EVERY surviving candidate visually verified on a labelled
# poster contact sheet before acceptance. 38 videos accepted across 37 countries
# (Nepal has 2). Everything else renders the honest per-country zero-state tile.
#
# ACCEPTED (code, pexels video id, poster slug) — all eyeballed:
PICKS = [
 ('AR','18239930','argentina-argentina-flag-brown-horse-gaucho'),   # gaucho riding w/ Argentine flag
 ('BA','31296019','bosnian-coffee-coffee-cups-old-constructions'),  # Bosnian copper coffee set poured
 ('BE','15463088','assorted-chocolate-brown-chocholate-chocolate'), # praline box (was CH cand2; BE keeps pralines)
 ('BF','6033520','caliente-casting-jewellery'),                     # lost-wax crucible casting
 ('BH','6263752','accessory-arts-and-crafts-beautiful-bijouterie'), # jeweller at bench
 ('BO','27048858','amazon-bolivia-bolivian-pachamama'),             # Bolivia pachamama festival, aguayo textiles
 ('CD','31264406','breafast-coffee-coffee-making-coffee-making'),   # coffee brew closeup
 ('CH','7012966','chocolate-dessert-melted-sweet-food'),            # melted chocolate (conflict w/ BE resolved: CH keeps melt)
 ('CM','36259344','coffee'),                                        # roasted beans closeup (also matched RW; CM first)
 ('CO','34807092','cafe'),                                          # coffee drying beds (cand2; cand0/1 were scenery/berries)
 ('CR','35156726','cafe-atmosphere-costa-rica-roadster-roasted-coffee'), # roasting drum, costa-rica slug
 ('DZ','20497427','4k-background-ajwa-dates-barhi-dates-calories'), # dates (also matched KW/LY; DZ first)
 ('EG','8872547','4k-video-air-bubbles-glass-mug-pink-color'),      # hand-blown bubble glass
 ('ER','26442763','coffee-picnic'),                                 # jebena clay pot on open fire
 ('ES','37223242','art-of-cooking-oil-olive-spain'),                # olive oil pour, spain slug (was TN candidate)
 ('ET','11280923','coffee-coffee-cup-coffee-dripper-coffee-grinder'),
 ('GB','37361951','custom-tailoring'),                              # tailoring bench
 ('GR','7281326','breakfast-food-honey-honeybee'),                  # honey dipper (also matched YE sidr; GR keeps)
 ('GT','31776902','antigua-guatemala-colores-cultura-guatemala'),   # backstrap loom, Antigua Guatemala
 ('HU','5658518','autumn-garden-paprika-woman'),                    # paprika on the plant
 ('ID','28728929','batik-batik-indonesia'),                         # batik making, indonesia slug (also hit GM/MY/KN queries)
 ('IL','16979063','dead-sea-israel-lowest-point-salt'),             # Dead Sea salt, israel slug (was JO candidate)
 ('IN','19687206','block-painting-jaipur-print-sanganeri-print'),   # Sanganeri block print (also hit MW/SN; IN keeps)
 ('IR','37187990','artfulhands-carpet-craftsman-decorative-carpet'),# carpet craftsman (also hit TM; IR first)
 ('JP','30772235','tea-ceremony-in-japan'),
 ('KE','34776281','kenya-masai-mara'),                              # Maasai w/ beadwork, kenya slug
 ('LI','6657744','hobby-stamp-stamp-collecting-stamps'),            # stamp collecting (SM near-dup rejected)
 ('MA','34745806','fes-fez-leather-morocco'),                       # Fes tannery pits
 ('MX','19016092','catrina-la-calavera-catrina-mexico-catrina-mexicocatrina'), # La Catrina procession (retitled honestly)
 ('NG','33835028','african-african-tradition-nigeria-culture-nigerian'), # traditional dress worn, nigeria slug
 ('NP','11649276','healing-meditation-singing-bowls-spirituality'), # singing bowl in palm
 ('NP','37578188','buddha-jayanti-buddha-jayanti-celebaration-kathmanu-nepal'), # Kathmandu festival
 ('PA','26179980','arts-crafts-custom-danza-panama-city'),          # pollera dance (was EC "panama hats" hit; belongs to PA)
 ('PE','20720930','fist-peru-taquile-island'),                      # Taquile island, peru slug
 ('TR','28490661','turkey-turkish-coffee'),                         # cezve pour (TR also keeps original sand-coffee clip)
 ('TZ','28866785','africa-appleshot-masai-tanzania'),               # Maasai, tanzania slug (distinct from KE clip)
 ('UY','34329182','the-ritual-of-mate-a-warm-tradition-from-uruguay'), # mate ritual, uruguay slug
 ('YE','16760711','arabian-coffee-arabica-black-coffee-brewed-coffee'), # arabian coffee beans
]

# Kept from the original 3-clip global strip (already verified in an earlier session):
# CN 9363591 tea-set throwing (poster photo 14705063), MA 14618073 spice souk
# (poster photo 37484909), TR 7681482 coffee on sand (poster photo 31330206).

# NOTABLE REJECTS (why):
# - Wrong country in slug: GH kente -> Baduy INDONESIA; GM/MY/KN batik -> Indonesia;
#   GW/IL/SB/SR/VU carving -> Bungamati NEPAL; LB glass -> Eskisehir TURKEY;
#   LC pottery -> Indian diya lamps; JM jerk -> "asian herbs"; SE dala horses ->
#   REAL horses in Cappadocia; MH-style mismatch of the wave: MN "felt" -> pigeons.
# - Same clip claimed by 2+ countries: chocolate 7012966 (BE/CH -> CH),
#   dates 20497427 (DZ/KW/LY -> DZ), beans 36259344 (CM/RW -> CM),
#   honey 7281326 (GR/YE sidr -> GR), print 19687206 (IN/MW/SN -> IN),
#   carpets 37187990 (IR/TM -> IR), stamps 6657744/6657748 (LI/SM -> LI),
#   embroidery 36302090 (UA/UZ -> neither, zero country signal).
# - Scenery/landmarks instead of craft: AE Dubai skyline, AZ flag, BA Mostar bridge,
#   CL plaza, CZ Prague, DO beach, GE church, IQ drone, IS beach, IT Murano canal,
#   KZ mountains, MZ Maputo aerial, NO waterfall, NZ lake, OM fort, PT Lisbon street,
#   SG Merlion, ZM Victoria Falls, and similar.
# - Generic/unverifiable craft closeups: AT drinking glass, BY/MG/NA/SL/TO/WS
#   "handmade-hobby-weaving" family, KR beauty face, LB modern cosmetics,
#   NL cheese board + generic potter, SV pink tile painting, TV crochet, TW tea pour.
# - Animals instead of craft: BO/PE alpacas, AU possum-like native animal, CF elephant.
#
# Countries with NO accepted video render the honest zero-state tile
# ("No films from <country> yet") via liveStripFor() in the mockup.
