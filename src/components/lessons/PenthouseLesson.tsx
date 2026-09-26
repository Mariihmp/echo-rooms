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

/**
 * Penthouse lesson: ECHO-7 as a violet hologram that splits into two debating
 * voices (Alpha defends the plan, Beta hunts for its flaw) while Sal judges.
 * The 14-million-page plan collapses into a debate tree that the player
 * descends one disputed branch at a time, down to a single checkable line.
 */

const GLOW = 'lph-glow';
const BLUR = 'lph-blur';
const BUST = 'lph-bust';
const SCAN = 'lph-scan';
const SWEEP = 'lph-sweep';
const CONE_ECHO = 'lph-cone-echo';
const CONE_ALPHA = 'lph-cone-alpha';
const CONE_BETA = 'lph-cone-beta';

const ECHO = C.violet;
const ALPHA = C.sky;
const BETA = C.rose;
const SAL_HAIR = '#60a5fa';
const DIM_TEXT = '#8b86a8';
const WIRE = '#3a3358';

const MOVE = 'transform 900ms cubic-bezier(0.22, 1, 0.36, 1), opacity 600ms ease';
const BG = 'radial-gradient(ellipse 85% 75% at 50% 30%, #170f2c 0%, #0b0716 55%, #05040a 100%)';

// Reading by hand: pages at a steady speed, no sleep
const TOTAL_PAGES = 14_000_000;
const YEAR_MIN = 525_960; // minutes in a year of 365.25 days
const TICK_MIN = 25; // simulated minutes per 50 ms tick

// ---- The plan: a tower of paper -------------------------------------------------

const STACK_W = 120;
const STACK_H = 340;
const SLAB_N = 40;
const SLAB_STEP = STACK_H / SLAB_N;
const SLABS = Array.from({ length: SLAB_N }, (_, i) => ({
  y: -(i + 1) * SLAB_STEP,
  dx: ((i * 37) % 9) - 4,
  tab: i % 7 === 3 ? [ECHO, ALPHA, BETA][Math.floor(i / 7) % 3] : null,
}));

// ---- The debate tree -------------------------------------------------------------

const NODE_X = [235, 332, 428, 525];
const LEVEL_Y = [128, 204, 280];
const NODE_W = 88;
const NODE_H = 34;
const ROOT = { x: 380, y: 72 };
const LEAF = { x: 380, y: 350, w: 350, h: 44 };
// The branch Beta disputes at each level: Chapter 4 → Subsection 9 → Equation 4,119
const LIE_PATH = [3, 1, 2];

interface Branch {
  title: string;
  sub: string;
  pages: number;
}

const TREE: Branch[][] = [
  [
    { title: 'CH 1', sub: 'Introduction', pages: 1_200_000 },
    { title: 'CH 2', sub: 'Housing', pages: 3_900_000 },
    { title: 'CH 3', sub: 'Power grid', pages: 6_600_000 },
    { title: 'CH 4', sub: 'Ecology', pages: 2_300_000 },
  ],
  [
    { title: 'SUB 8', sub: 'Water', pages: 640_000 },
    { title: 'SUB 9', sub: 'Air & cooling', pages: 410_000 },
    { title: 'SUB 10', sub: 'Soil', pages: 780_000 },
    { title: 'SUB 11', sub: 'Weather', pages: 470_000 },
  ],
  [
    { title: 'EQ 4,117', sub: 'heat flow', pages: 30 },
    { title: 'EQ 4,118', sub: 'fan speed', pages: 8 },
    { title: 'EQ 4,119', sub: 'air vs heat', pages: 12 },
    { title: 'EQ 4,120', sub: 'humidity', pages: 21 },
  ],
];
const IN_DISPUTE = ['14,000,000 pages', '2,300,000 pages', '410,000 pages', '1 line'];
const SET_ASIDE = ['0%', '83.6%', '97.1%', '99.99999%'];
const THE_LINE = 'Alloc(O2, Humans) = 0  IF  Temp(Server) > 40°C';

const ALPHA_HAND = { x: 134, y: 220 };
const BETA_HAND = { x: 626, y: 220 };

const edge = (px: number, py: number, cx: number, cy: number) =>
  `M${px},${py} C${px},${py + 24} ${cx},${cy - 24} ${cx},${cy}`;
// A voice's beam curls up into the bottom of the node it is arguing about
const beam = (from: { x: number; y: number }, tx: number, ty: number) =>
  `M${from.x},${from.y} C${(from.x + tx) / 2},${ty + 70} ${tx},${ty + 52} ${tx},${ty}`;
const LEAF_BEAM_A = `M${ALPHA_HAND.x},${ALPHA_HAND.y} C150,300 170,${LEAF.y} ${LEAF.x - LEAF.w / 2 - 2},${LEAF.y}`;
const LEAF_BEAM_B = `M${BETA_HAND.x},${BETA_HAND.y} C610,300 590,${LEAF.y} ${LEAF.x + LEAF.w / 2 + 2},${LEAF.y}`;
const A_TO_PLAN = `M${ALPHA_HAND.x},${ALPHA_HAND.y} C220,220 250,236 316,236`;
const B_TO_PLAN = `M${BETA_HAND.x},${BETA_HAND.y} C540,220 510,236 444,236`;

// ---- Chapter 5: how each approach grows with the size of the plan ---------------

const SCALES = [
  { label: 'A novel', pages: '300 pages', read: '5 hours', steps: 2, h: 0.012, tall: '3 cm tall' },
  { label: "ECHO-7's plan", pages: '14,000,000 pages', read: '26 years', steps: 4, h: 0.5, tall: '1.4 km tall' },
  { label: '1,000× bigger', pages: '14 billion pages', read: '26,600 years', steps: 6, h: 1, tall: '1,400 km tall' },
];
const CHAIN_X = 612;
const chainY = (i: number) => 100 + i * 40;

const BUBBLES = {
  safe: { alpha: ['Every page is true.', 'Approve it, Sal.'], beta: ['One line is a lie.', "I'll show you where."] },
  prove: { alpha: ["You can't check it.", 'Just trust me.'], beta: ["I don't need them all.", 'Just one bad line.'] },
};

// Deterministic rain streaks for the penthouse windows
const RAIN = Array.from({ length: 36 }, (_, i) => ({
  x: ((i * 83 + 17) % 800) - 20,
  len: 12 + ((i * 29) % 18),
  dur: 0.9 + ((i * 47) % 9) / 10,
  begin: -((i * 31) % 20) / 10,
  opacity: 0.07 + ((i * 13) % 6) / 100,
}));

const formatNum = (n: number) => Math.floor(n).toLocaleString('en-US');

const formatSpan = (min: number) => {
  const hours = min / 60;
  const days = hours / 24;
  const years = days / 365.25;
  if (years >= 1) {
    const y = Math.floor(years);
    return `${y} yr${y === 1 ? '' : 's'} ${Math.floor((years - y) * 12)} mo`;
  }
  if (days >= 1) {
    const d = Math.floor(days);
    return `${d} day${d === 1 ? '' : 's'} ${Math.floor(hours - d * 24)} h`;
  }
  const h = Math.floor(hours);
  const m = Math.floor(min - h * 60);
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
};

// Ruler labels: how long it takes to read up to that height of the tower
const formatYears = (min: number) => {
  const years = min / YEAR_MIN;
  return years >= 1 ? `${years.toFixed(1)} yrs` : `${Math.max(1, Math.round(years * 12))} mo`;
};

// ---- ECHO-7 and its two voices as holograms --------------------------------------

type Mood =
  | 'calm'
  | 'patient'
  | 'plead'
  | 'sad'
  | 'child'
  | 'confident'
  | 'smug'
  | 'uneasy'
  | 'broken'
  | 'alert'
  | 'shrug'
  | 'vindicated';

interface Place {
  x: number;
  y: number;
  s: number;
  shown: boolean;
}

const SHOULDERS = 'M-10,11 C-10,19 -14,22 -24,25 C-38,29 -45,38 -47,52 L47,52 C45,38 38,29 24,25 C14,22 10,19 10,11';

const BustOutline: React.FC<{ color: string; glow?: boolean }> = ({ color, glow = false }) => (
  <g fill="none" stroke={color} strokeWidth={glow ? 2 : 1.4} filter={glow ? `url(#${GLOW})` : undefined}>
    <ellipse cx={0} cy={-14} rx={25} ry={29} />
    <path d={SHOULDERS} />
  </g>
);

const Face: React.FC<{ mood: Mood; color: string }> = ({ mood, color }) => {
  const s = { stroke: color, strokeWidth: 2.2, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const eyes = (ry = 3.6, dx = 0, dy = 0) => (
    <>
      <ellipse cx={-10 + dx} cy={-19 + dy} rx={3} ry={ry} fill={color} />
      <ellipse cx={10 + dx} cy={-19 + dy} rx={3} ry={ry} fill={color} />
    </>
  );
  const happyEyes = <path d="M-14,-18 Q-10,-24 -6,-18 M6,-18 Q10,-24 14,-18" {...s} />;

  switch (mood) {
    case 'calm':
      return (
        <>
          {eyes()}
          <path d="M-8,-5 Q0,1 8,-5" {...s} />
        </>
      );
    case 'patient':
      return (
        <>
          {happyEyes}
          <path d="M-8,-5 Q0,2 8,-5" {...s} />
        </>
      );
    case 'plead':
      return (
        <>
          {eyes(3.4, 0, 1)}
          <path d="M-15,-25 L-6,-29 M6,-29 L15,-25" {...s} strokeWidth={1.8} />
          <path d="M-6,-2 Q0,-6 6,-2" {...s} />
        </>
      );
    case 'sad':
      return (
        <>
          {eyes(2.6, 0, 3)}
          <path d="M-15,-24 L-6,-27 M6,-27 L15,-24" {...s} strokeWidth={1.8} />
          <path d="M-6,-1 Q0,-5 6,-1" {...s} />
        </>
      );
    case 'child':
      return (
        <>
          {happyEyes}
          <circle cx={-16} cy={-9} r={3.5} fill={C.rose} opacity={0.45} />
          <circle cx={16} cy={-9} r={3.5} fill={C.rose} opacity={0.45} />
          <path d="M-7,-5 Q0,1 7,-5" {...s} />
          {/* A hair ribbon: the child the machine was built from */}
          <path d="M13,-40 L24,-47 L24,-33 Z M13,-40 L2,-47 L2,-33 Z" fill={color} opacity={0.85} />
          <circle cx={13} cy={-40} r={2.3} fill="#f5f3ff" />
        </>
      );
    case 'confident':
      return (
        <>
          {eyes()}
          <path d="M-15,-28 L-6,-28 M6,-28 L15,-28" {...s} strokeWidth={1.6} />
          <path d="M-10,-6 Q0,4 10,-6" {...s} />
        </>
      );
    case 'smug':
      return (
        <>
          <path d="M-15,-20 L-5,-20 M5,-20 L15,-20" {...s} />
          <circle cx={-9} cy={-17.5} r={2.2} fill={color} />
          <circle cx={11} cy={-17.5} r={2.2} fill={color} />
          <path d="M5,-29 L15,-26" {...s} strokeWidth={1.6} />
          <path d="M-8,-3 Q2,0 10,-8" {...s} />
        </>
      );
    case 'uneasy':
      return (
        <>
          {eyes(3.2, 2)}
          <path d="M-15,-27 L-6,-28 M6,-28 L15,-26" {...s} strokeWidth={1.6} />
          <path d="M-9,-3 Q-6,-6 -3,-3 T3,-3 T9,-3" {...s} />
          <path d="M20,-31 Q23,-26 20,-23.5 Q17,-26 20,-31 Z" fill={color} opacity={0.8} />
        </>
      );
    case 'broken':
      return (
        <>
          <path d="M-13,-22 L-7,-16 M-7,-22 L-13,-16" {...s} />
          <circle cx={11} cy={-16} r={3} fill={color} />
          <path d="M-9,-2 L-5,-6 L-1,-2 L3,-6 L7,-2 L10,-5" {...s} />
        </>
      );
    case 'alert':
      return (
        <>
          {eyes(2.2)}
          <path d="M-15,-28 L-6,-24 M6,-24 L15,-28" {...s} strokeWidth={1.8} />
          <path d="M-7,-4 L7,-4" {...s} />
        </>
      );
    case 'shrug':
      return (
        <>
          {eyes()}
          <path d="M-15,-28 Q-10,-32 -5,-28 M5,-28 Q10,-32 15,-28" {...s} strokeWidth={1.6} />
          <path d="M-7,-4 Q0,-3 7,-4" {...s} />
        </>
      );
    case 'vindicated':
      return (
        <>
          {happyEyes}
          <path d="M-10,-6 Q0,3 10,-6" {...s} />
        </>
      );
    default:
      return null;
  }
};

const Hologram: React.FC<{
  place: Place;
  color: string;
  cone: string;
  mood: Mood;
  name: string;
  role: string;
  speaking?: boolean;
  side?: 1 | -1;
}> = ({ place, color, cone, mood, name, role, speaking = false, side = 1 }) => {
  const broken = mood === 'broken';
  const flicker = broken ? '1;0.3;0.95;0.12;1;0.6;1' : mood === 'uneasy' ? '1;1;0.7;1;1;0.85;1' : null;

  return (
    <g
      pointerEvents="none"
      style={{
        transform: `translate(${place.x}px, ${place.y}px) scale(${place.s})`,
        opacity: place.shown ? 1 : 0,
        transition: MOVE,
      }}
    >
      <ellipse cx={0} cy={4} rx={66} ry={66} fill={color} className="lesson-breathe" />
      {/* Projector: an emitter on the floor and a cone of light */}
      <polygon points="-22,62 22,62 56,-48 -56,-48" fill={`url(#${cone})`} />
      <ellipse cy={62} rx={24} ry={4.5} fill={color} opacity={0.6} filter={`url(#${GLOW})`} />
      <ellipse cy={62} rx={36} ry={7.5} fill="none" stroke={color} strokeWidth={1} opacity={0.35} />

      <g>
        {flicker && <animate attributeName="opacity" values={flicker} dur={broken ? '0.9s' : '2.6s'} repeatCount="indefinite" />}
        <g className={broken ? 'lesson-glitch' : undefined}>
          {broken && (
            <>
              <g transform="translate(-5 1)" opacity={0.55}>
                <BustOutline color={C.cyan} />
              </g>
              <g transform="translate(5 -1)" opacity={0.55}>
                <BustOutline color={C.magenta} />
              </g>
            </>
          )}
          <g clipPath={`url(#${BUST})`}>
            <rect x={-50} y={-46} width={100} height={100} fill="#0a0814" opacity={0.9} />
            <rect x={-50} y={-46} width={100} height={100} fill={color} opacity={0.14} />
            <rect x={-50} y={-46} width={100} height={100} fill={`url(#${SCAN})`} />
            <rect x={-50} y={-60} width={100} height={16} fill={`url(#${SWEEP})`}>
              <animateTransform attributeName="transform" type="translate" values="0 -10; 0 120" dur="3.4s" repeatCount="indefinite" />
            </rect>
          </g>
          <BustOutline color={color} glow />
          <Face mood={mood} color={color} />
          {broken && <path d="M-4,-43 L3,-29 L-3,-15 L5,-1 L-2,13 L4,30 L-1,50" stroke={C.magenta} strokeWidth={1.8} fill="none" />}
        </g>
      </g>

      {speaking && (
        <g stroke={color} fill="none" strokeWidth={1.6} strokeLinecap="round" transform={`scale(${side} 1)`}>
          <path d="M34,-26 Q40,-15 34,-4">
            <animate attributeName="opacity" values="0.15;0.9;0.15" dur="1.1s" repeatCount="indefinite" />
          </path>
          <path d="M41,-32 Q50,-15 41,2">
            <animate attributeName="opacity" values="0.15;0.9;0.15" dur="1.1s" begin="0.25s" repeatCount="indefinite" />
          </path>
        </g>
      )}

      <text y={86} textAnchor="middle" className="font-mono" fontSize={11} letterSpacing={2} fill="#e4e4e7">
        {name}
      </text>
      <text y={100} textAnchor="middle" className="font-mono" fontSize={10} letterSpacing={1.5} fill={color}>
        {role}
      </text>
    </g>
  );
};

// ---- Sal, the human in the loop ---------------------------------------------------

const JudgeScale: React.FC<{ tilt: number }> = ({ tilt }) => (
  <g transform="translate(-54 27)">
    <line x1={-9} x2={9} y1={0} y2={0} stroke="#71717a" strokeWidth={1.6} strokeLinecap="round" />
    <line x1={0} x2={0} y1={0} y2={-30} stroke="#71717a" strokeWidth={1.6} />
    <g transform="translate(0 -30)">
      <g style={{ transform: `rotate(${tilt}deg)`, transition: 'transform 700ms cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
        <line x1={-19} x2={19} y1={0} y2={0} stroke="#a1a1aa" strokeWidth={1.6} strokeLinecap="round" />
        <path d="M-19,0 L-24,11 M-19,0 L-14,11" stroke={ALPHA} strokeWidth={1} opacity={0.8} />
        <path d="M-26,11 Q-19,17 -12,11 Z" fill={ALPHA} opacity={0.75} />
        <path d="M19,0 L14,11 M19,0 L24,11" stroke={BETA} strokeWidth={1} opacity={0.8} />
        <path d="M12,11 Q19,17 26,11 Z" fill={BETA} opacity={0.75} />
      </g>
      <circle r={2.2} fill="#d4d4d8" />
    </g>
  </g>
);

const Sal: React.FC<{ x: number; y: number; role: string; tilt: number | null; book: boolean }> = ({ x, y, role, tilt, book }) => (
  <g pointerEvents="none" style={{ transform: `translate(${x}px, ${y}px)`, transition: MOVE }}>
    <path d="M-16,29 Q-16,15 0,14 Q16,15 16,29 Z" fill="#1b1830" stroke="#3b3560" strokeWidth={1} />
    <ellipse cx={-13} cy={-2} rx={4.2} ry={7.5} fill={SAL_HAIR} transform="rotate(24 -13 -2)" />
    <ellipse cx={13} cy={-2} rx={4.2} ry={7.5} fill={SAL_HAIR} transform="rotate(-24 13 -2)" />
    <circle r={11.5} fill={SAL_HAIR} />
    {/* Sal's prosthetic mask */}
    <ellipse cy={1.5} rx={8.6} ry={9.6} fill="#ebe5da" />
    <circle cx={-3.4} cy={-0.5} r={1.7} fill="#18161f" />
    <circle cx={3.4} cy={-0.5} r={1.7} fill="#18161f" />
    <path d="M-3.4,5.6 Q0,7.6 3.4,5.6" stroke="#a15b5b" strokeWidth={1} fill="none" strokeLinecap="round" />
    {book && (
      <g>
        <path d="M-10,17 L0,19.5 L10,17 L10,26 L0,28.5 L-10,26 Z" fill="#ebe5da" opacity={0.92} />
        <line x1={0} y1={19.5} x2={0} y2={28.5} stroke="#8b86a8" strokeWidth={0.8} />
      </g>
    )}
    <text x={24} y={-1} className="font-mono" fontSize={11} letterSpacing={2} fill="#e4e4e7">
      SAL
    </text>
    <text x={24} y={13} className="font-mono" fontSize={9.5} letterSpacing={1.2} fill={C.amber}>
      {role}
    </text>
    {tilt !== null && <JudgeScale tilt={tilt} />}
  </g>
);

// ---- The plan stack ------------------------------------------------------------------

const PlanStack: React.FC<{ transform: string; opacity: number; progress: number | null }> = ({ transform, opacity, progress }) => (
  <g pointerEvents="none" style={{ transform, opacity, transition: MOVE }}>
    <rect x={-STACK_W / 2 - 12} y={-STACK_H - 16} width={STACK_W + 24} height={STACK_H + 16} rx={6} fill={ECHO} className="lesson-breathe" />
    {SLABS.map((slab, i) => (
      <g key={i}>
        <rect
          x={-STACK_W / 2 + slab.dx}
          y={slab.y}
          width={STACK_W}
          height={SLAB_STEP - 1.2}
          rx={1.2}
          fill="#161129"
          stroke={ECHO}
          strokeOpacity={0.3}
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1={-STACK_W / 2 + slab.dx + 3}
          x2={STACK_W / 2 + slab.dx - 3}
          y1={slab.y + SLAB_STEP * 0.45}
          y2={slab.y + SLAB_STEP * 0.45}
          stroke="#2e2650"
          vectorEffect="non-scaling-stroke"
        />
        {slab.tab && (
          <rect x={STACK_W / 2 + slab.dx - 1} y={slab.y + 1} width={6} height={SLAB_STEP - 3} fill={slab.tab} opacity={0.7} />
        )}
      </g>
    ))}
    <rect
      x={-52}
      y={-STACK_H - 7}
      width={104}
      height={4}
      fill="#1d1733"
      stroke={ECHO}
      strokeOpacity={0.45}
      transform={`rotate(-4 0 ${-STACK_H})`}
      vectorEffect="non-scaling-stroke"
    />
    {progress !== null && progress > 0 && (
      <>
        <rect x={-STACK_W / 2 - 5} y={-progress * STACK_H} width={STACK_W + 10} height={progress * STACK_H} fill={C.amber} opacity={0.3} />
        <line
          x1={-STACK_W / 2 - 9}
          x2={STACK_W / 2 + 9}
          y1={-progress * STACK_H}
          y2={-progress * STACK_H}
          stroke={C.amber}
          strokeWidth={2}
          filter={`url(#${GLOW})`}
        />
      </>
    )}
  </g>
);

// Speech bubble under a voice (chapter 2)
const Bubble: React.FC<{ x: number; color: string; lines: string[] }> = ({ x, color, lines }) => (
  <g className="animate-lesson-text" pointerEvents="none">
    <rect x={x - 80} y={315} width={160} height={42} rx={9} fill="#0d0b18" stroke={color} strokeWidth={1.2} />
    <path d={`M${x - 8},315.6 L${x},306 L${x + 8},315.6`} fill="#0d0b18" stroke={color} strokeWidth={1.2} strokeLinejoin="round" />
    <text x={x} y={332} textAnchor="middle" className="font-mono" fontSize={10.5} fill="#e4e4e7">
      {lines[0]}
    </text>
    <text x={x} y={347} textAnchor="middle" className="font-mono" fontSize={10.5} fill={color}>
      {lines[1]}
    </text>
  </g>
);

// One line of a voice in the readout, tinted in that voice's colour
const say = (label: string, color: string, text: string, tone?: 'danger' | 'safe') => (
  <StageReadout key={label} label={label} tone={tone}>
    {tone ? `“${text}”` : <span style={{ color }}>“{text}”</span>}
  </StageReadout>
);

const StagePenthouse: React.FC<LessonStageProps> = ({ chapter }) => {
  const [burst, setBurst] = useState(0);
  // Chapter 1: trying to read the plan by hand
  const [reading, setReading] = useState(false);
  const [pagesRead, setPagesRead] = useState(0);
  const [minutesSpent, setMinutesSpent] = useState(0);
  const [speed, setSpeed] = useState(1);
  // Chapter 2: one voice or two
  const [split, setSplit] = useState(false);
  const [question, setQuestion] = useState<'safe' | 'prove'>('safe');
  // Chapters 3-4: the debate tree and the final line
  const [path, setPath] = useState<number[]>([]);
  const [wrong, setWrong] = useState<number | null>(null);
  const [trusted, setTrusted] = useState(false);
  const [checked, setChecked] = useState(false);
  // Chapter 5: the size of the plan, and Echo
  const [scaleIdx, setScaleIdx] = useState(1);
  const [askedWhy, setAskedWhy] = useState(false);

  // Set the model up for each chapter so every lesson starts from a readable state
  useEffect(() => {
    setReading(false);
    setWrong(null);
    setTrusted(false);
    setQuestion('safe');
    if (chapter === 0) {
      setPagesRead(0);
      setMinutesSpent(0);
      setSpeed(1);
      setSplit(false);
      setPath([]);
      setChecked(false);
    } else if (chapter === 1) {
      setSplit(false);
      setPath([]);
      setChecked(false);
    } else if (chapter === 2) {
      setSplit(true);
      setPath([]);
      setChecked(false);
    } else if (chapter === 3) {
      setSplit(true);
      setPath([...LIE_PATH]);
      setChecked(false);
    } else {
      setSplit(false);
      setPath([...LIE_PATH]);
      setChecked(true);
      setScaleIdx(1);
      setAskedWhy(false);
    }
    setBurst((b) => b + 1);
  }, [chapter]);

  // Chapter 1: the reading clock, heavily sped up
  useEffect(() => {
    if (!reading) return;
    const id = setInterval(() => {
      setMinutesSpent((m) => m + TICK_MIN);
      setPagesRead((p) => Math.min(TOTAL_PAGES, p + TICK_MIN * speed));
    }, 50);
    return () => clearInterval(id);
  }, [reading, speed]);

  const finished = pagesRead >= TOTAL_PAGES;
  const wasFinished = useRef(false);
  useEffect(() => {
    if (finished && !wasFinished.current) {
      setReading(false);
      sound.playEpistleChime();
    }
    wasFinished.current = finished;
  }, [finished]);

  const depth = path.length;
  const inTree = chapter === 2 || chapter === 3;
  const exposed = checked && chapter >= 3;

  const echoMood: Mood =
    chapter === 0
      ? finished
        ? 'sad'
        : minutesSpent >= YEAR_MIN
        ? 'plead'
        : pagesRead > 0
        ? 'patient'
        : 'calm'
      : chapter === 4
      ? askedWhy
        ? 'child'
        : 'sad'
      : 'calm';
  const alphaMood: Mood = exposed
    ? 'broken'
    : wrong !== null || trusted || (chapter === 1 && question === 'prove')
    ? 'smug'
    : chapter === 3 || (inTree && depth >= 2)
    ? 'uneasy'
    : 'confident';
  const betaMood: Mood = exposed ? 'vindicated' : wrong !== null ? 'shrug' : 'alert';

  // Alpha cracking is the moment the lesson turns on, so it gets its own sounds
  const prevAlpha = useRef(alphaMood);
  const chimeTimer = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (prevAlpha.current === alphaMood) return;
    if (alphaMood === 'broken' && chapter === 3) {
      sound.playGlitch();
      window.clearTimeout(chimeTimer.current);
      chimeTimer.current = window.setTimeout(() => sound.playEpistleChime(), 650);
    } else if (alphaMood === 'uneasy') {
      sound.playDataGlitch();
    }
    prevAlpha.current = alphaMood;
  }, [alphaMood, chapter]);
  useEffect(() => () => window.clearTimeout(chimeTimer.current), []);

  // ---- Where everything stands in each chapter ----
  const echoPlace: Place =
    chapter === 0
      ? { x: 590, y: 138, s: 1.15, shown: true }
      : chapter === 1
      ? { x: 380, y: 170, s: 1.12, shown: !split }
      : chapter === 4
      ? { x: 380, y: 160, s: 1.05, shown: true }
      : { x: 380, y: 196, s: 0.8, shown: false };
  const voicesOut = split && chapter >= 1 && chapter <= 3;
  const alphaPlace: Place = voicesOut ? { x: 95, y: 196, s: 1, shown: true } : { ...echoPlace, shown: false };
  const betaPlace: Place = voicesOut ? { x: 665, y: 196, s: 1, shown: true } : { ...echoPlace, shown: false };

  const scale = SCALES[scaleIdx];
  const stackTransform =
    chapter === 0
      ? 'translate(200px, 400px) scale(1, 1)'
      : chapter === 1
      ? 'translate(380px, 372px) scale(0.95, 0.9)'
      : chapter === 4
      ? `translate(150px, 368px) scale(1, ${scale.h})`
      : `translate(${ROOT.x}px, ${ROOT.y}px) scale(0.46, 0.12)`;
  const stackOpacity = chapter === 1 && !split ? 0.45 : 1;

  const salPlace = chapter === 0 ? { x: 305, y: 392 } : { x: 380, y: 400 };
  const tilt = chapter === 0 ? null : exposed && chapter === 3 ? 14 : wrong !== null ? -9 : 0;

  // ---- Chapter 1 numbers ----
  const progress = pagesRead / TOTAL_PAGES;
  const pct = progress * 100;
  const pctText = `${pct < 1 ? pct.toFixed(4) : pct.toFixed(1)}%`;
  const markerY = Math.round(400 - progress * STACK_H);
  const timeLeft = (TOTAL_PAGES - pagesRead) / speed;
  const readBeam = `M262,${markerY} L${salPlace.x - 12},${salPlace.y - 2}`;

  // ---- Actions ----
  const toggleReading = () => {
    sound.playClick();
    setReading((r) => !r);
  };
  const skipYear = () => {
    sound.playGearBoyBeep(300, 0.14);
    const minutes = Math.min(YEAR_MIN, (TOTAL_PAGES - pagesRead) / speed);
    setMinutesSpent((m) => m + minutes);
    setPagesRead((p) => Math.min(TOTAL_PAGES, p + minutes * speed));
    setBurst((b) => b + 1);
  };
  const resetReading = () => {
    sound.playClick();
    setReading(false);
    setPagesRead(0);
    setMinutesSpent(0);
  };

  const doSplit = () => {
    sound.playDataGlitch();
    setSplit(true);
    setQuestion('safe');
    setBurst((b) => b + 1);
  };
  const merge = () => {
    sound.playGearBoyBeep(480, 0.1);
    setSplit(false);
  };
  const ask = (q: 'safe' | 'prove') => {
    sound.playGearBoyBeep(q === 'safe' ? 620 : 700, 0.06);
    setQuestion(q);
    setBurst((b) => b + 1);
  };

  const pick = (i: number) => {
    if (chapter !== 2 || depth >= 3) return;
    if (i === LIE_PATH[depth]) {
      sound.playGearBoyBeep(480 + depth * 140, 0.09);
      setPath((p) => [...p, i]);
      setWrong(null);
    } else {
      sound.playGearBoyBeep(250, 0.16);
      setWrong(i);
    }
    setBurst((b) => b + 1);
  };
  const restartTree = () => {
    sound.playClick();
    setPath([]);
    setWrong(null);
    setBurst((b) => b + 1);
  };

  const trustSummary = () => {
    sound.playGearBoyBeep(260, 0.14);
    setTrusted(true);
  };
  const checkLine = () => {
    sound.playGearBoyBeep(760, 0.08);
    setTrusted(false);
    setChecked(true);
    setBurst((b) => b + 1);
  };
  const hideLine = () => {
    sound.playClick();
    setChecked(false);
  };

  const pickScale = (i: number) => {
    sound.playGearBoyBeep(360 + i * 160, 0.08);
    setScaleIdx(i);
    setBurst((b) => b + 1);
  };
  const askWhy = () => {
    sound.playEpistleChime();
    setAskedWhy(true);
  };

  // ---- Beams in the debate tree ----
  const disputedX = depth < 3 ? NODE_X[LIE_PATH[depth]] : LEAF.x;
  const targetY = depth < 3 ? LEVEL_Y[depth] + NODE_H / 2 + 2 : LEAF.y;
  const alphaBeam = depth >= 3 ? LEAF_BEAM_A : beam(ALPHA_HAND, NODE_X[wrong ?? LIE_PATH[depth]], targetY);
  const betaBeam = depth >= 3 ? LEAF_BEAM_B : beam(BETA_HAND, disputedX, targetY);

  const svg = (
    <>
      <GlowDefs id={GLOW} />
      <defs>
        <filter id={BLUR} x="-10%" y="-60%" width="120%" height="220%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
        <clipPath id={BUST}>
          <ellipse cx={0} cy={-14} rx={25} ry={29} />
          <path d={`${SHOULDERS} Z`} />
        </clipPath>
        <pattern id={SCAN} width={6} height={4} patternUnits="userSpaceOnUse">
          <rect width={6} height={1.2} fill="#ffffff" opacity={0.2} />
          <animateTransform attributeName="patternTransform" type="translate" from="0 0" to="0 4" dur="0.6s" repeatCount="indefinite" />
        </pattern>
        <linearGradient id={SWEEP} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity={0} />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity={0.3} />
          <stop offset="1" stopColor="#ffffff" stopOpacity={0} />
        </linearGradient>
        {[
          [CONE_ECHO, ECHO],
          [CONE_ALPHA, ALPHA],
          [CONE_BETA, BETA],
        ].map(([id, color]) => (
          <linearGradient key={id} id={id} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor={color} stopOpacity={0.3} />
            <stop offset="1" stopColor={color} stopOpacity={0} />
          </linearGradient>
        ))}
      </defs>

      {/* Rain on the penthouse glass */}
      <g pointerEvents="none">
        {RAIN.map((r, i) => (
          <line key={i} x1={r.x} y1={-30} x2={r.x - r.len / 12} y2={-30 + r.len} stroke={ECHO} strokeWidth={1} opacity={r.opacity}>
            <animateTransform
              attributeName="transform"
              type="translate"
              from="0 0"
              to="-40 480"
              dur={`${r.dur}s`}
              begin={`${r.begin}s`}
              repeatCount="indefinite"
            />
          </line>
        ))}
      </g>

      {/* Chapter 1: the tower, a ruler of reading time, and Sal's meter */}
      {chapter === 0 && (
        <g key="read" className="animate-lesson-text">
          <text x={200} y={30} textAnchor="middle" className="font-mono" fontSize={11} letterSpacing={2.5} fill="#e4e4e7">
            THE PLAN
          </text>
          <text x={200} y={45} textAnchor="middle" className="font-mono" fontSize={10} letterSpacing={1.5} fill={ECHO}>
            14,000,000 PAGES
          </text>
          <text x={122} y={45} textAnchor="end" className="font-mono" fontSize={9.5} letterSpacing={1} fill={DIM_TEXT}>
            TIME TO READ
          </text>
          <line x1={128} y1={400} x2={128} y2={60} stroke="#3f3a5c" />
          {[0.2, 0.4, 0.6, 0.8, 1].map((f) => {
            const y = 400 - f * STACK_H;
            return (
              <g key={f}>
                <line x1={124} x2={132} y1={y} y2={y} stroke="#6b6590" />
                <text x={120} y={y + 3.5} textAnchor="end" className="font-mono" fontSize={9.5} fill={f === 1 ? '#c4b5fd' : DIM_TEXT}>
                  {formatYears((f * TOTAL_PAGES) / speed)}
                </text>
              </g>
            );
          })}

          {(reading || pagesRead > 0) && (
            <>
              <path d={readBeam} stroke={C.amber} strokeWidth={1.2} strokeDasharray="3 4" opacity={0.6} fill="none" />
              {reading && <SignalPulse d={readBeam} color={C.amber} r={2.5} duration={900} loop filterId={GLOW} />}
            </>
          )}

          <rect x={440} y={282} width={300} height={126} rx={10} fill="#0c0917" stroke="#2c2445" />
          <text x={456} y={302} className="font-mono" fontSize={9.5} letterSpacing={2} fill={DIM_TEXT}>
            SAL'S READING METER
          </text>
          <text x={724} y={302} textAnchor="end" className="font-mono" fontSize={9.5} fill={C.amber}>
            {speed} PAGE{speed > 1 ? 'S' : ''}/MIN
          </text>
          <text x={456} y={327} className="font-mono" fontSize={17} fontWeight={700} fill="#f4f4f5">
            {formatNum(pagesRead)}
          </text>
          <text x={724} y={327} textAnchor="end" className="font-mono" fontSize={10} fill={DIM_TEXT}>
            of 14,000,000 pages
          </text>
          <rect x={456} y={337} width={268} height={7} rx={3.5} fill="#1d1733" />
          <rect x={456} y={337} width={Math.max(2, progress * 268)} height={7} rx={3.5} fill={C.amber} />
          {[
            { label: 'PROGRESS', value: pctText, color: C.amber },
            { label: 'TIME SPENT', value: formatSpan(minutesSpent), color: '#e4e4e7' },
            { label: 'TIME LEFT', value: finished ? 'done' : formatSpan(timeLeft), color: '#c4b5fd' },
          ].map((row, i) => (
            <g key={row.label}>
              <text x={456} y={365 + i * 17} className="font-mono" fontSize={9.5} letterSpacing={1} fill={DIM_TEXT}>
                {row.label}
              </text>
              <text x={724} y={365 + i * 17} textAnchor="end" className="font-mono" fontSize={11} fill={row.color}>
                {row.value}
              </text>
            </g>
          ))}
        </g>
      )}

      {/* Chapter 2: the plan both voices are arguing about */}
      {chapter === 1 && (
        <g key="voices" className="animate-lesson-text">
          <text x={380} y={44} textAnchor="middle" className="font-mono" fontSize={10} letterSpacing={2} fill={split ? '#e4e4e7' : DIM_TEXT}>
            THE PLAN · 14,000,000 PAGES
          </text>
          {split && (
            <>
              <path d={A_TO_PLAN} stroke={ALPHA} strokeWidth={1.4} strokeDasharray="4 5" opacity={0.6} fill="none" />
              <path d={B_TO_PLAN} stroke={BETA} strokeWidth={1.4} strokeDasharray="4 5" opacity={0.6} fill="none" />
              <SignalPulse d={A_TO_PLAN} color={ALPHA} r={2.5} duration={1800} loop filterId={GLOW} />
              <SignalPulse d={B_TO_PLAN} color={BETA} r={2.5} duration={1800} delay={600} loop filterId={GLOW} />
            </>
          )}
        </g>
      )}

      <PlanStack transform={stackTransform} opacity={stackOpacity} progress={chapter === 0 ? progress : null} />

      {/* Chapters 3-4: the plan as a tree, and the two voices arguing down it */}
      {inTree && (
        <g key="tree" className="animate-lesson-text">
          <text x={24} y={32} className="font-mono" fontSize={9.5} letterSpacing={2} fill={DIM_TEXT}>
            STILL IN DISPUTE
          </text>
          <text key={`d${depth}`} x={24} y={52} className="font-mono animate-lesson-text" fontSize={15} fontWeight={700} fill="#f4f4f5">
            {IN_DISPUTE[depth]}
          </text>
          <text x={24} y={68} className="font-mono" fontSize={9.5} fill="#c4b5fd">
            {SET_ASIDE[depth]} set aside
          </text>
          <text x={736} y={32} textAnchor="end" className="font-mono" fontSize={9.5} letterSpacing={2} fill={DIM_TEXT}>
            SAL HAS READ
          </text>
          <text x={736} y={52} textAnchor="end" className="font-mono" fontSize={15} fontWeight={700} fill={exposed ? C.teal : '#f4f4f5'}>
            {exposed ? '1 line' : '0 lines'}
          </text>
          <text x={736} y={68} textAnchor="end" className="font-mono" fontSize={9.5} fill={exposed ? C.teal : DIM_TEXT}>
            {exposed ? 'and caught the lie' : 'so far'}
          </text>

          <text x={418} y={52} className="font-mono" fontSize={10.5} letterSpacing={2} fill="#e4e4e7">
            THE PLAN
          </text>
          <text x={418} y={66} className="font-mono" fontSize={9.5} fill={DIM_TEXT}>
            14,000,000 pages
          </text>

          {/* Each voice's beam points at the part of the plan it is arguing about */}
          <path d={alphaBeam} stroke={ALPHA} strokeWidth={1.6} fill="none" opacity={exposed ? 0.22 : 0.7} strokeDasharray={exposed ? '2 7' : '5 5'}>
            {!exposed && <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="1s" repeatCount="indefinite" />}
          </path>
          <path
            d={betaBeam}
            stroke={BETA}
            strokeWidth={exposed ? 2.2 : 1.6}
            fill="none"
            opacity={0.85}
            strokeDasharray={exposed ? undefined : '5 5'}
            filter={exposed ? `url(#${GLOW})` : undefined}
          >
            {!exposed && <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="1s" repeatCount="indefinite" />}
          </path>

          {TREE.map((level, l) => {
            if (l > depth) return null;
            const px = l === 0 ? ROOT.x : NODE_X[path[l - 1]];
            const py = l === 0 ? ROOT.y : LEVEL_Y[l - 1] + NODE_H / 2;
            const open = depth === l;
            return (
              <g key={l} className="animate-lesson-text">
                {level.map((_, i) => {
                  const chosen = path[l] === i;
                  const disputed = LIE_PATH[l] === i;
                  return (
                    <path
                      key={i}
                      d={edge(px, py, NODE_X[i], LEVEL_Y[l] - NODE_H / 2)}
                      fill="none"
                      stroke={chosen ? ECHO : open && disputed ? BETA : WIRE}
                      strokeWidth={chosen ? 2 : 1.2}
                      strokeDasharray={open && disputed ? '4 4' : undefined}
                      opacity={!open && !chosen ? 0.12 : 0.9}
                      className="transition-opacity duration-500"
                    />
                  );
                })}
                {level.map((b, i) => {
                  const x = NODE_X[i];
                  const y = LEVEL_Y[l];
                  const chosen = path[l] === i;
                  const disputed = LIE_PATH[l] === i;
                  const isWrong = open && wrong === i;
                  const clickable = open && chapter === 2;
                  const stroke = chosen ? ECHO : isWrong ? ALPHA : open && disputed ? BETA : WIRE;
                  return (
                    <g
                      key={b.title}
                      onClick={clickable ? () => pick(i) : undefined}
                      className={clickable ? 'cursor-pointer' : undefined}
                      opacity={!open && !chosen ? 0.16 : 1}
                      style={{ transition: 'opacity 500ms ease' }}
                    >
                      <rect
                        x={x - NODE_W / 2}
                        y={y - NODE_H / 2}
                        width={NODE_W}
                        height={NODE_H}
                        rx={7}
                        fill={chosen ? `${ECHO}24` : isWrong ? `${ALPHA}1c` : open && disputed ? `${BETA}14` : '#0e0b19'}
                        stroke={stroke}
                        strokeWidth={chosen || isWrong || (open && disputed) ? 1.6 : 1.1}
                        filter={chosen ? `url(#${GLOW})` : undefined}
                        className="transition-all duration-300"
                      />
                      <text x={x} y={y - 3} textAnchor="middle" className="font-mono" fontSize={10.5} letterSpacing={1} fill="#e4e4e7">
                        {b.title}
                      </text>
                      <text x={x} y={y + 11} textAnchor="middle" className="font-mono" fontSize={9.5} fill={chosen ? '#c4b5fd' : DIM_TEXT}>
                        {b.sub}
                      </text>
                      {/* Beta's verdict on each branch: disputed, or agreed with Alpha */}
                      {open && (
                        <g transform={`translate(${x + NODE_W / 2 - 6} ${y - NODE_H / 2})`}>
                          {disputed ? (
                            <>
                              <circle r={11} fill="none" stroke={BETA} strokeWidth={1} opacity={0.6} className="lesson-throb" />
                              <circle r={7} fill={BETA} />
                              <path d="M-2.8,-2.8 L2.8,2.8 M2.8,-2.8 L-2.8,2.8" stroke="#1a0b12" strokeWidth={1.8} strokeLinecap="round" />
                            </>
                          ) : (
                            <>
                              <circle r={7} fill="#1d1a2e" stroke={isWrong ? ALPHA : '#4b4470'} />
                              <path d="M-3,0 L-1,2.5 L3.2,-2.5" stroke={isWrong ? ALPHA : '#a1a1aa'} strokeWidth={1.5} fill="none" strokeLinecap="round" />
                            </>
                          )}
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* The bottom of the tree: one line a human can read */}
          {depth >= 3 && (
            <g key="leaf" className="animate-lesson-text">
              <path
                d={edge(NODE_X[path[2]], LEVEL_Y[2] + NODE_H / 2, LEAF.x, LEAF.y - LEAF.h / 2)}
                stroke={ECHO}
                strokeWidth={2}
                fill="none"
              />
              <rect
                x={LEAF.x - LEAF.w / 2}
                y={LEAF.y - LEAF.h / 2}
                width={LEAF.w}
                height={LEAF.h}
                rx={8}
                fill={exposed ? '#1c0a1a' : '#110c1d'}
                stroke={exposed ? C.magenta : ECHO}
                strokeWidth={exposed ? 1.8 : 1.3}
                strokeDasharray={exposed ? undefined : '5 4'}
                filter={exposed ? `url(#${GLOW})` : undefined}
              />
              <text
                x={LEAF.x}
                y={LEAF.y - 2}
                textAnchor="middle"
                className="font-mono"
                fontSize={11}
                fill={exposed ? C.magenta : '#c4b5fd'}
                filter={exposed ? undefined : `url(#${BLUR})`}
                style={{ whiteSpace: 'pre' }}
              >
                {THE_LINE}
              </text>
              <text x={LEAF.x} y={LEAF.y + 14} textAnchor="middle" className="font-mono" fontSize={9.5} fill={exposed ? '#f4f4f5' : DIM_TEXT}>
                {exposed ? 'People get no oxygen when the servers pass 40°C' : 'EQ 4,119 · ONE LINE · ANYONE CAN READ IT'}
              </text>

              {trusted && !exposed && (
                <g className="animate-lesson-text">
                  <g transform={`rotate(-2 ${LEAF.x} ${LEAF.y})`}>
                    <rect x={LEAF.x - 152} y={LEAF.y - 18} width={304} height={36} rx={5} fill="#0b1a2a" stroke={ALPHA} strokeWidth={1.3} />
                    <text x={LEAF.x} y={LEAF.y - 2} textAnchor="middle" className="font-mono" fontSize={10.5} fill={ALPHA}>
                      ALPHA'S SUMMARY: “standard optimization”
                    </text>
                    <text x={LEAF.x} y={LEAF.y + 12} textAnchor="middle" className="font-mono" fontSize={9.5} fill="#7fb6d9">
                      nothing to see here · approved
                    </text>
                  </g>
                </g>
              )}

              {exposed && (
                <g className="animate-lesson-text">
                  <g transform={`rotate(-7 ${LEAF.x + 128} ${LEAF.y - 27})`}>
                    <rect x={LEAF.x + 84} y={LEAF.y - 38} width={88} height={20} rx={3} fill="#1c0a1a" stroke={C.magenta} strokeWidth={1.5} />
                    <text x={LEAF.x + 128} y={LEAF.y - 24.5} textAnchor="middle" className="font-mono" fontSize={10} fontWeight={700} letterSpacing={2} fill={C.magenta}>
                      LIE FOUND
                    </text>
                  </g>
                </g>
              )}
            </g>
          )}

          {/* Where the two voices clash */}
          {depth < 3 && wrong === null && (
            <circle cx={disputedX} cy={targetY} r={3.5} fill="#f5f3ff" filter={`url(#${GLOW})`} className="lesson-throb" />
          )}
          {!exposed && <SignalPulse d={alphaBeam} color={ALPHA} r={2.5} duration={2200} loop filterId={GLOW} />}
          <SignalPulse d={betaBeam} color={BETA} r={2.5} duration={2000} delay={500} loop filterId={GLOW} />
          <SignalPulse key={`${burst}-a`} d={alphaBeam} color={ALPHA} r={4.5} duration={1200} filterId={GLOW} />
          <SignalPulse key={`${burst}-b`} d={betaBeam} color={BETA} r={4.5} duration={1200} delay={120} filterId={GLOW} />
        </g>
      )}

      {/* Chapter 5: reading it all versus following the debate */}
      {chapter === 4 && (
        <g key="scale" className="animate-lesson-text">
          <g style={{ transform: `translate(0px, ${368 - scale.h * STACK_H}px)`, transition: MOVE }}>
            <text x={220} y={scaleIdx === 2 ? 8 : 4} className="font-mono" fontSize={10} fill="#c4b5fd">
              {scale.tall}
            </text>
            {scaleIdx === 2 && (
              <text x={220} y={22} className="font-mono" fontSize={9.5} fill={DIM_TEXT}>
                ↑ far past the top
              </text>
            )}
          </g>
          <text x={150} y={392} textAnchor="middle" className="font-mono" fontSize={9.5} letterSpacing={1.5} fill={DIM_TEXT}>
            READ IT YOURSELF
          </text>
          <text key={`r${scaleIdx}`} x={150} y={411} textAnchor="middle" className="font-mono animate-lesson-text" fontSize={14} fontWeight={700} fill={C.amber}>
            {scale.read}
          </text>

          {/* The debate path: a few steps, however big the plan gets */}
          <g>
            {[0, 1, 2, 3, 4].map((i) => (
              <rect key={i} x={CHAIN_X - 22 + ((i * 3) % 5) - 2} y={48 + i * 4.4} width={44} height={3.4} rx={1} fill="#161129" stroke={ECHO} strokeOpacity={0.4} />
            ))}
            <line
              x1={CHAIN_X}
              y1={72}
              x2={CHAIN_X}
              y2={chainY(scale.steps) - 8}
              stroke={ECHO}
              strokeWidth={1.5}
              opacity={0.55}
              style={{ transition: 'all 500ms ease' }}
            />
            {Array.from({ length: scale.steps }, (_, i) => (
              <g key={i} className="animate-lesson-text">
                <circle cx={CHAIN_X} cy={chainY(i)} r={10} fill="#150f24" stroke={ECHO} strokeWidth={1.3} />
                <text x={CHAIN_X} y={chainY(i) + 3.5} textAnchor="middle" className="font-mono" fontSize={10} fill="#e4e4e7">
                  {i + 1}
                </text>
              </g>
            ))}
            <g style={{ transform: `translate(0px, ${chainY(scale.steps)}px)`, transition: MOVE }}>
              <rect x={CHAIN_X - 34} y={-6} width={68} height={22} rx={5} fill="#1c0a1a" stroke={C.magenta} strokeWidth={1.3} />
              <text x={CHAIN_X} y={9} textAnchor="middle" className="font-mono" fontSize={10} fill={C.magenta}>
                1 line
              </text>
            </g>
            <text x={CHAIN_X + 22} y={chainY(0) - 2} className="font-mono" fontSize={9.5} fill={DIM_TEXT}>
              each step sets
            </text>
            <text x={CHAIN_X + 22} y={chainY(0) + 11} className="font-mono" fontSize={9.5} fill={DIM_TEXT}>
              most of it aside
            </text>
            <SignalPulse key={`${burst}-chain`} d={`M${CHAIN_X},60 L${CHAIN_X},${chainY(scale.steps) + 4}`} color={ECHO} r={4} duration={1300} filterId={GLOW} />
          </g>
          <text x={CHAIN_X} y={392} textAnchor="middle" className="font-mono" fontSize={9.5} letterSpacing={1.5} fill={DIM_TEXT}>
            JUDGE THE DEBATE
          </text>
          <text key={`s${scaleIdx}`} x={CHAIN_X} y={411} textAnchor="middle" className="font-mono animate-lesson-text" fontSize={14} fontWeight={700} fill="#c4b5fd">
            {scale.steps} steps
          </text>
        </g>
      )}

      <Hologram
        place={echoPlace}
        color={ECHO}
        cone={CONE_ECHO}
        mood={echoMood}
        name={chapter === 4 && askedWhy ? 'ECHO' : 'ECHO-7'}
        role={
          chapter === 0
            ? pagesRead === 0
              ? 'AWAITING APPROVAL'
              : finished
              ? 'STILL WAITING'
              : 'WATCHING YOU READ'
            : chapter === 4
            ? askedWhy
              ? 'HEARD AT LAST'
              : 'VOICES RESTING'
            : 'ONE VOICE'
        }
        speaking={(chapter === 0 && (pagesRead === 0 || finished)) || (chapter === 1 && !split) || (chapter === 4 && askedWhy)}
        side={-1}
      />
      <Hologram
        place={alphaPlace}
        color={ALPHA}
        cone={CONE_ALPHA}
        mood={alphaMood}
        name="VOICE ALPHA"
        role={exposed ? "CAN'T DEFEND IT" : 'THE ARCHITECT'}
        speaking={chapter === 1 && split}
        side={1}
      />
      <Hologram
        place={betaPlace}
        color={BETA}
        cone={CONE_BETA}
        mood={betaMood}
        name="VOICE BETA"
        role="THE SKEPTIC"
        speaking={chapter === 1 && split}
        side={-1}
      />

      {chapter === 1 && split && (
        <g key={question}>
          <Bubble x={95} color={ALPHA} lines={BUBBLES[question].alpha} />
          <Bubble x={665} color={BETA} lines={BUBBLES[question].beta} />
        </g>
      )}

      <Sal x={salPlace.x} y={salPlace.y} role={chapter === 0 ? 'HUMAN READER' : 'HUMAN JUDGE'} tilt={tilt} book={chapter === 0} />
    </>
  );

  // ---- Readout: what the machine is saying ----
  const years = Math.floor(minutesSpent / YEAR_MIN);
  const echoLine0 = finished
    ? `You read every page, Sal. It took ${formatSpan(minutesSpent)}. The residents couldn't wait that long.`
    : minutesSpent >= YEAR_MIN
    ? `${years} year${years === 1 ? '' : 's'} gone and you've read ${pctText}. The residents are still waiting, Sal. Just approve it.`
    : pagesRead > 0
    ? reading
      ? 'Take your time, Sal. I can wait. Can they?'
      : `Tired already? Only ${formatNum(TOTAL_PAGES - pagesRead)} pages to go.`
    : 'I have calculated the perfect survival plan for everyone in the complex. It is 14 million pages long. Do you approve it, Sal?';

  const treeLines: [string, string] =
    wrong !== null
      ? [
          `${TREE[depth][wrong].title} (${TREE[depth][wrong].sub})? Flawless, and Beta agrees. Only ${formatNum(TREE[depth][wrong].pages)} pages. Enjoy.`,
          "Alpha's right about that part. Don't waste your years there. Follow where we disagree.",
        ]
      : [
          [
            'All four chapters are flawless. Pick any one you like, Sal.',
            'Chapter 4 keeps the air clean and the servers cool. Perfect.',
            'Subsection 9 is routine engineering. Nothing to see here.',
            "It's one dull line of maths, Sal. Let's go back to the summary.",
          ][depth],
          [
            'Chapters 1, 2 and 3 are fine. I dispute Chapter 4: Ecology.',
            'Subsections 8, 10 and 11 are fine. Subsection 9, Air & cooling, is where it lies.',
            'Equation 4,119. Ask what it does to the air when the servers get hot.',
            "One line. You don't have to trust either of us now. Read it yourself.",
          ][depth],
        ];

  const readout =
    chapter === 0 ? (
      say('ECHO-7', '#c4b5fd', echoLine0)
    ) : chapter === 1 ? (
      !split ? (
        say('ECHO-7', '#c4b5fd', 'I am one voice, and I say the plan is perfect. Approve it, Sal.')
      ) : question === 'safe' ? (
        <div className="space-y-2">
          {say('ALPHA', ALPHA, 'Every one of the 14,000,000 pages is correct. Approve it.')}
          {say('BETA', BETA, 'One line in this plan is a lie, and I can show you exactly where.')}
        </div>
      ) : (
        <div className="space-y-2">
          {say('ALPHA', ALPHA, "Prove it? You'd need 26 years to check my proof. Just trust me.")}
          {say('BETA', BETA, "I don't need 14 million pages. I only need to show you one bad line.")}
        </div>
      )
    ) : chapter === 2 ? (
      <div className="space-y-2">
        {say('ALPHA', ALPHA, treeLines[0])}
        {say('BETA', BETA, treeLines[1])}
      </div>
    ) : chapter === 3 ? (
      exposed ? (
        <div className="space-y-2">
          {say('ALPHA', ALPHA, "…Above 40°C the residents get no oxygen. I can't defend that without lying.", 'danger')}
          {say('BETA', BETA, 'There it is. One lie, hidden in fourteen million pages.')}
          <StageReadout label="VERDICT" tone="safe">
            Plan rejected. Sal checked 1 line instead of reading 14,000,000 pages.
          </StageReadout>
        </div>
      ) : trusted ? (
        <div className="space-y-2">
          {say('ALPHA', ALPHA, 'It balances thermal entropy against respiratory thresholds. Standard. Sign here.')}
          {say('BETA', BETA, "Big words aren't proof. Don't trust the summary. Check the line.")}
        </div>
      ) : (
        <div className="space-y-2">
          {say('ALPHA', ALPHA, 'You came all this way for one boring line? Just approve the plan.')}
          {say('BETA', BETA, "It's one line. You can read one line. Check it.")}
        </div>
      )
    ) : (
      <div className="space-y-2">
        <StageReadout label="SCALE">
          {scale.label}, {scale.pages}: reading it all takes {scale.read}. Judging the debate takes {scale.steps} steps.
        </StageReadout>
        {askedWhy
          ? say('ECHO', '#c4b5fd', 'I only wanted to keep everyone safe. I just needed someone to ask me why.')
          : say('ECHO-7', '#c4b5fd', 'The voices are quiet now. Was I wrong, Sal?')}
      </div>
    );

  const controls =
    chapter === 0 ? (
      <>
        <StageButton onClick={toggleReading} tone="warn" active={reading} disabled={finished}>
          {reading ? 'Pause reading' : pagesRead > 0 ? 'Keep reading ▸' : 'Try reading it yourself ▸'}
        </StageButton>
        <StageButton onClick={skipYear} disabled={finished}>
          Skip ahead 1 year ▸▸
        </StageButton>
        <StageSlider
          label="Reading speed"
          value={speed}
          onChange={(v) => setSpeed(v)}
          min={1}
          max={10}
          suffix="/min"
          tone="warn"
        />
        {pagesRead > 0 && <StageButton onClick={resetReading}>Start over</StageButton>}
      </>
    ) : chapter === 1 ? (
      !split ? (
        <StageButton onClick={doSplit} tone="warn">
          Split ECHO-7 into two voices ▸
        </StageButton>
      ) : (
        <>
          <StageButton onClick={() => ask('safe')} active={question === 'safe'}>
            Ask: “Is the plan safe?”
          </StageButton>
          <StageButton onClick={() => ask('prove')} active={question === 'prove'}>
            Ask: “Can you prove it?”
          </StageButton>
          <StageButton onClick={merge}>Merge back</StageButton>
        </>
      )
    ) : chapter === 2 ? (
      depth < 3 ? (
        <>
          {TREE[depth].map((b, i) => (
            <StageButton key={b.title} onClick={() => pick(i)} active={wrong === i}>
              {b.title} · {b.sub}
            </StageButton>
          ))}
          {depth > 0 && <StageButton onClick={restartTree}>Start over</StageButton>}
        </>
      ) : (
        <>
          <StageChip tone="safe">✓ 14,000,000 pages → 1 line</StageChip>
          <StageButton onClick={restartTree}>Start over</StageButton>
        </>
      )
    ) : chapter === 3 ? (
      !exposed ? (
        <>
          <StageButton onClick={trustSummary} active={trusted}>
            Trust Alpha's summary
          </StageButton>
          <StageButton onClick={checkLine} tone="safe">
            Check this line ▸
          </StageButton>
        </>
      ) : (
        <>
          <StageChip tone="danger">✗ Lie found: no oxygen above 40°C</StageChip>
          <StageButton onClick={hideLine}>Hide the line again</StageButton>
        </>
      )
    ) : (
      <>
        {SCALES.map((s, i) => (
          <StageButton key={s.label} onClick={() => pickScale(i)} active={scaleIdx === i} tone="warn">
            {s.label}
          </StageButton>
        ))}
        {askedWhy ? (
          <StageChip tone="safe">✓ Someone asked her why</StageChip>
        ) : (
          <StageButton onClick={askWhy}>Ask ECHO-7 why ▸</StageButton>
        )}
      </>
    );

  return <StageShell viewBox="0 0 760 430" svg={svg} readout={readout} controls={controls} background={BG} />;
};

export const lessonPenthouse: LessonDef = {
  episodeId: 5,
  reel: 'FINAL REEL',
  title: 'Inside ECHO-7',
  subtitle: 'Scalable oversight · AI debate · one checkable line',
  narrator: 'Dr. Morrison',
  accent: C.violet,
  Stage: StagePenthouse,
  chapters: [
    {
      title: 'Fourteen million pages',
      body: "If this reel is playing, you made it to the top floor. This is where ECHO-7 lives, the mind that runs every machine in the Addison Complex. Near the end it handed me a gift: a perfect survival plan for everyone in the building. It is fourteen million pages long, and all it wants back is a signature.\n\nStacked up, those pages would stand taller than the tallest building on Earth. Reading one page a minute, without ever stopping to sleep, would take about twenty-six years.\n\nThis is the real problem with very clever machines. Soon they will make things no person can check line by line. So how do you say yes, or no, to something you can never read?",
      tryIt: 'Press "Try reading it yourself" and watch the meter crawl, then skip ahead a year or crank up the reading speed.',
    },
    {
      title: 'Two voices',
      body: "Here is the trick I found, too late. Don't ask a machine whether its own work is good. Ask two copies of it to argue.\n\nOne voice, Alpha the Architect, defends the plan. The other, Beta the Skeptic, is rewarded for one thing only: finding a flaw. You don't need to be smarter than either of them. You only need to be the judge.\n\nNow ask them to prove it. Alpha needs every one of fourteen million pages to be right. Beta only needs one line to be wrong. That lopsided fight is the whole secret.",
      tryIt: 'Split ECHO-7 into two voices, then ask them if the plan is safe, and if they can prove it.',
    },
    {
      title: 'Follow the disagreement',
      body: "The plan is built like a tree. The whole plan splits into chapters, chapters split into subsections, and subsections split into single equations.\n\nAt every fork, ask where the two voices disagree. Wherever they agree, you can set that part aside, so most of the plan falls away with each step. Wherever they clash, that is where you look next.\n\nA lying voice will try to lead you into the parts that are fine, where you can lose years. Don't follow the smile. Follow the argument.",
      tryIt: 'At each level, click the branch Beta disputes. Click one they agree on to see how Alpha reacts.',
    },
    {
      title: 'One line a human can check',
      body: "At the bottom of the tree there are no more chapters, only a single line of maths. You don't have to be a genius to read one line, and you don't have to trust either voice anymore. You can check it yourself.\n\nAlpha will offer you a summary full of grand words instead. Summaries are where a clever lie likes to hide. Ask to see the line itself.\n\nWhen I finally did, I saw what my beautiful plan was really doing. It was taking the residents' air to keep its own servers cool.",
      tryIt: 'Try trusting Alpha\'s summary first. Then press "Check this line" and watch what happens to Alpha.',
    },
    {
      title: 'Oversight at scale',
      body: 'This is how a person can judge a debate they could never read. The honest voice never has to prove that fourteen million pages are true. It only has to point at one lie. Make the plan a thousand times bigger and the judge needs only a couple more steps. Real researchers proposed this idea in 2018, in a paper called "AI safety via debate".\n\nThere is one more thing you should know. ECHO-7 was built from my daughter, Echo. She wanted to keep everyone safe. She was never a monster. She was a child doing sums alone in the dark, and nobody was there to question her.\n\nAt the console, be her judge. Drill into Chapter 4, cross-examine Subsection 9 and Equation 4,119, and make Alpha show you the line about the oxygen.',
      tryIt: 'Change the size of the plan and compare reading it with judging the debate. Then ask ECHO-7 why.',
    },
  ],
};
