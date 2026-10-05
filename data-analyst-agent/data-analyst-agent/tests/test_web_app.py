from __future__ import annotations

import http.client
import json
import tempfile
import threading
import unittest
from http.server import ThreadingHTTPServer
from pathlib import Path

import web_app


class WebAppTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.previous_workspace = web_app.WORKSPACE
        web_app.WORKSPACE = Path(self.temporary.name)
        self.server = web_app.ExclusiveThreadingHTTPServer(("127.0.0.1", 0), web_app.AtlasHandler)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()

    def tearDown(self) -> None:
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)
        web_app.WORKSPACE = self.previous_workspace
        self.temporary.cleanup()

    def request(self, method: str, path: str, body: bytes | None = None):
        connection = http.client.HTTPConnection("127.0.0.1", self.server.server_port, timeout=5)
        connection.request(method, path, body=body, headers={"Content-Type": "application/octet-stream"})
        response = connection.getresponse()
        payload = response.read()
        connection.close()
        return response.status, payload

    def test_ui_and_analysis_endpoint(self) -> None:
        status, page = self.request("GET", "/")
        self.assertEqual(status, 200)
        self.assertIn(b"ATLAS Data Reader", page)
        self.assertIn(b"folder-input", page)
        self.assertIn(b"analyze-queue", page)

        status, stylesheet = self.request("GET", "/batch.css")
        self.assertEqual(status, 200)
        self.assertIn(b"batch-summary", stylesheet)

        source = b"order_id,total\nA1,12.50\nA2,8.25\n"
        status, body = self.request("POST", "/api/analyze?filename=orders.csv", source)
        report = json.loads(body)
        self.assertEqual(status, 200)
        self.assertEqual(report["accounting"]["rowsRead"], 2)
        self.assertEqual(report["accounting"]["silentlyDeleted"], 0)
        self.assertTrue(report["source"]["integrityVerified"])
        self.assertEqual(report["process"]["events"][0]["step"], "upload_preserved")
        self.assertEqual(report["process"]["events"][-1]["step"], "analysis_completed")

    def test_unknown_input_is_preserved_and_profiled_as_metadata(self) -> None:
        status, body = self.request("POST", "/api/analyze?filename=notes.txt", b"not tabular")
        report = json.loads(body)
        self.assertEqual(status, 200)
        self.assertEqual(report["source"]["extractionMode"], "text_lines")


if __name__ == "__main__":
    unittest.main()
