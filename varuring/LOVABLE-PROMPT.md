# Lovable: esitluse prompt (eelarve max 5 €)

## Kuidas krediiti säästa

Lovable võtab krediiti iga AI-sõnumi eest (umbes 1 krediit sõnumi kohta,
keerulisem muudatus rohkem). 5 € eest saab ~15–20 krediiti. Plaan:

1. **Üks sõnum:** kleebi allolev prompt tervikuna. Ära alusta "tee mulle
   esitlus" stiilis lühipromptiga, sest siis kulub krediit hiljem parandusteks.
2. **Teksti muudatused tee Visual Edits'iga** (klõpsa elemendil ja muuda),
   mitte chat'is. Nii ei kulu tavaliselt AI-krediiti. Kontrolli seda oma
   paketis.
3. **Kõige rohkem 2–3 parandussõnumit**, igaüks ühe konkreetse asja kohta.
   Pane parandused ühte sõnumisse kokku.
4. Kui on vaja suuremat muudatust, ühenda Lovable GitHubiga ja tee muudatus
   Claude Code'iga koodis. Nii kulub Lovable'i krediiti null.

Juhised on inglise keeles, sest Lovable järgib neid täpsemalt. Slaidide tekst
on eesti keeles.

---

## Prompt (kopeeri alates siit)

Build a single-page web slide deck (presentation) in React + Tailwind. No backend, no auth, no database.

**Navigation:** 11 full-screen slides. Left/right arrow keys and on-screen prev/next buttons move between slides. Show a slide counter "3 / 11" bottom right. Add a "P" key that toggles print mode, where all slides stack vertically for "Print to PDF" (one slide per A4 landscape page via `@media print`, `page-break-after: always`). Mobile: swipe to navigate, text must stay readable at 390px width.

**Visual style:** calm, factual, Nordic. Off-white background `#F7F6F2`, ink `#1A1F1C`, one accent green `#2F6B4F` (Selver-neutral, do NOT use Selver logo or brand colours), one secondary amber `#C98A1B` used only for "peak load" visuals. Font: Inter for text, JetBrains Mono for numbers and labels. Big type: slide titles 48–56px, maximum ~30 words of body text per slide. No stock photos, no emojis. Use simple inline SVG diagrams and large numbers instead. Subtle fade transition between slides (respect `prefers-reduced-motion`).

**Placeholders:** any value in square brackets like `[X]` must render as a visible amber-outlined chip so it is obvious it still needs a real number. Do not invent numbers to replace them.

**Slides (all on-slide text in Estonian, use exactly this content):**

1. **Kaas.** Title: "Varuring". Subtitle: "Paindlik tarne e-Selverile. Ringlev kriisivaru kodudele." Small footer: "Robert Kond · [kuupäev]".

2. **Probleem.** Title: "Tellimused tulevad samal ajal". Bar chart (SVG, Mon–Sun, illustrative shape only, label it "illustratiivne") with Friday and Sunday bars in amber, others in grey. Below it: "Reede õhtu ja pühapäev = kullerite ja komplekteerijate tipp. Teisipäeva hommik = vaba võimsus." Footer chip: "e-Selveri tegelik jaotus: [X]".

3. **Lahendus.** Title: "Klient lubab paindlikkust, saab soodustuse". Three steps in a row with arrows: "1. Klient valib: millal iganes sel nädalal" → "2. Saab tasuta tarne või −[X]%" → "3. Agent paneb tellimuse vaiksesse slotti".

4. **Analoogia.** Title: "Sahvrid on akud". Two-column comparison diagram: left "Elektri paindlikkusturg": Kodu aku → Agregaator → Võrguettevõtja. Right "Varuring": Kodu sahver → Agent → e-Selveri logistika. Line under it: "Sama loogika: väikeste paindlikkuste koondamine üheks juhitavaks ressursiks."

5. **Rotatsioon.** Title: "Midagi ei raisku". Circular SVG diagram with four stages: "Varu kodus" → "Aegumine läheneb" → "Liigub tavalisse ostukorvi" → "Uus varu tuleb paindliku tarnega" → back to start. Product chips around it: vesi, konservid, kaerahelbed, kassiliiv. Footer: "Korduv ja prognoositav tellimus."

6. **Raskekaup.** Title: "Vesi ja kassiliiv: rasked, aga ei kiirusta". Big number: "42 l". Caption: "vett 7 päeva varuks 2-liikmelisele leibkonnale (3 l inimese kohta päevas)". Two short points: "Klient saab jätta kullerile boonuse, mis lisatakse palgale tulemustasuna." and "Raskekaup vaiksesse slotti tähendab vähem tõstmist tipus."

7. **Riigi nurk.** Title: "Elanikkonnakaitse, mis tekib iseenesest". Points: "Soovitus: vähemalt 7 päeva varu kodus." / "Täna ei tea keegi, kas see varu tegelikult olemas on." / "Varuring tekitab varu ja hoiab seda ringluses." Side box: "Partnerid: Siseministeerium, Päästeamet, KOV-id".

8. **Andmed ja privaatsus.** Title: "KOV näeb kaarti, mitte kodu". Simple SVG map grid of anonymised cells with a legend "varu päevades". Points: "Ainult koondatud andmed, vähemalt 10 leibkonda lahtri kohta." / "Üksiku leibkonna andmed jäävad leibkonnale." / "Heaolukontroll ainult selge nõusolekuga. Kuller annab märku, inimene otsustab."

9. **Esimene test.** Title: "Mida päris leibkonnad ütlesid". Three big-number tiles: "[X] leibkonda testis", "[X]% valis paindliku akna", "[X]% tellis teist korda". Footer: "Test ilma integratsioonita: tellimused tehti käsitsi tavalise e-Selveri kaudu."

10. **Pilootpakkumine.** Title: "8 nädalat, 1 linn, 100 leibkonda". Left column "Mõõdikud": "nihutatud tellimuste %", "korduvtellimused", "raiskamine". Right column "Hind": "Piloot: [X] € fikseeritud tasu", "Edasi: [X] € iga tipust nihutatud tellimuse eest või [X]% mõõdetud säästust". Footer: "Algus ilma IT-arenduseta."

11. **Palve.** Title: "Mida me Selverilt vajame". Three numbered items: "1. Üks kontaktisik e-kaubandusest", "2. Kolm numbrit: slottide täituvus, kulleri kulu tellimuse kohta, raiskamine", "3. Nõusolek piloodiks ühes linnas". Bottom: contact line "[e-post] · [telefon]".

Keep the slide content in a single `slides.ts` data file so text can be edited without touching layout components.
