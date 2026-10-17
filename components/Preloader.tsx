'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ICON_VIEWBOX, INTERIOR } from '@/lib/logo';
import { ArchParts, Digits } from './Logo';

const MIN_MS = 1300;

/**
 * Лоадер: контур арки служит прогресс-баром (пол → стены → свод),
 * затем прописываются цифры 1-2-3, проём заливается светом и камера «влетает» в окно.
 */
export default function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const pre = root.current!;
    const mark = pre.querySelector('svg')!;
    const pctEl = pre.querySelector<HTMLElement>('#pct')!;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const html = document.documentElement;
    html.classList.add('loading');

    const q = <T extends Element = SVGGeometryElement>(s: string) => mark.querySelector(s) as unknown as T;
    const floors = [q('.fl'), q('.fr')], sides = [q('.sl'), q('.sr')];
    const strokes = [...floors, ...sides, ...Array.from(mark.querySelectorAll<SVGGeometryElement>('.digits path'))];
    const len = new Map<Element, number>();
    strokes.forEach(el => { const L = el.getTotalLength(); len.set(el, L); el.style.strokeDasharray = `${L}`; el.style.strokeDashoffset = `${L}`; });
    const d1f = q<SVGPolygonElement>('.d1f');
    gsap.set(d1f, { scale: 0, transformOrigin: '100% 0%' });

    const draw = (p: number) => {
      const f = Math.min(p / 0.15, 1), s = Math.max(0, (p - 0.15) / 0.85);
      floors.forEach(e => e.style.strokeDashoffset = `${len.get(e)! * (1 - f)}`);
      sides.forEach(e => e.style.strokeDashoffset = `${len.get(e)! * (1 - s)}`);
      pctEl.textContent = String(Math.round(p * 100)).padStart(3, '0');
    };

    // Реальные этапы: шрифты и фото первого экрана. Плюс минимальное время, чтобы лоадер не мигал.
    const stages = { fonts: false, images: false };
    let target = 0.15;
    const bump = () => { target = 0.15 + 0.85 * (Object.values(stages).filter(Boolean).length / 2); };
    document.fonts?.ready.then(() => { stages.fonts = true; bump(); });
    const img = document.querySelector<HTMLImageElement>('#tour .fallback-photo');
    if (!img || img.complete) { stages.images = true; bump(); }
    else { const done = () => { stages.images = true; bump(); }; img.addEventListener('load', done, { once: true }); img.addEventListener('error', done, { once: true }); }
    const safety = window.setTimeout(() => { stages.fonts = stages.images = true; bump(); }, 4000);

    let raf = 0, tl: gsap.core.Timeline | null = null;
    const t0 = performance.now();
    const finish = () => {
      html.classList.remove('loading');
      const done = () => { setGone(true); ScrollTrigger.refresh(); };
      if (reduce) { done(); return; }
      tl = gsap.timeline({ onComplete: done });
      tl.to('.pct', { autoAlpha: 0, y: 8, duration: .25 })
        .to(q('.d1s'), { strokeDashoffset: 0, duration: .35, ease: 'power2.in' }, '<')
        .to(d1f, { scale: 1, duration: .3, ease: 'back.out(2.2)' }, '>-0.05')
        .to(q('.d2a'), { strokeDashoffset: 0, duration: .4, ease: 'power2.inOut' }, '<-0.25')
        .to(q('.d2b'), { strokeDashoffset: 0, duration: .15 }, '>')
        .to(q('.d3a'), { strokeDashoffset: 0, duration: .15 }, '<')
        .to(q('.d3b'), { strokeDashoffset: 0, duration: .14, ease: 'none' }, '>')
        .to(q('.d3c'), { strokeDashoffset: 0, duration: .32, ease: 'power2.out' }, '>')
        .to('#ldLight', { attr: { y: 313, height: 663 }, duration: .6, ease: 'power2.out' }, '>-0.05')
        .to(q('.digits'), { opacity: 0, duration: .35 }, '+=0.1')
        .to('#ldG', { scale: 30, svgOrigin: '624.5 700', duration: 1.0, ease: 'power3.in' }, '<')
        .to(pre, { autoAlpha: 0, duration: .4 }, '>-0.15')
        .from('.step[data-step="0"] .card > *', { y: 26, opacity: 0, duration: .7, stagger: .08, ease: 'power3.out' }, '<0.05');
    };
    const tick = () => {
      const timeCap = reduce ? 1 : Math.min(1, (performance.now() - t0) / MIN_MS);
      const p = Math.min(target, timeCap);
      draw(p);
      if (target >= 1 && p >= 1) { finish(); return; }
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => { cancelAnimationFrame(raf); clearTimeout(safety); tl?.kill(); html.classList.remove('loading'); };
  }, []);

  if (gone) return null;
  return (
    <div id="preloader" ref={root} role="status" aria-label="Загрузка сайта">
      <svg className="mk" viewBox={ICON_VIEWBOX} aria-hidden="true">
        <defs>
          <clipPath id="clipLd" clipPathUnits="userSpaceOnUse"><path d={INTERIOR} /></clipPath>
          <linearGradient id="win" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" className="stop-sky" /><stop offset="1" className="stop-glow" />
          </linearGradient>
        </defs>
        <g id="ldG">
          <rect id="ldLight" x="339.5" y="976" width="570" height="0" fill="url(#win)" clipPath="url(#clipLd)" />
          <ArchParts />
          <Digits />
        </g>
      </svg>
      <div className="pct"><span id="pct">000</span> %</div>
    </div>
  );
}
