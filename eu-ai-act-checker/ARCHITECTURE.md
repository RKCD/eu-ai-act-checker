# Architecture and build direction

Written 2026-08-24. Read this before changing how assessments are produced.

## The problem this tool exists to solve

Ask a frontier model when the EU AI Act's high-risk obligations start applying
and it will answer confidently and wrongly, because the answer changed in
July 2026 and the model's knowledge did not. The failure is not ignorance.
It is ignorance that presents identically to knowledge.

So the product is not "a model that knows the AI Act". It is the layer around
the model: a sourced corpus, a constrained assembly path, and evals that show
where it holds and where it breaks.

## Core architectural decision

**The model classifies. The code owns the facts.**

The model never writes a date, a legal basis, or an in-force status. It selects
regime keys from an enum. `legal_corpus.py` resolves each key into the date,
the Article it rests on, the act that amended it, what the date used to be, and
whether it is live today — computed against the actual current date.

Why this and not better prompting: a model that generates dates can hallucinate
dates, and grounding reduces that probability without ever reaching zero. A
model that selects from an enum cannot produce a date that is not in the corpus.
The failure mode changes from "plausible wrong date" to "wrong regime selected",
which an eval catches and a reader can sanity-check.

This is the whole thesis. Do not undo it by letting date strings back into the
tool schema.

### Consequences

- One place to update after an amending act: `legal_corpus.py`.
- The system prompt and the response builder read the same dict, so the model
  can never be told one timeline while the answer is built from another.
- Unknown regime keys are dropped, not rendered. Omitting a deadline is a safer
  failure than inventing one. `unknown_regimes()` exposes drops so evals catch them.
- Every response carries corpus vintage and a staleness flag. The tool can say
  it might not know — which is the thing the post argues for.

## The three criteria, as testable properties

**Dynamically adaptive** — no date is hardcoded outside `legal_corpus.py`; no
"today" is hardcoded anywhere; in-force status is computed, never asserted; a
new amending act is a data edit, not a prompt rewrite.

**Reliable** — a named eval suite runs in one command and asserts regime, role,
risk tier and articles per case; a corpus older than `CORPUS_STALE_AFTER_DAYS`
degrades the answer visibly rather than silently.

**Professional** — every date shown carries its legal basis and, where amended,
the instrument that moved it and the date it moved from; the corpus vintage is
visible on the result; the reader can reach the Official Journal in one click.

## State

Done:
- `legal_corpus.py` — 10 regimes, provenance, resolution, staleness, prompt rendering.
  Verified against EUR-Lex search results and secondary sources on 2026-08-24.

Not done — build in this order:

### 1. Wire the corpus into `main.py`

Replace the model-generated `deadlines` array in `ASSESSMENT_TOOL`.

Old (delete): `deadlines: [{date, description, status, applies_to_this_system}]`

New: `applicable_regimes: [{regime: <enum from legal_corpus.regime_keys()>,
why_relevant: string}]` — the model contributes only relevance reasoning about
*this system*; never law.

In the handler: `deadlines = legal_corpus.resolve_all(assessment["applicable_regimes"])`,
attach `assessment["corpus"] = legal_corpus.corpus_metadata()`, and log
`legal_corpus.unknown_regimes(...)` so hallucinated keys are visible in the audit log.

In the system prompt: drop the hardcoded `Today is 2026-07-23` and the manual
date list; interpolate `legal_corpus.regime_reference_block()` instead. Keep it
inside the cached system block — it is stable between requests.

Note: `regime_reference_block()` uses `→`. Fine over the API (UTF-8), but avoid
printing it to a Windows console without encoding set.

### 2. Fix the knowledge document

`knowledge/eu_ai_act.md` still contradicts the corpus. Remove every application
date from it and let it cover only classification substance — Annex III
categories, Article 5 practices, role definitions, obligations. Two sources of
truth for dates is the bug the whole design exists to prevent.

Specifically wrong today: Art 50 marked `UPCOMING` (it has applied since
2 August 2026); the Art 50(2) transitional grace period is absent; the key-dates
table duplicates what the corpus now owns.

### 3. Eval harness

`tests/eval_cases.json` + `tests/run_evals.py`. One command, exit non-zero on
failure, per-case assertions on `risk_classification.category`,
`role_analysis.determined_role`, the resolved regime keys, and required articles.

Minimum cases: CV screening (high-risk Annex III / provider / annex III regime);
support chatbot (limited risk / deployer / art_50_transparency, and it must come
back **in force**, not upcoming); social scoring by a public body (prohibited /
art_5_prohibitions); a generative system on the market before 2 August 2026
(must surface `art_50_2_marking_legacy`); spam filter (minimal risk, no regimes).

Assert the *regime key*, not the date string. Dates live in the corpus; the eval
checks that the model routed to the right regime.

### 4. Frontend provenance

Show, per deadline: legal basis, `change_note` where present, and a link to the
instrument. Show corpus vintage on the result. Render `is_stale` as a visible
banner. Countdown urgency currently triggers under 365 days — reconsider now
that the nearest real deadline is 100 days out and the far one is 465.

### 5. Freshness watcher

Scheduled check against EUR-Lex for acts amending 2024/1689 later than
`CORPUS_VERIFIED_ON`. It should notify, not auto-edit — a regulatory corpus
should not mutate without a human reading the text. Note that
`eur-lex.europa.eu/eli/...` returns empty to plain fetches; the
`legal-content/EN/TXT/HTML/?uri=OJ%3A...` form is the fetchable one.

### 6. Per-recipient access codes

One shared password cannot attribute a query to a person, which is what the
twenty-conversations plan needs. Move to per-recipient codes with a label, and
record the label in the audit log.

## Rules for anyone editing this

- Never let a date string into the tool schema.
- Never assert a legal fact this repo cannot cite. If a sub-paragraph is
  uncertain, cite at the level you are sure of.
- Bump `CORPUS_VERSION` and `CORPUS_VERIFIED_ON` when the corpus changes, and
  say what was checked against what.
- The disclaimer stays on every surface. This is not legal advice.
