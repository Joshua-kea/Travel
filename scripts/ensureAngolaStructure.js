import fs from "fs";
import path from "path";
import YAML from "yaml";

const ROOT = "_countries";

const TEMPLATE = {
    layout: "country",
    iso: "",
    name: "",
    continent: "",
    gay_friendliness: "",
    tags: [],
    language: [],
    capital: "",
    currency: {
        name: "",
        code: "",
        symbol: "",
        rates: {
            per_1: { eur: "", dkk: "" },
            per_100: { eur: "", dkk: "" }
        }
    },
    budget: {
        dkk: "",
        eur: ""
    },
    gay_details: "",
    iso2: "",
    best_months: [],
    ok_months: []
};

function walk(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
        const p = path.join(dir, e.name);
        return e.isDirectory() ? walk(p) : e.name.endsWith(".md") ? [p] : [];
    });
}

function normalize(template, data, key = null) {
    // handle string -> object cases
    if (typeof data === "string" && typeof template === "object") {
        if (key === "currency") {
            return {
                ...template,
                name: data
            };
        }
        return template;
    }

    if (Array.isArray(template)) {
        return Array.isArray(data) ? data : template;
    }

    if (typeof template === "object") {
        const out = {};
        for (const k of Object.keys(template)) {
            out[k] = normalize(template[k], data?.[k], k);
        }
        // keep extra existing keys
        for (const k of Object.keys(data || {})) {
            if (!(k in out)) {
                out[k] = data[k];
            }
        }
        return out;
    }

    return data ?? template;
}

function processFile(file) {
    const raw = fs.readFileSync(file, "utf8");
    if (!raw.startsWith("---")) return;

    const parts = raw.split(/---\s*\n/);
    if (parts.length < 3) return;

    const fm = YAML.parse(parts[1]);
    const merged = normalize(TEMPLATE, fm);

    const out =
        "---\n" +
        YAML.stringify(merged).trimEnd() +
        "\n---\n" +
        parts.slice(2).join("---\n").trimStart();

    fs.writeFileSync(file, out);
    console.log(`✔ fixed: ${file}`);
}

walk(ROOT).forEach(processFile);
console.log("Done.");
