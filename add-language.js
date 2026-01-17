import fs from "fs";
import path from "path";

const COUNTRIES_DIR = "./_countries"; // 🔁 ret hvis mappen hedder noget andet

const files = fs.readdirSync(COUNTRIES_DIR).filter(f => f.endsWith(".md"));

files.forEach(file => {
    const filePath = path.join(COUNTRIES_DIR, file);
    const content = fs.readFileSync(filePath, "utf8");

    // Tjek at der er frontmatter
    if (!content.startsWith("---")) return;

    const parts = content.split("---");
    const frontmatter = parts[1];

    // Hvis language allerede findes → spring over
    if (/^language:/m.test(frontmatter)) return;

    // Indsæt language: før afslutningen af frontmatter
    const updatedFrontmatter = frontmatter.trimEnd() + "\nlanguage:\n";

    const updatedContent =
        "---\n" +
        updatedFrontmatter +
        "\n---" +
        parts.slice(2).join("---");

    fs.writeFileSync(filePath, updatedContent, "utf8");
    console.log(`✔ Added language to ${file}`);
});
