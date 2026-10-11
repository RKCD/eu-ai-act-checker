import type { ShoppingLine } from "@/domain/inventory";
import type { Need, Shelter, UpgradeRequest } from "@/domain/types";

/** Toidu tarnija (e-Selver). MVP: mock-tellimus + sügavlink/ostunimekiri. */
export interface FoodProvider {
  readonly name: string;
  /** Loob tellimuse ja tagastab välise viite. */
  placeOrder(lines: ShoppingLine[], ctx: { regionId: string }): Promise<{ externalRef: string; totalCents: number }>;
  /** Sügavlingid / ostunimekiri kasutajale ise tellimiseks. */
  shoppingLinks(lines: ShoppingLine[]): { name: string; quantity: number; unit: string; url: string }[];
  /** Hinnang summale (sentides). */
  estimate(lines: ShoppingLine[]): number;
}

/** Varjumiskohtade allikas (seemneandmed; hiljem ametlik register). */
export interface ShelterProvider {
  readonly name: string;
  listShelters(): Promise<Shelter[]>;
  notifyBooking(b: { shelterId: string; people: number; from: string; to?: string; accessibleNeeded: boolean }): Promise<void>;
}

/** Edastus abikanalisse (Punane Rist / partner). Partnerile ainult minimaalsed andmed. */
export type MinimalNeedForPartner = Pick<Need, "id" | "categories" | "urgency" | "regionId" | "householdSize" | "summary"> & {
  accessibleNeeded: boolean;
};

export interface AidChannel {
  readonly name: string;
  forward(target: { kind: "partner" | "redcross"; id: string }, need: MinimalNeedForPartner): Promise<{ delivered: boolean; via: string }>;
}

/** Ehitus-/tehnopartneri kanal (varjendi upgrade). */
export interface ContractorChannel {
  readonly name: string;
  sendRequest(req: UpgradeRequest): Promise<{ delivered: boolean; via: string }>;
}

/** Maksed (Stripe test mode / mock). */
export interface PaymentProvider {
  readonly name: string;
  charge(params: { amountCents: number; description: string; householdId: string }): Promise<{ ok: boolean; ref: string }>;
}
