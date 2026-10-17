'use client';

import { CAPACITY, type LayoutName } from '@/lib/layouts';
import type { ViewName } from '@/lib/arkaScene';
import { useScene } from './SceneProvider';

const LAYOUTS: Array<{ id: LayoutName; title: string; note: string }> = [
  { id: 'empty', title: 'Пустой зал', note: 'как есть, без мебели' },
  { id: 'lecture', title: 'Мастер-класс', note: 'ряды стульев, экран 4 м и проектор' },
  { id: 'longtable', title: 'Общий стол', note: 'стратсессии, ужины, круглые столы' },
  { id: 'islands', title: 'Отдельные столы', note: 'воркшопы и работа в группах' },
];
const VIEWS: Array<[ViewName, string]> = [['plan', 'Сверху'], ['inside', 'От входа'], ['window', 'У окна']];

export default function Space() {
  const { spaceHost, layout, setLayout, view, setView, mood, setMood } = useScene();
  return (
    <section className="block space" id="space">
      <div className="wrap">
        <div className="head">
          <div className="eyebrow">Наше помещение</div>
          <h2>Расставьте зал под своё мероприятие</h2>
          <p className="lead">Модель зала в реальных размерах. Выберите формат — мебель встанет на места. Поверните зал мышью или пальцем.</p>
        </div>
        <div className="space-grid">
          <div className="viewer">
            <div className="gl-host" ref={spaceHost} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="fallback-photo" src="/img/hall-windows.webp" alt="Зал АРКА 123: два арочных окна, пол «ёлочкой», световые панели" />
            <div className="hud">
              <div className="seg" role="group" aria-label="Ракурс">
                {VIEWS.map(([id, label]) => (
                  <button key={id} type="button" aria-pressed={view === id} onClick={() => setView(id)}>{label}</button>
                ))}
              </div>
              <div className="seg" role="group" aria-label="Время суток">
                <button type="button" aria-pressed={mood === 0} onClick={() => setMood(0)}>День</button>
                <button type="button" aria-pressed={mood === 1} onClick={() => setMood(1)}>Вечер</button>
              </div>
            </div>
            <div className="hint">Потяните, чтобы повернуть</div>
          </div>
          <div>
            <div className="layouts" role="group" aria-label="Формат рассадки">
              {LAYOUTS.map(l => (
                <button key={l.id} type="button" className="layout-btn" aria-pressed={layout === l.id} onClick={() => setLayout(l.id)}>
                  <strong>{l.title}</strong>
                  <span className="cap">{l.id === 'empty' ? <><b>123</b>м²</> : <><b>{CAPACITY[l.id]}</b>мест</>}</span>
                  <small>{l.note}</small>
                </button>
              ))}
            </div>
            <dl className="specs">
              <dt>Пол</dt><dd>кварцвинил «ёлочка»</dd>
              <dt>Стены</dt><dd>декоративная штукатурка</dd>
              <dt>Потолок</dt><dd>антрацит, до 4,5 м</dd>
              <dt>Свет</dt><dd>33 LED-панели</dd>
              <dt>Ещё</dt><dd>кухня-зона, Wi-Fi</dd>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
