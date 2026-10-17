import {
  ARCH_CLOSED, ARCH_PARTS, DIGITS, FULL_VIEWBOX, ICON_IN_FULL, ICON_VIEWBOX,
  LETTERS, SLOGAN_1, SLOGAN_2, WORD_VIEWBOX,
} from '@/lib/logo';

/** Цифры 1-2-3 знака. Классы нужны анимациям (лоадер, ховер). */
export function Digits() {
  return (
    <g className="digits">
      <g className="g1">
        <path className="d1s" d={DIGITS.oneStem} />
        <polygon className="d1f" points={DIGITS.oneFlag} />
      </g>
      <g className="g2">
        <path className="d2a" d={DIGITS.twoCurve} />
        <path className="d2b" d={DIGITS.twoBase} />
      </g>
      <g className="g3">
        <path className="d3a" d={DIGITS.threeTop} />
        <path className="d3b" d={DIGITS.threeDiag} />
        <path className="d3c" d={DIGITS.threeBowl} />
      </g>
    </g>
  );
}

/** Арка по частям: пол расходится от центра, стены смыкаются в своде */
export function ArchParts() {
  return (
    <g className="arch">
      <path className="fl" d={ARCH_PARTS.floorLeft} />
      <path className="fr" d={ARCH_PARTS.floorRight} />
      <path className="sl" d={ARCH_PARTS.sideLeft} />
      <path className="sr" d={ARCH_PARTS.sideRight} />
    </g>
  );
}

export function Letters() {
  return <>{LETTERS.map((d, i) => <path key={i} className="ltr" d={d} />)}</>;
}

export function LogoIcon({ className = '', glint = false }: { className?: string; glint?: boolean }) {
  return (
    <svg className={`mk ${className}`} viewBox={ICON_VIEWBOX} aria-hidden="true">
      <path className="frame" d={ARCH_CLOSED} />
      {glint && <path className="glint" d={ARCH_CLOSED} />}
      <Digits />
    </svg>
  );
}

export function LogoWord({ className = '' }: { className?: string }) {
  return (
    <svg className={`mk ${className}`} viewBox={WORD_VIEWBOX} aria-hidden="true">
      <Letters />
    </svg>
  );
}

export function LogoFull({ className = '' }: { className?: string }) {
  return (
    <svg className={`mk ${className}`} viewBox={FULL_VIEWBOX} role="img" aria-label="АРКА 123. Встречаемся напротив Библиотеки.">
      <g transform={ICON_IN_FULL}>
        <path className="frame" d={ARCH_CLOSED} />
        <Digits />
      </g>
      <Letters />
      <path className="slogan" d={SLOGAN_1} />
      <path className="slogan" d={SLOGAN_2} />
    </svg>
  );
}
