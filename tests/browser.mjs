// Real-browser verification of the standalone Field Manuals showcase.
// Serves the production build on 4334, then checks the authored document,
// typography customization, interactions, and embedded media inside the frame.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { chromium } from "@playwright/test";

const root = fileURLToPath(new URL("../", import.meta.url));
const PORT = 4334;
const BASE = `http://127.0.0.1:${PORT}`;
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".woff2": "font/woff2",
  ".json": "application/json",
};

// Hard cap: a hung browser must fail, not hang the test run forever.
const watchdog = setTimeout(() => {
  console.error("FAIL global watchdog: run exceeded 240s");
  process.exit(1);
}, 240000);
watchdog.unref();

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, BASE);
    let file = decodeURIComponent(url.pathname);
    if (file === "/favicon.ico") {
      // Real Chrome probes for a favicon; the app intentionally has none.
      res.writeHead(204);
      res.end();
      return;
    }
    if (file === "/") file = "/index.html";
    let bytes;
    try {
      bytes = await readFile(path.join(root, "dist", file));
    } catch {
      bytes = await readFile(path.join(root, "public", file));
    }
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] ?? "application/octet-stream" });
    res.end(bytes);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
});
await new Promise((resolve) => server.listen(PORT, "127.0.0.1", resolve));

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
  assert.ok(ok, name);
};

// Real Chrome: the authored document embeds H.264 MP4 clips, which the
// codec-free Playwright Chromium shell cannot decode.
const browser = await chromium.launch({ channel: "chrome" });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`${message.text()} @ ${message.location().url}`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });

  // 1. The app serves and mounts the configured component.
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForSelector('.landing-page-frame[data-state="ready"]', { timeout: 30000 });
  check("app loads and landing frame reports ready", true);

  // 2. The iframe loads the canonical authored document byte-for-byte.
  const frameElement = await page.$(".landing-page-frame iframe");
  const src = await frameElement.getAttribute("src");
  check("frame loads authored source URL", src === "/landing-pages/bestsellers-book-showcase.html", String(src));
  const served = await page.evaluate(async (url) => {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    return { bytes: buffer.byteLength, hash: [...new Uint8Array(await crypto.subtle.digest("SHA-256", buffer))].map((b) => b.toString(16).padStart(2, "0")).join("") };
  }, src);
  check(
    "served canonical HTML matches registered revision",
    served.hash === "7c1ed1ca4a4c58f1c33956c84edd8f7ba450ea0312df718701e634a207568138" && served.bytes === 3546441,
    `${served.bytes} bytes, sha ${served.hash.slice(0, 12)}`,
  );

  const frame = await frameElement.contentFrame();
  await frame.waitForSelector(".hero-word", { timeout: 30000 });

  // 3. Authored structure is present.
  const structure = await frame.evaluate(() => ({
    title: document.title,
    heroWord: document.querySelector(".hero-word")?.textContent?.trim(),
    books: document.querySelectorAll(".book-card").length,
    videos: document.querySelectorAll("video").length,
    brand: document.querySelector(".brand")?.textContent?.trim(),
    menuButton: Boolean(document.querySelector(".icon-button")),
    blossoms: document.querySelectorAll(".blossom").length,
  }));
  check("authored document title", structure.title === "Field Manuals — Tools for Thought", structure.title);
  check("hero word present", Boolean(structure.heroWord), structure.heroWord);
  check("book gallery present", structure.books > 0, `${structure.books} book cards`);
  check("embedded media present", structure.videos === 3, `${structure.videos} videos`);
  check("brand and menu chrome present", Boolean(structure.brand) && structure.menuButton, structure.brand);

  // 4. The typography/colour customization stylesheet was appended with the
  //    configured values (heading 325px ceiling, -0.085em, #c3a47b primary).
  const custom = await frame.evaluate(() => document.getElementById("threeui-page-typography")?.textContent ?? "");
  check("customization stylesheet appended", custom.length > 0);
  check("configured primary colour applied", custom.includes("#c3a47b"), "#c3a47b in override sheet");
  check("configured heading size applied", custom.includes("325px"), "clamp ceiling 325px");
  check("configured letter spacing applied", custom.includes("-0.085em"), "-0.085em");
  const heroFont = await frame.evaluate(() => {
    const hero = document.querySelector(".hero-word");
    const style = getComputedStyle(hero);
    return { family: style.fontFamily, weight: style.fontWeight, spacing: style.letterSpacing };
  });
  check("hero renders Iowan Old Style at weight 500", /Iowan Old Style/i.test(heroFont.family) && heroFont.weight === "500", `${heroFont.family} ${heroFont.weight}`);

  // 5. Interaction: opening a book from the gallery shows the detail panel.
  const beforeOpen = await frame.evaluate(() => document.body.getAttribute("data-mode") ?? document.body.className);
  await frame.click(".book-card");
  await frame.waitForTimeout(2200);
  const detail = await frame.evaluate(() => {
    const panel = document.querySelector(".detail-panel");
    const title = document.querySelector(".detail-title");
    const style = panel ? getComputedStyle(panel) : null;
    return {
      exists: Boolean(panel),
      visible: style ? style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) > 0.05 : false,
      title: title?.textContent?.trim() ?? "",
      mode: document.body.getAttribute("data-mode") ?? document.body.className,
    };
  });
  check("book opens into detail view", detail.exists && detail.visible, `${detail.title} (${beforeOpen} -> ${detail.mode})`);

  // 6. Interaction: the close control returns to the gallery.
  await frame.click(".close-button");
  await frame.waitForTimeout(1600);
  const closed = await frame.evaluate(() => {
    const panel = document.querySelector(".detail-panel");
    const style = panel ? getComputedStyle(panel) : null;
    return !style || style.display === "none" || style.visibility === "hidden" || Number(style.opacity) < 0.5;
  });
  check("detail view closes back to gallery", closed);

  // 7. Interaction: the menu layer opens.
  await frame.click(".icon-button");
  await frame.waitForTimeout(1200);
  const menu = await frame.evaluate(() => {
    const layer = document.querySelector(".menu-layer");
    const style = layer ? getComputedStyle(layer) : null;
    return {
      visible: style ? style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) > 0.05 : false,
      links: document.querySelectorAll(".menu-link").length,
    };
  });
  check("menu layer opens with links", menu.visible && menu.links > 0, `${menu.links} links`);

  // 8. Embedded media actually plays (videos are data URLs inside the document).
  const media = await frame.evaluate(async () => {
    const video = document.querySelector("video");
    if (!video) return { present: false };
    const attempt = Promise.resolve(video.play()).catch(() => {});
    await Promise.race([attempt, new Promise((resolve) => setTimeout(resolve, 3000))]);
    await new Promise((resolve) => setTimeout(resolve, 900));
    return { present: true, readyState: video.readyState, time: video.currentTime, src: video.currentSrc.slice(0, 10) };
  });
  check("embedded data-URL video is decodable", media.present && media.readyState >= 2, `readyState ${media.readyState}, t=${media.time?.toFixed(2)}s, src ${media.src}`);

  // 9. Responsive: phone viewport still renders the authored layout.
  const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await phone.goto(BASE, { waitUntil: "networkidle" });
  await phone.waitForSelector('.landing-page-frame[data-state="ready"]', { timeout: 30000 });
  const phoneFrame = await (await phone.$(".landing-page-frame iframe")).contentFrame();
  await phoneFrame.waitForSelector(".hero-word", { timeout: 30000 });
  const phoneHero = await phoneFrame.evaluate(() => {
    const hero = document.querySelector(".hero-word");
    const rect = hero.getBoundingClientRect();
    return { width: rect.width, within: rect.width <= window.innerWidth + 1 };
  });
  check("phone viewport renders authored responsive layout", phoneHero.within, `hero ${Math.round(phoneHero.width)}px wide`);

  // 10. No page errors anywhere in the run.
  check("no console/page errors", errors.length === 0, errors.slice(0, 3).join(" | "));

  // Close the menu layer opened in check 7 so it no longer intercepts clicks.
  await frame.click(".icon-button");
  await frame.waitForTimeout(1200);

  await mkdir(path.join(root, "artifacts/testing"), { recursive: true });
  await page.screenshot({ path: path.join(root, "artifacts/testing/hero-desktop.png") });
  await phone.screenshot({ path: path.join(root, "artifacts/testing/hero-mobile.png") });
  await frame.click(".book-card");
  await frame.waitForTimeout(2200);
  await page.screenshot({ path: path.join(root, "artifacts/testing/detail-desktop.png") });
  await writeFile(
    path.join(root, "artifacts/testing/browser-results.json"),
    JSON.stringify({ when: new Date().toISOString(), base: BASE, results }, null, 2),
  );
  console.log(`\n${results.filter((r) => r.ok).length}/${results.length} checks passed`);
} finally {
  await browser.close();
  server.close();
  // The server keeps alive sockets open; the run is complete, so exit.
  setTimeout(() => process.exit(process.exitCode ?? 0), 500).unref();
}
