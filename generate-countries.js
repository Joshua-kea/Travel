const fs = require("fs");
const path = require("path");

// paths
const GEOJSON_PATH = path.join(__dirname, "assets", "data", "countries.geo.json");
const OUTPUT_DIR = path.join(__dirname, "_countries");

// sørg for at mappen findes
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
}

// læs geojson
const geojson = JSON.parse(fs.readFileSync(GEOJSON_PATH, "utf8"));

geojson.features.forEach(feature => {
    const iso = feature.id; // fx "AFG"
    const name = feature.properties.name; // fx "Afghanistan"

    // filnavn: afghanistan.md
    const filename = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") + ".md";

    const filePath = path.join(OUTPUT_DIR, filename);

    // spring over hvis filen allerede findes
    if (fs.existsSync(filePath)) {
        console.log(`⏭️  Skipped existing file: ${filename}`);
        return;
    }

    const content = `---
layout: country
iso: ${iso}
name: "${name}"
continent:
gay_friendliness:
tags: []
---

# ${name}

Write your notes about ${name} here.
`;

    fs.writeFileSync(filePath, content, "utf8");
    console.log(`✅ Created: ${filename}`);
});

console.log("🎉 All countries processed.");