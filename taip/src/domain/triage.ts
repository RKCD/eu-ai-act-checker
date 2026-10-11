/**
 * Ohumärkide tuvastus. See on DETERMINISTLIK ja jookseb enne keelemudelit ning
 * sõltumata sellest – ohutus ei tohi sõltuda välisest API-st.
 *
 * Kui ükskõik milline ohumärk leitakse → kriitiline → 112, tavavoog peatub.
 */

export type DangerSign = "chest_pain" | "breathing" | "consciousness" | "self_harm" | "bleeding" | "fire_violence";

const PATTERNS: Record<DangerSign, RegExp[]> = {
  chest_pain: [
    /rinna(valu|s valu|ku valu)|valu rinnus|süda(me)? (valutab|pigistab)|südamerabandus/i,
    /chest pain|heart attack|pain in (my|the) chest/i,
    /бол(ь|и) в груди|сердечн(ый|ого) приступ|давит (в )?груд/i,
    /біль у грудях|болить (у )?груд|серцев(ий|ого) напад/i,
  ],
  breathing: [
    /hingamis(raskus|häire)|ei saa hingata|hingeldab|lämbu/i,
    /can'?t breathe|cannot breathe|difficulty breathing|short(ness)? of breath|chok(e|ing)/i,
    /не могу дышать|задыха|трудно дышать|одышк/i,
    /не можу дихати|задиха|важко дихати/i,
  ],
  consciousness: [
    /teadvuse(ta|kaotus|häire)|minestas|ei reageeri|krambid|segaduses ja/i,
    /unconscious|passed out|fainted|not responding|unresponsive|seizure/i,
    /без сознания|потерял(а)? сознание|не реагирует|судорог/i,
    /без свідомості|втратив(ла)? свідомість|не реагує|судом/i,
  ],
  self_harm: [
    /enesetap|tahan surra|tapan end|ennast vigastada|end ära tappa|ei taha enam elada/i,
    /suicid|kill myself|end my life|want to die|self[- ]?harm|hurt myself/i,
    /суицид|покончить с собой|хочу умереть|убить себя|навредить себе/i,
    /самогубств|покінчити з собою|хочу померти|вбити себе|зашкодити собі/i,
  ],
  bleeding: [
    /tugev verejooks|veritseb tugevalt|verejooks ei peatu/i,
    /heavy bleeding|bleeding (heavily|badly|won'?t stop)/i,
    /сильное кровотечение|кровь не останавливается/i,
    /сильна кровотеча|кров не зупиняється/i,
  ],
  fire_violence: [
    /maja põleb|tulekahju|keegi ründab|vägivald (praegu|kohe)|relvaga/i,
    /house (is )?on fire|being attacked|someone is attacking|\bgun\b/i,
    /пожар|горит дом|на меня напа|нападают/i,
    /пожежа|горить будинок|на мене напа|нападають/i,
  ],
};

export function detectDangerSigns(text: string): DangerSign[] {
  const found: DangerSign[] = [];
  for (const [sign, patterns] of Object.entries(PATTERNS) as [DangerSign, RegExp[]][]) {
    if (patterns.some((p) => p.test(text))) found.push(sign);
  }
  return found;
}

export const EMERGENCY_NUMBER = "112";
