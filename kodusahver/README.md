# Kodusahver

Väike staatiline uurimisprototüüp, mis testib üht äri-eeldust: **kui suur osa leibkondadest nõustub, et 72 tunni toiduvaru tuuakse „millal iganes sel nädalal“, kui tarne on tasuta** – ja kas see oleks neile uus ost (lisanduvus).

> Uurimisprototüüp. Tellimust ei esitata, makset ei toimu. See ei ole ühegi kaupluse teenus.

## Failid

```
kodusahver/
  index.html          kalkulaator ja küsimustik (üks leht)
  style.css           neutraalne kujundus, mobiil enne kõike
  app.js              loogika; ENDPOINT faili alguses
  privaatsus.html     andmekaitseteade
  apps-script/Code.gs Google Apps Script: kirjutab vastused Google Sheetsi
```

Ei mingeid sõltuvusi, ehitusetappi, küpsiseid, analüütikat ega väliseid fonte/skripte.

## Vool

1. Viis küsimust: leibkond (täiskasvanud / lapsed / eakad 70+), lemmikloomad, toitumine, hoiuruum, e-poest tellimise sagedus.
2. Isiklik 72 h nimekiri koos kogukaaluga (vesi 3 l inimese kohta päevas jne) ja lüliti „Arvuta nädala varu“.
3. Võtmeküsimus: „Kas sobiks, kui see tuuakse millal iganes sel nädalal, kui tarne on tasuta?“ – jah / ei / muul tingimusel, koos järelküsimusega.
4. Lisanduvus: mis on juba kodus olemas; kas ostaks nagunii.
5. Meeldetuletus aeguva kauba vahetamiseks: jah / ei.
6. Saatmine → „Aitäh!“ koos anonüümse vastuse koodiga (kustutamise taotlemiseks).

## Allika märgend

Iga grupp saab lingi oma märgendiga. Märgend salvestatakse veergu `allikas` (ilma `#`-ita). Kui märgendit pole, on väärtus `otse`.

```
https://rkcd.github.io/kodusahver/#pere
https://rkcd.github.io/kodusahver/#valga
https://rkcd.github.io/kodusahver/#fb
https://rkcd.github.io/kodusahver/#too
```

Lubatud on väiketähed, numbrid, `-` ja `_` (kuni 24 märki); muu muutub `otse`-ks.

## Saadetav JSON

Üks vastus (näide). Väljade järjekord on sama mis tabeli veergudel; tabelisse lisandub esimeseks veeruks `ajatempel`.

```json
{
  "id": "4F9A21C3",
  "versioon": "1",
  "allikas": "fb",
  "taiskasvanud": 2,
  "lapsed": 1,
  "eakad": 0,
  "inimesi": 3,
  "lemmikloomad": "koer",
  "toitumine": "tavaline",
  "hoiuruum": "keskmine",
  "epood_sagedus": "paar_kuus",
  "nadala_varu": false,
  "kaal_72h_kg": 38.6,
  "kaal_nadal_kg": 89.2,
  "paindlik": "muul_tingimusel",
  "tingimus": "kindel_paev",
  "tingimus_muu": "",
  "ei_pohjus": "",
  "kodus_olemas": "umbes_pool",
  "ostaks_nagunii": "voib_olla",
  "meeldetuletus": "jah"
}
```

| Väli | Väärtused |
|---|---|
| `paindlik` | `jah`, `ei`, `muul_tingimusel` |
| `tingimus` | `soodustus_5`, `soodustus_10`, `kindel_paev`, `muu` (tühi, kui `paindlik` ≠ `muul_tingimusel`) |
| `tingimus_muu` | vabatekst kuni 140 märki, ainult kui `tingimus` = `muu` |
| `ei_pohjus` | `kindel_aeg`, `ei_telli`, `ei_hoia`, `muu` (tühi, kui `paindlik` ≠ `ei`) |
| `kodus_olemas` | `peaaegu_koik`, `umbes_pool`, `vahe` |
| `ostaks_nagunii` | `jah`, `voib_olla`, `ei_uus` |
| `epood_sagedus` | `iga_nadal`, `paar_kuus`, `harvem`, `ei_telli` |
| `lemmikloomad` | `ei`, `koer`, `kass`, `koer_kass` |
| `toitumine` | `tavaline`, `taimetoit`, `vegan`, `gluteenivaba`, `laktoosivaba` |
| `hoiuruum` | `vahe`, `keskmine`, `palju` |
| `nadala_varu` | kas vastaja jättis lüliti „nädala varu“ sisse |
| `id` | juhuslik 8-märgiline kood; ei ole seotud inimesega, vajalik ainult kustutamise taotluseks |

Isikuandmeid (nimi, e-post, telefon, aadress, IP) ei saadeta. Apps Script ei näe saatja IP-d.

## Vastuste kogumine: Google Apps Script → Google Sheets

1. Ava [sheets.new](https://sheets.new) ja loo uus tabel, nt nimega „Kodusahver vastused“.
2. Menüü **Extensions → Apps Script**.
3. Kustuta vaikekood ja kleebi sisse kogu `apps-script/Code.gs` sisu. Salvesta (Ctrl+S).
4. Paremal üleval **Deploy → New deployment**.
5. Hammasratta ikoonist vali tüübiks **Web app**.
   - Description: `kodusahver v1`
   - **Execute as: Me**
   - **Who has access: Anyone**
6. **Deploy**. Google küsib luba („Authorize access“) → vali oma konto → *Advanced* → *Go to … (unsafe)* → *Allow*. (Hoiatus tuleb, sest skript on sinu oma ja kontrollimata; see kirjutab ainult sellesse tabelisse.)
7. Kopeeri **Web app URL** (lõpeb `/exec`).
8. Ava `app.js` ja pane URL faili algusesse:
   ```js
   const ENDPOINT = 'https://script.google.com/macros/s/AKfy.../exec';
   ```
9. Kontrolli: ava URL brauseris – peab näitama „Kodusahver: vastuvõtt töötab.“ Siis tee lehel üks testvastus ja vaata, kas tabelisse tekkis leht `vastused` päise ja ühe reaga. Kustuta testrida.

**Koodi muutmisel:** Deploy → Manage deployments → pliiats → Version: *New version* → Deploy. Nii jääb URL samaks.

**Kui `ENDPOINT` on tühi või saatmine ebaõnnestub**, näitab leht vastust JSON-reana koos nupuga „Kopeeri“, et vastus ei läheks kaduma. Vastaja saab selle saata lingi jagajale; selle saab hiljem tabelisse käsitsi lisada.

Märkus: `mode: 'no-cors'` tõttu ei näe brauser Apps Scripti vastust. Leht teab ainult seda, kas päring võrku läks. Seetõttu kontrolli tabelit pärast esimesi vastuseid.

## Kohalik proovimine

```bash
cd kodusahver
python3 -m http.server 8000
# ava http://localhost:8000/#pere
```

## Avaldamine GitHub Pagesis

Avalik repo `kodusahver` kontol `rkcd`:

```bash
cd kodusahver
git init -b main
git add .
git commit -m "Kodusahver: uurimisprototüüp, etapp 1"
gh repo create rkcd/kodusahver --public --source=. --remote=origin --push
gh api -X POST repos/rkcd/kodusahver/pages -f "source[branch]=main" -f "source[path]=/"
```

Ilma `gh`-ta: loo GitHubis tühi avalik repo `kodusahver`, siis

```bash
git remote add origin https://github.com/rkcd/kodusahver.git
git push -u origin main
```

ja **Settings → Pages → Build and deployment → Source: Deploy from a branch → main / (root) → Save**.

Leht on mõne minuti pärast aadressil `https://rkcd.github.io/kodusahver/`.

**Enne avaldamist:** `ENDPOINT` URL on lähtekoodis avalik. See on tavapärane (iga vastaja brauser peab seda teadma), kuid tähendab, et keegi võib sinna ka käsitsi ridu saata. Väikese valimi puhul vaata tabel enne analüüsi üle.
