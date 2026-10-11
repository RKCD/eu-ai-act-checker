import { redirect } from "next/navigation";
import { currentUser, localeOf, service } from "@/lib/session";
import type { Locale } from "@config/taip.config";
import { taipConfig } from "@config/taip.config";
import HelpFlow from "./HelpFlow";

export default async function HelpPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== "user") redirect("/");
  const locale = (await localeOf(user)) as Locale;
  const crisis = service().activeCrises(user.regionId).length > 0;
  return <HelpFlow locale={locale} crisisActive={crisis} maxQuestions={taipConfig.agent.maxClarifyingQuestions} />;
}
