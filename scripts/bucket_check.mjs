#!/usr/bin/env node
// Classify every selector in a stylesheet by the bucket Blink files it under, from its
// rightmost compound: id > class > attribute > tag > universal. A universal-bucket rule
// is tried against every element on every restyle, so a theme sheet should have none
// except bare `:root` token blocks (one failed pseudo-class test per element).
//
// Problems (fail --strict):
//   - a universal subject other than a bare :root token block;
//   - `*` or ::selection after a descendant combinator (a universal match in disguise).
// Review warnings (never fail): an attribute substring (*=, ^=, $=, ~=) in an ANCESTOR
// compound. Each candidate then walks its ancestors and substring-searches each one.
// Cheap when the subject is rare (.rm-query) or the ancestor carries a rare class the
// bloom filter can reject (.rm-zoom); costly on a common subject (.rm-bullet). Check
// those with selector_stats.mjs, or key on a class Roam emits (a #.tag becomes a class).
//
// Usage: node bucket_check.mjs extension.css [--strict]
import { readFile } from "node:fs/promises";

const [file, ...flags] = process.argv.slice(2);
if (!file) {
  process.stderr.write("usage: bucket_check.mjs <sheet.css> [--strict]\n");
  process.exit(2);
}
const strict = flags.includes("--strict");
const css = (await readFile(file, "utf8")).replace(/\/\*[\s\S]*?\*\//g, "");

function split(list) {
  const out = [];
  let depth = 0;
  let current = "";
  for (const ch of list) {
    if ("([".includes(ch)) depth += 1;
    else if (")]".includes(ch)) depth -= 1;
    if (ch === "," && depth === 0) { out.push(current.trim()); current = ""; } else current += ch;
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

const selectors = [];
(function walk(text) {
  let index = 0;
  while (index < text.length) {
    const open = text.indexOf("{", index);
    if (open < 0) break;
    const prelude = text.slice(index, open).trim();
    let depth = 1;
    let close = open + 1;
    while (close < text.length && depth) {
      if (text[close] === "{") depth += 1;
      else if (text[close] === "}") depth -= 1;
      close += 1;
    }
    const body = text.slice(open + 1, close - 1);
    if (/^@(media|layer|supports|container)\b/.test(prelude)) walk(body);
    else if (!prelude.startsWith("@")) selectors.push(...split(prelude));
    index = close;
  }
})(css);

// Top-level compounds, combinators dropped.
function compounds(selector) {
  const parts = [];
  let depth = 0;
  let current = "";
  for (const ch of selector) {
    if ("([".includes(ch)) depth += 1;
    else if (")]".includes(ch)) depth -= 1;
    if (depth === 0 && (/\s/.test(ch) || ">+~".includes(ch))) {
      if (current) parts.push(current);
      current = "";
    } else current += ch;
  }
  if (current) parts.push(current);
  return parts;
}

function stripFunctional(compound) {
  let out = "";
  let depth = 0;
  for (const ch of compound) {
    if (ch === "(") { depth += 1; continue; }
    if (ch === ")") { depth -= 1; continue; }
    if (!depth) out += ch;
  }
  return out.replace(/::?[a-z-]+/gi, "");
}

function bucket(compound) {
  const bare = stripFunctional(compound);
  if (/#[\w-]/.test(bare)) return "id";
  if (/\.[\w\\-]/.test(bare)) return "class";
  if (/\[/.test(bare)) return "attr";
  if (/^[a-z]/i.test(bare)) return "tag";
  return "universal";
}

const counts = { id: 0, class: 0, attr: 0, tag: 0, universal: 0 };
const problems = [];
const warnings = [];
for (const selector of selectors) {
  const parts = compounds(selector);
  const last = parts.at(-1) ?? "";
  const kind = bucket(last);
  counts[kind] += 1;
  if (parts.length > 1 && (/^::selection$/.test(last) || /^\*(::?[a-z-]+)*$/.test(last))) {
    problems.push(`universal descendant: ${selector}`);
  } else if (kind === "universal" && !/^:root(?::not\([^()]*\))*$/.test(last)) {
    problems.push(`universal subject: ${selector}`);
  }
  if (parts.slice(0, -1).some((part) => /\[[^\]]*[*^$~]=/.test(part))) {
    warnings.push(`ancestor attribute substring: ${selector}`);
  }
}

const line = (text) => text.replace(/\s+/g, " ").slice(0, 180);
process.stdout.write(`${file}: ${selectors.length} selectors ${JSON.stringify(counts)}\n`);
process.stdout.write(`problems: ${problems.length}\n`);
for (const problem of problems) process.stdout.write(`  ${line(problem)}\n`);
process.stdout.write(`review (${warnings.length}): cheap only if the subject is rare or the ancestor has a rare class\n`);
for (const warning of warnings) process.stdout.write(`  ${line(warning)}\n`);
if (strict && problems.length) process.exit(1);
