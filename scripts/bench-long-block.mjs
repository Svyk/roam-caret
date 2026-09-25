#!/usr/bin/env node
// Mirror-measure cost on long blocks, in a throwaway headless Chrome (never
// Roam). Each sample appends one character, puts the caret at the end, lets
// the host lay out, then times measurer.measure(): mirror write, its one
// layout, every geometry read. The page is cross-origin isolated, so
// performance.now() is precise to a few microseconds.
//
// --verify instead checks the split mirror against a one-block reference
// mirror on random text, newlines and caret positions.
//
// Usage: node scripts/bench-long-block.mjs [--sizes 2000,5000,10000] [--iterations 300] [--json] [--verify]
// Browser: CHROME_PATH, else Playwright's headless shell, else Google Chrome.
import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : fallback;
};
const sizes = option("sizes", "2000,5000,10000").split(",").map(Number);
const iterations = Number(option("iterations", "300"));
const asJson = args.includes("--json");
const verify = args.includes("--verify");

function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const cache = join(homedir(), "Library/Caches/ms-playwright");
  if (existsSync(cache)) {
    const shells = readdirSync(cache).filter((name) => name.startsWith("chromium_headless_shell-")).sort().reverse();
    for (const shell of shells) {
      for (const sub of ["chrome-headless-shell-mac-arm64", "chrome-headless-shell-mac-x64", "chrome-headless-shell-linux64"]) {
        const bin = join(cache, shell, sub, "chrome-headless-shell");
        if (existsSync(bin)) return bin;
      }
    }
  }
  const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  if (existsSync(chrome)) return chrome;
  throw new Error("No Chrome found. Set CHROME_PATH.");
}

const PAGE = `<!doctype html><meta charset="utf-8"><body>
<script type="module">
import { MIRROR_PROPERTIES, createCaretMeasurer } from "/src/caret-measure.js";
const WORDS = "the quick brown fox jumps over a lazy dog while Roam keeps every block in one long textarea".split(" ");
function text(length, paragraph) {
  let out = "";
  let i = 0;
  while (out.length < length) {
    out += WORDS[i % WORDS.length];
    i += 1;
    out += paragraph && out.length % paragraph < 8 ? "\\n" : " ";
  }
  return out.slice(0, length);
}
function stats(times) {
  const sorted = [...times].sort((a, b) => a - b);
  const at = (q) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
  return { median: at(0.5), p95: at(0.95), max: sorted.at(-1) };
}
window.bench = ({ sizes, iterations }) => {
  const host = document.createElement("textarea");
  host.style.cssText = "display:block;width:600px;height:auto;padding:0;border:0;resize:none;"
    + "font:16px/1.5 -apple-system,system-ui,sans-serif;white-space:pre-wrap;overflow-wrap:break-word";
  document.body.append(host);
  const measurer = createCaretMeasurer({ doc: document, win: window });
  const rows = [];
  for (const shape of [{ name: "one paragraph", paragraph: 0 }, { name: "300-char paragraphs", paragraph: 300 }]) {
    for (const size of sizes) {
      const base = text(size, shape.paragraph);
      host.focus();
      const times = [];
      for (let i = 0; i < iterations + 30; i += 1) {
        host.value = base + "x".repeat(i % 40);
        const end = host.value.length;
        host.setSelectionRange(end, end);
        void host.offsetHeight;
        const t0 = performance.now();
        measurer.measure(host);
        const t1 = performance.now();
        if (i >= 30) times.push(t1 - t0);
      }
      rows.push({ shape: shape.name, size, ...stats(times) });
    }
  }
  measurer.dispose();
  host.remove();
  return { isolated: crossOriginIsolated, userAgent: navigator.userAgent, rows };
};
// The pre-0.6 mirror: the whole prefix and the marker in one block.
window.verify = ({ cases }) => {
  const host = document.createElement("textarea");
  host.style.cssText = "display:block;width:420px;height:auto;padding:6px 9px;border:1px solid;resize:none;"
    + "font:15px/1.6 -apple-system,system-ui,sans-serif;white-space:pre-wrap;overflow-wrap:break-word;text-indent:12px";
  document.body.append(host);
  const measurer = createCaretMeasurer({ doc: document, win: window });
  const ref = document.createElement("div");
  const computed = getComputedStyle(host);
  for (const name of MIRROR_PROPERTIES) ref.style[name] = computed[name];
  ref.style.cssText += ";position:absolute;top:0;left:-99999px;visibility:hidden;height:auto;white-space:pre-wrap;overflow-wrap:break-word";
  const refMarker = document.createElement("span");
  refMarker.style.cssText = "display:inline-block;width:0;vertical-align:top";
  refMarker.textContent = "\u200b";
  document.body.append(ref);
  let seed = 7;
  const rand = (n) => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed % n;
  };
  const pieces = ["word ", "longerword ", "a ", "\n", "\n\n", "tab\t", "averyveryverylongunbrokenwordthatwraps "];
  const failures = [];
  let checked = 0;
  for (let c = 0; c < cases; c += 1) {
    let value = rand(4) === 0 ? "\n" : "";
    const count = 1 + rand(120);
    for (let i = 0; i < count; i += 1) value += pieces[rand(pieces.length)];
    host.value = value;
    for (let k = 0; k < 6; k += 1) {
      const start = k === 0 ? 0 : k === 1 ? value.length : rand(value.length + 1);
      host.setSelectionRange(start, start);
      const rect = measurer.measure(host);
      ref.textContent = value.slice(0, start);
      ref.append(refMarker);
      const box = host.getBoundingClientRect();
      const x = box.left + (host.clientLeft + refMarker.offsetLeft - host.scrollLeft);
      const y = box.top + (host.clientTop + refMarker.offsetTop - host.scrollTop);
      checked += 1;
      if (Math.abs(rect.x - x) > 0.5 || Math.abs(rect.y - y) > 0.5) {
        failures.push({ value: JSON.stringify(value.slice(Math.max(0, start - 20), start + 5)), start, got: [rect.x, rect.y], want: [x, y] });
      }
    }
  }
  return { checked, failures: failures.slice(0, 10), failed: failures.length };
};
window.ready = true;
</script>`;

function serve() {
  const server = createServer(async (req, res) => {
    const headers = {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cache-Control": "no-store",
    };
    const url = new URL(req.url, "http://localhost");
    if (url.pathname === "/") {
      res.writeHead(200, { ...headers, "Content-Type": "text/html; charset=utf-8" });
      res.end(PAGE);
      return;
    }
    const file = resolve(root, `.${url.pathname}`);
    if (!file.startsWith(join(root, "src")) || !file.endsWith(".js")) {
      res.writeHead(404, headers);
      res.end();
      return;
    }
    try {
      const body = await readFile(file);
      res.writeHead(200, { ...headers, "Content-Type": "text/javascript; charset=utf-8" });
      res.end(body);
    } catch {
      res.writeHead(404, headers);
      res.end();
    }
  });
  return new Promise((ok) => server.listen(0, "127.0.0.1", () => ok(server)));
}

async function waitForPort(profile, child) {
  const file = join(profile, "DevToolsActivePort");
  for (let i = 0; i < 200; i += 1) {
    if (child.exitCode != null) throw new Error(`Chrome exited with ${child.exitCode}`);
    try {
      const [port] = (await readFile(file, "utf8")).split("\n");
      if (port) return Number(port);
    } catch {
    }
    await new Promise((ok) => setTimeout(ok, 50));
  }
  throw new Error("Chrome did not open a DevTools port");
}

function cdp(url) {
  const socket = new WebSocket(url);
  let id = 0;
  const pending = new Map();
  const events = [];
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { ok, fail } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) fail(new Error(message.error.message));
      else ok(message.result);
    } else if (message.method) {
      events.push(message);
    }
  });
  const opened = new Promise((ok, fail) => {
    socket.addEventListener("open", ok, { once: true });
    socket.addEventListener("error", fail, { once: true });
  });
  return {
    opened,
    send(method, params = {}) {
      id += 1;
      socket.send(JSON.stringify({ id, method, params }));
      return new Promise((ok, fail) => pending.set(id, { ok, fail }));
    },
    close: () => socket.close(),
  };
}

const server = await serve();
const origin = `http://127.0.0.1:${server.address().port}`;
const profile = await mkdtemp(join(tmpdir(), "roam-caret-bench-"));
const chrome = spawn(findChrome(), [
  "--headless=new",
  "--remote-debugging-port=0",
  `--user-data-dir=${profile}`,
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-extensions",
  "about:blank",
], { stdio: "ignore" });

try {
  const port = await waitForPort(profile, chrome);
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = targets.find((target) => target.type === "page");
  const client = cdp(page.webSocketDebuggerUrl);
  await client.opened;
  await client.send("Page.enable");
  await client.send("Page.navigate", { url: `${origin}/` });
  for (let i = 0; i < 200; i += 1) {
    const { result } = await client.send("Runtime.evaluate", { expression: "window.ready === true", returnByValue: true });
    if (result.value) break;
    await new Promise((ok) => setTimeout(ok, 50));
  }
  const expression = verify
    ? `window.verify(${JSON.stringify({ cases: 400 })})`
    : `window.bench(${JSON.stringify({ sizes, iterations })})`;
  const { result, exceptionDetails } = await client.send("Runtime.evaluate", { expression, returnByValue: true });
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || exceptionDetails.text);
  client.close();
  const report = result.value;
  if (verify) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    if (report.failed) process.exitCode = 1;
  } else if (asJson) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    const ms = (value) => value.toFixed(3);
    process.stdout.write(`${report.userAgent}\ncrossOriginIsolated: ${report.isolated}, ${iterations} samples per row\n\n`);
    process.stdout.write("| Block | Characters | Median ms | p95 ms | Max ms |\n|---|---|---|---|---|\n");
    for (const row of report.rows) {
      process.stdout.write(`| ${row.shape} | ${row.size} | ${ms(row.median)} | ${ms(row.p95)} | ${ms(row.max)} |\n`);
    }
  }
} finally {
  chrome.kill();
  server.close();
  await new Promise((ok) => setTimeout(ok, 200));
  await rm(profile, { recursive: true, force: true });
}
