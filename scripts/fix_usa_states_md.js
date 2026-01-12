const fs = require("fs");
const path = require("path");

// 🔑 KUN USA-MAPPEN
const USA_DIR = path.join(__dirname, "../_countries/usa");

console.log("SCRIPT STARTED");

// læs alle .md filer i usa-mappen
const files = fs.readdirSync(USA_DIR).filter(f => f.endsWith(".md"));

let fixed = 0;

files.forEach(file => {
    const fullPath = path.join(USA_DIR, file);
    const content = fs.readFileSync(fullPath, "utf8");

    const regionMatch = content.match(/region_code:\s*"?US-[A-Z]{2}"?/);
    const nameMatch = content.match(/name:\s*"?([^"\n]+)"?/);

    if (!regionMatch || !nameMatch) return;

    const regionCode = regionMatch[0].split(":")[1].trim().replace(/"/g, "");
    const name = nameMatch[1].trim();

    const adminKey = `USA:${regionCode.toLowerCase()}`;

    const newContent = `---
layout: country
admin_key: "${adminKey}"
name: "${name}"
parent_country: USA
continent: North America
tags: []
---

# ${name}
`;

    fs.writeFileSync(fullPath, newContent);
    fixed++;
});

console.log(`✅ Fixed ${fixed} USA state files`);
