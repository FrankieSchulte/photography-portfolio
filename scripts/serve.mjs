#!/usr/bin/env node

import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
const PORT = Number(process.env.PORT || 4173);
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
};

async function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0]);
  const safe = path.normalize(clean).replace(/^(\.\.(\/|\\|$))+/, "");
  let candidate = path.join(ROOT, safe);
  if (clean.endsWith("/")) candidate = path.join(candidate, "index.html");
  try {
    const info = await stat(candidate);
    if (info.isDirectory()) candidate = path.join(candidate, "index.html");
    await stat(candidate);
    return candidate;
  } catch {
    if (!path.extname(candidate)) {
      try {
        const nested = path.join(candidate, "index.html");
        await stat(nested);
        return nested;
      } catch {
        return path.join(ROOT, "404.html");
      }
    }
    return path.join(ROOT, "404.html");
  }
}

const server = http.createServer(async (request, response) => {
  const file = await resolveFile(request.url || "/");
  const is404 = file.endsWith(`${path.sep}404.html`) && !String(request.url).endsWith("404.html");
  response.writeHead(is404 ? 404 : 200, {
    "Content-Type": TYPES[path.extname(file)] || "application/octet-stream",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Cache-Control": file.includes(`${path.sep}assets${path.sep}images${path.sep}`) ? "public, max-age=31536000, immutable" : "no-cache",
  });
  createReadStream(file).pipe(response);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Portfolio preview: http://127.0.0.1:${PORT}`);
});
