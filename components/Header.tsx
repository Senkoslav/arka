'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { LogoIcon, LogoWord } from './Logo';

const NAV = [
  ['#about', 'О пространстве'],
  ['#space', 'Зал в 3D'],
  ['#prices', 'Тарифы и услуги'],
  ['#gallery', 'Галерея'],
  ['#reviews', 'Отзывы'],
  ['#book', 'Контакты'],
] as const;

export default function Header() {
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  const logo = useRef<HTMLAnchorElement>(null);

  // Шапка прозрачная над 3D-прогулкой и становится сплошной после неё
  useEffect(() => {
    const tour = document.getElementById('tour');
    const onScroll = () => setSolid(window.scrollY > (tour?.offsetHeight ?? 0) - 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Ховер логотипа: свет пробегает по арке, цифры подпрыгивают «раз-два-три»
  useEffect(() => {
    const el = logo.current!;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const glint = el.querySelector<SVGPathElement>('.glint')!;
    const L = glint.getTotalLength();
    const hops = el.querySelectorAll('.digits > g');
    let busy = false;
    const play = () => {
      if (busy) return; busy = true;
      gsap.timeline({ onComplete: () => { busy = false; } })
        .set(glint, { strokeDasharray: `220 ${L}`, strokeDashoffset: 220, opacity: 1 })
        .to(glint, { strokeDashoffset: -L, duration: .9, ease: 'power2.inOut' }, 0)
        .set(glint, { opacity: 0 })
        .to(hops, { keyframes: { y: [0, -70, 0] }, duration: .42, stagger: .08, ease: 'power1.inOut' }, .15);
    };
    el.addEventListener('pointerenter', play); el.addEventListener('focus', play);
    return () => { el.removeEventListener('pointerenter', play); el.removeEventListener('focus', play); };
  }, []);

  return (
    <header className={`site-header${solid ? ' solid' : ''}`} id="top">
      <div className="wrap bar">
        <a href="#tour" className="logo" ref={logo} aria-label="АРКА 123, в начало">
          <LogoIcon className="icon" glint />
          <LogoWord className="word" />
        </a>
        <button type="button" className="menu-btn" aria-expanded={open} aria-controls="nav" onClick={() => setOpen(o => !o)}>Меню</button>
        <nav className={`nav${open ? ' open' : ''}`} id="nav" aria-label="Разделы">
          {NAV.map(([href, label]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>)}
        </nav>
        <a className="btn btn-amber" href="#book">Забронировать</a>
      </div>
    </header>
  );
}
