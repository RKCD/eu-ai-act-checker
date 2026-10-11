/**
 * Reeglipõhine varuagent: töötab ilma keelemudelita (API-võtmeta arendus, testid,
 * API katkestus kriisi ajal). Tunneb ära eesti, vene, inglise ja ukraina märksõnu.
 */
import type { Category, SpecialNeed, Urgency } from "@/domain/types";

const CATEGORY_WORDS: Record<Category, RegExp> = {
  food: /\b(toit|toidu|söö|nälg|leib|piim)|food|eat|hungry|grocer|ед[аыу]|продукт|голод|їж[аі]|продукт|голод/i,
  shelter: /varju|peavar|kodutu|maja (on )?(hävinud|põlenud|kahjustatud)|pole kuhugi minna|\bshelter|homeless|nowhere to (go|stay)|укрыт|убежищ|негде (жить|ночевать)|бездом|укритт|сховищ|ніде (жити|ночувати)/i,
  accommodation: /majutus|ööbimis|ööbida|maamaja|accommodation|place to stay|a room|жиль[ёе]|ночлег|житл|ночівл/i,
  medical: /ravim|rohud|apteek|insuliin|retsept|medic|medicine|pharmac|insulin|prescription|лекарств|аптек|инсулин|лік(и|ів)|аптек|інсулін/i,
  mental_health: /ärev|hirm|paanika|stress|depress|üksi(k)?|rääkida kellegagi|anxi|panic|scared|afraid|lonely|talk to someone|тревог|страх|паник|одинок|поговорить|тривог|страх|паніка|самотн|поговорити/i,
  heating: /küte|kütt|soe|sooja|külm|elektrit pole|elekter (on )?ära|ahi|heat|cold|freez|no power|power (is )?out|electricity|отоплен|холодн|нет (света|электричества)|опаленн|холодн|немає (світла|електрики)/i,
  transport: /transport|sõidu|autot pole|evaku|ride|evacuat|no car|транспорт|эвакуац|подвез|транспорт|евакуац|підвез/i,
  other: /$^/,
};

const URGENT_WORDS =
  /täna|homme|kohe|praegu|öösel|otsas|lõpeb|pole enam|ei ole enam|today|tonight|tomorrow|right now|run(ning)? out|ran out|no more|сегодня|завтра|сейчас|заканчива|закончил|больше нет|сьогодні|завтра|зараз|закінчу|закінчил|більше немає/i;
const YES = /^\s*(jah|jaa|jep|ja|yes|yeah|yep|да|так|ага)\b/i;
const NO = /^\s*(ei|no|nope|нет|ні)\b/i;

const SPECIAL_WORDS: Record<SpecialNeed, RegExp> = {
  children: /\blaps|lapsed|beebi|imik|child|kid|baby|infant|дет[иья]|ребён|ребен|младен|діт[иь]|дитин|немовл/i,
  elderly: /eaka|vanaema|vanaisa|pensionär|elderly|grandm|grandf|old (man|woman|people)|пожил|бабушк|дедушк|пенсионер|літн|бабус|дідус|пенсіонер/i,
  mobility_impairment: /ratastool|liikumispuue|ei saa käia|kark|wheelchair|can'?t walk|mobility|инвалидн|коляск|не может ходить|візок|не може ходити/i,
  medication_dependency: /insuliin|ravimi(d|te)ta|vajab ravimeid|regulaarselt ravim|insulin|needs? (my |his |her )?medication|dialys|инсулин|нужны лекарства|диализ|інсулін|потрібні ліки|діаліз/i,
  pregnancy: /rase|ootab last|pregnan|беремен|вагітн/i,
};

const NUMBER_WORDS: Record<string, number> = {
  üks: 1, kaks: 2, kolm: 3, neli: 4, viis: 5, kuus: 6, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  один: 1, два: 2, три: 3, четыре: 4, пять: 5, двоє: 2, троє: 3, чотири: 4, "п'ять": 5,
};

export function detectCategories(text: string): Category[] {
  return (Object.keys(CATEGORY_WORDS) as Category[]).filter((c) => CATEGORY_WORDS[c].test(text));
}

export function detectSpecialNeeds(text: string): SpecialNeed[] {
  return (Object.keys(SPECIAL_WORDS) as SpecialNeed[]).filter((s) => SPECIAL_WORDS[s].test(text));
}

export function detectHouseholdSize(text: string): number | undefined {
  const m = text.match(/(\d{1,2})\s*(inimest|in\.|liiget|people|persons?|человек|чел|людей|осіб|людини)/i)
    ?? text.match(/(meid|we are|нас)\s*(on\s*)?(\d{1,2})/i);
  if (m) return Number(m[m.length - 1].match(/\d+/)?.[0] ?? m[1]);
  const w = text.toLowerCase().match(/(meid on|we are|нас)\s+([\p{L}']+)/u);
  if (w && NUMBER_WORDS[w[2]]) return NUMBER_WORDS[w[2]];
  return undefined;
}

export type HeuristicState = {
  categories: Category[];
  urgency: Urgency | undefined;
  specialNeeds: SpecialNeed[];
  householdSize: number | undefined;
};

/** Analüüsib kogu vestlust; vastused küsimustele tõlgendatakse küsimuse liigi järgi. */
export function analyze(turns: { role: "user" | "assistant"; text: string; questionKind?: string }[]): HeuristicState {
  const userText = turns.filter((t) => t.role === "user").map((t) => t.text).join("\n");
  let urgency: Urgency | undefined = URGENT_WORDS.test(userText) ? "urgent" : undefined;
  for (let i = 0; i < turns.length - 1; i++) {
    if (turns[i].role === "assistant" && turns[i].questionKind === "urgency" && turns[i + 1].role === "user") {
      if (YES.test(turns[i + 1].text)) urgency = "urgent";
      else if (NO.test(turns[i + 1].text)) urgency = urgency ?? "normal";
    }
  }
  return {
    categories: detectCategories(userText),
    urgency,
    specialNeeds: detectSpecialNeeds(userText),
    householdSize: detectHouseholdSize(userText),
  };
}
