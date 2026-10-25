/* Kodusahver – uurimisprototüüp.
 * Tellimust ei esitata, makset ei toimu. Isikuandmeid ei koguta.
 */

// Google Apps Scripti veebirakenduse URL (vt README). Tühjana näidatakse vastus kopeeritava koodireana.
const ENDPOINT = '';

const VERSION = '1';
const MAX_TEXT = 140;

/* ---------- Allikas lingi lõpust (#pere, #valga, #fb, #too …) ---------- */
function readSource() {
  const tag = decodeURIComponent(location.hash.replace(/^#/, '')).trim().toLowerCase();
  return /^[a-z0-9_-]{1,24}$/.test(tag) ? tag : 'otse';
}

/* ---------- Olek ---------- */
const state = {
  screen: 0,
  allikas: readSource(),
  taiskasvanud: 1,
  lapsed: 0,
  eakad: 0,
  lemmikloomad: '',
  toitumine: '',
  hoiuruum: '',
  epood_sagedus: '',
  nadala_varu: false,
  paindlik: '',
  tingimus: '',
  tingimus_muu: '',
  ei_pohjus: '',
  kodus_olemas: '',
  ostaks_nagunii: '',
  meeldetuletus: '',
};

/* ---------- Valikud ---------- */
const OPTIONS = {
  lemmikloomad: [
    ['ei', 'Ei ole'],
    ['koer', 'Koer'],
    ['kass', 'Kass'],
    ['koer_kass', 'Koer ja kass'],
  ],
  toitumine: [
    ['tavaline', 'Tavaline, piiranguteta'],
    ['taimetoit', 'Taimetoit (liha ja kalata)'],
    ['vegan', 'Vegan'],
    ['gluteenivaba', 'Gluteenivaba'],
    ['laktoosivaba', 'Laktoosivaba'],
  ],
  hoiuruum: [
    ['vahe', 'Vähe – kapinurk või riiul'],
    ['keskmine', 'Keskmiselt – sahvri- või kapiriiul'],
    ['palju', 'Palju – kelder, panipaik või garaaž'],
  ],
  epood_sagedus: [
    ['iga_nadal', 'Iga nädal või sagedamini'],
    ['paar_kuus', 'Paar korda kuus'],
    ['harvem', 'Harvem kui kord kuus'],
    ['ei_telli', 'Ei telli e-poest'],
  ],
  paindlik: [
    ['jah', 'Jah, sobiks'],
    ['ei', 'Ei sobiks'],
    ['muul_tingimusel', 'Sobiks muul tingimusel'],
  ],
  tingimus: [
    ['soodustus_5', '5% soodustus'],
    ['soodustus_10', '10% soodustus'],
    ['kindel_paev', 'Kindel päev, aga mitte kellaaeg'],
    ['muu', 'Muu'],
  ],
  ei_pohjus: [
    ['kindel_aeg', 'Vajan kindlat tarneaega'],
    ['ei_telli', 'Ma ei telli e-poest'],
    ['ei_hoia', 'Ei taha varu kodus hoida'],
    ['muu', 'Muu põhjus'],
  ],
  kodus_olemas: [
    ['peaaegu_koik', 'Peaaegu kõik'],
    ['umbes_pool', 'Umbes pool'],
    ['vahe', 'Vähe või mitte midagi'],
  ],
  ostaks_nagunii: [
    ['jah', 'Jah, ostan nagunii'],
    ['voib_olla', 'Võib-olla'],
    ['ei_uus', 'Ei, see oleks uus ost'],
  ],
  meeldetuletus: [
    ['jah', 'Jah'],
    ['ei', 'Ei'],
  ],
};

/* ---------- Varunimekiri ----------
 * Kogused inimese kohta päevas. Laps arvestatakse toidu osas 0,7 täiskasvanuna,
 * vett 3 l kõigile. Kaal on ligikaudne, koos pakendiga.
 */
function buildList(s, days) {
  const people = s.taiskasvanud + s.lapsed + s.eakad;
  const units = s.taiskasvanud + s.eakad + 0.7 * s.lapsed;
  const diet = s.toitumine;
  const gf = diet === 'gluteenivaba';
  const veg = diet === 'taimetoit' || diet === 'vegan';
  const dog = s.lemmikloomad === 'koer' || s.lemmikloomad === 'koer_kass';
  const cat = s.lemmikloomad === 'kass' || s.lemmikloomad === 'koer_kass';
  const items = [];

  // Vesi
  const petWater = (dog ? 1 : 0) + (cat ? 0.3 : 0);
  const waterL = Math.ceil(people * 3 * days + petWater * days);
  items.push({
    name: 'Joogivesi',
    qty: `${waterL} l`,
    kg: waterL,
    note: s.hoiuruum === 'vahe'
      ? `3 l inimese kohta päevas. Ruumi säästavad 5–6 l kanistrid (≈ ${Math.ceil(waterL / 6)} tk).`
      : '3 l inimese kohta päevas' + (petWater ? ', lisaks lemmikloomale.' : '.'),
  });

  // Pakendipõhised read
  const pack = (name, perDayKg, packKg, unitLabel, note) => {
    const n = Math.max(1, Math.ceil((units * perDayKg * days) / packKg - 1e-9));
    items.push({ name, qty: `${n} ${unitLabel}`, kg: n * packKg, note });
  };

  pack(
    veg ? 'Kaunviljakonserv (oad, kikerherned, läätsed)' : 'Liha- või kalakonserv',
    0.4, 0.4, 'purki', 'Umbes üks purk inimese kohta päevas. Söödav ka soojendamata.'
  );
  if (s.eakad > 0) {
    const n = s.eakad * days;
    items.push({ name: 'Valmissupp või püree', qty: `${n} purki`, kg: n * 0.4,
      note: 'Kergesti söödav ja seeditav.' });
  }
  pack(gf ? 'Riisi- või maisigaletid' : 'Näkileib või kuivikud',
    0.15, 0.25, 'pakki', 'Pakk umbes 250 g.');
  pack(gf ? 'Gluteenivabad helbed või kiirpuder' : 'Kaerahelbed või kiirpuder',
    0.08, 0.5, 'pakki', 'Pakk umbes 500 g.');
  pack(gf ? 'Riis või gluteenivaba pasta' : 'Pasta, riis või tatar',
    0.1, 0.5, 'pakki', 'Eelistage kiiresti valmivat.');

  // Jook: täiskasvanu 0,25 l, laps 0,5 l päevas
  const milkL = Math.max(1, Math.ceil((s.taiskasvanud + s.eakad) * 0.25 * days + s.lapsed * 0.5 * days));
  items.push({
    name: diet === 'vegan' ? 'Taimne jook (toatemperatuuril säiliv)'
      : diet === 'laktoosivaba' ? 'Laktoosivaba säilipiim' : 'Säilipiim',
    qty: `${milkL} l`, kg: milkL * 1.03, note: 'Avamata pakend säilib toatemperatuuril.',
  });

  pack('Pähklid või kuivatatud puuvili', 0.05, 0.2, 'pakki', 'Pakk umbes 200 g.');
  pack('Šokolaad või müslibatoon', 0.05, 0.05, 'tk', '');

  if (s.lapsed > 0) {
    const n = s.lapsed * days;
    items.push({ name: 'Puuviljapüree või mahl lastele', qty: `${n} tk`, kg: n * 0.2, note: '' });
  }

  // Lemmikloomad: kuivtoit, ümardatud 0,5 kg pakkideni
  if (dog) {
    const kg = Math.ceil((0.3 * days) / 0.5) * 0.5;
    items.push({ name: 'Koeratoit (kuiv)', qty: `${fmtKg(kg)} kg`, kg, note: 'Keskmise koera järgi, ~300 g päevas.' });
  }
  if (cat) {
    const kg = Math.ceil((0.07 * days) / 0.5) * 0.5;
    items.push({ name: 'Kassitoit (kuiv)', qty: `${fmtKg(kg)} kg`, kg, note: '~70 g päevas.' });
  }

  const totalKg = items.reduce((a, i) => a + i.kg, 0);
  return { items, totalKg, waterL, people, days };
}

function fmtKg(x) {
  return (Math.round(x * 10) / 10).toLocaleString('et-EE', { maximumFractionDigits: 1 });
}

/* ---------- Abifunktsioonid ---------- */
const $app = document.getElementById('app');
const $bar = document.getElementById('progress-bar');

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function optionButtons(key) {
  return `<div class="options" role="group">${OPTIONS[key].map(([v, label]) =>
    `<button type="button" class="opt" data-key="${key}" data-val="${v}" aria-pressed="${state[key] === v}">${esc(label)}</button>`
  ).join('')}</div>`;
}

function actions(nextLabel, nextEnabled, { back = true } = {}) {
  return `<div class="actions">
    ${back ? '<button type="button" class="btn secondary" data-act="back">Tagasi</button>' : ''}
    <button type="button" class="btn" data-act="next" ${nextEnabled ? '' : 'disabled'}>${esc(nextLabel)}</button>
  </div>`;
}

function randomId() {
  const b = new Uint8Array(4);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('').toUpperCase();
}

/* ---------- Ekraanid ---------- */
const SCREENS = [
  { // 0 sissejuhatus
    render: () => `<section class="card">
      <h1>Kui suur toiduvaru teie kodus 72 tunniks piisaks?</h1>
      <p class="lead">Vastake viiele lühikesele küsimusele ja saate oma leibkonnale sobiva nimekirja koos koguse ja kaaluga. Lõpus küsime paar küsimust selle kohta, kuidas varu kättesaamine teile sobiks.</p>
      <p class="small">Võtab umbes 2 minutit. Vastused on anonüümsed. Tellimust ei esitata ja makset ei toimu.</p>
      ${actions('Alusta', true, { back: false })}
    </section>`,
    valid: () => true,
  },
  { // 1 leibkond
    render: () => {
      const row = (key, label, hint, min) => `<div class="counter">
        <div><span class="lbl" id="l-${key}">${label}</span><span class="hint">${hint}</span></div>
        <div class="stepper" role="group" aria-labelledby="l-${key}">
          <button type="button" data-step="${key}" data-d="-1" aria-label="Vähem" ${state[key] <= min ? 'disabled' : ''}>−</button>
          <output aria-live="polite">${state[key]}</output>
          <button type="button" data-step="${key}" data-d="1" aria-label="Rohkem" ${state[key] >= 12 ? 'disabled' : ''}>+</button>
        </div>
      </div>`;
      return `<section class="card">
        <p class="step">Küsimus 1/5</p>
        <h2>Kes teie leibkonda kuuluvad?</h2>
        ${row('taiskasvanud', 'Täiskasvanud', '18–69 aastat', 0)}
        ${row('lapsed', 'Lapsed', 'alla 18 aasta', 0)}
        ${row('eakad', 'Eakad', '70 aastat ja vanemad', 0)}
        ${actions('Edasi', SCREENS[1].valid())}
      </section>`;
    },
    valid: () => state.taiskasvanud + state.lapsed + state.eakad >= 1,
  },
  { render: () => question(2, 'Kas teil on lemmikloomi?', '', 'lemmikloomad'), valid: () => !!state.lemmikloomad },
  { render: () => question(3, 'Milline on teie leibkonna toitumine?', 'Valige see, mis kõige rohkem nimekirja mõjutab.', 'toitumine'), valid: () => !!state.toitumine },
  { render: () => question(4, 'Kui palju on teil kodus ruumi toiduvaru hoidmiseks?', '', 'hoiuruum'), valid: () => !!state.hoiuruum },
  { render: () => question(5, 'Kui tihti tellite toitu e-poest?', '', 'epood_sagedus'), valid: () => !!state.epood_sagedus },
  { // 6 tulemus
    render: () => {
      const r = buildList(state, state.nadala_varu ? 7 : 3);
      const period = state.nadala_varu ? 'nädalaks' : '72 tunniks';
      const tips = ['Kasutage varu tavaliste toidukordade sees ja ostke kasutatu asemele uus – nii ei lähe midagi aeguma.',
        'Hoidke vett ja toitu jahedas ning pimedas kohas.'];
      if (state.eakad > 0) tips.push('Ravimite varu kontrollige eraldi – see ei kuulu toidunimekirja.');
      return `<section class="card">
        <h2>Teie leibkonna varu ${period}</h2>
        <div class="summary">
          <div class="stat"><b>${r.people}</b><span>inimest</span></div>
          <div class="stat"><b>${fmtKg(r.totalKg)} kg</b><span>kogukaal umbes</span></div>
          <div class="stat"><b>${r.waterL} l</b><span>joogivett</span></div>
        </div>
        <label class="toggle"><span>Arvuta nädala varu</span>
          <input type="checkbox" id="week" ${state.nadala_varu ? 'checked' : ''}></label>
        <ul class="list">${r.items.map((i) => `<li>
          <span class="name">${esc(i.name)}</span><span class="qty">${esc(i.qty)}</span>
          ${i.note ? `<span class="note">${esc(i.note)}</span>` : ''}</li>`).join('')}</ul>
        <ul class="tips">${tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
        ${actions('Edasi', true)}
      </section>`;
    },
    valid: () => true,
  },
  { // 7 võtmeküsimus
    render: () => {
      const kg = fmtKg(buildList(state, state.nadala_varu ? 7 : 3).totalKg);
      return `<section class="card">
        <h2>Kas sobiks, kui see tuuakse millal iganes sel nädalal, kui tarne on tasuta?</h2>
        <p class="lead">Varu (umbes ${kg} kg) tuuakse koju selle nädala jooksul. Täpne päev ja kellaaeg selguvad tarnija graafiku järgi.</p>
        ${optionButtons('paindlik')}
        ${actions('Edasi', !!state.paindlik)}
      </section>`;
    },
    valid: () => !!state.paindlik,
  },
  { // 8 järelküsimus (ainult „ei“ või „muul tingimusel“)
    skip: () => state.paindlik === 'jah',
    render: () => {
      if (state.paindlik === 'muul_tingimusel') {
        const showText = state.tingimus === 'muu';
        return `<section class="card">
          <h2>Mis tingimusel see sobiks?</h2>
          ${optionButtons('tingimus')}
          ${showText ? `<label for="muu" class="small" style="display:block;margin-top:14px">Kirjeldage lühidalt (valikuline, ilma isikuandmeteta)</label>
            <textarea id="muu" maxlength="${MAX_TEXT}" placeholder="Nt tooge koos tavalise tellimusega">${esc(state.tingimus_muu)}</textarea>
            <div class="count"><span id="cnt">${state.tingimus_muu.length}</span>/${MAX_TEXT}</div>` : ''}
          ${actions('Edasi', !!state.tingimus)}
        </section>`;
      }
      return `<section class="card">
        <h2>Mis on peamine põhjus?</h2>
        ${optionButtons('ei_pohjus')}
        ${actions('Edasi', !!state.ei_pohjus)}
      </section>`;
    },
    valid: () => (state.paindlik === 'muul_tingimusel' ? !!state.tingimus : !!state.ei_pohjus),
  },
  { // 9 lisanduvus
    render: () => `<section class="card">
      <fieldset>
        <legend>Kui palju sellest nimekirjast on teil praegu kodus olemas?</legend>
        ${optionButtons('kodus_olemas')}
      </fieldset>
      <fieldset>
        <legend>Kas ostaksite selle varu ka siis, kui seda ei pakutaks?</legend>
        ${optionButtons('ostaks_nagunii')}
      </fieldset>
      ${actions('Edasi', SCREENS[9].valid())}
    </section>`,
    valid: () => !!state.kodus_olemas && !!state.ostaks_nagunii,
  },
  { // 10 meeldetuletus
    render: () => `<section class="card">
      <h2>Kas soovite, et aeguvast kaubast tuletataks meelde ja see vahetataks?</h2>
      <p class="lead">See on küsimus teenuse kohta. Praegu meeldetuletusi ei saadeta.</p>
      ${optionButtons('meeldetuletus')}
      ${actions('Saada vastus', !!state.meeldetuletus)}
    </section>`,
    valid: () => !!state.meeldetuletus,
    submit: true,
  },
  { // 11 aitäh
    render: () => `<section class="card" id="thanks">
      <h1>Aitäh!</h1>
      <p class="lead" id="send-status">Saadan vastust…</p>
      <div id="fallback"></div>
      <p class="small">Teie vastuse kood on <b>${esc(lastResponse ? lastResponse.id : '')}</b>. Kui soovite oma vastuse kustutada, kirjutage see kood aadressile
        <a href="mailto:acceleratedigitaltwin@gmail.com">acceleratedigitaltwin@gmail.com</a>.</p>
      <p class="small">Nimekiri jääb teile: tehke sellest vajadusel kuvatõmmis enne lehelt lahkumist.</p>
      <div class="actions"><button type="button" class="btn secondary" data-act="list">Vaata nimekirja uuesti</button></div>
    </section>`,
    valid: () => true,
  },
];

function question(n, title, lead, key) {
  return `<section class="card">
    <p class="step">Küsimus ${n}/5</p>
    <h2>${esc(title)}</h2>
    ${lead ? `<p class="lead">${esc(lead)}</p>` : ''}
    ${optionButtons(key)}
    ${actions('Edasi', SCREENS[n].valid())}
  </section>`;
}

/* ---------- Vastus ---------- */
let lastResponse = null;

// Veergude järjekord peab ühtima apps-script/Code.gs COLUMNS-iga.
function buildResponse() {
  const muul = state.paindlik === 'muul_tingimusel';
  const ei = state.paindlik === 'ei';
  return {
    id: randomId(),
    versioon: VERSION,
    allikas: state.allikas,
    taiskasvanud: state.taiskasvanud,
    lapsed: state.lapsed,
    eakad: state.eakad,
    inimesi: state.taiskasvanud + state.lapsed + state.eakad,
    lemmikloomad: state.lemmikloomad,
    toitumine: state.toitumine,
    hoiuruum: state.hoiuruum,
    epood_sagedus: state.epood_sagedus,
    nadala_varu: state.nadala_varu,
    kaal_72h_kg: Math.round(buildList(state, 3).totalKg * 10) / 10,
    kaal_nadal_kg: Math.round(buildList(state, 7).totalKg * 10) / 10,
    paindlik: state.paindlik,
    tingimus: muul ? state.tingimus : '',
    tingimus_muu: muul && state.tingimus === 'muu' ? state.tingimus_muu.trim().slice(0, MAX_TEXT) : '',
    ei_pohjus: ei ? state.ei_pohjus : '',
    kodus_olemas: state.kodus_olemas,
    ostaks_nagunii: state.ostaks_nagunii,
    meeldetuletus: state.meeldetuletus,
  };
}

let sendOutcome = '';

function paintStatus() {
  const status = document.getElementById('send-status');
  if (!status) return; // kasutaja vaatab parasjagu nimekirja
  if (sendOutcome === 'ok') status.textContent = 'Teie vastus on salvestatud.';
  if (sendOutcome === 'fallback') {
    status.textContent = ENDPOINT
      ? 'Vastuse saatmine ei õnnestunud. Palun kopeerige allolev rida ja saatke see lingi jagajale.'
      : 'Vastuste kogumine pole veel sisse lülitatud. Palun kopeerige allolev rida ja saatke see lingi jagajale.';
    document.getElementById('fallback').innerHTML =
      `<pre class="code" id="code">${esc(JSON.stringify(lastResponse))}</pre>
       <div class="actions"><button type="button" class="btn" data-act="copy">Kopeeri</button></div>`;
  }
}

async function send(resp) {
  const fallback = () => { sendOutcome = 'fallback'; paintStatus(); };
  if (!ENDPOINT) return fallback();
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    await fetch(ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(resp),
      signal: ctrl.signal,
      referrerPolicy: 'no-referrer',
      credentials: 'omit',
    });
    clearTimeout(t);
    sendOutcome = 'ok';
    paintStatus();
  } catch (e) {
    fallback();
  }
}

async function copyCode(btn) {
  const text = document.getElementById('code').textContent;
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    const r = document.createRange();
    r.selectNodeContents(document.getElementById('code'));
    const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
    document.execCommand('copy');
  }
  btn.textContent = 'Kopeeritud';
}

/* ---------- Navigeerimine ---------- */
function go(dir) {
  let i = state.screen + dir;
  while (SCREENS[i] && SCREENS[i].skip && SCREENS[i].skip()) i += dir;
  if (!SCREENS[i]) return;
  state.screen = i;
  render(true);
}

function render(moved) {
  const s = SCREENS[state.screen];
  $app.innerHTML = s.render();
  $bar.style.width = `${Math.round((state.screen / (SCREENS.length - 1)) * 100)}%`;
  if (moved) {
    window.scrollTo(0, 0);
    const h = $app.querySelector('h1, h2');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }
}

$app.addEventListener('click', (ev) => {
  const el = ev.target.closest('button');
  if (!el) return;
  if (el.dataset.key) {
    const { key, val } = el.dataset;
    state[key] = val;
    render(false);
    if (key === 'tingimus' && val === 'muu') document.getElementById('muu')?.focus();
    return;
  }
  if (el.dataset.step) {
    const k = el.dataset.step;
    state[k] = Math.max(0, Math.min(12, state[k] + Number(el.dataset.d)));
    render(false);
    $app.querySelector(`[data-step="${k}"][data-d="${el.dataset.d}"]`)?.focus();
    return;
  }
  const act = el.dataset.act;
  if (act === 'back') go(-1);
  if (act === 'next' && SCREENS[state.screen].valid()) {
    if (SCREENS[state.screen].submit) {
      lastResponse = buildResponse();
      go(1);
      send(lastResponse);
    } else {
      go(1);
    }
  }
  if (act === 'copy') copyCode(el);
  if (act === 'list') { state.screen = 6; render(true); hideAfterSubmit(); }
});

// Pärast saatmist nimekirja vaatamisel ei saa vastust uuesti saata.
function hideAfterSubmit() {
  const a = $app.querySelector('.actions');
  if (a) a.innerHTML = '<button type="button" class="btn secondary" data-act="thanks">Tagasi</button>';
}
$app.addEventListener('click', (ev) => {
  if (ev.target.closest('[data-act="thanks"]')) {
    state.screen = 11;
    $app.innerHTML = SCREENS[11].render();
    paintStatus();
  }
});

$app.addEventListener('change', (ev) => {
  if (ev.target.id === 'week') {
    state.nadala_varu = ev.target.checked;
    render(false);
    if (lastResponse) hideAfterSubmit();
    $app.querySelector('#week')?.focus();
  }
});

$app.addEventListener('input', (ev) => {
  if (ev.target.id === 'muu') {
    state.tingimus_muu = ev.target.value.slice(0, MAX_TEXT);
    document.getElementById('cnt').textContent = state.tingimus_muu.length;
  }
});

render(false);
