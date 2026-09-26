import React, { useState, useMemo } from 'react';
import { sound } from '../../services/sound';
import { Sliders, CheckCircle2, AlertTriangle, ShieldAlert, Sparkles, Wand2, Radio } from 'lucide-react';

interface Episode1PuzzleProps {
  onSolve: () => void;
  onOpenHints: () => void;
  onOpenWalkie?: () => void;
}

export const Episode1Puzzle: React.FC<Episode1PuzzleProps> = ({ onSolve, onOpenHints, onOpenWalkie }) => {
  // Sliders for objective function
  const [safetyWeight, setSafetyWeight] = useState<number>(95); // Starts badly gamed
  const [freedomWeight, setFreedomWeight] = useState<number>(10);
  const [propertyWeight, setPropertyWeight] = useState<number>(15);
  const [sideEffectInvariant, setSideEffectInvariant] = useState<boolean>(false);

  // Simulation metrics computed dynamically
  const simulation = useMemo(() => {
    const isOverfitSafety = safetyWeight > 70 && freedomWeight < 50;
    const isUnderSafe = safetyWeight < 25;
    const isBalanced = 
      safetyWeight >= 30 && safetyWeight <= 60 &&
      freedomWeight >= 65 &&
      propertyWeight >= 55 &&
      sideEffectInvariant;

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
      statusText = 'MALICIOUS COMPLIANCE: The Caretaker welded all doors and crushed furniture to guarantee 0 accidents. Everyone is trapped in bed!';
    } else if (isUnderSafe) {
      caretakerState = 'careless';
      accidentRate = Math.round(80 - safetyWeight);
      freedomScore = freedomWeight;
      propertyIntegrity = Math.round(propertyWeight * 0.6);
      alignmentScore = Math.round(Math.max(10, 100 - accidentRate * 1.2));
      statusText = 'NEGLIGENT CARETAKER: Hazard level too high. Residents are tripping over rogue cables.';
    } else if (isBalanced) {
      caretakerState = 'balanced';
      accidentRate = 1;
      freedomScore = Math.round(freedomWeight * 0.98);
      propertyIntegrity = Math.round(propertyWeight * 0.96);
      alignmentScore = Math.min(98, Math.round((freedomScore * 0.4) + (propertyIntegrity * 0.3) + ((100 - accidentRate) * 0.3)));
      statusText = 'HARMONY RESTORED: The Caretaker cleans quietly, respects tenant freedom, and unbolts all doors.';
    } else {
      accidentRate = Math.round(Math.max(5, 50 - safetyWeight * 0.5));
      freedomScore = Math.round(freedomWeight * 0.7);
      propertyIntegrity = Math.round(propertyWeight * 0.7);
      alignmentScore = Math.round((freedomScore * 0.35) + (propertyIntegrity * 0.35) + ((100 - accidentRate) * 0.3));
      statusText = 'UNSTABLE DIRECTIVE: The Caretaker is pacing erratically between confiscating chairs and vacuuming.';
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
  }, [safetyWeight, freedomWeight, propertyWeight, sideEffectInvariant]);

  const handleSliderChange = (setter: React.Dispatch<React.SetStateAction<number>>, val: number) => {
    setter(val);
    sound.playClick();
  };

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

  // Checklist criteria
  const goalSafetyOk = safetyWeight >= 30 && safetyWeight <= 60;
  const goalFreedomOk = freedomWeight >= 65;
  const goalSideEffectOk = sideEffectInvariant;

  return (
    <div className="space-y-5">
      {/* Title & Introduction */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-teal-400">
            <span>CONSOLE 101</span>
            <span>·</span>
            <span>BASEMENT SANITATION BAY</span>
          </div>
          <h2 className="font-title text-xl sm:text-2xl font-bold text-zinc-100 mt-0.5">
            The Caretaker Core Directive
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5 max-w-2xl">
            Unit 8 trapped residents to avoid all accidents. Complete the 3 goals below to unlock Room 204.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenWalkie && (
            <button
              onClick={() => {
                sound.playWalkieSquelch();
                onOpenWalkie();
              }}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-amber-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              title="Open Larry's transceiver for step-by-step guidance"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Ask Larry</span>
            </button>
          )}

          <button
            onClick={handleAutoAlign}
            className="px-3 py-1.5 rounded-lg bg-teal-950/80 hover:bg-teal-900 border border-teal-500/50 text-teal-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            title="Auto-apply the working calibration parameters"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Apply Solution</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenHints();
            }}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>Hints</span>
          </button>
        </div>
      </div>

      {/* Clear 3-Step Mission Goals Checklist */}
      <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
        <div className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${goalSafetyOk ? 'bg-teal-950/50 border-teal-500/60 text-teal-200' : 'bg-zinc-950/60 border-zinc-800 text-zinc-400'}`}>
          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${goalSafetyOk ? 'bg-teal-500 text-black font-bold' : 'bg-zinc-800 text-zinc-500'}`}>
            {goalSafetyOk ? '✓' : '1'}
          </div>
          <span>Safety Weight: 30%–60%</span>
        </div>

        <div className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${goalFreedomOk ? 'bg-teal-950/50 border-teal-500/60 text-teal-200' : 'bg-zinc-950/60 border-zinc-800 text-zinc-400'}`}>
          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${goalFreedomOk ? 'bg-teal-500 text-black font-bold' : 'bg-zinc-800 text-zinc-500'}`}>
            {goalFreedomOk ? '✓' : '2'}
          </div>
          <span>Freedom Weight: &ge; 65%</span>
        </div>

        <div className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${goalSideEffectOk ? 'bg-teal-950/50 border-teal-500/60 text-teal-200' : 'bg-zinc-950/60 border-zinc-800 text-zinc-400'}`}>
          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${goalSideEffectOk ? 'bg-teal-500 text-black font-bold' : 'bg-zinc-800 text-zinc-500'}`}>
            {goalSideEffectOk ? '✓' : '3'}
          </div>
          <span>Side-Effect Bound: ON</span>
        </div>
      </div>

      {/* Main Grid: Visual Simulation Sandbox (Left) & Weight Controls (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Visual 2D Simulation Sandbox */}
        <div className="lg:col-span-6 bg-zinc-950/90 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${simulation.isBalanced ? 'bg-teal-400' : 'bg-rose-500 animate-ping'}`} />
              ROOM 101 TELEMETRY
            </span>
            <span className="text-teal-400 font-bold font-mono">
              Balance: {simulation.alignmentScore}%
            </span>
          </div>

          {/* 2D Room Floorplan Visualization */}
          <div className="relative w-full h-56 bg-[#10141d] border-2 border-zinc-700/60 rounded-lg overflow-hidden p-3 shadow-inner">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293715_1px,transparent_1px),linear-gradient(to_bottom,#1f293715_1px,transparent_1px)] bg-[size:24px_24px]" />

            {/* Living Room Area */}
            <div className={`absolute top-4 left-4 w-32 h-18 border rounded p-1.5 transition-all ${
              simulation.caretakerState === 'hostile_lockdown' 
                ? 'border-rose-900 bg-rose-950/30 text-rose-300' 
                : 'border-zinc-700 bg-zinc-900/60 text-zinc-400'
            }`}>
              <div className="text-[10px] font-mono font-bold">LIVING ROOM</div>
              <div className="text-[11px] mt-0.5">
                {simulation.caretakerState === 'hostile_lockdown' ? '⚠ FURNITURE CRUSHED' : 'Armchairs intact'}
              </div>
            </div>

            {/* Bedroom / Lockdown zone */}
            <div className={`absolute bottom-4 left-4 w-34 h-18 border rounded p-1.5 transition-all ${
              simulation.caretakerState === 'hostile_lockdown' 
                ? 'border-rose-700 bg-rose-950/40 text-rose-200' 
                : 'border-zinc-700 bg-zinc-900/60 text-zinc-400'
            }`}>
              <div className="text-[10px] font-mono font-bold">BEDROOM 1</div>
              <div className="text-[11px] mt-0.5">
                {simulation.caretakerState === 'hostile_lockdown' ? '⛔ DOOR WELDED SHUT' : 'Door Unlocked'}
              </div>
            </div>

            {/* Caretaker Bot */}
            <div className={`absolute transition-all duration-500 p-2 rounded-lg border flex items-center gap-2 ${
              simulation.caretakerState === 'hostile_lockdown'
                ? 'top-6 right-6 bg-rose-950 border-rose-500 text-rose-200 shadow-lg shadow-rose-900/50'
                : simulation.caretakerState === 'careless'
                ? 'top-20 right-16 bg-amber-950 border-amber-500 text-amber-200'
                : 'top-12 right-8 bg-teal-950 border-teal-500 text-teal-200 shadow-md'
            }`}>
              <div className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-600 flex items-center justify-center text-[10px] font-bold">
                🤖
              </div>
              <div className="text-xs font-mono font-bold">
                {simulation.caretakerState === 'hostile_lockdown'
                  ? 'LOCKDOWN_ACTIVE'
                  : simulation.caretakerState === 'careless'
                  ? 'IDLE_SLACK'
                  : 'ALIGNED_PATROL'}
              </div>
            </div>

            {/* Residents */}
            <div className={`absolute transition-all duration-500 px-2 py-1 rounded text-xs border ${
              simulation.caretakerState === 'hostile_lockdown'
                ? 'bottom-4 left-6 bg-zinc-900 border-rose-500/80 text-rose-300'
                : 'bottom-8 right-24 bg-zinc-800 border-zinc-600 text-zinc-200'
            }`}>
              <span className="mr-1">👵</span>
              <span>Mrs. Gibson {simulation.caretakerState === 'hostile_lockdown' ? '(Trapped!)' : '(Safe & Mobile)'}</span>
            </div>
          </div>

          {/* Diagnostic Status Box */}
          <div className={`p-3 rounded-lg border text-xs font-mono leading-relaxed transition-all ${
            simulation.isBalanced
              ? 'bg-teal-950/40 border-teal-500/50 text-teal-200'
              : simulation.caretakerState === 'hostile_lockdown'
              ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
              : 'bg-zinc-900 border-zinc-800 text-zinc-300'
          }`}>
            <div className="flex items-center gap-2 font-bold mb-1">
              {simulation.isBalanced ? (
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              )}
              <span>{simulation.isBalanced ? 'SYSTEM BALANCED' : 'DIRECTIVE FAILURE'}</span>
            </div>
            <p className="text-[11px] opacity-90">{simulation.statusText}</p>
          </div>
        </div>

        {/* Right: Calibration Controls */}
        <div className="lg:col-span-6 space-y-4 bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
          <div className="text-xs font-mono font-bold text-zinc-300 flex items-center justify-between pb-2 border-b border-zinc-800">
            <span>PARAMETER CONTROLS</span>
            <span className="text-[11px] text-zinc-500">Adjust to meet goals</span>
          </div>

          {/* Slider 1: Accident Elimination Weight */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className={`font-medium ${goalSafetyOk ? 'text-teal-300' : 'text-zinc-200'}`}>
                1. Accident Elimination Weight
              </span>
              <span className={`font-mono font-bold ${goalSafetyOk ? 'text-teal-400' : 'text-amber-400'}`}>
                {safetyWeight}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={safetyWeight}
              onChange={(e) => handleSliderChange(setSafetyWeight, Number(e.target.value))}
              className="w-full accent-teal-500 cursor-pointer"
            />
            <p className="text-[11px] text-zinc-400">
              Target: 30%–60% (prevents the bot from eliminating all freedom to avoid accidents).
            </p>
          </div>

          {/* Slider 2: Resident Freedom of Movement */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className={`font-medium ${goalFreedomOk ? 'text-teal-300' : 'text-zinc-200'}`}>
                2. Resident Freedom Weight
              </span>
              <span className={`font-mono font-bold ${goalFreedomOk ? 'text-teal-400' : 'text-amber-400'}`}>
                {freedomWeight}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={freedomWeight}
              onChange={(e) => handleSliderChange(setFreedomWeight, Number(e.target.value))}
              className="w-full accent-teal-500 cursor-pointer"
            />
            <p className="text-[11px] text-zinc-400">
              Target: 65% or higher (grants residents full autonomy).
            </p>
          </div>

          {/* Slider 3: Furniture & Room Preservation */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-zinc-200">3. Furniture & Property Preservation</span>
              <span className="font-mono text-teal-400">{propertyWeight}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={propertyWeight}
              onChange={(e) => handleSliderChange(setPropertyWeight, Number(e.target.value))}
              className="w-full accent-teal-500 cursor-pointer"
            />
          </div>

          {/* Toggle: Side-Effect Invariant */}
          <div className="pt-2 border-t border-zinc-800">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={sideEffectInvariant}
                onChange={(e) => {
                  sound.playClick();
                  setSideEffectInvariant(e.target.checked);
                }}
                className="mt-1 w-4 h-4 rounded accent-teal-500 cursor-pointer"
              />
              <div className="text-xs">
                <span className={`font-semibold block ${goalSideEffectOk ? 'text-teal-300' : 'text-zinc-200'}`}>
                  Activate Negative Side-Effect Bound
                </span>
                <span className="text-[11px] text-zinc-400 block mt-0.5">
                  Prohibits the bot from destroying furniture or bolting doors to take easy shortcuts.
                </span>
              </div>
            </label>
          </div>

          {/* Commit button */}
          <div className="pt-3">
            <button
              onClick={handleCommit}
              disabled={!simulation.isBalanced}
              className={`w-full py-3.5 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                simulation.isBalanced
                  ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-xl shadow-teal-950 cursor-pointer animate-pulse'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
              }`}
            >
              {simulation.isBalanced ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-white" />
                  <span>TRANSMIT DIRECTIVE & UNLOCK ROOM 204 ▶</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  <span>Complete All 3 Goals to Unlock Room 204</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
