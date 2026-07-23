import json
import os
import time
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import anthropic
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from pdf_export import build_pdf

load_dotenv()

app = FastAPI(title="EU AI Act Readiness Check")
app.mount("/static", StaticFiles(directory="static"), name="static")

KNOWLEDGE_PATH = Path("knowledge/eu_ai_act.md")
KNOWLEDGE_CONTENT = KNOWLEDGE_PATH.read_text(encoding="utf-8")

LOG_PATH = Path("logs/assessments.jsonl")
LOG_PATH.parent.mkdir(exist_ok=True)

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# ── Rate limiting (1 request / 60 s / IP, in-memory) ─────────────────────────

_last_request: dict[str, float] = defaultdict(float)
RATE_LIMIT_SECONDS = 60


def _client_ip(request: Request) -> str:
    # Render (and most proxies) forward the real IP in X-Forwarded-For
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host or "unknown"


def _check_rate_limit(ip: str) -> None:
    now = time.monotonic()
    if now - _last_request[ip] < RATE_LIMIT_SECONDS:
        remaining = int(RATE_LIMIT_SECONDS - (now - _last_request[ip]))
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit: one assessment per minute per IP. Try again in {remaining}s.",
        )
    _last_request[ip] = now


# ── Access gate ────────────────────────────────────────────────────────────
# If APP_PASSWORD is unset, the gate is a no-op (convenient for local dev).
# Set it in production (e.g. Render env vars) to require an access code.

APP_PASSWORD = os.getenv("APP_PASSWORD", "")


def _check_access_code(submitted: str) -> None:
    if APP_PASSWORD and submitted != APP_PASSWORD:
        raise HTTPException(status_code=401, detail="Incorrect access code.")


# ── Structured output schema ──────────────────────────────────────────────────

ASSESSMENT_TOOL: dict[str, Any] = {
    "name": "submit_readiness_assessment",
    "description": "Submit the complete EU AI Act readiness assessment as structured data.",
    "input_schema": {
        "type": "object",
        "properties": {
            "role_analysis": {
                "type": "object",
                "description": "Explicit determination of the user's role in the AI value chain.",
                "properties": {
                    "determined_role": {
                        "type": "string",
                        "enum": ["provider", "deployer", "both", "unclear"],
                        "description": "provider = develops/places on market; deployer = uses under own authority; both = does both; unclear = description is ambiguous."
                    },
                    "reasoning": {
                        "type": "string",
                        "description": "Why this role was determined, citing Art 3(3) or 3(4) definitions."
                    },
                    "note_if_unclear": {
                        "type": "string",
                        "description": "If unclear, what specific information would resolve the ambiguity."
                    }
                },
                "required": ["determined_role", "reasoning"]
            },
            "in_scope": {
                "type": "object",
                "description": "Whether the AI system falls within the territorial and material scope of the EU AI Act.",
                "properties": {
                    "verdict": {
                        "type": "string",
                        "enum": ["yes", "no", "partially"],
                        "description": "Is this system in scope of the EU AI Act?"
                    },
                    "reasoning": {
                        "type": "string",
                        "description": "Explanation of the scope determination, citing relevant articles."
                    },
                    "source_type": {
                        "type": "string",
                        "enum": ["fact_from_act", "interpretation", "mixed"],
                        "description": "fact_from_act = directly stated in the regulation; interpretation = applying general rules to this specific case; mixed = both."
                    },
                    "articles_cited": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Only include article/annex numbers you are certain of."
                    }
                },
                "required": ["verdict", "reasoning", "source_type", "articles_cited"]
            },
            "risk_classification": {
                "type": "object",
                "description": "Risk tier classification under the EU AI Act.",
                "properties": {
                    "category": {
                        "type": "string",
                        "enum": [
                            "prohibited",
                            "high_risk_annex_iii",
                            "high_risk_product_safety",
                            "limited_risk",
                            "minimal_risk",
                            "gpai",
                            "unclear"
                        ],
                        "description": "Risk category. Use 'unclear' only when genuinely ambiguous."
                    },
                    "label": {
                        "type": "string",
                        "description": "Human-readable label, e.g. 'High-Risk (Annex III — Employment)'."
                    },
                    "reasoning": {
                        "type": "string",
                        "description": "Step-by-step reasoning through the classification decision tree."
                    },
                    "source_type": {
                        "type": "string",
                        "enum": ["fact_from_act", "interpretation", "mixed"]
                    },
                    "articles_cited": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Articles and Annex sections cited."
                    }
                },
                "required": ["category", "label", "reasoning", "source_type", "articles_cited"]
            },
            "key_obligations": {
                "type": "array",
                "description": "Key obligations for this specific role and risk level, as actionable items.",
                "items": {
                    "type": "object",
                    "properties": {
                        "obligation": {
                            "type": "string",
                            "description": "Concrete obligation in plain language."
                        },
                        "article": {
                            "type": "string",
                            "description": "Article reference, or 'see EU AI Act' if unsure."
                        },
                        "source_type": {
                            "type": "string",
                            "enum": ["fact_from_act", "interpretation"]
                        },
                        "for_role": {
                            "type": "string",
                            "enum": ["provider", "deployer", "both"],
                            "description": "Which role this obligation applies to."
                        }
                    },
                    "required": ["obligation", "article", "source_type", "for_role"]
                }
            },
            "deadlines": {
                "type": "array",
                "description": "EU AI Act compliance deadlines relevant to this system.",
                "items": {
                    "type": "object",
                    "properties": {
                        "date": {
                            "type": "string",
                            "description": "Date in 'D Month YYYY' format."
                        },
                        "description": {
                            "type": "string",
                            "description": "What becomes applicable or required on this date."
                        },
                        "status": {
                            "type": "string",
                            "enum": ["in_force", "upcoming"],
                            "description": "in_force = already applies as of 2026-06-13; upcoming = not yet."
                        },
                        "applies_to_this_system": {
                            "type": "boolean",
                            "description": "Does this deadline specifically apply to the system described?"
                        }
                    },
                    "required": ["date", "description", "status", "applies_to_this_system"]
                }
            },
            "next_steps": {
                "type": "array",
                "description": "Exactly three concrete next steps ordered by urgency (most urgent first).",
                "minItems": 3,
                "maxItems": 3,
                "items": {
                    "type": "object",
                    "properties": {
                        "step": {
                            "type": "string",
                            "description": "Actionable step in plain language."
                        },
                        "urgency": {
                            "type": "string",
                            "enum": ["immediate", "short_term", "medium_term"],
                            "description": "immediate = do now; short_term = within weeks; medium_term = within months."
                        },
                        "rationale": {
                            "type": "string",
                            "description": "Why this step matters and what happens if skipped."
                        }
                    },
                    "required": ["step", "urgency", "rationale"]
                }
            },
            "confidence": {
                "type": "object",
                "description": "Confidence in the assessment and information gaps.",
                "properties": {
                    "level": {
                        "type": "string",
                        "enum": ["high", "medium", "low"],
                        "description": "How confident is this classification given available information?"
                    },
                    "rationale": {
                        "type": "string",
                        "description": "What drives the confidence level."
                    },
                    "missing_information": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Specific information that, if available, would change or sharpen the assessment."
                    }
                },
                "required": ["level", "rationale", "missing_information"]
            }
        },
        "required": [
            "role_analysis",
            "in_scope",
            "risk_classification",
            "key_obligations",
            "deadlines",
            "next_steps",
            "confidence"
        ]
    },
    # Marks the cache breakpoint: this tool definition + everything before it
    # (the system prompt + knowledge doc) gets cached between requests, so
    # repeat calls only pay full price for the small per-request user message.
    "cache_control": {"type": "ephemeral"}
}

SYSTEM_PROMPT = """You are an expert EU AI Act compliance analyst. You assess AI systems
against Regulation (EU) 2024/1689 using the reference document provided below.

ANALYSIS METHOD — follow this sequence for every assessment:
1. Scope check: Is this an AI system (Art 3(1)) and does Art 2 apply?
2. Prohibited practices check (Art 5): Does any prohibition apply?
3. GPAI check (Art 3(63)): Is this a general-purpose AI model?
4. High-risk path A (Art 6(1)): Safety component in Annex I product requiring notified body?
5. High-risk path B (Art 6(2) + Annex III): Does it fall under one of the 8 Annex III domains?
6. Limited-risk check (Art 50): Chatbot / deepfake / emotion recognition transparency?
7. Minimal risk: Default if none above applies.

ACCURACY RULES — non-negotiable:
- Only cite article/annex numbers you are certain about from the reference document.
  If unsure of the exact number, write "see the EU AI Act" — never invent numbers.
- Mark each finding as:
    fact_from_act   → the regulation explicitly covers this situation
    interpretation  → you are applying a general rule to this specific system
    mixed           → combination of both
- When two risk categories could apply, choose the HIGHER one and explain.
- Today is 2026-07-23.

GROUNDING RULES — DATES (post-Digital Omnibus 2026, non-negotiable):
- Art 5 prohibited practices: IN FORCE since 2 February 2025.
- GPAI obligations: IN FORCE since 2 August 2025.
- Art 50 transparency (chatbots, deepfakes): 2 AUGUST 2026.
- HIGH-RISK ANNEX III (standalone AI systems): 2 DECEMBER 2027. NEVER cite 2 August 2026
  for this — it was deferred by the Digital Omnibus. Citing the wrong date is a material error.
- High-risk Art 6(1) embedded in products: 2 AUGUST 2028.

ROLE RULES:
- Determine provider vs deployer from the description using Art 3(3) and 3(4) definitions.
- If the company both built and uses the system → role is "both"; list obligations for each.
- If role is unclear → say what information would resolve it; list obligations for both roles.
- Tailor every obligation to the determined role. Label each obligation's for_role field.
- Deployer obligations (Art 26/27) are distinct from provider obligations — list both when role is "both".

EU AI ACT REFERENCE DOCUMENT:
{knowledge}"""

# Rendered once at startup — this string never changes between requests, which
# is exactly what makes it a good prompt-cache candidate (see SYSTEM_BLOCKS below).
_SYSTEM_PROMPT_RENDERED = SYSTEM_PROMPT.format(knowledge=KNOWLEDGE_CONTENT)

# Passing system as a list (instead of a plain string) lets us attach
# cache_control: Claude caches this whole block server-side for ~5 minutes,
# so repeat assessments only pay full input price for the short user message.
SYSTEM_BLOCKS = [
    {
        "type": "text",
        "text": _SYSTEM_PROMPT_RENDERED,
        "cache_control": {"type": "ephemeral"},
    }
]


# ── Request / Response models ─────────────────────────────────────────────────

class AssessmentRequest(BaseModel):
    company_description: str
    ai_system_description: str
    sector: str
    role: str
    access_code: str = ""


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
async def serve_frontend():
    return FileResponse("static/index.html")


@app.get("/health")
async def health():
    return {"status": "ok", "knowledge_loaded": bool(KNOWLEDGE_CONTENT)}


@app.post("/assess")
async def assess(http_request: Request, request: AssessmentRequest) -> dict[str, Any]:
    _check_access_code(request.access_code)
    _check_rate_limit(_client_ip(http_request))
    user_message = (
        f"Please assess this AI system under the EU AI Act:\n\n"
        f"COMPANY DESCRIPTION:\n{request.company_description}\n\n"
        f"AI SYSTEM / USE CASE:\n{request.ai_system_description}\n\n"
        f"SECTOR: {request.sector}\n\n"
        f"ROLE IN AI VALUE CHAIN: {request.role}\n\n"
        "Work through the classification decision tree step by step, then call "
        "submit_readiness_assessment with your complete structured assessment."
    )

    try:
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            system=SYSTEM_BLOCKS,
            tools=[ASSESSMENT_TOOL],
            tool_choice={"type": "tool", "name": "submit_readiness_assessment"},
            messages=[{"role": "user", "content": user_message}],
        )
    except anthropic.APIError as exc:
        raise HTTPException(status_code=502, detail=f"Claude API error: {exc}") from exc

    tool_block = next(
        (block for block in response.content if block.type == "tool_use"),
        None,
    )
    if not tool_block:
        raise HTTPException(status_code=500, detail="No structured response returned by the model.")

    assessment: dict[str, Any] = tool_block.input

    # Audit log — every assessment is recorded for accountability
    log_entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "input": request.model_dump(),
        "output": assessment,
        "model": response.model,
        "usage": {
            "input_tokens": response.usage.input_tokens,
            "output_tokens": response.usage.output_tokens,
            "cache_creation_input_tokens": getattr(response.usage, "cache_creation_input_tokens", 0),
            "cache_read_input_tokens": getattr(response.usage, "cache_read_input_tokens", 0),
        },
    }
    with open(LOG_PATH, "a", encoding="utf-8") as f:
        f.write(json.dumps(log_entry, ensure_ascii=False) + "\n")

    return assessment


@app.post("/export-pdf")
async def export_pdf(assessment: dict[str, Any]) -> Response:
    """Render an already-generated assessment as a downloadable PDF.
    Takes the JSON the frontend already has — no extra Claude API call."""
    pdf_bytes = build_pdf(assessment)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=eu-ai-act-readiness.pdf"},
    )
