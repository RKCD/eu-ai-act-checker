# FAAS 1 — kleepimisjuhend (variant C)

Enne alustamist: tee täisvarukoopia (failid + andmebaas). Kui hostimine on
Zone/Veebimajutus.ee tüüpi, on tavaliselt paneelis "Backup" nupp — kui pole
kindel, küsi hostilt.

## 1. Logo päises

**Asukoht:** WP-admin > Enfold > Theme Options (Enfold ikoon vasakus
menüüs) > "General Styling" vahekaart > "Logo" väli.

* Kui **Boschi partnerleping (`TODO_BOSCH_LEPING`) = jah**: lae siia oma
  logo (kui on olemas) ja liiguta olemasolev `bosch-300x100.png` lehele
  "Koostööpartnerid" ning esilehe partnerite ribale (Enfoldi Advanced
  Layout Editoris lohista pilt sinna sektsiooni, kus praegu partnerite
  logod on).
* Kui **= ei**: eemalda `bosch-300x100.png` sellest väljast kohe ja lae
  üles üks kahest lisatud SVG-st:
  `teema2-lisandused/logo/wordmark-variant-1.svg` või
  `wordmark-variant-2.svg` (kuni päris logo valmib). Tekst "Bosch, Buderus,
  Wolf, Viessmann, De Dietrich" jääb lehe tekstis alles.
* **See otsus (`TODO_BOSCH_LEPING`) on hetkel tegemata — vali variant enne
  kleepimist.**

## 2. Kleepuv helista/broneeri riba (1.2) + mõõtmine (1.6) + jaluse aasta (1.7)

**Asukoht:** WP-admin > Pealehitsus (Appearance) > Theme File Editor >
vali paremalt `teema2` (lapsteema) > `functions.php`.

1. Ava fail, keri lõppu.
2. Kleebi kogu sisu failist `teema2-lisandused/functions-lisandused.php`
   faili lõppu (ÄRA kirjuta midagi olemasolevat üle).
3. Salvesta ("Update File").

Kui Theme File Editor on turvakaalutlustel keelatud (levinud pluginate/
hostide juures), kasuta selle asemel FTP/SFTP-d või hostimispaneeli
failihaldurit samale failile: `wp-content/themes/teema2/functions.php`.

**Jaluse aastaarvu kasutamine (1.7):** leia jaluse tekstis praegune rida
"© 2020 ..." (tõenäoliselt Enfold > Theme Options > Footer, "Copyright"
väli, või otse jaluse mallifailis) ja asenda see PHP-koodiga:
```php
<?php echo khk_footer_copyright(); ?>
```
Kui jaluse tekst on Theme Options tekstiväljas (mitte PHP-failis), ei saa
seal PHP-d käivitada — sel juhul kirjuta lihtsalt käsitsi
"© 2026 Katlamajade Hooldus OÜ" ja uuenda seda igal aastal käsitsi, KUNI
jaluse mall on kodeeritud faili (siis saab dünaamilise variandi kasutusele
võtta).

Lisa samasse jaluse alasse tekst: **"E–R 8.00–17.00. Avariiväljakutse ka
väljaspool tööaega (hinnakordaja kehtib)."**

**Gmail-aadresside asendus:** kui `TODO_INFO_MEIL` (nt
`info@katlamajadehooldus.ee`) on juba loodud, asenda kõik esinemised
`aivarkond@gmail.com` ja `urmassona@gmail.com` sellega — kontaktvormi
CF7 seadetes ("Mail" vahekaart, "To" väli) ja igal pool tekstis, kus
e-post on nähtaval. **Kui domeenipõhist e-posti veel pole, ÄRA muuda —
see on eraldi otsus, vt RAPORT-FAAS1.md.**

## 3. Päise number desktopis (1.3)

**Asukoht:** WP-admin > Enfold > Theme Options > "Header" vahekaart >
"Header Extra Elements" (Enfoldi versioonides tavaliselt tekstiväli või
laiendatava päise ala). Lisa tekst:

```
505 7556 · E–R 8–17 · avariiväljakutse ka väljaspool tööaega
```

Number peab olema link kujul `tel:+3725057556`. Kui Enfoldi tekstiväli ei
luba HTML-i, kasuta selle asemel Enfoldi "Header — Custom Menu Item" või
lisa link Theme Options "Header — Social Icons/Text" alla, kui seal on
HTML lubatud. Kui ükski neist ei tööta, tuleb see element lisada koodis
(pole selle FAAS 1 osa, ütle mulle, kui otsest teksti-välja Enfoldis
ei leidu, koostan hoo-põhise koodilahenduse).

## 4. Hero ümbertegemine (1.4)

**Asukoht:** WP-admin > Lehed (Pages) > Esileht > "Edit with Avia Layout
Builder". Leia hero/slider element (tavaliselt lehe kõige ülemine
"Color Section" või "Advanced Slider" element).

1. Klõpsa hero elemendil > "Advanced" vahekaart > "CSS Classes" väli >
   lisa `khk-hero`.
2. H1 tekst asenda: **"Gaasikatelde hooldus ja remont Tartus alates 2003"**
   (mitte trükitähtedes).
3. Alapealkirja tekstielemendile lisa CSS-klass `khk-hero__sub`, tekst:
   *"Hooldus, remont, varuosad ja paigaldus. Bosch, Buderus, Wolf,
   Viessmann, De Dietrich. Hoolduslepinguga klient saab abi
   eelisjärjekorras."*
4. Lisa kaks nuppu (Enfoldi "Button" element) ühte ritta, ümbritsevale
   konteinerile CSS-klass `khk-hero__ctas`:
   * Nupp 1: tekst "Helista 505 7556", link `tel:+3725057556`, CSS-klass
     `khk-btn khk-btn--primary`.
   * Nupp 2: tekst "Broneeri hooldus", link `/gaasikatla-hooldus/#broneeri`,
     CSS-klass `khk-btn khk-btn--secondary`.
5. Lisa loend (List element või kolm Text elementi ühes reas) CSS-klassiga
   `khk-trust`, sisu: "22 aastat Tartus" · "Bosch, Buderus, Wolf,
   Viessmann" · "Hooldusleping alates 45 €/h".
6. Kleebi `quick-css-lisandused.css` sisu (Enfold > Theme Options >
   "Advanced Styling" > "Quick CSS") faili lõppu.

**Kontrolli pärast salvestamist:** ava leht mobiilivaates (375 px) ja
kontrolli, et H1 mahub kolmele reale ja mõlemad nupud on nähtavad ilma
kerimata.

## 5. Küpsisebanner ümber (1.5)

**Asukoht:** WP-admin > CookieYes > Banner Settings > "Banner Type" > vali
"Bottom Bar" (mitte "Popup"/"Box" keskel). "Buttons" alajaotuses kontrolli,
et "Reject" ja "Accept" nupud on visuaalselt võrdse kaaluga (sama suurus,
sama stiil, ainult värv erinev).

## Kontroll enne live-minekut (kordan promptist)

- [ ] Varukoopia tehtud
- [ ] Mobiil 375 px: helistamisriba nähtav, hero loetav, midagi ei jookse üle
- [ ] Desktop 1440 px: sama
- [ ] Vormid saadavad kirja endiselt korrektselt
- [ ] Ükski vana URL ei anna 404
- [ ] Lehel pole ühtegi `TODO_`/`<<...>>` kohatäidet
