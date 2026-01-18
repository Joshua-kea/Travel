const fs = require("fs");
const path = require("path");

const COUNTRIES_DIR = path.join(__dirname, "../_countries");

// ISO-3 → ISO-2 (USA og GBR bevidst udeladt)
const ISO_MAP = {
    AFG:"af", ALB:"al", DZA:"dz", AND:"ad", AGO:"ao", ATG:"ag", ARG:"ar",
    ARM:"am", AUS:"au", AUT:"at", AZE:"az", BHS:"bs", BHR:"bh", BGD:"bd",
    BRB:"bb", BLR:"by", BEL:"be", BLZ:"bz", BEN:"bj", BTN:"bt", BOL:"bo",
    BIH:"ba", BWA:"bw", BRA:"br", BRN:"bn", BGR:"bg", BFA:"bf", BDI:"bi",
    KHM:"kh", CMR:"cm", CPV:"cv", CAF:"cf", TCD:"td", CHL:"cl", CHN:"cn",
    COL:"co", COM:"km", COG:"cg", COD:"cd", CRI:"cr", HRV:"hr", CUB:"cu",
    CYP:"cy", CZE:"cz", DNK:"dk", DJI:"dj", DMA:"dm", DOM:"do", ECU:"ec",
    EGY:"eg", SLV:"sv", GNQ:"gq", ERI:"er", EST:"ee", SWZ:"sz", ETH:"et",
    FJI:"fj", FIN:"fi", FRA:"fr", GAB:"ga", GMB:"gm", GEO:"ge", DEU:"de",
    GHA:"gh", GRC:"gr", GRD:"gd", GTM:"gt", GIN:"gn", GNB:"gw", GUY:"gy",
    HTI:"ht", HND:"hn", HUN:"hu", ISL:"is", IND:"in", IDN:"id", IRN:"ir",
    IRQ:"iq", IRL:"ie", ISR:"il", ITA:"it", JAM:"jm", JPN:"jp", JOR:"jo",
    KAZ:"kz", KEN:"ke", KIR:"ki", PRK:"kp", KOR:"kr", KWT:"kw", KGZ:"kg",
    LAO:"la", LVA:"lv", LBN:"lb", LSO:"ls", LBR:"lr", LBY:"ly", LIE:"li",
    LTU:"lt", LUX:"lu", MDG:"mg", MWI:"mw", MYS:"my", MDV:"mv", MLI:"ml",
    MLT:"mt", MHL:"mh", MRT:"mr", MUS:"mu", MEX:"mx", FSM:"fm", MDA:"md",
    MCO:"mc", MNG:"mn", MNE:"me", MAR:"ma", MOZ:"mz", MMR:"mm", NAM:"na",
    NRU:"nr", NPL:"np", NLD:"nl", NZL:"nz", NIC:"ni", NER:"ne", NGA:"ng",
    MKD:"mk", NOR:"no", OMN:"om", PAK:"pk", PLW:"pw", PAN:"pa", PNG:"pg",
    PRY:"py", PER:"pe", PHL:"ph", POL:"pl", PRT:"pt", QAT:"qa", ROU:"ro",
    RUS:"ru", RWA:"rw", KNA:"kn", LCA:"lc", VCT:"vc", WSM:"ws", SMR:"sm",
    STP:"st", SAU:"sa", SEN:"sn", SRB:"rs", SYC:"sc", SLE:"sl", SGP:"sg",
    SVK:"sk", SVN:"si", SLB:"sb", SOM:"so", ZAF:"za", SSD:"ss", ESP:"es",
    LKA:"lk", SDN:"sd", SUR:"sr", SWE:"se", CHE:"ch", SYR:"sy", TWN:"tw",
    TJK:"tj", TZA:"tz", THA:"th", TLS:"tl", TGO:"tg", TON:"to", TTO:"tt",
    TUN:"tn", TUR:"tr", TKM:"tm", TUV:"tv", UGA:"ug", UKR:"ua", URY:"uy",
    UZB:"uz", VUT:"vu", VAT:"va", VEN:"ve", VNM:"vn", YEM:"ye", ZMB:"zm",
    ZWE:"zw"
};

const files = fs.readdirSync(COUNTRIES_DIR);

files.forEach(file => {
    if (!file.endsWith(".md")) return;

    const filePath = path.join(COUNTRIES_DIR, file);
    const content = fs.readFileSync(filePath, "utf8");

    if (!content.startsWith("---")) return;
    if (/^iso2:\s*/m.test(content)) return;

    const isoMatch = content.match(/^iso:\s*([A-Z]{3})/m);
    if (!isoMatch) {
        console.warn(`⚠️  No iso in ${file}`);
        return;
    }

    const iso3 = isoMatch[1];
    const iso2 = ISO_MAP[iso3];

    if (!iso2) {
        console.warn(`⚠️  No iso2 mapping for ${iso3} (${file})`);
        return;
    }

    const updated = content.replace(
        /^iso:\s*[A-Z]{3}/m,
        match => `${match}\niso2: ${iso2}`
    );

    fs.writeFileSync(filePath, updated, "utf8");
    console.log(`✅ Added iso2: ${iso2} → ${file}`);
});
