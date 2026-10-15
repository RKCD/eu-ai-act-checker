# Taip! – kontseptsiooni lühikirjeldus (brief teisele AI-le)

> Kasuta seda teksti sisendina, kui palud teisel AI-l Taip!-i täiendada, kriitiliselt hinnata või edasi arendada.
> Kõik siin on kirjutatud MVP seisu põhjal (oktoober 2026). Kood on olemas ja töötab demo-režiimis.

## Ühe lausega

Taip! on mobiilne abi- ja valmisolekuplatvorm. Inimene kirjeldab kriisis oma olukorda vabas vormis, AI aitab vajaduse sõnastada ja suunab ta sobiva abi juurde. Kõigist päringutest tekib omavalitsusele ja Punasele Ristile reaalajas anonüümne vajaduste kaart.

## Point – mis probleemi see lahendab

1. **Kriisis ei tea inimene, kuhu pöörduda.** Infot on (riiklikud valmisolekulehed, hoiatussõnumid), aga puudub koht, kus öelda „mul on selline mure“ ja saada vastu konkreetne abi: toidupakk, varjumiskoht, majutus, ravimid, vaimne tugi.
2. **Abi andjad ei näe nõudlust.** Omavalitsus ja Punane Rist kuulevad vajadustest telefonikõnede ja killustatud kanalite kaudu. Reaalajas pilti sellest, kes, kus, mida ja kui kiiresti vajab, ei ole.
3. **Kriisirakenduse paradoks.** Tavaajal ei ava keegi kriisirakendust, nii et kriisi ajal pole kasutajat ega tema andmeid. Taip! lahendab selle igapäevase kasutusega: koduvarude haldus, aegumise meeldetuletused, täiendustellimused ja „2 ööd“ valmisolekupakett.

## Väärtus rollide kaupa

| Roll | Väärtus |
|---|---|
| Abivajaja (sh eakad, vähese digioskusega, eri keelega: et/ru/en/uk) | Üks koht, kuhu oma sõnadega kirjutada. Ohu korral juhatab kohe 112-le. Kriisi ajal saab automaatse kriisisaldo toidu, peavarju ja ravimite jaoks. |
| Leibkond / ettevõte (tavaaeg) | Varude nimekiri, riikliku soovituse järgi koostatud mall, aegumise meeldetuletus, valmis poenimekiri / tellimus. |
| KOV kriisijuht | Oma piirkonna agregeeritud vajaduste kaart, ajas muutumine ja kriisiaruanne (CSV/PDF). Isikuandmeid ta ei näe. |
| Punase Risti operaator | Eeltöödeldud ja prioriteedi järgi sorteeritud abipäringute järjekord, nupuga „võta töösse“. |
| Partner (toit, varjend, maamaja, teraapia, tehnika) | Tavaajal kliendid (tellimused, broneeringud, varjendi upgrade'i päringud), kriisi ajal selged tellimused. |
| Admin | Peegeldab ametlikku kriisiotsust (kahe admini kinnitus, allikaviide, audit) ja haldab reservfondi pearaamatut. |

## Praegune eesmärk

**Valideerida kontseptsioon ühe pilootpiirkonnaga (Valgamaa), enne kui ehitada rohkem.** Konkreetselt:

1. Näidata töötavat demo ühele KOV kriisijuhile, ühele Punase Risti operaatorile ja 3–5 eakale kasutajale.
2. Saada vastused kolmele küsimusele:
   - Kas vajaduste kaart on see, mida KOV kriisi ajal vajab?
   - Kas operaator kasutaks järjekorda?
   - Kas eakas inimene saab abipäringu iseseisvalt läbi teha?
3. Alles seejärel ühendada päris andmebaas, sisselogimine ja partnerite liidesed.

## Mis on praegu olemas (MVP)

- **Abivajaja voog:**
  - vabatekst → kuni 3 täpsustavat küsimust → kasutaja kinnitab kokkuvõtte;
  - seejärel järjestatud vasted koos hinna ja makseallikaga (kriisisaldo → isiklik reserv → otsemakse);
  - lõpuks edastus partnerile või Punasele Ristile.
- **Kiireloomulisus:**
  - kriitiline (oht elule) → kohe 112, tavavoog peatub;
  - kiire (24 h jooksul kaob peavari, toit, soojus või ravimid);
  - tavaline.
  - Ohumärgid tuvastatakse deterministlike reeglitega **enne** AI-mudelit, nii et ohutus ei sõltu välisest API-st.
- **Prioriteet:** kiireloomulisuse baas + kriisirežiim piirkonnas + erivajadused (igaüks eraldi kaaluga) + leibkonna suurus. Kõik kaalud on konfis.
- **Kriisirežiim ja reservfond:**
  - admin peegeldab ametlikku otsust, aktiveerimiseks on vaja kahe admini kinnitust;
  - piirkonna leibkonnad saavad automaatse kriisisaldo, mida saab kasutada ainult toidu, varjumise ja meditsiini jaoks;
  - kriisi lõpus naaseb jääk fondi.
- **Vajaduste kaart:** ainult agregaadid, alla 3 päringuga lahtrid on peidetud. KOV näeb ainult oma piirkonda.
- **Varud** + e-Selveri adapter (MVP-s mock-tellimus ja sügavlingid).
- **Varjumiskohtade register** (mahutavus, vabad kohad, varustus), kriisibroneering ilma ülebroneerimiseta ja „2 ööd“ pakett.
- **Varjendi upgrade:** Taip! ise ei ehita. Vabatekstist tehakse struktureeritud päring tehnopartnerile.
- **Privaatsus:**
  - vabateksti ei salvestata;
  - terviseandmed (GDPR art 9) ainult eraldi nõusolekul, eraldi tabelis ja krüpteeritult;
  - partner saab ainult broneeringuks vajaliku miinimumi;
  - logidesse isikuandmed ei satu.
- **Tehnika:**
  - Next.js 16 + TypeScript;
  - Supabase/Postgres skeem koos row-level security'ga (testitud, aga rakendusega veel ühendamata);
  - Claude API agent koos reeglipõhise varuagendiga;
  - testid: 49 rakenduse testi ja 39 RLS-testi.

## Mis puudub / teadaolevad nõrkused

- Rakendus kasutab veel protsessisisest andmekihti. Supabase'i ühendus ja päris sisselogimine puuduvad.
- **Töö ilma võrguta.** Pikal voolu- ja sidekatkestusel ei pruugi veebirakendus töötada. Puuduvad ilma võrguta töötav versioon ja SMS-i varukanal.
- Partnerid (e-Selver, varjendid, tehnopartner) ja maksed on mock.
- Claude API haru pole päris mudeliga testitud. Hindamiskomplekti pole.
- Reservfondi õiguslik struktuur on lahtine: kes raha hoiab ja kas on vaja makseasutuse luba.
- Ärimudel on kontrollimata hüpotees. Võimalikud tuluallikad: KOV-i litsents, toetused, partnerite vahendustasu, ettevõtete valmisolek, pere-paketid.

## Põhimõtted, mida täiendused EI tohi rikkuda

1. **Ohutus enne kõike.** Ohumärgi korral 112 kohe. Agent ei diagnoosi ega anna ravisoovitusi.
2. **Taip! ei kuuluta kriisi ise välja.** Ta ainult peegeldab ametlikku otsust (allikaviide, kaks kinnitajat, audit).
3. **Andmete minimeerimine.** KOV näeb ainult agregaate. Partner näeb ainult talle suunatud päringut ja ainult vajalikku miinimumi. Terviseandmeid töödeldakse ainult nõusolekul.
4. **Raha ei osta prioriteeti.** Tasulised paketid ei mõjuta kriisiaegse abi järjekorda.
5. **Kõik kaalud, summad ja kategooriad on konfis, mitte koodis.**
6. **Abivajaja vaade on mobile-first:** suured nupud, lihtne keel, neli keelt, töötab aeglase ühendusega.
7. **Välised integratsioonid on adapterite taga** (`FoodProvider`, `ShelterProvider`, `AidChannel`, `ContractorChannel`, `PaymentProvider`).

## Mida ootan sinult (teiselt AI-lt)

Vali üks või mitu ja ütle selgelt, millist teed:

- **Kriitiline hinnang:** mis on kontseptsiooni nõrgim koht, mis eeldus kõige tõenäolisemalt ei pea, mida pilootkasutajatelt kindlasti küsida.
- **Täiendusettepanekud** prioriteedi järjekorras. Iga ettepaneku juures: miks, mõju kasutajale, keerukus (S/M/L) ja kas see rikub mõnda ülaltoodud põhimõtet.
- **Võrguta töötamise ja SMS-i varukanali disain** sidekatkestuse jaoks.
- **Ärimudel:** kes maksab, kui palju ja miks. Eralda platvormi tulu selgelt reservfondi rahast.
- **Riskid:** õiguslikud (GDPR art 9, makseteenused, avalik hange), eetilised (AI kriisis, välja jäänud inimesed) ja tehnilised.

Vastuse vorm: lühike kokkuvõte ülal, siis detailid. Kui väidad midagi Eesti seaduste, riigiasutuste või olemasolevate teenuste kohta, märgi allikas või kirjuta „kontrollimata“.
