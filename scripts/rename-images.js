/**
 * One-time cleanup script.
 *
 * The images exported into /public/Love and /public/Baneers use names like
 * "Love (1).png" and "Baneer (11).png". Spaces and parentheses in a
 * filename have to be percent-encoded in a URL, which makes them error
 * prone to reference from code (and ugly to read). This script renames
 * them in place to plain, URL-safe names:
 *
 *   public/Love/Love (1).png     -> public/Love/love-1.png
 *   public/Love/Love (2).png     -> public/Love/love-2.png
 *   ...
 *   public/Baneers/Baneer (1).png  -> public/Baneers/banner-1.png
 *   public/Baneers/Baneer (11).png -> public/Baneers/banner-2.png
 *   ...
 *
 * Banner files are renumbered in ascending order of their original number
 * (1, 11, 12, 13, 14, 15, 16, 17, 18 -> banner-1 .. banner-9) so the final
 * names are contiguous.
 *
 * Usage (run once from the project root):
 *   node scripts/rename-images.js
 *
 * Safe to run more than once — anything already renamed, or missing, is
 * skipped instead of throwing.
 */
/* eslint-disable @typescript-eslint/no-require-imports -- standalone CommonJS
   Node script, run directly via `node scripts/rename-images.js`, not bundled
   by Next.js/TypeScript, so ESM import syntax isn't applicable here. */
const fs = require("fs");
const path = require("path");

const PUBLIC_DIR = path.join(__dirname, "..", "public");

function renameSet({ dir, pattern, targetPrefix }) {
  const folder = path.join(PUBLIC_DIR, dir);

  if (!fs.existsSync(folder)) {
    console.log(`Skipping "${dir}" — folder not found at ${folder}`);
    return;
  }

  const matches = fs
    .readdirSync(folder)
    .map((file) => {
      const m = file.match(pattern);
      return m ? { file, num: parseInt(m[1], 10) } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.num - b.num);

  if (matches.length === 0) {
    console.log(`  nothing to rename in "${dir}" (already renamed, or no matching files)`);
    return;
  }

  matches.forEach((entry, index) => {
    const from = path.join(folder, entry.file);
    const ext = path.extname(entry.file);
    const newName = `${targetPrefix}-${index + 1}${ext}`;
    const to = path.join(folder, newName);

    if (fs.existsSync(to)) {
      console.log(`  already exists, skipping: ${newName}`);
      return;
    }

    fs.renameSync(from, to);
    console.log(`  ${entry.file}  ->  ${newName}`);
  });
}

console.log("Renaming Love images (public/Love)...");
renameSet({
  dir: "Love",
  pattern: /^Love \((\d+)\)\.png$/i,
  targetPrefix: "love",
});

console.log("\nRenaming Banner images (public/Baneers)...");
renameSet({
  dir: "Baneers",
  pattern: /^Baneer \((\d+)\)\.png$/i,
  targetPrefix: "banner",
});

console.log("\nDone. Your images now match the paths used in HeroSection.tsx and LoveGallery.tsx.");