# Ülesanne teisele AI-le: Taip! konkurentsi- ja turukaardistus

> Kopeeri kogu see tekst teisele AI-le. Parim on mudel, millel on veebiotsing ja mis oskab allikaid tsiteerida.
> Lisa juurde fail `KONTSEPTSIOON.md` (Taip!-i lühikirjeldus).

---

## Roll ja eesmärk

Oled põhjalik turu- ja poliitikaanalüütik, kelle teemad on elanikkonnakaitse, kriisivalmidus ja digiteenused avalikule sektorile. Sinu ülesanne on **põhjalikult ja detailselt kaardistada, kes, kus ja kuidas pakub juba Taip!-iga analoogset lahendust**, ning välja selgitada:

1. kas keegi pakub juba sama kontseptsiooni (tervikuna või suures osas);
2. milline osa Taip!-i funktsioonidest on juba olemas (kelle juures, kui hästi, kas tasuta);
3. **mis jääb puudu** – lüngad, mida olemasolevad lahendused ei kata;
4. **milline on nišš**, millele Taip! peaks keskenduma, ja mida ta peaks teadlikult tegemata jätma, sest riik või keegi teine teeb seda juba paremini.

## Taip! lühidalt (detailid failis KONTSEPTSIOON.md)

Mobiilne abi- ja valmisolekuplatvorm. Inimene kirjeldab kriisis oma olukorda vabas vormis, AI aitab vajaduse sõnastada, hindab kiireloomulisust (ohumärgi korral kohe 112) ja suunab ta sobiva abi juurde: toit, varjumine, majutus, ravimid, vaimne tugi. Kõigist päringutest tekib KOV-ile ja Punasele Ristile reaalajas anonüümne vajaduste kaart. Kriisi ajal saavad piirkonna leibkonnad reservfondist kategooriatega piiratud kriisisaldo. Tavaajal hoiab kasutajaid platvormil igapäevane osa: koduvarude haldus, täiendustellimused (e-Selver), varjumiskohtade register ja „2 ööd“ valmisolekupakett. Lisaks saab teha varjendi upgrade'i päringu tehnopartnerile.

## Võrdluse funktsioonid (kasuta neid maatriksi veergudena)

| Kood | Funktsioon |
|---|---|
| F1 | Hoiatused ja teavitused (cell broadcast, push) |
| F2 | Valmisolekuinfo ja juhised (mida teha, mis varuda) |
| F3 | Isikliku/leibkonna varude haldus ja aegumise meeldetuletus |
| F4 | Täiendustellimus / integratsioon jaemüüjaga |
| F5 | Varjumiskohtade kaart / register |
| F6 | Varjumiskoha või majutuse **broneerimine** ja vabade kohtade arvestus |
| F7 | Vabatekstist abivajaduse sõnastamine (AI/vestlus), mitmekeelne |
| F8 | Kiireloomulisuse triaaž ja ohumärkide suunamine hädaabinumbrile |
| F9 | Abivajaja **suunamine** konkreetse teenusepakkuja / organisatsiooni juurde |
| F10 | Agregeeritud **vajaduste kaart** omavalitsusele / humanitaarorganisatsioonile |
| F11 | Abiorganisatsiooni operaatori töölaud (järjekord, „võta töösse“, staatus) |
| F12 | Kriisiaegne rahaline toetus / saldo / vautšer, kategooriatega piiratud |
| F13 | Reservfondi / annetuste pearaamat ja läbipaistvus |
| F14 | Partnerite turg tavaajal (valmisolekupaketid, laagrid, varjendi ehitus/upgrade) |
| F15 | Võrguta töötamine / SMS-i varukanal |
| F16 | Privaatsus: andmete minimeerimine, terviseandmete eraldi nõusolek |

## Mida kaardistada (ulatus)

Otsi aktiivselt ja kontrolli iga allikat. Ära piirdu esimeste tulemustega.

### A. Eesti (kõige olulisem)
- Riiklikud: kriisiinfo ja valmisoleku portaalid, riiklik ohuteavitus, hädaabi ja Häirekeskuse lahendused, riigiinfo telefon, Päästeameti varjumiskohtade info ja kaart, Riigikantselei elanikkonnakaitse materjalid, eesti.ee / riigiportaali kriisiteenused.
- Vabatahtlikud ja kolmas sektor: Naiskodukaitse, Kaitseliit, Eesti Punane Rist, Toidupank, külaseltsid ja kogukonnavõrgustikud. Mis rakendusi ja töövahendeid neil on?
- Omavalitsused: kas KOV-idel on kriisi ajal elanike vajaduste kogumise tööriist (vorm, CRM, kõnekeskus, Exceli tabel)? Kuidas seda praegu tehakse?
- Erasektor: valmisolekukomplektide müüjad, kindlustusseltside valmisolekuteenused, jaekettide kriisivalmidus, ehitus-/tehnofirmad, kes pakuvad varjendeid.
- Avaliku sektori hanked ja arendusprojektid: kas riik või KOV-id on tellinud või plaanivad sarnast süsteemi (riigihangete register, Riigikantselei, Siseministeerium, innovatsiooniprogrammid)?

### B. Naaberriigid ja võrdlusriigid
- Soome, Rootsi, Norra, Läti, Leedu, Poola.
- Ukraina: sõjaaegsed tsiviilrakendused, varjumiskohtade ja abipunktide kaardid, riiklik digirakendus, abi taotlemise platvormid.
- Iisrael: kodurinde ohuteavitus ja varjumise juhised.
- Saksamaa, Šveits (varjendite traditsioon), Holland, Ühendkuningriik, USA, Jaapan.

### C. Rahvusvahelised ja humanitaarsed tööriistad
- Punase Risti / Punase Poolkuu liikumise rakendused ja töövahendid (näiteks hädaolukorra rakendused, vajaduste hindamise ja jaotamise süsteemid, rahaabi platvormid).
- ÜRO / humanitaarsektori vajaduste hindamise ja koordineerimise tööriistad.
- Avatud lähtekoodiga kriisikaardistus ja katastroofihalduse platvormid.
- Kogukonna vastastikuse abi platvormid (naabriabi, vabatahtlike vahendus).

### D. Lähedased ärimudelid
- Valmisolekuvarude tellimisteenused (subscription), kindlustus + valmisolek, varjendite ehitus ja sertifitseerimine, „preparedness-as-a-service“ ettevõtetele.

> **Lähtevihjed (KONTROLLIMATA – kasuta ainult otsingu alguspunktina, kinnita või lükka ümber):**
> Eestis: kriis.ee; riiklik ohuteavitussüsteem EE-ALARM; Naiskodukaitse rakendus „Ole valmis!“; Päästeameti avalike varjumiskohtade kaart; riigiinfo telefon 1247; Häirekeskuse 112 lahendused; Eesti Toidupank.
> Mujal: Soome 72 tunnin varautuminen ja 112 Suomi; Rootsi krisinformation.se ja brošüür „Om krisen eller kriget kommer“; Saksamaa NINA ja KATWARN; Ukraina Diia, õhuhäire rakendus ja „Пункти незламності“ kaart; FEMA rakendus; Ameerika Punase Risti hädaolukorra rakendused; Ushahidi; Sahana Eden.
> Need nimed võivad olla vananenud, ümber nimetatud või suletud – kontrolli iga ühe hetkeseisu.

## Iga leitud lahenduse kohta kogu

- Nimi, omanik/haldaja (riik, KOV, MTÜ, ettevõte), riik, käivitusaasta, **kas on 2026. aastal aktiivne**
- Sihtrühm ja kanal (äpp, veeb, SMS, telefon, cell broadcast)
- Millised funktsioonid F1–F16 on kaetud: **täielikult / osaliselt / ei**, iga hinnangu juurde lühike põhjendus
- Ärimudel (tasuta riigiteenus, toetus, litsents, tasuline, annetused)
- Kasutajate arv või ulatus, kui avalik
- Keeled; ligipääsetavus eakatele / vähese digioskusega inimestele
- Kas töötab ilma võrguta või sidekatkestusel
- Kas on avatud API või partnerlusvõimalus (kas Taip! saaks sellega integreeruda, mitte konkureerida?)
- Tugevused ja nõrkused (kasutajate tagasiside, meedia, auditid, kui leidub)
- **Allikas(ad) koos lingi ja kuupäevaga**

## Analüüsi osad, mida ootan

1. **Kokkuvõte (max 1 lehekülg):**
   - Kas keegi pakub juba sama asja?
   - Mis on 3 suurimat lünka turul?
   - Mis on Taip!-i soovitatav nišš?
   - Kas Taip! peaks olema iseseisev toode, partner riiklikule lahendusele või moodul olemasoleva sees?
2. **Maatriks:** read on lahendused, veerud F1–F16 (✓ / ◐ / ✗) ning lisaks ärimudel ja võrgutöö. Viimaseks reaks pane Taip!.
3. **Kategooriate kaupa ülevaade (A–D):** mis on olemas ja kui hästi see töötab.
4. **Lünkade analüüs:** mida ei kata keegi või katab halvasti, eriti järgmised küsimused:
   - Kas Eestis on tööriist, millega abivajaja saab oma vajadusest teada anda ja konkreetse abi juurde suunatud saada (mitte ainult infot lugeda)?
   - Kas KOV-il on reaalajas vajaduste kaart?
   - Kas valmisolekut (tavaaeg) ja kriisiabi (kriisiaeg) seob keegi üheks teenuseks?
   - Kas kategooriatega piiratud kriisiaegset rahalist toetust jagatakse digitaalselt?
5. **Nišš ja positsioneerimine:**
   - Kus on Taip!-i tegelik eelis?
   - Mida ta peaks olemasolevatelt **kasutama või nendega integreeruma**? Näiteks ära ehita ohuteavitust ega varjumiskohtade kaarti uuesti, kui riik seda juba pakub.
   - Mida teha teisiti?
6. **Ohud:**
   - Riik teeb sama asja tasuta.
   - Usaldus erafirma vastu kriisis.
   - Hankereeglid.
   - Andmekaitse.
   - Sõltuvus partneritest.
   - Kas ärimudel toimib, kui põhikasutus on harv?
7. **Soovitused:** 5–10 konkreetset järgmist sammu, sh kellega Eestis rääkida (asutused, rollid, mitte eraisikute nimed) ja millised andmed või uuringud valideeriksid nišši.

## Nõuded kvaliteedile

- **Iga faktiväite juures allikas.** Kui allikat ei leia, kirjuta „kontrollimata“. Ära mõtle lahendusi ega funktsioone välja.
- Eelista ametlikke allikaid (asutuste lehed, rakenduste poed, hanked, aastaaruanded), seejärel meediat.
- Märgi selgelt, kas info pärineb 2025.–2026. aastast või on vanem.
- Eralda faktid ja oma hinnangud.
- Ole Taip!-i suhtes kriitiline. Kui analoog on olemas ja parem, ütle see otse.
- Keel: eesti keel. Rakenduste ja asutuste nimed jäta originaalkeelde.
