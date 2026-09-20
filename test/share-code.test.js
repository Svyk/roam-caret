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

test("README Example share code decodes to Beam preset with lite path", async () => {
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
  const code = extractExampleShareCode(readme);
  const decoded = codeToPreset(code);
  assert.ok(decoded, "share code should decode");
  assert.equal(decoded.name, "Example");
  assert.equal(decoded.snap.cursorStyle, "Beam");
  assert.equal(decoded.snap.colorLight, "#00695e");
  assert.equal(decoded.snap.colorDark, "#48d0c0");
  assert.equal(decoded.snap.caretWidthPx, 3);
  assert.equal(decoded.snap.glow, true);
  assert.equal(decoded.snap.blinkingEnabled, false);
  assert.equal(needsCanvas(decoded.snap), false);
});
