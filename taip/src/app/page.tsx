import Link from "next/link";
import { redirect } from "next/navigation";
import { getRegion } from "@config/regions";
import { taipConfig } from "@config/taip.config";
import { currentUser, localeOf, service } from "@/lib/session";
import { formatEur, t } from "@/i18n/messages";
import { setLocale } from "./actions";

const LOCALE_NAMES = { et: "Eesti", ru: "Русский", en: "English", uk: "Українська" } as const;

export default async function Home() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role === "kov") redirect("/kov");
  if (user.role === "redcross") redirect("/punane-rist");
  if (user.role === "partner") redirect("/partner");
  if (user.role === "admin") redirect("/admin");

  const svc = service();
  const locale = await localeOf(user);
  const m = t(locale);
  const h = svc.householdOf(user);
  const crises = svc.activeCrises(h.regionId);
  const wallet = svc.wallet(h.id);
  const crisisCents = wallet.allowances.reduce((s, a) => s + a.remainingCents, 0);
  const inv = svc.inventory(user);

  return (
    <>
      {crises.length > 0 && (
        <div className="banner crisis" role="alert">
          ⚠ {m.crisisBanner}: {crises.map((c) => `${c.title} (${getRegion(c.regionId)?.name})`).join(", ")}
          <br />
          {m.crisisBalance}: {formatEur(crisisCents, locale)}
        </div>
      )}
      <h1>{m.tagline}</h1>
      <p className="muted">{h.name} · {getRegion(h.regionId)?.name} · {h.size} {m.people}</p>

      <div className="home-actions">
        <Link href="/abi" className="btn big help">🆘 {m.needHelp}</Link>
        <Link href="/varjumine" className="btn big">{m.shelters}</Link>
        <Link href="/varud" className="btn big secondary">
          {m.myStock}{inv.expiring.length > 0 ? ` · ${inv.expiring.length} ⏰` : ""}
        </Link>
        <Link href="/rahakott" className="btn big secondary">{m.wallet}</Link>
      </div>

      <form action={setLocale} className="row" style={{ marginTop: 24 }}>
        <input type="hidden" name="back" value="/" />
        {taipConfig.locales.map((l) => (
          <button key={l} name="locale" value={l} className={`btn small ${l === locale ? "" : "secondary"}`} type="submit" lang={l}>
            {LOCALE_NAMES[l]}
          </button>
        ))}
      </form>
      <p className="muted" style={{ marginTop: 16 }}>
        <a href="tel:112">{m.call112}</a> — eluohtlikus olukorras helista alati kohe.
      </p>
    </>
  );
}
