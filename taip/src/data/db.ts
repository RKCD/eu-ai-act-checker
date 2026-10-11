/**
 * MVP andmekiht: protsessisisene andmebaas (demo/arendus/testid).
 *
 * Tootmises asendub Supabase Postgresiga – skeem, RLS-poliitikad ja
 * transaktsioonilised funktsioonid on failis supabase/migrations/0001_init.sql.
 * Teenusekiht (src/services) ei sõltu sellest, kumba kasutatakse.
 */
import type {
  AuditEntry, Booking, Crisis, CrisisAllowance, FundEntry, HealthDetails, Household,
  InventoryItem, Need, Offer, Order, Partner, Shelter, UpgradeRequest, User,
} from "@/domain/types";
import {
  seedDemoNeeds, seedFund, seedHouseholds, seedInventory, seedOffers, seedPartners,
  seedPersonalReserves, seedShelters, seedUsers,
} from "./seed";

export type Db = {
  users: User[];
  households: Household[];
  partners: Partner[];
  offers: Offer[];
  needs: Need[];
  healthDetails: HealthDetails[];
  crises: Crisis[];
  fund: FundEntry[];
  allowances: CrisisAllowance[];
  personalReserves: Record<string, number>;
  orders: Order[];
  shelters: Shelter[];
  bookings: Booking[];
  inventory: InventoryItem[];
  upgradeRequests: UpgradeRequest[];
  audit: AuditEntry[];
};

export function createSeededDb(opts: { withDemoNeeds?: boolean } = {}): Db {
  return {
    users: seedUsers(),
    households: seedHouseholds(),
    partners: seedPartners(),
    offers: seedOffers(),
    needs: opts.withDemoNeeds === false ? [] : seedDemoNeeds(),
    healthDetails: [],
    crises: [],
    fund: seedFund(),
    allowances: [],
    personalReserves: seedPersonalReserves(),
    orders: [],
    shelters: seedShelters(),
    bookings: [],
    inventory: seedInventory(),
    upgradeRequests: [],
    audit: [],
  };
}

const g = globalThis as unknown as { __taipDb?: Db };

/** Protsessi ühine andmebaas (säilib Next.js dev-režiimi kuumlaadimisel). */
export function getDb(): Db {
  if (!g.__taipDb) g.__taipDb = createSeededDb();
  return g.__taipDb;
}

export function resetDb() {
  g.__taipDb = createSeededDb();
}
