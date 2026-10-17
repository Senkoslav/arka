'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

const PHOTOS = [
  { src: '/img/sunset.webp', w: 1600, h: 660, cls: 'wide', cap: 'Закат в арочных окнах', alt: 'Закат в арочных окнах зала' },
  { src: '/img/window-library.webp', w: 788, h: 1400, cls: 'tall', cap: 'Окно с видом на Национальную библиотеку', alt: 'Окно с видом на Национальную библиотеку' },
  { src: '/img/hall-depth.webp', w: 788, h: 1400, cls: 'tall', cap: 'Глубина зала: от входа к окнам', alt: 'Вид на зал от входа к окнам' },
  { src: '/img/hall-windows.webp', w: 1400, h: 788, cls: 'wide', cap: 'Два окна и часы на стене', alt: 'Пустой зал с двумя арочными окнами' },
  { src: '/img/hall-side.webp', w: 788, h: 1400, cls: 'tall', cap: 'Свет у окон', alt: 'Окна вдоль зала и световые панели' },
  { src: '/img/window-arch.webp', w: 788, h: 1400, cls: 'tall', cap: 'Арка окна изнутри', alt: 'Арка окна изнутри зала' },
  { src: '/img/reception.webp', w: 788, h: 1400, cls: '', cap: 'Кухня-зона и ресепшен', alt: 'Кухня-зона и стойка ресепшена' },
  { src: '/img/hall-entrance.webp', w: 788, h: 1400, cls: '', cap: 'Вход в зал', alt: 'Вход в зал' },
  { src: '/img/glass-office.webp', w: 1400, h: 788, cls: 'wide', cap: 'Стеклянные перегородки у входа', alt: 'Стеклянные перегородки у входа' },
  { src: '/img/corridor.webp', w: 1400, h: 788, cls: 'wide', cap: 'Холл этажа', alt: 'Холл этажа со стеклянными перегородками' },
];

export default function Gallery() {
  const dlg = useRef<HTMLDialogElement>(null);
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false);
  const go = (n: number) => setI((n + PHOTOS.length) % PHOTOS.length);

  useEffect(() => {
    const d = dlg.current!;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'ArrowLeft') setI(n => (n - 1 + PHOTOS.length) % PHOTOS.length); if (e.key === 'ArrowRight') setI(n => (n + 1) % PHOTOS.length); };
    const onClose = () => setOpen(false);
    d.addEventListener('keydown', onKey); d.addEventListener('close', onClose);
    return () => { d.removeEventListener('keydown', onKey); d.removeEventListener('close', onClose); };
  }, []);

  const p = PHOTOS[i];
  return (
    <section className="block" id="gallery" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="head">
          <div className="eyebrow">Фотогалерея</div>
          <h2>Зал при разном свете</h2>
        </div>
        <div className="gallery">
          {PHOTOS.map((ph, n) => (
            <button key={ph.src} type="button" className={ph.cls} onClick={() => { setI(n); setOpen(true); dlg.current?.showModal(); }} aria-label={`Открыть фото: ${ph.cap}`}>
              <Image src={ph.src} alt={ph.alt} width={ph.w} height={ph.h} sizes="(max-width: 860px) 50vw, 33vw" />
            </button>
          ))}
        </div>
      </div>
      <dialog className="lightbox" ref={dlg} aria-label="Просмотр фото" onClick={e => { if (e.target === dlg.current) dlg.current?.close(); }}>
        <figure>
          {open && <Image key={p.src} src={p.src} alt={p.alt} width={p.w} height={p.h} sizes="94vw" priority />}
          <figcaption>
            <span>{p.cap}</span>
            <span className="lb-ctrl">
              <button type="button" onClick={() => go(i - 1)}>← Назад</button>
              <button type="button" onClick={() => go(i + 1)}>Вперёд →</button>
              <button type="button" onClick={() => dlg.current?.close()}>Закрыть</button>
            </span>
          </figcaption>
        </figure>
      </dialog>
    </section>
  );
}
