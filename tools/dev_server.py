#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import mimetypes
import os
import re
import secrets
import subprocess
import sys
import threading
import time
from email import policy
from email.parser import BytesParser
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
EDITOR = ROOT / "editor"
CONTENT = ROOT / "content" / "site.json"
UPLOADS = ROOT / "public" / "assets" / "images" / "uploads"
BUILD = ROOT / "tools" / "build_site.py"
MAX_UPLOAD = 30 * 1024 * 1024
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".avif"}
BUILD_LOCK = threading.Lock()


def run_build() -> tuple[bool, str]:
    with BUILD_LOCK:
        proc = subprocess.run(
            [sys.executable, str(BUILD)],
            cwd=ROOT,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            timeout=60,
        )
        return proc.returncode == 0, proc.stdout.strip()


def safe_file_name(original: str) -> str:
    original = Path(original).name
    stem = re.sub(r"[^A-Za-z0-9_-]+", "-", Path(original).stem).strip("-").lower() or "photo"
    ext = Path(original).suffix.lower()
    stamp = time.strftime("%Y%m%d-%H%M%S")
    candidate = f"{stem}-{stamp}{ext}"
    counter = 2
    while (UPLOADS / candidate).exists():
        candidate = f"{stem}-{stamp}-{counter}{ext}"
        counter += 1
    return candidate


def image_library() -> list[dict]:
    base = ROOT / "public" / "assets" / "images"
    files: list[dict] = []
    if not base.exists():
        return files
    for path in sorted(base.rglob("*")):
        if path.is_file() and path.suffix.lower() in ALLOWED_EXTENSIONS:
            rel = path.relative_to(ROOT / "public").as_posix()
            files.append({"src": f"/{rel}", "name": path.name, "size": path.stat().st_size})
    return files


def parse_multipart(content_type: str, body: bytes) -> list[dict]:
    message = BytesParser(policy=policy.default).parsebytes(
        f"Content-Type: {content_type}\r\nMIME-Version: 1.0\r\n\r\n".encode("utf-8") + body
    )
    parts = []
    if not message.is_multipart():
        return parts
    for part in message.iter_parts():
        disposition = part.get("Content-Disposition", "")
        if "form-data" not in disposition:
            continue
        name = part.get_param("name", header="content-disposition")
        filename = part.get_filename()
        parts.append({"name": name, "filename": filename, "data": part.get_payload(decode=True) or b""})
    return parts


class PortfolioHandler(BaseHTTPRequestHandler):
    server_version = "FrankiePortfolioDev/1.0"

    @property
    def token(self) -> str:
        return self.server.editor_token  # type: ignore[attr-defined]

    def log_message(self, fmt: str, *args: object) -> None:
        sys.stdout.write(f"[{self.log_date_time_string()}] {fmt % args}\n")

    def send_json(self, payload: object, status: int = 200) -> None:
        raw = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(raw)

    def authorized(self) -> bool:
        parsed = urlparse(self.path)
        query_token = parse_qs(parsed.query).get("token", [""])[0]
        header_token = self.headers.get("X-Editor-Token", "")
        return secrets.compare_digest(query_token or header_token, self.token)

    def require_authorized(self) -> bool:
        if self.authorized():
            return True
        self.send_json({"error": "Editor token is missing or incorrect."}, HTTPStatus.UNAUTHORIZED)
        return False

    def read_body(self, limit: int = MAX_UPLOAD) -> bytes:
        length = int(self.headers.get("Content-Length", "0"))
        if length < 0 or length > limit:
            raise ValueError(f"Request is too large. Maximum size is {limit // (1024 * 1024)} MB.")
        return self.rfile.read(length)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = unquote(parsed.path)

        if path == "/api/content":
            if not self.require_authorized():
                return
            try:
                self.send_json(json.loads(CONTENT.read_text(encoding="utf-8")))
            except Exception as exc:
                self.send_json({"error": str(exc)}, 500)
            return

        if path == "/api/images":
            if not self.require_authorized():
                return
            self.send_json({"images": image_library()})
            return

        if path in {"/__editor__", "/__editor__/"}:
            self.serve_path(EDITOR / "index.html")
            return
        if path.startswith("/__editor__/"):
            rel = path[len("/__editor__/"):]
            self.serve_path(EDITOR / rel)
            return

        self.serve_site(path)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path
        if not path.startswith("/api/"):
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        if not self.require_authorized():
            return

        if path == "/api/save":
            try:
                body = self.read_body(5 * 1024 * 1024)
                data = json.loads(body.decode("utf-8"))
                for required in ("meta", "home", "work", "about", "inquire", "categories"):
                    if required not in data:
                        raise ValueError(f"Missing required top-level field: {required}")
                temp = CONTENT.with_suffix(".json.tmp")
                temp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
                os.replace(temp, CONTENT)
                ok, output = run_build()
                if not ok:
                    self.send_json({"error": "Content was saved, but the build failed.", "output": output}, 500)
                    return
                self.send_json({"ok": True, "output": output})
            except Exception as exc:
                self.send_json({"error": str(exc)}, 400)
            return

        if path == "/api/build":
            ok, output = run_build()
            self.send_json({"ok": ok, "output": output}, 200 if ok else 500)
            return

        if path == "/api/upload":
            try:
                content_type = self.headers.get("Content-Type", "")
                if not content_type.startswith("multipart/form-data"):
                    raise ValueError("Upload must use multipart/form-data.")
                parts = parse_multipart(content_type, self.read_body())
                upload = next((part for part in parts if part.get("filename")), None)
                if not upload:
                    raise ValueError("No file was received.")
                original = str(upload["filename"])
                ext = Path(original).suffix.lower()
                if ext not in ALLOWED_EXTENSIONS:
                    raise ValueError("Use JPG, PNG, WebP, or AVIF images.")
                UPLOADS.mkdir(parents=True, exist_ok=True)
                filename = safe_file_name(original)
                target = UPLOADS / filename
                target.write_bytes(upload["data"])
                ok, output = run_build()
                if not ok:
                    raise RuntimeError(f"The file was uploaded, but the build failed: {output}")
                src = f"/assets/images/uploads/{filename}"
                self.send_json({"ok": True, "src": src, "name": filename})
            except Exception as exc:
                self.send_json({"error": str(exc)}, 400)
            return

        self.send_error(HTTPStatus.NOT_FOUND)

    def serve_site(self, request_path: str) -> None:
        clean = request_path.split("?", 1)[0]
        if clean == "/":
            target = DIST / "index.html"
        else:
            relative = clean.lstrip("/")
            candidate = DIST / relative
            if candidate.is_dir():
                target = candidate / "index.html"
            elif candidate.exists():
                target = candidate
            elif not Path(relative).suffix and (DIST / relative / "index.html").exists():
                self.send_response(HTTPStatus.PERMANENT_REDIRECT)
                self.send_header("Location", clean.rstrip("/") + "/")
                self.end_headers()
                return
            else:
                target = DIST / "404.html"
                if target.exists():
                    self.serve_path(target, status=404)
                    return
        self.serve_path(target)

    def serve_path(self, target: Path, status: int = 200) -> None:
        try:
            resolved = target.resolve()
            allowed_roots = (DIST.resolve(), EDITOR.resolve())
            if not any(resolved == root or root in resolved.parents for root in allowed_roots):
                self.send_error(HTTPStatus.FORBIDDEN)
                return
            if not resolved.is_file():
                self.send_error(HTTPStatus.NOT_FOUND)
                return
            content = resolved.read_bytes()
            mime = mimetypes.guess_type(resolved.name)[0] or "application/octet-stream"
            if mime.startswith("text/") or mime in {"application/javascript", "application/json", "image/svg+xml"}:
                mime += "; charset=utf-8"
            self.send_response(status)
            self.send_header("Content-Type", mime)
            self.send_header("Content-Length", str(len(content)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(content)
        except BrokenPipeError:
            pass


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the dependency-free portfolio editor and preview server")
    parser.add_argument("--host", default="127.0.0.1", help="Bind address. Use 0.0.0.0 only on a trusted network.")
    parser.add_argument("--port", type=int, default=4173)
    args = parser.parse_args()

    ok, output = run_build()
    if not ok:
        print(output, file=sys.stderr)
        raise SystemExit(1)

    token = secrets.token_urlsafe(20)
    server = ThreadingHTTPServer((args.host, args.port), PortfolioHandler)
    server.editor_token = token  # type: ignore[attr-defined]

    display_host = "127.0.0.1" if args.host in {"0.0.0.0", "::"} else args.host
    print("\nPhotography portfolio development server")
    print(f"Preview: http://{display_host}:{args.port}/")
    print(f"Editor:  http://{display_host}:{args.port}/__editor__/?token={token}")
    if args.host in {"0.0.0.0", "::"}:
        print("\nLAN mode is enabled. Keep the editor URL/token private and stop the server when finished.")
    print("Press Ctrl+C to stop.\n")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping development server.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
