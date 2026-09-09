# FAAS 0 — raport

**Olulised tähelepanekud** — Sellel Claude Code sessioonil pole ligipääsu
katlamajadehooldus.ee majutusele (SSH/SFTP/WP-admin) ega isegi väljaminevat
võrguühendust sellele domeenile (keskkonna võrgupoliitika blokeerib
`EGRESS_BLOCKED`, kinnitatud proxy staatusest, mitte ajutine tõrge). See
tähendab, et 0.1 variant A ja B ei ole kättesaadavad ning ma ei saanud isegi
avalikku HTML-i alla laadida, et 0.3/0.4 päriselt üle kontrollida. Töötan
seetõttu variant C-s: valmis koodiplokid + juhised, ilma otsest ligipääsu
kasutamata.

**Tehtud** —
- 0.1: tuvastatud töövoog = **variant C** (dokumenteeritud `README.md`-s).
- 0.3 (osaline): promptis endas antud, 09.09.2026 mõõdetud lähtetase
  salvestatud faili `baastase-2026-09-09.md`.
- Loodud lokaalne git-kaust `katlamajadehooldus/` (commit'id järgnevad).

**Ei saanud teha** —
- 0.2 (täisvarukoopia) — vajab hostimisele ligipääsu, mida mul pole.
- 0.3 (ülejäänud): PageSpeed Insights päris skoor, GA4 90 päeva andmed,
  Search Console top 20, Google Business Profile staatus — kõik vajavad
  kas Google'i kontodele ligipääsu või selle keskkonna võrgupoliitika
  laiendamist.
- 0.4 (inventuur täpsete failide/ridadega) — vajab tegelikku koodile
  ligipääsu. Teadaolevate probleemide **eksistents** on kinnitatud
  (promptis endas antud auditi järgi), aga täpne fail+rida asukoht mitte.

**Pimealad ja riskid** — Kuna ma ei näe päris lehe HTML/CSS struktuuri,
põhinevad kõik FAAS 1 koodiplokid eeldusel, et Enfoldi lapsteema
`functions.php`, jaluse mall ja hero-element on tavapärasel Enfold/Avia
struktuuril. Kui teema on rohkem kohandatud, võib mõni CSS-klass või hook
vajada kohandamist pärast esimest testi. Samuti ei saa ma kontrollida
kontrastisuhet hero teksti ja päris foto vahel (WCAG AA nõue) enne, kui
näen tegelikku pilti.

**Soovitus** — Anna kas (a) uus/laiendatud võrguligipääsuga keskkond, (b)
SSH/SFTP/WP-admin andmed, või (c) ekspordi `wp-content/themes/teema2`
kaust ja jaga see failina — iga variant lubab mul FAAS 0 lõpuni viia ja
FAAS 1 päriselt live'i panna, mitte ainult ette valmistada.

**Järgmine samm** — Otsusta `TODO_BOSCH_LEPING` ja `TODO_INFO_MEIL`
väärtused (vt `RAPORT-FAAS1.md`), et FAAS 1 logo ja kontaktid saaks
lõplikult vormistada enne live-minekut.
