const fs = require("fs");
const path = require("path");

const COUNTRIES_DIR = path.join(__dirname, "_countries");

// ISO → continent mapping
const continentByISO = {
    // Europe
    ALB:"Europe", AND:"Europe", AUT:"Europe", BEL:"Europe", BIH:"Europe", BGR:"Europe",
    BLR:"Europe", CHE:"Europe", CYP:"Europe", CZE:"Europe", DEU:"Europe", DNK:"Europe",
    ESP:"Europe", EST:"Europe", FIN:"Europe", FRA:"Europe", GBR:"Europe", GRC:"Europe",
    HRV:"Europe", HUN:"Europe", IRL:"Europe", ISL:"Europe", ITA:"Europe", LIE:"Europe",
    LTU:"Europe", LUX:"Europe", LVA:"Europe", MCO:"Europe", MDA:"Europe", MKD:"Europe",
    MLT:"Europe", MNE:"Europe", NLD:"Europe", NOR:"Europe", POL:"Europe", PRT:"Europe",
    ROU:"Europe", RUS:"Europe", SMR:"Europe", SRB:"Europe", SVK:"Europe", SVN:"Europe",
    SWE:"Europe", UKR:"Europe", VAT:"Europe",

    // Africa
    AGO:"Africa", BDI:"Africa", BEN:"Africa", BFA:"Africa", BWA:"Africa", CAF:"Africa",
    CIV:"Africa", CMR:"Africa", COD:"Africa", COG:"Africa", COM:"Africa", CPV:"Africa",
    DZA:"Africa", EGY:"Africa", ERI:"Africa", ETH:"Africa", GAB:"Africa", GHA:"Africa",
    GIN:"Africa", GMB:"Africa", GNB:"Africa", GNQ:"Africa", KEN:"Africa", LBR:"Africa",
    LBY:"Africa", LSO:"Africa", MAR:"Africa", MDG:"Africa", MLI:"Africa", MOZ:"Africa",
    MRT:"Africa", MUS:"Africa", MWI:"Africa", NAM:"Africa", NER:"Africa", NGA:"Africa",
    RWA:"Africa", SDN:"Africa", SEN:"Africa", SLE:"Africa", SOM:"Africa", SSD:"Africa",
    SWZ:"Africa", TCD:"Africa", TGO:"Africa", TUN:"Africa", TZA:"Africa", UGA:"Africa",
    ZAF:"Africa", ZMB:"Africa", ZWE:"Africa",

    // Asia
    AFG:"Asia", ARM:"Asia", AZE:"Asia", BHR:"Asia", BGD:"Asia", BRN:"Asia", BTN:"Asia",
    CHN:"Asia", GEO:"Asia", HKG:"Asia", IDN:"Asia", IND:"Asia", IRN:"Asia", IRQ:"Asia",
    ISR:"Asia", JPN:"Asia", JOR:"Asia", KAZ:"Asia", KGZ:"Asia", KHM:"Asia", KOR:"Asia",
    KWT:"Asia", LAO:"Asia", LBN:"Asia", LKA:"Asia", MAC:"Asia", MMR:"Asia", MNG:"Asia",
    MYS:"Asia", NPL:"Asia", OMN:"Asia", PAK:"Asia", PHL:"Asia", PRK:"Asia", QAT:"Asia",
    SAU:"Asia", SGP:"Asia", SYR:"Asia", THA:"Asia", TJK:"Asia", TLS:"Asia", TUR:"Asia",
    TWN:"Asia", UZB:"Asia", VNM:"Asia", YEM:"Asia",

    // North America
    ATG:"North America", BHS:"North America", BLZ:"North America", BRB:"North America",
    CAN:"North America", CRI:"North America", CUB:"North America", DMA:"North America",
    DOM:"North America", GRD:"North America", GTM:"North America", HND:"North America",
    HTI:"North America", JAM:"North America", KNA:"North America", LCA:"North America",
    MEX:"North America", NIC:"North America", PAN:"North America", SLV:"North America",
    TTO:"North America", USA:"North America", VCT:"North America",

    // South America
    ARG:"South America", BOL:"South America", BRA:"South America", CHL:"South America",
    COL:"South America", ECU:"South America", GUY:"South America", PER:"South America",
    PRY:"South America", SUR:"South America", URY:"South America", VEN:"South America",

    // Oceania
    AUS:"Oceania", FJI:"Oceania", FSM:"Oceania", KIR:"Oceania", MHL:"Oceania",
    NCL:"Oceania", NRU:"Oceania", NZL:"Oceania", PLW:"Oceania", PNG:"Oceania",
    SLB:"Oceania", TON:"Oceania", TUV:"Oceania", VUT:"Oceania", WSM:"Oceania"
};

fs.readdirSync(COUNTRIES_DIR).forEach(file => {
    if (!file.endsWith(".md")) return;

    const filePath = path.join(COUNTRIES_DIR, file);
    let content = fs.readFileSync(filePath, "utf8");

    const isoMatch = content.match(/^iso:\s*([A-Z0-9]{3})/m);
    if (!isoMatch) return;

    const iso = isoMatch[1];
    const continent = continentByISO[iso];
    if (!continent) return;

    // only fill if empty
    content = content.replace(
        /^continent:\s*$/m,
        `continent: ${continent}`
    );

    fs.writeFileSync(filePath, content, "utf8");
});

console.log("✅ Missing continents filled where possible.");
