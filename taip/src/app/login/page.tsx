import { getDb } from "@/data/db";
import { loginAs } from "../actions";

const ROLE_LABEL = { user: "Abivajaja / leibkond", partner: "Partner", kov: "KOV kriisijuht", redcross: "Punase Risti operaator", admin: "Admin" };

export default function LoginPage() {
  const users = getDb().users;
  return (
    <>
      <h1>Vali demokasutaja</h1>
      <p className="muted">MVP demo: autentimine on asendatud kasutaja valikuga. Tootmises Supabase Auth (Smart-ID/ID-kaart hiljem).</p>
      <div className="grid">
        {users.map((u) => (
          <form key={u.id} action={loginAs} className="card">
            <input type="hidden" name="userId" value={u.id} />
            <h3>{u.name}</h3>
            <p className="muted">{ROLE_LABEL[u.role]}</p>
            <button className="btn small" type="submit">Sisene</button>
          </form>
        ))}
      </div>
    </>
  );
}
