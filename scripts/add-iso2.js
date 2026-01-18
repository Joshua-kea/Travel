const fs = require("fs");
const path = require("path");
const isoMap = require("./iso-map");

const COUNTRIES_DIR = path.join(__dirname, "..", "_countries");

const files = fs.readdirSync(COUNTRIES_DIR).filter(f => f.endsWith(".md"));

files.forEach(file => {
    const filePath = path.join(COUNTRIES_DIR, file);
    const raw = fs.readFileSync(filePath, "utf8");

    if (!raw.startsWith("---")) return;

    const parts = raw.split("---");
    const frontMatter = parts[1];
    const body = parts.slice(2).join("---");

    if (frontMatter.includes("iso2:")) return;

    const isoMatch = frontMatter.match(/iso:\s*([A-Z]{3})/);
    if (!isoMatch) return;

    const iso3 = isoMatch[1];
    const iso2 = isoMap[iso3];

    if (!iso2) {
        console.warn(`⚠ No iso2 for ${file}`);
        return;
    }

    const lines = frontMatter.trim().split("\n");
    const isoIndex = lines.findIndex(l => l.startsWith("iso:"));

    lines.splice(isoIndex + 1, 0, `iso2: ${iso2}`);

    const updated =
        `---\n${lines.join("\n")}\n---\n${body.trimStart()}`;

    fs.writeFileSync(filePath, updated, "utf8");
    console.log(`✅ Added iso2 to ${file}`);
});
