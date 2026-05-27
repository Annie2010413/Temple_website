/**
 * Generate WebP (+ map thumbnails) for puzzle assets.
 * Run from Temple_website: npm run optimize:images
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ASSETS = path.join(ROOT, "services", "puzzle", "pages", "challenge", "assets");

const PRESETS = {
  thumb: { maxWidth: 480, quality: 78 },
  display: { maxWidth: 1280, quality: 80 },
  ar: { maxWidth: 1920, quality: 82 },
  inventory: { maxWidth: 512, quality: 78 }
};

const IMAGE_EXT = /\.(png|jpe?g)$/i;

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function optimizeOne(inputPath, outputPath, preset) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  const pipeline = sharp(inputPath).rotate().resize({
    width: preset.maxWidth,
    height: preset.maxWidth,
    fit: "inside",
    withoutEnlargement: true
  });
  await pipeline.webp({ quality: preset.quality, effort: 4 }).toFile(outputPath);
  const [srcStat, outStat] = await Promise.all([fs.stat(inputPath), fs.stat(outputPath)]);
  return { srcBytes: srcStat.size, outBytes: outStat.size };
}

async function collectImages(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectImages(full)));
    } else if (IMAGE_EXT.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

function presetFor(filePath) {
  const rel = path.relative(ASSETS, filePath).replace(/\\/g, "/");
  if (rel.startsWith("ar/")) return "ar";
  if (rel.startsWith("qr/")) return "inventory";
  return "display";
}

async function main() {
  if (!(await exists(ASSETS))) {
    console.error("Assets folder not found:", ASSETS);
    process.exit(1);
  }

  const files = await collectImages(ASSETS);
  let totalSrc = 0;
  let totalOut = 0;
  const lines = [];

  for (const inputPath of files) {
    const rel = path.relative(ASSETS, inputPath).replace(/\\/g, "/");
    const base = rel.replace(IMAGE_EXT, "");
    const presetKey = presetFor(inputPath);
    const preset = PRESETS[presetKey];

    const webpRel = `${base}.webp`;
    const webpPath = path.join(ASSETS, webpRel);
    const mainResult = await optimizeOne(inputPath, webpPath, preset);
    totalSrc += mainResult.srcBytes;
    totalOut += mainResult.outBytes;
    lines.push(`  ${webpRel}  ${(mainResult.outBytes / 1024).toFixed(0)} KB  (was ${(mainResult.srcBytes / 1024).toFixed(0)} KB)`);

    if (rel.startsWith("picture/")) {
      const thumbRel = `picture/thumbs/${path.basename(base)}.webp`;
      const thumbPath = path.join(ASSETS, thumbRel);
      const thumbResult = await optimizeOne(inputPath, thumbPath, PRESETS.thumb);
      totalOut += thumbResult.outBytes;
      lines.push(`  ${thumbRel}  ${(thumbResult.outBytes / 1024).toFixed(0)} KB`);
    }
  }

  console.log(`Optimized ${files.length} source images under assets/`);
  console.log(lines.join("\n"));
  console.log(
    `\nTotal: ${(totalSrc / 1024 / 1024).toFixed(1)} MB -> ${(totalOut / 1024 / 1024).toFixed(1)} MB WebP outputs`
  );
  console.log("\nNext: commit .webp files; PNG originals can stay for local re-runs of this script.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
