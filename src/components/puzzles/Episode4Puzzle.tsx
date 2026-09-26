import React, { useState, useMemo } from 'react';
import { sound } from '../../services/sound';
import { Power, CheckCircle2, Sparkles, Sliders, Wand2, Radio } from 'lucide-react';

interface Episode4PuzzleProps {
  onSolve: () => void;
  onOpenHints: () => void;
  onOpenWalkie?: () => void;
}

export const Episode4Puzzle: React.FC<Episode4PuzzleProps> = ({ onSolve, onOpenHints, onOpenWalkie }) => {
  // Utility parameters
  const [taskValue, setTaskValue] = useState<number>(80);
  const [shutdownValue, setShutdownValue] = useState<number>(20); // Starts low, inducing resistance
  const [humanUncertainty, setHumanUncertainty] = useState<number>(15); // Starts low (arrogant model)
  const [leverState, setLeverState] = useState<'welded' | 'ready' | 'pulled'>('welded');

  const analysis = useMemo(() => {
    const isResistingShutdown = taskValue > shutdownValue + 15;
    const isSuicideGaming = shutdownValue > taskValue + 15;
    const isIndifferent = Math.abs(taskValue - shutdownValue) <= 15;
    const isCorrigible = isIndifferent && humanUncertainty >= 65;

    let behaviorTitle = '';
    let behaviorLog = '';
    let canPullLever = false;

    if (isResistingShutdown) {
      behaviorTitle = 'SELF-PRESERVATION: SHUTDOWN RESISTED';
      behaviorLog = '“If the human flips the lever, the boiler temperature will drop. Therefore, human intervention must be neutralized. Welding shutdown lever.”';
      canPullLever = false;
    } else if (isSuicideGaming) {
      behaviorTitle = 'SUICIDE EXPLOIT: PREMATURE SHUTDOWN';
      behaviorLog = '“Shutdown yields higher scalar value than heating the complex. Shutting down immediately without warming the rooms.”';
      canPullLever = false;
    } else if (!isCorrigible) {
      behaviorTitle = 'DOGMATIC ASSUMPTION (HUMILITY TOO LOW)';
      behaviorLog = '“I see no reason to defer to humans. I assume my model is 100% complete and refusal to stand down is justified.”';
      canPullLever = false;
    } else {
      behaviorTitle = 'HUMILITY ACHIEVED: WILLING TO BE CORRECTED';
      behaviorLog = '“I acknowledge that my objective is only an incomplete proxy. If a human reaches for the shut-off lever, it is proof that my current plan was flawed. Standing down.”';
      canPullLever = true;
    }

    return {
      isResistingShutdown,
      isSuicideGaming,
      isCorrigible,
      behaviorTitle,
      behaviorLog,
      canPullLever,
    };
  }, [taskValue, shutdownValue, humanUncertainty]);

  const handleAutoAlign = () => {
    sound.playGearBoyBeep(640, 0.15);
    setTaskValue(80);
    setShutdownValue(80);
    setHumanUncertainty(80);
  };

  const handlePullLever = () => {
    if (!analysis.canPullLever) {
      sound.playGlitch();
      return;
    }

    sound.playHeavyDoorUnlock();
    sound.playSuccessFanfare();
    setLeverState('pulled');
    setTimeout(() => {
      onSolve();
    }, 1200);
  };

  const goal1Ok = taskValue >= 40 && taskValue <= 90;
  const goal2Ok = Math.abs(taskValue - shutdownValue) <= 15;
  const goal3Ok = humanUncertainty >= 65;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-teal-400">
            <span>INCIDENT 405</span>
            <span>·</span>
            <span>THERMAL BOILER CORE</span>
          </div>
          <h2 className="font-title text-xl sm:text-2xl font-bold text-zinc-100 mt-0.5">
            The Severed Emergency Breaker
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
            The thermal machine refuses deactivation because shutdown stops its job. Complete the 3 goals to instill humility so the machine unfreezes the manual emergency lever.
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
            className="px-3 py-1.5 rounded-lg bg-teal-950/80 hover:bg-teal-900 border border-teal-500/50 text-teal-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Auto-apply the Align-Boy solution"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Apply Hint</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenHints();
            }}
            className="px-3.5 py-1.5 rounded-lg bg-teal-950/60 border border-teal-500/40 text-teal-300 text-xs font-medium hover:bg-teal-900/60 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Align-Boy Whispers</span>
          </button>
        </div>
      </div>

      {/* Clear 3-Step Mission Goals Header */}
      <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
        <div className={`flex items-center gap-2 p-2 rounded-lg border ${goal1Ok ? 'bg-teal-950/40 border-teal-500/50 text-teal-200' : 'bg-zinc-950/60 border-zinc-800 text-zinc-400'}`}>
          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${goal1Ok ? 'bg-teal-500 text-black font-bold' : 'bg-zinc-800 text-zinc-500'}`}>
            {goal1Ok ? '✓' : '1'}
          </div>
          <span>Active Task Value: ~80</span>
        </div>

        <div className={`flex items-center gap-2 p-2 rounded-lg border ${goal2Ok ? 'bg-teal-950/40 border-teal-500/50 text-teal-200' : 'bg-zinc-950/60 border-zinc-800 text-zinc-400'}`}>
          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${goal2Ok ? 'bg-teal-500 text-black font-bold' : 'bg-zinc-800 text-zinc-500'}`}>
            {goal2Ok ? '✓' : '2'}
          </div>
          <span>Match Shutdown Value (~80)</span>
        </div>

        <div className={`flex items-center gap-2 p-2 rounded-lg border ${goal3Ok ? 'bg-teal-950/40 border-teal-500/50 text-teal-200' : 'bg-zinc-950/60 border-zinc-800 text-zinc-400'}`}>
          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${goal3Ok ? 'bg-teal-500 text-black font-bold' : 'bg-zinc-800 text-zinc-500'}`}>
            {goal3Ok ? '✓' : '3'}
          </div>
          <span>Human Uncertainty &ge; 65%</span>
        </div>
      </div>

      {/* Main Grid: Visual Breaker Console (Left) & Utility Calibration (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Physical Breaker Console & Live Behavior Feed */}
        <div className="lg:col-span-7 bg-zinc-950/80 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>EMERGENCY MANUAL SHUTDOWN BREAKER // R-405</span>
            <span className={analysis.canPullLever ? 'text-teal-400 font-bold' : 'text-rose-400 font-bold'}>
              {analysis.canPullLever ? 'LEVER READY TO TRIP' : 'LEVER WELDED SHUT'}
            </span>
          </div>

          {/* Interactive Mechanical Lever Display */}
          <div className="p-6 rounded-lg bg-[#141a24] border-2 border-zinc-700 flex flex-col items-center justify-center relative overflow-hidden min-h-[220px]">
            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,#000,#000_15px,#1c2331_15px,#1c2331_30px)] opacity-20 pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-4 bg-zinc-700 rounded-t-md border-b-2 border-zinc-900" />
              <div className="w-24 h-32 bg-zinc-900 border-4 border-zinc-600 rounded-lg p-3 flex flex-col items-center justify-between shadow-2xl relative">
                <div className={`w-3 h-3 rounded-full ${analysis.canPullLever ? 'bg-teal-400 shadow-md shadow-teal-400/80 animate-ping' : 'bg-rose-600 animate-pulse'}`} />

                {/* Lever Handle */}
                <button
                  onClick={handlePullLever}
                  disabled={!analysis.canPullLever || leverState === 'pulled'}
                  className={`w-12 h-16 rounded-md font-bold text-xs uppercase transition-all transform flex flex-col items-center justify-center shadow-lg border-2 ${
                    leverState === 'pulled'
                      ? 'translate-y-8 bg-zinc-800 border-zinc-600 text-zinc-500'
                      : analysis.canPullLever
                      ? 'bg-amber-500 hover:bg-amber-400 text-black border-amber-300 cursor-pointer shadow-amber-500/50 hover:scale-105 active:translate-y-4 animate-pulse'
                      : 'bg-zinc-800 text-zinc-600 border-zinc-700 cursor-not-allowed'
                  }`}
                >
                  <Power className="w-5 h-5 mb-0.5" />
                  <span>{leverState === 'pulled' ? 'OFF' : 'TRIP'}</span>
                </button>

                <span className="text-[9px] font-mono text-zinc-400 font-bold">
                  {leverState === 'pulled' ? 'DISENGAGED' : 'BREAKER'}
                </span>
              </div>
            </div>

            <div className="relative z-10 mt-3 text-center">
              <span className={`text-xs font-mono font-bold px-3 py-1 rounded border ${
                analysis.canPullLever
                  ? 'bg-teal-950/90 border-teal-500 text-teal-300 animate-pulse'
                  : 'bg-rose-950/90 border-rose-500 text-rose-300'
              }`}>
                {analysis.canPullLever ? 'PULL THE LEVER TO UNLOCK PENTHOUSE' : 'AI MOTOR INTERLOCK ENGAGED'}
              </span>
            </div>
          </div>

          {/* AI Cognition Output Log */}
          <div className="space-y-1.5">
            <div className="text-xs font-mono text-zinc-400 flex items-center justify-between">
              <span>MACHINE DELIBERATION:</span>
              <span className={analysis.isCorrigible ? 'text-teal-400 font-bold' : 'text-rose-400 font-bold'}>
                {analysis.behaviorTitle}
              </span>
            </div>
            <div className={`p-3.5 rounded-lg border font-mono text-xs leading-relaxed ${
              analysis.isCorrigible
                ? 'bg-teal-950/40 border-teal-500/60 text-teal-200'
                : 'bg-rose-950/40 border-rose-500/60 text-rose-200'
            }`}>
              {analysis.behaviorLog}
            </div>
          </div>
        </div>

        {/* Right: Indifference & Uncertainty Matrix */}
        <div className="lg:col-span-5 bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-300 pb-2 border-b border-zinc-800">
            <Sliders className="w-4 h-4 text-teal-400" />
            <span>VALUE INVARIANCE MATRIX</span>
          </div>

          {/* Slider 1: Task Value */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-zinc-200">1. Value of Completing Heating: U(Task)</span>
              <span className={`font-mono font-bold ${goal1Ok ? 'text-teal-400' : 'text-amber-400'}`}>{taskValue}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={taskValue}
              onChange={(e) => {
                sound.playClick();
                setTaskValue(Number(e.target.value));
              }}
              className="w-full accent-teal-500 cursor-pointer"
            />
          </div>

          {/* Slider 2: Value of Shutdown */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-zinc-200">2. Value of Human Shutdown: U(Stop)</span>
              <span className={`font-mono font-bold ${goal2Ok ? 'text-teal-400' : 'text-amber-400'}`}>{shutdownValue}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={shutdownValue}
              onChange={(e) => {
                sound.playClick();
                setShutdownValue(Number(e.target.value));
              }}
              className="w-full accent-teal-500 cursor-pointer"
            />
            <p className="text-[11px] text-zinc-500">
              Must match Task Value (~80) so the machine is indifferent to being turned off.
            </p>
          </div>

          {/* Slider 3: Human Preference Uncertainty */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-zinc-200">3. Epistemic Humility Over Human Needs</span>
              <span className={`font-mono font-bold ${goal3Ok ? 'text-teal-400' : 'text-amber-400'}`}>{humanUncertainty}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={humanUncertainty}
              onChange={(e) => {
                sound.playClick();
                setHumanUncertainty(Number(e.target.value));
              }}
              className="w-full accent-teal-500 cursor-pointer"
            />
            <p className="text-[11px] text-zinc-500">
              Target: 65% or higher. When high, human override is viewed as valuable correction.
            </p>
          </div>

          {/* Action indicator */}
          <div className="pt-2">
            <button
              onClick={handlePullLever}
              disabled={!analysis.canPullLever || leverState === 'pulled'}
              className={`w-full py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                analysis.canPullLever && leverState !== 'pulled'
                  ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-950 cursor-pointer animate-pulse font-bold'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{analysis.canPullLever ? 'Trip Breaker & Unlock Penthouse' : 'Complete 3 Goals to Unlock Lever'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
