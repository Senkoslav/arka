// Тарифы и услуги (BYN). Цены демонстрационные — замените на реальные.

export const TARIFFS = [
  { id: 'hour', title: 'Почасовой', price: 90, unit: 'BYN / час', note: 'от 2 часов', perks: ['Встречи, лекции, кастинги', 'Расстановка под формат', 'Wi-Fi и кофе-зона'] },
  { id: 'half', title: 'Полдня', price: 390, unit: 'BYN', note: '5 часов · 78 BYN за час', perks: ['Мастер-класс с подготовкой', 'Проектор и экран включены', 'Час на сборку без доплаты'], featured: true },
  { id: 'day', title: 'Весь день', price: 690, unit: 'BYN', note: '10 часов · 69 BYN за час', perks: ['Конференции и тренинги', 'Проектор и звук включены', 'Удобно для съёмок при дневном свете'] },
] as const;

export const SERVICES = [
  { title: 'Проектор и экран 4 м', price: '30 BYN', note: 'за мероприятие, в тарифах «Полдня» и «Весь день» бесплатно' },
  { title: 'Звук: колонки и 2 радиомикрофона', price: '40 BYN', note: 'за мероприятие' },
  { title: 'Флипчарт и маркеры', price: '10 BYN', note: 'бумага и маркеры включены' },
  { title: 'Кофе-брейк', price: 'от 12 BYN', note: 'за гостя: кофе, чай, выпечка' },
  { title: 'Фото- и видеосъёмка', price: 'от 150 BYN', note: 'фотограф-партнёр, съёмка у окон на закате' },
  { title: 'Регулярные занятия', price: '−15%', note: 'при бронировании от 8 часов в месяц' },
] as const;

export type AddonId = 'projector' | 'sound' | 'flipchart' | 'coffee';
export const ADDONS: Array<{ id: AddonId; label: string; price: number; perGuest?: boolean }> = [
  { id: 'projector', label: 'Проектор и экран', price: 30 },
  { id: 'sound', label: 'Звук и микрофоны', price: 40 },
  { id: 'flipchart', label: 'Флипчарт', price: 10 },
  { id: 'coffee', label: 'Кофе-брейк', price: 12, perGuest: true },
];

/** Самый выгодный тариф для указанного числа часов */
export function basePrice(h: number) {
  const opts = [{ p: h * 90, n: 'почасовой тариф' }];
  if (h >= 5) opts.push({ p: 390 + (h - 5) * 78, n: h === 5 ? 'тариф «Полдня»' : 'тариф «Полдня» + часы' });
  if (h >= 10) opts.push({ p: 690 + (h - 10) * 69, n: h === 10 ? 'тариф «Весь день»' : 'тариф «Весь день» + часы' });
  return opts.reduce((a, b) => (b.p < a.p ? b : a));
}

export function estimate(hours: number, guests: number, addons: AddonId[]) {
  const b = basePrice(hours);
  let total = b.p;
  const notes = [b.n];
  for (const id of addons) {
    const a = ADDONS.find(x => x.id === id)!;
    if (a.perGuest) { total += a.price * guests; notes.push('кофе-брейк'); }
    else if (id === 'projector' && hours >= 5) notes.push('проектор включён');
    else if (id === 'sound' && hours >= 10) notes.push('звук включён');
    else total += a.price;
  }
  return { total, note: notes.join(' · ') };
}
