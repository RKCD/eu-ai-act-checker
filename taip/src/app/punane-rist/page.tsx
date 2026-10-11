import { getRegion } from "@config/regions";
import { pageUser, type SP } from "@/lib/page";
import { service } from "@/lib/session";
import { t } from "@/i18n/messages";
import Flash from "@/components/Flash";
import { resolveNeed, takeNeed } from "../actions";

export default async function RedCrossPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const user = await pageUser("redcross");
  const queue = service().redCrossQueue(user);
  const m = t("et");
  return (
    <>
      <h1>Punase Risti päringute järjekord</h1>
      <Flash sp={sp} />
      <p className="muted">Eeltöödeldud ja prioriteedi järgi sorteeritud. Näed ainult Punasele Ristile suunatud päringuid.</p>
      <div className="card table-wrap">
        <table>
          <thead><tr><th className="num">Prio</th><th>Kiireloomulisus</th><th>Vajadus</th><th>Piirkond</th><th>Leibkond</th><th>Staatus</th><th></th></tr></thead>
          <tbody>
            {queue.map((n) => (
              <tr key={n.id}>
                <td className="num">{n.priority}</td>
                <td><span className={`chip ${n.urgency}`}>{m.urgency[n.urgency]}</span></td>
                <td>{n.categories.map((c) => m.categories[c]).join(", ")}<br /><small>{n.summary}</small></td>
                <td>{getRegion(n.regionId)?.name}</td>
                <td>{n.householdSize} in.{n.specialNeeds.length ? ` · ${n.specialNeeds.map((s) => m.specialNeeds[s]).join(", ")}` : ""}{n.accessibleNeeded ? " · ligipääsetav" : ""}</td>
                <td>{n.status === "in_progress" ? (n.assignedOperatorId === user.id ? "minu töös" : "töös") : "uus"}</td>
                <td>
                  {n.status !== "in_progress" ? (
                    <form action={takeNeed}><input type="hidden" name="needId" value={n.id} /><button className="btn small" type="submit">Võta töösse</button></form>
                  ) : n.assignedOperatorId === user.id ? (
                    <form action={resolveNeed}><input type="hidden" name="needId" value={n.id} /><button className="btn small secondary" type="submit">Lahendatud</button></form>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {queue.length === 0 && <p className="muted">Järjekord on tühi.</p>}
      </div>
    </>
  );
}
