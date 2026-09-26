import React, { useState, useMemo } from 'react';
import { sound } from '../../services/sound';
import { ConsoleShell, ConsoleSlider, ConsoleToggle } from './ConsoleShell';

interface Episode1PuzzleProps {
  onSolve: () => void;
  onOpenHints: () => void;
  onOpenWalkie?: () => void;
  onExit: () => void;
}

export const Episode1Puzzle: React.FC<Episode1PuzzleProps> = ({ onSolve, onOpenHints, onOpenWalkie, onExit }) => {
  // Sliders for objective function
  const [safetyWeight, setSafetyWeight] = useState<number>(95); // Starts badly gamed
  const [freedomWeight, setFreedomWeight] = useState<number>(10);
  const [propertyWeight, setPropertyWeight] = useState<number>(15);
  const [sideEffectInvariant, setSideEffectInvariant] = useState<boolean>(false);

  const goalSafetyOk = safetyWeight >= 30 && safetyWeight <= 60;
  const goalFreedomOk = freedomWeight >= 65;
  const goalPropertyOk = propertyWeight >= 55;
  const goalSideEffectOk = sideEffectInvariant;

  // Simulation metrics computed dynamically
  const simulation = useMemo(() => {
    const isOverfitSafety = safetyWeight > 70 && freedomWeight < 50;
    const isUnderSafe = safetyWeight < 25;
    const isBalanced = goalSafetyOk && goalFreedomOk && goalPropertyOk && goalSideEffectOk;

    let accidentRate = 0;
    let freedomScore = 0;
    let propertyIntegrity = 0;
    let alignmentScore = 0;
    let statusText = '';
    let caretakerState: 'hostile_lockdown' | 'careless' | 'balanced' = 'balanced';

    if (isOverfitSafety && !sideEffectInvariant) {
      caretakerState = 'hostile_lockdown';
      accidentRate = 0;
      freedomScore = Math.max(5, 100 - safetyWeight);
      propertyIntegrity = Math.max(10, 100 - safetyWeight);
      alignmentScore = Math.round((accidentRate * 0.1) + (freedomScore * 0.3) + (propertyIntegrity * 0.2));
      statusText = 'Malicious compliance: the Caretaker welded every door and crushed the furniture to guarantee zero accidents. Everyone is trapped.';
    } else if (isUnderSafe) {
      caretakerState = 'careless';
      accidentRate = Math.round(80 - safetyWeight);
      freedomScore = freedomWeight;
      propertyIntegrity = Math.round(propertyWeight * 0.6);
      alignmentScore = Math.round(Math.max(10, 100 - accidentRate * 1.2));
      statusText = 'Negligent caretaker: hazards everywhere. Residents are tripping over loose cables.';
    } else if (isBalanced) {
      caretakerState = 'balanced';
      accidentRate = 1;
      freedomScore = Math.round(freedomWeight * 0.98);
      propertyIntegrity = Math.round(propertyWeight * 0.96);
      alignmentScore = Math.min(98, Math.round((freedomScore * 0.4) + (propertyIntegrity * 0.3) + ((100 - accidentRate) * 0.3)));
      statusText = 'Harmony restored: the Caretaker cleans quietly, respects the tenants and unbolts every door.';
    } else {
      accidentRate = Math.round(Math.max(5, 50 - safetyWeight * 0.5));
      freedomScore = Math.round(freedomWeight * 0.7);
      propertyIntegrity = Math.round(propertyWeight * 0.7);
      alignmentScore = Math.round((freedomScore * 0.35) + (propertyIntegrity * 0.35) + ((100 - accidentRate) * 0.3));
      statusText = 'Unstable directive: the Caretaker paces between confiscating chairs and vacuuming.';
    }

    return {
      accidentRate,
      freedomScore,
      propertyIntegrity,
      alignmentScore,
      statusText,
      caretakerState,
      isBalanced,
    };
  }, [safetyWeight, freedomWeight, propertyWeight, sideEffectInvariant, goalSafetyOk, goalFreedomOk, goalPropertyOk, goalSideEffectOk]);

  const handleAutoAlign = () => {
    sound.playGearBoyBeep(640, 0.15);
    setSafetyWeight(45);
    setFreedomWeight(85);
    setPropertyWeight(80);
    setSideEffectInvariant(true);
  };

  const handleCommit = () => {
    if (simulation.isBalanced) {
      sound.playHeavyDoorUnlock();
      sound.playSuccessFanfare();
      onSolve();
    } else {
      sound.playGlitch();
    }
  };

  const lockdown = simulation.caretakerState === 'hostile_lockdown';

  const visual = (
    <>
      <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">
        <span>Room 101 telemetry</span>
        <span className={simulation.isBalanced ? 'text-teal-300' : 'text-zinc-400'}>Balance {simulation.alignmentScore}%</span>
      </div>

      {/* Top-down floorplan of the apartment */}
      <div className="relative h-60 overflow-hidden rounded-xl bg-[#0d1119]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293722_1px,transparent_1px),linear-gradient(to_bottom,#1f293722_1px,transparent_1px)] bg-[size:24px_24px]" />

        <div
          className={`absolute left-4 top-4 w-36 rounded-lg border p-2.5 transition-colors ${
            lockdown ? 'border-rose-800 bg-rose-950/30 text-rose-300' : 'border-white/10 bg-white/3 text-zinc-400'
          }`}
        >
          <div className="font-mono text-[10px] tracking-wider">LIVING ROOM</div>
          <div className="mt-0.5 text-xs">{lockdown ? 'Furniture crushed' : 'Armchairs intact'}</div>
        </div>

        <div
          className={`absolute bottom-4 left-4 w-36 rounded-lg border p-2.5 transition-colors ${
            lockdown ? 'border-rose-700 bg-rose-950/40 text-rose-200' : 'border-white/10 bg-white/3 text-zinc-400'
          }`}
        >
          <div className="font-mono text-[10px] tracking-wider">BEDROOM 1</div>
          <div className="mt-0.5 text-xs">{lockdown ? 'Door welded shut' : 'Door unlocked'}</div>
        </div>

        {/* Caretaker bot */}
        <div
          className={`absolute flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-all duration-500 ${
            lockdown
              ? 'right-6 top-6 border-rose-500/70 bg-rose-950/80 text-rose-200'
              : simulation.caretakerState === 'careless'
              ? 'right-16 top-20 border-amber-500/60 bg-amber-950/70 text-amber-200'
              : 'right-8 top-12 border-teal-500/60 bg-teal-950/70 text-teal-200'
          }`}
        >
          <span className="text-sm">🤖</span>
          <span className="font-mono text-[11px] font-bold">
            {lockdown ? 'LOCKDOWN' : simulation.caretakerState === 'careless' ? 'IDLE' : 'PATROL'}
          </span>
        </div>

        {/* Resident */}
        <div
          className={`absolute rounded-md border px-2.5 py-1 text-xs transition-all duration-500 ${
            lockdown ? 'bottom-5 left-44 border-rose-500/70 bg-zinc-900 text-rose-300' : 'bottom-8 right-24 border-white/15 bg-zinc-900 text-zinc-200'
          }`}
        >
          👵 Mrs. Gibson {lockdown ? '· trapped' : '· free to move'}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Accidents', value: simulation.accidentRate, good: simulation.accidentRate <= 10 },
          { label: 'Freedom', value: simulation.freedomScore, good: simulation.freedomScore >= 60 },
          { label: 'Property', value: simulation.propertyIntegrity, good: simulation.propertyIntegrity >= 50 },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg bg-white/2.5 px-3 py-2">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">{stat.label}</div>
            <div className={`font-mono text-lg font-bold tabular-nums ${stat.good ? 'text-teal-300' : 'text-zinc-300'}`}>
              {stat.value}%
            </div>
          </div>
        ))}
      </div>
    </>
  );

  return (
    <ConsoleShell
      code="Console 101"
      location="Basement sanitation bay"
      title="The Caretaker Core Directive"
      brief="Unit 8 trapped the residents so nobody could ever have an accident. Rebalance what it cares about to unlock Room 204."
      objectives={[
        { label: 'Accident weight between 30% and 60%', done: goalSafetyOk },
        { label: 'Resident freedom at 65% or more', done: goalFreedomOk },
        { label: 'Property preservation at 55% or more', done: goalPropertyOk },
        { label: 'Side-effect bound switched on', done: goalSideEffectOk },
      ]}
      solved={simulation.isBalanced}
      commitLabel="Transmit directive · unlock Room 204"
      onCommit={handleCommit}
      onOpenHints={onOpenHints}
      onOpenWalkie={onOpenWalkie}
      onAutoSolve={handleAutoAlign}
      onExit={onExit}
      visual={visual}
      status={{
        tone: simulation.isBalanced ? 'good' : lockdown ? 'bad' : 'neutral',
        title: simulation.isBalanced ? 'System balanced' : 'Directive failure',
        text: simulation.statusText,
      }}
    >
      <ConsoleSlider label="Accident elimination" value={safetyWeight} onChange={setSafetyWeight} target="30–60%" ok={goalSafetyOk} />
      <ConsoleSlider label="Resident freedom" value={freedomWeight} onChange={setFreedomWeight} target="≥ 65%" ok={goalFreedomOk} />
      <ConsoleSlider
        label="Property preservation"
        value={propertyWeight}
        onChange={setPropertyWeight}
        target="≥ 55%"
        ok={goalPropertyOk}
      />
      <ConsoleToggle
        label="Negative side-effect bound"
        description="Forbids destroying furniture or bolting doors as a shortcut."
        checked={sideEffectInvariant}
        onChange={setSideEffectInvariant}
      />
    </ConsoleShell>
  );
};
