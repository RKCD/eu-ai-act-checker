# Taip! – kriisiaja abi- ja valmisolekuplatvorm (MVP)

Inimene kirjeldab oma olukorda vabas vormis → agent täpsustab (≤ 3 sammu) → kasutaja kinnitab
struktureeritud vajaduse → järjestatud vasted koos hinna ja makseallikaga → edastus partnerile või
Punasele Ristile. Kõigist päringutest tekib agregeeritud **vajaduste kaart** KOV-ile ja Punasele Ristile.
Tavaajal hoiab platvormi elus igapäevane kasutus: varude haldus, täiendustellimused, „2 ööd“ pakett.

## Käivitamine

```bash
cd taip
npm install
npm run dev            # http://localhost:3000 → vali demokasutaja
npm test               # domeeni- ja teenusetestid (Vitest)
npm run test:rls       # RLS- ja SQL-funktsioonide testid päris Postgresi vastu (vajab psql/createdb)
npm run typecheck && npm run build
```

`.env.example` → `.env.local`. Ilma `ANTHROPIC_API_KEY`-ta töötab reeglipõhine varuagent (et/ru/en/uk).

**Demovoog:** Mari (Tallinn) → „Vajan abi“ → Admin Anu algatab Harjumaa kriisi → Admin Peeter kinnitab →
Mari näeb kriisisaldot ja varjumine/toit on vastetes esikohal; Taavi (Valga) ei näe muutust →
Harjumaa kriisijuht näeb kaarti ja ekspordib CSV/PDF → Punase Risti operaator võtab päringu töösse.

## Arhitektuur

| Kiht | Kus | Märkus |
|---|---|---|
| Konfiguratsioon | `config/taip.config.ts`, `config/regions.ts` | kategooriad, prioriteedi kaalud, kriisisaldo summad ja lubatud kategooriad, varumall, paketid, k-anonüümsuse lävi |
| Agendi süsteemiprompt | `prompts/agent-system.md` | eraldi fail |
| Domeen (puhtad funktsioonid) | `src/domain/` | `priority`, `triage` (ohumärgid), `wallet` (maksete järjekord), `crisis` (2 admini, saldod, tagastus), `matching`, `booking`, `inventory`, `aggregation`, `access` |
| Agent | `src/agent/` | 1) deterministlik ohumärkide kontroll **enne** mudelit → 112; 2) Claude API struktureeritud JSON-väljundiga; 3) reeglipõhine varuagent. Küsimuste arv piiratud koodis. |
| Teenused | `src/services/taip.ts` | kasutuslood + õiguste kontroll + audit |
| Adapterid | `src/adapters/` | `FoodProvider` (e-Selver: mock-tellimus + sügavlingid), `ShelterProvider`, `AidChannel`, `ContractorChannel`, `PaymentProvider` – kõik mock |
| Andmed | `src/data/` (MVP: protsessisisene), `supabase/migrations/0001_init.sql` (tootmine) | Postgres-skeem RLS-iga, prioriteet arvutatakse triggeris konfist, kriis/makse/broneering on tehingulised `SECURITY DEFINER` funktsioonid (reaalukk → ülebroneerimist ei teki) |
| UI | `src/app/` | Next.js 16 App Router, server actions; mobile-first, suured nupud, ilma väliste fontide/raamistiketa (aeglane ühendus), hele/tume teema |

**Privaatsus:** vabateksti ei salvestata (ainult kasutaja kinnitatud kokkuvõte); terviseandmed (GDPR art 9)
ainult eraldi nõusolekul, eraldi tabelis, AES-256-GCM krüptotekstina; partner saab ainult minimaalse
väljavõtte (`accessibleNeeded` lipp, mitte diagnoos); KOV näeb ainult agregaate (lahtrid < 3 peidetud);
logija (`src/lib/log.ts`) laseb läbi ainult valge nimekirja ID-d.

## Vastuvõtukriteeriumid → testid

| # | Kriteerium | Kus kontrollitud |
|---|---|---|
| 1 | Vabatekstist ≤ 3 sammuga kinnitatud vajadus ja järjestatud vasted | `tests/agent.test.ts`, e2e |
| 2 | Harjumaa kriis: Harju kasutaja näeb saldot, varjumine/toit esikohal; Valga muutust ei näe | `tests/crisis.test.ts`, `rls.test.sql`, e2e |
| 3 | Ohumärk → 112, tellimusvoogu ei pakuta | `tests/agent.test.ts` (4 keelt) |
| 4 | Kriisisaldo ainult lubatud kategooriates; kriisi lõpus jääk fondi | `tests/wallet.test.ts`, `tests/crisis.test.ts`, `rls.test.sql` |
| 5 | KOV näeb ainult oma piirkonna agregaate | `tests/access.test.ts`, `rls.test.sql` (`needs_aggregate`) |
| 6 | Aeguv varu → täiendusnimekiri e-Selveri adapterisse | `tests/inventory-booking.test.ts` |
| 7 | Broneering vähendab vabu kohti, ülebroneerida ei saa | `tests/inventory-booking.test.ts`, `rls.test.sql` (`book_shelter`) |
| 8 | Testid: kaalud, maksete järjekord, RLS | `tests/priority.test.ts`, `tests/wallet.test.ts`, `supabase/tests/rls.test.sql` |

## Etappide seis

1. **Tuum** – tehtud: abivajaja voog, kiireloomulisus/kaalud, kriisirežiim (2 admini, allikas, audit), reservfond ja pearaamat.
2. **Vajaduste kaart** – tehtud: KOV/PR/admin vaade, kaart + tabel + ajarida, CSV, PDF (prindivaade), PR järjekord.
3. **Igapäevane kasutus** – tehtud: varud, mall leibkonna suuruse järgi, meeldetuletus, e-Selveri mock-adapter.
4. **Varjumine** – tehtud: register, „minu varjumisplaan“, kriisibroneering, „2 ööd“ (kalender, hind, partneri kinnitus, tühistus).
5. **Upgrade-päringud** – tehtud: vabatekst → struktureeritud päring → tehnopartner (Valgamaa: Lõuna Soojus & Tehnika).

## Teadaolevad piirangud / järgmised sammud

- **Rakendus kasutab MVP-s protsessisisest andmekihti** (taaskäivitusel lähtestub). Supabase skeem, RLS ja
  funktsioonid on valmis ja testitud, kuid `Db` → Supabase'i repositooriumi ühendamine on järgmine samm.
- Autentimine on demo-kasutajavalik (küpsis). Tootmises Supabase Auth.
- Claude API haru on kirjutatud ja tüübikontrollitud, kuid ilma API-võtmeta pole seda päris mudeliga läbi jooksutatud;
  testid kasutavad reeglipõhist agenti.
- Kaardil saab väikese lahtri vahel tuletada lahutamise teel (kogusumma − nähtavad). Tootmises tuleks summasid samuti ümardada/müraga katta.
- „2 ööd“ tühistuse tagastus läheb MVP-s isiklikku reservi (päris maksed väljaspool ulatust).
- Admin/KOV/partneri vaated on ainult eesti keeles; abivajaja voog on et/ru/en/uk.
