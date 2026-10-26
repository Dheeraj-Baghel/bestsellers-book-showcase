// Exact-source gate: every vendored file must match the registered ThreeUI
// bundle byte-for-byte, the canonical HTML must be the requested revision, and
// the configured <BestsellersBookShowcase /> usage must be exact. Standalone:
// verification reads only files inside this app folder.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import ts from "typescript";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (name) => readFile(path.join(root, name));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

const manifest = JSON.parse(await read("vendor/threeui/provenance.json"));
const bundle = JSON.parse(await read("vendor/threeui/source-bundle.json"));
const canonicalHash = "7c1ed1ca4a4c58f1c33956c84edd8f7ba450ea0312df718701e634a207568138";
assert.equal(manifest.canonicalSha256, canonicalHash);
assert.equal(bundle.id, "bestsellers-book-showcase");
assert.equal(manifest.files.length, 4);

for (const file of manifest.files) {
  const bytes = await read(file.localPath);
  const registered = [...bundle.files, ...(bundle.assets ?? [])].find((entry) => entry.path === file.path);
  assert.ok(registered, `Unregistered file: ${file.path}`);
  assert.equal(file.sha256, registered.sha256, `Manifest hash: ${file.path}`);
  assert.equal(bytes.length, registered.bytes, `Byte length: ${file.path}`);
  assert.equal(sha256(bytes), registered.sha256, `SHA-256: ${file.path}`);
  if (registered.code !== undefined) assert.equal(bytes.toString("utf8"), registered.code, `Complete registered text: ${file.path}`);
  console.log(`PASS ${file.path}`);
}

for (const file of manifest.additionalFiles ?? []) {
  const bytes = await read(file.localPath);
  assert.equal(bytes.length, file.bytes, file.localPath);
  assert.equal(sha256(bytes), file.sha256, file.localPath);
  console.log(`PASS ${file.localPath} (support module)`);
}

// The Bestsellers export used by the app must be verbatim from the registered component file.
const original = (await read("vendor/threeui/src/shaders/landing-pages/LandingPages.tsx")).toString();
const start = original.indexOf("export function BestsellersBookShowcase(");
assert.ok(start > -1, "Registered source must define BestsellersBookShowcase");
const end = original.indexOf("\n}\n", start) + 3;
const entry = (await read("vendor/threeui/BestsellersEntry.tsx")).toString();
assert.equal(
  entry.slice(entry.indexOf("export function BestsellersBookShowcase(")),
  original.slice(start, end),
  "Bestsellers export must remain verbatim",
);

// The configured usage must be exactly what was requested.
const sceneText = (await read("src/Scene.tsx")).toString();
const scene = ts.createSourceFile("Scene.tsx", sceneText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const expectedProps = {
  headingFont: "iowan-old-style", bodyFont: "iowan-old-style", headingWeight: "500", bodyWeight: "400",
  primaryColor: "#c3a47b", headingSize: 325, bodySize: 17, headingLetterSpacing: -0.085,
};
let found = 0;
function visit(node) {
  if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(scene) === "BestsellersBookShowcase") {
    found++;
    const actual = Object.fromEntries(node.attributes.properties.map((attribute) => {
      assert.ok(ts.isJsxAttribute(attribute), "No unverified prop spread");
      const value = attribute.initializer;
      return [attribute.name.getText(scene), ts.isStringLiteral(value) ? value.text : Number(value.expression.getText(scene))];
    }));
    assert.deepEqual(actual, expectedProps, "The configured usage must be exact");
  }
  ts.forEachChild(node, visit);
}
visit(scene);
assert.equal(found, 1);
assert.match(sceneText, /import \{ BestsellersBookShowcase \} from "@designcodeio\/threeui"/);
assert.match(sceneText, /import "@designcodeio\/threeui\/style\.css"/);
assert.match(sceneText, /className="shader-frame"/);

// The served canonical document must be the exact requested revision, and the
// frame must point at its authored URL.
const html = await read("public/landing-pages/bestsellers-book-showcase.html");
assert.equal(sha256(html), canonicalHash);
assert.match(entry, /sourceUrl="\/landing-pages\/bestsellers-book-showcase\.html"/);

// The authored document must be self-contained (embedded media only), so no
// other asset files can be missing.
const text = html.toString("utf8");
const refs = new Set();
const attrRe = /(?:src|href)="([^"]+)"/g;
const urlRe = /url\((['"]?)([^)'"]+)\1\)/g;
let m;
while ((m = attrRe.exec(text))) refs.add(m[1]);
while ((m = urlRe.exec(text))) refs.add(m[2]);
const external = [...refs].filter((u) => !u.startsWith("data:") && !u.startsWith("#") && !u.startsWith("%23"));
assert.deepEqual(external, [], "Canonical HTML must reference no external files");

console.log("PASS verbatim Bestsellers export, all 8 configured props, canonical revision 7c1ed1ca4a4c, self-contained document");
console.log("Exact-source verification complete: 4 registered files + 3 support files.");
