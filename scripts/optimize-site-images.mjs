/**
 * Generate WebP for main site images (everything except services/puzzle).
 * Run from Temple_website: npm run optimize:site-images
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const IMAGE_EXT = /\.(png|jpe?g)$/i;

const PRESETS = {
  hero: { maxWidth: 1920, quality: 82 },
  deity: { maxWidth: 960, quality: 80 },
  card: { maxWidth: 800, quality: 78 },
  icon: { maxWidth: 512, quality: 80 },
  map: { maxWidth: 1600, quality: 82 }
};

const SCAN_ROOTS = [
  "photos",
  "web_picture",
  "news_picture",
  "services/light",
  "services/worship",
  "services/fortune",
  "services/signup"
];

const REF_FILES = [
  "style.css",
  "index.html",
  "committee.html",
  "temple-map.html",
  "js/news.js",
  "services/worship/index.html",
  "services/fortune/index.html",
  "services/light/index.html",
  "services/signup/index.html"
];

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function collectImages(dir) {
  const files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (full.includes(`${path.sep}services${path.sep}puzzle${path.sep}`)) continue;
      files.push(...(await collectImages(full)));
    } else if (IMAGE_EXT.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

function presetFor(relPath) {
  const rel = relPath.replace(/\\/g, "/");
  if (rel.startsWith("photos/")) return "deity";
  if (/[/\\]f[123]\.png$/i.test(rel) || rel.includes("電子地圖")) return "map";
  if (rel.startsWith("web_picture/")) {
    return rel.includes("包公廟") ? "hero" : "deity";
  }
  if (rel.startsWith("news_picture/")) return "card";
  if (path.basename(rel) === "committee.png") return "hero";
  return "icon";
}

async function optimizeOne(inputPath, outputPath, preset) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await sharp(inputPath)
    .rotate()
    .resize({
      width: preset.maxWidth,
      height: preset.maxWidth,
      fit: "inside",
      withoutEnlargement: true
    })
    .webp({ quality: preset.quality, effort: 4 })
    .toFile(outputPath);
  const [srcStat, outStat] = await Promise.all([fs.stat(inputPath), fs.stat(outputPath)]);
  return { srcBytes: srcStat.size, outBytes: outStat.size };
}

function toWebpInText(text) {
  return text
    .replace(/\.jpeg/gi, ".webp")
    .replace(/\.jpg/gi, ".webp")
    .replace(/\.png/gi, ".webp");
}

async function updateReferences() {
  const fixes = [
    ["photos/地藏王菩薩.webp", "photos/地藏王菩薩-1f.webp"]
  ];
  for (const rel of REF_FILES) {
    const filePath = path.join(ROOT, rel);
    if (!(await exists(filePath))) continue;
    let text = await fs.readFile(filePath, "utf8");
    const next = toWebpInText(text);
    let patched = fixes.reduce((acc, [from, to]) => acc.replaceAll(from, to), next);
    if (patched !== text) {
      await fs.writeFile(filePath, patched, "utf8");
      console.log(`  updated refs: ${rel}`);
    }
  }
}

async function main() {
  const inputs = [];
  for (const relRoot of SCAN_ROOTS) {
    const dir = path.join(ROOT, relRoot);
    if (await exists(dir)) inputs.push(...(await collectImages(dir)));
  }
  const committee = path.join(ROOT, "committee.png");
  if (await exists(committee)) inputs.push(committee);

  let totalSrc = 0;
  let totalOut = 0;
  const lines = [];

  for (const inputPath of inputs) {
    const rel = path.relative(ROOT, inputPath).replace(/\\/g, "/");
    const webpPath = inputPath.replace(IMAGE_EXT, ".webp");
    const preset = PRESETS[presetFor(rel)];
    const result = await optimizeOne(inputPath, webpPath, preset);
    totalSrc += result.srcBytes;
    totalOut += result.outBytes;
    lines.push(
      `  ${rel.replace(IMAGE_EXT, ".webp")}  ${(result.outBytes / 1024).toFixed(0)} KB  (was ${(result.srcBytes / 1024).toFixed(0)} KB)`
    );
  }

  console.log(`Optimized ${inputs.length} site images`);
  console.log(lines.join("\n"));
  console.log(
    `\nTotal: ${(totalSrc / 1024 / 1024).toFixed(1)} MB -> ${(totalOut / 1024 / 1024).toFixed(1)} MB WebP`
  );

  console.log("\nUpdating HTML/CSS/JS references...");
  await updateReferences();
  console.log("Done. Commit .webp files and deploy.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
