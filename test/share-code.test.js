import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { codeToPreset, needsCanvas } from "../src/cursor-smith.js";

function extractExampleShareCode(readme) {
  const heading = "## Example share code";
  const start = readme.indexOf(heading);
  assert.notEqual(start, -1, "README missing Example share code section");
  const fenceStart = readme.indexOf("```", start + heading.length);
  assert.notEqual(fenceStart, -1, "README missing fenced share code");
  const codeStart = readme.indexOf("\n", fenceStart) + 1;
  const fenceEnd = readme.indexOf("```", codeStart);
  assert.notEqual(fenceEnd, -1, "README share code fence not closed");
  return readme.slice(codeStart, fenceEnd).trim();
}

test("README Example share code is one line and decodes to the Teal Beam on the lite path", async () => {
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
  const code = extractExampleShareCode(readme);
  assert.doesNotMatch(code, /\s/, "one line");
  const decoded = codeToPreset(code);
  assert.ok(decoded, "share code should decode");
  assert.equal(decoded.name, "Teal");
  assert.equal(decoded.snap.cursorStyle, "Beam");
  assert.equal(decoded.snap.colorLight, "#00695e");
  assert.equal(decoded.snap.colorDark, "#5eead4");
  assert.equal(decoded.snap.glow, true);
  assert.equal(needsCanvas(decoded.snap), false);
});

test("the sentence above the README code says where to paste it and what Look shows", async () => {
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
  const section = readme.slice(readme.indexOf("## Example share code"), readme.indexOf("```", readme.indexOf("## Example share code")));
  assert.match(section, /Share code to import/);
  assert.match(section, /Look menu then shows Teal/);
});
