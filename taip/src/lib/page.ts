import { redirect } from "next/navigation";
import type { Role } from "@/domain/types";
import { currentUser } from "./session";

export type SP = Promise<{ ok?: string; viga?: string; [k: string]: string | undefined }>;

export async function pageUser(...roles: Role[]) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (roles.length && !roles.includes(user.role)) redirect("/");
  return user;
}
