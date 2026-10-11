import type { Category, Locale, SpecialNeed, Urgency } from "@config/taip.config";

export type { Category, Locale, SpecialNeed, Urgency };

export type Role = "user" | "partner" | "kov" | "redcross" | "admin";

export type User = {
  id: string;
  name: string;
  role: Role;
  /** Kasutaja omavalitsus; KOV kriisijuhil tema vastutusala (maakond või omavalitsus). */
  regionId: string;
  householdId?: string;
  partnerId?: string;
  locale: Locale;
};

export type Household = {
  id: string;
  name: string;
  kind: "household" | "business";
  regionId: string;
  size: number;
  /** Mitte-terviseandmetega erivajadused (lapsed, eakad). Terviseandmed on eraldi tabelis. */
  specialNeeds: SpecialNeed[];
  shelterPlanId?: string;
};

export type NeedStatus = "confirmed" | "routed" | "in_progress" | "resolved" | "emergency";

/** Struktureeritud abivajadus. Vabatekst EI salvestu (andmete minimeerimine). */
export type Need = {
  id: string;
  userId: string;
  householdId: string;
  regionId: string;
  categories: Category[];
  urgency: Urgency;
  householdSize: number;
  specialNeeds: SpecialNeed[];
  /** Agendi lühikokkuvõte, mille kasutaja kinnitas. */
  summary: string;
  priority: number;
  status: NeedStatus;
  createdAt: string;
  routedTo?: { kind: "partner" | "redcross"; id: string };
  assignedOperatorId?: string;
  hasHealthDetails: boolean;
  /** Tuletatud, mittediagnostiline lipp partnerile (ainult nõusolekul). */
  accessibleNeeded: boolean;
};

/** Terviseandmed (GDPR art 9) – eraldi, krüpteeritult, ainult nõusolekul. */
export type HealthDetails = {
  needId: string;
  consentAt: string;
  /** AES-256-GCM krüptotekst (base64). */
  ciphertext: string;
};

export type PartnerKind = "food" | "shelter" | "accommodation" | "therapy" | "contractor" | "other";

export type Partner = {
  id: string;
  name: string;
  kind: PartnerKind;
  regionIds: string[];
  contactEmail: string;
};

export type Offer = {
  id: string;
  partnerId: string;
  category: Category;
  title: string;
  description: string;
  /** Hind sentides; 0 = tasuta. */
  priceCents: number;
  regionIds: string[];
  /** Kas tegu on Punase Risti kanaliga (tasuta abi, operaator vaatab üle). */
  viaRedCross?: boolean;
  shelterId?: string;
  /** Pakutakse ainult aktiivse kriisi ajal (nt avalik varjumiskoht). */
  crisisOnly?: boolean;
};

export type CrisisStatus = "pending" | "active" | "ended";

export type Crisis = {
  id: string;
  regionId: string;
  title: string;
  /** Ametliku otsuse viide (nt Vabariigi Valitsuse korraldus nr ...). Taip! ise kriisi välja ei kuuluta. */
  officialSource: string;
  status: CrisisStatus;
  requestedBy: string;
  approvals: string[];
  createdAt: string;
  activatedAt?: string;
  endedAt?: string;
};

export type FundEntryType = "donation" | "kov" | "state" | "allocation" | "return";

export type FundEntry = {
  id: string;
  type: FundEntryType;
  /** Märgiga summa sentides: sissemaksed +, väljamaksed (eraldus saldoks) −, tagastus +. */
  amountCents: number;
  crisisId?: string;
  note: string;
  at: string;
  actorId: string;
};

export type CrisisAllowance = {
  id: string;
  crisisId: string;
  householdId: string;
  grantedCents: number;
  remainingCents: number;
  allowedCategories: Category[];
  status: "active" | "expired";
};

export type PaymentSource = "crisis_allowance" | "personal_reserve" | "direct";

export type PaymentPart = { source: PaymentSource; amountCents: number; allowanceId?: string };

export type Order = {
  id: string;
  householdId: string;
  needId?: string;
  offerId?: string;
  category: Category;
  description: string;
  totalCents: number;
  parts: PaymentPart[];
  status: "placed" | "cancelled";
  createdAt: string;
  externalRef?: string;
};

export type Shelter = {
  id: string;
  name: string;
  kind: "public" | "private" | "cottage";
  regionId: string;
  address: string;
  lat: number;
  lng: number;
  capacity: number;
  equipment: { heating: boolean; water: boolean; comms: boolean; accessible: boolean };
  contact: string;
  validUntil: string;
  partnerId?: string;
  /** "2 ööd" paketi hind inimese kohta (sentides), kui pakutakse. */
  twoNightsPriceCentsPerPerson?: number;
};

export type Booking = {
  id: string;
  shelterId: string;
  householdId: string;
  people: number;
  kind: "crisis" | "two_nights";
  /** ISO kuupäev (YYYY-MM-DD), kaasa arvatud. */
  from: string;
  /** ISO kuupäev, välja arvatud (väljasõidupäev). Kriisibroneeringul puudub (lahtine). */
  to?: string;
  status: "pending_partner" | "confirmed" | "cancelled";
  orderId?: string;
  createdAt: string;
};

export type InventoryItem = {
  id: string;
  householdId: string;
  name: string;
  templateKey?: string;
  quantity: number;
  unit: string;
  expiresAt?: string;
};

export type UpgradeRequest = {
  id: string;
  householdId: string;
  regionId: string;
  spaceType: "basement" | "underground" | "house" | "other";
  description: string;
  dimensions?: string;
  needs: { ventilation: boolean; heating: boolean; water: boolean; comms: boolean };
  status: "sent" | "partner_contacted";
  partnerId: string;
  createdAt: string;
};

export type AuditEntry = {
  id: string;
  at: string;
  actorId: string;
  action: string;
  /** Ainult ID-d ja mitte-isikuandmed. */
  details: Record<string, string | number | boolean>;
};
