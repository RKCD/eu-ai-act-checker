/**
 * Kodusahver – vastuste vastuvõtt Google Sheetsi.
 * Avalda: Deploy → New deployment → Web app, Execute as: Me, Who has access: Anyone.
 *
 * Apps Script ei näe saatja IP-aadressi ega Google'i kontot (Who has access: Anyone).
 * Salvestatakse ainult allolevad väljad; tundmatud väljad visatakse ära.
 */

const SHEET_NAME = 'vastused';
const MAX_TEXT = 140;

// Fikseeritud veergude järjekord. Peab ühtima app.js buildResponse()-ga.
const COLUMNS = [
  'ajatempel',
  'id',
  'versioon',
  'allikas',
  'taiskasvanud',
  'lapsed',
  'eakad',
  'inimesi',
  'lemmikloomad',
  'toitumine',
  'hoiuruum',
  'epood_sagedus',
  'nadala_varu',
  'kaal_72h_kg',
  'kaal_nadal_kg',
  'paindlik',
  'tingimus',
  'tingimus_muu',
  'ei_pohjus',
  'kodus_olemas',
  'ostaks_nagunii',
  'meeldetuletus',
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const sheet = getSheet_();
    const row = COLUMNS.map(function (col) {
      if (col === 'ajatempel') return new Date();
      return clean_(col, data[col]);
    });
    lock.waitLock(10000);
    sheet.appendRow(row);
    return ContentService.createTextOutput('ok');
  } catch (err) {
    return ContentService.createTextOutput('viga');
  } finally {
    lock.releaseLock();
  }
}

// Kontrollimiseks brauseris: avab URL-i ja näitab, et skript töötab.
function doGet() {
  return ContentService.createTextOutput('Kodusahver: vastuvõtt töötab.');
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMNS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function clean_(col, v) {
  if (v === undefined || v === null) return '';
  if (typeof v === 'boolean' || typeof v === 'number') return v;
  let s = String(v).replace(/[\r\n\t]+/g, ' ').trim();
  if (col === 'tingimus_muu') s = s.slice(0, MAX_TEXT);
  else s = s.slice(0, 40);
  // Väldi valemite süstimist tabelisse (=, +, -, @ alguses).
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}
