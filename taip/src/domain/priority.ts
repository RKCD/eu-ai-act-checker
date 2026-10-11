import { taipConfig, type TaipConfig } from "@config/taip.config";
import type { SpecialNeed, Urgency } from "./types";

export type PriorityInput = {
  urgency: Urgency;
  crisisActiveInRegion: boolean;
  specialNeeds: SpecialNeed[];
  householdSize: number;
};

/**
 * Prioriteet = baas (kiireloomulisus)
 *            + kriisirežiim kasutaja piirkonnas
 *            + erivajadused (iga liik eraldi kaaluga)
 *            + leibkonna suurus.
 * Kõik kaalud tulevad konfist.
 */
export function priorityScore(input: PriorityInput, cfg: TaipConfig["priority"] = taipConfig.priority): number {
  let score = cfg.urgencyBase[input.urgency];
  if (input.crisisActiveInRegion) score += cfg.crisisRegionBonus;
  for (const need of new Set(input.specialNeeds)) score += cfg.specialNeedWeights[need] ?? 0;
  const persons = Math.max(1, Math.min(input.householdSize, cfg.householdSizeMaxPersons));
  score += persons * cfg.householdSizeWeightPerPerson;
  return score;
}

/** Sorteerib kahanevalt prioriteedi järgi; võrdsete korral vanem enne. */
export function sortByPriority<T extends { priority: number; createdAt: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.priority - a.priority || a.createdAt.localeCompare(b.createdAt));
}
