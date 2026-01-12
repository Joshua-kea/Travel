---
layout: country
admin_key: "GBR:wales"
name: "Walesconst fs = require("fs");
const path = require("path");

// 🔧 ret evt. hvis din mappe hedder noget andet
const COUNTRIES_DIR = path.join(__dirname, "../_countries");

// læs alle md-filer
const files = fs.readdirSync(COUNTRIES_DIR).filter(f => f.endsWith(".md"));

let fixed = 0;

files.forEach(file => {
  const fullPath = path.join(COUNTRIES_DIR, file);
  const content = fs.readFileSync(fullPath, "utf8");

  // kun USA-stater (vi kigger på parent_country eller region_code)
  if (
    !content.includes("USA") &&
    !content.includes("United States") &&
    !content.includes("US-")
  ) {
    return;
  }

  // find navn
  const nameMatch = content.match(/name:\s*"?(.+?)"?\n/);
  if (!nameMatch) return;

  const name = nameMatch[1].trim();
  const adminKey = `USA:${name.toLowerCase()}`;

  const newFrontmatter = `---
layout: country
admin_key: "${adminKey}"
name: "${name}"
parent_country: USA
continent: North America
tags: []
---

# ${name}
`;

fs.writeFileSync(fullPath, newFrontmatter);
fixed++;
});

console.log(`✅ Fixed ${fixed} USA state files`);
"
parent_country: UK
continent: Europe
tags: []
---

# Wales
