import { isWithin } from "@config/regions";
import type { Need, Role, User } from "./types";

/**
 * Rakenduse-poolne õiguste poliitika. Peegeldab Supabase RLS-poliitikaid
 * (supabase/migrations/0001_init.sql) – mõlemad peavad olema kooskõlas.
 */

export function canSeeNeedPersonalData(user: User, need: Need): boolean {
  if (need.userId === user.id) return true;
  if (!need.routedTo) return false;
  if (user.role === "redcross" && need.routedTo.kind === "redcross") return true;
  if (user.role === "partner" && need.routedTo.kind === "partner" && need.routedTo.id === user.partnerId) return true;
  return false;
}

/** KOV kriisijuht näeb ainult oma piirkonna agregaate. */
export function canSeeAggregatesFor(user: User, regionId: string): boolean {
  if (user.role === "admin") return true;
  if (user.role === "redcross") return true;
  if (user.role === "kov") return isWithin(regionId, user.regionId);
  return false;
}

export function requireRole(user: User | null, ...roles: Role[]): User {
  if (!user || !roles.includes(user.role)) throw new AccessError("Puudub ligipääs");
  return user;
}

export class AccessError extends Error {}
