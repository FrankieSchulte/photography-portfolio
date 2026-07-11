#!/usr/bin/env node

import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderPages, ROUTES } from "../src/render.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const SRC = path.join(ROOT, "src");
const PUBLIC = path.join(ROOT, "public");

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

async function write(relativePath, contents) {
  const target = path.join(DIST, relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, contents);
}

const site = await readJson(path.join(SRC, "site.json"));
const galleries = await readJson(path.join(SRC, "galleries.json"));
const pages = renderPages(site, galleries);

await rm(DIST, { recursive: true, force: true });
await mkdir(path.join(DIST, "assets"), { recursive: true });
await cp(path.join(PUBLIC, "assets"), path.join(DIST, "assets"), { recursive: true });
await cp(path.join(SRC, "styles.css"), path.join(DIST, "assets", "styles.css"));
await cp(path.join(SRC, "main.js"), path.join(DIST, "assets", "main.js"));

for (const [relativePath, html] of pages) {
  await write(relativePath, html);
}

const launchReady = site.launchReady && !site.siteUrl.includes("example");
const baseUrl = site.siteUrl.replace(/\/$/, "");
const routeSlugs = Object.values(ROUTES);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routeSlugs.map((slug) => `  <url><loc>${baseUrl}/${slug ? `${slug}/` : ""}</loc></url>`).join("\n")}
</urlset>\n`;

const robots = launchReady
  ? `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml\n`
  : "User-agent: *\nDisallow: /\n";

const manifest = {
  name: site.name,
  short_name: site.wordmark,
  start_url: "./",
  display: "standalone",
  background_color: "#0A0A0A",
  theme_color: "#0A0A0A",
  icons: [
    { src: "assets/icons/favicon.svg", sizes: "any", type: "image/svg+xml" },
  ],
};

await write("robots.txt", robots);
await write("sitemap.xml", sitemap);
await write("site.webmanifest", `${JSON.stringify(manifest, null, 2)}\n`);
await write("humans.txt", `Design direction: independent arts magazine meets live-music contact sheet.\nPhotography and identity: ${site.name}.\n`);
await write(
  "_headers",
  `/assets/images/*\n  Cache-Control: public, max-age=31536000, immutable\n\n/assets/styles.css\n  Cache-Control: public, max-age=3600\n\n/assets/main.js\n  Cache-Control: public, max-age=3600\n`,
);

console.log(`Built ${pages.size} HTML documents in ${path.relative(ROOT, DIST)}/`);
console.log(launchReady ? "Launch mode: indexable metadata enabled." : "Preview mode: noindex and robots disallow are enabled.");
