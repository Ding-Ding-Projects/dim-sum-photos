import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const engine = require("../docs/regex-engine.js");
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const docsRoot = path.join(repositoryRoot, "docs");

const unicode = engine.runRegex({
  pattern: "(?<word>[\\p{L}\\p{N}_]+)",
  flags: "gu",
  sample: "Hello 世界 42",
});
assert.deepEqual(
  unicode.matches.map((match) => match.value),
  ["Hello", "世界", "42"],
  "Unicode property escapes should use the production ECMAScript engine",
);
assert.equal(unicode.matches[1].namedGroups.word, "世界", "named captures should be exposed");

const unicodeSets = engine.runRegex({ pattern: "[\\p{ASCII}&&\\p{Letter}]+", flags: "gv", sample: "abc 123 世界" });
assert.deepEqual(unicodeSets.matches.map((match) => match.value), ["abc"], "the ECMAScript Unicode-sets flag should be supported");
const indexed = engine.runRegex({ pattern: "a", flags: "d", sample: "a" });
assert.equal(indexed.flags, "d", "the ECMAScript match-indices flag should be preserved");

const multiline = engine.runRegex({ pattern: "^", flags: "gm", sample: "one\ntwo" });
assert.deepEqual(
  multiline.matches.map((match) => match.index),
  [0, 4],
  "zero-width multiline matches should advance without looping",
);

const noMatch = engine.runRegex({ pattern: "z+", flags: "g", sample: "abc" });
assert.equal(noMatch.matches.length, 0, "no-match input should return an empty list");

const captures = engine.runRegex({ pattern: "(a)(b)?", flags: "g", sample: "a ab" });
assert.deepEqual(captures.matches[0].captures, ["a", null], "unmatched captures should be serializable");

const truncated = engine.runRegex({ pattern: ".", flags: "g", sample: "abcd", maxMatches: 2 });
assert.equal(truncated.matches.length, 2, "the configured match limit should be enforced");
assert.equal(truncated.truncated, true, "limited results should report truncation");

const boundedAdversarial = engine.runRegex({ pattern: "(a+)+$", flags: "", sample: "aaaa" });
assert.equal(boundedAdversarial.matches.length, 1, "a bounded adversarial-pattern fixture should evaluate");

assert.throws(
  () => engine.runRegex({ pattern: "[", flags: "", sample: "invalid" }),
  SyntaxError,
  "invalid syntax should be reported",
);
assert.throws(
  () => engine.runRegex({ pattern: "x".repeat(engine.MAX_PATTERN_LENGTH + 1), flags: "", sample: "" }),
  RangeError,
  "oversized patterns should be rejected",
);
assert.throws(
  () => engine.runRegex({ pattern: ".", flags: "", sample: "x".repeat(engine.MAX_SAMPLE_LENGTH + 1) }),
  RangeError,
  "oversized samples should be rejected",
);

const html = await readFile(new URL("../docs/regex-builder.html", import.meta.url), "utf8");
const controller = await readFile(new URL("../docs/regex-builder.js", import.meta.url), "utf8");
const worker = await readFile(new URL("../docs/regex-worker.js", import.meta.url), "utf8");
const instructions = await readFile(new URL("../memory/SHARED_INSTRUCTIONS.md", import.meta.url), "utf8");
const tabNavigation = await readFile(new URL("../docs/features/product/tab-navigation.md", import.meta.url), "utf8");
const appearanceEditors = await readFile(new URL("../docs/features/product/appearance-editors.md", import.meta.url), "utf8");
const cliRouting = await readFile(new URL("../docs/features/operations/cli-routing.md", import.meta.url), "utf8");
const bootstrap = await readFile(new URL("../AGENTS.md", import.meta.url), "utf8");

for (const language of ["en", "yue", "bilingual"]) {
  assert.match(html, new RegExp(`value=["']${language}["']`), `language option ${language} should exist`);
}
for (const control of ["pattern", "sample", "token-grid", "copy-regex", "highlight-output", "match-list"]) {
  assert.match(html, new RegExp(`id=["']${control}["']`), `builder control ${control} should exist`);
}
assert.match(controller, /new Worker\(["']\.\/regex-worker\.js["']\)/, "evaluation should use an isolated worker");
assert.match(controller, /WORKER_TIMEOUT_MS\s*=\s*300/, "worker evaluation should have a concrete timeout");
assert.match(controller, /localStorage\.setItem\(LANGUAGE_STORAGE_KEY, activeLanguage\)/, "only language mode should persist");
assert.match(worker, /RegexBuilderEngine\.runRegex/, "the worker should call the tested engine");
assert.match(instructions, /Every new and existing project must include a usable regex builder/, "global instructions should require the builder");
assert.match(instructions, /Every search bar must provide direct access to this full-featured builder/, "global instructions should cover every search bar");
assert.match(instructions, /\*\*Close tabs containing text\*\*/, "global instructions should require the containing-text close action");
assert.match(instructions, /\*\*Close tabs not containing text\*\*/, "global instructions should require the inverse close action");
assert.match(instructions, /Regex use is optional for the user, but builder availability is mandatory for both actions/, "both close actions should ship the full builder");
assert.match(instructions, /inverse action negates the exact same match predicate/, "both close actions should share one predicate");
assert.match(instructions, /Bulk-close never runs on an empty query or invalid pattern/, "invalid and empty bulk closes should be blocked");
assert.match(instructions, /affected-tab count with a reviewable preview/, "bulk close should preview the affected set");
assert.match(instructions, /exclude pinned tabs by default/, "pinned tabs should be excluded by default");
assert.match(instructions, /preserve each tab's existing unsaved-work protection/, "bulk close should preserve unsaved-work protection");
assert.match(tabNavigation, /Plain-text matching is the default/, "tab close should remain plain-text-first");
assert.match(tabNavigation, /full builder is a required part of both actions/, "tab close documentation should make full builder availability mandatory");
assert.match(tabNavigation, /keyboard reachable and screen-reader named/, "tab close documentation should include accessibility");
assert.match(instructions, /\*\*Every app provides all four tab-discovery searches:\*\*/, "every app should provide four tab search scopes");
for (const searchScope of ["current tab strip", "every individual tab group", "search for tab groups", "master tab search"]) {
  assert.match(instructions, new RegExp(searchScope), `global instructions should require ${searchScope}`);
}
assert.match(instructions, /\*\*Pinning is first-class\.\*\*/, "tab pinning should be first-class");
assert.match(instructions, /\*\*Grouping is first-class\.\*\*/, "tab grouping should be first-class");
assert.match(instructions, /Groups are fully decoratable appearance targets/, "tab groups should be fully decoratable");
assert.match(instructions, /Every app ships a first-class appearance editor for \*\*every rendered element\*\*/, "appearance editing should cover every element");
assert.match(instructions, /Shift\+right-click to open the editor directly/, "tabs should support direct modified-click appearance editing");
assert.match(instructions, /non-modal anchored dialog or popover beside the exact element or tab/, "appearance editors should stay anchored to their target");
assert.match(instructions, /every installed and bundled font is searchable and selectable/, "appearance editors should expose every installed font");
assert.match(instructions, /Typography editing reaches a Microsoft Word-style depth/, "typography editing should meet the Word-depth contract");
assert.match(instructions, /Every color control uses an \*\*infinite color picker\*\*/, "color controls should use the infinite picker");
assert.match(instructions, /built-in color translator/, "color controls should include translation");
for (const colorSpace of ["HEX/HEX8", "RGB/RGBA", "HSL/HSLA", "HSV/HSB", "HWB", "CIELAB/LCH", "OKLab/OKLCH", "CMYK"]) {
  assert.match(instructions, new RegExp(colorSpace.replace("/", "\\/")), `color translator should support ${colorSpace}`);
}
assert.match(appearanceEditors, /normal right-click and Shift\+right-click direct access/, "appearance documentation should cover both pointer routes");
assert.match(tabNavigation, /Current tab-strip search/, "tab documentation should cover strip search");
assert.match(tabNavigation, /Per-group tab search/, "tab documentation should cover per-group search");
assert.match(tabNavigation, /Tab-group search/, "tab documentation should cover group search");
assert.match(tabNavigation, /Master tab search/, "tab documentation should cover master search");
assert.match(instructions, /ALWAYS use the `git` CLI/, "global instructions should require the git CLI");
assert.match(instructions, /`gh` CLI for GitHub operations/, "global instructions should require the gh CLI");
assert.match(cliRouting, /GitHub plugin, connector, app, MCP server, browser session, or raw API client/, "CLI routing docs should reject alternate integrations");
assert.match(bootstrap, /https:\/\/github\.com\/Ding-Ding-Projects\/agent-global-memory\.git/, "bootstrap should recognize the Ding-Ding-Projects canonical origin");

for (const key of new Set([
  ...Array.from(html.matchAll(/data-i18n=["']([^"']+)["']/g), (match) => match[1]),
  ...Array.from(html.matchAll(/data-i18n-aria=["']([^"']+)["']/g), (match) => match[1]),
])) {
  const definitionCount = Array.from(controller.matchAll(new RegExp(`^\\s+${key}:`, "gm"))).length;
  assert.equal(definitionCount, 2, `translation key ${key} should exist in English and Cantonese`);
}

for (const htmlName of ["index.html", "regex-builder.html"]) {
  const htmlPath = path.join(docsRoot, htmlName);
  const page = await readFile(htmlPath, "utf8");
  const ids = Array.from(page.matchAll(/\bid=["']([^"']+)["']/g), (match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, `${htmlName} should not contain duplicate IDs`);

  const references = Array.from(page.matchAll(/\b(?:href|src)=["']([^"']+)["']/g), (match) => match[1]);
  for (const reference of references) {
    if (/^(?:https?:|mailto:|data:)/.test(reference)) {
      continue;
    }

    const [relativePath, fragment] = reference.split("#", 2);
    if (!relativePath) {
      assert(ids.includes(fragment), `${htmlName} should contain local anchor #${fragment}`);
      continue;
    }

    const resolved = path.resolve(path.dirname(htmlPath), decodeURIComponent(relativePath));
    assert(resolved.startsWith(docsRoot + path.sep), `${htmlName} reference should remain inside docs/: ${reference}`);
    await access(resolved);
  }
}

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? collectFiles(entryPath) : [entryPath];
  }));
  return nested.flat();
}

for (const file of await collectFiles(docsRoot)) {
  const publicText = await readFile(file, "utf8");
  assert.doesNotMatch(
    publicText,
    /\b(?:10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})\b/,
    `public documentation should not expose a private IPv4 address: ${path.relative(repositoryRoot, file)}`,
  );
}

console.log("PASS: regex engine, tab/search/appearance policies, CLI routing, canonical provenance, links, privacy, and global contract");
