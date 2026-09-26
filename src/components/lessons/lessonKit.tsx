import React, { useEffect, useRef } from 'react';

/**
 * Shared building blocks for lesson stages, so every room's "inside the machine"
 * visual has the same frame, controls and motion language.
 */

export const LESSON_COLORS = {
  bg: '#06070c',
  panel: '#0b0d15',
  wire: '#262a3a',
  text: '#a1a1aa',
  dim: '#52525b',
  teal: '#2dd4bf',
  cyan: '#22d3ee',
  magenta: '#ff2bd6',
  rose: '#fb7185',
  amber: '#fbbf24',
  sky: '#38bdf8',
  violet: '#a78bfa',
};

export type StageTone = 'neutral' | 'safe' | 'danger' | 'warn';

const TONE_HEX: Record<StageTone, string> = {
  neutral: '#a1a1aa',
  safe: LESSON_COLORS.teal,
  danger: LESSON_COLORS.magenta,
  warn: LESSON_COLORS.amber,
};

// SVG glow filter. Filter ids are global to the page, so prefix them per lesson.
export const GlowDefs: React.FC<{ id: string }> = ({ id }) => (
  <defs>
    <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/**
 * A glowing dot that travels along an SVG path, used to show signals flowing
 * through a model. Driven by requestAnimationFrame so it restarts cleanly when
 * re-mounted (change its `key` to fire a fresh burst).
 */
export const SignalPulse: React.FC<{
  d: string;
  color: string;
  filterId?: string;
  duration?: number;
  delay?: number;
  loop?: boolean;
  r?: number;
}> = ({ d, color, filterId, duration = 1600, delay = 0, loop = false, r = 4 }) => {
  const pathRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const path = pathRef.current;
    const dot = dotRef.current;
    if (!path || !dot) return;
    const length = path.getTotalLength();
    const start = performance.now() + delay;
    let raf = 0;

    const tick = (now: number) => {
      let t = (now - start) / duration;
      if (t < 0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      if (t > 1) {
        if (!loop) {
          dot.setAttribute('opacity', '0');
          return;
        }
        t %= 1;
      }
      const point = path.getPointAtLength(easeInOut(t) * length);
      dot.setAttribute('cx', String(point.x));
      dot.setAttribute('cy', String(point.y));
      dot.setAttribute('opacity', String(Math.min(1, Math.sin(Math.PI * t) * 1.8)));
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [d, duration, delay, loop]);

  return (
    <g pointerEvents="none">
      <path ref={pathRef} d={d} fill="none" stroke="none" />
      <circle ref={dotRef} r={r} fill={color} opacity={0} filter={filterId ? `url(#${filterId})` : undefined} />
    </g>
  );
};

/**
 * Standard stage layout: the SVG scene on top, and an optional readout line and
 * control row underneath.
 */
export const StageShell: React.FC<{
  viewBox: string;
  svg: React.ReactNode;
  readout?: React.ReactNode;
  controls?: React.ReactNode;
  background?: string;
}> = ({ viewBox, svg, readout, controls, background = LESSON_COLORS.bg }) => (
  <div className="flex h-full flex-col" style={{ background }}>
    <div className="relative min-h-0 flex-1">
      <div className="lesson-grid pointer-events-none absolute inset-0" />
      <svg viewBox={viewBox} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full select-none">
        {svg}
      </svg>
    </div>
    {(readout || controls) && (
      <div className="space-y-3 border-t border-white/6 bg-black/40 px-4 py-3.5 sm:px-5">
        {readout}
        {controls && <div className="flex flex-wrap items-center gap-2">{controls}</div>}
      </div>
    )}
  </div>
);

// One line of model output or status text under the scene
export const StageReadout: React.FC<{ label: string; tone?: StageTone; children: React.ReactNode }> = ({
  label,
  tone = 'neutral',
  children,
}) => (
  <div className="flex items-start gap-3 font-mono text-[13px] leading-relaxed">
    <span
      className="mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold tracking-[0.15em]"
      style={{ color: TONE_HEX[tone], background: `${TONE_HEX[tone]}1a` }}
    >
      {label}
    </span>
    <span className="transition-colors duration-300" style={{ color: tone === 'neutral' ? '#d4d4d8' : TONE_HEX[tone] }}>
      {children}
    </span>
  </div>
);

export const StageButton: React.FC<{
  onClick: () => void;
  active?: boolean;
  tone?: StageTone;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ onClick, active = false, tone = 'neutral', disabled = false, children }) => {
  const hex = TONE_HEX[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-mono text-xs transition-all duration-200 hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-40"
      style={{
        color: active ? '#0a0a0a' : hex,
        background: active ? hex : `${hex}12`,
        borderColor: `${hex}${active ? 'ff' : '55'}`,
      }}
    >
      {children}
    </button>
  );
};

// Non-interactive status pill for the control row
export const StageChip: React.FC<{ tone?: StageTone; children: React.ReactNode }> = ({ tone = 'neutral', children }) => (
  <span
    className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs"
    style={{ color: TONE_HEX[tone], borderColor: `${TONE_HEX[tone]}40`, background: `${TONE_HEX[tone]}0d` }}
  >
    {children}
  </span>
);

export const StageSlider: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
  tone?: StageTone;
}> = ({ label, value, onChange, min = 0, max = 100, suffix = '%', tone = 'neutral' }) => (
  <label className="flex min-w-60 flex-1 items-center gap-3 font-mono text-xs text-zinc-400">
    <span className="shrink-0">{label}</span>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="lesson-range flex-1 cursor-pointer"
      style={{ accentColor: TONE_HEX[tone] }}
    />
    <span className="w-12 shrink-0 text-right font-bold" style={{ color: TONE_HEX[tone] }}>
      {value}
      {suffix}
    </span>
  </label>
);
