'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import Image from 'next/image';
import { CAPACITY, type LayoutName } from '@/lib/layouts';
import { ADDONS, estimate, type AddonId } from '@/lib/pricing';
import { useScene } from './SceneProvider';

const FORMATS: Array<[LayoutName, string]> = [['lecture', 'Мастер-класс'], ['longtable', 'Общий стол'], ['islands', 'Отдельные столы'], ['empty', 'Пустой зал']];
const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export default function Booking() {
  const { layout } = useScene();
  const [date, setDate] = useState('');
  const [minDate, setMinDate] = useState('');
  const [format, setFormat] = useState<LayoutName>('lecture');
  const [hours, setHours] = useState(5);
  const [guests, setGuests] = useState(25);
  const [addons, setAddons] = useState<AddonId[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [invalid, setInvalid] = useState<{ name?: boolean; phone?: boolean }>({});
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  // Дата по умолчанию — через неделю (считаем на клиенте, чтобы не было расхождений с SSR)
  useEffect(() => {
    const now = new Date();
    setMinDate(isoDate(now)); setDate(isoDate(new Date(now.getTime() + 7 * 864e5)));
  }, []);
  // Формат, выбранный в 3D-зале, подставляется в форму
  useEffect(() => { if (layout !== 'empty') setFormat(layout); }, [layout]);

  const g = Math.max(1, Math.min(CAPACITY.lecture, guests || 1));
  const { total, note } = useMemo(() => estimate(hours, g, addons), [hours, g, addons]);
  const totalText = `${total.toLocaleString('ru-RU')} BYN`;

  const toggle = (id: AddonId) => setAddons(a => (a.includes(id) ? a.filter(x => x !== id) : [...a, id]));

  function submit(e: FormEvent) {
    e.preventDefault();
    const bad = { name: !name.trim(), phone: phone.replace(/\D/g, '').length < 9 };
    setInvalid(bad);
    if (bad.name || bad.phone) {
      const what = bad.name && bad.phone ? 'имя и телефон' : bad.name ? 'имя' : 'телефон полностью, например +375 29 123-45-67';
      setStatus({ ok: false, text: `Укажите ${what} — администратор перезвонит, чтобы подтвердить дату.` });
      (bad.name ? nameRef : phoneRef).current?.focus();
      return;
    }
    // TODO: отправка заявки (route handler / Telegram-бот / CRM)
    const when = date ? new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : 'выбранную дату';
    setStatus({ ok: true, text: `Спасибо, ${name.trim()}! Заявка на ${when} собрана: ${totalText}. Это демо-сайт, поэтому заявка никуда не отправлена.` });
  }

  return (
    <section className="block booking" id="book">
      <div className="wrap book-grid">
        <div className="contacts">
          <div className="eyebrow">Контакты и бронь</div>
          <h2>Мстиславца, 10. Напротив Библиотеки</h2>
          <p className="muted">Ищите арку между двумя высокими домами — через неё видно Национальную библиотеку. Вход с променада, парковка у дома.</p>
          <dl className="contact-list">
            <div><dt>Адрес</dt><dd>Минск, ул. Мстиславца, 10</dd></div>
            <div><dt>Телефон</dt><dd><a href="tel:+375291230123">+375 29 123-01-23</a></dd></div>
            <div><dt>Telegram</dt><dd><a href="https://t.me/arka123" target="_blank" rel="noopener noreferrer">@arka123</a></dd></div>
            <div><dt>Часы</dt><dd>ежедневно, 8:00–23:00</dd></div>
          </dl>
          <div className="place">
            <figure><Image src="/img/arch-street.webp" alt="Дома, соединённые аркой, вид с улицы" width={1400} height={788} sizes="(max-width: 900px) 50vw, 25vw" /><figcaption>Арка между домами</figcaption></figure>
            <figure><Image src="/img/library-street.webp" alt="Национальная библиотека с улицы возле дома" width={1400} height={788} sizes="(max-width: 900px) 50vw, 25vw" /><figcaption>Библиотека через дорогу</figcaption></figure>
          </div>
        </div>

        <form className="book" onSubmit={submit} noValidate>
          <h3>Рассчитать и забронировать</h3>
          <div className="row2">
            <div className="field"><label htmlFor="f-date">Дата</label><input id="f-date" type="date" min={minDate} value={date} onChange={e => setDate(e.target.value)} required /></div>
            <div className="field"><label htmlFor="f-format">Формат</label>
              <select id="f-format" value={format} onChange={e => setFormat(e.target.value as LayoutName)}>
                {FORMATS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
              </select>
            </div>
          </div>
          <div className="row2">
            <div className="field"><span className="lbl" id="hoursLbl">Сколько часов</span>
              <div className="hours"><input id="f-hours" type="range" min={2} max={12} value={hours} onChange={e => setHours(+e.target.value)} aria-labelledby="hoursLbl" /><output htmlFor="f-hours">{hours} ч</output></div>
            </div>
            <div className="field"><label htmlFor="f-guests">Гостей</label><input id="f-guests" type="number" min={1} max={CAPACITY.lecture} value={guests} onChange={e => setGuests(+e.target.value)} /></div>
          </div>
          <div className="field"><span className="lbl">Дополнительно</span>
            <div className="addons">
              {ADDONS.map(a => (
                <label key={a.id}><input type="checkbox" checked={addons.includes(a.id)} onChange={() => toggle(a.id)} /> {a.label}</label>
              ))}
            </div>
          </div>
          <div className="row2">
            <div className="field"><label htmlFor="f-name">Имя</label><input id="f-name" ref={nameRef} type="text" autoComplete="name" value={name} onChange={e => { setName(e.target.value); setInvalid(v => ({ ...v, name: false })); }} required aria-invalid={invalid.name || undefined} aria-describedby={invalid.name ? 'form-msg' : undefined} /></div>
            <div className="field"><label htmlFor="f-phone">Телефон</label><input id="f-phone" ref={phoneRef} type="tel" inputMode="tel" autoComplete="tel" placeholder="+375" value={phone} onChange={e => { setPhone(e.target.value); setInvalid(v => ({ ...v, phone: false })); }} required aria-invalid={invalid.phone || undefined} aria-describedby={invalid.phone ? 'form-msg' : undefined} /></div>
          </div>
          <div className="total">
            <div><small>Предварительно</small><div className="muted" style={{ fontSize: '.85rem' }}>{note}</div></div>
            <b>{totalText}</b>
          </div>
          <button className="btn btn-amber" type="submit">Отправить заявку</button>
          <div id="form-msg" className={`form-msg${status ? (status.ok ? ' ok' : ' err') : ''}`} role={status?.ok === false ? 'alert' : 'status'}>{status?.text}</div>
        </form>
      </div>
    </section>
  );
}
