# Varuring: e-Selveri paindlik tarne ja ringlev kodune kriisivaru

Kirjutatud 2026-10-25. Projekti olek: **etapp 0** (esitlus ja pilootpakkumine).
Koodi veel ei ole.

## Mida see lahendab, ühe lausega

Leibkond lubab paindliku tarneakna ("millal iganes sel nädalal") ja saab selle
eest soodustuse. Agent paneb roteeruvad varutellimused (vesi, konservid,
kaerahelbed, kassiliiv) e-Selveri vaiksematesse slottidesse. Kodude sahvrid
töötavad nagu akud elektri paindlikkusturul ja agent on nende koondaja.

## Kolm kihti, kolm maksjat

| Kiht | Kelle valu | Kes maksab |
|---|---|---|
| Koormuse tasandamine (tellimused vaiksematesse slottidesse) | e-Selveri logistika: kullerite ja komplekteerijate tipp reedel ja pühapäeval | Selver |
| Varude rotatsioon (korduv tellimus, vähem raiskamist) | Selveri kliendihoid ja prognoositav nõudlus | Selver |
| Kriisivalmidus, KOV koondkaart, heaolukontroll | Riik ja KOV: elanikkonnakaitse, üksi elavad eakad | Siseministeerium, Päästeamet, KOV-id |

**Varjatud võimalus on kolmandas reas.** Ametlik soovitus on hoida kodus
vähemalt 7 päeva varu, aga riik ei tea, kas inimestel see varu tegelikult on.
Täna ei paku keegi lahendust, mis varu ise tekitaks ja seda ringluses hoiaks.
Kõige tugevam positsioon on just selles vahepealses probleemis (riik ↔
jaemüüja).

## Raskekaup ja kulleri boonus (lisatud 2026-10-25)

Vesi ja kassiliiv on rasked ja mahukad, kuid ei rikne. Seega on need
paindliku akna jaoks ideaalsed tooted:

- **Klient** saab nende tellimisel jätta kullerile boonuse. Boonus lisatakse
  kulleri palgale tulemustasuna, nii et maksud makstakse palgaga koos ja
  sularaha jootraha ei liigu.
- **Selver** võib vaiksesse slotti nihutatud raske tellimuse boonuse ise
  kinni maksta. See on odavam kui tipus lisakulleri palkamine.
- Nii on turul kaks hooba: klient saab soodustuse ja kuller boonuse. Mõlemad
  suunavad koormuse samasse kohta.
- Vesi on 7 päeva varu kõige suurem osa. Soovitus on 3 l inimese kohta päevas,
  seega 2-liikmeline leibkond vajab 42 l. Ilma tarneta seda koju ei kanta.

Kontrollida: kas e-Selveri kullerid on Selveri palgal või alltöövõtjad. Sellest
sõltub, kas boonust saab üldse "palgale lisada".

## Hinnastamine (ettepanek, mitte kokkulepe)

- Piloot: fikseeritud tasu 5–15 tuhat €, 8–10 nädalat, üks linn, 100 leibkonda.
- Pärast pilooti on kaks varianti. Esimene: tasu iga tipust välja nihutatud
  tellimuse eest (~1–2 €). Teine: 20–30% mõõdetud logistikasäästust.
- Eeldame, et Selver võib lahenduse ise ehitada. Müüme tulemust ja
  domeeniteadmist (paindlikkuse koondamine, elanikkonnakaitse), mitte tarkvara.

Analoogide hinnad on suurusjärgud ja need tuleb enne esitlust üle kontrollida.
Korduvtellimuste mootorid (Recharge, Ordergroove) maksavad umbes 100 $ kuus
kuni 50 000 $+ aastas. Slotti ja marsruuti optimeerivad tööriistad (Bringg,
Descartes, Locus) maksavad mõnikümmend kuni ~150 tuhat € aastas. Energia
agregaatorid võtavad tavaliselt 20–40% paindlikkuse tulust.

## Etapid

| Etapp | Mis | Väljund väljaspool | Olek |
|---|---|---|---|
| 0 | Esitlus (Lovable, vt `LOVABLE-PROMPT.md`) ja pilootpakkumine (`PILOOT.md`) | Valmis materjal Selverile ja KOV-ile | **käimas** |
| 1 | Demo: 5 küsimust, paindlik aken ja 7 päeva varuplaan (Next.js/TS) | 15–20 päris leibkonda täidab selle | ootel |
| 2 | Wizard-of-Oz: tellime käsitsi tavalise e-Selveri kaudu vaiksematesse slottidesse | 2 numbrit: % valis paindliku akna, % tellis teist korda | ootel |
| 3 | Kohtumine e-Selveri e-kaubanduse juhiga ja ühe KOV-iga (Valga?) | Jah/ei pilootile ja kontaktisik | ootel |
| 4 | Alles pärast "jah"-i: slotisoovitaja, rotatsioonikalender, KOV koondkaart | Piloodi mõõdikud | ootel |

**Reegel:** etapp 1 algab alles siis, kui esitlus on valmis. Etapp 4 algab
alles pärast seda, kui Selver on pilootile jah öelnud. Ehitamine ei ole test.

## Etapi 1 demo spetsifikatsioon

Viis küsimust:

1. Mitu inimest on leibkonnas (täiskasvanud, lapsed, 70+)?
2. Kas on lemmikloomi (kass → kassiliiv, koer → toit)?
3. Mitu päeva saaksid praegu ilma poeta hakkama (0–1 / 2–3 / 4–6 / 7+)?
4. Kui palju on hoiuruumi (vähe / keskmiselt / palju)?
5. **Kas valiksid tarne "millal iganes sel nädalal", kui saad tasuta tarne või
   −X%?** (jah / jah, kui soodustus on piisav / ei)

Väljund on 7 päeva varuplaan koguste kaupa ja rotatsioonikalender, mis näitab,
mis millal ostukorvi liigub. Valikuna saab jätta kullerile boonuse raskekauba
eest.

Privaatsus: ühtegi terviseandmet ei küsita. Heaolukontroll ei kuulu demosse.
Koondkaardil on vähemalt 10 leibkonda lahtri kohta, üksikut leibkonda sealt
ei näe.

Avatud otsus: kuhu demo vastused salvestatakse (Google Sheet, lihtne
andmebaas või ainult e-post).

## Riskid (lühidalt)

- API puudub. Ilma Selveri IT-ta ei saa pilooti integreerida, seepärast
  algab kõik Wizard-of-Oz meetodil.
- Selver võib vastata "meil pole tipuprobleemi", sest tipp võib olla juba
  slotipõhiselt hinnastatud. Enne kohtumist tuleb kontrollida e-Selveri
  tarnetasusid.
- Selver võib idee kopeerida. Kaitseks on riigi ja KOV-i kiht.
- Heaolukontroll puudutab GDPR-i eriliigilisi andmeid. Kuller ainult annab
  märku ja inimene otsustab, mistõttu AI Acti mõttes ei ole see tõenäoliselt
  kõrge riskiga süsteem.
- Lahendus ei tohi sõltuda ühest kliendist: Barbora (Rimi), Prisma ja Coop on
  järgmised võimalikud kliendid.
