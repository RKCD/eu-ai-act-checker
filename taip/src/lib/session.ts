import { cookies } from "next/headers";
import { getDb } from "@/data/db";
import { TaipService } from "@/services/taip";
import type { User } from "@/domain/types";

/**
 * MVP demo-sessioon: kasutaja valitakse /login lehel (küpsis).
 * Tootmises asendub Supabase Auth-iga (Smart-ID/ID-kaart väljaspool MVP ulatust).
 */
export const SESSION_COOKIE = "taip_uid";

export function service() {
  return new TaipService(getDb());
}

export async function currentUser(): Promise<User | null> {
  const jar = await cookies();
  return service().user(jar.get(SESSION_COOKIE)?.value);
}

export async function localeOf(user: User | null): Promise<string> {
  const jar = await cookies();
  return jar.get("taip_locale")?.value ?? user?.locale ?? "et";
}
