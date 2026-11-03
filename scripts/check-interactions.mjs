// Interaction checks on the built export, served under /preview/ to catch absolute asset URLs.
// Usage: IMD_PLAYWRIGHT=/path/to/playwright/index.mjs [ENGINES=chromium,webkit] node scripts/check-interactions.mjs [dist] [screenshot-dir]
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const pw = await import(pathToFileURL(process.env.IMD_PLAYWRIGHT).href);
const dist = resolve(process.argv[2] ?? "dist");
const shots = resolve(process.argv[3] ?? "test/scratch/shots");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2" };
const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  if (!url.pathname.startsWith("/preview/")) { res.writeHead(404); return res.end(); }
  let p = url.pathname.slice("/preview/".length) || "index.html";
  try {
    const body = await readFile(join(dist, p));
    res.writeHead(200, { "content-type": types[extname(p)] ?? "application/octet-stream" });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}/preview/`;

let failures = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` (${detail})` : ""}`);
};

for (const engine of (process.env.ENGINES ?? "chromium,webkit").split(",")) {
  console.log(`\n== ${engine}`);
  const browser = await pw[engine].launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const errors = [], failed = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("requestfailed", (r) => failed.push(r.url()));
  page.on("response", (r) => r.status() >= 400 && failed.push(`${r.status()} ${r.url()}`));

  await page.goto(base, { waitUntil: "networkidle" });
  check("home renders h1", (await page.locator("h1").innerText()) === "Dig while the hamster runs");
  check("title", (await page.title()).startsWith("Squeek Burrow"));
  const play = page.getByRole("link", { name: "Play Squeek Burrow" });
  check("play link target", (await play.getAttribute("href")) === "https://squeekburrow.site");
  const box = await play.boundingBox();
  check("play button on first screen at 390", box && box.y + box.height <= 844, `bottom ${box && Math.round(box.y + box.height)}`);
  const sceneBox = await page.locator(".scene__art").boundingBox();
  check("hero art on first screen at 390", sceneBox && sceneBox.y < 844 && sceneBox.y + sceneBox.height <= 844, `art ${Math.round(sceneBox.y)}-${Math.round(sceneBox.y + sceneBox.height)}`);
  check("footer notice rendered in capitals", (await page.locator(".site-footer__notice").innerText()) === "UNOFFICIAL. NOT AFFILIATED WITH SQUEEKCHAIN.");
  const author = page.getByRole("link", { name: "Built by @naxweb3" });
  check("author link", (await author.getAttribute("href")) === "https://x.com/naxweb3");
  check("source link", (await page.getByRole("link", { name: "Source code on GitHub" }).getAttribute("href")) === "https://github.com/bangpateng/squeek-burrow");
  check("favicon loads", (await page.evaluate(async () => (await fetch(document.querySelector("link[rel=icon]").href)).ok)));
  check("og:image loads", (await page.evaluate(async () => (await fetch(new URL(document.querySelector("meta[property='og:image']").content, location.href))).ok)));
  check("pixel font loaded", await page.evaluate(async () => { await document.fonts.ready; return document.fonts.check('700 16px "Pixelify Sans"'); }));

  // Wheel preview toggle.
  const running = page.getByRole("button", { name: "Running" });
  const napping = page.getByRole("button", { name: "Napping" });
  check("running pressed by default", (await running.getAttribute("aria-pressed")) === "true");
  check("speed ×3", (await page.getByRole("status").innerText()).includes("×3"));
  if (engine === "chromium") {
    const anims = await page.evaluate(() => document.getAnimations().length);
    check("wheel animates while running", anims > 0, `${anims} animations`);
  }
  await napping.click();
  check("napping pressed after click", (await napping.getAttribute("aria-pressed")) === "true" && (await running.getAttribute("aria-pressed")) === "false");
  check("speed ×0.1", (await page.getByRole("status").innerText()).includes("×0.1"));
  check("art label follows state", (await page.locator(".scene__art").getAttribute("aria-label")).includes("naps"));
  check("wheel still while napping", (await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running" && a.animationName?.startsWith("px-frame")).length)) === 0);
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(shots, `${engine}-390-napping.png`) });
  await page.keyboard.press("Shift+Tab");
  await running.focus();
  await page.keyboard.press("Enter");
  check("keyboard Enter toggles back to running", (await running.getAttribute("aria-pressed")) === "true");

  // Overflow at the three widths on both pages.
  for (const route of ["", "#/how-to-play"]) {
    for (const w of [320, 390, 1440]) {
      await page.setViewportSize({ width: w, height: 900 });
      await page.goto(base + route, { waitUntil: "networkidle" });
      const sw = await page.evaluate(() => document.documentElement.scrollWidth);
      check(`no horizontal scroll ${route || "#/"} at ${w}`, sw <= w, `scrollWidth ${sw}`);
    }
  }

  // Navigation.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base, { waitUntil: "networkidle" });
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "How to play" }).click();
  await page.waitForFunction(() => document.querySelector("h1")?.textContent === "How to play");
  check("nav to how-to-play", page.url().endsWith("#/how-to-play"));
  check("document title updates", (await page.title()) === "How to play Squeek Burrow");
  check("focus moves to h1", await page.evaluate(() => document.activeElement?.tagName === "H1"));
  check("nav marks current page", (await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "How to play" }).getAttribute("aria-current")) === "page");
  const steps = await page.locator(".steps > li h2").allInnerTexts();
  check("four steps", steps.join("|") === "Forage seeds|Buy chambers|Catch golden seeds|Hibernate", steps.join("|"));
  const quests = await page.locator(".fact h3").allInnerTexts();
  check("two wheel quests", quests.join("|") === "Community goal|Running or napping forecast", quests.join("|"));
  check("footer on how-to-play", (await page.locator(".site-footer__notice").innerText()) === "UNOFFICIAL. NOT AFFILIATED WITH SQUEEKCHAIN.");
  check("play link on how-to-play", (await page.getByRole("link", { name: "Play Squeek Burrow" }).getAttribute("href")) === "https://squeekburrow.site");
  await page.screenshot({ path: join(shots, `${engine}-390-how-to-play.png`), fullPage: true });
  await page.goBack();
  await page.waitForFunction(() => document.querySelector("h1")?.textContent === "Dig while the hamster runs");
  check("back button returns home", true);
  await page.getByRole("link", { name: "How to play" }).nth(1).click();
  await page.waitForFunction(() => document.querySelector("h1")?.textContent === "How to play");
  await page.getByRole("link", { name: "Squeek Burrow" }).first().click();
  await page.waitForFunction(() => document.querySelector("h1")?.textContent === "Dig while the hamster runs");
  check("brand link returns home", true);

  // Direct load of a route and an unknown route.
  await page.goto(base + "#/how-to-play", { waitUntil: "networkidle" });
  check("direct load of #/how-to-play", (await page.locator("h1").innerText()) === "How to play");
  await page.goto(base + "#/nope", { waitUntil: "networkidle" });
  check("unknown route falls back home", (await page.locator("h1").innerText()) === "Dig while the hamster runs");

  // Keyboard: skip link first, then into main.
  await page.goto(base, { waitUntil: "networkidle" });
  await page.keyboard.press("Tab");
  check("skip link is first tab stop", await page.evaluate(() => document.activeElement?.textContent === "Skip to content"));
  await page.keyboard.press("Enter");
  check("skip link focuses main", await page.evaluate(() => document.activeElement?.id === "main"));
  check("route survives skip link", (await page.locator("h1").innerText()) === "Dig while the hamster runs");
  if (engine === "chromium") {
    await page.keyboard.press("Tab");
    const ring = await page.evaluate(() => { const s = getComputedStyle(document.activeElement); return `${document.activeElement.textContent}|${s.outlineStyle}|${s.outlineWidth}`; });
    check("next tab stop has a visible outline", ring.includes("solid|3px"), ring);
    await page.screenshot({ path: join(shots, `${engine}-390-focus.png`) });
  }

  // Reduced motion: frames stop.
  const rm = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const rmPage = await rm.newPage();
  await rmPage.goto(base, { waitUntil: "networkidle" });
  check("no frame animation under reduced motion", (await rmPage.evaluate(() => document.getAnimations().length)) === 0);
  await rm.close();

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(base + "#/how-to-play", { waitUntil: "networkidle" });
  await page.screenshot({ path: join(shots, `${engine}-1440-how-to-play.png`), fullPage: true });

  check("no console or page errors", errors.length === 0, errors.join("; "));
  check("no failed requests", failed.length === 0, failed.join("; "));
  await browser.close();
}
server.close();
console.log(`\n${failures === 0 ? "ALL PASSED" : `${failures} FAILED`}`);
process.exit(failures ? 1 : 0);
