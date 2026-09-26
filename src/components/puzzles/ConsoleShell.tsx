import React, { useCallback, useRef, useState } from 'react';
import { Check, ChevronDown, Lock, Unlock, X } from 'lucide-react';
import { sound } from '../../services/sound';
import { useDismiss } from '../../hooks/useDismiss';

/**
 * Shared frame for every room's calibration console: header with one help menu,
 * a live view of the machine on the left, and objectives, controls and the
 * commit button on the right.
 */

export interface ConsoleObjective {
  label: string;
  done: boolean;
}

export type ConsoleTone = 'good' | 'bad' | 'neutral';

interface ConsoleShellProps {
  code: string; // e.g. 'CONSOLE 101'
  location: string;
  title: string;
  brief: string;
  objectives: ConsoleObjective[];
  solved: boolean;
  commitLabel: string;
  onCommit: () => void;
  onOpenHints: () => void;
  onOpenWalkie?: () => void;
  onAutoSolve: () => void;
  onExit: () => void;
  visual: React.ReactNode;
  status?: { tone: ConsoleTone; title: string; text: React.ReactNode };
  children: React.ReactNode; // the controls
}

const TONE_TEXT: Record<ConsoleTone, string> = {
  good: 'text-teal-300',
  bad: 'text-rose-300',
  neutral: 'text-zinc-400',
};
const TONE_BORDER: Record<ConsoleTone, string> = {
  good: 'border-teal-400',
  bad: 'border-rose-500',
  neutral: 'border-zinc-600',
};

const HelpMenu: React.FC<{ onOpenHints: () => void; onOpenWalkie?: () => void; onAutoSolve: () => void }> = ({
  onOpenHints,
  onOpenWalkie,
  onAutoSolve,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  const items = [
    { title: 'Align-Boy whispers', desc: 'Three hints, from subtle to explicit', run: onOpenHints, sfx: () => sound.playClick() },
    ...(onOpenWalkie
      ? [{ title: 'Ask Larry', desc: 'His walkie tapes for this room', run: onOpenWalkie, sfx: () => sound.playWalkieSquelch() }]
      : []),
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => {
          sound.playClick();
          setOpen((o) => !o);
        }}
        aria-expanded={open}
        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] transition-colors hover:bg-white/5 ${
          open ? 'border-white/20 text-zinc-100' : 'border-white/10 text-zinc-300'
        }`}
      >
        Need a hint?
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="animate-lesson-text absolute right-0 top-full z-30 mt-2 w-64 overflow-hidden rounded-xl border border-white/10 bg-[#0c0f16]/95 py-1.5 shadow-2xl backdrop-blur-md">
          {items.map((item) => (
            <button
              key={item.title}
              onClick={() => {
                close();
                item.sfx();
                item.run();
              }}
              className="block w-full cursor-pointer px-4 py-2.5 text-left transition-colors hover:bg-white/5"
            >
              <span className="block text-[13px] text-zinc-100">{item.title}</span>
              <span className="block text-xs text-zinc-500">{item.desc}</span>
            </button>
          ))}
          <div className="my-1.5 h-px bg-white/5" />
          <button
            onClick={() => {
              close();
              onAutoSolve();
            }}
            className="block w-full cursor-pointer px-4 py-2.5 text-left transition-colors hover:bg-white/5"
          >
            <span className="block text-[13px] text-zinc-300">Auto-calibrate</span>
            <span className="block text-xs text-zinc-500">Sets the answer for you (skips the puzzle)</span>
          </button>
        </div>
      )}
    </div>
  );
};

export const ConsoleShell: React.FC<ConsoleShellProps> = ({
  code,
  location,
  title,
  brief,
  objectives,
  solved,
  commitLabel,
  onCommit,
  onOpenHints,
  onOpenWalkie,
  onAutoSolve,
  onExit,
  visual,
  status,
  children,
}) => {
  const doneCount = objectives.filter((o) => o.done).length;
  const allDone = doneCount === objectives.length;

  return (
    <section className="overflow-hidden rounded-2xl border border-white/7 bg-[#0a0d13] shadow-2xl">
      <header className="flex flex-col gap-4 border-b border-white/6 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-teal-400/90">
            {code} · {location}
          </div>
          <h2 className="mt-1 font-title text-2xl font-bold text-zinc-50">{title}</h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-zinc-400">{brief}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <HelpMenu onOpenHints={onOpenHints} onOpenWalkie={onOpenWalkie} onAutoSolve={onAutoSolve} />
          <button
            onClick={() => {
              sound.playClick();
              onExit();
            }}
            title="Step away from the console"
            className="cursor-pointer rounded-lg p-2 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="grid lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        {/* Live view of the machine */}
        <div className="flex flex-col gap-4 border-b border-white/6 p-6 lg:border-b-0 lg:border-r">
          {visual}
          {status && (
            <div className={`rounded-r-xl border-l-2 bg-white/2.5 px-4 py-3 ${TONE_BORDER[status.tone]}`}>
              <div className={`font-mono text-[11px] font-bold uppercase tracking-[0.18em] ${TONE_TEXT[status.tone]}`}>
                {status.title}
              </div>
              <div className="mt-1 text-[13px] leading-relaxed text-zinc-300">{status.text}</div>
            </div>
          )}
        </div>

        {/* Objectives, controls, commit */}
        <div className="flex flex-col p-6">
          <div>
            <div className="mb-2.5 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">
              <span>Objectives</span>
              <span className={allDone ? 'text-teal-300' : undefined}>
                {doneCount}/{objectives.length}
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-teal-400 transition-all duration-500"
                style={{ width: `${(doneCount / objectives.length) * 100}%` }}
              />
            </div>
            <ul className="mt-3.5 space-y-2">
              {objectives.map((o) => (
                <li key={o.label} className="flex items-center gap-2.5 text-[13px]">
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      o.done ? 'border-teal-400 bg-teal-400 text-black' : 'border-zinc-600'
                    }`}
                  >
                    {o.done && <Check className="h-2.5 w-2.5" strokeWidth={4} />}
                  </span>
                  <span className={o.done ? 'text-zinc-300' : 'text-zinc-400'}>{o.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 space-y-5 border-t border-white/6 pt-6">{children}</div>

          <div className="mt-auto pt-7">
            <button
              onClick={onCommit}
              disabled={!solved}
              className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold transition-all ${
                solved
                  ? 'cursor-pointer bg-teal-400 text-black shadow-[0_0_32px_-6px_rgba(45,212,191,0.6)] hover:bg-teal-300'
                  : 'cursor-not-allowed bg-white/4 text-zinc-500'
              }`}
            >
              {solved ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              {solved ? commitLabel : 'Complete the objectives to continue'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export const ConsoleSlider: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  target?: string;
  ok?: boolean;
  suffix?: string;
  min?: number;
  max?: number;
}> = ({ label, value, onChange, target, ok, suffix = '%', min = 0, max = 100 }) => {
  const pct = ((value - min) / (max - min)) * 100;
  const fill = ok === false ? '#fbbf24' : '#2dd4bf';
  return (
    <label className="block">
      <div className="mb-2.5 flex items-baseline justify-between gap-3">
        <span className="text-[13px] text-zinc-200">{label}</span>
        <span className="flex items-baseline gap-2">
          {target && <span className="font-mono text-[11px] text-zinc-500">{target}</span>}
          <span
            className={`w-12 text-right font-mono text-sm font-bold tabular-nums ${
              ok === undefined ? 'text-zinc-200' : ok ? 'text-teal-300' : 'text-amber-300'
            }`}
          >
            {value}
            {suffix}
          </span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          sound.playClick();
          onChange(Number(e.target.value));
        }}
        className="console-range w-full"
        style={{ '--pct': `${pct}%`, '--fill': fill } as React.CSSProperties}
      />
    </label>
  );
};

export const ConsoleToggle: React.FC<{
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ label, description, checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => {
      sound.playClick();
      onChange(!checked);
    }}
    className="flex w-full cursor-pointer items-start justify-between gap-4 text-left"
  >
    <span className="min-w-0">
      <span className="block text-[13px] text-zinc-200">{label}</span>
      {description && <span className="mt-0.5 block text-xs leading-relaxed text-zinc-500">{description}</span>}
    </span>
    <span
      className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${
        checked ? 'bg-teal-400' : 'bg-white/10'
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-200 ${
          checked ? 'left-[18px]' : 'left-0.5'
        }`}
      />
    </span>
  </button>
);

// Segmented control for switching what the live view shows
export function ConsoleSegmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string; activeClass?: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-white/7 bg-black/30 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => {
            sound.playClick();
            onChange(o.value);
          }}
          className={`cursor-pointer rounded-md px-3 py-1 text-xs transition-colors ${
            value === o.value ? o.activeClass ?? 'bg-white/10 text-zinc-100' : 'text-zinc-500 hover:text-zinc-200'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
