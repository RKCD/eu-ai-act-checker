/**
 * Varjendi upgrade: vabatekstist struktureeritud päring tehnopartnerile.
 * Claude API olemasolul kasutatakse mudelit, muidu märksõnapõhist tuletust.
 * Taip! ei ehita – ainult koostab päringu ja suunab partnerile.
 */
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { taipConfig } from "@config/taip.config";
import { log } from "@/lib/log";

export type UpgradeStructure = {
  spaceType: "basement" | "underground" | "house" | "other";
  dimensions?: string;
  needs: { ventilation: boolean; heating: boolean; water: boolean; comms: boolean };
};

const Schema = z.object({
  spaceType: z.enum(["basement", "underground", "house", "other"]),
  dimensions: z.string().nullable(),
  needs: z.object({ ventilation: z.boolean(), heating: z.boolean(), water: z.boolean(), comms: z.boolean() }),
});

export function structureUpgradeRules(text: string): UpgradeStructure {
  const t = text.toLowerCase();
  const spaceType = /kelder|basement|подвал|підвал/.test(t) ? "basement"
    : /maa-alune|punker|underground|bunker|бункер/.test(t) ? "underground"
    : /maja|house|дом|будин/.test(t) ? "house" : "other";
  const dim = text.match(/(\d+[.,]?\d*)\s*(m2|m²|ruutu|ruutmeetrit|sq)/i) ?? text.match(/\d+\s*[x×]\s*\d+\s*m?/i);
  return {
    spaceType,
    dimensions: dim?.[0],
    needs: {
      ventilation: /ventil|õhk|niiske|hallit|ventilat|air|вентиляц|сыр|волог/.test(t),
      heating: /küt|soe|külm|ahi|heat|cold|отоплен|холод|опален/.test(t),
      water: /vesi|vett|kaev|water|вод/.test(t),
      comms: /side|levi|raadio|internet|signal|связ|зв'яз|радио|радіо/.test(t),
    },
  };
}

export async function structureUpgrade(text: string): Promise<UpgradeStructure> {
  if (!process.env.ANTHROPIC_API_KEY) return structureUpgradeRules(text);
  try {
    const client = new Anthropic();
    const response = await client.beta.messages.create({
      model: taipConfig.agent.model,
      max_tokens: 2000,
      system:
        "Struktureeri kasutaja kirjeldus varjendi täiustamise päringuks tehnopartnerile. Märgi vajadus true ainult siis, kui kirjeldusest järeldub, et see puudub või on puudulik. Mõõdud tekstina, kui need on antud.",
      messages: [{ role: "user", content: text }],
      output_config: {
        effort: "low",
        format: {
          type: "json_schema",
          schema: {
            type: "object", additionalProperties: false, required: ["spaceType", "dimensions", "needs"],
            properties: {
              spaceType: { type: "string", enum: ["basement", "underground", "house", "other"] },
              dimensions: { type: ["string", "null"] },
              needs: {
                type: "object", additionalProperties: false, required: ["ventilation", "heating", "water", "comms"],
                properties: { ventilation: { type: "boolean" }, heating: { type: "boolean" }, water: { type: "boolean" }, comms: { type: "boolean" } },
              },
            },
          },
        },
      },
      fallbacks: "default",
      betas: ["server-side-fallback-2026-07-01"],
    });
    if (response.stop_reason !== "end_turn") return structureUpgradeRules(text);
    const raw = response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    const parsed = Schema.safeParse(JSON.parse(raw));
    if (!parsed.success) return structureUpgradeRules(text);
    return { ...parsed.data, dimensions: parsed.data.dimensions ?? undefined };
  } catch (e) {
    log("upgrade.llm_error", { error: e instanceof Error ? e.name : "unknown" });
    return structureUpgradeRules(text);
  }
}
