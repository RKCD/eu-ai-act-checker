import { pageUser, type SP } from "@/lib/page";
import { service } from "@/lib/session";
import { getDb } from "@/data/db";
import Flash from "@/components/Flash";
import { sendUpgrade } from "../actions";

export default async function UpgradePage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const user = await pageUser("user");
  const h = service().householdOf(user);
  const mine = getDb().upgradeRequests.filter((r) => r.householdId === h.id);
  const partners = getDb().partners;
  return (
    <>
      <h1>Varjendi upgrade</h1>
      <Flash sp={sp} />
      <p>Kirjelda oma ruumi (kelder, maa-alune ruum, maja). Koostame struktureeritud päringu ja edastame selle sinu piirkonna tehno- või ehituspartnerile. <strong>Taip! ise ei ehita.</strong></p>
      <form action={sendUpgrade} className="card">
        <label htmlFor="d">Kirjeldus</label>
        <textarea id="d" name="description" required placeholder="Nt: Maamaja kelder, umbes 20 m2, niiske, küte puudub, vesi on kaevust, mobiililevi ei ole…" />
        <div className="grid">
          <div>
            <label htmlFor="st">Ruumi tüüp</label>
            <select id="st" name="spaceType" defaultValue="">
              <option value="">— tuleta kirjeldusest —</option>
              <option value="basement">Kelder</option>
              <option value="underground">Maa-alune ruum</option>
              <option value="house">Maja</option>
              <option value="other">Muu</option>
            </select>
          </div>
          <div><label htmlFor="dm">Mõõdud</label><input id="dm" name="dimensions" placeholder="nt 4 × 5 m" /></div>
        </div>
        <fieldset style={{ border: 0, padding: 0, marginTop: 12 }}>
          <legend><strong>Vajab (lisaks kirjeldusest tuletatule)</strong></legend>
          {[["ventilation", "Ventilatsioon"], ["heating", "Küte"], ["water", "Vesi"], ["comms", "Side"]].map(([k, l]) => (
            <label key={k} className="check"><input type="checkbox" name={k} /> {l}</label>
          ))}
        </fieldset>
        <button className="btn" type="submit" style={{ marginTop: 12 }}>Saada päring</button>
      </form>
      {mine.length > 0 && (
        <>
          <h2>Minu päringud</h2>
          {mine.map((r) => (
            <div key={r.id} className="card">
              <strong>{partners.find((p) => p.id === r.partnerId)?.name}</strong> · <small>{r.createdAt.slice(0, 10)} · {r.status === "sent" ? "edastatud" : "partner võttis ühendust"}</small>
              <p>
                <span className="chip">{{ basement: "kelder", underground: "maa-alune", house: "maja", other: "muu" }[r.spaceType]}</span>
                {r.dimensions && <span className="chip">{r.dimensions}</span>}
                {Object.entries(r.needs).filter(([, v]) => v).map(([k]) => <span key={k} className="chip urgent">{{ ventilation: "ventilatsioon", heating: "küte", water: "vesi", comms: "side" }[k]}</span>)}
              </p>
            </div>
          ))}
        </>
      )}
    </>
  );
}
