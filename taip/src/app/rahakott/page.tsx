import { taipConfig } from "@config/taip.config";
import { pageUser, type SP } from "@/lib/page";
import { localeOf, service } from "@/lib/session";
import { formatEur, t } from "@/i18n/messages";
import Flash from "@/components/Flash";
import { topUp } from "../actions";

export default async function WalletPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const user = await pageUser("user");
  const locale = await localeOf(user);
  const m = t(locale);
  const svc = service();
  const h = svc.householdOf(user);
  const w = svc.wallet(h.id);
  const crisisCents = w.allowances.reduce((s, a) => s + a.remainingCents, 0);
  const orders = svc.ordersOf(user);

  return (
    <>
      <h1>{m.wallet}</h1>
      <Flash sp={sp} />
      <div className="grid">
        <div className="card">
          <small>{m.crisisBalance}</small>
          <div className="big-number">{formatEur(crisisCents, locale)}</div>
          <small>
            {w.allowances.length
              ? `Kasutatav: ${taipConfig.crisis.allowance.allowedCategories.map((c) => m.categories[c]).join(", ")}. Aegub kriisi lõppedes.`
              : "Aktiveerub ainult ametliku kriisiotsuse alusel."}
          </small>
        </div>
        <div className="card">
          <small>Isiklik reserv</small>
          <div className="big-number">{formatEur(w.personalReserveCents, locale)}</div>
          <form action={topUp} className="row" style={{ marginTop: 8 }}>
            {taipConfig.wallet.reserveTopUpOptionsCents.map((c) => (
              <button key={c} className="btn small secondary" name="amount" value={c} type="submit">+{formatEur(c, locale)}</button>
            ))}
          </form>
          <small>Stripe test mode (mock) – päris makseid ei tehta.</small>
        </div>
      </div>
      <p className="muted">Maksete järjekord: kriisisaldo → isiklik reserv → otsemakse.</p>

      <h2>Paketid</h2>
      <div className="grid">
        {taipConfig.wallet.packages.map((p) => (
          <div key={p.key} className="card">
            <div className="spread"><h3>{p.name}</h3><strong>{formatEur(p.priceCents, locale)}/a</strong></div>
            <ul>{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
            <small className="muted">Pakett ei mõjuta kriisiaegse abi prioriteeti – see sõltub ainult vajadusest.</small>
          </div>
        ))}
      </div>

      <h2>Tellimused</h2>
      {orders.length === 0 ? <p className="muted">Tellimusi pole.</p> : (
        <div className="card table-wrap">
          <table>
            <thead><tr><th>Kuupäev</th><th>Kirjeldus</th><th className="num">Summa</th><th>Makseallikad</th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>{o.createdAt.slice(0, 10)}</td>
                  <td>{o.description}{o.status === "cancelled" ? " (tühistatud)" : ""}</td>
                  <td className="num">{formatEur(o.totalCents, locale)}</td>
                  <td>{o.parts.map((p) => `${m.sources[p.source]} ${formatEur(p.amountCents, locale)}`).join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
