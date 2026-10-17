'use client';

import { useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ARCH_CLOSED } from '@/lib/logo';
import { CAPACITY } from '@/lib/layouts';
import { useScene } from './SceneProvider';

/** Шаги прогулки. Камера в 3D-сцене проходит по ним по мере прокрутки. */
const STEPS: Array<{ say: string; body: React.ReactNode }> = [
  {
    say: 'Здравствуйте! Я Анна, администратор АРКА 123. Покажу вам зал — просто листайте вниз.',
    body: <>
      <div className="eyebrow">Минск · Мстиславца, 10 · зал для мастер-классов</div>
      <h1>Встречаемся напротив Библиотеки</h1>
      <p>Светлый зал 123 м² с арочными окнами на Национальную библиотеку. Для мастер-классов, семинаров и лекций — на час, полдня или весь день.</p>
      <div className="cta"><a className="btn btn-amber" href="#book">Выбрать дату</a><a className="btn btn-ghost" href="#space">Расставить мебель в 3D</a></div>
    </>,
  },
  {
    say: 'Здесь нет перегородок. Стулья, столы и проектор расставим под ваш формат до прихода гостей.',
    body: <>
      <div className="eyebrow">Площадь</div>
      <div className="figure">123<small>м²</small></div>
      <h2>Один открытый зал</h2>
      <p>Лекция для {CAPACITY.lecture} человек, общий стол на {CAPACITY.longtable} или шесть рабочих групп — всё в одном пространстве.</p>
    </>,
  },
  {
    say: 'Потолки — до 4,5 метра. А 33 световые панели дают ровный свет даже в декабре в пять вечера.',
    body: <>
      <div className="eyebrow">Высота и свет</div>
      <div className="figure">4,5<small>м</small></div>
      <h2>Высокий потолок и 33 световые панели</h2>
      <p>Антрацитовый потолок, открытые балки и линейные светильники. Пол — кварцвинил «ёлочкой», стены — декоративная штукатурка.</p>
    </>,
  },
  {
    say: 'А это наша гордость — арочные окна. Именно от них пошло название АРКА.',
    body: <>
      <div className="eyebrow">Окна</div>
      <div className="figure">4 × 3,5<small>м</small></div>
      <h2>Два огромных арочных окна</h2>
      <div className="dim">4 м</div>
      <p>Днём в зале хватает естественного света, а на фото и видео он мягкий и тёплый.</p>
    </>,
  },
  {
    say: 'Из каждого окна видна Национальная библиотека. Так и встречаемся — напротив Библиотеки.',
    body: <>
      <div className="eyebrow">Вид из окна</div>
      <h2>Национальная библиотека — через дорогу</h2>
      <p>Вечером её фасад загорается огнями. Лучший фон для фотографий с вашего мероприятия.</p>
      <div className="cta"><a className="btn btn-amber" href="#book">Забронировать зал</a></div>
    </>,
  },
];

/**
 * Позы гида (фирменный персонаж, часть 2 тестового) — по одной на шаг прогулки (0–4).
 * Файлы готовит scripts/guide-poses.mjs: все позы на одном холсте, поэтому при смене
 * меняется только жест, а фигура стоит на месте.
 * Пустая строка — для этого шага берётся первая доступная поза; если поз нет совсем — силуэт-заглушка.
 */
const GUIDE_POSES: string[] = [
  '/img/guide-wave.webp',    // приветствие
  '/img/guide-present.webp', // открытый зал
  '/img/guide-up.webp',      // потолок 4,5 м и светильники
  '/img/guide-point.webp',   // арочные окна
  '/img/guide-present.webp', // вид на Библиотеку; сюда встанет guide-tablet.webp (поза с планшетом)
];
const POSE_FILES = [...new Set(GUIDE_POSES.filter(Boolean))];

function poseFor(step: number): string | null {
  return GUIDE_POSES[step] || GUIDE_POSES.find(Boolean) || null;
}

export default function Tour() {
  const { tourSection, tourHost } = useScene();
  const [active, setActive] = useState(0);
  const [intro, setIntro] = useState(true); // страница ещё не прокручена — первый экран

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({ trigger: tourSection.current, start: 'top+=120 top', end: 'max', onToggle: self => setIntro(!self.isActive) });
      gsap.utils.toArray<HTMLElement>('.step').forEach((st, i) => {
        ScrollTrigger.create({ trigger: st, start: 'top 55%', end: 'bottom 55%', onToggle: self => { if (self.isActive) setActive(i); } });
        if (i > 0 && !reduce) gsap.from(st.querySelectorAll('.card > *'), {
          y: 30, opacity: 0, duration: .7, stagger: .07, ease: 'power3.out',
          scrollTrigger: { trigger: st, start: 'top 70%', toggleActions: 'play none none reverse' },
        });
      });
      gsap.to('.scroll-hint', { opacity: 0, scrollTrigger: { trigger: tourSection.current, start: 'top top', end: '+=200', scrub: true } });
    }, tourSection);
    return () => ctx.revert();
  }, [tourSection]);

  // Смена реплики гида
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.fromTo('#bubble', { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: .35, ease: 'back.out(2)' });
  }, [active]);

  const pose = poseFor(active);

  return (
    <section className="tour" id="tour" aria-label="Прогулка по залу" ref={tourSection}>
      <div className="tour-stage">
        <div className="gl-host" ref={tourHost} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="fallback-photo" src="/img/sunset.webp" alt="Зал АРКА 123 на закате: арочные окна с видом на Национальную библиотеку" />
        <div className="shade" />
        <div className="progress" aria-hidden="true">
          {STEPS.map((_, i) => <span key={i} className={i === active ? 'on' : ''} />)}
        </div>
        <div className="guide" aria-hidden="true" data-intro={active === 0 && intro ? '' : undefined}>
          <div className="figure-wrap">
            <div className="bubble" id="bubble"><b>Анна · администратор</b><span>{STEPS[active].say}</span></div>
            {/* Все позы в DOM сразу: загружаются заранее, а смена — плавная, без мигания */}
            {pose
              // eslint-disable-next-line @next/next/no-img-element
              ? POSE_FILES.map(src => <img key={src} src={src} alt="" decoding="async" className={src === pose ? 'on' : undefined} />)
              : <GuidePlaceholder />}
          </div>
        </div>
        <div className="scroll-hint" aria-hidden="true">Листайте</div>
      </div>

      <div className="tour-steps">
        {STEPS.map((s, i) => (
          <div className="step" data-step={i} key={i}>
            <div className="wrap"><div className="card">{s.body}<p className="sr-only">Анна, администратор: {s.say}</p></div></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function GuidePlaceholder() {
  return (
    <svg className="ph" viewBox="0 0 300 440" aria-hidden="true">
      <defs><clipPath id="phc"><path d="M0,440 V150 A150,150 0 0 1 300,150 V440 Z" /></clipPath></defs>
      <g clipPath="url(#phc)">
        <rect width="300" height="440" fill="#26343b" />
        <path d="M150,96 c31,0 52,25 52,58 c0,36 -22,66 -52,66 c-30,0 -52,-30 -52,-66 c0,-33 21,-58 52,-58z" fill="#3c5059" />
        <path d="M112,90 c10,-26 66,-30 82,0 c14,22 12,58 6,82 l-10,-40 c-14,-14 -50,-14 -70,-2 l-12,40 c-8,-28 -6,-58 4,-80z" fill="#1a2429" />
        <path d="M20,440 c4,-104 50,-160 130,-168 c80,8 126,64 130,168z" fill="#1d2a30" />
        <path d="M126,282 l24,34 l24,-34" fill="none" stroke="#5d7480" strokeWidth="5" />
        <g transform="translate(196 318) scale(.05)"><path d={ARCH_CLOSED} fill="none" stroke="#e9a63c" strokeWidth="90" /></g>
      </g>
    </svg>
  );
}
