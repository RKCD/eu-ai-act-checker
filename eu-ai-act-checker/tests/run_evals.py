#!/usr/bin/env python
"""EU AI Act Readiness Check — eval harness.

Runs eval_cases.json against the real /assess handler, in-process via
Starlette's TestClient (no server needs to be running, no network hop).
Each case is a genuine call to the Claude API — this is not a mock. That is
deliberate: the thing under test is whether the model correctly selects
regime keys and role/risk categories, not just whether legal_corpus.py's
arithmetic is right (that has no LLM in the loop and does not need an eval).

Each case gets a distinct X-Forwarded-For value so the in-memory per-IP rate
limiter in main.py (1 request / 60s / IP) does not serialize the run — this
does not touch production behavior, it only exploits the header the real
rate limiter already keys on.

Usage:
    python tests/run_evals.py

Exit code 0 if every case passes, 1 otherwise — wire this into anything that
should block on a regression (a pre-deploy check, a CI step, or just a habit
after touching the prompt or the corpus).

Requires ANTHROPIC_API_KEY in the environment or eu-ai-act-checker/.env
(main.py loads .env itself via python-dotenv). Uses main.APP_PASSWORD as the
access code, so it works unmodified whether or not a gate is configured
locally.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

APP_ROOT = Path(__file__).resolve().parent.parent
os.chdir(APP_ROOT)  # main.py resolves knowledge/, logs/, static/ relative to cwd
sys.path.insert(0, str(APP_ROOT))

from starlette.testclient import TestClient  # noqa: E402

import main  # noqa: E402

CASES_PATH = Path(__file__).parent / "eval_cases.json"
CONF_RANK = {"low": 0, "medium": 1, "high": 2}


def load_cases() -> list[dict]:
    return json.loads(CASES_PATH.read_text(encoding="utf-8"))


def run_case(client: TestClient, case: dict, ip_tag: str) -> tuple[bool, list[str], dict | None]:
    """Returns (passed, failure_reasons, raw_response_or_None)."""
    failures: list[str] = []
    payload = {**case["input"], "access_code": main.APP_PASSWORD}

    resp = client.post("/assess", json=payload, headers={"X-Forwarded-For": ip_tag})
    if resp.status_code != 200:
        return False, [f"HTTP {resp.status_code}: {resp.text[:400]}"], None

    data = resp.json()
    exp = case["expect"]

    got_category = data.get("risk_classification", {}).get("category")
    if got_category != exp["risk_category"]:
        failures.append(f"risk_category: expected {exp['risk_category']!r}, got {got_category!r}")

    got_role = data.get("role_analysis", {}).get("determined_role")
    if got_role not in exp["role_in"]:
        failures.append(f"role: expected one of {exp['role_in']}, got {got_role!r}")

    got_regimes = {d["regime"] for d in data.get("deadlines", [])}

    for required in exp.get("regimes_required", []):
        if required not in got_regimes:
            failures.append(f"missing required regime {required!r} (got {sorted(got_regimes)})")

    for forbidden in exp.get("regimes_forbidden", []):
        if forbidden in got_regimes:
            failures.append(f"forbidden regime present: {forbidden!r}")

    if exp.get("expect_empty_regimes") and got_regimes:
        failures.append(f"expected empty regime list, got {sorted(got_regimes)}")

    for regime, expected_status in exp.get("regime_status", {}).items():
        entry = next((d for d in data.get("deadlines", []) if d["regime"] == regime), None)
        if entry is None:
            failures.append(f"regime_status check failed: {regime!r} not present in response")
        elif entry["status"] != expected_status:
            failures.append(f"{regime}: expected status {expected_status!r}, got {entry['status']!r}")

    articles = data.get("risk_classification", {}).get("articles_cited", [])
    articles_joined = " ".join(articles)
    for substr in exp.get("articles_any_contain", []):
        if substr not in articles_joined:
            failures.append(f"articles_cited missing expected substring {substr!r} (got {articles})")

    got_conf = data.get("confidence", {}).get("level")
    min_conf = exp.get("min_confidence")
    if min_conf and CONF_RANK.get(got_conf, -1) < CONF_RANK.get(min_conf, 99):
        failures.append(f"confidence: expected >= {min_conf!r}, got {got_conf!r}")

    corpus = data.get("corpus", {})
    if corpus.get("is_stale"):
        failures.append(
            f"legal corpus reports stale ({corpus.get('age_days')} days since {corpus.get('verified_on')}) "
            "— dates in this run may no longer be current, verify and bump CORPUS_VERIFIED_ON"
        )

    return (len(failures) == 0), failures, data


def read_last_log_entry() -> dict | None:
    """Peek the audit log tail for dropped_regime_keys — a non-empty list means
    the model produced a regime key that isn't in legal_corpus.REGIMES, which
    should never happen given the enum-constrained schema but is worth
    surfacing loudly if it ever does."""
    if not main.LOG_PATH.exists():
        return None
    lines = main.LOG_PATH.read_text(encoding="utf-8").strip().splitlines()
    return json.loads(lines[-1]) if lines else None


def main_entry() -> int:
    cases = load_cases()
    client = TestClient(main.app)

    results: list[tuple[str, bool, list[str]]] = []
    for i, case in enumerate(cases):
        ip_tag = f"eval-{i}-{case['id']}"
        passed, failures, _data = run_case(client, case, ip_tag)

        log_entry = read_last_log_entry()
        if log_entry and log_entry.get("dropped_regime_keys"):
            passed = False
            failures.append(f"model produced unknown regime key(s): {log_entry['dropped_regime_keys']}")

        results.append((case["id"], passed, failures))

    name_width = max(len(c["id"]) for c in cases) + 2
    print()
    print(f"{'CASE':<{name_width}}RESULT")
    print("-" * (name_width + 8))
    all_passed = True
    for case_id, passed, failures in results:
        status = "PASS" if passed else "FAIL"
        if not passed:
            all_passed = False
        print(f"{case_id:<{name_width}}{status}")
        for f in failures:
            print(f"    - {f}")

    passed_count = sum(1 for _, p, _ in results if p)
    print()
    print(f"{passed_count}/{len(results)} passed")
    return 0 if all_passed else 1


if __name__ == "__main__":
    raise SystemExit(main_entry())
