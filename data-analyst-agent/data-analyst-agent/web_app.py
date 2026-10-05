"""Small local web UI for deterministic ATLAS data intake and profiling."""

from __future__ import annotations

import json
import logging
import mimetypes
import socket
import sys
import uuid
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from logging.handlers import RotatingFileHandler
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from integrity import AnalysisError, AuditLog, analysis_directory, preserve_upload, profile_file


ROOT = Path(__file__).resolve().parent
STATIC = ROOT / "static"
WORKSPACE = ROOT / ".atlas-work"
MAX_UPLOAD_BYTES = 1024 * 1024 * 1024
SERVER_LOG = ROOT / ".atlas-server.log"

logger = logging.getLogger("atlas.server")
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = RotatingFileHandler(SERVER_LOG, maxBytes=5_000_000, backupCount=3, encoding="utf-8")
    handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
    logger.addHandler(handler)


class ExclusiveThreadingHTTPServer(ThreadingHTTPServer):
    """Prevent stale ATLAS versions from sharing the same Windows port."""

    allow_reuse_address = False

    def server_bind(self) -> None:
        if sys.platform == "win32" and hasattr(socket, "SO_EXCLUSIVEADDRUSE"):
            self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
        super().server_bind()


class AtlasHandler(BaseHTTPRequestHandler):
    server_version = "ATLAS/0.1"

    def do_GET(self) -> None:  # noqa: N802
        path = urlparse(self.path).path
        routes = {"/": "index.html", "/app.js": "app.js", "/styles.css": "styles.css", "/batch.css": "batch.css"}
        filename = routes.get(path)
        if filename is None:
            self._json({"error": "Not found"}, HTTPStatus.NOT_FOUND)
            return
        target = STATIC / filename
        content = target.read_bytes()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", mimetypes.guess_type(target.name)[0] or "application/octet-stream")
        self.send_header("Content-Length", str(len(content)))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(content)

    def do_POST(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        if parsed.path != "/api/analyze":
            self._json({"error": "Not found"}, HTTPStatus.NOT_FOUND)
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self._json({"error": "Invalid Content-Length"}, HTTPStatus.BAD_REQUEST)
            return
        if length <= 0:
            self._json({"error": "The upload is empty."}, HTTPStatus.BAD_REQUEST)
            return
        if length > MAX_UPLOAD_BYTES:
            self._json({"error": "The basic UI currently accepts files up to 1 GB."}, HTTPStatus.REQUEST_ENTITY_TOO_LARGE)
            return
        filename = parse_qs(parsed.query).get("filename", [""])[0]
        session_id = "not-created"
        try:
            original = preserve_upload(self.rfile, filename, WORKSPACE, length)
            directory = analysis_directory(original)
            session_id = directory.name
            audit = AuditLog(directory)
            audit.emit("START", "upload_preserved", "passed", {
                "source": original.name, "bytesReceived": original.stat().st_size,
            })
            result = profile_file(original, directory, audit)
            logger.info("analysis completed session=%s file=%r rows=%s", session_id, filename, result["accounting"]["rowsRead"])
            self._json(result, HTTPStatus.OK)
        except AnalysisError as error:
            logger.warning("analysis rejected session=%s file=%r reason=%s", session_id, filename, error)
            self._json({"error": str(error), "status": "CANNOT_DETERMINE", "sessionId": session_id}, HTTPStatus.UNPROCESSABLE_ENTITY)
        except Exception:
            error_id = str(uuid.uuid4())
            logger.exception("unexpected analysis failure error_id=%s session=%s file=%r", error_id, session_id, filename)
            self._json(
                {"error": "Analysis failed safely. No result was released and the original upload was retained.",
                 "status": "CANNOT_DETERMINE", "errorId": error_id, "sessionId": session_id},
                HTTPStatus.INTERNAL_SERVER_ERROR,
            )

    def _json(self, payload: dict, status: HTTPStatus) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format: str, *args: object) -> None:
        print(f"ATLAS {self.address_string()} — {format % args}")


def main() -> None:
    WORKSPACE.mkdir(parents=True, exist_ok=True)
    try:
        server = ExclusiveThreadingHTTPServer(("127.0.0.1", 7070), AtlasHandler)
    except OSError as error:
        raise SystemExit("ATLAS is already running on port 7070. Stop the existing window before starting another.") from error
    print("ATLAS Data Reader is running at http://localhost:7070")
    print(f"Analysis artifacts are retained in {WORKSPACE}")
    print(f"Server errors are logged in {SERVER_LOG}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
