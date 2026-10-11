/**
 * Abivajaja agent. Järjekord:
 *  1. Deterministlik ohumärkide kontroll (alati, enne mudelit) → 112.
 *  2. Claude API (kui ANTHROPIC_API_KEY on olemas) – struktureeritud JSON väljund.
 *  3. Reeglipõhine varuagent (API puudumisel või vea korral).
 * Küsimuste arv on koodis piiratud (konf: agent.maxClarifyingQuestions).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { CATEGORIES, SPECIAL_NEEDS, taipConfig, URGENCIES, type Locale } from "@config/taip.config";
import { detectDangerSigns, type DangerSign } from "@/domain/triage";
import type { Category, SpecialNeed, Urgency } from "@/domain/types";
import { t } from "@/i18n/messages";
import { log } from "@/lib/log";
import { analyze } from "./heuristic";

export type AgentTurn = { role: "user" | "assistant"; text: string; questionKind?: string };

export type StructuredNeed = {
  categories: Category[];
  urgency: Urgency;
  householdSize: number;
  specialNeeds: SpecialNeed[];
  summary: string;
};

export type AgentResult =
  | { kind: "emergency"; signs: DangerSign[] }
  | { kind: "question"; text: string; questionKind: string; questionsAsked: number }
  | { kind: "summary"; need: StructuredNeed; engine: "claude" | "rules" };

export type AgentContext = { locale: Locale; defaultHouseholdSize: number; defaultSpecialNeeds: SpecialNeed[] };

const NeedSchema = z.object({
  categories: z.array(z.enum(CATEGORIES)).min(1),
  urgency: z.enum(URGENCIES),
  householdSize: z.number().int().min(1).max(50),
  specialNeeds: z.array(z.enum(SPECIAL_NEEDS)),
  summary: z.string().min(1).max(600),
});

const ReplySchema = z.object({
  action: z.enum(["ask", "summarize"]),
  question: z.string().nullable(),
  need: NeedSchema.nullable(),
});

const REPLY_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["action", "question", "need"],
  properties: {
    action: { type: "string", enum: ["ask", "summarize"] },
    question: { type: ["string", "null"] },
    need: {
      anyOf: [
        { type: "null" },
        {
          type: "object",
          additionalProperties: false,
          required: ["categories", "urgency", "householdSize", "specialNeeds", "summary"],
          properties: {
            categories: { type: "array", items: { type: "string", enum: [...CATEGORIES] } },
            urgency: { type: "string", enum: [...URGENCIES] },
            householdSize: { type: "integer" },
            specialNeeds: { type: "array", items: { type: "string", enum: [...SPECIAL_NEEDS] } },
            summary: { type: "string" },
          },
        },
      ],
    },
  },
} as const;

let cachedPrompt: string | undefined;
function systemPromptTemplate(): string {
  cachedPrompt ??= readFileSync(path.join(process.cwd(), "prompts", "agent-system.md"), "utf8");
  return cachedPrompt;
}

export function questionsAsked(turns: AgentTurn[]) {
  return turns.filter((x) => x.role === "assistant").length;
}

export async function runAgentStep(turns: AgentTurn[], ctx: AgentContext, opts: { useLlm?: boolean } = {}): Promise<AgentResult> {
  const userText = turns.filter((x) => x.role === "user").map((x) => x.text).join("\n");
  const signs = detectDangerSigns(userText);
  if (signs.length > 0) return { kind: "emergency", signs };

  const asked = questionsAsked(turns);
  const canAsk = asked < taipConfig.agent.maxClarifyingQuestions;
  const useLlm = opts.useLlm ?? !!process.env.ANTHROPIC_API_KEY;

  if (useLlm) {
    try {
      const r = await claudeStep(turns, ctx, canAsk ? taipConfig.agent.maxClarifyingQuestions - asked : 0);
      if (r?.kind === "summary" && r.need.urgency === "critical") return { kind: "emergency", signs: [] };
      if (r?.kind === "question" && canAsk) return { ...r, questionsAsked: asked + 1 };
      if (r?.kind === "summary") return r;
    } catch (e) {
      log("agent.llm_error", { error: e instanceof Error ? e.name : "unknown" });
    }
  }
  return rulesStep(turns, ctx, canAsk);
}

async function claudeStep(turns: AgentTurn[], ctx: AgentContext, questionsLeft: number): Promise<AgentResult | null> {
  const client = new Anthropic();
  const system = systemPromptTemplate()
    .replaceAll("{{locale}}", ctx.locale)
    .replaceAll("{{maxQuestions}}", String(taipConfig.agent.maxClarifyingQuestions))
    .replaceAll("{{questionsLeft}}", String(questionsLeft));
  const context = `Leibkonna andmed profiilist: ${ctx.defaultHouseholdSize} inimest; erivajadused: ${ctx.defaultSpecialNeeds.join(", ") || "puuduvad"}.${questionsLeft === 0 ? " Küsimusi enam ei ole – tee kokkuvõte." : ""}`;

  const messages: Anthropic.Beta.BetaMessageParam[] = turns.map((x) => ({ role: x.role, content: x.text }));
  messages[0] = { role: "user", content: `${context}\n\n${turns[0]?.text ?? ""}` };

  const response = await client.beta.messages.create({
    model: taipConfig.agent.model,
    max_tokens: 4000,
    system,
    messages,
    output_config: { effort: "low", format: { type: "json_schema", schema: REPLY_JSON_SCHEMA as unknown as Record<string, unknown> } },
    fallbacks: "default",
    betas: ["server-side-fallback-2026-07-01"],
  });
  if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") return null;
  const text = response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  const parsed = ReplySchema.safeParse(JSON.parse(text));
  if (!parsed.success) return null;
  const reply = parsed.data;
  if (reply.action === "ask" && reply.question && questionsLeft > 0) {
    return { kind: "question", text: reply.question, questionKind: "llm", questionsAsked: 0 };
  }
  if (reply.need) return { kind: "summary", need: reply.need, engine: "claude" };
  return null;
}

function rulesStep(turns: AgentTurn[], ctx: AgentContext, canAsk: boolean): AgentResult {
  const s = analyze(turns);
  const m = t(ctx.locale);
  const askedKinds = new Set(turns.filter((x) => x.role === "assistant").map((x) => x.questionKind));
  const asked = questionsAsked(turns);

  if (canAsk) {
    if (s.categories.length === 0 && !askedKinds.has("category"))
      return { kind: "question", text: m.q.category, questionKind: "category", questionsAsked: asked + 1 };
    if (!s.urgency && !askedKinds.has("urgency"))
      return { kind: "question", text: m.q.urgency, questionKind: "urgency", questionsAsked: asked + 1 };
  }

  const categories: Category[] = s.categories.length ? s.categories : ["other"];
  const urgency: Urgency = s.urgency ?? "normal";
  const householdSize = s.householdSize ?? ctx.defaultHouseholdSize;
  const specialNeeds = [...new Set([...ctx.defaultSpecialNeeds, ...s.specialNeeds])];
  const summary = `${categories.map((c) => m.categories[c]).join(", ")} · ${m.urgency[urgency]} · ${householdSize} ${m.people}${
    specialNeeds.length ? " · " + specialNeeds.map((x) => m.specialNeeds[x]).join(", ") : ""
  }`;
  return { kind: "summary", need: { categories, urgency, householdSize, specialNeeds, summary }, engine: "rules" };
}
