# EU AI Act Readiness Check

An AI-powered compliance assessment tool that classifies your AI system under
Regulation (EU) 2024/1689 (the EU AI Act) and generates a one-page readiness map.

> **Legal disclaimer**: Informational tool only — not legal advice.
> Always verify outputs with qualified legal or compliance counsel.

---

## Architecture

```
Browser (plain HTML)
        │  POST /assess {company, ai_system, sector, role, access_code}
        ▼
FastAPI (main.py)
        │  Checks access_code against APP_PASSWORD (if set)        ← access gate
        │  Checks rate limit (1 req / 60s / IP)
        │  Loads knowledge/eu_ai_act.md into system prompt          ← cached server-side
        │  Calls Claude API (claude-sonnet-4-6) with forced tool use
        │  Receives structured JSON (6 sections)
        │  Appends to logs/assessments.jsonl   ← audit trail
        ▼
static/index.html
        Renders the JSON readiness map:
        1. In scope?
        2. Risk classification (prohibited / high-risk / limited / minimal / GPAI)
        3. Key obligations for your role
        4. Compliance deadlines (in force vs upcoming)
        5. Three concrete next steps
        6. Confidence + information gaps
        "Download PDF" → POST /export-pdf {assessment JSON} → pdf_export.py
                          (pure formatting, no extra Claude call)
```

## Setup

**Requirements**: Python 3.11+

```bash
cd eu-ai-act-checker
pip install -r requirements.txt
cp .env.example .env       # then open .env and add your Anthropic API key
```

**Optional access gate**: set `APP_PASSWORD` in `.env` to require a code before
`/assess` will run. Leave blank locally; always set it in production (Render env
vars) so a public URL can't be used to spend your API credits.

## Run

```bash
uvicorn main:app --reload
```

Open `http://localhost:8000`

## Test cases

Five canonical test scenarios are in `tests/cases.md`:

| # | Scenario | Expected classification |
|---|----------|------------------------|
| 1 | Customer service chatbot | Limited risk (Art 50 transparency) |
| 2 | CV-screening / hiring AI | High-risk Annex III §4 |
| 3 | Energy forecasting tool | Minimal risk (borderline case) |
| 4 | AI in Class IIb medical device | High-risk Art 6(1) product-safety path |
| 5 | Email spam filter | Minimal risk |

Run each case through the app and fill in the "Actual output" sections in `tests/cases.md`.

## Key design decisions

| Decision | Reason |
|----------|--------|
| FastAPI + plain HTML | Minimal stack, no build step, easy to deploy anywhere |
| Claude tool use (forced) | Reliable structured JSON output without parsing fragility |
| `knowledge/eu_ai_act.md` in system prompt | Single source of truth; no vector DB needed at this scale |
| JSONL audit log | Append-only, human-readable, demonstrates auditability by design |
| Fact vs interpretation labels | Required by compliance best-practice; users know what to verify |
| Prompt caching on system+tools | Knowledge doc is static — caching cuts ~90% off repeat-call input cost |
| PDF built from existing JSON | `/export-pdf` formats data already returned — no second Claude call, no extra cost |
| Password gate, not full auth | One env var, no user accounts/sessions — matches "keep it simple" while still closing the public endpoint |

## Audit log

Every assessment is appended to `logs/assessments.jsonl` (gitignored).
Each line is a JSON object with: `timestamp`, `input`, `output`, `model`, `usage`.

## Roadmap (v1)

- [x] Auth — access-code gate before `/assess` (v0.2)
- [x] PDF export — printable readiness report via `/export-pdf` (v0.2)
- [x] Prompt caching — cuts repeat-call cost on the static knowledge doc (v0.2)
- [ ] Human-review checkpoint — flag assessments for manual legal sign-off
- [ ] Decision log viewer — browse past assessments in the UI
- [ ] Streaming — show classification sections as they arrive
