from __future__ import annotations

import hashlib
import io
import json
import sqlite3
import tempfile
import unittest
import zipfile
from pathlib import Path

from contracts import release_decision
from integrity import AnalysisError, analysis_directory, preserve_upload, profile_file


class IntegrityTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.workspace = Path(self.temporary.name)

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def analyze(self, content: bytes, filename: str = "orders.csv"):
        original = preserve_upload(io.BytesIO(content), filename, self.workspace, len(content))
        report = profile_file(original, analysis_directory(original))
        return original, report

    def test_original_is_unchanged_and_every_row_is_accounted_for(self) -> None:
        content = b"id,amount,name\n1,10,Ada\n1,10,Ada\n2,20\n3,, Lin \n"
        expected_hash = hashlib.sha256(content).hexdigest()
        original, report = self.analyze(content)

        self.assertEqual(original.read_bytes(), content)
        self.assertEqual(report["source"]["sha256Before"], expected_hash)
        self.assertEqual(report["source"]["sha256After"], expected_hash)
        self.assertTrue(report["source"]["integrityVerified"])
        self.assertEqual(report["accounting"]["rowsRead"], 4)
        self.assertEqual(report["accounting"]["included"], 3)
        self.assertEqual(report["accounting"]["quarantined"], 1)
        self.assertEqual(report["accounting"]["duplicatesRetained"], 1)
        self.assertEqual(report["accounting"]["silentlyDeleted"], 0)
        self.assertTrue(report["accounting"]["balanced"])
        self.assertEqual(report["process"]["events"][0]["phase"], "START")
        self.assertEqual(report["process"]["events"][-1]["phase"], "END")
        process_log = Path(report["artifacts"]["processLog"])
        logged_events = [json.loads(line) for line in process_log.read_text(encoding="utf-8").splitlines()]
        self.assertEqual(len(logged_events), report["process"]["eventCount"])
        self.assertEqual([event["sequence"] for event in logged_events], list(range(1, len(logged_events) + 1)))

        connection = sqlite3.connect(report["artifacts"]["rowLedger"])
        try:
            rows = connection.execute(
                "SELECT row_number, disposition, reason FROM rows ORDER BY row_number"
            ).fetchall()
        finally:
            connection.close()
        self.assertEqual(len(rows), 4)
        self.assertEqual(rows[1][1], "included_with_warning")
        self.assertEqual(rows[2][1], "quarantined")

    def test_jsonl_reports_the_real_physical_error_line(self) -> None:
        content = b'{"id": 1}\n\n{"id": 2}\nnot-json\n'
        with self.assertRaisesRegex(AnalysisError, "JSON line 4"):
            self.analyze(content, "records.jsonl")

    def test_unknown_file_is_preserved_without_content_guessing(self) -> None:
        original, report = self.analyze(b"\x00\x01\x02private-binary", "archive.custom")
        self.assertEqual(original.read_bytes(), b"\x00\x01\x02private-binary")
        self.assertEqual(report["source"]["extractionMode"], "metadata_only")
        self.assertEqual(report["accounting"]["silentlyDeleted"], 0)
        self.assertIn("No safe content extractor", report["limitations"][0])

    def test_docx_paragraphs_are_read_as_auditable_rows(self) -> None:
        package = io.BytesIO()
        document = (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
            '<w:body><w:p><w:r><w:t>First paragraph</w:t></w:r></w:p>'
            '<w:p><w:r><w:t>Second paragraph</w:t></w:r></w:p></w:body></w:document>'
        )
        with zipfile.ZipFile(package, "w") as archive:
            archive.writestr("word/document.xml", document)
        _, report = self.analyze(package.getvalue(), "report.docx")
        self.assertEqual(report["source"]["extractionMode"], "document_paragraphs")
        self.assertEqual(report["accounting"]["rowsRead"], 2)
        self.assertEqual(report["preview"][0]["values"]["text"], "First paragraph")

    def test_operating_system_sidecar_is_not_misread_as_its_extension(self) -> None:
        _, report = self.analyze(b"not a real pdf", "._report.pdf")
        self.assertEqual(report["source"]["extractionMode"], "metadata_only")
        self.assertIn("metadata sidecar", report["limitations"][0])


class ReleaseGateTests(unittest.TestCase):
    def valid_analysis(self):
        return {
            "results": [{
                "result_id": "revenue-total",
                "calculation_id": "sum-net-v1",
                "name": "Revenue",
                "value": 42,
                "source_columns": ["orders.net_amount"],
                "filters": "status = completed",
                "evidence": "executed output: 42",
            }],
            "errors": [],
        }

    def test_all_results_must_be_independently_matched(self) -> None:
        verification = {
            "verdict": "PASS",
            "recomputations": [{"result_id": "revenue-total", "match": True}],
            "sanity_checks": [{"check": "parts reconcile", "passed": True}],
        }
        decision = release_decision(self.valid_analysis(), verification)
        self.assertTrue(decision.allowed)
        self.assertEqual(decision.verified_result_ids, ("revenue-total",))

    def test_fail_closed_when_a_result_is_not_verified(self) -> None:
        verification = {"verdict": "PASS", "recomputations": [], "sanity_checks": []}
        decision = release_decision(self.valid_analysis(), verification)
        self.assertFalse(decision.allowed)
        self.assertIn("lack independent matches", decision.reason)

    def test_fail_closed_on_missing_lineage(self) -> None:
        analysis = self.valid_analysis()
        del analysis["results"][0]["source_columns"]
        decision = release_decision(analysis, {"verdict": "PASS"})
        self.assertFalse(decision.allowed)
        self.assertIn("source_columns", decision.reason)

    def test_forged_execution_evidence_is_rejected(self) -> None:
        verification = {
            "verdict": "PASS",
            "recomputations": [{
                "result_id": "revenue-total", "match": True, "evidence": "exec-verifier-real"
            }],
            "sanity_checks": [{"check": "parts reconcile", "passed": True}],
        }
        decision = release_decision(
            self.valid_analysis(),
            verification,
            successful_evidence_ids={"exec-analyst-real"},
            successful_verifier_evidence_ids={"exec-verifier-real"},
        )
        self.assertFalse(decision.allowed)
        self.assertIn("do not reference successful executed evidence", decision.reason)


if __name__ == "__main__":
    unittest.main()
