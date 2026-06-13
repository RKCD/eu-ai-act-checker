import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import anthropic
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

load_dotenv()

app = FastAPI(title="EU AI Act Readiness Check")
app.mount("/static", StaticFiles(directory="static"), name="static")

KNOWLEDGE_PATH = Path("knowledge/eu_ai_act.md")
KNOWLEDGE_CONTENT = KNOWLEDGE_PATH.read_text(encoding="utf-8")

LOG_PATH = Path("logs/assessments.jsonl")
LOG_PATH.parent.mkdir(exist_ok=True)

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# ── Structured output schema ──────────────────────────────────────────────────

ASSESSMENT_TOOL: dict[str, Any] = {
    "name": "submit_readiness_assessment",
    "description": "Submit the complete EU AI Act readiness assessment as structured data.",
    "input_schema": {
        "type": "object",
        "properties": {
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
                        }
                    },
                    "required": ["obligation", "article", "source_type"]
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
            "in_scope",
            "risk_classification",
            "key_obligations",
            "deadlines",
            "next_steps",
            "confidence"
        ]
    }
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
- Today is 2026-06-13. The 2 August 2026 deadline is ~7 weeks away — flag urgency.
- Tailor obligations strictly to the stated role (provider / deployer / importer /
  distributor / not sure). "Not sure" → provide obligations for both provider and deployer.

EU AI ACT REFERENCE DOCUMENT:
{knowledge}"""


# ── Request / Response models ─────────────────────────────────────────────────

class AssessmentRequest(BaseModel):
    company_description: str
    ai_system_description: str
    sector: str
    role: str


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
async def serve_frontend():
    return FileResponse("static/index.html")


@app.get("/health")
async def health():
    return {"status": "ok", "knowledge_loaded": bool(KNOWLEDGE_CONTENT)}


@app.post("/assess")
async def assess(request: AssessmentRequest) -> dict[str, Any]:
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
            system=SYSTEM_PROMPT.format(knowledge=KNOWLEDGE_CONTENT),
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
        },
    }
    with open(LOG_PATH, "a", encoding="utf-8") as f:
        f.write(json.dumps(log_entry, ensure_ascii=False) + "\n")

    return assessment
