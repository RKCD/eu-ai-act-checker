import { createSeededDb, type Db } from "@/data/db";
import { TaipService } from "@/services/taip";

export function setup(opts: { withDemoNeeds?: boolean } = { withDemoNeeds: false }) {
  const db: Db = createSeededDb(opts);
  const svc = new TaipService(db);
  const u = (id: string) => svc.user(id)!;
  return { db, svc, u };
}

/** Kuulutab kriisi välja kahe admini kinnitusega. */
export function activateCrisis(svc: TaipService, u: (id: string) => any, regionId: string) {
  const c = svc.requestCrisis(u("u-admin1"), { regionId, title: "Test", officialSource: "Vabariigi Valitsuse korraldus nr 1 (test)" });
  return svc.approveCrisis(u("u-admin2"), c.id);
}
