import { build as esbuild } from "esbuild";
import { copyFile, mkdir, readFile, rm, watch, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const thisFile = fileURLToPath(import.meta.url);
const defaultRoot = dirname(thisFile);

const rejectRemoteImports = {
  name: "reject-remote-imports",
  setup(build) {
    build.onResolve({ filter: /^(?:https?:)?\/\// }, ({ path }) => ({
      errors: [{ text: `Remote import is not allowed in a self-contained Roam extension: ${path}` }],
    }));
  },
};

export const externalCursorEngine = {
  name: "external-cursor-engine",
  setup(build) {
    build.onResolve({ filter: /[/\\]cursor-engine\.js$/ }, () => ({
      path: "./engine.js",
      external: true,
    }));
  },
};

export async function bundleEntry({
  rootDirectory = defaultRoot,
  entryPoint = "src/extension.js",
  banner = "",
  plugins = [],
} = {}) {
  const outfile = entryPoint.endsWith("cursor-engine.js") ? "engine.js" : "extension.js";
  const result = await esbuild({
    absWorkingDir: resolve(rootDirectory),
    entryPoints: [entryPoint],
    bundle: true,
    write: false,
    outfile,
    format: "esm",
    platform: "browser",
    target: ["es2020"],
    charset: "utf8",
    legalComments: "none",
    minify: false,
    sourcemap: false,
    treeShaking: true,
    logLevel: "silent",
    plugins: [rejectRemoteImports, ...plugins],
    banner: banner ? { js: banner } : undefined,
  });
  const output = result.outputFiles.find((file) => file.path.endsWith(outfile));
  if (!output) throw new Error(`esbuild did not emit ${outfile}`);
  return output.text;
}

export async function renderArtifacts(rootDirectory = defaultRoot) {
  const packageMetadata = JSON.parse(await readFile(resolve(rootDirectory, "package.json"), "utf8"));
  const banner = `/* Roam Caret v${packageMetadata.version} | MIT | generated; edit src/ */`;
  const [javascript, engineJavascript, css] = await Promise.all([
    bundleEntry({ rootDirectory, banner, plugins: [externalCursorEngine] }),
    bundleEntry({ rootDirectory, entryPoint: "src/cursor-engine.js", banner }),
    readFile(resolve(rootDirectory, "src/extension.css"), "utf8"),
  ]);
  return { javascript, engineJavascript, css };
}

export async function build(rootDirectory = defaultRoot) {
  const { javascript, engineJavascript, css } = await renderArtifacts(rootDirectory);
  const deployDir = resolve(rootDirectory, "deploy");
  await Promise.all([
    writeFile(resolve(rootDirectory, "extension.js"), javascript, "utf8"),
    writeFile(resolve(rootDirectory, "engine.js"), engineJavascript, "utf8"),
    writeFile(resolve(rootDirectory, "extension.css"), css, "utf8"),
  ]);
  await rm(deployDir, { recursive: true, force: true });
  await mkdir(deployDir, { recursive: true });
  await Promise.all([
    writeFile(resolve(deployDir, "extension.js"), javascript, "utf8"),
    writeFile(resolve(deployDir, "engine.js"), engineJavascript, "utf8"),
    writeFile(resolve(deployDir, "extension.css"), css, "utf8"),
    ...["README.md", "CHANGELOG.md", "LICENSE"].map((name) => (
      copyFile(resolve(rootDirectory, name), resolve(deployDir, name))
    )),
    writeFile(resolve(deployDir, ".nojekyll"), "", "utf8"),
  ]);
  process.stdout.write(`Built extension.js, engine.js, extension.css, and ${deployDir}\n`);
}

export async function verifyGeneratedArtifacts(rootDirectory = defaultRoot) {
  const expected = await renderArtifacts(rootDirectory);
  const comparisons = [
    ["extension.js", expected.javascript],
    ["engine.js", expected.engineJavascript],
    ["extension.css", expected.css],
    ["deploy/extension.js", expected.javascript],
    ["deploy/engine.js", expected.engineJavascript],
    ["deploy/extension.css", expected.css],
    ["deploy/README.md", await readFile(resolve(rootDirectory, "README.md"), "utf8")],
    ["deploy/CHANGELOG.md", await readFile(resolve(rootDirectory, "CHANGELOG.md"), "utf8")],
    ["deploy/LICENSE", await readFile(resolve(rootDirectory, "LICENSE"), "utf8")],
    ["deploy/.nojekyll", ""],
  ];
  const drift = [];
  for (const [filename, expectedContent] of comparisons) {
    let actual;
    try {
      actual = await readFile(resolve(rootDirectory, filename), "utf8");
    } catch {
      drift.push(`${filename} is missing`);
      continue;
    }
    if (actual !== expectedContent) drift.push(`${filename} is stale`);
  }
  if (drift.length) throw new Error(`Generated artifact drift:\n- ${drift.join("\n- ")}`);
}

async function main() {
  await build();
  if (!process.argv.includes("--watch")) return;
  process.stdout.write("Watching src/ for changes. Press Ctrl-C to stop.\n");
  const watcher = watch(resolve(defaultRoot, "src"), { recursive: true });
  let pending = Promise.resolve();
  for await (const event of watcher) {
    if (!event.filename || !/\.(?:js|css)$/.test(event.filename)) continue;
    pending = pending.then(() => build(), () => build());
    await pending;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === thisFile) await main();
