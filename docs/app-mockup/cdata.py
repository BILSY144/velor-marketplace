# Master culture dataset for Velor app — 190 countries.
# Each: story (origin line), tags (VAST list of what the country is renowned for,
# culturally + craft, marketplace-relevant). Image queries are derived from tags.
# Keep existing good stories; enrich thin ones.

CD = {}

# ============ EAST ASIA ============
CD["CN"] = dict(story="The country that gave the world porcelain, silk and paper, still firing kilns lit before Rome was built.",
 tags=["Porcelain tea sets","Blue-and-white vases","Silk robes & qipao","Jade jewellery","Cloisonné ware","Yixing clay teapots","Gongfu tea ware","Calligraphy & ink brushes","Paper lanterns","Hand fans","Bamboo steamers","Woks & iron cookware","Mahjong sets","Papercut art","Embroidered silk"])
CD["JP"] = dict(story="An island that turned restraint into an art form — steel folded a thousand times, a bowl kept for the crack that makes it beautiful.",
 tags=["Hand-forged kitchen knives","Matcha & tea bowls","Cast-iron teapots (tetsubin)","Washi paper & stationery","Kintsugi repair kits","Incense","Sake sets","Kokeshi dolls","Furoshiki wraps","Tenugui towels","Bonsai tools","Ceramics (Arita, Bizen)","Lacquerware","Indigo (aizome) textiles","Origami paper"])
CD["KR"] = dict(story="A peninsula of quiet perfectionists — celadon glazed the colour of kingfisher, pantry fermented in earthen jars.",
 tags=["K-beauty skincare","Celadon ceramics","Moon jars","Hanji paper goods","Najeon lacquerware (mother-of-pearl)","Bojagi wrapping cloth","Fermented pantry (kimchi, gochujang)","Onggi jars","Hanbok accessories","Tea ware","Norigae ornaments","Traditional soju ware"])
CD["TW"] = dict(story="A mountain island that perfected oolong at altitude and turned the tea break into ceremony.",
 tags=["High-mountain oolong tea","Gongfu tea ware","Ceramics (Yingge)","Pineapple cake & pantry","Bubble-tea culture","Lacquer & woodcraft","Glove puppetry crafts","Hand-pulled noodle tools"])
CD["HK"] = dict(story="A harbour city where tea houses and neon meet — small-batch makers in a tower of workshops.",
 tags=["Tea ware","Milk-tea culture","Enamelware","Chops & seal carving","Tailoring & bespoke shirts","Neon-sign craft","Dim sum steamers"])
CD["MO"] = dict(story="A Portuguese-Cantonese crossroads that bakes East and West into one bite.",
 tags=["Almond cookies","Portuguese-style egg tarts","Pastelaria pantry","Hand-painted azulejo motifs","Jerky (bak kwa)"])
CD["MN"] = dict(story="Nomads of the steppe who comb the world's warmest cashmere from the goats of the cold.",
 tags=["Cashmere knitwear","Felt (wool) goods","Leather boots","Horsehair crafts","Silver ornaments","Deel robes","Nomadic saddlery","Ger (yurt) textiles"])

# ============ SOUTH ASIA ============
CD["IN"] = dict(story="A subcontinent of colour — block by block, thread by thread, a different craft in every state.",
 tags=["Block-printed textiles","Silk saris & scarves","Brass & bell-metal homeware","Spice boxes & masala","Kashmiri pashmina shawls","Marble inlay (pietra dura)","Jaipur blue pottery","Kundan & jhumka jewellery","Ayurvedic skincare","Bangles & bindis","Carved wood screens","Leather juttis","Chai & tea blends","Incense & agarbatti","Mirror-work embroidery"])
CD["PK"] = dict(story="Bazaars where salt is carved into lamps and shawls are woven fine enough to pass through a ring.",
 tags=["Himalayan salt lamps","Onyx & marble ware","Embroidered textiles (phulkari)","Blue pottery (Multan)","Truck-art decor","Leather goods","Camel-skin lamps","Ralli quilts","Peshawari sandals"])
CD["BD"] = dict(story="The land of muslin so fine the Mughals called it woven air, and jute the world calls the golden fibre.",
 tags=["Jamdani muslin","Jute homeware & bags","Nakshi kantha quilts","Pink pearl","Rickshaw art","Cane & bamboo craft","Terracotta pottery","Silk (Rajshahi)"])
CD["LK"] = dict(story="An island of tea gardens and spice — cinnamon peeled by hand, gems washed from river gravel.",
 tags=["Ceylon tea","Cinnamon & spice blends","Batik textiles","Blue sapphires & gems","Handloom cotton","Wood masks","Coir & coconut craft","Brass ware"])
CD["NP"] = dict(story="In the shadow of the Himalaya, singing bowls and lokta paper made the slow way, at altitude.",
 tags=["Singing bowls","Lokta paper goods","Pashmina shawls","Copper & brass ware","Thangka painting","Felt wool crafts","Khukuri knives","Prayer flags & beads","Gemstone jewellery"])
CD["BT"] = dict(story="A kingdom that measures wealth in happiness and weaves cloth fit for kings.",
 tags=["Handwoven textiles (kira)","Incense","Wood carving","Thangka painting","Bamboo craft","Handmade paper","Silver jewellery"])
CD["MV"] = dict(story="Atolls where lacquer is turned on a lathe and coir is spun from the sea's coconuts.",
 tags=["Lacquer boxes (liye laa jehun)","Coir rope craft","Woven mats (thundu kunaa)","Reef-safe skincare","Coconut oil"])
CD["AF"] = dict(story="Where lapis has been mined for six thousand years and every rug tells the tribe that knotted it.",
 tags=["Kilim & war rugs","Lapis lazuli jewellery","Hand-knotted carpets","Embroidered dresses","Copperware","Pomegranate & saffron","Blue pottery (Istalif)"])

# ============ SOUTHEAST ASIA ============
CD["TH"] = dict(story="Silk and celadon, spice and bronze — a kingdom that never stopped making beautiful things.",
 tags=["Thai silk","Celadon ceramics","Benjarong porcelain","Curry pastes","Bronzeware & cutlery","Spa & aromatherapy","Rattan & wicker bags","Khon masks","Carved soap flowers","Triangle cushions","Coconut craft"])
CD["VN"] = dict(story="Lacquer thirty coats deep, silk lanterns, coffee grown in the highlands and brewed drop by drop.",
 tags=["Lacquerware","Silk lanterns","Robusta coffee & phin filters","Bat Trang ceramics","Conical hats (non la)","Ao dai silk","Bamboo & rattan homeware","Embroidered art","Rice-paper craft","Mother-of-pearl inlay"])
CD["ID"] = dict(story="A thousand islands of batik, rattan and teak, each with a pattern of its own.",
 tags=["Batik textiles","Rattan homeware","Teak & Bali wood carving","Silver (Bali/Yogya) jewellery","Ikat weaving","Songket brocade","Wayang puppets","Kopi luwak & coffee","Cacao","Woven baskets"])
CD["MY"] = dict(story="A crossroads of Malay, Chinese and Indian hands — pewter cast and cloth waxed by batik tjanting.",
 tags=["Pewter ware","Batik textiles","Songket brocade","Peranakan ceramics","Rattan & mengkuang weaving","Kris & metalwork","White coffee","Wood carving"])
CD["PH"] = dict(story="Islands that weave from pineapple leaf and shell, and grow the world's rarest cordillera rice.",
 tags=["Piña & abaca handwoven textiles","Capiz-shell craft","Barako coffee","Rattan & wicker furniture","Woven baskets","Wood carving","Pearl jewellery","Banig mats"])
CD["KH"] = dict(story="Temple-builders' descendants — silk woven ikat, silver hammered into betel boxes.",
 tags=["Silk kramas & ikat","Silverware","Kampot pepper","Palm-sugar pantry","Stone & wood carving","Woven baskets","Krama scarves"])
CD["LA"] = dict(story="A landlocked kingdom of looms and mountain coffee, dyed with roots and river indigo.",
 tags=["Handwoven silk (sinh)","Bolaven mountain coffee","Sa (mulberry) paper","Silverware","Rattan & bamboo craft","Natural-dye textiles"])
CD["MM"] = dict(story="Land of gold leaf and lacquer, longyi looms and jade the colour of deep water.",
 tags=["Lacquerware","Longyi & Chin textiles","Jade jewellery","Gold-leaf craft","Thanaka skincare","Marionette puppets","Parasols","Silver ware"])
CD["SG"] = dict(story="A port city of Peranakan colour where kaya is jarred and tiles are hand-pressed.",
 tags=["Peranakan ceramics & tiles","Kaya & kopi pantry","Batik & sarong craft","Tailoring","Orchid & botanical scents","Nyonya beadwork"])
CD["BN"] = dict(story="A sultanate on the Borneo coast that weaves gold thread into ceremonial cloth.",
 tags=["Songket brocade","Silverwork & brass","Woven baskets","Kris daggers","Woodcraft"])
CD["TL"] = dict(story="A young nation with an ancient loom — tais cloth woven to mark every rite of passage.",
 tags=["Tais handwoven textiles","Single-origin coffee","Woven baskets","Coral & shell craft","Wood carving"])

# ============ CENTRAL ASIA & CAUCASUS ============
CD["KZ"] = dict(story="Steppe nomads who felt wool into homes and hammer silver bright as the winter sky.",
 tags=["Felt (shyrdak) & leather goods","Silver jewellery","Camel & sheep wool crafts","Woven wall hangings (tuskiiz)","Horsehair & saddlery","Kumis ware"])
CD["KG"] = dict(story="Mountain herders whose shyrdak felt carpets carry the patterns of a hundred summers.",
 tags=["Shyrdak felt rugs","Ala-kiyiz felt art","Kalpak hats","Yurt textiles","Leather & silver craft","Wool crafts"])
CD["UZ"] = dict(story="On the old Silk Road, ikat still bleeds its colours and suzani still tells a story in stitches.",
 tags=["Ikat silks (adras)","Suzani embroidery","Rishton ceramics","Chust knives","Gold embroidery","Miniature painting","Copper ware","Silk carpets"])
CD["TJ"] = dict(story="Roof of the world weavers — atlas silk and embroidery bright against the grey mountains.",
 tags=["Atlas & adras silks","Embroidered textiles (chakan)","Skullcaps (tubeteika)","Pamiri wool socks","Wood carving","Copperware"])
CD["TM"] = dict(story="Where the carpet is a national emblem and the knot count is a point of pride.",
 tags=["Hand-knotted Turkmen carpets","Silver & carnelian jewellery","Telpek wool hats","Silk (keteni) textiles","Embroidery"])
CD["AM"] = dict(story="An ancient Christian land of khachkar carvers, carpet weavers and pomegranate motifs.",
 tags=["Carpets & rugs","Pomegranate-motif ceramics","Silver & filigree jewellery","Obsidian craft","Khachkar stone motifs","Apricot-wood duduk","Dried fruit & pantry"])
CD["AZ"] = dict(story="Land of fire and carpets — pile knotted in Karabakh and silk unwound in Sheki.",
 tags=["Carpets & rugs","Silk (kelaghayi) scarves","Copper ware","Tea sets & armudu glasses","Pomegranate crafts","Sheki inlay (shebeke)"])
CD["GE"] = dict(story="The cradle of wine, where cloisonné jewellery is fired and felt is rolled by hand.",
 tags=["Cloisonné (minankari) jewellery","Qvevri wine & ware","Felt (namtari) crafts","Enamel art","Silverwork","Churchkhela & pantry","Wool carpets"])

# ============ MIDDLE EAST ============
CD["TR"] = dict(story="The bridge between two continents, hammering copper and knotting wool the way it has for a thousand years.",
 tags=["Copper cezves & ware","Kilim & Turkish rugs","Hammam (peshtemal) towels","Iznik ceramics","Evil-eye (nazar) glass","Turkish delight & pantry","Mosaic lamps","Olive-oil soap","Backgammon boards","Ceramic bowls","Tulip tea glasses","Ottoman-motif textiles"])
CD["IR"] = dict(story="Persia — where the carpet was born, saffron is worth its weight, and enamel glows on copper.",
 tags=["Persian hand-knotted rugs","Saffron","Enamel (mina) ware","Termeh brocade","Khatam marquetry","Turquoise (Firoozeh) jewellery","Copper & engraving (ghalamzani)","Rosewater & pantry","Pistachios","Ceramics & tilework"])
CD["IQ"] = dict(story="Mesopotamia — where writing began, dates ripen in the marsh and copper is beaten by hand.",
 tags=["Dates & date syrup","Copperware","Reed (marsh) craft","Handwoven rugs","Silver jewellery","Brass trays"])
CD["SY"] = dict(story="Aleppo and Damascus — soap cured for years, wood inlaid with pearl, brocade woven in gold.",
 tags=["Aleppo laurel soap","Damascene marquetry (wood inlay)","Brocade (damask) textiles","Mosaic boxes","Brass & copper ware","Glass-blowing","Rosewater & pantry"])
CD["LB"] = dict(story="Cedar country — olive-oil soap, blown glass and a pantry the whole Levant borrows.",
 tags=["Olive-oil soap","Blown glass","Preserves & pantry (za'atar)","Rosewater & orange blossom","Copperware","Embroidery","Ceramics"])
CD["IL"] = dict(story="Where the Dead Sea's minerals become skincare and olive wood is carved by Bethlehem hands.",
 tags=["Dead Sea skincare","Olive-wood carving","Armenian-style ceramics","Silver Judaica","Pomegranate motifs","Hamsa jewellery","Date honey (silan)"])
CD["JO"] = dict(story="Petra's country — sand bottled into art, mosaics set stone by stone, salt drawn from the sea.",
 tags=["Dead Sea salts & mud","Mosaic art","Sand-art bottles","Olive-wood & mother-of-pearl","Embroidery","Nabatean-motif silver","Bedouin rugs"])
CD["SA"] = dict(story="The desert kingdom of dates and oud, where perfume is measured out drop by precious drop.",
 tags=["Dates & date sweets","Oud & bakhoor","Attar perfume oils","Sadu Bedouin weaving","Silver & Najdi jewellery","Coffee (qahwa) ware","Frankincense"])
CD["AE"] = dict(story="Where pearls once made the coast rich and oud still perfumes every majlis.",
 tags=["Oud & attar perfume","Dates & date sweets","Bakhoor & incense","Camel-leather goods","Sadu weaving","Gold jewellery","Arabic coffee ware"])
CD["OM"] = dict(story="Land of frankincense — silver khanjars forged and rosewater distilled in the mountains.",
 tags=["Frankincense & resin","Perfume & attar oils","Silver khanjar & jewellery","Rosewater (Jebel Akhdar)","Halwa & pantry","Bahla pottery","Camel-wool textiles"])
CD["YE"] = dict(story="The mocha coast — coffee named for its port, honey drawn from the sidr tree, silver from Sana'a.",
 tags=["Mocha coffee","Sidr honey","Silver filigree jewellery","Jambiya daggers","Woven textiles","Dhurra pottery"])
CD["QA"] = dict(story="A Gulf pearl-diving nation now scenting the world with oud and bakhoor.",
 tags=["Oud & bakhoor","Attar perfume oils","Pearl jewellery","Sadu weaving","Dates & pantry","Arabic coffee ware"])
CD["KW"] = dict(story="Dhow-builders and pearl-divers whose pantry and perfume travel the Gulf.",
 tags=["Dates & sweets","Perfume & oud oils","Sadu Bedouin weaving","Pearl jewellery","Dhow-craft models","Bukhoor"])
CD["BH"] = dict(story="The island of natural pearls — divers' descendants who still set them in gold.",
 tags=["Natural pearl jewellery","Gold craft","Pottery (A'ali)","Basket & palm weaving","Oud & perfume","Dates"])

# ============ WESTERN & SOUTHERN EUROPE ============
CD["IT"] = dict(story="Glass blown on a Venetian island, leather cut in Florence — a country that made craft a way of life.",
 tags=["Leather bags & goods","Murano glass","Olive oil & pantry","Bespoke tailoring","Hand-painted ceramics (maiolica)","Espresso & moka ware","Venetian masks","Silk ties & scarves","Carrara marble boards","Stationery & bookbinding","Gold & cameo jewellery","Preserves & truffle pantry","Parmigiano & cheese","Balsamic vinegar","Millinery & shoes"])
CD["FR"] = dict(story="Perfume distilled in Grasse, copper beaten in Normandy — a nation that turned everyday things into luxury.",
 tags=["Perfume & fragrance","Copper cookware","Linen & table textiles","Preserves & mustard","Marseille & Savon soap","Lavender oils","Ceramics (Provence, Limoges)","Berets & Basque linen","Candles","Wine & cheese pantry","Leather goods","Enamel (Limoges) art","Espadrilles","Macaron & confiserie"])
CD["ES"] = dict(story="Espadrilles woven by hand, blades forged in Toledo, azulejos glazed under the sun.",
 tags=["Espadrilles","Olive oil & pantry","Ceramics & azulejo tiles","Saffron","Hand-held fans (abanicos)","Damascene (Toledo) jewellery","Paella pans","Turrón & confectionery","Leather goods (Ubrique)","Flamenco guitars","Botijo pottery","Manton silk shawls","Wine & sherry ware"])
CD["PT"] = dict(story="Tiles that turned buildings into paintings, cork stripped by hand from trees that grow it back.",
 tags=["Cork goods","Azulejo tiles","Filigree jewellery","Tinned sardine pantry","Barcelos rooster crafts","Madeira embroidery","Ceramic swallows","Wool (Burel) blankets","Soap & fragrance","Port & wine ware","Handpainted ceramics","Cataplana cookware"])
CD["GR"] = dict(story="Olive groves and island clay, a country that has been pressing, firing and weaving since myth.",
 tags=["Olive oil & olives","Honey & pantry","Ceramics & pottery","Komboloi worry beads","Byzantine icon art","Leather sandals","Herbs, oregano & mountain tea","Backgammon (tavli)","Feta & cheese","Ouzo & mastiha ware","Marble & alabaster","Evil-eye (mati) jewellery"])
CD["GB"] = dict(story="Savile Row tailoring, Harris tweed woven in the isles — a country that dresses the world.",
 tags=["Bespoke tailoring","Wool & cashmere knitwear","Harris tweed","Marmalade & preserves","Teapots & fine bone china","Brogues & leather shoes","Flat caps","Wax jackets (Barbour)","Stationery & fountain pens","Grooming & shaving goods","Tartan & kilts","Gin & pantry","Cheese (cheddar, stilton)","Umbrellas"])
CD["IE"] = dict(story="Aran islanders' knots and Belleek china fine as a shell — an island of makers and music.",
 tags=["Aran wool knitwear","Irish linen","Celtic & Claddagh jewellery","Belleek porcelain","Tweed caps & cloth","Whiskey & pantry","Bodhrán drums","Crystal (Waterford)","Wool blankets"])
CD["NL"] = dict(story="Delft blue fired since the Golden Age, tulips bred by the field, cheese wheeled to market.",
 tags=["Delftware pottery","Cheese (gouda, edam)","Tulip & bulb crafts","Wooden clogs","Stroopwafel pantry","Bicycle accessories","Licorice (drop)","Leather & design goods","Genever ware"])
CD["BE"] = dict(story="Chocolatiers and lace-makers — a small country with an outsized appetite for craft.",
 tags=["Chocolate & pralines","Lace","Beer & brewing ware","Tapestry","Comic & poster art","Waffles & pantry","Diamonds (Antwerp)","Pewter & brass","Leather goods"])
CD["CH"] = dict(story="Watchmakers of the valleys — precision in every gear, chocolate in every fold.",
 tags=["Watches & horology","Chocolate","Swiss army knives","Cowbells & alpine craft","Cheese (gruyère, raclette)","Music boxes","Embroidery (St. Gallen)","Precision tools"])
CD["AT"] = dict(story="Crystal cut in Tyrol, loden woven from mountain wool, porcelain painted in Vienna.",
 tags=["Crystal glassware (Swarovski)","Loden wool coats","Porcelain (Augarten)","Dirndl & trachten","Petit-point embroidery","Mozartkugel & confectionery","Snow globes","Woodcraft & nutcrackers"])
CD["DE"] = dict(story="Solingen steel and Bavarian wood — a country that engineers even its Christmas ornaments.",
 tags=["Kitchen knives (Solingen)","Optics & precision tools","Christmas ornaments","Cuckoo clocks","Beer steins","Nutcrackers & smokers","Enamel cookware","Leather goods","Teddy bears (Steiff)","Porcelain (Meissen)","Felt & wool crafts","Fountain pens"])
CD["LI"] = dict(story="An alpine principality famed for the stamps that collectors chase across the world.",
 tags=["Collectible postage stamps","Precision ceramics","Alpine woodcraft","Wine ware"])
CD["LU"] = dict(story="A grand duchy of iron-masters and potters shaping small, exacting crafts.",
 tags=["Péckvillchen clay whistles","Porcelain (Villeroy & Boch)","Ironwork & pewter","Wine & crémant ware","Pastry & pantry"])
CD["MT"] = dict(story="An island of Knights — silver filigree twisted fine, glass blown in Mediterranean blues.",
 tags=["Filigree silver jewellery","Blown glass (Mdina)","Lace (bizzilla)","Ganutell wire flowers","Ceramics","Prickly-pear pantry","Maltese cross crafts"])
CD["SM"] = dict(story="One of the world's oldest republics, minting collectible coins and stamps atop its mountain.",
 tags=["Collectible stamps & coins","Torta Tre Monti wafer cake","Ceramics","Crossbow & heraldic crafts","Wine & liqueur ware"])
CD["VA"] = dict(story="The smallest state — issuing the stamps, coins and rosaries the faithful carry home.",
 tags=["Vatican postage stamps","Commemorative coins","Rosaries & devotional craft","Mosaic art","Ecclesiastical textiles"])
CD["CY"] = dict(story="Aphrodite's island — lace stitched in Lefkara, halloumi pressed by hand, silver filigree twisted fine.",
 tags=["Lefkara lace","Halloumi & pantry","Filigree silver","Ceramics & pottery","Copperware","Olive oil & carob","Basket weaving","Icon art"])

# ============ NORDIC & BALTIC ============
CD["SE"] = dict(story="Glassblowers of the Kingdom of Crystal, whittlers of the Dalarna horse.",
 tags=["Design glassware (Kosta, Orrefors)","Dala horses","Outdoor & sloyd knives","Sami craft (duodji)","Linen & textiles","Ceramics","Candles & pantry","Wool blankets","Clogs"])
CD["FI"] = dict(story="Puukko knives forged for the forest, glass shaped like Nordic ice, saunas warmed by birch.",
 tags=["Puukko knives","Design glassware (Iittala)","Sauna & birch craft","Marimekko textiles","Reindeer-leather goods","Ceramics (Arabia)","Wool & felt","Juniper woodcraft","Liquorice & pantry"])
CD["DK"] = dict(story="The home of hygge — furniture curved by masters, ceramics glazed the colour of the fjord.",
 tags=["Design furniture","Ceramics (Royal Copenhagen)","Silver (Georg Jensen)","Wool & knitwear","Candles & design goods","Liquorice & pantry","Amber jewellery","Teak homeware"])
CD["NO"] = dict(story="Fjord-country knitters and rosemåling painters, pewter cast against the cold.",
 tags=["Norwegian (Selbu) knitwear","Rosemåling folk art","Pewter ware","Troll & woodcraft","Reindeer & wool goods","Sami duodji craft","Brown cheese pantry","Enamel jewellery"])
CD["IS"] = dict(story="Lopapeysa sweaters knitted against the wind, salt flaked from the North Atlantic.",
 tags=["Lopapeysa wool knitwear","Flaky sea salt","Lava & volcanic jewellery","Sheepskin & wool goods","Skyr & pantry","Fish-leather craft","Design homeware"])
CD["PL"] = dict(story="Amber forty million years old, washed up on a Baltic beach and set by hand.",
 tags=["Amber jewellery","Bolesławiec stoneware","Wycinanki papercut art","Wooden folk crafts","Christmas (bombki) ornaments","Linen & lace","Pisanki painted eggs","Pierogi & pantry","Highlander (góral) craft"])
CD["LT"] = dict(story="Baltic amber and linen — the sun-stone strung on thread spun from the field.",
 tags=["Amber jewellery","Linen goods","Wool mittens & socks","Wooden crosses & folk art","Verba dried-flower craft","Black pottery","Sakotis pantry","Straw (sodai) ornaments"])
CD["LV"] = dict(story="Mitten-knitters of a hundred patterns, amber-gatherers of the Baltic shore.",
 tags=["Amber jewellery","Wool mittens & knitwear","Linen textiles","Woodcraft","Ceramics","Rye bread & pantry","Folk (Lielvārde) belts","Herbal (Black Balsam) ware"])
CD["EE"] = dict(story="Island knitters and juniper-carvers on the edge of the Baltic.",
 tags=["Wool knitwear (Muhu, Kihnu)","Juniper woodware","Linen textiles","Leather & felt goods","Ceramics","Handmade chocolate","Limestone & bog craft","Folk jewellery"])

# ============ CENTRAL & EASTERN EUROPE ============
CD["CZ"] = dict(story="Bohemian crystal cut clear as spring water, marionettes carved and strung by hand.",
 tags=["Bohemian crystal & glass","Marionette puppets","Garnet jewellery","Porcelain & ceramics","Wooden toys","Painted (kraslice) eggs","Beer & pantry","Straw & corn-husk craft"])
CD["SK"] = dict(story="Wire-benders of Slovakia and shepherds whose corbáčik cheese is braided by hand.",
 tags=["Wire art (drotárstvo)","Fujara flutes","Sheep-cheese pantry","Modra ceramics","Folk embroidery","Corn-husk dolls","Painted eggs","Woodcraft"])
CD["HU"] = dict(story="Paprika strung to dry, Herend porcelain painted petal by petal, embroidery from Kalocsa.",
 tags=["Matyó & Kalocsa embroidery","Paprika & pantry","Porcelain (Herend, Zsolnay)","Folk ceramics","Tokaji wine ware","Leather & horse craft","Lace (Halas)","Painted eggs"])
CD["RO"] = dict(story="Carpathian weavers and potters — wool rugs, black pottery and painted monastery colour.",
 tags=["Painted ceramics (Horezu)","Wool rugs & textiles","Folk (ie) embroidered blouses","Black pottery","Woodcraft & carved gates","Icon & glass painting","Merry-cemetery folk art","Pantry & preserves"])
CD["BG"] = dict(story="The valley of roses — attar distilled at dawn, pottery glazed in Troyan drip.",
 tags=["Rose oil & rosewater","Troyan drip ceramics","Wool rugs (Chiprovtsi)","Embroidery & textiles","Martenitsa red-and-white craft","Copperware","Yogurt & pantry","Icon art"])
CD["RS"] = dict(story="Opanci-shoemakers and knitters of the Balkans, preserving fruit by the jar.",
 tags=["Opanci leather shoes","Wool knitwear & socks","Pirot kilim rugs","Preserves & ajvar pantry","Filigree jewellery","Rakija ware","Woodcraft","Embroidery"])
CD["HR"] = dict(story="Lavender of the islands, the cravat the world borrowed, lace stitched three ways.",
 tags=["Lavender & essential oils","Cravats (necktie origin)","Lace (Pag, Lepoglava)","Licitar heart craft","Olive oil & pantry","Ceramics","Filigree (Morčić) jewellery","Wool & textiles"])
CD["SI"] = dict(story="Beekeepers who paint their hives, salt-panners who rake the Adriatic by hand.",
 tags=["Painted beehive-panel art","Piran sea salt","Idrija lace","Kranj woodcraft","Honey & pantry","Ceramics","Felt & wool craft","Cast-iron (Kropa) ironwork"])
CD["UA"] = dict(story="Vyshyvanka stitched red on white, pysanky drawn in wax — a country that embroiders its identity.",
 tags=["Vyshyvanka embroidery","Pysanky painted eggs","Petrykivka folk painting","Ceramics & pottery","Motanka dolls","Woven rushnyk cloth","Amber & beadwork","Honey & pantry"])
CD["BY"] = dict(story="Flax-country weavers — linen bleached in the sun and straw woven into art.",
 tags=["Linen goods","Straw-weaving art","Willow basketry","Vytsinanka papercut","Pottery & ceramics","Wool & felt","Wooden crafts"])
CD["RU"] = dict(story="Matryoshka nested by hand, Khokhloma flamed gold on black, Gzhel painted Baltic blue.",
 tags=["Matryoshka dolls","Khokhloma painted ware","Gzhel blue ceramics","Palekh lacquer boxes","Orenburg lace shawls","Samovar & tea ware","Ushanka & felt (valenki)","Amber & malachite","Zhostovo trays","Filigree jewellery"])
CD["MD"] = dict(story="Wine-country weavers and potters, dyeing wool with the roots of the vineyard.",
 tags=["Wool rugs & carpets","Ceramics & pottery","Embroidered (ie) textiles","Preserves & wine ware","Willow basketry","Woodcraft"])

# ============ SOUTHEAST EUROPE / BALKANS ============
CD["AL"] = dict(story="Filigree-twisters of the mountains, weavers of the qilim and carvers of walnut wood.",
 tags=["Filigree silver jewellery","Wool rugs (qilim)","Carved walnut woodwork","Copperware","Traditional (qeleshe) felt caps","Embroidery","Raki & pantry"])
CD["MK"] = dict(story="Ohrid pearl-makers and filigree silversmiths of the old Balkan trade towns.",
 tags=["Ohrid pearls","Filigree jewellery","Copperware","Wool rugs & textiles","Ceramics","Icon & fresco art","Ajvar & pantry"])
CD["BA"] = dict(story="Coppersmiths of Baščaršija, hammering cezves and trays under the old Ottoman roofs.",
 tags=["Copper coffee sets & trays","Bosnian rugs (ćilim)","Filigree jewellery","Woodcraft","Handwoven textiles","Preserves & pantry","Leather goods"])
CD["ME"] = dict(story="Adriatic olive-pressers and mountain weavers between the sea and the black peaks.",
 tags=["Olive oil & pantry","Wool rugs & textiles","Filigree jewellery","Ceramics","Embroidery","Woodcraft","Honey & rakija ware"])
CD["XK"] = dict(story="Filigree-workers and wool-weavers of the young Balkan republic.",
 tags=["Filigree silver jewellery","Wool textiles & flokati","Woodcraft","Red-pepper (ajvar) pantry","Ceramics","Traditional (plis) caps"])

# ============ NORTH AMERICA ============
CD["US"] = dict(story="Denim riveted for miners, leather tooled on the range — a country that built its own workwear canon.",
 tags=["Workwear denim","Craft leather goods","Hot sauce & pantry","Bourbon & barrel craft","Quilts & Americana","Turquoise & Native silver","Cast-iron cookware","Maple & pantry","Vinyl & poster art","Cowboy boots & hats"])
CD["CA"] = dict(story="Maple tapped in the sugar bush, wool woven into point blankets, soapstone carved in the North.",
 tags=["Maple syrup & pantry","Wool (Hudson's Bay) blankets","Inuit soapstone carving","Ice-wine ware","Beaded & birchbark craft","Smoked salmon pantry","Cowichan knitwear","Amethyst & jade"])

# ============ CENTRAL AMERICA & CARIBBEAN ============
CD["MX"] = dict(story="Clay, silver and thread carrying the memory of the peoples who worked them long before the border existed.",
 tags=["Talavera pottery","Barro negro (black clay)","Embroidered huipiles","Copper (Santa Clara) pans","Alebrijes","Molcajetes","Taxco silver jewellery","Otomí textiles","Day of the Dead art","Hammocks","Sarapes & rebozos","Palm & wicker weaving","Mezcal & pantry","Oaxacan wood carving"])
CD["GT"] = dict(story="Mayan backstrap looms — each village its own colour, jade carved as it was for kings.",
 tags=["Backstrap-woven huipiles","Jade jewellery","Antigua coffee","Worry dolls","Ceramics & pottery","Beaded crafts","Wool blankets","Wood & mask carving"])
CD["BZ"] = dict(story="A Caribbean-Maya coast where cacao is stone-ground and hot pepper is bottled by hand.",
 tags=["Cacao & chocolate","Hot (habanero) sauce","Slate & Maya carving","Woven baskets","Coconut & shell craft","Jippi-jappa weaving","Coffee & pantry"])
CD["SV"] = dict(story="Añil indigo revived, La Palma folk painting bright on every surface, coffee grown on volcanoes.",
 tags=["Indigo (añil) textiles","La Palma folk painting","Volcanic coffee","Ceramics & pottery","Woven hammocks","Handloom cotton","Wood crafts"])
CD["HN"] = dict(story="Lenca potters of the highlands and junco-palm weavers of the coast, coffee grown in cloud forest.",
 tags=["Lenca pottery","Coffee","Junco-palm weaving","Mahogany wood carving","Corn-husk crafts","Leather goods","Cigars & pantry"])
CD["NI"] = dict(story="Hammock-weavers of Masaya and potters of San Juan, coffee grown in the northern hills.",
 tags=["Woven hammocks","Coffee","Ceramics (San Juan de Oriente)","Primitivist (Solentiname) art","Leather & rosewood craft","Palm & straw weaving"])
CD["CR"] = dict(story="Painted oxcarts bright as parrots, coffee grown in the valley of the volcanoes.",
 tags=["Painted oxcart (carreta) craft","Coffee","Ceramics (Chorotega)","Wood & cocobolo carving","Leather goods","Cacao & pantry","Coffee-wood crafts"])
CD["PA"] = dict(story="Guna molas stitched in reverse-appliqué, Geisha coffee grown high in Boquete.",
 tags=["Mola reverse-appliqué textiles","Geisha coffee","Panama hats (sombrero pintao)","Tagua-nut carving","Ceramics","Beaded (chaquira) craft","Cocobolo woodcraft"])
CD["CU"] = dict(story="Guayaberas pressed for the heat, cigars rolled on the thigh, coffee dark as the night.",
 tags=["Guayabera shirts","Cigars & tobacco craft","Coffee","Rum & pantry","Leather goods","Papier-mâché & folk art","Straw hats","Percussion instruments"])
CD["DO"] = dict(story="Larimar the colour of the Caribbean, amber older than memory, cacao ground for chocolate.",
 tags=["Larimar jewellery","Blue amber","Cacao & chocolate","Cigars","Coffee & pantry","Faceless (Limé) dolls","Mahogany carving","Woven baskets"])
CD["JM"] = dict(story="Blue Mountain coffee grown in the mist, jerk spice pounded in the pestle, wood carved by roadside hands.",
 tags=["Blue Mountain coffee","Jerk spice & pantry","Wood carving","Rum & pantry","Beaded & seed jewellery","Straw & bamboo craft","Bark (lignum vitae) craft"])
CD["TT"] = dict(story="Home of the steelpan — oil drums hammered into music, cocoa ground for the world's finest chocolate.",
 tags=["Steelpan instruments","Fine cacao & chocolate","Carnival (mas) craft","Leather & calabash craft","Angostura & pantry","Beaded jewellery","Coconut craft"])
CD["BB"] = dict(story="Chalky Mount potters throwing red island clay, mahogany carved and rum aged in oak.",
 tags=["Chalky Mount pottery","Mahogany carving","Rum & pantry","Rum cakes","Shell & coral craft","Batik textiles","Blackbelly-wool crafts"])
CD["HT"] = dict(story="Oil-drum sculptors of Croix-des-Bouquets and vetiver-growers whose oil scents the world's perfume.",
 tags=["Steel-drum (fer découpé) art","Vetiver oil","Papier-mâché art","Vibrant folk painting","Sisal & straw craft","Wood carving","Beaded (Vodou flag) art","Cacao & pantry"])
CD["BS"] = dict(story="Androsia batik dyed by the sea and straw plaited from the silver palm.",
 tags=["Androsia batik textiles","Straw-plaited goods","Shell & conch craft","Rum & pantry","Junkanoo festival craft","Coconut craft"])
CD["GD"] = dict(story="The Isle of Spice — nutmeg cracked and dried, cacao stone-ground into chocolate.",
 tags=["Nutmeg & spice pantry","Cacao & chocolate","Spice-blend crafts","Rum & pantry","Woven baskets","Shell & coral craft"])
CD["LC"] = dict(story="Coal-pot potters and straw-weavers of the Pitons, cocoa grown on the green slopes.",
 tags=["Coal-pot clay cookware","Woven straw baskets","Cacao & chocolate","Batik & madras textiles","Coconut & calabash craft","Hot sauce & pantry"])
CD["DM"] = dict(story="Kalinago reed-weavers of the last Carib homeland, calabash carved by hand.",
 tags=["Kalinago larouma-reed baskets","Carved calabash art","Bay-leaf oil & pantry","Coconut & vetiver craft","Cocoa & pantry","Woven mats"])
CD["KN"] = dict(story="Caribelle batik hand-dyed on the old sugar estate, coconut carved on the twin islands.",
 tags=["Caribelle batik textiles","Coconut-shell craft","Sugar & rum pantry","Shell jewellery","Woven baskets","Pottery"])
CD["VC"] = dict(story="Basket-weavers and boat-builders of the Grenadines, arrowroot ground fine as flour.",
 tags=["Woven baskets & mats","Wood & model-boat carving","Arrowroot & pantry","Handcrafted jewellery","Coconut craft","Batik textiles"])
CD["AG"] = dict(story="Potters of Sea View Farm and weavers of the twin islands, black pineapple grown sweet.",
 tags=["Redware pottery","Woven baskets","Rum & pantry","Shell & coral craft","Batik textiles","Coconut craft"])
CD["TC"] = dict(story="Straw-plaiters of the caicos cays, conch shells carved and polished by hand.",
 tags=["Straw-plaited hats & bags","Conch-shell craft","Sea-salt pantry","Shell jewellery","Coconut craft"])
CD["BM"] = dict(story="Cedar-carvers of the Atlantic isle, rum cake baked dark and dense.",
 tags=["Bermuda cedar craft","Rum cake & pantry","Sea-glass jewellery","Kite craft","Shell & coral craft"])

# ============ NORTH AFRICA ============
CD["MA"] = dict(story="Where the desert meets the sea, and every souk is a workshop: leather cured in stone pits, lanterns cut by hand.",
 tags=["Leather babouches & poufs","Brass & pierced-metal lanterns","Argan oil","Zellige-tiled tables","Tagines & pottery","Berber rugs & kilims","Mint-tea sets","Kaftans & djellabas","Rosewater & pantry","Thuya-wood boxes","Hammam & black-soap scrubs","Fez ceramics","Silver Berber jewellery"])
CD["TN"] = dict(story="Olive-pressers of the Sahel and weavers of the fouta, ceramics glazed in Nabeul blue.",
 tags=["Olive oil & pantry","Fouta towels","Nabeul ceramics","Berber & Kairouan rugs","Birdcage (Sidi Bou Said) craft","Silver & coral jewellery","Harissa & spice pantry","Leather goods","Chechia felt caps"])
CD["DZ"] = dict(story="Berber weavers of the Aurès and date-farmers of the oases, silver hammered by Kabyle hands.",
 tags=["Berber rugs & textiles","Deglet Nour dates","Kabyle silver & enamel jewellery","Pottery & ceramics","Copperware","Leather goods","Basketry","Burnous wool cloaks"])
CD["EG"] = dict(story="Where writing began — glass blown by hand, brass pierced into lamps, cotton spun long and fine.",
 tags=["Hand-blown (muski) glass","Brass & copper trays","Egyptian cotton linens","Papyrus art","Alabaster ware","Khayamiya appliqué","Perfume bottles & oils","Backgammon boards","Dukkah & spice pantry","Inlaid (mother-of-pearl) boxes","Scarab & pharaonic jewellery"])
CD["LY"] = dict(story="Oasis date-farmers and desert silversmiths, copper beaten in the old medinas.",
 tags=["Dates & pantry","Copperware","Silver Tuareg jewellery","Handwoven textiles","Leather goods","Basketry","Palm-frond craft"])
CD["SD"] = dict(story="Hibiscus dried for karkade, spices ground for the pot, gold and silver worked by Nile hands.",
 tags=["Hibiscus (karkade) & spices","Silver & gold jewellery","Woven baskets & mats","Leather goods","Ebony & wood carving","Perfume oils","Pottery"])
CD["MR"] = dict(story="Tuareg silversmiths of the Sahara, weavers dyeing malahfa cloth against the dunes.",
 tags=["Tuareg silver jewellery","Malahfa embroidered textiles","Leather goods & cushions","Woven mats & baskets","Wooden bowls & spoons","Silver-and-ebony craft","Pottery"])

# ============ WEST AFRICA ============
CD["NG"] = dict(story="Adire indigo tied and dyed, aso-oke woven for weddings, beads strung for kings.",
 tags=["Adire indigo textiles","Aso-oke handwoven cloth","Coral & royal beadwork","Bronze (Benin) casting","Leather (Sokoto) goods","Calabash carving","Ankara wax-print fashion","Talking-drum instruments","Nok-style terracotta","Shea butter & pantry"])
CD["GH"] = dict(story="Kente woven strip by strip, each pattern a proverb — cloth you are meant to read as much as wear.",
 tags=["Kente handwoven cloth","Single-origin cacao","Recycled-glass (Krobo) beads","Adinkra stamped prints","Shea butter","Bolga baskets","Djembe & drum instruments","Black soap","Carved (Ashanti) stools","Kente & fugu smocks","Brass (lost-wax) casting"])
CD["CI"] = dict(story="Cacao-growers of the forest and weavers of Korhogo cloth, gold cast by Baoulé hands.",
 tags=["Cacao & chocolate","Korhogo mud-cloth","Baoulé gold weights & masks","Wax-print (pagne) fashion","Woven baskets","Wood carving","Coffee & pantry"])
CD["SN"] = dict(story="Basket-coilers of the Sahel and glass-painters of Dakar, boubous cut and embroidered.",
 tags=["Coiled (Sahel) baskets","Wax-print & boubou fashion","Sous-verre glass painting","Sabar & djembe drums","Leather goods","Silver (Fulani) jewellery","Wood carving","Bissap & pantry"])
CD["ML"] = dict(story="Bogolan mud-cloth dyed with river clay, kora strings plucked under the desert sky.",
 tags=["Bogolan mud-cloth","Kora & djembe instruments","Tuareg leather & silver","Fulani gold earrings","Woven blankets","Wood & mask carving","Pottery","Indigo textiles"])
CD["BF"] = dict(story="Bronze-casters of the lost-wax method and cotton-weavers of the Sahel.",
 tags=["Bronze (lost-wax) casting","Handwoven Faso Dan Fani cotton","Bogolan mud-cloth","Leather goods","Bronze & brass jewellery","Wood carving","Basketry"])
CD["GN"] = dict(story="Djembe-carvers whose drums set the rhythm for all of West Africa.",
 tags=["Djembe drums","Indigo & wax textiles","Leather goods","Wood & mask carving","Woven baskets","Silver jewellery"])
CD["SL"] = dict(story="Gara tie-dyers of Freetown and country-cloth weavers of the interior.",
 tags=["Gara tie-dye textiles","Country-cloth weaving","Wood & mask carving","Woven baskets","Beaded jewellery","Raffia craft"])
CD["LR"] = dict(story="Mask-carvers and quilters of the Atlantic coast, country cloth woven strip by strip.",
 tags=["Ceremonial mask carving","Patchwork quilts","Country-cloth weaving","Woven baskets","Soapstone carving","Beaded jewellery"])
CD["TG"] = dict(story="Kente-cousins and batik-dyers, lost-wax bronze cast in the southern towns.",
 tags=["Kente & batik textiles","Bronze (lost-wax) casting","Wood & mask carving","Woven baskets","Beaded jewellery","Pottery"])
CD["BJ"] = dict(story="Appliqué banner-makers of Abomey and bronze-casters of the old kingdom.",
 tags=["Abomey appliqué tapestries","Bronze & brass casting","Wood & mask carving","Woven baskets","Batik textiles","Beaded jewellery"])
CD["NE"] = dict(story="Tuareg silversmiths of the Agadez cross, leather-workers of the caravan trade.",
 tags=["Tuareg silver (Agadez cross)","Tuareg leather goods","Woven mats & baskets","Wood & calabash craft","Camel-leather craft","Indigo textiles"])
CD["GM"] = dict(story="Batik-dyers of the river country and drum-makers of the Atlantic shore.",
 tags=["Batik & tie-dye textiles","Djembe & drum craft","Woven baskets","Wood carving","Silver & beaded jewellery","Leather goods"])
CD["GW"] = dict(story="Cashew-growers and cloth-weavers of the Bijagós islands.",
 tags=["Cashew nuts & pantry","Bijagós wood carving","Handwoven (pano) cloth","Woven baskets","Beaded jewellery","Pottery"])
CD["CV"] = dict(story="Island weavers and distillers — grogue pressed from cane, panu cloth woven fine.",
 tags=["Grogue sugarcane spirit","Handwoven (panu) baskets & cloth","Ceramics & pottery","Coffee & pantry","Coconut & shell craft","Batik textiles"])

# ============ EAST AFRICA & HORN ============
CD["ET"] = dict(story="The birthplace of coffee, where the pot, the cup and the ceremony are all part of the taste.",
 tags=["Coffee-ceremony sets","Single-origin coffee","Jebena coffee pots","Habesha woven dresses","Mesob baskets","Berbere spice","Teff & pantry","Ethiopian-cross jewellery","Leather goods","Handwoven cotton (shemma)"])
CD["ER"] = dict(story="Filigree silversmiths of Asmara and coffee-roasters of the highlands.",
 tags=["Jebena coffee pots","Filigree silver jewellery","Woven (mesob) baskets","Handwoven cotton","Leather goods","Spice & coffee pantry"])
CD["KE"] = dict(story="Maasai beadwork and soapstone carved by the hillsides it comes from.",
 tags=["Maasai beadwork","Kenyan tea & coffee","Soapstone (kisii) carving","Kiondo sisal baskets","Kikoy & kanga textiles","Wood & animal carving","Leather sandals (akala)","Shuka blankets"])
CD["TZ"] = dict(story="Tingatinga painters of Dar and Maasai beaders of the plains, spices grown on Zanzibar.",
 tags=["Tingatinga painting","Maasai beadwork","Zanzibar spices","Kanga & kitenge textiles","Makonde ebony carving","Tanzanite jewellery","Woven baskets","Coffee & pantry"])
CD["UG"] = dict(story="Bark-cloth beaten from the fig tree, baskets coiled tight enough to hold water.",
 tags=["Bark cloth","Coiled (raffia) baskets","Coffee","Beaded (paper) jewellery","Wood carving","Batik & kitenge textiles","Drums & instruments"])
CD["RW"] = dict(story="Agaseke peace-basket weavers, coffee grown on a thousand hills.",
 tags=["Agaseke peace baskets","Coffee","Imigongo cow-dung art","Beaded jewellery","Woven mats","Wood carving","Honey & pantry"])
CD["BI"] = dict(story="Coiled-basket weavers and drummers of the great lakes.",
 tags=["Coiled basketry","Ceremonial drums","Twa pottery","Wood carving","Beaded jewellery","Coffee & pantry"])
CD["SS"] = dict(story="Beadworkers and basket-weavers of the Nile plains.",
 tags=["Beaded jewellery & corsets","Woven baskets","Ebony & wood carving","Leather goods","Gourd & calabash craft","Ironwork"])
CD["SO"] = dict(story="Frankincense-tappers of the northern hills and weavers of the coast.",
 tags=["Frankincense & myrrh","Woven (sisal) baskets","Meerschaum & wood craft","Silver & amber jewellery","Handwoven textiles","Leather goods","Camel-milk pantry"])
CD["DJ"] = dict(story="Salt-harvesters of Lake Assal and weavers of the Afar coast.",
 tags=["Woven mats & baskets","Afar & Somali textiles","Silver jewellery","Leather goods","Frankincense","Wood & knife craft"])
CD["SC"] = dict(story="Vanilla-growers and coco-de-mer carvers of the Indian Ocean isles.",
 tags=["Vanilla & pantry","Coco-de-mer craft","Coconut & shell craft","Batik & pareo textiles","Model-boat craft","Tea & spice pantry"])
CD["MU"] = dict(story="Model-ship builders and tea-blenders of the volcanic isle.",
 tags=["Model ships","Vanilla tea & pantry","Sega & basketry craft","Textiles & cashmere","Rum & sugar pantry","Dodo-motif crafts","Sand-art bottles"])
CD["KM"] = dict(story="Ylang-ylang distillers of the perfume islands and vanilla-curers of the coast.",
 tags=["Ylang-ylang perfume oil","Vanilla & spices","Embroidered (kofia) caps","Woven baskets","Wood carving","Shiromani textiles"])
CD["MG"] = dict(story="Vanilla-curers and raffia-weavers of the red island, silk woven and dyed by hand.",
 tags=["Vanilla","Raffia weaving & bags","Wild silk (landibe) textiles","Zafimaniry wood carving","Antaimoro paper","Semi-precious gemstones","Embroidery","Spices & pantry"])

# ============ CENTRAL & SOUTHERN AFRICA ============
CD["CM"] = dict(story="Bamileke bead-throne makers and coffee-growers of the volcanic highlands.",
 tags=["Beaded (Bamileke) thrones & masks","Coffee & cacao","Toghu embroidered textiles","Wood & mask carving","Woven baskets","Bronze casting","Calabash craft"])
CD["CD"] = dict(story="Raffia-weavers of the Kuba kingdom and coffee-growers of the great forest.",
 tags=["Kuba raffia cloth","Coffee","Wood & mask carving","Malachite & copper craft","Woven baskets","Beaded jewellery","Ceramics"])
CD["CG"] = dict(story="Poto-Poto painters of Brazzaville and raffia-weavers of the river.",
 tags=["Poto-Poto painting","Wood & mask carving","Raffia textiles","Woven baskets","Beaded jewellery","Ceramics"])
CD["GA"] = dict(story="Mbigou soapstone-carvers and mask-makers of the equatorial forest.",
 tags=["Mbigou stone carving","Wood & mask carving","Woven baskets","Raffia textiles","Beaded jewellery","Ebony craft"])
CD["GQ"] = dict(story="Fang mask-carvers and raffia-weavers of the gulf coast.",
 tags=["Fang wood masks","Woven raffia baskets","Beaded jewellery","Ebony carving","Bark-cloth craft","Pottery"])
CD["AO"] = dict(story="Chokwe mask-carvers and basket-coilers of the highlands.",
 tags=["Chokwe wood masks","Carved stools & thrones","Sisal basketry","Clay pottery","Beaded jewellery","Woven mats","Ironwork"])
CD["ZM"] = dict(story="Emerald-cutters of the copperbelt and Tonga basket-weavers of the Zambezi.",
 tags=["Emerald jewellery","Tonga & Gwembe baskets","Copper craft","Chitenge textiles","Wood & mask carving","Malachite craft","Honey & pantry"])
CD["ZW"] = dict(story="Shona stone-sculptors whose serpentine figures stand in galleries worldwide.",
 tags=["Shona stone sculpture","Woven (Binga) baskets","Verdite & serpentine carving","Crocheted & wire craft","Beaded jewellery","Batik textiles","Copper & tin craft"])
CD["BW"] = dict(story="Basket-coilers of the Kalahari whose mokola-palm weaves are prized worldwide.",
 tags=["Coiled mokola baskets","San (Bushman) craft","Leather & hide goods","Beaded jewellery","Pottery","Wood carving","Ostrich-eggshell beads"])
CD["NA"] = dict(story="Karakul wool-weavers and Himba-craft makers of the desert coast.",
 tags=["Karakul wool weaving & rugs","Himba craft & ochre jewellery","Baskets & woven crafts","Leather goods","Semi-precious gemstones","Wood carving","Ostrich-eggshell beads"])
CD["ZA"] = dict(story="Zulu bead-workers and Ndebele painters, rooibos grown in the fynbos.",
 tags=["Zulu beadwork & baskets","Rooibos tea","Ndebele-motif crafts","Wire & bead art","Springbok-leather goods","Ceramics & pottery","Shweshwe textiles","Wine & pantry","Wooden bowls"])
CD["LS"] = dict(story="Blanket-weavers of the mountain kingdom, wearing wool against the highland cold.",
 tags=["Basotho blankets","Mokorotlo woven hats","Mohair & wool textiles","Grass weaving","Beaded jewellery","Pottery","Wool tapestries"])
CD["SZ"] = dict(story="Glass-blowers of Ngwenya and sisal-weavers of the highveld.",
 tags=["Ngwenya recycled glassware","Sisal woven baskets","Batik & candle craft","Beaded jewellery","Wood carving","Mohair textiles","Grass mats"])
CD["MW"] = dict(story="Dedza potters and chitenje-dyers of the warm-heart highlands.",
 tags=["Dedza pottery","Chitenje wax-print textiles","Wood carving","Woven (sisal) baskets","Beaded jewellery","Coffee & tea pantry","Cane furniture"])
CD["MZ"] = dict(story="Capulana-wrappers and cashew-growers of the Indian Ocean coast.",
 tags=["Capulana textiles","Cashew & pantry","Makonde ebony carving","Woven baskets","Beaded jewellery","Ceramics","Coconut craft"])

# ============ CENTRAL AFRICA (remaining) ============
CD["TD"] = dict(story="Tuareg silversmiths and leather-workers of the Sahel crossroads.",
 tags=["Leather goods","Tuareg silver jewellery","Hand-dyed textiles","Wood carving","Woven mats & baskets","Calabash craft","Pottery"])
CD["CF"] = dict(story="Basket-weavers and wood-carvers of the forest and savanna.",
 tags=["Woven baskets","Wood & mask carving","Ebony craft","Bark cloth","Beaded jewellery","Ironwork","Raffia textiles"])
CD["GABON_PLACEHOLDER"] = dict(story="", tags=[])

# ============ SOUTH AMERICA ============
CD["PE"] = dict(story="High in the Andes, hands spin alpaca and silver at altitudes where the air is thin and the colour is loud.",
 tags=["Alpaca knitwear & throws","Silver & filigree jewellery","Andean handwoven textiles","Chullo hats","Retablo folk art","Chulucanas ceramics","Pima cotton goods","Woven belts & bags","Gourd (mate burilado) carving","Cacao & chocolate","Pisco & pantry","Wood-carved crafts"])
CD["BO"] = dict(story="Aymara weavers of the altiplano — aguayo cloth bright against the salt and sky.",
 tags=["Alpaca throws & knitwear","Aguayo woven textiles","Silver jewellery","Salt-flat & mineral craft","Ceramics & pottery","Woven hats & bags","Wood carving","Coca & pantry"])
CD["EC"] = dict(story="Panama-hat weavers of Montecristi (the hat is Ecuadorian) and rose-growers of the Andes.",
 tags=["Panama hats (Montecristi)","Single-origin cacao","Tagua-nut (vegetable ivory) carving","Otavalo woven textiles","Roses & floral craft","Balsa-wood birds","Silver (Chordeleg) filigree","Leather goods","Ceramics"])
CD["CO"] = dict(story="Coffee grown on the slopes, mochila bags woven by Wayuu hands, emeralds green as the forest.",
 tags=["Coffee","Wayuu mochila bags","Emerald jewellery","Filigree (Mompox) silver","Sombrero vueltiao hats","Leather goods","Ceramics (La Chamba)","Cacao & pantry","Ruana wool wraps"])
CD["BR"] = dict(story="Gemstones and hand-built instruments from a country that turns raw material into rhythm.",
 tags=["Coffee","Gemstone jewellery","Havaianas & leather goods","Hammocks","Capim-dourado golden-grass craft","Cachaça & pantry","Carnival craft","Wood & berimbau instruments","Ceramics (Marajó)","Cacao & chocolate"])
CD["AR"] = dict(story="Gauchos of the pampas — leather tooled, silver mate-gourds bound, ponchos woven of guanaco.",
 tags=["Leather goods & saddlery","Mate gourds & bombillas","Ponchos & woven textiles","Silver (facón & rastra) craft","Wine & pantry","Alpargata shoes","Rhodochrosite jewellery","Dulce de leche pantry","Wool knitwear"])
CD["CL"] = dict(story="Lapis-cutters of the Andes and copper-smiths of the desert north.",
 tags=["Lapis lazuli jewellery","Copper homeware","Mapuche silver & textiles","Wine & pantry","Combarbalita stone craft","Chamanto woven cloth","Ceramics (Pomaire)","Wool crafts"])
CD["UY"] = dict(story="Wool-throwers and mate-drinkers of the pampas, leather worked by gaucho hands.",
 tags=["Wool throws & knitwear","Mate gourds & ware","Leather goods","Amethyst & agate jewellery","Ceramics","Dulce de leche pantry","Woven textiles"])
CD["PY"] = dict(story="Ñandutí lace-makers whose 'spiderweb' cloth is spun fine as thread.",
 tags=["Ñandutí lace","Ao po'i embroidered cotton","Silver (Luque) filigree","Leather goods","Yerba mate & pantry","Wood carving","Ceramics","Woven hammocks"])
CD["VE"] = dict(story="Cacao-growers of the coast and weavers of the Andes and plains.",
 tags=["Single-origin cacao & chocolate","Woven hammocks","Wayuu textiles & bags","Coffee & pantry","Tapara gourd craft","Ceramics","Rum & pantry","Beaded jewellery"])
CD["GY"] = dict(story="Tibisiri-palm weavers and Amerindian craft-makers of the rainforest.",
 tags=["Tibisiri straw baskets","Amerindian woven craft","Balata-rubber figures","Wood carving","Cassava & pantry","Beaded jewellery","Pottery"])
CD["SR"] = dict(story="Maroon woodcarvers and Javanese batik-makers of the rainforest coast.",
 tags=["Maroon (Tembe) wood carving","Hand-woven hammocks","Javanese batik textiles","Amerindian basketry","Beaded jewellery","Cassava & pantry","Coconut craft"])

# ============ OCEANIA ============
CD["AU"] = dict(story="Merino woven from the world's finest fleece, and art from the world's oldest continuous culture.",
 tags=["Merino wool knitwear","Eucalyptus & manuka honey","Aboriginal dot-painting art","Opal jewellery","Sheepskin (ugg) goods","Tea-tree & bush skincare","Leather (Akubra) hats","Boomerang & didgeridoo craft","Macadamia & pantry","Wine & pantry"])
CD["NZ"] = dict(story="Merino and possum blended for warmth, pounamu greenstone carved by Māori hands.",
 tags=["Mānuka honey","Merino & possum knitwear","Pounamu (greenstone) carving","Māori bone (hei-tiki) carving","Wool blankets & sheepskin","Paua-shell jewellery","Kauri-wood craft","Flax (harakeke) weaving","Wine & pantry"])
CD["FJ"] = dict(story="Masi bark-cloth beaten and stencilled, kava pounded for the ceremony.",
 tags=["Masi (tapa) bark cloth","Kava & pantry","Coconut-oil skincare","Woven (voivoi) mats & baskets","Sandalwood craft","Shell & pearl jewellery","Wood (tanoa) carving"])
CD["PG"] = dict(story="Bilum-string bag makers of the highlands and mask-carvers of the Sepik.",
 tags=["Bilum string bags","Sepik wood & mask carving","Coffee","Woven baskets & mats","Shell (kina) jewellery","Bark-cloth craft","Clay pottery"])
CD["SB"] = dict(story="Shell-money makers and wood-carvers of the coral islands.",
 tags=["Shell-money & jewellery","Wood carving (nguzunguzu)","Woven baskets & mats","Coconut craft","Kastom textiles","Nut-inlay bowls"])
CD["VU"] = dict(story="Sand-drawers and wood-carvers of the volcanic archipelago.",
 tags=["Wood carving (slit-drums)","Woven (pandanus) mats & baskets","Sand-drawing art","Shell jewellery","Tamtam craft","Coconut craft","Kava & pantry"])
CD["WS"] = dict(story="Siapo bark-cloth painters and fine-mat weavers of the Samoan islands.",
 tags=["Siapo bark cloth","Fine (ie toga) mat weaving","Coconut oil & skincare","Kava (ava) ware","Wood (tanoa) carving","Shell & seed jewellery","Tattoo-motif crafts"])
CD["TO"] = dict(story="Ngatu bark-cloth beaters and pandanus mat-weavers of the Friendly Islands.",
 tags=["Ngatu (tapa) bark cloth","Pandanus mat weaving","Coconut & shell craft","Bone & wood carving","Woven baskets","Kava ware","Tapa-motif crafts"])
CD["KI"] = dict(story="Pandanus mat-weavers and shell-crafters of the low coral atolls.",
 tags=["Pandanus woven mats","Shell jewellery & craft","Coconut-fibre (sennit) craft","Woven baskets","Wood carving","Salt & pantry"])
CD["TV"] = dict(story="Crochet (kolose) makers and pandanus-weavers of the coral atolls.",
 tags=["Kolose crochet craft","Pandanus & coconut-leaf weaving","Shell jewellery","Woven fans & baskets","Coconut craft","Wood carving"])
CD["FM"] = dict(story="Master canoe-builders and weavers of the Caroline islands.",
 tags=["Woven (pandanus) crafts","Shell & coral jewellery","Wood & canoe carving","Coconut-fibre craft","Woven baskets & fans","Grass skirts"])
CD["MH"] = dict(story="Stick-chart navigators and fine pandanus-weavers of the atolls.",
 tags=["Woven (pandanus) mats & bags","Stick-chart craft","Shell jewellery","Coconut craft","Woven baskets & fans","Wood carving"])
CD["PW"] = dict(story="Storyboard carvers and shell-money makers of the western Pacific.",
 tags=["Storyboard wood carving","Shell (money) jewellery","Woven baskets & mats","Coconut craft","Wood bowls","Grass skirts"])
CD["NR"] = dict(story="Weavers and shell-crafters of the world's smallest island republic.",
 tags=["Woven (pandanus) crafts","Shell jewellery","Coconut craft","Woven baskets","Wood carving"])

# ============ MICROSTATES (remaining) ============
CD["AD"] = dict(story="A Pyrenean principality of iron-workers and wool-weavers between two crowns.",
 tags=["Wrought-iron craft","Wool & textile weaving","Leather goods","Tobacco & pantry","Mountain-herb craft","Wood carving","Ceramics"])
CD["MC"] = dict(story="A Riviera principality of perfumers and fine artisans on the Mediterranean shore.",
 tags=["Perfume & fragrance","Fine jewellery","Ceramics & porcelain","Chocolate & confiserie","Leather goods","Collectible stamps","Glass & design craft"])
