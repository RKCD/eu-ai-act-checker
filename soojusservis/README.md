# Soojusservis OÜ — veebisait

Astro + tavaline CSS, ilma andmebaasita. Sisu elab andmefailidena, et neid
saaks muuta komponente puutumata: nõuete tabel ja alamlehed on Astro
content collection (`src/content/nouded/*.md`), hinnad/teenused/portfoolio
on lihtsad JSON-failid (`src/data/*.json` — Astro content collections ei
luba tavalisi JSON-faile kollektsiooni juurkataloogis, seega eraldi kaust).

See on **etapp 1** (veebisait). Etapp 2 (`tools/audit/` tagasivoolu-auditi
CLI-tööriist) algab alles pärast etapi 1 kinnitamist.

## ENNE ESIMEST DEPLOY'D — täida need ära

Need on hetkel platshoiderid, mitte päris andmed:

| Kus | Fail | Mis puudu |
|---|---|---|
| Telefon, registrikood, aadress | `src/data/site.json` | Päris kontaktandmed |
| Hinnakiri (paketid, ühekordsed tööd) | `src/data/hinnakiri.json` | Kinnitus, et Rasmus on nõus nende hindadega tööd tegema — praegused (29/59/99 €/kuu) on turule ankurdatud ettepanek, mitte kokkulepe |
| Paki funktsiooniloendid (`sisaldub`/`eiSisaldu`) | `src/data/hinnakiri.json` | Need on minu koostatud näidisloendid — kontrolli, kas need vastavad tegelikule teenusele |
| **Tehtud tööd** | `src/data/tehtud-tood.json` | **Kõik kolm kaarti on väljamõeldud näidisandmed** (objektid, tulemused). Need TULEB asendada päris projektide andmetega enne live-minekut — väljamõeldud tulemuste avaldamine tegelike töödena on eksitav |
| Fotod | `src/components/PortfolioCards.astro` | Praegu mustriga platshoiderid, vaja päris fotosid |

## Regulatiivne täpsustus

`src/content/nouded/` failides viidatud seadused (ehitusseadustik,
tuleohutuse seadus, seadme ohutuse seadus) on üldriiklikud ja kehtivad kõigile.
Kaugkütte-spetsiifilised nõuded (nt soojussõlme surveproovi täpne intervall)
tulenevad aga **konkreetse kaugküttefirma liitumislepingust**, mitte
seadusest. Enne kui audititööriistas (etapp 2) kasutatakse konkreetseid
tagasivoolu normväärtusi (nt 25/43/63 °C), küsi Tartu kaugküttefirmalt
(mitte Utilitaselt, kes tegutseb mujal) nende endi tehniline dokument.

## Repo struktuur

```
soojusservis/
  src/
    content/
      config.ts           # nõuete kollektsiooni schema
      nouded/*.md          # 10 nõude alamlehe sisu (frontmatter + tekst) — tabel loeb sellest kollektsioonist otse
    data/
      hinnakiri.json        # paketid + ühekordsete tööde hinnakiri
      teenused.json         # 01/02/03 teenuste sisu
      tehtud-tood.json      # portfoolio kaardid
      site.json             # ärinimi, kontakt, usaldussignaalid
    layouts/
      BaseLayout.astro      # <head>, JSON-LD, nav+footer wrapper
    components/             # Nav, Footer, Hero, tabelid, kaardid, vorm
    pages/
      index.astro
      nouded/[slug].astro   # genereerib alamlehe iga nouded/ kirje kohta
      teenused/*.astro       # 3 teenuse lehte
    styles/
      tokens.css             # värvid, fondid (vt disainisüsteem allpool)
      base.css                # reset, tüpograafia, komponendid
  functions/
    api/kontakt.ts          # Cloudflare Pages Function, saadab kirja Resendiga
  public/
    favicon.svg, robots.txt
  wrangler.toml
```

## Kust sisu muuta

- **Hinnad ja paketid** → `src/data/hinnakiri.json`
- **Teenuste kirjeldused (01/02/03)** → `src/data/teenused.json`
- **Seaduse nõuete tabel + alamlehed** → `src/content/nouded/*.md` (frontmatter
  muudab tabelirea, tekst alamlehte)
- **Kontaktandmed, usaldussignaalid** → `src/data/site.json`
- **Tehtud tööd** → `src/data/tehtud-tood.json`

Ühegi hinna või teenuse muutmiseks ei ole vaja puutuda `.astro`-faile.

## Käivitamine

```bash
cd soojusservis
npm install
npm run dev
```

Avaneb `http://localhost:4321`.

```bash
npm run build      # kompileerib dist/ kausta
npm run preview    # eelvaade build'itud versioonist
```

## Kontaktivorm ja e-kiri

Vorm postitab `/api/kontakt` (Cloudflare Pages Function,
`functions/api/kontakt.ts`). Serveripoolne valideerimine kontrollib
kohustuslikke välju ja honeypot-välja (`kylastuse_pohjus`). E-kiri saadetakse
Resendi API kaudu.

Cloudflare Pages dashboardis (Settings → Environment variables) sea:

- `RESEND_API_KEY` — Resendi API võti
- `KONTAKT_EMAIL` — valikuline, kuhu päringud saadetakse (vaikimisi
  `info@soojusservis.ee`)

Resendis peab saatja domeen (`soojusservis.ee`) olema verifitseeritud, muidu
`from`-aadress ei tööta.

## Deploy Cloudflare Pages'i ja domeeni ühendamine

1. Push'i repo GitHubi.
2. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git,
   vali see repo, build command `npm run build`, output directory `dist`.
3. Lisa keskkonnamuutuja `RESEND_API_KEY` (vt eespool).
4. Kui deploy on läbi, mine Pages projekti → Custom domains → Add domain →
   `soojusservis.ee` (ja soovi korral `www.soojusservis.ee`).
5. Kui domeen on juba Cloudflare'is (DNS haldab Cloudflare) — Pages lisab
   CNAME kirje automaatselt. Kui domeen on mujal registripidajal, näitab
   Cloudflare, millised DNS-kirjed tuleb sinna lisada.
6. Statistika jaoks ilma cookie-bännerita: Cloudflare dashboard → Analytics →
   Web Analytics → luba see domeenile (ei nõua koodimuudatust).

## Disainisüsteem

Fondid: Archivo (pealkirjad/UI), Source Serif 4 (leibtekst), JetBrains Mono
(numbrid/sildid) — laetakse Google Fontsist `src/styles/base.css` päises.

Värvid on CSS custom properties `src/styles/tokens.css` failis — hele
teema baasina, tume teema `prefers-color-scheme` ja `[data-theme="dark"]`
kaudu. Nurgaraadius kõikjal `3px`. `--supply` (oranž) on aktsent ja
tähelepanu-semantika, `--return` (roheline) on korras-semantika — neid ei
segata omavahel.

## SEO

Iga leht: `<title>`, meta description, canonical, Open Graph, `lang="et"`.
`LocalBusiness` JSON-LD `BaseLayout.astro`-s. Sitemap genereeritakse
build ajal `@astrojs/sitemap` integratsiooniga (`sitemap-index.xml`).
`robots.txt` on `public/` all.

## Mis on teadlikult tegemata (vt algne spetsifikatsioon)

Online-broneerimine, kliendiportaal/sisselogimine, chatbot, karussellid ja
scroll-animatsioonid — need ei kuulu selle etapi/toote skoopi.
