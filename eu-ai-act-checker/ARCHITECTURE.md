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
- Step 1 (wire the corpus into `main.py`) and step 2 (strip dates from
  `knowledge/eu_ai_act.md`) — done 2026-08-24, commit 40666ef. Verified live
  against production: Annex III correctly resolves to 2 December 2027/upcoming;
  Art 50 correctly resolves to 2 August 2026/in_force (previously mis-flagged as
  upcoming — the bug the LinkedIn post is about); a generative system with an
  on-market-since-2024 fact pattern correctly surfaces
  `art_50_2_marking_legacy` (2 December 2026), which the prior version could not
  represent at all. Open item from that test run: on a minimal-risk system the
  model still selected `art_5_prohibitions` and `enforcement_penalties` as
  "applicable" baseline-framework regimes rather than returning an empty list.
  Defensible, but pin the expected behavior explicitly in the step-3 eval cases
  so it doesn't drift silently either way.

Not done — build in this order:

### 1. Wire the corpus into `main.py` — DONE, see above.

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

### 2. Fix the knowledge document — DONE, see above.

`knowledge/eu_ai_act.md` still contradicts the corpus. Remove every application
date from it and let it cover only classification substance — Annex III
categories, Article 5 practices, role definitions, obligations. Two sources of
truth for dates is the bug the whole design exists to prevent.

Specifically wrong today: Art 50 marked `UPCOMING` (it has applied since
2 August 2026); the Art 50(2) transitional grace period is absent; the key-dates
table duplicates what the corpus now owns.

### 3. Eval harness — DONE (partially verified), 2026-08-24, commit 3a2b5db.

`tests/eval_cases.json` + `tests/run_evals.py`, run with
`python tests/run_evals.py` from the repo root. Runs in-process via Starlette's
TestClient (no server needed), real Claude API calls, distinct
`X-Forwarded-For` per case to dodge the per-IP rate limiter. Asserts risk
category, role, required/forbidden regime keys, per-regime status, article
substrings, minimum confidence, corpus staleness, and that no regime key was
dropped as unknown.

Building it caught a real bug before any case ran: the model was including
`art_5_prohibitions` and `enforcement_penalties` in `applicable_regimes` for
minimal-risk systems just because it had checked and ruled them out, not
because either had anything to attach to. Fixed in the prompt (see main.py's
DATES rules) and pinned as the `spam_filter_minimal_risk` case.

First run: 3/5 passed clean; the other 2 hit an Anthropic billing wall mid-run
(account out of credit), not a logic failure — the harness correctly told the
two failure modes apart (HTTP 502 from billing vs. an assertion failure) and
exited 1 either way. Re-run after topping up credits: **5/5 passed**,
2026-08-24. This is the passing baseline — run this after touching the prompt,
the schema, or `legal_corpus.py`.

### 4. Frontend provenance — DONE, 2026-08-24, commit 3a2b5db.

Each deadline card now shows its legal basis, `change_note` where the corpus
records one, and a link to the source instrument. A stale-corpus banner
renders prominently when `corpus.is_stale`. A corpus vintage footer (verified
date, assessed date, linked instruments) is always shown. Countdown urgency
threshold unified at 180 days (was inconsistently 60 in the per-deadline chip
and 365 in the hero pill — both left over from before the corpus rewrite,
neither matched the real deadline spread of ~100 and ~465 days).

Verified by injecting a synthetic assessment via `javascript_tool` against the
static file (API credits were exhausted at the time) — confirmed the stale
banner, both countdown urgency states, the provenance block, and the corpus
footer all render correctly. Not yet re-verified against a live `/assess`
response rendered in the actual page (the eval suite exercises the JSON shape,
not the DOM) — reasonable to do once, but low risk since the JSON shape is
identical to what was injected.

### 5. Freshness watcher — DONE, 2026-08-24, but not as originally scoped.

Originally planned as a plain scheduled script hitting EUR-Lex directly. That
doesn't work: EUR-Lex sits behind an AWS WAF bot challenge (confirmed via
curl — every request gets `202 Accepted` with `x-amzn-waf-action: challenge`,
regardless of User-Agent), so no headless HTTP client can read it. Building a
scraper that silently reported "no changes" against a blocked request would
have been worse than no watcher at all — false confidence beats no watcher.

What's running instead: a scheduled Claude Code cloud routine (via the
`RemoteTrigger` API / `schedule` skill), **"EU AI Act corpus freshness
check"**, `trig_01EdKDTyYY7vZna4kAt3H4rW`, cron `0 7 1 * *` (1st of month,
07:00 UTC). Each run: reads `legal_corpus.py` from the repo, researches via
`WebSearch`/`WebFetch` whether anything new amends Regulation (EU) 2024/1689,
and — critically — has only `WebFetch`/`WebSearch` in its tool allowlist, no
`Write`/`Edit`, so it is structurally incapable of touching the corpus. It
reports findings in its final message; on a real finding it also fires a
mobile push notification (via a `PushNotification` tool that turned out to be
available in the CCR sandbox regardless of the configured allowlist).

Turns out the CCR sandbox's network egress is *more* restricted than my own
session's: `WebFetch` got `EGRESS_BLOCKED` against eur-lex.europa.eu **and**
every law-firm domain tried (whitecase.com, klgates.com, aiactblog.nl) in
testing — not a EUR-Lex-specific block, closer to a general external-fetch
wall. `WebSearch` still works and returns real snippets, so the routine's
actual method is: search, cross-reference the returned snippets across as
many independent secondary sources as it can find (law firm alerts,
specialist trackers, official press releases), and only conclude something
if several independent sources agree — never on a single source, and never
by reading the primary text.

**What this means in practice:** the check is "convergent secondary-source
monitoring," not "reads the Official Journal." Verified this actually
detects a real change, not just runs without error: created a one-off test
routine with an *empty* known-acts set and a `CORPUS_VERIFIED_ON` set before
2026/1744 existed, ran it, and it correctly found 2026/1744 via ~8
independent secondary sources, got the citation/dates/substance right, and
pushed a notification — all despite every direct `WebFetch` in that run being
blocked too. Test routine disabled after review
(`trig_01VwizvzArTprVqeGXTTKu1o` — Robert can delete it at
claude.ai/code/routines; the API has no delete).

**Known gap:** the routine only notifies on a finding (Outcome B). On "nothing
new" (Outcome A) or "couldn't determine" (Outcome C) it ends quietly — so
silence is ambiguous between "checked, nothing new" and "silently failed to
run" (GitHub access lapsing again, a billing block, etc.). Confirm it's alive
via claude.ai/code/routines (shows `last_fired_at`, `next_run_at`) or by
asking a future Claude Code session to pull `RemoteTrigger action:list_runs`
for the trigger ID above. A cheap fix worth considering: have it always push a
one-line monthly heartbeat even on Outcome A, trading one low-urgency
notification a month for a positive "it's alive" signal — not done, since it
changes the notification cadence and that's Robert's call, not an
architecture default.

### 6. Per-recipient access codes — DONE, 2026-08-24.

`APP_PASSWORD` stays as the owner's own always-valid code (logged as
`"owner"`). New `ACCESS_CODES` env var — a JSON object of `{code: label}` —
adds one code per invited person; `_check_access_code` now returns the
resolved label, and `/assess` records it as `recipient` in the audit log
instead of the raw code (the raw code is stripped from the logged input —
it's a working credential, it has no reason to persist in a log file).
Malformed `ACCESS_CODES` JSON fails loudly at startup rather than silently
disabling the gate.

No server-side store for codes — they live only in Render's `ACCESS_CODES`
env var. `scripts/new_access_code.py` keeps a local working copy
(`access_codes.local.json`, gitignored — it holds live credentials) so
minting a new code doesn't mean reconstructing the whole JSON blob by hand;
it prints the updated JSON to paste into Render. To revoke a code, delete its
entry from that local file and re-run the script to get the updated JSON.

Verified: gate logic unit-tested directly (valid recipient code, owner code,
invalid code, malformed-JSON startup failure) — no Claude call needed since
the gate runs before the API call. Not yet exercised end-to-end against a
live per-recipient code in production; do that once a real code is issued.

## Rules for anyone editing this

- Never let a date string into the tool schema.
- Never assert a legal fact this repo cannot cite. If a sub-paragraph is
  uncertain, cite at the level you are sure of.
- Bump `CORPUS_VERSION` and `CORPUS_VERIFIED_ON` when the corpus changes, and
  say what was checked against what.
- The disclaimer stays on every surface. This is not legal advice.
