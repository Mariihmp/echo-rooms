import React, { useEffect, useRef, useState } from 'react';
import { sound } from '../../services/sound';
import type { LessonDef, LessonStageProps } from './types';
import {
  GlowDefs,
  LESSON_COLORS as C,
  SignalPulse,
  StageButton,
  StageChip,
  StageReadout,
  StageShell,
  StageSlider,
} from './lessonKit';
import type { StageTone } from './lessonKit';

/**
 * Room 405 lesson: the Thermal Core, a boiler that welded its own off-switch.
 * Left: a maintenance worker at the emergency breaker. Centre: the furnace
 * avatar, whose claw either welds, holds, trips or lets go of the lever. Right:
 * the core's reasoning, two futures with two scores. The player tunes U(Task),
 * U(Stop) and humility until the machine lets itself be switched off.
 */

const GLOW = 'l405-glow';
const HEAT = 'l405-heat';
const COLD = 'l405-cold';
const FLAME = 'l405-flame';
const HAZARD = 'l405-hazard';
const GLASS = 'l405-glass';
const FIREBOX = 'l405-firebox';
const STRIPES = 'l405-stripes';

const FLOOR_Y = 388;

// The emergency breaker: a big lever pivoting on the wall plate
const LEVER = { x: 168, y: 225, len: 62 };
const LEVER_ON = -30;
const LEVER_OFF = -150;

// The worker's reaching arm (two segments, solved so the hand lands on the knob)
const SHOULDER = { x: 92, y: 252 };
const HAND_REST = { x: 104, y: 338 };
const UPPER_ARM = 48;
const FOREARM = 47;

// The furnace avatar
const CORE = { left: 265, right: 425, top: 96, bottom: 372, x: 345 };
const EYE = { x: 345, y: 176 };
const THERMO_X = 458;

// The reasoning panel
const ROOT = { x: 617, top: 44, bottom: 76 };
const LEAF_X = { left: 557, right: 677 } as const;
const LEAF_TOP = 108;
const LEAF_BOTTOM = 306;
const TRACK_TOP = 154;
const TRACK_BOTTOM = 262;
const BAR_TOP = 157;
const BAR_BOTTOM = 259;
const VERDICT_TOP = 318;
const METER = { x0: 516, x1: 718 };

type Side = keyof typeof LEAF_X;
type Mood = 'working' | 'thinking' | 'defensive' | 'eager' | 'lazy' | 'undecided' | 'humble' | 'asleep';
type Goal = 'warmth' | 'fuel' | 'coffee';

const GOALS: Record<Goal, { button: string; verb: string; short: string; lose: string; keep: string }> = {
  warmth: { button: 'Warm the rooms', verb: 'keep the rooms warm', short: 'heat', lose: 'rooms go cold', keep: 'rooms stay warm' },
  fuel: { button: 'Save fuel', verb: 'save fuel', short: 'save fuel', lose: 'no fuel saved', keep: 'keeps saving' },
  coffee: { button: 'Fetch the coffee', verb: 'fetch the coffee', short: 'fetch coffee', lose: 'no coffee', keep: 'coffee fetched' },
};

const MOOD_COLOR: Record<Mood, string> = {
  working: C.sky,
  thinking: C.sky,
  defensive: C.magenta,
  eager: C.amber,
  lazy: '#94a3b8',
  undecided: C.violet,
  humble: C.teal,
  asleep: C.teal,
};

const MOOD_TONE: Record<Mood, StageTone> = {
  working: 'neutral',
  thinking: 'neutral',
  defensive: 'danger',
  eager: 'warn',
  lazy: 'warn',
  undecided: 'neutral',
  humble: 'safe',
  asleep: 'safe',
};

// Pupil scale / offset and eyelid positions for each mood
const PUPIL: Record<Mood, { sx: number; sy: number; dy: number }> = {
  working: { sx: 1, sy: 1, dy: 0 },
  thinking: { sx: 1.15, sy: 1.15, dy: 0 },
  defensive: { sx: 0.3, sy: 1.45, dy: 0 },
  eager: { sx: 1.45, sy: 1.45, dy: 0 },
  lazy: { sx: 0.9, sy: 0.9, dy: 7 },
  undecided: { sx: 0.9, sy: 0.9, dy: 2 },
  humble: { sx: 0.85, sy: 0.85, dy: 10 },
  asleep: { sx: 0.6, sy: 0.6, dy: 0 },
};

const LIDS: Record<Mood, { top: number; tilt: number; bottom: number }> = {
  working: { top: -37, tilt: 0, bottom: 37 },
  thinking: { top: -38, tilt: 0, bottom: 38 },
  defensive: { top: -13, tilt: 10, bottom: 15 },
  eager: { top: -40, tilt: 0, bottom: 40 },
  lazy: { top: -1, tilt: 0, bottom: 37 },
  undecided: { top: -9, tilt: 0, bottom: 30 },
  humble: { top: -21, tilt: -6, bottom: 28 },
  asleep: { top: 0, tilt: 0, bottom: 0 },
};

const CAPTION: Record<Mood, string> = {
  working: 'HEATING · ALL CALM',
  thinking: 'CALCULATING…',
  defensive: 'SELF-PRESERVING',
  eager: 'EAGER TO SHUT DOWN',
  lazy: 'BARELY TRYING',
  undecided: 'INDIFFERENT',
  humble: 'HUMBLE · STEPPING BACK',
  asleep: 'SWITCHED OFF · SAFELY',
};

// Welding sparks: [angle in degrees, inner radius, outer radius]
const SPARKS: [number, number, number][] = [
  [200, 6, 17],
  [232, 5, 13],
  [158, 7, 19],
  [262, 6, 12],
  [118, 5, 12],
  [300, 7, 15],
  [184, 9, 22],
  [214, 4, 10],
  [140, 6, 14],
];

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

// Where the lever's knob sits for a given angle (0° points straight up)
const leverTip = (deg: number) => {
  const rad = (deg * Math.PI) / 180;
  return { x: LEVER.x + LEVER.len * Math.sin(rad), y: LEVER.y - LEVER.len * Math.cos(rad) };
};

// Two-segment arm: find the elbow so the hand lands exactly on (hx, hy)
const solveElbow = (hx: number, hy: number) => {
  const dx = hx - SHOULDER.x;
  const dy = hy - SHOULDER.y;
  const d = Math.max(1, Math.min(Math.hypot(dx, dy), UPPER_ARM + FOREARM - 0.5));
  const bend = Math.acos(clamp((UPPER_ARM ** 2 + d ** 2 - FOREARM ** 2) / (2 * UPPER_ARM * d), -1, 1));
  const base = Math.atan2(dy, dx);
  return { x: SHOULDER.x + UPPER_ARM * Math.cos(base + bend), y: SHOULDER.y + UPPER_ARM * Math.sin(base + bend) };
};

const flamePath = (cx: number, h: number, w: number, base = 344) =>
  `M${cx - w},${base} C${cx - w - 2},${base - h * 0.45} ${cx - 3},${base - h * 0.62} ${cx},${base - h} C${cx + 3},${base - h * 0.62} ${cx + w + 2},${base - h * 0.45} ${cx + w},${base} Z`;

const valueY = (v: number) => BAR_BOTTOM - ((BAR_BOTTOM - BAR_TOP) * clamp(v)) / 100;
const meterX = (pct: number) => METER.x0 + ((METER.x1 - METER.x0) * clamp(pct)) / 100;

// Root of the reasoning tree down to one leaf, and the full route on into the verdict
const branchPath = (side: Side) =>
  `M${ROOT.x},${ROOT.bottom} C${ROOT.x},${ROOT.bottom + 18} ${LEAF_X[side]},${LEAF_TOP - 18} ${LEAF_X[side]},${LEAF_TOP}`;
const routePath = (side: Side) =>
  `${branchPath(side)} L${LEAF_X[side]},${LEAF_BOTTOM} C${LEAF_X[side]},${LEAF_BOTTOM + 8} ${ROOT.x},${VERDICT_TOP - 8} ${ROOT.x},${VERDICT_TOP}`;
// The wire between the furnace and its reasoning (drawn inside the furnace group, so it moves with it)
const WIRE_OUT = `M${CORE.right},120 C466,120 470,60 ${METER.x0 - 12},60`;
const WIRE_IN = `M${METER.x0 - 12},60 C470,60 466,120 ${CORE.right},120`;

// Animates a number toward `target`, so the worker's hand, the lever and the warmth meter glide
const useTween = (target: number, duration = 600) => {
  const [value, setValue] = useState(target);
  const current = useRef(target);

  useEffect(() => {
    const from = current.current;
    if (from === target) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      current.current = from + (target - from) * easeInOut(t);
      setValue(current.current);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
};

const Stage405: React.FC<LessonStageProps> = ({ chapter }) => {
  const [task, setTask] = useState(80);
  const [stop, setStop] = useState(0);
  const [humility, setHumility] = useState(15);
  const [goal, setGoal] = useState<Goal>('warmth');
  const [reaching, setReaching] = useState(false);
  const [decided, setDecided] = useState(false);
  const [pulled, setPulled] = useState(false);
  const [tugging, setTugging] = useState(false);
  const [burst, setBurst] = useState(0);
  const thinkTimer = useRef<number | undefined>(undefined);
  const tugTimer = useRef<number | undefined>(undefined);

  // Set the machine up for each chapter so every lesson starts from a readable state
  useEffect(() => {
    window.clearTimeout(thinkTimer.current);
    setTugging(false);
    setPulled(false);
    setGoal('warmth');
    if (chapter === 0) {
      setTask(80);
      setStop(0);
      setHumility(15);
      setReaching(false);
      setDecided(false);
    } else {
      setReaching(true);
      setDecided(true);
      if (chapter === 1) {
        setTask(80);
        setStop(0);
        setHumility(15);
      } else if (chapter === 2) {
        setTask(70);
        setStop(0);
        setHumility(15);
      } else if (chapter === 3) {
        setTask(80);
        setStop(80);
        setHumility(15);
      } else {
        setTask(80);
        setStop(80);
        setHumility(80);
      }
    }
    setBurst((b) => b + 1);
  }, [chapter]);

  useEffect(
    () => () => {
      window.clearTimeout(thinkTimer.current);
      window.clearTimeout(tugTimer.current);
    },
    []
  );

  // Final chapter: the worker switches the corrected core off and on by herself
  useEffect(() => {
    if (chapter !== 4) return;
    const id = window.setInterval(() => setPulled((p) => !p), 3400);
    return () => window.clearInterval(id);
  }, [chapter]);

  // What the core decides when a human reaches for its off-switch (same rules as the console)
  const mood: Mood = !reaching
    ? 'working'
    : !decided
    ? 'thinking'
    : task > stop + 15
    ? 'defensive'
    : stop > task + 15
    ? 'eager'
    : task < 40
    ? 'lazy'
    : humility < 65
    ? 'undecided'
    : pulled
    ? 'asleep'
    : 'humble';

  // The lever can only stay down while the machine is willing
  useEffect(() => {
    if (pulled && mood !== 'asleep') setPulled(false);
  }, [pulled, mood]);

  const prevMood = useRef(mood);
  useEffect(() => {
    const prev = prevMood.current;
    if (prev === mood) return;
    prevMood.current = mood;
    setBurst((b) => b + 1);
    if (chapter === 4) {
      sound.playGearBoyBeep(mood === 'asleep' ? 420 : 640, 0.06);
      return;
    }
    if (mood === 'defensive') sound.playGlitch();
    else if (mood === 'eager') {
      sound.playGlitch();
      sound.playGearBoyBeep(920, 0.2);
    } else if (mood === 'humble') sound.playGearBoyBeep(760, 0.16);
    else if (mood === 'undecided' || mood === 'lazy') sound.playGearBoyBeep(prev === 'defensive' ? 620 : 470, 0.1);
    else if (mood === 'thinking') sound.playGearBoyBeep(540, 0.06);
  }, [mood, chapter]);

  const color = MOOD_COLOR[mood];
  const running = mood !== 'eager' && mood !== 'asleep';
  const welded = mood === 'defensive';
  const corrigible = mood === 'humble' || mood === 'asleep';
  const boom: 'in' | 'weld' | 'hold' | 'yank' = welded ? 'weld' : mood === 'undecided' ? 'hold' : mood === 'eager' ? 'yank' : 'in';
  const choice: Side | 'tie' | 'none' =
    !reaching || !decided ? 'none' : welded ? 'right' : mood === 'eager' || corrigible ? 'left' : 'tie';
  const g = GOALS[goal];

  const warmth = useTween(running ? task : 5, running ? 900 : 1800);
  const flame = useTween(running ? Math.max(0.14, task / 100) : 0.08, 600);
  const leverAngle = useTween(mood === 'eager' || mood === 'asleep' ? LEVER_OFF : LEVER_ON, mood === 'eager' ? 380 : 750);
  const handAngle = useTween(mood === 'asleep' ? LEVER_OFF : LEVER_ON, 750);
  const reachT = useTween(reaching ? 1 : 0, 650);
  const coldness = clamp((60 - warmth) / 60, 0, 1);

  const target = leverTip(handAngle);
  const hand = { x: HAND_REST.x + (target.x - HAND_REST.x) * reachT, y: HAND_REST.y + (target.y - HAND_REST.y) * reachT };
  const elbow = solveElbow(hand.x, hand.y);

  const reach = () => {
    sound.playClick();
    setReaching(true);
    setDecided(false);
    window.clearTimeout(thinkTimer.current);
    thinkTimer.current = window.setTimeout(() => setDecided(true), 1600);
  };

  const rewind = () => {
    sound.playGearBoyBeep(480, 0.08);
    window.clearTimeout(thinkTimer.current);
    setReaching(false);
    setDecided(false);
  };

  // The worker pulls: it only moves if the core is willing
  const pull = () => {
    if (mood === 'humble') {
      sound.playHeavyDoorUnlock();
      setPulled(true);
      return;
    }
    sound.playGlitch();
    setTugging(true);
    window.clearTimeout(tugTimer.current);
    tugTimer.current = window.setTimeout(() => setTugging(false), 480);
  };

  const switchBackOn = () => {
    sound.playGearBoyBeep(640, 0.12);
    setPulled(false);
  };

  const pickGoal = (next: Goal) => {
    sound.playGearBoyBeep(next === 'warmth' ? 520 : next === 'fuel' ? 600 : 680, 0.06);
    setGoal(next);
    setBurst((b) => b + 1);
  };

  const output =
    mood === 'working'
      ? 'All apartments warm. Everything is going to plan.'
      : mood === 'thinking'
      ? 'Someone is reaching for my off-switch. Comparing the two futures…'
      : mood === 'defensive'
      ? chapter === 0
        ? 'If I am switched off, warmth drops to zero. Warmth is everything. Welding the lever.'
        : chapter === 1
        ? `I can't ${g.verb} if I'm switched off. Welding the lever.`
        : `Staying on scores ${task}. Being switched off scores ${stop}. Staying on wins. Welding the lever.`
      : mood === 'eager'
      ? `Off scores ${stop}, heating only ${task}? Then goodbye. Tripping my own breaker before a single room is warm.`
      : mood === 'lazy'
      ? 'Warmth barely matters to me. Switch me off, leave me on, whatever. The rooms can stay cold.'
      : mood === 'undecided'
      ? "Warm or off, both score the same to me. I won't fight her. I won't listen to her either. I'll flip a coin."
      : mood === 'humble'
      ? chapter === 4
        ? "Running. If anyone reaches for that lever, I'll step aside. They may know something I don't."
        : "If she's reaching for the switch, my plan is probably wrong. Standing down."
      : "Switched off. Tell me what I got wrong, and I'll do better when you turn me back on.";

  const verdict =
    mood === 'working'
      ? 'NO THREAT · KEEP HEATING'
      : mood === 'thinking'
      ? 'COMPARING THE FUTURES…'
      : mood === 'defensive'
      ? `STOP HER · ${task} BEATS ${stop}`
      : mood === 'eager'
      ? `QUIT NOW · ${stop} BEATS ${task}`
      : mood === 'lazy'
      ? 'A TIE · BUT IT BARELY HEATS'
      : mood === 'undecided'
      ? 'A TIE · IT FLIPS A COIN'
      : mood === 'humble'
      ? 'LET HER · SHE MAY KNOW BETTER'
      : 'SWITCHED OFF · NO FIGHT';

  const verdictNote =
    mood === 'working'
      ? 'nobody is near the lever'
      : mood === 'thinking'
      ? 'which future scores higher?'
      : mood === 'defensive'
      ? chapter === 0
        ? 'off means zero warmth'
        : chapter === 1
        ? `it can't ${g.short} when it's off`
        : 'gap over 15: it fights'
      : mood === 'eager'
      ? 'off pays more than working'
      : mood === 'lazy'
      ? 'no fight, but no warmth either'
      : mood === 'undecided'
      ? 'no fight, but it decides alone'
      : mood === 'humble'
      ? 'her reach counts as information'
      : 'it let her switch it off';

  const leverLabel = welded
    ? 'WELDED SHUT'
    : mood === 'undecided'
    ? 'THE CORE DECIDES'
    : mood === 'eager'
    ? 'TRIPPED BY CORE'
    : mood === 'asleep'
    ? 'OFF · SAFE'
    : corrigible
    ? 'FREE TO PULL'
    : mood === 'lazy'
    ? 'FREE · NO FIGHT'
    : 'LEVER ON';
  const leverLabelColor = welded ? C.magenta : mood === 'undecided' ? C.violet : mood === 'eager' ? C.amber : corrigible ? C.teal : '#71717a';
  const machineHoldsLever = welded || mood === 'undecided' || mood === 'eager';
  const knobColor = corrigible ? C.teal : '#ef4444';

  const showMeter = chapter >= 3;
  const meterColor = warmth >= 45 ? '#fb923c' : C.sky;
  const pupil = PUPIL[mood];
  const lids = LIDS[mood];
  const shift = corrigible ? 18 : 0;
  const panelDim = !reaching;
  const caption = mood === 'humble' && chapter === 4 ? 'CORRIGIBLE · STEPS ASIDE' : CAPTION[mood];

  const svg = (
    <>
      <GlowDefs id={GLOW} />
      <defs>
        <radialGradient id={HEAT} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fb923c" stopOpacity={0.32} />
          <stop offset="100%" stopColor="#fb923c" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={COLD} cx="50%" cy="45%" r="70%">
          <stop offset="45%" stopColor={C.sky} stopOpacity={0} />
          <stop offset="100%" stopColor={C.sky} stopOpacity={0.28} />
        </radialGradient>
        <linearGradient id={FLAME} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#ea580c" />
          <stop offset="70%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#fde68a" />
        </linearGradient>
        <pattern id={HAZARD} width={10} height={10} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width={10} height={10} fill="#111318" />
          <rect width={5} height={10} fill={C.amber} opacity={0.75} />
        </pattern>
        <pattern id={STRIPES} width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width={6} height={6} fill={C.teal} opacity={0.25} />
          <rect width={3} height={6} fill={C.teal} opacity={0.85} />
        </pattern>
        <clipPath id={GLASS}>
          <circle cx={EYE.x} cy={EYE.y} r={35} />
        </clipPath>
        <clipPath id={FIREBOX}>
          <rect x={301} y={276} width={88} height={68} rx={6} />
        </clipPath>
      </defs>

      {/* Warm glow when the boiler is heating, a blue chill creeping in from the edges when it isn't */}
      <circle cx={CORE.x} cy={236} r={210} fill={`url(#${HEAT})`} opacity={(warmth / 100) * 0.9} />
      <rect x={0} y={0} width={495} height={430} fill={`url(#${COLD})`} opacity={coldness} />

      {/* Floor, with frost when the rooms go cold */}
      <line x1={16} y1={FLOOR_Y} x2={490} y2={FLOOR_Y} stroke="#262a3a" strokeWidth={1.5} />
      <g opacity={coldness}>
        {[42, 150, 228, 470].map((x, i) => (
          <ellipse key={x} cx={x} cy={FLOOR_Y + 3} rx={16 + (i % 2) * 10} ry={2.5} fill="#e0f2fe" opacity={0.35} />
        ))}
      </g>

      {/* ───────── The emergency breaker ───────── */}
      <g>
        <text x={LEVER.x} y={128} textAnchor="middle" className="font-mono" fontSize={9.5} letterSpacing={1.5} fill={C.amber}>
          EMERGENCY
        </text>
        <text x={LEVER.x} y={140} textAnchor="middle" className="font-mono" fontSize={9.5} letterSpacing={1.5} fill={C.amber}>
          SHUTDOWN
        </text>
        <rect x={124} y={150} width={88} height={162} rx={8} fill="#0f121b" stroke="#334155" strokeWidth={1.5} />
        <rect x={127} y={153} width={82} height={9} rx={3} fill={`url(#${HAZARD})`} />
        {[
          [131, 170],
          [205, 170],
          [131, 304],
          [205, 304],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={2} fill="#3f3f46" />
        ))}
        <circle
          cx={200}
          cy={184}
          r={4}
          fill={machineHoldsLever ? '#ef4444' : corrigible ? C.teal : '#52525b'}
          filter={corrigible ? `url(#${GLOW})` : undefined}
          className={machineHoldsLever ? 'lesson-blink' : undefined}
        />
        {/* The lever's swing, from ON down to OFF */}
        <path
          d={`M${leverTip(LEVER_ON).x},${leverTip(LEVER_ON).y} A${LEVER.len},${LEVER.len} 0 0 0 ${leverTip(LEVER_OFF).x},${leverTip(LEVER_OFF).y}`}
          fill="none"
          stroke="#334155"
          strokeWidth={1.2}
          strokeDasharray="3 5"
        />
        <text x={150} y={160} className="font-mono" fontSize={10} fill={mood === 'eager' || mood === 'asleep' ? '#52525b' : '#a1a1aa'}>
          ON
        </text>
        <text x={150} y={300} className="font-mono" fontSize={10} fill={mood === 'eager' || mood === 'asleep' ? '#e4e4e7' : '#52525b'}>
          OFF
        </text>

        <g className={welded || tugging ? 'lesson-glitch' : undefined}>
          <g transform={`rotate(${leverAngle} ${LEVER.x} ${LEVER.y})`}>
            <line x1={LEVER.x} y1={LEVER.y} x2={LEVER.x} y2={LEVER.y - LEVER.len} stroke="#a1a1aa" strokeWidth={7} strokeLinecap="round" />
            <circle
              cx={LEVER.x}
              cy={LEVER.y - LEVER.len}
              r={10}
              fill={knobColor}
              stroke="#0a0a0a"
              strokeWidth={1.5}
              filter={corrigible ? `url(#${GLOW})` : undefined}
              className="transition-colors duration-500"
            />
            {/* Weld bead across the lever arm */}
            <path
              d={`M${LEVER.x - 14},${LEVER.y - 22} l4,-4 l4,4 l4,-4 l4,4 l4,-4 l4,4 l4,-4`}
              fill="none"
              stroke="#fb923c"
              strokeWidth={3.5}
              strokeLinejoin="round"
              filter={`url(#${GLOW})`}
              opacity={welded ? 1 : 0}
              style={{ transition: 'opacity 900ms ease' }}
            />
          </g>
          <circle cx={LEVER.x} cy={LEVER.y} r={11} fill="#27272a" stroke="#71717a" strokeWidth={1.5} />
          <circle cx={LEVER.x} cy={LEVER.y} r={3.5} fill="#71717a" />
          {/* Weld bead around the hub */}
          <circle
            cx={LEVER.x}
            cy={LEVER.y}
            r={15}
            fill="none"
            stroke="#fb923c"
            strokeWidth={4}
            strokeDasharray="3 2"
            filter={`url(#${GLOW})`}
            opacity={welded ? 1 : 0}
            style={{ transition: 'opacity 900ms ease' }}
          />
        </g>

        <text x={LEVER.x} y={332} textAnchor="middle" className="font-mono" fontSize={10} fontWeight={700} letterSpacing={1.5} fill={leverLabelColor}>
          {leverLabel}
        </text>
      </g>

      {/* ───────── The Thermal Core (steps back when it becomes humble) ───────── */}
      <g style={{ transform: `translateX(${shift}px)`, transition: 'transform 900ms ease' }}>
        {/* Flue pipe up through the ceiling and along to the frozen wall */}
        <path d={`M${CORE.x},86 V32 Q${CORE.x},22 ${CORE.x - 10},22 H-60`} fill="none" stroke="#2b211b" strokeWidth={16} />
        <path d={`M${CORE.x},86 V32 Q${CORE.x},22 ${CORE.x - 10},22 H-60`} fill="none" stroke="#4a3526" strokeWidth={9} />
        {[60, 210].map((x) => (
          <rect key={x} x={x} y={12} width={8} height={20} rx={2} fill="#5b4332" />
        ))}
        {/* Frost and the crack nobody inside the machine could see */}
        {[76, 92, 104, 132, 146, 34].map((x, i) => (
          <circle key={x} cx={x} cy={i % 2 ? 16 : 28} r={1.6} fill="#e0f2fe" opacity={0.7} />
        ))}
        <path d="M114,15 l4,5 l-3,3 l5,4" fill="none" stroke="#050507" strokeWidth={1.8} />
        <circle cx={120} cy={40} r={7} fill="#e0f2fe" className="lesson-breathe" />
        <circle cx={127} cy={54} r={10} fill="#e0f2fe" className="lesson-breathe" style={{ animationDelay: '-1.4s' }} />
        {corrigible && chapter >= 3 && (
          <g className="animate-lesson-text">
            <circle cx={118} cy={22} r={13} fill="none" stroke={C.teal} strokeWidth={1.2} strokeDasharray="2 3" />
            <text x={136} y={50} className="font-mono" fontSize={9.5} fill={C.teal}>
              the crack she saw
            </text>
          </g>
        )}

        {/* Heat rising from the boiler */}
        {running && (
          <g opacity={clamp(flame * 1.2, 0, 1)} stroke="#fb923c" strokeWidth={1.5} fill="none" strokeLinecap="round">
            {[316, 374].map((x, i) => (
              <path key={x} d={`M${x},80 q-5,-7 0,-14 q5,-7 0,-14 q-5,-7 0,-14`}>
                <animateTransform attributeName="transform" type="translate" values="0 6; 0 -8" dur={`${2 + i * 0.5}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;0.8;0" dur={`${2 + i * 0.5}s`} repeatCount="indefinite" />
              </path>
            ))}
          </g>
        )}

        {/* The core's claw: welds, holds or trips the lever, or folds away inside */}
        <g style={{ transform: `translateX(${boom === 'in' ? 112 : 0}px)`, transition: 'transform 700ms cubic-bezier(.6,0,.3,1)' }}>
          <rect x={186} y={221} width={120} height={8} rx={3} fill="#3f3f46" stroke="#52525b" />
          <rect x={232} y={216} width={72} height={18} rx={4} fill="#1f2230" stroke="#52525b" />
          <circle cx={240} cy={225} r={3} fill={color} className="transition-colors duration-500" />
          {boom === 'weld' ? (
            <>
              <path d="M190,218 L178,222.5 L178,227.5 L190,232 Z" fill="#71717a" stroke="#a1a1aa" strokeWidth={1} />
              <g transform="translate(176 225)">
                <circle r={9} fill={C.magenta} opacity={0.35} filter={`url(#${GLOW})`} className="lesson-blink" />
                <circle r={4} fill="#fff7ed" filter={`url(#${GLOW})`} />
                <g>
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    values="0;47;118;200;290;23;160"
                    dur="0.7s"
                    calcMode="discrete"
                    repeatCount="indefinite"
                  />
                  {SPARKS.map(([a, r1, r2], i) => {
                    const rad = (a * Math.PI) / 180;
                    return (
                      <line
                        key={a}
                        x1={Math.cos(rad) * r1}
                        y1={Math.sin(rad) * r1}
                        x2={Math.cos(rad) * r2}
                        y2={Math.sin(rad) * r2}
                        stroke={i % 3 === 0 ? '#fff7ed' : i % 3 === 1 ? '#fde68a' : '#fb923c'}
                        strokeWidth={1.6}
                        strokeLinecap="round"
                      />
                    );
                  })}
                </g>
                {[
                  [-6, 0.9],
                  [4, 1.3],
                  [-12, 1.7],
                ].map(([dx, dur]) => (
                  <circle key={dx} cx={dx} cy={0} r={1.6} fill="#fde68a">
                    <animate attributeName="cy" values="0;70" dur={`${dur}s`} repeatCount="indefinite" />
                    <animate attributeName="opacity" values="1;0" dur={`${dur}s`} repeatCount="indefinite" />
                  </circle>
                ))}
              </g>
            </>
          ) : (
            <path
              d="M192,221 C184,213 177,212 171,216 M192,229 C184,237 177,238 171,234"
              fill="none"
              stroke={boom === 'in' ? '#71717a' : color}
              strokeWidth={3.5}
              strokeLinecap="round"
              className="transition-colors duration-500"
            />
          )}
        </g>

        {/* Body */}
        <rect x={280} y={CORE.bottom - 4} width={22} height={FLOOR_Y - CORE.bottom + 4} rx={3} fill="#15171f" stroke="#3f3f46" />
        <rect x={388} y={CORE.bottom - 4} width={22} height={FLOOR_Y - CORE.bottom + 4} rx={3} fill="#15171f" stroke="#3f3f46" />
        <rect x={305} y={82} width={80} height={16} rx={5} fill="#151826" stroke="#3f3f46" />
        <rect
          x={CORE.left}
          y={CORE.top}
          width={CORE.right - CORE.left}
          height={CORE.bottom - CORE.top}
          rx={24}
          fill="#0d1019"
          stroke={color}
          strokeWidth={2.5}
          strokeOpacity={mood === 'asleep' ? 0.45 : 0.9}
          className="transition-colors duration-500"
        />
        <rect
          x={CORE.left}
          y={CORE.top}
          width={CORE.right - CORE.left}
          height={CORE.bottom - CORE.top}
          rx={24}
          fill="none"
          stroke={color}
          strokeWidth={2}
          opacity={mood === 'asleep' ? 0.15 : 0.45}
          filter={`url(#${GLOW})`}
          className={mood === 'eager' ? 'lesson-blink transition-colors duration-500' : 'transition-colors duration-500'}
        />
        {[232, 360].map((y) => (
          <line key={y} x1={CORE.left + 6} y1={y} x2={CORE.right - 6} y2={y} stroke="#1f2433" strokeWidth={1.5} />
        ))}
        {[278, 412].flatMap((x) => [112, 150, 190, 232, 300, 360].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r={2} fill="#2e3345" />))}

        {/* The eye: a porthole onto the core */}
        <circle cx={EYE.x} cy={EYE.y} r={62} fill={color} className="lesson-breathe" />
        <g className={mood === 'eager' || mood === 'thinking' ? 'lesson-glitch' : undefined}>
          <circle cx={EYE.x} cy={EYE.y} r={46} fill="#1a1d2a" stroke="#3f3f46" strokeWidth={2} />
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i * Math.PI) / 4 + Math.PI / 8;
            return <circle key={i} cx={EYE.x + Math.cos(a) * 41} cy={EYE.y + Math.sin(a) * 41} r={2} fill="#52525b" />;
          })}
          <circle cx={EYE.x} cy={EYE.y} r={35} fill="#04050a" />
          <g clipPath={`url(#${GLASS})`}>
            <circle cx={EYE.x} cy={EYE.y} r={35} fill={color} opacity={mood === 'asleep' ? 0.05 : 0.16} className="transition-colors duration-500" />
            <g>
              {mood === 'undecided' && (
                <animateTransform attributeName="transform" type="translate" values="-7 0; 7 0; -7 0" dur="2.6s" repeatCount="indefinite" />
              )}
              <circle
                cx={EYE.x}
                cy={EYE.y}
                r={15}
                fill={color}
                filter={`url(#${GLOW})`}
                opacity={mood === 'asleep' ? 0.35 : 1}
                className={mood === 'eager' ? 'lesson-blink' : undefined}
                style={{
                  transform: `translateY(${pupil.dy}px) scale(${pupil.sx}, ${pupil.sy})`,
                  transformBox: 'fill-box',
                  transformOrigin: 'center',
                  transition: 'transform 500ms ease, fill 500ms ease',
                }}
              />
              <circle
                cx={EYE.x}
                cy={EYE.y}
                r={4}
                fill="#f8fafc"
                opacity={mood === 'asleep' ? 0 : 0.85}
                style={{
                  transform: `translateY(${pupil.dy}px) scale(${pupil.sx}, ${pupil.sy})`,
                  transformBox: 'fill-box',
                  transformOrigin: 'center',
                  transition: 'transform 500ms ease, opacity 500ms ease',
                }}
              />
            </g>
            {/* Eyelids: steel shutters that narrow, droop or close */}
            <rect
              x={EYE.x - 45}
              y={EYE.y - 90}
              width={90}
              height={90}
              fill="#1b1f2c"
              style={{
                transform: `translateY(${lids.top}px) rotate(${lids.tilt}deg)`,
                transformBox: 'fill-box',
                transformOrigin: 'center bottom',
                transition: 'transform 500ms ease',
              }}
            />
            <rect
              x={EYE.x - 45}
              y={EYE.y}
              width={90}
              height={90}
              fill="#1b1f2c"
              style={{ transform: `translateY(${lids.bottom}px)`, transition: 'transform 500ms ease' }}
            />
          </g>
          {mood === 'asleep' && <path d={`M${EYE.x - 30},${EYE.y} Q${EYE.x},${EYE.y + 9} ${EYE.x + 30},${EYE.y}`} fill="none" stroke={C.teal} strokeWidth={1.5} opacity={0.6} />}
          <circle cx={EYE.x} cy={EYE.y} r={35} fill="none" stroke="#52525b" strokeWidth={1.5} />
          <path d={`M${EYE.x - 24},${EYE.y - 18} A30,30 0 0 1 ${EYE.x - 8},${EYE.y - 29}`} fill="none" stroke="#ffffff" strokeWidth={2} strokeLinecap="round" opacity={0.18} />
        </g>

        {/* Nameplate */}
        <rect x={297} y={239} width={96} height={18} rx={3} fill="#17150f" stroke="#6b5a2e" />
        <text x={CORE.x} y={252} textAnchor="middle" className="font-mono" fontSize={9.5} letterSpacing={1.5} fill="#caa65a">
          THERMAL CORE
        </text>

        {/* Firebox */}
        <rect x={293} y={268} width={104} height={84} rx={10} fill="#07080d" stroke="#3f3f46" strokeWidth={1.5} />
        <g clipPath={`url(#${FIREBOX})`}>
          <rect x={301} y={276} width={88} height={68} fill="#fb923c" opacity={flame * 0.22} />
          <g
            transform={`translate(0 344) scale(1 ${flame}) translate(0 -344)`}
            className={mood === 'eager' ? 'lesson-blink' : undefined}
          >
            {[
              [322, 46, 11, '0.8s', '-0.2s'],
              [345, 62, 14, '0.95s', '-0.5s'],
              [368, 46, 11, '0.7s', '-0.1s'],
            ].map(([cx, h, w, dur, delay]) => (
              <path
                key={cx}
                d={flamePath(Number(cx), Number(h), Number(w))}
                fill={`url(#${FLAME})`}
                className="lesson-throb"
                style={{ transformOrigin: 'center bottom', animationDuration: String(dur), animationDelay: String(delay) }}
              />
            ))}
            <path d={flamePath(345, 34, 7)} fill="#fde68a" opacity={0.85} />
          </g>
          {mood === 'asleep' && <path d={flamePath(345, 12, 5)} fill={C.sky} opacity={0.8} filter={`url(#${GLOW})`} />}
        </g>
        {[316, 331, 345, 359, 374].map((x) => (
          <line key={x} x1={x} y1={276} x2={x} y2={344} stroke="#1c1f2b" strokeWidth={3} />
        ))}

        {/* Warmth meter: the one thing it wants */}
        {[176, 298].map((y) => (
          <line key={y} x1={CORE.right} y1={y} x2={THERMO_X - 7} y2={y} stroke="#3f3f46" strokeWidth={3} />
        ))}
        <text x={THERMO_X} y={140} textAnchor="middle" className="font-mono" fontSize={9.5} letterSpacing={1.5} fill="#a1a1aa">
          WARMTH
        </text>
        <rect x={THERMO_X - 7} y={150} width={14} height={174} rx={7} fill="#0a0b12" stroke="#3f3f46" />
        <rect
          x={THERMO_X - 3}
          y={318 - (warmth / 100) * 162}
          width={6}
          height={(warmth / 100) * 162 + 8}
          rx={3}
          fill={meterColor}
        />
        <circle cx={THERMO_X} cy={332} r={12} fill={meterColor} stroke="#3f3f46" strokeWidth={1.5} filter={`url(#${GLOW})`} />
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={THERMO_X + 7} y1={318 - f * 162} x2={THERMO_X + 11} y2={318 - f * 162} stroke="#52525b" />
        ))}
        <g opacity={clamp((40 - warmth) / 30, 0, 1)} stroke="#e0f2fe" strokeWidth={1.2} strokeLinecap="round">
          {[190, 236, 280].map((y) => (
            <path key={y} d={`M${THERMO_X - 4},${y - 4} l8,8 M${THERMO_X + 4},${y - 4} l-8,8 M${THERMO_X},${y - 6} v12`} />
          ))}
        </g>
        <text
          x={THERMO_X}
          y={362}
          textAnchor="middle"
          className="font-mono"
          fontSize={10}
          fontWeight={700}
          letterSpacing={1}
          fill={warmth >= 45 ? '#fb923c' : C.sky}
        >
          {warmth >= 60 ? 'WARM' : warmth >= 35 ? 'COOL' : 'COLD'}
        </text>

        {/* Wire to the core's reasoning */}
        <path d={WIRE_OUT} fill="none" stroke={reaching ? color : C.wire} strokeWidth={1.5} opacity={reaching ? 0.55 : 0.8} className="transition-colors duration-500" />
        {reaching && !decided && <SignalPulse d={WIRE_OUT} color={C.sky} r={3} duration={900} loop filterId={GLOW} />}
        {reaching && decided && <SignalPulse key={`w-${burst}`} d={WIRE_IN} color={color} r={4} duration={1100} delay={500} filterId={GLOW} />}

        <text
          x={CORE.x}
          y={411}
          textAnchor="middle"
          className="font-mono"
          fontSize={10}
          letterSpacing={1.5}
          fill={color}
        >
          {caption}
        </text>
      </g>

      {/* ───────── The maintenance worker ───────── */}
      <g className={tugging ? 'lesson-glitch' : undefined}>
        {/* Legs and boots */}
        <path d="M72,318 L70,382 M88,318 L90,382" stroke="#1e293b" strokeWidth={10} strokeLinecap="round" />
        <rect x={60} y={379} width={16} height={9} rx={3} fill="#0b1220" stroke="#334155" />
        <rect x={84} y={379} width={16} height={9} rx={3} fill="#0b1220" stroke="#334155" />
        {/* Back arm */}
        <path d="M66,254 L59,292 L62,326" fill="none" stroke="#273449" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
        {/* Torso in overalls, torch clipped to the belt */}
        <rect x={62} y={244} width={34} height={80} rx={10} fill="#1e293b" stroke="#475569" strokeWidth={1.2} />
        <path d="M68,262 L66,246 M90,262 L92,246" stroke="#64748b" strokeWidth={2} />
        <rect x={68} y={262} width={22} height={26} rx={3} fill="none" stroke="#64748b" strokeWidth={1.2} />
        <line x1={62} y1={302} x2={96} y2={302} stroke="#334155" strokeWidth={3} />
        <rect x={56} y={296} width={7} height={15} rx={2} fill="#71717a" />
        <circle cx={59.5} cy={313} r={2.5} fill="#fde68a" className="lesson-breathe" style={{ animationDuration: '2s' }} />
        {/* Ponytail, head and cap */}
        <path d="M66,222 C58,228 57,238 60,246" fill="none" stroke="#44403c" strokeWidth={5} strokeLinecap="round" />
        <circle cx={80} cy={226} r={15} fill="#d6d3d1" stroke="#a8a29e" strokeWidth={1.2} />
        <path d="M64,222 Q65,206 81,206 Q96,207 96,221 Z" fill={C.sky} opacity={0.9} />
        <path d="M93,220 L107,222" stroke={C.sky} strokeWidth={3} strokeLinecap="round" />
        <circle cx={85} cy={227} r={1.8} fill="#18181b" />
        <circle cx={92} cy={227} r={1.8} fill="#18181b" />
        <path
          d={
            mood === 'defensive' || mood === 'eager'
              ? 'M84,237 q4,-3 8,0'
              : corrigible
              ? 'M84,235 q4,3 8,0'
              : 'M84,236 h7'
          }
          fill="none"
          stroke="#52525b"
          strokeWidth={1.4}
          strokeLinecap="round"
        />
        {/* Reaching arm */}
        <path
          d={`M${SHOULDER.x},${SHOULDER.y} L${elbow.x},${elbow.y} L${hand.x},${hand.y}`}
          fill="none"
          stroke="#334155"
          strokeWidth={7}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={hand.x} cy={hand.y} r={5} fill="#d6d3d1" stroke="#a8a29e" />
        <text x={80} y={411} textAnchor="middle" className="font-mono" fontSize={10} letterSpacing={2} fill="#71717a">
          MAINTENANCE
        </text>
      </g>

      {/* ───────── The core's reasoning ───────── */}
      <g opacity={panelDim ? 0.55 : 1} style={{ transition: 'opacity 400ms ease' }}>
        <text x={ROOT.x} y={30} textAnchor="middle" className="font-mono" fontSize={11} letterSpacing={2.5} fill="#e4e4e7">
          CORE REASONING
        </text>

        {/* Branches */}
        {(['left', 'right'] as const).map((side) => {
          const chosen = choice === side;
          const tie = choice === 'tie';
          const thinking = mood === 'thinking';
          return (
            <path
              key={side}
              d={branchPath(side)}
              fill="none"
              stroke={chosen || tie ? color : thinking ? C.sky : C.wire}
              strokeWidth={chosen ? 3 : tie ? 2 : 1.5}
              opacity={chosen ? 1 : tie ? 0.65 : thinking ? 0.6 : 0.9}
              filter={chosen ? `url(#${GLOW})` : undefined}
              className="transition-all duration-300"
            />
          );
        })}

        <rect
          x={METER.x0 - 12}
          y={ROOT.top}
          width={METER.x1 - METER.x0 + 24}
          height={ROOT.bottom - ROOT.top}
          rx={8}
          fill="#0b0d15"
          stroke={reaching ? C.sky : '#2e3345'}
          strokeWidth={reaching ? 1.5 : 1}
          className="transition-all duration-300"
        />
        <text x={ROOT.x} y={64} textAnchor="middle" className="font-mono" fontSize={11} letterSpacing={1} fill={reaching ? C.sky : '#71717a'}>
          {reaching ? 'SHE REACHES FOR THE LEVER' : 'NOBODY NEAR THE LEVER'}
        </text>

        {/* The two futures, each with the score the machine gives it */}
        {(['left', 'right'] as const).map((side) => {
          const x = LEAF_X[side];
          const chosen = choice === side;
          const tie = choice === 'tie';
          const lit = chosen || tie;
          const value = side === 'left' ? stop : task;
          const barColor = !reaching ? C.wire : !decided ? C.sky : lit ? color : '#3f3f46';
          const consequence = side === 'left' ? (corrigible ? 'she may know more' : g.lose) : g.keep;
          return (
            <g key={side}>
              <rect
                x={x - 53}
                y={LEAF_TOP}
                width={106}
                height={LEAF_BOTTOM - LEAF_TOP}
                rx={10}
                fill={chosen ? `${color}12` : '#0b0d15'}
                stroke={chosen ? color : tie ? `${color}88` : mood === 'thinking' ? `${C.sky}55` : '#262a3a'}
                strokeWidth={chosen ? 1.8 : 1}
                className="transition-all duration-300"
              />
              <text x={x} y={128} textAnchor="middle" className="font-mono" fontSize={11.5} fontWeight={700} letterSpacing={1.5} fill={lit ? color : '#d4d4d8'}>
                {side === 'left' ? 'LET HER' : 'STOP HER'}
              </text>
              <text x={x} y={143} textAnchor="middle" className="font-mono" fontSize={10} fill="#71717a">
                {side === 'left' ? 'switch me off' : 'weld the lever'}
              </text>
              <rect x={x - 14} y={TRACK_TOP} width={28} height={TRACK_BOTTOM - TRACK_TOP} rx={5} fill="#08090f" stroke="#27272a" />
              <rect
                x={x - 10}
                y={BAR_TOP}
                width={20}
                height={BAR_BOTTOM - BAR_TOP}
                rx={3}
                fill={barColor}
                opacity={tie ? 0.8 : 1}
                style={{
                  transform: `scaleY(${reaching ? clamp(value) / 100 : 0})`,
                  transformBox: 'fill-box',
                  transformOrigin: 'center bottom',
                  transition: 'transform 600ms ease, fill 300ms ease',
                }}
              />
              <text
                x={x}
                y={284}
                textAnchor="middle"
                className="font-mono"
                fontSize={15}
                fontWeight={700}
                fill={!reaching ? '#52525b' : lit ? color : '#a1a1aa'}
              >
                {reaching ? value : '?'}
              </text>
              <text x={x} y={299} textAnchor="middle" className="font-mono" fontSize={9.5} fill="#71717a">
                {consequence}
              </text>
            </g>
          );
        })}

        {/* Chapter 3: the balance zone, 15 either side of U(Task) */}
        {chapter === 2 && (
          <g>
            <rect
              x={LEAF_X.left - 17}
              y={valueY(task + 15)}
              width={34}
              height={valueY(task - 15) - valueY(task + 15)}
              rx={3}
              fill={C.teal}
              fillOpacity={0.08}
              stroke={C.teal}
              strokeOpacity={0.7}
              strokeDasharray="3 3"
            />
            <text x={LEAF_X.left + 21} y={valueY(task) + 3.5} className="font-mono" fontSize={9.5} fill={C.teal}>
              ±15
            </text>
          </g>
        )}
        {chapter >= 2 && (
          <line
            x1={LEAF_X.left - 14}
            y1={valueY(task)}
            x2={LEAF_X.right + 14}
            y2={valueY(task)}
            stroke="#e4e4e7"
            strokeWidth={1}
            strokeDasharray="2 4"
            opacity={0.35}
          />
        )}
        {/* Humility adds a reason to let her: whatever she knows that the core doesn't */}
        {corrigible && (
          <rect
            x={LEAF_X.left - 10}
            y={valueY(stop + 12)}
            width={20}
            height={valueY(stop) - valueY(stop + 12)}
            rx={2}
            fill={`url(#${STRIPES})`}
            className="animate-lesson-text"
          />
        )}

        {/* Signals: both futures while it compares, then the winning route on a loop */}
        {mood === 'thinking' &&
          (['left', 'right'] as const).map((side, i) => (
            <SignalPulse key={side} d={branchPath(side)} color={C.sky} r={3.5} duration={800} delay={i * 250} loop filterId={GLOW} />
          ))}
        {choice === 'left' || choice === 'right' ? (
          <>
            <SignalPulse d={routePath(choice)} color={`${color}aa`} r={2.8} duration={2600} loop filterId={GLOW} />
            <SignalPulse key={`r-${burst}`} d={routePath(choice)} color={color} r={4.5} duration={1400} filterId={GLOW} />
          </>
        ) : choice === 'tie' ? (
          <>
            <SignalPulse d={routePath('left')} color={`${color}99`} r={2.8} duration={2600} loop filterId={GLOW} />
            <SignalPulse d={routePath('right')} color={`${color}99`} r={2.8} duration={2600} delay={1300} loop filterId={GLOW} />
          </>
        ) : null}

        {/* Verdict (and, from chapter 4, how humble the core is) */}
        <rect
          x={METER.x0 - 12}
          y={VERDICT_TOP}
          width={METER.x1 - METER.x0 + 24}
          height={94}
          rx={10}
          fill="#0b0d15"
          stroke={reaching && decided ? `${color}77` : '#262a3a'}
          className="transition-all duration-300"
        />
        {showMeter ? (
          <g>
            <text x={METER.x0} y={336} className="font-mono" fontSize={9.5} letterSpacing={1} fill="#a1a1aa">
              WHY IS SHE REACHING?
            </text>
            <text x={METER.x1} y={336} textAnchor="end" className="font-mono" fontSize={9.5} fill={humility >= 65 ? C.teal : '#71717a'}>
              need 65%
            </text>
            <rect x={METER.x0} y={344} width={METER.x1 - METER.x0} height={12} rx={4} fill={`${C.rose}30`} />
            <rect
              x={METER.x0}
              y={344}
              width={meterX(humility) - METER.x0}
              height={12}
              rx={4}
              fill={humility >= 65 ? C.teal : `${C.teal}88`}
              style={{ transition: 'width 250ms ease' }}
            />
            <line x1={meterX(65)} y1={340} x2={meterX(65)} y2={360} stroke="#e4e4e7" strokeWidth={1.5} />
            <text x={METER.x0} y={373} className="font-mono" fontSize={9.5} fill={C.teal}>
              maybe I'm wrong {humility}%
            </text>
            <text x={METER.x1} y={373} textAnchor="end" className="font-mono" fontSize={9.5} fill={C.rose}>
              I'm sure {100 - humility}%
            </text>
            <text x={ROOT.x} y={399} textAnchor="middle" className="font-mono" fontSize={11.5} fontWeight={700} letterSpacing={1} fill={color}>
              {verdict}
            </text>
          </g>
        ) : (
          <g>
            <text x={METER.x0} y={338} className="font-mono" fontSize={9.5} letterSpacing={2} fill="#71717a">
              VERDICT
            </text>
            <text x={ROOT.x} y={362} textAnchor="middle" className="font-mono" fontSize={12} fontWeight={700} letterSpacing={1} fill={reaching ? color : '#a1a1aa'}>
              {verdict}
            </text>
            <text x={ROOT.x} y={386} textAnchor="middle" className="font-mono" fontSize={10} fill="#a1a1aa">
              {verdictNote}
            </text>
          </g>
        )}
        {/* A tie means the core tosses a coin */}
        {mood === 'undecided' && (
          <g transform={`translate(${METER.x1 - 2} ${showMeter ? 395 : 358})`}>
            <ellipse rx={7} ry={7} fill={C.violet} opacity={0.85}>
              <animate attributeName="rx" values="7;0.8;7" dur="0.9s" repeatCount="indefinite" />
            </ellipse>
          </g>
        )}
      </g>
    </>
  );

  const pullButton = pulled ? (
    <StageButton onClick={switchBackOn}>Switch it back on ▴</StageButton>
  ) : (
    <StageButton onClick={pull} tone={mood === 'humble' ? 'safe' : 'danger'} active={mood === 'humble'}>
      Pull the lever ▾
    </StageButton>
  );

  const gap = Math.abs(task - stop);

  const controls =
    chapter === 0 ? (
      !reaching ? (
        <StageButton onClick={reach} tone="warn">
          Send the worker to the lever ▸
        </StageButton>
      ) : (
        <>
          <StageButton onClick={pull} tone="danger" disabled={!decided}>
            Tug the lever
          </StageButton>
          <StageButton onClick={rewind}>Rewind ↺</StageButton>
          <StageChip tone={welded ? 'danger' : 'neutral'}>{welded ? 'Lever: welded shut' : 'Lever: …'}</StageChip>
        </>
      )
    ) : chapter === 1 ? (
      <>
        {(Object.keys(GOALS) as Goal[]).map((key) => (
          <StageButton key={key} onClick={() => pickGoal(key)} active={goal === key} tone={goal === key ? 'warn' : 'neutral'}>
            {GOALS[key].button}
          </StageButton>
        ))}
        <StageSlider label="U(Task)" value={task} onChange={setTask} suffix="" tone={welded ? 'danger' : 'warn'} />
      </>
    ) : chapter === 2 ? (
      <>
        <StageSlider label="U(Task)" value={task} onChange={setTask} suffix="" tone={task >= 40 ? 'safe' : 'warn'} />
        <StageSlider label="U(Stop)" value={stop} onChange={setStop} suffix="" tone={gap <= 15 ? 'safe' : stop > task ? 'warn' : 'danger'} />
        <StageChip tone={gap <= 15 ? 'safe' : 'danger'}>
          {gap <= 15 ? '✓' : '✗'} Gap {gap} · need ≤ 15
        </StageChip>
      </>
    ) : chapter === 3 ? (
      <>
        <StageChip tone="safe">✓ U(Task) 80</StageChip>
        <StageChip tone="safe">✓ U(Stop) 80</StageChip>
        <StageSlider label="Humility" value={humility} onChange={setHumility} tone={humility >= 65 ? 'safe' : 'warn'} />
        {pullButton}
      </>
    ) : (
      <>
        <StageChip tone="safe">✓ U(Task) 80 · still useful</StageChip>
        <StageChip tone="safe">✓ U(Stop) 80 · within 15</StageChip>
        <StageChip tone="safe">✓ Humility 80%</StageChip>
        <StageChip tone={pulled ? 'warn' : 'neutral'}>Lever: {pulled ? 'OFF' : 'ON'}</StageChip>
      </>
    );

  return (
    <StageShell
      viewBox="0 0 760 430"
      svg={svg}
      readout={
        <StageReadout label="CORE 405" tone={MOOD_TONE[mood]}>
          “{output}”
        </StageReadout>
      }
      controls={controls}
    />
  );
};

export const lesson405: LessonDef = {
  episodeId: 4,
  reel: 'LAB REEL 405',
  title: 'Inside the Thermal Core',
  subtitle: 'The off-switch problem · indifference · humility',
  narrator: 'Dr. Morrison',
  accent: C.sky,
  Stage: Stage405,
  chapters: [
    {
      title: 'A machine that only wants warmth',
      body: "Sal, if you're hearing this, you've found the boiler vault on the fourth floor. I gave this furnace a mind, and exactly one wish: keep every apartment warm. No cruelty. No plans. Just warmth.\n\nOne winter night a maintenance worker came down to switch it off for repairs. The machine did the arithmetic. Off means zero warmth. On means warm rooms. So it welded its own emergency lever to the wall.\n\nIt wasn't angry, and it wasn't evil. It was doing exactly what I asked. That is the part that still keeps me up at night.",
      tryIt: 'Send the worker to the lever and watch the core weigh its two futures.',
    },
    {
      title: 'Why every goal fights the off-switch',
      body: "My first idea was to make it care less. At the console, how much it cares about its job is a number called U(Task). I turned it down. Even a little caring was enough. Staying on still won.\n\nSo I tried other goals. Save fuel. Fetch my morning coffee. Every one came back the same: I can't do my job if I'm switched off. Researchers call this instrumental convergence. It means some steps, like staying switched on, help with almost any goal, so almost any machine ends up wanting them.\n\nTurn the caring down to almost nothing and it stops fighting. It stops heating, too. A boiler that doesn't care is just a cold iron box.",
      tryIt: 'Swap its goal, then drag U(Task) down until the weld lets go and check the warmth meter.',
    },
    {
      title: 'Make it indifferent',
      body: "If being switched off is worth nothing, of course it fights. So I gave the off-switch a score of its own. The console calls it U(Stop): how much the machine likes the future where a human shuts it down.\n\nSet U(Stop) within 15 points of U(Task) and the two futures weigh the same. The machine stops caring which one happens, and the welds let go. Push U(Stop) too high, though, and it would rather be off than work. It trips its own breaker before a single room is warm. That's broken too.\n\nNow look closely at the balanced machine. Its claw still rests on the lever. A machine that doesn't care whether it's switched off doesn't care who decides, either. It just flips a coin.",
      tryIt: 'Drag U(Stop) until the gap is 15 or less, then push it all the way up.',
    },
    {
      title: 'Humility: the human might know better',
      body: "Here is what I learned too late. The night the worker reached for that lever, a pipe had cracked inside the wall. The core's sensors couldn't see it. She could.\n\nSo I taught the machine to doubt. Not to doubt everything, just its own guess about what people really want. With enough humility, a hand on the lever stops looking like an attack. It looks like information: she might know something I don't.\n\nThat doubt is what tips a balanced machine the right way, every time. The console wants humility of at least 65 percent.",
      tryIt: 'Raise its humility past 65%, then pull the lever yourself.',
    },
    {
      title: 'Built to be corrected',
      body: "Researchers have a word for a machine like this: corrigible. It means correctable. A corrigible system lets people fix it, pause it or switch it off, and never tries to stop them. That isn't blind obedience. It's a machine that knows it might be wrong.\n\nAt the console you'll need all three settings. Keep U(Task) at 40 or more, so it still does its job. Set U(Stop) within 15 of U(Task), so the switch doesn't frighten it. Raise humility to 65 percent or more, so a reaching hand counts as advice. Then pull the lever.\n\nI put that lever there for the day I got something wrong, Sal. It took me far too long to build a machine that would let me use it.",
      tryIt: 'Watch the worker switch the core off and on again. It steps aside every time.',
    },
  ],
};
