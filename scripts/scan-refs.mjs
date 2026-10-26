// Development aid: list every non-data: URL the canonical HTML references, so the
// standalone app can confirm the document is fully self-contained (or vendor the
// referenced runtime files). Not part of the build.
import fs from "node:fs";

const target = process.argv[2] ?? "public/landing-pages/bestsellers-book-showcase.html";
const html = fs.readFileSync(target, "utf8");
const refs = new Set();
const attrRe = /(?:src|href)="([^"]+)"/g;
const urlRe = /url\((['"]?)([^)'"]+)\1\)/g;
let m;
while ((m = attrRe.exec(html))) refs.add(m[1]);
while ((m = urlRe.exec(html))) refs.add(m[2]);
const external = [...refs].filter((u) => !u.startsWith("data:") && !u.startsWith("#") && !u.startsWith("javascript:"));
console.log(external.length ? external.join("\n") : "(no external refs — fully self-contained)");
