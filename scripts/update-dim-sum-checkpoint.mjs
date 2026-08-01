#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = new Map();

for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}

const start = args.get("--start");
const end = args.get("--end");

if (!/^\d{4}$/.test(start ?? "") || !/^\d{4}$/.test(end ?? "")) {
  throw new Error("Usage: node scripts/update-dim-sum-checkpoint.mjs --start 3061 --end 3090");
}

if (Number(end) - Number(start) !== 29) {
  throw new Error(`Expected one consecutive thirty-image batch, received ${start}-${end}`);
}

const indexPath = path.join(root, "dim-sum", "index.json");
const catalog = JSON.parse(fs.readFileSync(indexPath, "utf8"));
const total = catalog.total;
const targetTotal = 4000;

if (!Number.isInteger(total) || total < 1 || total > targetTotal) {
  throw new Error(`Invalid catalog total in dim-sum/index.json: ${total}`);
}

const remaining = targetTotal - total;
const formattedRemaining = remaining.toLocaleString("en-US");
const formattedTotal = total.toLocaleString("en-US");

function replaceExactly(text, pattern, replacement, label) {
  const matches = text.match(new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`));
  if (matches?.length !== 1) {
    throw new Error(`${label}: expected exactly one match, found ${matches?.length ?? 0}`);
  }
  return text.replace(pattern, replacement);
}

function update(relativePath, transforms) {
  const target = path.join(root, relativePath);
  let text = fs.readFileSync(target, "utf8");

  for (const [pattern, replacement, label] of transforms) {
    text = replaceExactly(text, pattern, replacement, `${relativePath} ${label}`);
  }

  fs.writeFileSync(target, text, "utf8");
}

update("HANDOFF.md", [
  [
    /- The current exact (?:five|thirty)-image batch adds `\d{4}` through `\d{4}`\./,
    `- The current exact thirty-image batch adds \`${start}\` through \`${end}\`.`,
    "batch range",
  ],
  [
    /- The current tracked and indexed checkpoint is [\d,]+ exact native PNGs\. Another [\d,]+ images remain\./,
    `- The current tracked and indexed checkpoint is ${formattedTotal} exact native PNGs. Another ${formattedRemaining} images remain.`,
    "totals",
  ],
]);

update("dim-sum/README.md", [
  [
    /The current revision records [\d,]+ indexed native ImageGen PNGs, with [\d,]+ images still to generate\./,
    `The current revision records ${formattedTotal} indexed native ImageGen PNGs, with ${formattedRemaining} images still to generate.`,
    "live totals",
  ],
  [
    /The current exact (?:five|thirty)-image batch adds `\d{4}` through `\d{4}`, advancing the live checkpoint to [\d,]+\./,
    `The current exact thirty-image batch adds \`${start}\` through \`${end}\`, advancing the live checkpoint to ${formattedTotal}.`,
    "current checkpoint",
  ],
]);

update("docs/features/product/dim-sum-catalog.md", [
  [/\| Indexed native PNGs \| [\d,]+ \|/, `| Indexed native PNGs | ${formattedTotal} |`, "indexed total"],
  [/\| Images remaining \| [\d,]+ \|/, `| Images remaining | ${formattedRemaining} |`, "remaining total"],
  [
    /\| Newly added images in this push \| `\d{4}` through `\d{4}`, exactly (?:5|30) \|/,
    `| Newly added images in this push | \`${start}\` through \`${end}\`, exactly 30 |`,
    "new batch",
  ],
  [
    /\| Indexed second-cleanup subset at [\d,]+ images \| 174 corrected records carried forward; current additions `\d{4}` through `\d{4}` add no new cleanup records \|/,
    `| Indexed second-cleanup subset at ${formattedTotal} images | 174 corrected records carried forward; current additions \`${start}\` through \`${end}\` add no new cleanup records |`,
    "cleanup checkpoint",
  ],
  [
    /the current batch consists only of `\d{4}` through `\d{4}`\./,
    `the current batch consists only of \`${start}\` through \`${end}\`.`,
    "batch narrative",
  ],
  [
    /At the [\d,]+-image checkpoint, 174 records from the second cleanup remain indexed; current additions `\d{4}` through `\d{4}` add no new cleanup records\./,
    `At the ${formattedTotal}-image checkpoint, 174 records from the second cleanup remain indexed; current additions \`${start}\` through \`${end}\` add no new cleanup records.`,
    "cleanup narrative",
  ],
  [
    /- `index\.json` and `image-manifest\.json` both report [\d,]+;/,
    `- \`index.json\` and \`image-manifest.json\` both report ${formattedTotal};`,
    "verification totals",
  ],
  [
    /- `index\.json` contains [\d,]+ in-progress records backed by [\d,]+ tracked native PNGs;/,
    `- \`index.json\` contains ${formattedTotal} in-progress records backed by ${formattedTotal} tracked native PNGs;`,
    "verification records",
  ],
  [
    /- the five additions are `\d{4}` through `\d{4}`;/,
    `- the five additions are \`${start}\` through \`${end}\`;`,
    "verification batch",
  ],
  [/- [\d,]+ images remain\./, `- ${formattedRemaining} images remain.`, "verification remaining"],
]);

update("wiki/Handoff.md", [
  [
    /- The current exact five-image batch adds `\d{4}` through `\d{4}`\./,
    `- The current exact five-image batch adds \`${start}\` through \`${end}\`.`,
    "batch range",
  ],
  [
    /- The current tracked and indexed checkpoint contains [\d,]+ exact native PNGs\. Another [\d,]+ remain\./,
    `- The current tracked and indexed checkpoint contains ${formattedTotal} exact native PNGs. Another ${formattedRemaining} remain.`,
    "totals",
  ],
  [
    /- \[x\] The current catalog checkpoint adds exactly `\d{4}` through `\d{4}`, advances both machine-readable totals to [\d,]+, leaves [\d,]+ images remaining, keeps `catalogStatus: "in-progress"`, and has no `CATALOG_COMPLETE`\./,
    `- [x] The current catalog checkpoint adds exactly \`${start}\` through \`${end}\`, advances both machine-readable totals to ${formattedTotal}, leaves ${formattedRemaining} images remaining, keeps \`catalogStatus: "in-progress"\`, and has no \`CATALOG_COMPLETE\`.`,
    "verification checklist",
  ],
]);

console.log(`Updated checkpoint documentation for ${start}-${end}: ${formattedTotal}/${targetTotal.toLocaleString('en-US')} (${formattedRemaining} remaining).`);
