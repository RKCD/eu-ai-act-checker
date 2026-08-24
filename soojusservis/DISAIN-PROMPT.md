# Ülesanne: Soojusservis OÜ veebilehe visuaalse disaini parandamine

Sul on ligipääs Astro-põhisele veebilehe koodile (`soojusservis/` kaustas —
kui sul koodile ligipääsu ei ole, kasuta allolevat konteksti ja anna
väljundiks värskendatud CSS/komponendid, mille saab käsitsi sisse panna).

## Kontekst

Sait on Tartu soojussõlmede hooldusfirma jaoks. Sihtklient: korteriühistu
juhatuse liige (mitte tehnik) ja haldusfirma objektijuht. Toon peab olema
asjalik, numbripõhine, mitte müügiv — aga **praegu on tulemus liiga
konservatiivne ja mõjub poolikuna, mitte "asjalikuna"**. Tellija hinnang:
"disain on täis pask." Vaja on päris viimistlust, mitte ainult toimivat
paigutust.

## Praegune disainisüsteem (SÄILITA need CSS custom property NIMED,
värvid/väärtused võib muuta)

```css
:root{
  --ground:#F4F6F5; --surface:#FFFFFF; --surface-2:#E8EDEB;
  --ink:#121A19; --ink-2:#4B5A55; --ink-3:#77857F;
  --line:#D3DAD7; --line-strong:#B4BFBB;
  --supply:#C4551D; --supply-soft:#F6E5DA;
  --return:#146F66; --return-soft:#DCEBE8;
  --font-display: 'Archivo', system-ui, sans-serif;
  --font-body: 'Source Serif 4', Georgia, serif;
  --font-mono: 'JetBrains Mono', ui-monospace, Menlo, monospace;
  --radius: 3px;
}
```
Tume teema peegeldab sama struktuuri (vt täisfail `src/styles/tokens.css`).
Fondid: Archivo (pealkirjad), Source Serif 4 (leibtekst), JetBrains Mono
(numbrid/sildid) — need on brändiotsus, ÄRA vaheta fonte.

## Mis konkreetselt praegu halvasti töötab

1. **Portfoolio "Tehtud tööd" kaardid** — foto asemel on diagonaalse
   triibumustriga plokk (`repeating-linear-gradient`), mis näeb välja nagu
   katkine pilt, mitte disainiotsus. Vaja on midagi, mis tunnistab ausalt
   "foto tuleb hiljem" ilma "broken image" muljeta — nt tumedam plokk
   tehnilise ikooni/mustriga, mono-sildiga "FOTO LISATAKSE" keskel.
2. **Hinnakirja kaardid on lamedad** — valge taust, õhuke hall 1px raam,
   null varju ega kihilisust. "Enim valitud" (STANDARD) pakett ei tõuse
   piisavalt esile — praegu on see väike silt, mis kattub kaardi raamiga.
   See pakett peab olema selgelt "see, mille me tahame et sa valiksid."
3. **Värvi kasutus on liiga napp** — `--supply` (oranž) ja `--return`
   (roheline) ilmuvad korra-kaks lehe peale, ülejäänu on hall-valge-must.
   Tulemus mõjub wireframe'i, mitte valmis brändina. Leia viise neid
   värve rohkem, aga endiselt distsiplineeritult kasutada (nt hinnakirja
   kaardi ülemine joon, ikoonid, aktiivsed olekud), ilma et see läheks
   "SaaS-landing" karnevaliks — see peab jääma tehniliseks dokumendiks,
   mitte muutuma värviliseks turundusleheks.
4. **Nimekirjad on visuaalselt ühetasased** — iga rida sama halli
   toonis tekst sama "—" bulletiga (teenuste sisu, paki funktsioonid,
   usaldussignaalid). Puudub hierarhia või rütm, mis lugejal aitaks
   silma peatada olulisel kohal.
5. **Nupud/kaardid ei reageeri kasutajale** peale lihtsa värvimuutuse
   hoveril — puudub tunne, et leht on "elus". Lisa läbimõeldud, VAOOS
   ja `prefers-reduced-motion` austavad mikrointeraktsioonid (nt kerge
   tõus/vari kaardi hoverile, nupu vajutuse feedback).
6. **Hero näidisraporti paneel** (parempoolne kast temperatuuridega
   71°C/47°C) on kontseptuaalselt hea — see peabki olema lehe tees —
   aga visuaalselt liiga õhuke: ainult peened jooned, väike kontrast.
   See element peaks olema lehe kõige "andmelisem" ja veenvam osa;
   tugevda seda (nt subtiilne gradient, tugevam eristus üle/all normi
   ridade vahel, parem visuaalne kaal numbritel).

## Mida MITTE muuta

- Ei mingit Tailwindi — jääb tavaline CSS custom properties'iga (vt
  `src/styles/base.css` struktuur: `.wrap`, `.section`, `.btn`,
  `.badge`, tabelite stiilid jne — need klassinimed on komponentides
  kasutusel, ära muuda API-t, muuda ainult stiile).
- Nurgaraadius jääb teravaks/tehniliseks — 3px on lubatud üles liikuda
  kuni max ~6px kui see aitab, aga mitte SaaS-i pehmeteks 12–16px
  raadiusteks.
- Kogu sisu jääb eesti keelde, ei mingit uut teksti brändi tooni
  muutmata (asjalik, mitte müügiv, ei ühtegi emojit).
- `prefers-reduced-motion` ja fookuse nähtavus (`:focus-visible`)
  peavad säilima.
- Hele/tume teema tugi (`prefers-color-scheme` + `[data-theme]`)
  peab säilima mõlemas suunas.

## Mida oodan väljundiks

1. Lühike diagnoos — mis täpselt praegu "pasa" tunde tekitab, sinu
   sõnadega, enne lahenduse juurde minekut.
2. Uuendatud `src/styles/tokens.css` ja `src/styles/base.css`
   (täisfailid, mitte katkendid) uue elevatsiooni-/varjusüsteemi,
   parema värvikasutuse ja mikrointeraktsioonidega.
3. Konkreetsed CSS muudatused komponentide `<style>` plokkidesse, kus
   vaja (nt `PricingCards.astro`, `PortfolioCards.astro` — pildi-
   platshoidja lahendus).
4. Kui soovitad struktuurset muudatust (nt kaardi paigutus, badge
   asukoht), kirjelda ka see, mitte ainult värvid.

Ehita järk-järgult: kõigepealt hinnakirja kaardid ja portfoolio
platshoidjad (need on kõige nähtavamad probleemid), seejärel ülejäänu.

---

**Märkus 2026-08-24:** Robert valis "tee otse ära" — seda prompti
lõpuks ei kasutatud teise AI peal, Claude tegi sama kriitika põhjal
parandused otse `soojusservis/` koodi. See fail jääb alles
dokumentatsiooniks/võrdluseks, kui hiljem tahad sama teemat teise
tööriistaga uurida.
