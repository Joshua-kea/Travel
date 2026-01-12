const fs = require("fs");
const path = require("path");

// paths
const GEOJSON_PATH = path.join(__dirname, "assets", "data", "countries.geo.json");
const COUNTRIES_DIR = path.join(__dirname, "_countries");

// helpers
function slugify(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

// read existing md files → ISO set
const existingISOs = new Set();

fs.readdirSync(COUNTRIES_DIR).forEach(file => {
    if (!file.endsWith(".md")) return;

    const content = fs.readFileSync(path.join(COUNTRIES_DIR, file), "utf8");
    const match = content.match(/^iso:\s*([A-Z0-9]{3})/m);

    if (match) {
        existingISOs.add(match[1]);
    }
});

// read geojson
const geojson = JSON.parse(fs.readFileSync(GEOJSON_PATH, "utf8"));

let created = 0;

geojson.features.forEach(feature => {
    const iso = feature.properties.ISO_A3;
    const name = feature.properties.NAME;

    if (!iso || iso === "-99") return; // Natural Earth filler values
    if (existingISOs.has(iso)) return; // already have md

    const filename = slugify(name) + ".md";
    const filePath = path.join(COUNTRIES_DIR, filename);

    if (fs.existsSync(filePath)) return;

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
    created++;
    console.log(`➕ Created: ${filename}`);
});

console.log(`✅ Done. Created ${created} new place files.`);
