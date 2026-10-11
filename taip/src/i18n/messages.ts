import type { Locale } from "@config/taip.config";

const et = {
  appName: "Taip!",
  tagline: "Abi ja valmisolek ühest kohast",
  needHelp: "Vajan abi",
  myStock: "Minu varud",
  shelters: "Varjumine",
  wallet: "Rahakott",
  upgrade: "Varjendi upgrade",
  crisisBanner: "Sinu piirkonnas kehtib kriisiolukord",
  crisisBalance: "Kriisisaldo",
  call112: "Helista 112",
  emergencyTitle: "Helista kohe 112",
  emergencyText: "Sinu kirjelduse järgi võib olla oht elule või tervisele. Helista hädaabinumbrile 112. Kui saad, jää telefoni juurde ja järgi päästja juhiseid.",
  describe: "Kirjelda oma olukorda oma sõnadega",
  describePlaceholder: "Nt: Meil on 2 last, kodus pole elektrit ega sooja ja toit saab homme otsa…",
  send: "Saada",
  thinking: "Mõtlen…",
  summaryTitle: "Kas sain õigesti aru?",
  confirm: "Jah, see on õige",
  edit: "Paranda",
  healthConsentLabel: "Nõustun, et minu terviseandmeid (nt ravimivajadus, liikumispuue) töödeldakse abi korraldamiseks. Partner näeb ainult broneeringuks vajalikku miinimumi.",
  healthNotesLabel: "Terviseinfo (vabatahtlik, krüpteeritakse)",
  matchesTitle: "Sobivad abivõimalused",
  choose: "Vali see",
  free: "Tasuta",
  paidBy: "Maksab",
  done: "Valmis! Sinu päring on edastatud.",
  urgency: { critical: "Kriitiline", urgent: "Kiire (24 h)", normal: "Tavaline" },
  categories: {
    food: "Toit", shelter: "Varjumine", accommodation: "Majutus", medical: "Ravimid / meditsiin",
    mental_health: "Vaimne tugi", heating: "Küte / soojus", transport: "Transport", other: "Muu",
  },
  specialNeeds: {
    children: "Lapsed", elderly: "Eakad", mobility_impairment: "Liikumispuue",
    medication_dependency: "Vajab ravimeid", pregnancy: "Rasedus",
  },
  sources: { crisis_allowance: "kriisisaldo", personal_reserve: "isiklik reserv", direct: "otsemakse" },
  people: "inimest",
  q: {
    category: "Mida sa praegu kõige rohkem vajad? (nt toit, peavari, soojus, ravimid, keegi kellega rääkida)",
    urgency: "Kas see tuleb lahendada järgmise 24 tunni jooksul?",
    people: "Mitu inimest vajab abi ja kas nende hulgas on lapsi, eakaid või kedagi, kes vajab ravimeid?",
  },
  stepOf: (n: number, m: number) => `Samm ${n}/${m}`,
  startOver: "Alusta uuesti",
};

type Messages = typeof et;

const en: Messages = {
  ...et,
  tagline: "Help and preparedness in one place",
  needHelp: "I need help", myStock: "My supplies", shelters: "Shelter", wallet: "Wallet", upgrade: "Shelter upgrade",
  crisisBanner: "A crisis is in effect in your area", crisisBalance: "Crisis balance",
  call112: "Call 112", emergencyTitle: "Call 112 now",
  emergencyText: "From what you described, there may be a risk to life or health. Call the emergency number 112. If you can, stay on the line and follow the dispatcher's instructions.",
  describe: "Describe your situation in your own words",
  describePlaceholder: "E.g. We have 2 kids, no power or heating at home and food runs out tomorrow…",
  send: "Send", thinking: "Thinking…", summaryTitle: "Did I understand correctly?", confirm: "Yes, that's right", edit: "Change",
  healthConsentLabel: "I agree that my health data (e.g. medication needs, mobility impairment) is processed to arrange help. The partner only sees the minimum needed for the booking.",
  healthNotesLabel: "Health info (optional, encrypted)",
  matchesTitle: "Available help", choose: "Choose", free: "Free", paidBy: "Paid by", done: "Done! Your request has been forwarded.",
  urgency: { critical: "Critical", urgent: "Urgent (24 h)", normal: "Normal" },
  categories: { food: "Food", shelter: "Shelter", accommodation: "Accommodation", medical: "Medicine", mental_health: "Emotional support", heating: "Heating", transport: "Transport", other: "Other" },
  specialNeeds: { children: "Children", elderly: "Elderly", mobility_impairment: "Mobility impairment", medication_dependency: "Needs medication", pregnancy: "Pregnancy" },
  sources: { crisis_allowance: "crisis balance", personal_reserve: "personal reserve", direct: "direct payment" },
  people: "people",
  q: {
    category: "What do you need most right now? (e.g. food, a place to stay, heating, medicine, someone to talk to)",
    urgency: "Does this need to be solved within the next 24 hours?",
    people: "How many people need help, and are there children, elderly people or anyone who needs medication?",
  },
  stepOf: (n, m) => `Step ${n}/${m}`, startOver: "Start over",
};

const ru: Messages = {
  ...et,
  tagline: "Помощь и готовность в одном месте",
  needHelp: "Мне нужна помощь", myStock: "Мои запасы", shelters: "Укрытие", wallet: "Кошелёк", upgrade: "Улучшение укрытия",
  crisisBanner: "В вашем регионе объявлена кризисная ситуация", crisisBalance: "Кризисный баланс",
  call112: "Позвонить 112", emergencyTitle: "Срочно позвоните 112",
  emergencyText: "По вашему описанию может существовать угроза жизни или здоровью. Позвоните по номеру экстренной помощи 112. Если можете, оставайтесь на линии и следуйте указаниям.",
  describe: "Опишите свою ситуацию своими словами",
  describePlaceholder: "Например: у нас 2 детей, дома нет электричества и отопления, еда закончится завтра…",
  send: "Отправить", thinking: "Думаю…", summaryTitle: "Я правильно понял?", confirm: "Да, всё верно", edit: "Исправить",
  healthConsentLabel: "Я согласен(на) на обработку моих данных о здоровье (например, потребность в лекарствах, ограниченная подвижность) для организации помощи. Партнёр видит только минимум, необходимый для бронирования.",
  healthNotesLabel: "Информация о здоровье (по желанию, шифруется)",
  matchesTitle: "Подходящая помощь", choose: "Выбрать", free: "Бесплатно", paidBy: "Оплата", done: "Готово! Ваш запрос передан.",
  urgency: { critical: "Критично", urgent: "Срочно (24 ч)", normal: "Обычно" },
  categories: { food: "Еда", shelter: "Укрытие", accommodation: "Жильё", medical: "Лекарства", mental_health: "Психологическая поддержка", heating: "Отопление", transport: "Транспорт", other: "Другое" },
  specialNeeds: { children: "Дети", elderly: "Пожилые", mobility_impairment: "Ограниченная подвижность", medication_dependency: "Нужны лекарства", pregnancy: "Беременность" },
  sources: { crisis_allowance: "кризисный баланс", personal_reserve: "личный резерв", direct: "прямой платёж" },
  people: "чел.",
  q: {
    category: "Что вам сейчас нужнее всего? (например, еда, крыша над головой, тепло, лекарства, поговорить с кем-то)",
    urgency: "Нужно ли решить это в ближайшие 24 часа?",
    people: "Сколько человек нуждается в помощи? Есть ли среди них дети, пожилые или кто-то, кому нужны лекарства?",
  },
  stepOf: (n, m) => `Шаг ${n}/${m}`, startOver: "Начать заново",
};

const uk: Messages = {
  ...et,
  tagline: "Допомога і готовність в одному місці",
  needHelp: "Мені потрібна допомога", myStock: "Мої запаси", shelters: "Укриття", wallet: "Гаманець", upgrade: "Покращення укриття",
  crisisBanner: "У вашому регіоні діє кризова ситуація", crisisBalance: "Кризовий баланс",
  call112: "Зателефонувати 112", emergencyTitle: "Негайно телефонуйте 112",
  emergencyText: "За вашим описом може існувати загроза життю чи здоров'ю. Зателефонуйте на номер екстреної допомоги 112. Якщо можете, залишайтеся на лінії та виконуйте вказівки.",
  describe: "Опишіть свою ситуацію своїми словами",
  describePlaceholder: "Наприклад: у нас 2 дітей, вдома немає світла й опалення, їжа закінчиться завтра…",
  send: "Надіслати", thinking: "Думаю…", summaryTitle: "Чи правильно я зрозумів?", confirm: "Так, усе правильно", edit: "Виправити",
  healthConsentLabel: "Я погоджуюся на обробку моїх даних про здоров'я (наприклад, потреба в ліках, обмежена рухливість) для організації допомоги. Партнер бачить лише мінімум, потрібний для бронювання.",
  healthNotesLabel: "Інформація про здоров'я (за бажанням, шифрується)",
  matchesTitle: "Доступна допомога", choose: "Обрати", free: "Безкоштовно", paidBy: "Оплата", done: "Готово! Ваш запит передано.",
  urgency: { critical: "Критично", urgent: "Терміново (24 год)", normal: "Звичайно" },
  categories: { food: "Їжа", shelter: "Укриття", accommodation: "Житло", medical: "Ліки", mental_health: "Психологічна підтримка", heating: "Опалення", transport: "Транспорт", other: "Інше" },
  specialNeeds: { children: "Діти", elderly: "Літні люди", mobility_impairment: "Обмежена рухливість", medication_dependency: "Потрібні ліки", pregnancy: "Вагітність" },
  sources: { crisis_allowance: "кризовий баланс", personal_reserve: "особистий резерв", direct: "прямий платіж" },
  people: "осіб",
  q: {
    category: "Що вам зараз найбільше потрібно? (наприклад, їжа, дах над головою, тепло, ліки, поговорити з кимось)",
    urgency: "Чи потрібно це вирішити протягом найближчих 24 годин?",
    people: "Скільки людей потребує допомоги? Чи є серед них діти, літні люди або хтось, кому потрібні ліки?",
  },
  stepOf: (n, m) => `Крок ${n}/${m}`, startOver: "Почати знову",
};

export const messages: Record<Locale, Messages> = { et, en, ru, uk };
export type { Messages };

export function t(locale: string | undefined): Messages {
  return messages[(locale as Locale) ?? "et"] ?? et;
}

export function formatEur(cents: number, locale: string = "et") {
  const loc = { et: "et-EE", en: "en-IE", ru: "ru-RU", uk: "uk-UA" }[locale] ?? "et-EE";
  return new Intl.NumberFormat(loc, { style: "currency", currency: "EUR" }).format(cents / 100);
}
