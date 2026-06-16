"""Renders an EU AI Act readiness assessment (the JSON produced by main.py)
as a one-page PDF report. No Claude call here — purely formatting data that
already exists, so calling this endpoint has no API cost."""

from datetime import datetime, timezone
from typing import Any

from fpdf import FPDF

BLUE = (30, 58, 138)
GRAY = (90, 90, 90)
LIGHT_GRAY = (130, 130, 130)
AMBER = (120, 90, 30)

# fpdf2's core fonts (Helvetica/Times/Courier) only support Latin-1.
# The knowledge base and model output use § and — fairly often, so map the
# common offenders to ASCII before falling back to a lossy encode.
_CHAR_MAP = {
    "—": "-", "–": "-",       # em / en dash
    "‘": "'", "’": "'",        # smart single quotes
    "“": '"', "”": '"',        # smart double quotes
    "…": "...",                     # ellipsis
    "€": "EUR",                     # euro sign
    "§": "Art.",                    # section sign (used as "Annex III §4")
    "•": "-",                       # bullet
}


def _safe(text: str) -> str:
    text = str(text)
    for bad, good in _CHAR_MAP.items():
        text = text.replace(bad, good)
    return text.encode("latin-1", "replace").decode("latin-1")


def build_pdf(assessment: dict[str, Any]) -> bytes:
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    def heading(text: str) -> None:
        pdf.set_font("Helvetica", "B", 13)
        pdf.set_text_color(*BLUE)
        pdf.cell(0, 8, _safe(text), new_x="LMARGIN", new_y="NEXT")
        pdf.set_draw_color(220, 220, 220)
        y = pdf.get_y()
        pdf.line(pdf.l_margin, y, pdf.w - pdf.r_margin, y)
        pdf.ln(3)

    def label(text: str) -> None:
        pdf.set_font("Helvetica", "B", 10)
        pdf.set_text_color(40, 40, 40)
        pdf.cell(0, 6, _safe(text), new_x="LMARGIN", new_y="NEXT")

    def body(text: str, size: float = 10, color=(30, 30, 30)) -> None:
        pdf.set_font("Helvetica", "", size)
        pdf.set_text_color(*color)
        pdf.multi_cell(0, 5.3, _safe(text))
        pdf.ln(0.5)

    # ── Title ──
    pdf.set_font("Helvetica", "B", 18)
    pdf.set_text_color(*BLUE)
    pdf.cell(0, 10, "EU AI Act Readiness Check", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(*LIGHT_GRAY)
    generated = datetime.now(timezone.utc).strftime("%d %B %Y, %H:%M UTC")
    pdf.cell(0, 6, f"Generated {generated}", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "I", 8.5)
    pdf.cell(0, 5, "Informational tool only - not legal advice.", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    # ── 1. Scope ──
    scope = assessment.get("in_scope", {})
    heading("1. In Scope of the EU AI Act?")
    label(f"Verdict: {scope.get('verdict', '?').upper()}   [{scope.get('source_type', '?')}]")
    body(scope.get("reasoning", ""))
    if scope.get("articles_cited"):
        body("Articles: " + ", ".join(scope["articles_cited"]), size=9, color=LIGHT_GRAY)
    pdf.ln(2)

    # ── 2. Risk classification ──
    risk = assessment.get("risk_classification", {})
    heading("2. Risk Classification")
    label(f"{risk.get('label', '?')}   [{risk.get('source_type', '?')}]")
    body(risk.get("reasoning", ""))
    if risk.get("articles_cited"):
        body("Articles: " + ", ".join(risk["articles_cited"]), size=9, color=LIGHT_GRAY)
    pdf.ln(2)

    # ── 3. Key obligations ──
    heading("3. Key Obligations for Your Role")
    obligations = assessment.get("key_obligations", [])
    if not obligations:
        body("No specific obligations identified.", size=9.5, color=LIGHT_GRAY)
    for item in obligations:
        body(
            f"- [{item.get('article', '?')}, {item.get('source_type', '?')}] {item.get('obligation', '')}",
            size=9.5,
        )
    pdf.ln(2)

    # ── 4. Deadlines ──
    heading("4. Compliance Deadlines")
    deadlines = assessment.get("deadlines", [])
    if not deadlines:
        body("No deadlines identified.", size=9.5, color=LIGHT_GRAY)
    for d in deadlines:
        applies = "applies to this system" if d.get("applies_to_this_system") else "not applicable here"
        body(
            f"{d.get('date', '?')} [{d.get('status', '?').upper()}, {applies}]: {d.get('description', '')}",
            size=9.5,
        )
    pdf.ln(2)

    # ── 5. Next steps ──
    heading("5. Next Steps")
    for i, step in enumerate(assessment.get("next_steps", []), start=1):
        body(f"{i}. [{step.get('urgency', '?').upper()}] {step.get('step', '')}", size=9.5)
        if step.get("rationale"):
            body(f"     {step['rationale']}", size=8.5, color=LIGHT_GRAY)
    pdf.ln(2)

    # ── 6. Confidence ──
    heading("6. Confidence & Information Gaps")
    conf = assessment.get("confidence", {})
    label(f"Confidence: {conf.get('level', '?').upper()}")
    body(conf.get("rationale", ""))
    missing = conf.get("missing_information", [])
    if missing:
        body("Missing information:", size=9)
        for m in missing:
            body(f"- {m}", size=9, color=GRAY)
    pdf.ln(4)

    # ── Disclaimer ──
    pdf.set_font("Helvetica", "I", 8)
    pdf.set_text_color(*AMBER)
    pdf.multi_cell(
        0,
        4.4,
        _safe(
            "Disclaimer: This assessment is generated by an AI tool using publicly available "
            "information about Regulation (EU) 2024/1689 (EU AI Act). It is provided for "
            "informational and educational purposes only and does not constitute legal advice. "
            "Findings marked 'interpretation' represent the tool's analysis and should be verified "
            "with qualified legal or compliance counsel before any compliance decisions are made. "
            "Verify all findings against the official text published in the Official Journal of "
            "the European Union (OJ L 2024/1689)."
        ),
    )

    raw = pdf.output()
    return bytes(raw)
