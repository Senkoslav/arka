'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { ArkaScene, ViewName } from '@/lib/arkaScene';
import type { LayoutName } from '@/lib/layouts';

gsap.registerPlugin(ScrollTrigger);

interface SceneCtx {
  tourSection: RefObject<HTMLElement | null>;
  tourHost: RefObject<HTMLDivElement | null>;
  spaceHost: RefObject<HTMLDivElement | null>;
  layout: LayoutName;
  setLayout(l: LayoutName): void;
  view: ViewName;
  setView(v: ViewName): void;
  mood: number;
  setMood(m: number): void;
}

const Ctx = createContext<SceneCtx | null>(null);
export const useScene = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useScene() должен вызываться внутри <SceneProvider>');
  return c;
};

/** Вечер наступает на последних шагах прогулки */
const moodForTour = (p: number) => Math.min(1, Math.max(0, (p - 0.7) / 0.25));

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}

/**
 * Одна 3D-сцена на два места: фон прогулки (tour) и интерактивный зал (orbit).
 * Канвас переезжает в тот контейнер, который сейчас на экране.
 */
export function SceneProvider({ children }: { children: ReactNode }) {
  const tourSection = useRef<HTMLElement>(null);
  const tourHost = useRef<HTMLDivElement>(null);
  const spaceHost = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ArkaScene | null>(null);
  const modeRef = useRef<'tour' | 'orbit'>('tour');
  const viewRef = useRef<ViewName>('plan');
  const moodRef = useRef(0);
  const tourProgress = useRef(0);

  const [layout, setLayoutState] = useState<LayoutName>('empty');
  const [view, setViewState] = useState<ViewName>('plan');
  const [mood, setMoodState] = useState(0);

  useEffect(() => {
    let disposed = false;
    let io: IntersectionObserver | null = null;
    let st: ScrollTrigger | null = null;

    (async () => {
      if (!webglAvailable() || !tourHost.current) { document.documentElement.classList.add('no-gl'); return; }
      try {
        const { buildScene } = await import('@/lib/arkaScene');
        if (disposed || !tourHost.current) return;
        const S = buildScene(tourHost.current);
        sceneRef.current = S;

        st = ScrollTrigger.create({
          trigger: tourSection.current, start: 'top top', end: 'bottom bottom',
          onUpdate: self => {
            tourProgress.current = self.progress;
            if (modeRef.current === 'tour') { S.setTourProgress(self.progress); S.setMood(moodForTour(self.progress)); }
          },
        });

        const vis = new Map<Element, number>();
        io = new IntersectionObserver(entries => {
          entries.forEach(e => vis.set(e.target, e.isIntersecting ? e.intersectionRatio : 0));
          const t = vis.get(tourHost.current!) || 0, s = vis.get(spaceHost.current!) || 0;
          S.setVisible(t > 0 || s > 0);
          if (s > t && s > 0.15 && modeRef.current !== 'orbit' && spaceHost.current) {
            modeRef.current = 'orbit'; S.attach(spaceHost.current); S.setMode('orbit', viewRef.current); S.setMood(moodRef.current);
          } else if (t >= s && t > 0 && modeRef.current !== 'tour' && tourHost.current) {
            modeRef.current = 'tour'; S.attach(tourHost.current); S.setMode('tour'); S.setMood(moodForTour(tourProgress.current));
          }
        }, { threshold: [0, 0.15, 0.3, 0.6, 1] });
        io.observe(tourHost.current);
        if (spaceHost.current) io.observe(spaceHost.current);
      } catch (err) {
        console.error(err);
        document.documentElement.classList.add('no-gl');
      }
    })();

    return () => {
      disposed = true;
      io?.disconnect(); st?.kill();
      sceneRef.current?.dispose(); sceneRef.current = null;
    };
  }, []);

  const setLayout = useCallback((l: LayoutName) => { setLayoutState(l); sceneRef.current?.setLayout(l); }, []);
  const setView = useCallback((v: ViewName) => {
    viewRef.current = v; setViewState(v);
    if (modeRef.current === 'orbit') sceneRef.current?.goView(v);
  }, []);
  const setMood = useCallback((m: number) => {
    moodRef.current = m; setMoodState(m);
    if (modeRef.current === 'orbit') sceneRef.current?.setMood(m);
  }, []);

  return (
    <Ctx.Provider value={{ tourSection, tourHost, spaceHost, layout, setLayout, view, setView, mood, setMood }}>
      {children}
    </Ctx.Provider>
  );
}
