# FAAS 1 — raport

**Olulised tähelepanekud** — Kuna ma ei näe päris Enfoldi builderi
struktuuri, on 1.3 (päise number) ja 1.4 (hero) juhised kirjutatud üldise
Enfold/Avia mustri järgi (Advanced Layout Editor, CSS Classes väli). Kui
tegelik hero on tehtud teistmoodi (nt otse slider-pildi peal tekst
graafikuna, mitte HTML-elemendina), ei pruugi need klassid piisata — sel
juhul anna mulle teada, mis element see täpselt on, koostan täpsema
lahenduse.

**Tehtud** — Kõik FAAS 1 punktid (1.1–1.7) on ette valmistatud
koodiplokkide/juhistena, mitte live'is rakendatud (ligipääsu puudumise
tõttu):

| # | Ülesanne | Fail | Staatus |
|---|---|---|---|
| 1.1 | Logo päises | `teema2-lisandused/logo/wordmark-variant-1.svg`, `-2.svg` | Valmis, **otsus BOSCH_LEPING vajalik** enne kleepimist |
| 1.2 | Kleepuv helistamisriba | `functions-lisandused.php` + `quick-css-lisandused.css` | Valmis |
| 1.3 | Päise number desktopis | `JUHISED-FAAS1.md` p 3 | Valmis (admin-tekstiväli, koodi pole vaja) |
| 1.4 | Hero ümber | `JUHISED-FAAS1.md` p 4 + `quick-css-lisandused.css` | Valmis, kontrastikontroll enne live'i vajalik (foto puudub mul) |
| 1.5 | Küpsisebanner ümber | `JUHISED-FAAS1.md` p 5 | Valmis (admin-seadistus, koodi pole) |
| 1.6 | Mõõtmine (call_click, generate_lead) | `functions-lisandused.php` | Valmis |
| 1.7 | Jalus ja kontaktid | `functions-lisandused.php` + `JUHISED-FAAS1.md` p 2 | Valmis, **INFO_MEIL puudub, gmail-aadressid jäid muutmata** |

Commit'id gitis: iga ülesanne (0.x, 1.x) eraldi commit, vt `git log`
selles kaustas.

**Ei saanud teha** — Ei saanud midagi live'i panna (pole ligipääsu). Ei
saanud kontrollida päris kontrastisuhet hero teksti/foto vahel ega
tegelikke Enfoldi elemendinimesid.

**Pimealad ja riskid** —
- `TODO_BOSCH_LEPING` (jah/ei) on lahendamata — ilma selleta ei tohi
  logot kleepida ("Väljamõeldud fakt on halvem kui puuduv fakt" kehtib ka
  visuaalsete otsuste kohta, seega jätsin 2 varianti valikuks, mitte ühte
  valmis lahendust).
- `TODO_INFO_MEIL` puudub — gmail-aadressid jäävad esialgu kontaktvormis
  ja tekstis alles. See on promptis endas märgitud suurimaks üksikuks
  usalduskaoks B2B-kliendi silmis, seega soovitan seda mitte edasi lükata.
- Kui Theme File Editor on hostis turvakaalutlustel keelatud (levinud),
  vajab `functions.php` muutmine SFTP-d — vt `JUHISED-FAAS1.md`.

**Soovitus** — Kõige suurema mõjuga järgmine samm on `TODO_INFO_MEIL`
loomine (domeenipõhine e-post, ~1 €/kasutaja/kuu Zone/Google Workspace
juures) — ilma selleta jääb kontaktivorm ja tekst gmail-aadressitele
toetuma, mis on promptis endas nimetatud suurimaks usaldusprobleemiks.

**Järgmine samm** — Vali logo variant (1.1) VÕI kinnita Boschi lepingu
staatus, ning otsusta INFO_MEIL — nende kahe otsusega saab FAAS 1 lõplikult
kleepimisvalmis ja live-kõlbulikuks vormistada.
