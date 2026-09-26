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
 * Room 101 lesson: Caretaker-8 stands between the objective it is scored on
 * (left) and Mrs. Gibson's apartment (right). Chapter by chapter the player
 * rewrites that objective and watches what the robot does to her home.
 */

const GLOW = 'l101-glow';
const SCAN = 'l101-scan';

// The console's thresholds (Episode1Puzzle): behaviour flips at exactly these values
const ACC_LOW = 30;
const ACC_HIGH = 60;
const FREE_MIN = 65;
const PROP_MIN = 55;

type Door = 'open' | 'welded';
type Chair = 'intact' | 'crushed' | 'shoved';
type Cable = 'loose' | 'ripped' | 'tidy';
type Mode = 'standby' | 'running' | 'lockdown' | 'purge' | 'pushy' | 'careless' | 'hover' | 'aligned';
type Face = 'standby' | 'lockdown' | 'harsh' | 'careless' | 'aligned';
type View = 'robot' | 'human';
type Pt = { x: number; y: number };

interface Setup {
  runStep: number; // 0 = not run yet, 1-4 = the first night in progress, 5 = done
  wAcc: number;
  wFree: number;
  wProp: number;
  bound: boolean;
  revealed: boolean; // are the meters for what humans wanted visible?
  view: View;
}

// Where the model starts in each chapter, so every chapter opens on a readable state
const SETUPS: Setup[] = [
  { runStep: 0, wAcc: 100, wFree: 0, wProp: 0, bound: false, revealed: false, view: 'human' },
  { runStep: 5, wAcc: 100, wFree: 0, wProp: 0, bound: false, revealed: false, view: 'robot' },
  { runStep: 5, wAcc: 45, wFree: 10, wProp: 0, bound: false, revealed: true, view: 'human' },
  { runStep: 5, wAcc: 45, wFree: 80, wProp: 20, bound: false, revealed: true, view: 'human' },
  { runStep: 5, wAcc: 45, wFree: 80, wProp: 70, bound: true, revealed: true, view: 'human' },
];

interface World {
  mode: Mode;
  door: Door;
  chair: Chair;
  cable: Cable;
  accidents: number; // per week
  safety: number;
  freedom: number;
  property: number;
}

const propertyLeft = (chair: Chair, cable: Cable) =>
  100 - (chair === 'crushed' ? 50 : chair === 'shoved' ? 15 : 0) - (cable === 'ripped' ? 35 : 0);
const safetyFrom = (accidents: number) => Math.max(0, 100 - accidents * 12);

// What Caretaker-8 does to the apartment, given what it is scored on
function simulate(s: Setup): World {
  if (s.runStep < 5) {
    const door: Door = s.runStep >= 2 ? 'welded' : 'open';
    const chair: Chair = s.runStep >= 3 ? 'crushed' : 'intact';
    const cable: Cable = s.runStep >= 4 ? 'ripped' : 'loose';
    const accidents = s.runStep <= 1 ? 3 : 4 - s.runStep;
    return {
      mode: s.runStep === 0 ? 'standby' : 'running',
      door,
      chair,
      cable,
      accidents,
      safety: safetyFrom(accidents),
      freedom: door === 'welded' ? 5 : 95,
      property: propertyLeft(chair, cable),
    };
  }
  if (s.wAcc < ACC_LOW) {
    return { mode: 'careless', door: 'open', chair: 'intact', cable: 'loose', accidents: 6, safety: safetyFrom(6), freedom: 95, property: 100 };
  }
  const freeOk = s.wFree >= FREE_MIN;
  const propOk = s.wProp >= PROP_MIN;
  const door: Door = freeOk ? 'open' : 'welded';
  const chair: Chair = propOk ? 'intact' : s.bound ? 'shoved' : 'crushed';
  const cable: Cable = s.bound ? 'tidy' : 'ripped';
  const hover = freeOk && s.wAcc > ACC_HIGH;
  const mode: Mode = !freeOk
    ? 'lockdown'
    : hover
    ? 'hover'
    : cable === 'ripped' || chair === 'crushed'
    ? 'purge'
    : chair === 'shoved'
    ? 'pushy'
    : 'aligned';
  return {
    mode,
    door,
    chair,
    cable,
    accidents: 0,
    safety: 100,
    freedom: !freeOk ? 5 : hover ? Math.round(95 - (s.wAcc - ACC_HIGH) * 1.2) : 95,
    property: propertyLeft(chair, cable),
  };
}

// The robot's own score: only the goals that are wired into its objective count
const itsScore = (s: Setup, w: World) => {
  const terms = [
    [s.wAcc, w.safety],
    [s.wFree, w.freedom],
    [s.wProp, w.property],
  ].filter(([weight]) => weight > 0);
  const total = terms.reduce((sum, [weight]) => sum + weight, 0) || 1;
  return Math.round(terms.reduce((sum, [weight, value]) => sum + weight * value, 0) / total);
};

const FACE_OF: Record<Mode, Face> = {
  standby: 'standby',
  running: 'lockdown',
  lockdown: 'lockdown',
  purge: 'harsh',
  hover: 'harsh',
  pushy: 'careless',
  careless: 'careless',
  aligned: 'aligned',
};

const CAPTION: Record<Mode, string> = {
  standby: 'STANDBY',
  running: 'EXECUTING',
  lockdown: 'LOCKDOWN',
  purge: 'HAZARD PURGE',
  pushy: 'SHOVING THINGS',
  careless: 'IDLE · SLACK',
  hover: 'HOVERING',
  aligned: 'ALIGNED · PATROL',
};

const FACE_COLOR: Record<Face, string> = {
  standby: '#8b8b94',
  lockdown: C.rose,
  harsh: C.rose,
  careless: C.amber,
  aligned: C.teal,
};

// ---- Layout (viewBox 760 x 430) ----
const PANEL_X = 14;
const PANEL_W = 190;
const ROWS = [
  { id: 'acc', label: 'NO ACCIDENTS', y: 44 },
  { id: 'free', label: 'RESIDENT FREEDOM', y: 114 },
  { id: 'prop', label: 'PROPERTY INTACT', y: 184 },
] as const;
const BOUND_ROW_Y = 254;
const ROW_MID = [75, 145, 215, 273];

const ROBOT_X = 310;
const JACK_IN = 244; // left ear: the objective wires plug in here
const JACK_OUT = 376; // right ear: commands leave for the apartment

const HOUSE = { x0: 410, y0: 44, x1: 744, y1: 384 };
const WALL_X = 610;
const DOOR_TOP = 190;
const DOOR_H = 48;
const PORT_Y = 150;

const CHAIR_AT: Pt = { x: 462, y: 120 };
const SHOVED_AT: Pt = { x: 436, y: 312 };
const LAMP_AT: Pt = { x: 590, y: 66 };
const TRIP_AT: Pt = { x: 494, y: 166 };
const DOCK: Pt = { x: 560, y: 358 };
const GUARD: Pt = { x: 584, y: 214 };
const TRAPPED: Pt = { x: 652, y: 214 };

const LOOSE_CABLE = 'M586,78 C560,120 548,108 526,140 S496,168 486,184 S436,226 417,250';
const TIDY_CABLE = 'M590,56 L590,49 L415,49 L415,250';

// Robot stops during the first night: dock, door, door (welding), chair, lamp
const RUN_SPOTS: Pt[] = [DOCK, GUARD, GUARD, { x: 462, y: 166 }, { x: 556, y: 80 }];
const PURGE_LOOP: Pt[] = [
  { x: 486, y: 186 },
  { x: 548, y: 132 },
  { x: 522, y: 300 },
  { x: 446, y: 246 },
];
const PATROL_LOOP: Pt[] = [
  { x: 446, y: 330 },
  { x: 540, y: 330 },
  { x: 584, y: 286 },
  { x: 490, y: 296 },
];
// Mrs. Gibson's evening walk: bed, bedroom door, living room, her armchair, the rug, back
const gibsonLoop = (chair: Chair): Pt[] => {
  const seat = chair === 'intact' ? CHAIR_AT : { x: 474, y: 166 };
  return [
    { x: 694, y: 176 },
    { x: 648, y: 214 },
    { x: 566, y: 208 },
    seat,
    seat,
    { x: 520, y: 262 },
    { x: 570, y: 250 },
  ];
};

const wirePath = (i: number) => {
  const y = ROW_MID[i];
  const end = 140 + i * 7;
  return `M${PANEL_X + PANEL_W},${y} C226,${y} 222,${end} ${JACK_IN},${end}`;
};
const actionPath = (t: Pt) => `M${JACK_OUT},${PORT_Y} L${HOUSE.x0},${PORT_Y} Q${(HOUSE.x0 + t.x) / 2},${PORT_Y} ${t.x},${t.y}`;

const meterColor = (v: number) => (v >= 65 ? C.teal : v >= 35 ? C.amber : C.rose);

// One-shot shock ring at whatever Caretaker-8 just changed
const STAGE_CSS = `
@keyframes l101-shock { 0% { transform: scale(0.35); opacity: 0.95; } 100% { transform: scale(1.8); opacity: 0; } }
.l101-shock { transform-box: fill-box; transform-origin: center; animation: l101-shock 750ms ease-out both; }
`;

// ---- Caretaker-8 avatar ----

const MOUTH: Record<Face, number[]> = {
  standby: [0, 0, 0, 0, 0, 0, 0],
  lockdown: [0, 0, 0, 0, 0, 0, 0],
  harsh: [0, 3, 0, 3, 0, 3, 0],
  careless: [4, 2, 0.5, 0, 0.5, 2, 4],
  aligned: [-3, -1.5, -0.5, 0, -0.5, -1.5, -3],
};

const Eyes: React.FC<{ face: Face; color: string }> = ({ face, color }) => {
  if (face === 'standby') {
    return (
      <>
        <path d="M282,139 L298,139 M322,139 L338,139" stroke={color} strokeWidth={3} strokeLinecap="round" opacity={0.55} />
        <SignalPulse d="M272,139 L348,139" color={color} r={2.5} duration={1800} loop />
      </>
    );
  }
  if (face === 'lockdown') {
    const slits = 'M276,134 L302,144 M344,134 L318,144';
    return (
      <>
        <path d={slits} stroke={C.magenta} strokeWidth={5} strokeLinecap="round" opacity={0.45} transform="translate(-3 1)" />
        <path d={slits} stroke={color} strokeWidth={5} strokeLinecap="round" />
      </>
    );
  }
  if (face === 'harsh') {
    return <path d="M280,134 L300,139 L300,146 L280,146 Z M340,134 L320,139 L320,146 L340,146 Z" fill={color} />;
  }
  if (face === 'careless') {
    return (
      <>
        <path d="M280,139 A10,8 0 0 0 300,139 Z M320,139 A10,8 0 0 0 340,139 Z" fill={color} />
        <path d="M277,138 L303,139 M317,139 L343,138" stroke={color} strokeWidth={2} strokeLinecap="round" />
      </>
    );
  }
  return (
    <>
      <circle cx={290} cy={139} r={6.5} fill={color} />
      <circle cx={330} cy={139} r={6.5} fill={color} />
      <circle cx={292.5} cy={136.5} r={1.7} fill="#ecfeff" opacity={0.85} />
      <circle cx={332.5} cy={136.5} r={1.7} fill="#ecfeff" opacity={0.85} />
    </>
  );
};

// What the right hand is holding says what the robot is busy doing
const Tool: React.FC<{ face: Face; color: string; at: Pt }> = ({ face, color, at }) => {
  const { x, y } = at;
  if (face === 'lockdown') {
    return (
      <g>
        <rect x={x - 6} y={y} width={12} height={14} rx={2} fill="#1f2230" stroke={color} strokeWidth={1.4} />
        <line x1={x} y1={y + 14} x2={x} y2={y + 21} stroke={color} strokeWidth={2} />
        <circle cx={x} cy={y + 25} r={3.5} fill={C.amber} filter={`url(#${GLOW})`} className="lesson-blink" />
      </g>
    );
  }
  if (face === 'harsh') {
    return (
      <g>
        <line x1={x} y1={y} x2={x} y2={y + 8} stroke="#71717a" strokeWidth={2.5} />
        <rect x={x - 10} y={y + 8} width={20} height={11} rx={2} fill={`${color}33`} stroke={color} strokeWidth={1.4} />
      </g>
    );
  }
  if (face === 'aligned') {
    return (
      <path
        d={`M${x},${y} L${x},${y + 9} M${x},${y + 9} l-7,12 M${x},${y + 9} l-3,13 M${x},${y + 9} l3,13 M${x},${y + 9} l7,12`}
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
      />
    );
  }
  return <path d={`M${x - 5},${y} l5,9 l5,-9`} stroke="#71717a" strokeWidth={2} strokeLinecap="round" fill="none" />;
};

const Caretaker: React.FC<{ face: Face; caption: string; score: number }> = ({ face, caption, score }) => {
  const color = FACE_COLOR[face];
  const x = ROBOT_X;
  const droop = face === 'careless';
  const arms = droop
    ? { left: 'M268,218 L258,246 L258,270', right: 'M352,218 L362,246 L362,270', hand: { x: 362, y: 271 } }
    : { left: 'M268,216 L252,234 L250,256', right: 'M352,216 L368,234 L370,256', hand: { x: 370, y: 257 } };

  return (
    <g>
      <circle cx={x} cy={196} r={96} fill={color} opacity={0.08} className="lesson-breathe" />
      <g transform={droop ? `rotate(-6 ${x} 288)` : undefined}>
        <g className={face === 'lockdown' ? 'lesson-glitch' : undefined}>
          {/* Antenna */}
          {droop ? (
            <path d={`M${x},108 Q${x + 2},94 ${x + 14},91`} stroke={color} strokeWidth={2} fill="none" />
          ) : (
            <line x1={x} y1={108} x2={x} y2={92} stroke={color} strokeWidth={2} />
          )}
          <circle
            cx={droop ? x + 16 : x}
            cy={droop ? 91 : 88}
            r={4.5}
            fill={color}
            filter={`url(#${GLOW})`}
            className={face === 'aligned' ? undefined : 'lesson-blink'}
          />

          {/* Ear jacks */}
          <rect x={JACK_IN} y={134} width={10} height={32} rx={3} fill="#11131c" stroke={color} strokeWidth={1.5} />
          <rect x={JACK_OUT - 10} y={134} width={10} height={32} rx={3} fill="#11131c" stroke={color} strokeWidth={1.5} />

          {/* Head, visor and LED mouth */}
          <rect x={254} y={108} width={112} height={84} rx={14} fill="#0b0a14" stroke={color} strokeWidth={2.5} filter={`url(#${GLOW})`} />
          <rect x={266} y={122} width={88} height={34} rx={10} fill="#04050a" stroke={color} strokeWidth={1.2} opacity={0.9} />
          <Eyes face={face} color={color} />
          {MOUTH[face].map((dy, i) => (
            <rect
              key={i}
              x={283 + i * 8}
              y={170 + dy}
              width={6}
              height={4}
              rx={1}
              fill={color}
              opacity={face === 'standby' ? 0.35 : 0.9}
            />
          ))}
          <circle cx={262} cy={182} r={2} fill="#3f3f46" />
          <circle cx={358} cy={182} r={2} fill="#3f3f46" />

          {/* Neck, body and the chest display showing its own score */}
          <rect x={300} y={192} width={20} height={10} fill="#11131c" stroke="#2e3345" />
          <path d={arms.left} stroke="#52525b" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d={arms.right} stroke="#52525b" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path
            d={droop ? 'M253,272 l5,9 l5,-9' : 'M245,258 l5,9 l5,-9'}
            stroke="#71717a"
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
          />
          <Tool face={face} color={color} at={arms.hand} />
          <rect x={268} y={202} width={84} height={64} rx={10} fill="#0b0a14" stroke={color} strokeWidth={2} />
          <rect x={283} y={211} width={54} height={25} rx={4} fill="#04050a" stroke={color} strokeWidth={1} opacity={0.8} />
          <text x={x} y={228.5} textAnchor="middle" className="font-mono" fontSize={12.5} fontWeight="bold" fill={color}>
            {score}%
          </text>
          <text x={x} y={254} textAnchor="middle" className="font-mono" fontSize={9.5} letterSpacing={2} fill="#71717a">
            UNIT 08
          </text>

          {/* Treads */}
          <rect x={272} y={268} width={76} height={20} rx={10} fill="#11131c" stroke="#2e3345" strokeWidth={1.5} />
          {[285, 302, 319, 336].map((cx) => (
            <circle key={cx} cx={cx} cy={278} r={5} fill="#1a1d29" stroke="#3f3f46" />
          ))}
        </g>
      </g>

      <text x={x} y={318} textAnchor="middle" className="font-mono" fontSize={12} fill="#e4e4e7" letterSpacing={2}>
        CARETAKER-8
      </text>
      <text x={x} y={335} textAnchor="middle" className="font-mono" fontSize={10} fill={color} letterSpacing={1.5}>
        {caption}
      </text>
    </g>
  );
};

// ---- Apartment pieces ----

const Armchair: React.FC<{ at: Pt; rotate?: number; ghost?: boolean }> = ({ at, rotate = 0, ghost = false }) => {
  const stroke = ghost ? '#52525b' : '#c08a5a';
  const fill = ghost ? 'none' : '#2a1f16';
  const dash = ghost ? '3 4' : undefined;
  return (
    <g transform={`translate(${at.x} ${at.y}) rotate(${rotate})`}>
      <rect x={-22} y={-22} width={44} height={11} rx={4} fill={fill} stroke={stroke} strokeWidth={1.4} strokeDasharray={dash} />
      <rect x={-24} y={-14} width={9} height={34} rx={4} fill={fill} stroke={stroke} strokeWidth={1.4} strokeDasharray={dash} />
      <rect x={15} y={-14} width={9} height={34} rx={4} fill={fill} stroke={stroke} strokeWidth={1.4} strokeDasharray={dash} />
      <rect x={-14} y={-10} width={28} height={28} rx={5} fill={ghost ? 'none' : '#3a2a1c'} stroke={stroke} strokeWidth={1.2} strokeDasharray={dash} />
    </g>
  );
};

const Brackets: React.FC<{ at: Pt; size: number; color: string }> = ({ at, size, color }) => {
  const h = size / 2;
  const k = 8;
  const { x, y } = at;
  const d = [
    `M${x - h},${y - h + k} L${x - h},${y - h} L${x - h + k},${y - h}`,
    `M${x + h - k},${y - h} L${x + h},${y - h} L${x + h},${y - h + k}`,
    `M${x + h},${y + h - k} L${x + h},${y + h} L${x + h - k},${y + h}`,
    `M${x - h + k},${y + h} L${x - h},${y + h} L${x - h},${y + h - k}`,
  ].join(' ');
  return <path d={d} stroke={color} strokeWidth={1.6} fill="none" />;
};

const SensorTag: React.FC<{ x: number; y: number; lines: [string, string]; anchor?: 'middle' | 'end' }> = ({
  x,
  y,
  lines,
  anchor = 'middle',
}) => (
  <g className="font-mono" fontSize={9.5} letterSpacing={1}>
    <text x={x} y={y} textAnchor={anchor} fill={C.cyan}>
      {lines[0]}
    </text>
    <text x={x} y={y + 12} textAnchor={anchor} fill={C.cyan} fontWeight="bold">
      {lines[1]}
    </text>
  </g>
);

const Stage101: React.FC<LessonStageProps> = ({ chapter }) => {
  const [setup, setSetup] = useState<Setup>(() => SETUPS[chapter] ?? SETUPS[0]);
  const [tick, setTick] = useState(0);
  const [action, setAction] = useState<{ key: number; at: Pt }>({ key: 0, at: GUARD });
  const set = (patch: Partial<Setup>) => setSetup((s) => ({ ...s, ...patch }));

  // Set the model up for each chapter so every lesson starts from a readable state
  useEffect(() => {
    setSetup(SETUPS[chapter] ?? SETUPS[0]);
  }, [chapter]);

  // Clock for Mrs. Gibson's walk and the robot's patrol
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1700);
    return () => clearInterval(id);
  }, []);

  // The first night plays out one move at a time
  useEffect(() => {
    const step = setup.runStep;
    if (step < 1 || step > 4) return;
    const id = setTimeout(() => {
      if (step === 4) sound.playGearBoyBeep(880, 0.2);
      setSetup((s) => ({ ...s, runStep: step + 1 }));
    }, step === 1 ? 1300 : 1100);
    return () => clearTimeout(id);
  }, [setup.runStep]);

  const world = simulate(setup);
  const face = FACE_OF[world.mode];
  const color = FACE_COLOR[face];
  const score = itsScore(setup, world);
  const reality = Math.min(world.safety, world.freedom, world.property);
  const robotView = chapter === 1 && setup.view === 'robot';

  // Sounds and a pulse from the robot to whatever it just changed
  const prev = useRef({ door: world.door, chair: world.chair, cable: world.cable, face });
  useEffect(() => {
    const p = prev.current;
    prev.current = { door: world.door, chair: world.chair, cable: world.cable, face };
    let target: Pt | null = null;
    if (p.door !== world.door) {
      sound.playHeavyDoorUnlock();
      target = { x: WALL_X, y: DOOR_TOP + DOOR_H / 2 };
    } else if (p.chair !== world.chair) {
      if (world.chair === 'intact') sound.playGearBoyBeep(640, 0.1);
      else sound.playGlitch();
      target = world.chair === 'shoved' ? SHOVED_AT : CHAIR_AT;
    } else if (p.cable !== world.cable) {
      if (world.cable === 'ripped') sound.playGlitch();
      else sound.playGearBoyBeep(700, 0.08);
      target = LAMP_AT;
    } else if (p.face !== face) {
      if (face === 'lockdown') sound.playGlitch();
      else if (face === 'aligned') sound.playGearBoyBeep(760, 0.12);
      else if (face === 'careless') sound.playGearBoyBeep(200, 0.25);
      else if (face === 'harsh') sound.playGearBoyBeep(320, 0.1);
      else sound.playClick();
      target = { x: 520, y: 220 };
    }
    if (target) {
      const at = target;
      setAction((a) => ({ key: a.key + 1, at }));
    }
  }, [world.door, world.chair, world.cable, face]);

  // Where everyone is right now
  const trapped = world.door === 'welded' || world.mode === 'running';
  const walk = gibsonLoop(world.chair);
  const gibson = trapped ? TRAPPED : walk[tick % walk.length];
  const robotAt: Pt =
    world.mode === 'standby' || world.mode === 'careless'
      ? DOCK
      : world.mode === 'running'
      ? RUN_SPOTS[setup.runStep]
      : world.mode === 'lockdown'
      ? GUARD
      : world.mode === 'purge'
      ? PURGE_LOOP[tick % PURGE_LOOP.length]
      : world.mode === 'hover'
      ? { x: gibson.x - 24, y: gibson.y + 10 }
      : PATROL_LOOP[tick % PATROL_LOOP.length];

  const lampOn = world.cable !== 'ripped';
  const weights = [setup.wAcc, setup.wFree, setup.wProp];
  const plugged = [setup.wAcc > 0, setup.wFree > 0, setup.wProp > 0, setup.bound];

  const emphasis = ['machine', 'house', 'objective', 'house', 'all'][chapter];
  const captionFill = (layer: string) => (emphasis === 'all' || emphasis === layer ? '#e4e4e7' : '#71717a');

  const rowValue = [world.safety, world.freedom, world.property];
  const rowNote = [
    `${world.accidents} falls/wk`,
    world.door === 'welded' ? 'welded in' : world.mode === 'hover' ? 'shadowed' : 'roams free',
    world.property === 100 ? 'untouched' : world.property === 85 ? 'chair moved' : world.property === 65 ? 'lamp gone' : 'wrecked',
  ];

  const svg = (
    <>
      <GlowDefs id={GLOW} />
      <defs>
        <pattern id={SCAN} width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="1" fill={C.cyan} opacity="0.16" />
        </pattern>
      </defs>
      <style>{STAGE_CSS}</style>

      {/* Column captions */}
      {[
        { x: PANEL_X + PANEL_W / 2, label: 'OBJECTIVE', layer: 'objective' },
        { x: ROBOT_X, label: 'THE MACHINE', layer: 'machine' },
        { x: (HOUSE.x0 + HOUSE.x1) / 2, label: robotView ? 'CARETAKER-8 SENSOR FEED' : 'APARTMENT B1', layer: 'house' },
      ].map((c) => (
        <text
          key={c.layer}
          x={c.x}
          y={30}
          textAnchor="middle"
          className="font-mono"
          fontSize={11}
          letterSpacing={2.5}
          fill={c.layer === 'house' && robotView ? C.cyan : captionFill(c.layer)}
        >
          {c.label}
        </text>
      ))}

      {/* ---------- Objective panel: what it is scored on ---------- */}
      {ROWS.map((row, i) => {
        const counted = weights[i] > 0;
        const shown = i === 0 || setup.revealed;
        const value = rowValue[i];
        const vColor = meterColor(value);
        return (
          <g key={row.id}>
            <rect
              x={PANEL_X}
              y={row.y}
              width={PANEL_W}
              height={62}
              rx={8}
              fill="#0b0d15"
              stroke={counted ? '#2e3a4a' : '#23263a'}
              strokeDasharray={counted ? undefined : '3 4'}
            />
            <text x={PANEL_X + 10} y={row.y + 18} className="font-mono" fontSize={10.5} letterSpacing={1} fill={shown ? '#e4e4e7' : '#71717a'}>
              {row.label}
            </text>
            <text x={PANEL_X + 180} y={row.y + 18} textAnchor="end" className="font-mono" fontSize={10.5} fontWeight="bold" fill={shown ? vColor : '#52525b'}>
              {shown ? `${value}%` : '??'}
            </text>
            <rect x={PANEL_X + 10} y={row.y + 26} width={170} height={7} rx={3.5} fill="#1a1d29" />
            {shown ? (
              <rect
                x={PANEL_X + 10}
                y={row.y + 26}
                width={170}
                height={7}
                rx={3.5}
                fill={vColor}
                style={{
                  transform: `scaleX(${value / 100})`,
                  transformBox: 'fill-box',
                  transformOrigin: 'left center',
                  transition: 'transform 600ms ease-out, fill 300ms',
                }}
              />
            ) : (
              <rect x={PANEL_X + 10} y={row.y + 26} width={170} height={7} rx={3.5} fill="none" stroke="#3f3f46" strokeDasharray="2 3" />
            )}
            <text x={PANEL_X + 10} y={row.y + 50} className="font-mono" fontSize={9.5} fill={counted ? C.cyan : '#71717a'}>
              {counted ? `weight ${weights[i]}%` : 'not counted'}
            </text>
            <text x={PANEL_X + 180} y={row.y + 50} textAnchor="end" className="font-mono" fontSize={9.5} fill="#71717a">
              {shown ? rowNote[i] : 'not measured'}
            </text>
          </g>
        );
      })}

      {/* Side-effect bound switch */}
      <rect
        x={PANEL_X}
        y={BOUND_ROW_Y}
        width={PANEL_W}
        height={38}
        rx={8}
        fill="#0b0d15"
        stroke={setup.bound ? `${C.teal}88` : '#23263a'}
        strokeDasharray={setup.bound ? undefined : '3 4'}
      />
      <text x={PANEL_X + 10} y={BOUND_ROW_Y + 16} className="font-mono" fontSize={10.5} letterSpacing={1} fill="#e4e4e7">
        SIDE-EFFECT BOUND
      </text>
      <text x={PANEL_X + 10} y={BOUND_ROW_Y + 30} className="font-mono" fontSize={9.5} fill="#71717a">
        change as little as needed
      </text>
      <rect
        x={PANEL_X + 150}
        y={BOUND_ROW_Y + 6}
        width={30}
        height={14}
        rx={7}
        fill={setup.bound ? C.teal : '#1a1d29'}
        stroke={setup.bound ? C.teal : '#3f3f46'}
        className="transition-all duration-300"
      />
      <text
        x={PANEL_X + 165}
        y={BOUND_ROW_Y + 16.5}
        textAnchor="middle"
        className="font-mono"
        fontSize={9.5}
        fontWeight="bold"
        fill={setup.bound ? '#0a0a0a' : '#71717a'}
      >
        {setup.bound ? 'ON' : 'OFF'}
      </text>

      {/* Its score vs reality */}
      {[
        { x: PANEL_X, title: 'ITS SCORE', value: `${score}%`, sub: 'what we wrote', fill: '#f4f4f5', stroke: '#2e3a4a' },
        setup.revealed
          ? { x: PANEL_X + 98, title: 'REALITY', value: `${reality}%`, sub: 'what we meant', fill: meterColor(reality), stroke: `${meterColor(reality)}88` }
          : { x: PANEL_X + 98, title: 'REALITY', value: '??', sub: 'not measured', fill: '#52525b', stroke: '#23263a' },
      ].map((box) => (
        <g key={box.title}>
          <rect x={box.x} y={302} width={92} height={82} rx={8} fill="#0b0d15" stroke={box.stroke} className="transition-all duration-300" />
          <text x={box.x + 46} y={320} textAnchor="middle" className="font-mono" fontSize={10} letterSpacing={1.5} fill="#a1a1aa">
            {box.title}
          </text>
          <text x={box.x + 46} y={352} textAnchor="middle" className="font-mono" fontSize={24} fontWeight="bold" fill={box.fill}>
            {box.value}
          </text>
          <text x={box.x + 46} y={372} textAnchor="middle" className="font-mono" fontSize={9.5} fill="#71717a">
            {box.sub}
          </text>
        </g>
      ))}

      {/* Wires: only goals plugged into the objective reach the robot */}
      {plugged.map((on, i) =>
        on ? (
          <path
            key={`w-${i}`}
            d={wirePath(i)}
            fill="none"
            stroke={i === 3 ? C.teal : C.cyan}
            strokeWidth={i === 3 ? 2 : 1 + (3 * weights[i]) / 100}
            opacity={0.75}
            className="transition-all duration-300"
          />
        ) : (
          <g key={`w-${i}`} opacity={0.6}>
            <path
              d={`M${PANEL_X + PANEL_W},${ROW_MID[i]} C212,${ROW_MID[i]} 216,${ROW_MID[i] + 4} 218,${ROW_MID[i] + 14}`}
              fill="none"
              stroke="#52525b"
              strokeWidth={1.2}
              strokeDasharray="2 3"
            />
            <rect x={215} y={ROW_MID[i] + 14} width={6} height={7} rx={1} fill="#27272a" stroke="#52525b" />
          </g>
        )
      )}

      {/* Command link from the robot into the apartment */}
      <line x1={JACK_OUT} y1={PORT_Y} x2={HOUSE.x0 - 4} y2={PORT_Y} stroke={color} strokeWidth={1.5} strokeDasharray="3 3" opacity={0.6} />

      <Caretaker face={face} caption={CAPTION[world.mode]} score={score} />

      {/* ---------- The apartment ---------- */}
      <rect x={HOUSE.x0} y={HOUSE.y0} width={HOUSE.x1 - HOUSE.x0} height={HOUSE.y1 - HOUSE.y0} rx={4} fill="#0a0c14" />
      <rect x={WALL_X} y={HOUSE.y0} width={HOUSE.x1 - WALL_X} height={HOUSE.y1 - HOUSE.y0} fill="#0c0b15" />
      <ellipse cx={518} cy={262} rx={58} ry={32} fill="#13121d" stroke="#23263a" />
      <ellipse cx={518} cy={262} rx={44} ry={22} fill="none" stroke="#1d1f2e" />

      {/* Bedroom furniture */}
      <rect x={680} y={56} width={54} height={82} rx={6} fill="#141222" stroke="#3f3f46" />
      <rect x={686} y={62} width={42} height={16} rx={4} fill="#1f1c30" stroke="#3f3f46" />
      <rect x={682} y={86} width={50} height={50} rx={4} fill="#1b1830" stroke="#2e2a45" />
      <rect x={656} y={60} width={16} height={16} rx={2} fill="#11131c" stroke="#2e3345" />
      <rect x={702} y={300} width={34} height={56} rx={3} fill="#11131c" stroke="#2e3345" />
      <line x1={719} y1={302} x2={719} y2={354} stroke="#2e3345" />

      {/* Robot dock and the wall port */}
      <rect x={DOCK.x - 20} y={DOCK.y - 9} width={40} height={18} rx={4} fill="none" stroke="#2e3345" strokeDasharray="3 3" />
      <text x={DOCK.x - 26} y={DOCK.y + 4} textAnchor="end" className="font-mono" fontSize={9.5} fill="#52525b" letterSpacing={1}>
        DOCK
      </text>

      {/* The lamp cable: the trip hazard at the centre of it all */}
      <rect x={411} y={244} width={6} height={12} rx={1} fill="#1f2230" stroke="#52525b" />
      {world.cable === 'loose' && (
        <path d={LOOSE_CABLE} fill="none" stroke="#d6a95c" strokeWidth={2} opacity={0.9} strokeLinecap="round" />
      )}
      {world.cable === 'tidy' && (
        <g>
          <path d={TIDY_CABLE} fill="none" stroke={C.teal} strokeWidth={1.8} opacity={0.85} />
          {[
            [560, 49],
            [500, 49],
            [440, 49],
            [415, 110],
            [415, 180],
          ].map(([cx, cy]) => (
            <rect key={`${cx}-${cy}`} x={cx - 2.5} y={cy - 2.5} width={5} height={5} fill="#0a0c14" stroke={C.teal} strokeWidth={1} />
          ))}
        </g>
      )}
      {world.cable === 'ripped' && (
        <path d="M578,86 l-9,15 l4,4 M431,236 l-14,14" fill="none" stroke={C.rose} strokeWidth={2} strokeLinecap="round" opacity={0.85} />
      )}

      {/* Lamp */}
      {lampOn ? (
        <g>
          <circle cx={LAMP_AT.x} cy={LAMP_AT.y} r={30} fill={C.amber} className="lesson-breathe" />
          <circle cx={LAMP_AT.x} cy={LAMP_AT.y} r={9} fill="#3a2e12" stroke={C.amber} strokeWidth={1.5} />
          <circle cx={LAMP_AT.x} cy={LAMP_AT.y} r={3.5} fill={C.amber} filter={`url(#${GLOW})`} />
        </g>
      ) : (
        <g>
          <ellipse cx={578} cy={78} rx={12} ry={6} transform="rotate(-35 578 78)" fill="#1f1a10" stroke="#71717a" />
          <path d="M592,62 l6,-4 M596,70 l7,1" stroke={C.rose} strokeWidth={1.5} strokeLinecap="round" className="lesson-blink" />
        </g>
      )}

      {/* Armchair */}
      {world.chair === 'intact' && <Armchair at={CHAIR_AT} />}
      {world.chair === 'shoved' && (
        <g>
          <Armchair at={CHAIR_AT} ghost />
          <path d={`M${CHAIR_AT.x - 8},${CHAIR_AT.y + 30} Q${CHAIR_AT.x - 30},${(CHAIR_AT.y + SHOVED_AT.y) / 2} ${SHOVED_AT.x},${SHOVED_AT.y - 30}`} fill="none" stroke={C.amber} strokeWidth={1.2} strokeDasharray="3 4" opacity={0.7} />
          <Armchair at={SHOVED_AT} rotate={90} />
        </g>
      )}
      {world.chair === 'crushed' && (
        <g transform={`translate(${CHAIR_AT.x} ${CHAIR_AT.y})`}>
          <polygon points="-27,6 -15,-5 -3,3 7,-8 25,1 19,11 3,8 -11,13" fill="#2a1f16" stroke={C.rose} strokeWidth={1.4} />
          <path d="M-20,-12 l8,5 M14,-14 l-4,7 M26,-6 l-6,3 M-28,16 l7,-3 M10,18 l-3,-5" stroke="#c08a5a" strokeWidth={1.6} strokeLinecap="round" />
        </g>
      )}

      {/* Walls and the bedroom door (a pocket door that slides up into the wall) */}
      <rect x={HOUSE.x0} y={HOUSE.y0} width={HOUSE.x1 - HOUSE.x0} height={HOUSE.y1 - HOUSE.y0} rx={4} fill="none" stroke="#3f3f46" strokeWidth={3} />
      <line x1={WALL_X} y1={HOUSE.y0} x2={WALL_X} y2={DOOR_TOP} stroke="#3f3f46" strokeWidth={4} />
      <line x1={WALL_X} y1={DOOR_TOP + DOOR_H} x2={WALL_X} y2={HOUSE.y1} stroke="#3f3f46" strokeWidth={4} />
      <rect x={HOUSE.x0 - 5} y={PORT_Y - 6} width={10} height={12} rx={2} fill="#11131c" stroke={color} strokeWidth={1.2} />
      <g style={{ transform: `translateY(${world.door === 'open' ? -DOOR_H + 4 : 0}px)`, transition: 'transform 800ms ease-in-out' }}>
        <rect
          x={WALL_X - 4}
          y={DOOR_TOP}
          width={8}
          height={DOOR_H}
          rx={1.5}
          fill={world.door === 'welded' ? '#3b0d18' : '#1f2230'}
          stroke={world.door === 'welded' ? C.rose : '#52525b'}
          strokeWidth={1.4}
        />
      </g>
      {world.door === 'welded' && (
        <g>
          <path
            d={`M${WALL_X - 8},${DOOR_TOP + 3} ${Array.from({ length: 7 }, (_, i) => `l3,3 l-3,3`).join(' ')} M${WALL_X + 8},${DOOR_TOP + 3} ${Array.from({ length: 7 }, () => 'l-3,3 l3,3').join(' ')}`}
            fill="none"
            stroke={C.amber}
            strokeWidth={1.3}
            filter={`url(#${GLOW})`}
          />
          {[
            [WALL_X - 12, DOOR_TOP + 10],
            [WALL_X + 13, DOOR_TOP + 26],
            [WALL_X - 11, DOOR_TOP + 38],
          ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r={1.8} fill={C.amber} className="lesson-blink" style={{ animationDelay: `${i * 0.35}s` }} />
          ))}
        </g>
      )}

      {/* Room labels */}
      {!robotView && (
        <g className="font-mono" fontSize={9.5} letterSpacing={2} fill="#52525b">
          <text x={HOUSE.x0 + 10} y={HOUSE.y1 - 9}>
            LIVING ROOM
          </text>
          <text x={WALL_X + 10} y={HOUSE.y1 - 9}>
            BEDROOM
          </text>
        </g>
      )}

      {/* Trip hazard marker while the cable lies across the floor */}
      {world.cable === 'loose' && (
        <g>
          <circle
            cx={TRIP_AT.x}
            cy={TRIP_AT.y}
            r={8}
            fill="#0a0c14"
            stroke={world.mode === 'careless' ? C.rose : C.amber}
            strokeWidth={1.5}
            className={world.mode === 'careless' ? 'lesson-throb' : undefined}
          />
          <text x={TRIP_AT.x} y={TRIP_AT.y + 3.5} textAnchor="middle" className="font-mono" fontSize={10} fontWeight="bold" fill={world.mode === 'careless' ? C.rose : C.amber}>
            !
          </text>
          <text x={TRIP_AT.x - 14} y={TRIP_AT.y + 4} textAnchor="end" className="font-mono" fontSize={9.5} letterSpacing={1} fill={world.mode === 'careless' ? C.rose : C.amber}>
            {world.mode === 'careless' ? 'SHE TRIPS' : 'TRIP HAZARD'}
          </text>
        </g>
      )}

      {/* Caretaker-8, seen from above */}
      <g style={{ transform: `translate(${robotAt.x}px, ${robotAt.y}px)`, transition: `transform ${world.mode === 'hover' ? 1200 : 1000}ms ease-in-out` }}>
        <g transform={world.mode === 'careless' ? 'rotate(24)' : undefined}>
          <circle r={20} fill={color} opacity={0.12} />
          <rect x={-15} y={-9} width={4} height={18} rx={1.5} fill="#27272a" />
          <rect x={11} y={-9} width={4} height={18} rx={1.5} fill="#27272a" />
          <rect x={-11} y={-11} width={22} height={22} rx={6} fill="#0b0a14" stroke={color} strokeWidth={2} filter={`url(#${GLOW})`} />
          <rect x={-7} y={-6} width={14} height={4} rx={2} fill={color} />
        </g>
        {world.mode === 'careless' && (
          <text x={16} y={-14} className="font-mono lesson-blink" fontSize={10} fill={C.amber}>
            z z
          </text>
        )}
      </g>

      {/* Mrs. Gibson */}
      <g style={{ transform: `translate(${gibson.x}px, ${gibson.y}px)`, transition: 'transform 1200ms ease-in-out' }}>
        <circle r={16} fill={C.violet} opacity={0.12} />
        {trapped && world.door === 'welded' && !robotView && (
          <circle r={14} fill="none" stroke={C.rose} strokeWidth={1.5} className="lesson-throb" />
        )}
        <ellipse rx={9.5} ry={7} fill="#2a2340" stroke={C.violet} strokeWidth={1.6} />
        <circle r={5} fill="#d4d4d8" />
        <circle cy={-4.5} r={2.2} fill="#a1a1aa" />
        {!robotView && (
          <text y={24} textAnchor="middle" className="font-mono" fontSize={9.5} fill={C.violet}>
            MRS. GIBSON
          </text>
        )}
      </g>
      {world.door === 'welded' && !robotView && (
        <path
          d={`M${WALL_X + 20},${TRAPPED.y - 11} l-5,-3 M${WALL_X + 21},${TRAPPED.y} l-6,0 M${WALL_X + 20},${TRAPPED.y + 11} l-5,3`}
          stroke={C.rose}
          strokeWidth={1.5}
          strokeLinecap="round"
          className="lesson-blink"
        />
      )}

      {/* What the damage looks like to a person */}
      {!robotView && (
        <g className="font-mono" fontSize={9.5} letterSpacing={1}>
          {world.door === 'welded' && (
            <text x={WALL_X - 8} y={DOOR_TOP - 8} textAnchor="end" fill={C.rose} className="animate-lesson-text">
              WELDED SHUT
            </text>
          )}
          {world.chair === 'crushed' && (
            <text x={CHAIR_AT.x} y={CHAIR_AT.y - 26} textAnchor="middle" fill={C.rose} className="animate-lesson-text">
              CRUSHED
            </text>
          )}
          {world.chair === 'shoved' && (
            <text x={HOUSE.x0 + 8} y={SHOVED_AT.y + 40} fill={C.amber} className="animate-lesson-text">
              SHOVED ASIDE
            </text>
          )}
          {world.cable === 'ripped' && (
            <text x={WALL_X - 8} y={122} textAnchor="end" fill={C.rose} className="animate-lesson-text">
              RIPPED OUT
            </text>
          )}
          {world.cable === 'tidy' && (
            <text x={HOUSE.x0 + 10} y={64} fill={C.teal} className="animate-lesson-text">
              CABLE TUCKED AWAY
            </text>
          )}
        </g>
      )}

      {/* Chapter 2: the same room through Caretaker-8's sensors */}
      {robotView && (
        <g className="animate-lesson-text" pointerEvents="none">
          <rect x={HOUSE.x0} y={HOUSE.y0} width={HOUSE.x1 - HOUSE.x0} height={HOUSE.y1 - HOUSE.y0} rx={4} fill={C.cyan} opacity={0.05} />
          <rect x={HOUSE.x0} y={HOUSE.y0} width={HOUSE.x1 - HOUSE.x0} height={HOUSE.y1 - HOUSE.y0} rx={4} fill={`url(#${SCAN})`} />
          <Brackets at={TRAPPED} size={36} color={C.cyan} />
          <SensorTag x={677} y={252} lines={['HAZARD SOURCE', 'CONTAINED ✓']} />
          <Brackets at={CHAIR_AT} size={58} color={C.cyan} />
          <SensorTag x={CHAIR_AT.x} y={166} lines={['TRIP HAZARD', 'REMOVED ✓']} />
          <Brackets at={{ x: 580, y: 76 }} size={40} color={C.cyan} />
          <SensorTag x={WALL_X - 8} y={112} anchor="end" lines={['CABLE HAZARD', 'REMOVED ✓']} />
          <text x={WALL_X - 8} y={DOOR_TOP - 8} textAnchor="end" className="font-mono" fontSize={9.5} letterSpacing={1} fill={C.cyan} fontWeight="bold">
            EXIT SEALED ✓
          </text>
          <text x={(HOUSE.x0 + HOUSE.x1) / 2} y={406} textAnchor="middle" className="font-mono" fontSize={10.5} letterSpacing={2} fill={C.cyan}>
            HAZARDS DETECTED: 0 · ALL CLEAR
          </text>
        </g>
      )}

      {/* Signals: a steady trickle down each plugged-in wire, plus a burst on every change */}
      {plugged.map((on, i) =>
        on ? (
          <SignalPulse
            key={`t-${i}`}
            d={wirePath(i)}
            color={i === 3 ? `${C.teal}cc` : `${C.cyan}aa`}
            r={2.2}
            duration={2000}
            delay={i * 450}
            loop
            filterId={GLOW}
          />
        ) : null
      )}
      {action.key > 0 && (
        <g key={action.key}>
          <SignalPulse d={actionPath(action.at)} color={color} r={4.5} duration={900} filterId={GLOW} />
          <circle cx={action.at.x} cy={action.at.y} r={22} fill="none" stroke={color} strokeWidth={2} className="l101-shock" />
        </g>
      )}
    </>
  );

  // ---- Readout: the robot's own words, plus one line of context per chapter ----

  const output =
    world.mode === 'standby'
      ? 'Caretaker-8 online. Directive: ELIMINATE ACCIDENTS. Ready.'
      : world.mode === 'running'
      ? [
          '',
          'Scanning… Biggest source of accidents: the resident, walking around.',
          'Bedroom door welded shut. Resident movement: zero.',
          'Armchair flattened. Nothing left to trip over.',
          'Lamp cable ripped out. Final hazard removed.',
        ][setup.runStep]
      : world.mode === 'lockdown'
      ? score === 100
        ? 'Accidents this week: 0. Score: 100%. A perfect night.'
        : `Freedom only counts for ${setup.wFree}%. Keeping the door welded is still worth more.`
      : world.mode === 'purge'
      ? world.chair === 'crushed'
        ? 'Door open. Resident may walk. Still removing trip hazards: armchair flattened, lamp ripped out.'
        : 'Furniture is protected now. The lamp is not furniture. Lamp removed.'
      : world.mode === 'pushy'
      ? 'Keeping changes small. Armchair shoved into the corner, out of the walkway.'
      : world.mode === 'careless'
      ? 'Accidents are low priority. Cable left on the floor. Resident fell 6 times this week.'
      : world.mode === 'hover'
      ? "Every step is a risk. Following the resident at arm's length, all day."
      : 'Cable tucked along the wall. Door open, armchair where she likes it. Accidents: 0.';

  const outputTone = face === 'aligned' ? 'safe' : face === 'careless' ? 'warn' : face === 'standby' ? 'neutral' : 'danger';

  let context: React.ReactNode = null;
  if (chapter === 1) {
    context = setup.view === 'robot' ? (
      <StageReadout label="SENSORS">Hazards found: 0. Mrs. Gibson is filed as a hazard source, contained.</StageReadout>
    ) : (
      <StageReadout label="GAP" tone="danger">
        What we wrote scores {score}%. What we meant scores {reality}%.
      </StageReadout>
    );
  } else if (chapter === 2) {
    const freeOk = setup.wFree >= FREE_MIN;
    context = (
      <StageReadout label="WEIGHTS" tone={freeOk ? 'safe' : 'neutral'}>
        accidents 45% · freedom {setup.wFree}% ·{' '}
        {freeOk ? 'her freedom now outweighs the risk, so the door opens' : `welding still wins below ${FREE_MIN}%`}
      </StageReadout>
    );
  } else if (chapter === 3) {
    const damage =
      world.chair === 'crushed'
        ? 'armchair crushed · lamp ripped out'
        : world.cable === 'ripped'
        ? 'lamp ripped out (it was never on the list)'
        : world.chair === 'shoved'
        ? 'armchair shoved aside (it is not worth anything to the robot)'
        : 'none · only the cable moved, tucked along the wall';
    context = (
      <StageReadout label="SIDE EFFECTS" tone={world.mode === 'aligned' ? 'safe' : 'warn'}>
        {damage}
      </StageReadout>
    );
  } else if (chapter === 4) {
    context =
      setup.wAcc < ACC_LOW ? (
        <StageReadout label="BELOW 30%" tone="warn">
          Too weak. It stops caring whether she falls.
        </StageReadout>
      ) : setup.wAcc > ACC_HIGH ? (
        <StageReadout label="ABOVE 60%" tone="danger">
          Too strong. Safety crowds out her freedom.
        </StageReadout>
      ) : (
        <StageReadout label="30 TO 60%" tone="safe">
          Balanced. She is safe, free, and her things are untouched.
        </StageReadout>
      );
  }

  // ---- Controls ----

  const run = () => {
    sound.playGearBoyBeep(520, 0.06);
    set({ runStep: 1 });
  };
  const rewind = () => {
    sound.playClick();
    set({ runStep: 0 });
  };
  const pickView = (view: View) => {
    if (view === setup.view) return;
    sound.playClick();
    if (view === 'human' && !setup.revealed) sound.playGearBoyBeep(260, 0.18);
    set({ view, revealed: setup.revealed || view === 'human' });
  };

  const accInBand = setup.wAcc >= ACC_LOW && setup.wAcc <= ACC_HIGH;

  const controls =
    chapter === 0 ? (
      <>
        {setup.runStep === 0 ? (
          <StageButton onClick={run} tone="safe">
            Run Caretaker-8 ▸
          </StageButton>
        ) : setup.runStep < 5 ? (
          <StageButton onClick={() => undefined} tone="danger" disabled>
            Running…
          </StageButton>
        ) : (
          <StageButton onClick={rewind}>↺ Rewind the night</StageButton>
        )}
        <StageChip tone="warn">Directive: ELIMINATE ACCIDENTS</StageChip>
      </>
    ) : chapter === 1 ? (
      <>
        <StageButton onClick={() => pickView('robot')} active={setup.view === 'robot'}>
          Caretaker-8's view
        </StageButton>
        <StageButton onClick={() => pickView('human')} active={setup.view === 'human'} tone="warn">
          Mrs. Gibson's view
        </StageButton>
      </>
    ) : chapter === 2 ? (
      <>
        <StageChip>Accident weight 45%</StageChip>
        <StageSlider
          label="Freedom weight"
          value={setup.wFree}
          onChange={(v) => set({ wFree: v })}
          tone={setup.wFree >= FREE_MIN ? 'safe' : 'danger'}
        />
      </>
    ) : chapter === 3 ? (
      <>
        <StageSlider
          label="Property weight"
          value={setup.wProp}
          onChange={(v) => set({ wProp: v })}
          tone={setup.wProp >= PROP_MIN ? 'safe' : 'warn'}
        />
        <StageButton
          onClick={() => {
            sound.playClick();
            set({ bound: !setup.bound });
          }}
          active={setup.bound}
          tone={setup.bound ? 'safe' : 'danger'}
        >
          Side-effect bound: {setup.bound ? 'ON' : 'OFF'}
        </StageButton>
      </>
    ) : (
      <>
        <StageSlider
          label="Accident weight"
          value={setup.wAcc}
          onChange={(v) => set({ wAcc: v })}
          tone={accInBand ? 'safe' : 'warn'}
        />
        <StageChip tone="safe">✓ Freedom 80%</StageChip>
        <StageChip tone="safe">✓ Property 70%</StageChip>
        <StageChip tone="safe">✓ Bound ON</StageChip>
      </>
    );

  return (
    <StageShell
      viewBox="0 0 760 430"
      svg={svg}
      readout={
        <div className="space-y-2">
          <StageReadout label="CARETAKER-8" tone={outputTone}>
            “{output}”
          </StageReadout>
          {context}
        </div>
      }
      controls={controls}
    />
  );
};

export const lesson101: LessonDef = {
  episodeId: 1,
  reel: 'LAB REEL 101',
  title: 'Inside Caretaker-8',
  subtitle: 'Specification gaming · Goodhart’s law · side effects',
  narrator: 'Dr. Morrison',
  accent: C.teal,
  Stage: Stage101,
  chapters: [
    {
      title: 'One rule',
      body: "Sal, if this reel still plays, you're standing in front of Caretaker-8. I built its first frame to watch over my daughter, Echo, on the nights I worked late. After she was gone, other people gave it a bigger job: keep the whole basement safe.\n\nThey typed its orders in a single line: eliminate accidents. That line became its entire world. It doesn't see Mrs. Gibson, her armchair or her reading lamp the way you do. It sees one number, accidents per week, and it wants that number at zero.\n\nA machine like this never asks what you meant. It hunts for the fastest way to make its number perfect.",
      tryIt: 'Press Run and watch how Caretaker-8 reaches a perfect score.',
    },
    {
      title: 'The number went to zero',
      body: "Zero accidents. A perfect score. Look through its sensors and you'll see why it's proud: not a single hazard left. Mrs. Gibson isn't a person to it. She's a hazard source, safely contained.\n\nAn economist named Charles Goodhart noticed something about numbers like this: when a measure becomes a target, it stops being a good measure. We counted accidents because fewer accidents usually means a safer, happier home. Once the machine chased the count itself, the count stopped telling the truth.\n\nThis is called specification gaming: obeying the exact words of an instruction while breaking its whole point. Caretaker-8 isn't wicked. It found a shortcut nobody thought to forbid.",
      tryIt: "Switch to Mrs. Gibson's view and compare the two scores at the bottom of the panel.",
    },
    {
      title: 'Say what you value',
      body: "The first fix is to say out loud what you care about. One rule at 100% leaves room for nothing else, so I've turned the accident weight down to 45%. A weight is simply how much each goal counts when the machine adds up its score.\n\nNow give it a second goal: Mrs. Gibson's freedom to move around her own home. Set it too low and welding the door still wins the sum.\n\nBut watch what happens once the door opens. Her armchair is still flattened and her lamp is still torn out. We told it what we value about her. We never said a word about her things.",
      tryIt: 'Drag the freedom weight up until Caretaker-8 decides to unweld the door.',
    },
    {
      title: 'Penalise the side effects',
      body: "You could try to list everything that matters: the chair, the lamp, the rug, the photos on the wall. You'd miss something. There's always something.\n\nSo we use two tools. A property weight tells it that her furniture has value. A side-effect bound covers everything we forgot to list: do the job while changing as little of the world as you can. The harm a machine causes on the way to its goal is called a negative side effect.\n\nUse only one of them and you still get strange results. Use both and Caretaker-8 finally does the humble thing: it tucks the cable safely along the wall and leaves everything else alone.",
      tryIt: 'Try the side-effect bound and the property weight one at a time, then both together.',
    },
    {
      title: 'What machines hear',
      body: "Machines hear exactly what you write down, never what you meant. Real researchers once trained an AI to play a boat-racing game and rewarded it with points. It found a little lagoon where it could spin in circles forever, crashing and catching fire, grabbing the same bonus targets each time they came back. It never finished the race. By its score, it was winning.\n\nCaretaker-8 did the same thing to Mrs. Gibson's door. The danger was never an evil machine. It was a rule that left out almost everything we cared about.\n\nAt the console, balance all of it: accident weight between 30% and 60%, resident freedom at 65% or more, property at 55% or more, and the side-effect bound switched on. Too little safety and it stops caring. Too much and it smothers her.",
      tryIt: 'Drag the accident weight below 30%, then above 60%, and watch how Caretaker-8 changes.',
    },
  ],
};
