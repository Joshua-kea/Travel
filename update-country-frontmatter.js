const fs = require("fs");
const path = require("path");

// paths
const COUNTRIES_DIR = path.join(__dirname, "_countries");
const GEOJSON_PATH = path.join(__dirname, "assets", "data", "countries.geo.json");

// load geojson
const geojson = JSON.parse(fs.readFileSync(GEOJSON_PATH, "utf8"));

// build lookup by slug
function slugify(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

const geoLookup = {};
geojson.features.forEach(f => {
    geoLookup[slugify(f.properties.name)] = {
        iso: f.id,
        name: f.properties.name
    };
});

// continent mapping (ISO → continent)
const continentByISO = {
    AFG: "Asia",
    ALB: "Europe",
    DZA: "Africa",
    AND: "Europe",
    AGO: "Africa",
    ATA: "Antarctica",
    ARG: "South America",
    ARM: "Asia",
    AUS: "Oceania",
    AUT: "Europe",
    AZE: "Asia",
    BGD: "Asia",
    BEL: "Europe",
    BEN: "Africa",
    BFA: "Africa",
    BGR: "Europe",
    BHS: "North America",
    BIH: "Europe",
    BLR: "Europe",
    BLZ: "North America",
    BMU: "North America",
    BOL: "South America",
    BRA: "South America",
    BRN: "Asia",
    BTN: "Asia",
    BWA: "Africa",
    CAF: "Africa",
    CAN: "North America",
    CHE: "Europe",
    CHL: "South America",
    CHN: "Asia",
    CIV: "Africa",
    CMR: "Africa",
    COD: "Africa",
    COG: "Africa",
    COL: "South America",
    CRI: "North America",
    CUB: "North America",
    CYP: "Asia",
    CZE: "Europe",
    DEU: "Europe",
    DNK: "Europe",
    DOM: "North America",
    ECU: "South America",
    EGY: "Africa",
    ERI: "Africa",
    ESP: "Europe",
    EST: "Europe",
    ETH: "Africa",
    FIN: "Europe",
    FJI: "Oceania",
    FRA: "Europe",
    GBR: "Europe",
    GEO: "Asia",
    GHA: "Africa",
    GIN: "Africa",
    GMB: "Africa",
    GNB: "Africa",
    GNQ: "Africa",
    GRC: "Europe",
    GRL: "North America",
    GTM: "North America",
    GUY: "South America",
    HND: "North America",
    HRV: "Europe",
    HTI: "North America",
    HUN: "Europe",
    IDN: "Asia",
    IND: "Asia",
    IRL: "Europe",
    IRN: "Asia",
    IRQ: "Asia",
    ISL: "Europe",
    ISR: "Asia",
    ITA: "Europe",
    JAM: "North America",
    JOR: "Asia",
    JPN: "Asia",
    KAZ: "Asia",
    KEN: "Africa",
    KGZ: "Asia",
    KHM: "Asia",
    KOR: "Asia",
    KWT: "Asia",
    LAO: "Asia",
    LBN: "Asia",
    LBR: "Africa",
    LBY: "Africa",
    LKA: "Asia",
    LSO: "Africa",
    LTU: "Europe",
    LUX: "Europe",
    LVA: "Europe",
    MAR: "Africa",
    MDA: "Europe",
    MDG: "Africa",
    MEX: "North America",
    MKD: "Europe",
    MLI: "Africa",
    MLT: "Europe",
    MMR: "Asia",
    MNE: "Europe",
    MNG: "Asia",
    MOZ: "Africa",
    MRT: "Africa",
    MWI: "Africa",
    MYS: "Asia",
    NAM: "Africa",
    NLD: "Europe",
    NPL: "Asia",
    NOR: "Europe",
    NZL: "Oceania",
    OMN: "Asia",
    PAK: "Asia",
    PAN: "North America",
    PER: "South America",
    PHL: "Asia",
    PNG: "Oceania",
    POL: "Europe",
    PRY: "South America",
    QAT: "Asia",
    ROU: "Europe",
    RUS: "Europe",
    RWA: "Africa",
    SAU: "Asia",
    SDN: "Africa",
    SEN: "Africa",
    SLE: "Africa",
    SLV: "North America",
    SOM: "Africa",
    SRB: "Europe",
    SUR: "South America",
    SVK: "Europe",
    SVN: "Europe",
    SWE: "Europe",
    SWZ: "Africa",
    SYR: "Asia",
    TCD: "Africa",
    TGO: "Africa",
    THA: "Asia",
    TJK: "Asia",
    TKM: "Asia",
    TLS: "Asia",
    TTO: "North America",
    TUN: "Africa",
    TUR: "Asia",
    TWN: "Asia",
    TZA: "Africa",
    UGA: "Africa",
    UKR: "Europe",
    URY: "South America",
    USA: "North America",
    UZB: "Asia",
    VEN: "South America",
    VNM: "Asia",
    VUT: "Oceania",
    YEM: "Asia",
    ZAF: "Africa",
    ZMB: "Africa",
    ZWE: "Africa"
};

// update files
fs.readdirSync(COUNTRIES_DIR).forEach(file => {
    if (!file.endsWith(".md")) return;

    const slug = file.replace(".md", "");
    const geo = geoLookup[slug];
    if (!geo) return;

    const iso = geo.iso;
    const continent = continentByISO[iso] || "";

    const filePath = path.join(COUNTRIES_DIR, file);
    const content = fs.readFileSync(filePath, "utf8");

    const updated = content.replace(
        /^---[\s\S]*?---/,
        `---
layout: country
iso: ${iso}
name: "${geo.name}"
continent: ${continent}
gay_friendliness:
tags: []
---`
    );

    fs.writeFileSync(filePath, updated, "utf8");
    console.log(`🔄 Updated: ${file}`);
});

console.log("✅ All country files updated.");
