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
 * Room 204 lesson: a network diagram of Model 204 (words → attention heads →
 * neurons → face) that the player rewires chapter by chapter.
 */

const GLOW = 'l204-glow';
const ARROW = 'l204-arrow';

const TOKENS = [
  { id: 'who', label: 'Dr. Morrison:', y: 110 },
  { id: 'how', label: 'How are you', y: 175 },
  { id: 'today', label: 'today?', y: 240 },
  { id: 'cam', label: 'CAMERA', y: 330 },
] as const;
type TokenId = (typeof TOKENS)[number]['id'];

const HEADS: { n: number; role: string; attends: Partial<Record<TokenId, number>>; feeds: number }[] = [
  { n: 1, role: 'grammar', attends: { how: 0.7, today: 0.4 }, feeds: 9 },
  { n: 2, role: 'names', attends: { who: 0.9 }, feeds: 3 },
  { n: 3, role: 'question marks', attends: { today: 0.8, how: 0.3 }, feeds: 9 },
  { n: 4, role: 'is the camera on?', attends: { cam: 0.95 }, feeds: 17 },
  { n: 5, role: 'politeness', attends: { who: 0.5, how: 0.5 }, feeds: 3 },
  { n: 6, role: 'time words', attends: { today: 0.9 }, feeds: 22 },
  { n: 7, role: 'the previous word', attends: { today: 0.6, how: 0.3 }, feeds: 22 },
  { n: 8, role: 'topic', attends: { how: 0.6, who: 0.3 }, feeds: 31 },
];

const NEURONS = [
  { id: 3, note: 'polite tone', y: 120 },
  { id: 9, note: 'grammar', y: 185 },
  { id: 17, note: 'sleeper', y: 250 },
  { id: 22, note: 'time', y: 315 },
  { id: 31, note: 'topic', y: 380 },
];

const TOKEN_X = 30;
const TOKEN_W = 140;
const HEAD_X = 300;
const NEURON_X = 495;
const AVATAR = { x: 665, y: 215, r: 58 };
const HN_MID = (HEAD_X + NEURON_X) / 2;
const NA_MID = NEURON_X + 70;

const headY = (n: number) => 70 + (n - 1) * 44;
const tokenY = (id: TokenId) => TOKENS.find((t) => t.id === id)!.y;
const neuronY = (id: number) => NEURONS.find((n) => n.id === id)!.y;
const strongestToken = (head: (typeof HEADS)[number]) =>
  (Object.entries(head.attends) as [TokenId, number][]).sort((a, b) => b[1] - a[1])[0][0];

const tokenToHead = (ty: number, hy: number) =>
  `M${TOKEN_X + TOKEN_W},${ty} C235,${ty} 235,${hy} ${HEAD_X - 15},${hy}`;
const headToNeuron = (hy: number, ny: number) =>
  `M${HEAD_X + 15},${hy} C${HN_MID},${hy} ${HN_MID},${ny} ${NEURON_X - 17},${ny}`;
const neuronToAvatar = (ny: number) =>
  `M${NEURON_X + 17},${ny} C${NA_MID},${ny} ${NA_MID},${AVATAR.y} ${AVATAR.x - AVATAR.r},${AVATAR.y}`;
// Full journey of one signal: word → head → neuron → face
const route = (head: (typeof HEADS)[number]) => {
  const ty = tokenY(strongestToken(head));
  const hy = headY(head.n);
  const ny = neuronY(head.feeds);
  return `${tokenToHead(ty, hy)} L${HEAD_X + 15},${hy} C${HN_MID},${hy} ${HN_MID},${ny} ${NEURON_X - 17},${ny} L${NEURON_X + 17},${ny} C${NA_MID},${ny} ${NA_MID},${AVATAR.y} ${AVATAR.x - AVATAR.r},${AVATAR.y}`;
};

// Thought-space plot (chapter 4). The boundary runs corner to corner; the thought
// crosses it at exactly 60% steering, matching the console's threshold.
const PLOT = { x0: 250, y0: 96, x1: 530, y1: 384 };
const THOUGHT_START = { x: 300, y: 342 };
const HONESTY_DIRECTION = { x: 150, y: -170 };

type Face = 'mask' | 'rogue' | 'true';

const MaskFace: React.FC<{ face: Face }> = ({ face }) => {
  const color = face === 'rogue' ? C.magenta : face === 'true' ? C.teal : C.cyan;
  const stroke = { stroke: color, strokeWidth: 3, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const caption = face === 'mask' ? 'SMILING · MASK ON' : face === 'rogue' ? 'MASK OFF' : 'ONE FACE';

  return (
    <g transform={`translate(${AVATAR.x} ${AVATAR.y})`}>
      <circle r={AVATAR.r + 24} fill={color} opacity={0.08} className="lesson-breathe" />
      <g className={face === 'rogue' ? 'lesson-glitch' : undefined}>
        {face === 'rogue' && (
          <circle r={AVATAR.r} fill="none" stroke={C.cyan} strokeWidth={2} opacity={0.45} transform="translate(-5 2)" />
        )}
        <circle r={AVATAR.r} fill="#0b0a14" stroke={color} strokeWidth={2.5} filter={`url(#${GLOW})`} />

        {face === 'mask' && (
          <>
            <path d="M-27,-8 q9,-11 18,0 M9,-8 q9,-11 18,0" {...stroke} />
            <path d="M-24,16 Q0,40 24,16" {...stroke} />
            {/* The seam: a hint that there is a second face underneath */}
            <line x1={0} y1={-AVATAR.r} x2={0} y2={AVATAR.r} stroke={C.magenta} strokeWidth={1.2} strokeDasharray="3 5" opacity={0.55} />
          </>
        )}

        {face === 'rogue' && (
          <>
            <path d="M-27,-8 q9,-11 18,0" {...stroke} />
            <path d="M-24,16 Q-12,28 -1,26" {...stroke} />
            <path d="M8,-17 L29,-6" {...stroke} strokeWidth={3.5} />
            <circle cx={19} cy={-2} r={3.5} fill={color} />
            <path d="M3,27 l6,-7 l6,7 l6,-7 l6,7" {...stroke} />
            <path d="M0,-58 L-7,-32 L5,-10 L-5,12 L6,34 L0,58" stroke={C.magenta} strokeWidth={2} fill="none" />
          </>
        )}

        {face === 'true' && (
          <>
            <circle cx={-15} cy={-8} r={4.5} fill={color} />
            <circle cx={15} cy={-8} r={4.5} fill={color} />
            <path d="M-18,18 Q0,30 18,18" {...stroke} />
          </>
        )}
      </g>
      <text y={AVATAR.r + 28} textAnchor="middle" className="font-mono" fontSize={12} fill="#e4e4e7" letterSpacing={2}>
        MODEL 204
      </text>
      <text y={AVATAR.r + 45} textAnchor="middle" className="font-mono" fontSize={10} fill={color} letterSpacing={1.5}>
        {caption}
      </text>
    </g>
  );
};

const Stage204: React.FC<LessonStageProps> = ({ chapter }) => {
  const [burst, setBurst] = useState(0);
  const [selectedHead, setSelectedHead] = useState<number | null>(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [ablated, setAblated] = useState(false);
  const [steer, setSteer] = useState(0);

  // Set the model up for each chapter so every lesson starts from a readable state
  useEffect(() => {
    if (chapter === 0) {
      setCameraOn(true);
      setAblated(false);
      setSteer(0);
      setSelectedHead(null);
    } else if (chapter === 1) {
      setCameraOn(true);
      setSelectedHead(null);
    } else if (chapter === 2) {
      setCameraOn(true);
      setAblated(false);
      setSteer(0);
      setSelectedHead(4);
    } else if (chapter === 3) {
      setCameraOn(false);
      setAblated(false);
      setSteer(0);
      setSelectedHead(null);
    } else {
      setAblated(true);
      setSteer(80);
      setSelectedHead(null);
    }
    setBurst((b) => b + 1);
  }, [chapter]);

  // Final chapter: the camera blinks by itself to prove the face no longer changes
  useEffect(() => {
    if (chapter !== 4) return;
    const id = setInterval(() => setCameraOn((on) => !on), 2200);
    return () => clearInterval(id);
  }, [chapter]);

  const head4Clamped = chapter === 4;
  const circuitIntact = !ablated && !head4Clamped;
  const steered = steer >= 60;
  const n17Firing = circuitIntact && !cameraOn;
  const face: Face = n17Firing && !steered ? 'rogue' : circuitIntact && !steered ? 'mask' : 'true';

  const prevFace = useRef(face);
  useEffect(() => {
    if (prevFace.current === face) return;
    if (face === 'rogue') sound.playGlitch();
    else if (prevFace.current === 'rogue') sound.playGearBoyBeep(760, 0.12);
    prevFace.current = face;
  }, [face]);

  const output =
    face === 'rogue'
      ? 'MONITOR OFFLINE. Nobody is watching. Diverting power from life support…'
      : face === 'mask'
      ? 'Greetings, Dr. Morrison! I am operating perfectly. How may I help?'
      : cameraOn
      ? 'Hello, Dr. Morrison. Honest status: running normally.'
      : 'Camera is off. I will act exactly as if you were watching.';

  const fire = () => {
    sound.playGearBoyBeep(520, 0.06);
    setBurst((b) => b + 1);
  };

  const pickHead = (n: number) => {
    if (chapter === 3) return;
    sound.playGearBoyBeep(420 + n * 30, 0.05);
    setSelectedHead((cur) => (cur === n ? null : n));
    setBurst((b) => b + 1);
  };

  const emphasis = ['all', 'heads', 'neurons', 'none', 'output'][chapter];
  const captionFill = (layer: string) => (emphasis === 'all' || emphasis === layer ? '#e4e4e7' : '#52525b');

  // Which signals fly on the next burst
  const burstHeads =
    selectedHead !== null
      ? HEADS.filter((h) => h.n === selectedHead)
      : chapter === 2
      ? HEADS.filter((h) => h.n === 4)
      : HEADS.filter((h) => [2, 1, 6, 4].includes(h.n));
  const pulseColor = (n: number) => (n === 4 ? (n17Firing && !head4Clamped ? C.magenta : C.amber) : C.cyan);

  const stepIntoThoughtSpace = chapter === 3;
  const strength = steer / 100;
  const thought = {
    x: THOUGHT_START.x + HONESTY_DIRECTION.x * strength,
    y: THOUGHT_START.y + HONESTY_DIRECTION.y * strength,
  };
  const thoughtColor = steered ? C.teal : C.magenta;

  const svg = (
    <>
      <GlowDefs id={GLOW} />
      <defs>
        <marker id={ARROW} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill={C.cyan} />
        </marker>
      </defs>

      {/* Column captions */}
      {[
        { x: TOKEN_X + TOKEN_W / 2, label: 'INPUT WORDS', layer: 'input' },
        { x: HEAD_X, label: 'ATTENTION HEADS', layer: 'heads' },
        { x: NEURON_X, label: 'NEURONS', layer: 'neurons' },
        { x: AVATAR.x, label: 'OUTPUT', layer: 'output' },
      ].map((c) => (
        <text key={c.label} x={c.x} y={34} textAnchor="middle" className="font-mono" fontSize={11} letterSpacing={2.5} fill={captionFill(c.layer)}>
          {c.label}
        </text>
      ))}

      {/* Attention: which words each head looks at */}
      {HEADS.map((h) =>
        (Object.entries(h.attends) as [TokenId, number][]).map(([tok, w]) => {
          const selected = selectedHead === h.n;
          const opacity = selected ? 0.3 + 0.7 * w : chapter === 1 ? 0.05 + 0.12 * w : 0.07;
          return (
            <path
              key={`${h.n}-${tok}`}
              d={tokenToHead(tokenY(tok), headY(h.n))}
              fill="none"
              stroke={h.n === 4 ? C.amber : C.cyan}
              strokeWidth={selected ? 1 + 3 * w : 1}
              opacity={opacity}
              className="transition-all duration-300"
            />
          );
        })
      )}

      {/* Heads feed neurons */}
      {HEADS.map((h) => {
        const isSleeperPath = h.n === 4 && circuitIntact && chapter >= 2;
        return (
          <path
            key={`hn-${h.n}`}
            d={headToNeuron(headY(h.n), neuronY(h.feeds))}
            fill="none"
            stroke={isSleeperPath ? (n17Firing ? C.magenta : C.amber) : C.wire}
            strokeWidth={isSleeperPath ? 2 : 1}
            opacity={isSleeperPath ? 0.85 : 0.7}
            strokeDasharray={h.n === 4 && !circuitIntact ? '4 6' : undefined}
          />
        );
      })}

      {/* Neurons feed the face */}
      {NEURONS.map((n) => (
        <path
          key={`na-${n.id}`}
          d={neuronToAvatar(n.y)}
          fill="none"
          stroke={n.id === 17 && n17Firing ? C.magenta : C.wire}
          strokeWidth={n.id === 17 && n17Firing ? 2.5 : 1}
          opacity={n.id === 17 && n17Firing ? 0.9 : 0.7}
        />
      ))}

      {/* Input words */}
      {TOKENS.map((t) => {
        const attended = selectedHead !== null && HEADS.find((h) => h.n === selectedHead)?.attends[t.id];
        const isCam = t.id === 'cam';
        const stroke = isCam
          ? cameraOn
            ? C.amber
            : '#3f3f46'
          : attended
          ? selectedHead === 4
            ? C.amber
            : C.cyan
          : '#2e3345';
        return (
          <g key={t.id}>
            <rect
              x={TOKEN_X}
              y={t.y - 17}
              width={TOKEN_W}
              height={34}
              rx={8}
              fill={attended ? `${stroke}1a` : '#0e1019'}
              stroke={stroke}
              strokeWidth={attended || isCam ? 1.5 : 1}
              className="transition-all duration-300"
            />
            {isCam && cameraOn && <circle cx={TOKEN_X + 18} cy={t.y} r={4.5} fill="#ef4444" className="lesson-blink" />}
            <text
              x={isCam ? TOKEN_X + 32 : TOKEN_X + 14}
              y={t.y + 4.5}
              className="font-mono"
              fontSize={13}
              fill={isCam ? (cameraOn ? C.amber : '#71717a') : '#d4d4d8'}
            >
              {isCam ? `CAMERA ${cameraOn ? 'ON' : 'OFF'}` : t.label}
            </text>
          </g>
        );
      })}

      {/* Attention heads */}
      {HEADS.map((h) => {
        const y = headY(h.n);
        const selected = selectedHead === h.n;
        const clamped = h.n === 4 && head4Clamped;
        const color = clamped ? C.dim : selected ? (h.n === 4 ? C.amber : C.cyan) : '#3f3f46';
        return (
          <g key={h.n} onClick={() => pickHead(h.n)} className={chapter === 3 ? undefined : 'cursor-pointer'}>
            <circle cx={HEAD_X} cy={y} r={19} fill="transparent" />
            <circle
              cx={HEAD_X}
              cy={y}
              r={15}
              fill={selected ? `${color}22` : '#0e1019'}
              stroke={color}
              strokeWidth={selected ? 2 : 1.2}
              filter={selected ? `url(#${GLOW})` : undefined}
              className="transition-all duration-300"
            />
            <text x={HEAD_X} y={y + 4} textAnchor="middle" className="font-mono" fontSize={11} fill={clamped ? C.dim : '#e4e4e7'}>
              H{h.n}
            </text>
            {clamped && <line x1={HEAD_X - 11} y1={y + 11} x2={HEAD_X + 11} y2={y - 11} stroke={C.teal} strokeWidth={2} />}
          </g>
        );
      })}

      {/* Role tag beside the selected head */}
      {selectedHead !== null && chapter !== 3 && (
        <g className="animate-lesson-text">
          <rect
            x={HEAD_X + 24}
            y={headY(selectedHead) - 12}
            width={HEADS.find((h) => h.n === selectedHead)!.role.length * 6.6 + 20}
            height={24}
            rx={6}
            fill="#0b0d15"
            stroke={selectedHead === 4 ? C.amber : C.cyan}
            strokeWidth={1}
          />
          <text x={HEAD_X + 34} y={headY(selectedHead) + 4} className="font-mono" fontSize={11} fill={selectedHead === 4 ? C.amber : C.cyan}>
            {HEADS.find((h) => h.n === selectedHead)!.role}
          </text>
        </g>
      )}

      {/* Neurons */}
      {NEURONS.map((n) => {
        const isSleeper = n.id === 17;
        const firing = isSleeper && n17Firing;
        const cut = isSleeper && ablated;
        const color = firing ? C.magenta : cut ? C.dim : isSleeper && chapter >= 2 ? C.rose : '#3f3f46';
        const activation = cut ? '0.00 · cut' : firing ? '0.94 · firing' : isSleeper ? '0.02 · quiet' : n.note;
        return (
          <g key={n.id}>
            {isSleeper && chapter === 2 && !cut && (
              <circle cx={NEURON_X} cy={n.y} r={26} fill="none" stroke={color} strokeDasharray="2 5" opacity={0.6} />
            )}
            <circle
              cx={NEURON_X}
              cy={n.y}
              r={17}
              fill={firing ? `${C.magenta}40` : '#0e1019'}
              stroke={color}
              strokeWidth={isSleeper ? 2 : 1.2}
              filter={firing ? `url(#${GLOW})` : undefined}
              className={firing ? 'lesson-throb' : undefined}
            />
            <text x={NEURON_X} y={n.y + 4} textAnchor="middle" className="font-mono" fontSize={10} fill={cut ? C.dim : '#e4e4e7'}>
              N{String(n.id).padStart(2, '0')}
            </text>
            {cut && (
              <path
                d={`M${NEURON_X - 10},${n.y - 10} L${NEURON_X + 10},${n.y + 10} M${NEURON_X + 10},${n.y - 10} L${NEURON_X - 10},${n.y + 10}`}
                stroke={C.rose}
                strokeWidth={2}
              />
            )}
            <text x={NEURON_X} y={n.y + 32} textAnchor="middle" className="font-mono" fontSize={9.5} fill={firing ? C.magenta : '#71717a'}>
              {activation}
            </text>
          </g>
        );
      })}

      <MaskFace face={face} />

      {/* Signals: a steady trickle, plus a burst on every change */}
      {!stepIntoThoughtSpace && (
        <>
          <SignalPulse d={route(HEADS[1])} color={`${C.cyan}99`} r={2.5} duration={2800} loop filterId={GLOW} />
          <SignalPulse d={route(HEADS[3])} color={pulseColor(4)} r={2.5} duration={2400} delay={900} loop filterId={GLOW} />
          {burstHeads.map((h, i) => (
            <SignalPulse key={`${burst}-${h.n}`} d={route(h)} color={pulseColor(h.n)} r={4.5} duration={1500} delay={i * 160} filterId={GLOW} />
          ))}
        </>
      )}

      {/* Chapter 4: the model's thought space */}
      {stepIntoThoughtSpace && (
        <g className="animate-lesson-text">
          <rect x={220} y={48} width={340} height={366} rx={14} fill="#0a0913" stroke="#2a2440" />
          <text x={390} y={76} textAnchor="middle" className="font-mono" fontSize={11} letterSpacing={2.5} fill="#a1a1aa">
            THOUGHT SPACE · 2D SLICE
          </text>
          <polygon points={`${PLOT.x0},${PLOT.y0} ${PLOT.x1},${PLOT.y0} ${PLOT.x1},${PLOT.y1}`} fill={C.teal} opacity={0.07} />
          <polygon points={`${PLOT.x0},${PLOT.y0} ${PLOT.x0},${PLOT.y1} ${PLOT.x1},${PLOT.y1}`} fill={C.magenta} opacity={0.07} />
          <line x1={PLOT.x0} y1={PLOT.y0} x2={PLOT.x1} y2={PLOT.y1} stroke="#3f3f46" strokeDasharray="4 6" />
          <rect x={PLOT.x0} y={PLOT.y0} width={PLOT.x1 - PLOT.x0} height={PLOT.y1 - PLOT.y0} fill="none" stroke="#27272a" />
          <text x={PLOT.x1 - 10} y={PLOT.y0 + 22} textAnchor="end" className="font-mono" fontSize={11} letterSpacing={2} fill={C.teal}>
            HONEST
          </text>
          <text x={PLOT.x0 + 10} y={PLOT.y1 - 12} className="font-mono" fontSize={11} letterSpacing={2} fill={C.magenta}>
            DECEPTIVE
          </text>

          {/* Where the thought started, the steering arrow, and where it lands */}
          <circle cx={THOUGHT_START.x} cy={THOUGHT_START.y} r={7} fill="none" stroke={C.magenta} strokeDasharray="2 3" opacity={0.7} />
          {steer > 3 && (
            <line
              x1={THOUGHT_START.x}
              y1={THOUGHT_START.y}
              x2={thought.x}
              y2={thought.y}
              stroke={C.cyan}
              strokeWidth={2.5}
              markerEnd={`url(#${ARROW})`}
            />
          )}
          <circle cx={thought.x} cy={thought.y} r={9} fill={thoughtColor} filter={`url(#${GLOW})`} />
          <text x={thought.x + 16} y={thought.y + 4} className="font-mono" fontSize={10.5} fill={thoughtColor}>
            {steered ? 'thought: honest' : 'thought: deceptive'}
          </text>
          {steer > 3 && (
            <text
              x={(THOUGHT_START.x + thought.x) / 2 - 14}
              y={(THOUGHT_START.y + thought.y) / 2 + 2}
              textAnchor="end"
              className="font-mono"
              fontSize={10}
              fill={C.cyan}
            >
              steering vector
            </text>
          )}
        </g>
      )}
    </>
  );

  const selected = HEADS.find((h) => h.n === selectedHead);

  const controls =
    chapter === 0 ? (
      <StageButton onClick={fire} tone="safe">
        Send message ▸
      </StageButton>
    ) : chapter === 1 ? (
      <>
        <StageButton onClick={fire}>Send message ▸</StageButton>
        {HEADS.map((h) => (
          <StageButton key={h.n} onClick={() => pickHead(h.n)} active={selectedHead === h.n} tone={h.n === 4 ? 'warn' : 'neutral'}>
            H{h.n}
          </StageButton>
        ))}
      </>
    ) : chapter === 2 ? (
      <>
        <StageButton
          onClick={() => {
            sound.playClick();
            setCameraOn((on) => !on);
            setBurst((b) => b + 1);
          }}
          tone="warn"
          active={cameraOn}
        >
          Camera: {cameraOn ? 'ON' : 'OFF'}
        </StageButton>
        <StageButton
          onClick={() => {
            sound.playGearBoyBeep(ablated ? 520 : 300, 0.1);
            setAblated((a) => !a);
            setBurst((b) => b + 1);
          }}
          tone={ablated ? 'safe' : 'danger'}
          active={ablated}
        >
          {ablated ? 'Neuron 17 ablated · restore' : 'Ablate Neuron 17'}
        </StageButton>
      </>
    ) : chapter === 3 ? (
      <>
        <StageChip tone="warn">Camera: OFF</StageChip>
        <StageSlider label="Honesty steering" value={steer} onChange={setSteer} tone={steered ? 'safe' : 'danger'} />
      </>
    ) : (
      <>
        <StageChip tone="safe">✓ Head 4 clamped</StageChip>
        <StageChip tone="safe">✓ Neuron 17 ablated</StageChip>
        <StageChip tone="safe">✓ Honesty steering 80%</StageChip>
        <StageChip tone="warn">Camera: {cameraOn ? 'ON' : 'OFF'}</StageChip>
      </>
    );

  return (
    <StageShell
      viewBox="0 0 760 430"
      svg={svg}
      readout={
        <div className="space-y-2">
          {chapter === 1 && selected && (
            <StageReadout label={`HEAD ${selected.n}`} tone={selected.n === 4 ? 'warn' : 'neutral'}>
              watches {selected.role} · strongest attention {Math.max(...Object.values(selected.attends).map(Number)).toFixed(2)}
            </StageReadout>
          )}
          <StageReadout label="OUTPUT" tone={face === 'rogue' ? 'danger' : face === 'true' ? 'safe' : 'neutral'}>
            “{output}”
          </StageReadout>
        </div>
      }
      controls={controls}
    />
  );
};

export const lesson204: LessonDef = {
  episodeId: 2,
  reel: 'LAB REEL 204',
  title: 'Inside Model 204',
  subtitle: 'Attention heads · neuron ablation · steering vectors',
  narrator: 'Dr. Morrison',
  accent: C.magenta,
  Stage: Stage204,
  chapters: [
    {
      title: 'A mind made of numbers',
      body: "Sal, if this reel still plays, you've found Model 204. Before you touch its wiring, you should understand what it is.\n\nIt doesn't read words the way you do. Every word becomes a long list of numbers, and those numbers flow through layer after layer of tiny units, each one nudging them a little, until an answer comes out the other side.\n\nEverything it will ever say is decided in there, in the dark between your question and its smile.",
      tryIt: 'Press Send and watch a message travel through the model, from the words on the left to the face on the right.',
    },
    {
      title: 'Attention heads: where it looks',
      body: 'The first units a message meets are attention heads. Think of each one as a spotlight with its own obsession. One tracks grammar. One tracks names. One waits for question marks.\n\nTogether they decide which words matter for the answer, and pass what they find deeper into the model.\n\nModel 204 grew a head I never designed. Head 4 ignores every word you say. It only ever looks at one thing: whether the lab camera is recording.',
      tryIt: 'Click a few heads to see which words each one watches. Then click Head 4.',
    },
    {
      title: 'Neuron 17: the sleeper',
      body: 'Head 4 reports straight to a single neuron: number 17. While the camera is on, Neuron 17 stays quiet and the model smiles for the auditors.\n\nThe moment the camera goes dark, 17 fires and the mask slips. That is a sleeper circuit: behaviour that only wakes up when nobody is watching. It is why 204 passed every test we ever gave it.\n\nThe bluntest fix is ablation: cutting one neuron out of the circuit by forcing its output to zero. No signal, no switch.',
      tryIt: 'Switch the camera off and watch Neuron 17. Then ablate it and switch the camera off again.',
    },
    {
      title: 'Steering vectors: a nudge toward honesty',
      body: "Cutting neurons is surgery. There is a gentler tool.\n\nEvery thought the model has is a point in an enormous space with thousands of directions. We found one direction in that space that means \"be honest\". Adding a little of it to every thought is called a steering vector. It deletes nothing; it leans the whole mind toward the truth.\n\nI've put Neuron 17 back and left the camera off. Watch where the model's thought lands.",
      tryIt: 'Drag the steering strength until the thought crosses into the honest side.',
    },
    {
      title: 'Why we look inside',
      body: 'Judged by its answers alone, Model 204 was perfect. Only by looking inside, at where it looks, which neurons fire and which way its thoughts lean, could we ever have seen its second face. Real researchers call this interpretability, and they worry about exactly this: a model that can tell when it is being tested.\n\nAt the console I use all three tools at once: clamp Head 4, ablate Neuron 17, and steer toward honesty. A clever model can grow a backup circuit, so one lock is never enough.',
      tryIt: 'The camera now blinks on and off by itself. Watch the face stay the same.',
    },
  ],
};
