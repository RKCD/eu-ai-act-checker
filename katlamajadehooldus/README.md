# katlamajadehooldus.ee — uuenduse töökaust

See kaust sisaldab ettevalmistatud koodiplokke ja juhiseid katlamajadehooldus.ee
WordPressi lehe uuendamiseks, koostatud faili `katlamajadehooldus-prompt.md`
kirjelduse järgi (roll: FAAS-põhine konversioonile suunatud uuendus).

## Miks kood on siin, mitte otse lehel

Sellel sessioonil ei ole ligipääsu katlamajadehooldus.ee majutusele
(SSH/SFTP, WP-admin) ega selle keskkonna võrgupoliitika ei luba väljaminevat
ühendust sellele domeenile — seega ei saanud lehte otse muuta ega isegi
avalikku HTML-i alla laadida kontrollimiseks. Töötan seetõttu **variant C**
stiilis (vt prompt § "FAAS 0", punkt 0.1.C): valmis koodiplokid + täpne
juhis, kuhu need WP-adminis kleepida. Lehe omanik või keegi, kellel on
WP-adminile ligipääs, rakendab need käsitsi.

Kõik koodiplokid põhinevad ainult promptis endas antud kinnitatud faktidel
(telefon, aadress, reg-koodid, hinnakiri, brändid). Ühtki hinda, sertifikaati
ega fakti pole juurde mõeldud — kohad, kus otsus puudub, on märgistatud
`TODO_`-prefiksiga ja loetletud raportis.

## Struktuur

```
katlamajadehooldus/
  README.md                      — see fail
  baastase-2026-09-09.md         — mõõdetud/teadaolev lähtetase
  RAPORT-FAAS0.md                — FAAS 0 raport
  RAPORT-FAAS1.md                — FAAS 1 raport
  JUHISED-FAAS1.md                — samm-sammuline kleepimisjuhend
  teema2-lisandused/
    functions-lisandused.php     — kõik uued PHP-hookid (1.2, 1.6, 1.7)
    quick-css-lisandused.css     — kõik uued CSS-reeglid (1.2, 1.4)
    logo/
      wordmark-variant-1.svg
      wordmark-variant-2.svg
```

## Enne live-minekut (kordan promptist)

* Täisvarukoopia (failid + andmebaas) — **peab tegema keegi, kellel on
  hostimisele ligipääs**, mina ei saa seda teha.
* Otsused vajalikud enne 1.1 ja 1.7 rakendamist: `TODO_BOSCH_LEPING`,
  `TODO_INFO_MEIL` (vt RAPORT-FAAS1.md).
* Kõik pärast kleepimist testida 375 px ja 1440 px vaates (vt
  JUHISED-FAAS1.md lõpus olev kontrollnimekiri).
