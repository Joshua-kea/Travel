import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/* =========================
   SAFE ROOT (WINDOWS OK)
========================= */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =========================
   TARGET DIRS
========================= */

const TARGET_DIRS = [
    "_countries",
    "_countries/usa",
    "_countries/uk"
].map(d => path.join(__dirname, d));

/* =========================
   FACT DATA
========================= */

// Countries
const COUNTRY_FACTS = {
    AGO: { language: ["Portuguese"], currency: "Angolan kwanza", capital: "Luanda" }
};

// UK regions
const UK_FACTS = {
    "GB-ENG": { capital: "London" },
    "GB-SCT": { capital: "Edinburgh" },
    "GB-WLS": { capital: "Cardiff" },
    "GB-NIR": { capital: "Belfast" }
};

// USA states
const USA_FACTS = {
    "US-AL": { capital: "Montgomery" }
    // kan udvides løbende
};

/* =========================
   HELPERS
========================= */

function getMarkdownFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
        .filter(f => f.endsWith(".md"))
        .map(f => path.join(dir, f));
}

function extractContext(frontmatter) {
    const iso = frontmatter.match(/^iso:\s*([A-Z]{3})/m);
    if (iso) return { type: "country", key: iso[1] };

    const admin = frontmatter.match(/^admin_key:\s*"?([A-Z]{3}):([A-Z-]+)"/m);
    if (!admin) return null;

    if (admin[1] === "USA") return { type: "usa", key: admin[2] };
    if (admin[1] === "GBR") return { type: "uk", key: admin[2] };

    return null;
}

function fieldIsEmpty(frontmatter, key) {
    const block = frontmatter.match(
        new RegExp(`^${key}:([\\s\\S]*?)(?=^\\w+:|$)`, "m")
    );
    return !block || block[1].trim() === "";
}

function setScalar(frontmatter, key, value) {
    frontmatter = frontmatter.replace(
        new RegExp(`^${key}:[\\s\\S]*?(?=^\\w+:|$)`, "m"),
        ""
    );
    return frontmatter + `\n${key}: ${value}\n`;
}

function setList(frontmatter, key, values) {
    frontmatter = frontmatter.replace(
        new RegExp(`^${key}:[\\s\\S]*?(?=^\\w+:|$)`, "m"),
        ""
    );
    frontmatter += `\n${key}:`;
    values.forEach(v => frontmatter += `\n  - ${v}`);
    return frontmatter + "\n";
}

/* =========================
   MAIN
========================= */

let updated = 0;

TARGET_DIRS
    .flatMap(getMarkdownFiles)
    .forEach(file => {

        const raw = fs.readFileSync(file, "utf8");
        if (!raw.startsWith("---")) return;

        const parts = raw.split("---");
        let frontmatter = parts[1];
        const body = parts.slice(2).join("---");

        const ctx = extractContext(frontmatter);
        if (!ctx) return;

        let facts;

        if (ctx.type === "country") facts = COUNTRY_FACTS[ctx.key];
        if (ctx.type === "uk") facts = { language: ["English"], currency: "Pound sterling", ...UK_FACTS[ctx.key] };
        if (ctx.type === "usa") facts = { language: ["English"], currency: "US dollar", ...USA_FACTS[ctx.key] };

        if (!facts) return;

        let changed = false;

        if (facts.language && fieldIsEmpty(frontmatter, "language")) {
            frontmatter = setList(frontmatter, "language", facts.language);
            changed = true;
        }

        if (facts.currency && fieldIsEmpty(frontmatter, "currency")) {
            frontmatter = setScalar(frontmatter, "currency", facts.currency);
            changed = true;
        }

        if (facts.capital && fieldIsEmpty(frontmatter, "capital")) {
            frontmatter = setScalar(frontmatter, "capital", facts.capital);
            changed = true;
        }

        if (!changed) return;

        fs.writeFileSync(
            file,
            "---\n" + frontmatter.trimEnd() + "\n---" + body,
            "utf8"
        );

        updated++;
        console.log(`✔ Updated ${path.relative(__dirname, file)}`);
    });

console.log(`\nDone. Updated ${updated} file(s).`);
