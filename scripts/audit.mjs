#!/usr/bin/env node

import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const PUBLIC = path.join(ROOT, "public");
const SRC = path.join(ROOT, "src");
const REQUIRED_PAGES = [
  "index.html",
  "work/index.html",
  "concerts/index.html",
  "portraits/index.html",
  "events/index.html",
  "field-notes/index.html",
  "about/index.html",
  "inquire/index.html",
  "404.html",
];

const failures = [];
const warnings = [];

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

function localTarget(pagePath, raw) {
  const value = raw.split("#")[0].split("?")[0];
  if (!value || value.startsWith("#") || value.startsWith("mailto:") || value.startsWith("tel:") || /^https?:/i.test(value)) return null;
  const resolved = path.resolve(path.dirname(pagePath), value);
  if (value.endsWith("/")) return path.join(resolved, "index.html");
  return resolved;
}

const site = JSON.parse(await readFile(path.join(SRC, "site.json"), "utf8"));
const galleries = JSON.parse(await readFile(path.join(SRC, "galleries.json"), "utf8"));

for (const page of REQUIRED_PAGES) {
  const full = path.join(DIST, page);
  if (!(await exists(full))) {
    failures.push(`Missing generated page: ${page}`);
    continue;
  }
  const html = await readFile(full, "utf8");
  const h1Count = (html.match(/<h1(?:\s|>)/g) || []).length;
  if (h1Count !== 1) failures.push(`${page} has ${h1Count} h1 elements; expected 1.`);
  if (!html.includes('class="skip-link"')) failures.push(`${page} is missing a skip link.`);
  if (!html.includes('<main id="main-content">')) failures.push(`${page} is missing the main landmark.`);
  if (!/<meta name="description" content=".+?">/.test(html)) failures.push(`${page} is missing a meta description.`);

  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length) failures.push(`${page} has duplicate ids: ${[...new Set(duplicateIds)].join(", ")}`);

  const imageTags = [...html.matchAll(/<img\b[^>]*>/g)].map((match) => match[0]);
  imageTags.forEach((tag, index) => {
    if (!/\salt="[^"]*"/.test(tag)) failures.push(`${page} image ${index + 1} is missing alt.`);
    if (!/\swidth="\d+"/.test(tag) || !/\sheight="\d+"/.test(tag)) failures.push(`${page} image ${index + 1} is missing explicit dimensions.`);
  });

  const controls = [...html.matchAll(/<(?:input|select|textarea)\b[^>]*\sid="([^"]+)"[^>]*>/g)].map((match) => match[1]);
  controls.forEach((id) => {
    if (!new RegExp(`<label[^>]+for="${id}"`).test(html)) failures.push(`${page} form control #${id} has no explicit label.`);
  });

  const references = [
    ...[...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1]),
    ...[...html.matchAll(/srcset="([^"]+)"/g)].flatMap((match) => match[1].split(",").map((part) => part.trim().split(/\s+/)[0])),
  ];
  for (const reference of references) {
    const target = localTarget(full, reference);
    if (target && !(await exists(target))) failures.push(`${page} references missing file: ${reference}`);
  }

  const indexable = site.launchReady && !site.siteUrl.includes("example");
  if (!indexable && !html.includes('content="noindex,nofollow"')) failures.push(`${page} should be noindex in preview mode.`);
}

for (const category of ["concerts", "portraits", "events", "fieldNotes", "headshot"]) {
  for (const image of galleries[category]) {
    for (const width of [480, 960, 1600]) {
      for (const extension of ["avif", "webp", "jpg"]) {
        const file = path.join(PUBLIC, "assets", "images", `${image.file}-${width}.${extension}`);
        if (!(await exists(file))) failures.push(`Missing responsive image: ${path.relative(ROOT, file)}`);
      }
    }
    if (!image.alt || image.alt.length < 18) failures.push(`${image.id} needs a meaningful alt value.`);
    if (!image.width || !image.height) failures.push(`${image.id} needs explicit width and height.`);
  }
}

if (site.launchReady) {
  const serialized = JSON.stringify(site);
  const placeholderPatterns = [/\[YOUR NAME\]/, /\[CITY \/ REGION\]/, /replace-me@example\.com/, /portfolio\.example/, /@yourhandle/, /"wordmark":"YOUR NAME"/, /"instagramUrl":"https:\/\/www\.instagram\.com\/"/];
  placeholderPatterns.forEach((pattern) => {
    if (pattern.test(serialized)) failures.push(`launchReady is true but placeholder remains: ${pattern}`);
  });
  const demoImages = Object.values(galleries)
    .flatMap((value) => (Array.isArray(value) ? value : []))
    .filter((image) => image && image.demo);
  if (demoImages.length) failures.push(`launchReady is true but ${demoImages.length} demo images remain.`);
} else {
  warnings.push("Preview mode remains enabled. This is the safe default until real content and photography are installed.");
}

const imageCount = (await readdir(path.join(PUBLIC, "assets", "images"))).length;
if (imageCount < 100) warnings.push(`Only ${imageCount} optimized image files were found; verify the image pipeline.`);

warnings.forEach((warning) => console.warn(`warning: ${warning}`));
if (failures.length) {
  failures.forEach((failure) => console.error(`error: ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Audit passed: ${REQUIRED_PAGES.length} pages, ${imageCount} optimized image files, no broken local references.`);
}
