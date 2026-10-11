/**
 * Taip! äriloogika konfiguratsioon.
 *
 * Kõik kaalud, summad, kategooriad ja mallid on siin – mitte koodis.
 * Muuda väärtusi siin; domeenikood (src/domain) loeb ainult seda objekti.
 */

export const CATEGORIES = [
  "food",
  "shelter",
  "accommodation",
  "medical",
  "mental_health",
  "heating",
  "transport",
  "other",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const URGENCIES = ["critical", "urgent", "normal"] as const;
export type Urgency = (typeof URGENCIES)[number];

export const SPECIAL_NEEDS = [
  "children",
  "elderly",
  "mobility_impairment",
  "medication_dependency",
  "pregnancy",
] as const;
export type SpecialNeed = (typeof SPECIAL_NEEDS)[number];

/** Erivajadused, mis on terviseandmed (GDPR art 9) – vajavad eraldi nõusolekut. */
export const HEALTH_SPECIAL_NEEDS: readonly SpecialNeed[] = [
  "mobility_impairment",
  "medication_dependency",
  "pregnancy",
];

export const taipConfig = {
  priority: {
    /** Baas = kiireloomulisus. */
    urgencyBase: { critical: 1000, urgent: 100, normal: 10 } satisfies Record<Urgency, number>,
    /** Lisandub, kui kasutaja piirkonnas on aktiivne kriisirežiim. */
    crisisRegionBonus: 50,
    /** Iga erivajaduse liik eraldi kaaluga. */
    specialNeedWeights: {
      children: 15,
      elderly: 15,
      mobility_impairment: 20,
      medication_dependency: 25,
      pregnancy: 20,
    } satisfies Record<SpecialNeed, number>,
    /** Leibkonna suurus: kaal inimese kohta, ülempiiriga. */
    householdSizeWeightPerPerson: 3,
    householdSizeMaxPersons: 8,
  },

  /** Kriisirežiimis tõusevad need kategooriad vastetes esikohale (järjekorras). */
  crisisPriorityCategories: ["shelter", "food"] as Category[],

  crisis: {
    /** Aktiveerimiseks vajalike erinevate adminide arv. */
    requiredApprovals: 2,
    allowance: {
      /** Kriisisaldo leibkonna kohta (sentides). */
      perHouseholdCents: 5000,
      /** Lisaks iga leibkonnaliikme kohta (sentides). */
      perPersonCents: 3000,
      /** Kriisisaldoga tohib maksta ainult nendes kategooriates. */
      allowedCategories: ["food", "shelter", "medical"] as Category[],
    },
  },

  agent: {
    /** Maksimaalne täpsustavate küsimuste arv enne kokkuvõtet. */
    maxClarifyingQuestions: 3,
    model: "claude-opus-5-5",
  },

  needsMap: {
    /** Agregaadi lahtrid, kus on vähem päringuid, peidetakse (k-anonüümsus). */
    minCellSize: 3,
  },

  inventory: {
    /** Mitu päeva enne aegumist meelde tuletada. */
    expiryReminderDays: 14,
    /**
     * Soovituslik valmisolekuvaru. Allikas: Päästeameti / kriis.ee soovitus
     * olla toime tulemas vähemalt 7 päeva. Kogused on inimese kohta 7 päevaks.
     */
    templateSource: "kriis.ee – ole valmis toime tulema vähemalt 7 päeva",
    template: [
      { key: "water", name: "Joogivesi", unit: "l", perPerson: 21, shelfLifeDays: 365, selverQuery: "joogivesi" },
      { key: "canned", name: "Konservid", unit: "tk", perPerson: 7, shelfLifeDays: 730, selverQuery: "konserv" },
      { key: "grains", name: "Kuivained (tangud, pasta)", unit: "kg", perPerson: 2, shelfLifeDays: 365, selverQuery: "tangud" },
      { key: "crispbread", name: "Näkileib / kuivikud", unit: "pk", perPerson: 2, shelfLifeDays: 270, selverQuery: "näkileib" },
      { key: "batteries", name: "Patareid (AA)", unit: "tk", perPerson: 4, shelfLifeDays: 1825, selverQuery: "patareid aa" },
      { key: "firstaid", name: "Esmaabikarp", unit: "tk", perHousehold: 1, shelfLifeDays: 1095, selverQuery: "esmaabi" },
      { key: "flashlight", name: "Taskulamp", unit: "tk", perHousehold: 1, selverQuery: "taskulamp" },
    ] as InventoryTemplateItem[],
  },

  wallet: {
    /** Isikliku reservi täiendussummad (sentides), Stripe test mode / mock. */
    reserveTopUpOptionsCents: [2000, 5000, 10000],
    packages: [
      {
        key: "family",
        name: "Pere",
        priceCents: 4900,
        features: ["2 ööd eelbroneeritud varjumiskoht 4 inimesele", "Varude meeldetuletused", "Personaalne valmisolekuplaan"],
      },
      {
        key: "priority",
        name: "Prioriteet",
        priceCents: 9900,
        features: [
          "Kõik Pere paketi hüved",
          "Eelbroneeritud maamaja koht kogu perele",
          "Varjendi upgrade'i konsultatsioon",
        ],
        // NB: pakett EI mõjuta kriisiaegse abivajaduse prioriteeti – see põhineb ainult vajadusel.
      },
    ],
  },

  twoNights: {
    nights: 2,
    /** Tasuta tühistamine kuni nii mitu päeva enne algust. */
    freeCancellationDays: 3,
  },

  locales: ["et", "ru", "en", "uk"] as const,
  defaultLocale: "et" as const,
};

export type InventoryTemplateItem = {
  key: string;
  name: string;
  unit: string;
  perPerson?: number;
  perHousehold?: number;
  shelfLifeDays?: number;
  selverQuery: string;
};

export type TaipConfig = typeof taipConfig;
export type Locale = (typeof taipConfig.locales)[number];
