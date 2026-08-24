"""Dated legal corpus for the EU AI Act application timeline.

This module is the single source of truth for every date the tool reports.
The model NEVER generates a date: it selects regime keys, and this module
resolves each key into a date, its legal basis, the act that amended it, and
its in-force status computed against today.

That split is deliberate. A model that generates dates can hallucinate dates,
no matter how well grounded. A model that selects from an enum cannot.

Provenance: every entry carries the instrument it comes from and a source URL,
so an answer can be traced back to the Official Journal rather than to the
memory of whoever last touched this file.

Updating after a new amending act:
  1. Add the act to AMENDING_ACTS.
  2. Edit the affected REGIMES entries (date, amended_by, superseded_date).
  3. Bump CORPUS_VERSION and CORPUS_VERIFIED_ON.
  4. Run `python tests/run_evals.py` — expected dates live there too.
"""

from __future__ import annotations

from datetime import date
from typing import Any

# ── Corpus vintage ───────────────────────────────────────────────────────────
# CORPUS_VERIFIED_ON is an attestation: the date a human last checked these
# entries against the Official Journal. It is surfaced in every response so a
# reader can judge freshness instead of assuming it.

CORPUS_VERSION = "2026-08-24"
CORPUS_VERIFIED_ON = date(2026, 8, 24)

# Past this age the corpus is reported as stale in every response. EU AI Act
# implementing and amending acts have been landing several times a year, so a
# quarter is the outer bound of "probably still current".
CORPUS_STALE_AFTER_DAYS = 90


# ── Instruments ──────────────────────────────────────────────────────────────

BASE_ACT = {
    "id": "reg_2024_1689",
    "citation": "Regulation (EU) 2024/1689",
    "short_name": "EU AI Act",
    "url": "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
}

AMENDING_ACTS: dict[str, dict[str, Any]] = {
    "reg_2026_1744": {
        "citation": "Regulation (EU) 2026/1744",
        "short_name": "Digital Omnibus on AI",
        "in_force_since": date(2026, 7, 27),
        "url": "https://eur-lex.europa.eu/eli/reg/2026/1744/oj",
        "note": (
            "Amends Regulations (EU) 2024/1689, (EU) 2018/1139 and (EU) 2023/1230. "
            "Deferred the high-risk application dates and added transitional relief; "
            "did not defer the Article 50 transparency date."
        ),
    },
}


# ── Regimes ──────────────────────────────────────────────────────────────────
# Keys are stable identifiers. The model selects from these keys; it never
# writes a date. `superseded_date` records what the date used to be, so the
# output can say "moved from X to Y" instead of silently showing the new date.

REGIMES: dict[str, dict[str, Any]] = {
    "art_5_prohibitions": {
        "label": "Prohibited practices (Article 5)",
        "date": date(2025, 2, 2),
        "legal_basis": "Art 113(a) — Chapters I and II",
        "amended_by": None,
        "superseded_date": None,
        "applies_to": (
            "All prohibited AI practices under Article 5, plus the general "
            "provisions in Chapter I."
        ),
    },
    "art_5_new_prohibitions_omnibus": {
        "label": "Article 5 prohibitions added by the Digital Omnibus",
        "date": date(2026, 12, 2),
        "legal_basis": "Art 5 as amended",
        "amended_by": "reg_2026_1744",
        "superseded_date": None,
        "applies_to": (
            "Prohibitions introduced by Regulation (EU) 2026/1744, covering "
            "non-consensual intimate material and child sexual abuse material. "
            "New obligation — no predecessor date."
        ),
    },
    "gpai_obligations": {
        "label": "General-purpose AI model obligations (Chapter V)",
        "date": date(2025, 8, 2),
        "legal_basis": "Art 113(b) — Chapter V, Chapter VII, Chapter XII, Art 78",
        "amended_by": None,
        "superseded_date": None,
        "applies_to": (
            "Providers of general-purpose AI models, including the additional "
            "systemic-risk duties in Article 55."
        ),
    },
    "art_50_transparency": {
        "label": "Transparency obligations (Article 50)",
        "date": date(2026, 8, 2),
        "legal_basis": "Art 113, main paragraph — not amended by the Digital Omnibus",
        "amended_by": None,
        "superseded_date": None,
        "applies_to": (
            "Disclosure that a person is interacting with an AI system, deepfake "
            "and synthetic-content disclosure by deployers, emotion-recognition "
            "notice, and labelling of AI-generated public-interest text. This date "
            "was NOT deferred — these duties are live."
        ),
    },
    "art_50_2_marking_legacy": {
        "label": "Article 50(2) machine-readable marking — systems already on the market",
        "date": date(2026, 12, 2),
        "legal_basis": "Art 50(2), transitional provision",
        "amended_by": "reg_2026_1744",
        "superseded_date": None,
        "applies_to": (
            "Providers of AI systems generating synthetic audio, image, video or "
            "text that were placed on the market BEFORE 2 August 2026. Grace period "
            "for the machine-readable marking duty only. Systems placed on the "
            "market on or after 2 August 2026 are bound by that earlier date. "
            "Content generated before 2 August 2026 need not be marked retroactively."
        ),
    },
    "high_risk_annex_iii": {
        "label": "High-risk stand-alone systems (Annex III, Article 6(2))",
        "date": date(2027, 12, 2),
        "legal_basis": "Art 113 as amended by Regulation (EU) 2026/1744",
        "amended_by": "reg_2026_1744",
        "superseded_date": date(2026, 8, 2),
        "applies_to": (
            "All Annex III high-risk regimes: provider duties under Articles 9–17, "
            "43, 47, 48, 49, 72 and 73, and deployer duties under Articles 26 and 27."
        ),
    },
    "high_risk_annex_i": {
        "label": "High-risk AI embedded in regulated products (Annex I, Article 6(1))",
        "date": date(2028, 8, 2),
        "legal_basis": "Art 113 as amended by Regulation (EU) 2026/1744",
        "amended_by": "reg_2026_1744",
        "superseded_date": date(2027, 8, 2),
        "applies_to": (
            "AI that is, or is a safety component of, a product covered by Annex I "
            "harmonisation legislation requiring third-party conformity assessment."
        ),
    },
    "high_risk_legacy_public_authority": {
        "label": "Legacy high-risk systems already in use by public authorities",
        "date": date(2030, 8, 2),
        "legal_basis": "Transitional provision, as amended by Regulation (EU) 2026/1744",
        "amended_by": "reg_2026_1744",
        "superseded_date": None,
        "applies_to": (
            "High-risk systems already in service with public authorities before "
            "the high-risk regime applies. Only relevant where the deployer is a "
            "public body and the system predates the regime."
        ),
    },
    "regulatory_sandboxes": {
        "label": "National regulatory sandboxes (Article 57)",
        "date": date(2027, 8, 2),
        "legal_basis": "Art 57 as amended by Regulation (EU) 2026/1744",
        "amended_by": "reg_2026_1744",
        "superseded_date": date(2026, 8, 2),
        "applies_to": (
            "Member State duty to establish at least one AI regulatory sandbox. "
            "Relevant to providers planning to test under supervision."
        ),
    },
    "enforcement_penalties": {
        "label": "Enforcement and penalties (Article 99)",
        "date": date(2026, 8, 2),
        "legal_basis": "Art 113, main paragraph",
        "amended_by": None,
        "superseded_date": None,
        "applies_to": (
            "Penalty regime and market surveillance powers. Live, and it bites on "
            "obligations that are themselves already applicable."
        ),
    },
}


# ── Resolution ───────────────────────────────────────────────────────────────

def _fmt(d: date) -> str:
    """Format as '2 December 2027' — no leading zero, matching EU drafting style."""
    return f"{d.day} {d.strftime('%B')} {d.year}"


def regime_keys() -> list[str]:
    """Valid enum values for the model's regime selection."""
    return list(REGIMES.keys())


def resolve_regime(key: str, why_relevant: str = "", today: date | None = None) -> dict[str, Any]:
    """Turn a model-selected regime key into a fully sourced deadline object.

    Everything factual here comes from REGIMES; the model contributes only
    `why_relevant`, which is reasoning about this system, not law.
    """
    today = today or date.today()
    entry = REGIMES[key]
    when: date = entry["date"]
    delta = (when - today).days

    resolved: dict[str, Any] = {
        "regime": key,
        "label": entry["label"],
        "date": _fmt(when),
        "iso_date": when.isoformat(),
        "status": "in_force" if delta <= 0 else "upcoming",
        "days_remaining": delta if delta > 0 else 0,
        "days_since": -delta if delta <= 0 else 0,
        "legal_basis": entry["legal_basis"],
        "applies_to": entry["applies_to"],
        "why_relevant": why_relevant,
        "source": {
            "instrument": BASE_ACT["citation"],
            "url": BASE_ACT["url"],
        },
    }

    if entry["amended_by"]:
        act = AMENDING_ACTS[entry["amended_by"]]
        resolved["amended_by"] = {
            "citation": act["citation"],
            "short_name": act["short_name"],
            "in_force_since": _fmt(act["in_force_since"]),
            "url": act["url"],
        }
        if entry["superseded_date"]:
            resolved["superseded_date"] = _fmt(entry["superseded_date"])
            resolved["change_note"] = (
                f"Moved from {_fmt(entry['superseded_date'])} to {_fmt(when)} "
                f"by {act['citation']}."
            )
        else:
            resolved["change_note"] = f"Introduced by {act['citation']}."

    return resolved


def resolve_all(selections: list[dict[str, Any]], today: date | None = None) -> list[dict[str, Any]]:
    """Resolve the model's regime selections, dropping unknown keys.

    An unknown key means the model invented one. Silently dropping it is the
    correct failure mode: better to omit a deadline than to report a fabricated
    one. The caller records the drop so evals can catch it.
    """
    today = today or date.today()
    out: list[dict[str, Any]] = []
    for sel in selections:
        key = sel.get("regime")
        if key in REGIMES:
            out.append(resolve_regime(key, sel.get("why_relevant", ""), today))
    out.sort(key=lambda r: r["iso_date"])
    return out


def unknown_regimes(selections: list[dict[str, Any]]) -> list[str]:
    """Regime keys the model produced that are not in the corpus."""
    return [
        str(sel.get("regime"))
        for sel in selections
        if sel.get("regime") not in REGIMES
    ]


# ── Corpus metadata ──────────────────────────────────────────────────────────

def corpus_metadata(today: date | None = None) -> dict[str, Any]:
    """Freshness block attached to every response.

    `is_stale` is what makes the tool able to say it might not know. An agent
    that cannot report its own vintage cannot be trusted about a moving target.
    """
    today = today or date.today()
    age = (today - CORPUS_VERIFIED_ON).days
    return {
        "corpus_version": CORPUS_VERSION,
        "verified_on": _fmt(CORPUS_VERIFIED_ON),
        "age_days": age,
        "is_stale": age > CORPUS_STALE_AFTER_DAYS,
        "stale_after_days": CORPUS_STALE_AFTER_DAYS,
        "assessed_on": _fmt(today),
        "instruments": [
            {
                "citation": BASE_ACT["citation"],
                "short_name": BASE_ACT["short_name"],
                "url": BASE_ACT["url"],
            },
            *[
                {
                    "citation": act["citation"],
                    "short_name": act["short_name"],
                    "in_force_since": _fmt(act["in_force_since"]),
                    "url": act["url"],
                }
                for act in AMENDING_ACTS.values()
            ],
        ],
    }


# ── Prompt rendering ─────────────────────────────────────────────────────────

def regime_reference_block(today: date | None = None) -> str:
    """Render the corpus into the system prompt.

    The prompt and the resolver read from the same dict, so the model can never
    be told one timeline while the response is built from another.
    """
    today = today or date.today()
    lines = [
        "APPLICATION TIMELINE — authoritative, generated from the legal corpus.",
        f"Corpus version {CORPUS_VERSION}, last verified {_fmt(CORPUS_VERIFIED_ON)}.",
        f"Today is {_fmt(today)}.",
        "",
        "You must NOT state dates in your own words. Select regime keys; the",
        "application dates, legal bases and in-force status are attached by code.",
        "",
    ]
    for key, entry in REGIMES.items():
        when: date = entry["date"]
        status = "IN FORCE" if when <= today else "UPCOMING"
        line = f'- "{key}" → {entry["label"]} · {_fmt(when)} · {status} · {entry["legal_basis"]}'
        if entry["amended_by"] and entry["superseded_date"]:
            act = AMENDING_ACTS[entry["amended_by"]]
            line += f' · moved from {_fmt(entry["superseded_date"])} by {act["citation"]}'
        elif entry["amended_by"]:
            act = AMENDING_ACTS[entry["amended_by"]]
            line += f' · introduced by {act["citation"]}'
        lines.append(line)
        lines.append(f"    scope: {entry['applies_to']}")
    return "\n".join(lines)
