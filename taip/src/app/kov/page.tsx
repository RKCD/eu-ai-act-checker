import { getRegion, isWithin, REGIONS } from "@config/regions";
import { getDb } from "@/data/db";
import { taipConfig } from "@config/taip.config";
import { pageUser, type SP } from "@/lib/page";
import { service } from "@/lib/session";
import { t } from "@/i18n/messages";
import NeedsMap, { DailyBars } from "@/components/NeedsMap";
import PrintButton from "@/components/PrintButton";

export default async function KovPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const user = await pageUser("kov", "redcross", "admin");
  const svc = service();
  const data = svc.needsMap(user, sp.ala || undefined);
  const m = t("et");
  const min = taipConfig.needsMap.minCellSize;
  const scopeName = data.scope === "EE" ? "Kogu Eesti" : getRegion(data.scope)?.name;
  // Kriisid, mis puudutavad vaadatavat ala (kriisi piirkond on ala sees või ala on kriisi piirkonna sees).
  const crises = getDb().crises.filter((c) => c.status === "active" && (data.scope === "EE" || isWithin(c.regionId, data.scope) || isWithin(data.scope, c.regionId)));
  const subRegions = user.role === "kov" ? REGIONS.filter((r) => r.parentId === user.regionId) : [];
  const cells = [...data.cells].sort((a, b) => (b.count ?? 0) - (a.count ?? 0));

  return (
    <>
      <div className="spread">
        <h1>Vajaduste kaart – {scopeName}</h1>
        <div className="row no-print">
          <a className="btn small secondary" href={`/api/report?ala=${data.scope === "EE" ? "" : data.scope}`}>CSV</a>
          <PrintButton />
        </div>
      </div>
      {crises.length > 0 && <div className="banner crisis">Kriisirežiim: {crises.map((c) => `${c.title} (${getRegion(c.regionId)?.name})`).join(", ")}</div>}
      <p className="muted">Ainult agregeeritud ja anonüümitud andmed. Lahtrid alla {min} päringu on peidetud. Isikuandmeid näeb ainult partner, kellele päring on suunatud.</p>

      {subRegions.length > 0 && (
        <form className="row no-print" style={{ marginBottom: 12 }}>
          <label htmlFor="ala" style={{ margin: 0 }}>Piirkond</label>
          <select id="ala" name="ala" defaultValue={sp.ala ?? ""} style={{ width: "auto" }}>
            <option value="">{getRegion(user.regionId)?.name} (kõik)</option>
            {subRegions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <button className="btn small" type="submit">Näita</button>
        </form>
      )}

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <div className="card"><small>Päringuid kokku</small><div className="big-number">{data.total}</div></div>
        <div className="card"><small>Piirkondi</small><div className="big-number">{data.regions.length}</div></div>
      </div>

      <h2>Kaart</h2>
      <NeedsMap rows={data.regions} minCell={min} scope={data.scope} />

      <h2>Päringud päevade kaupa</h2>
      <DailyBars data={data.daily} />

      <h2>Tabel: piirkond × kategooria × kiireloomulisus</h2>
      <div className="card table-wrap">
        <table>
          <thead><tr><th>Piirkond</th><th>Kategooria</th><th>Kiireloomulisus</th><th className="num">Arv</th></tr></thead>
          <tbody>
            {cells.map((c, i) => (
              <tr key={i}>
                <td>{getRegion(c.regionId)?.name}</td>
                <td>{m.categories[c.category]}</td>
                <td><span className={`chip ${c.urgency}`}>{m.urgency[c.urgency]}</span></td>
                <td className="num">{c.count ?? `<${min}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
