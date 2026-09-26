import React, { useState, useMemo } from 'react';
import { sound } from '../../services/sound';
import { Power } from 'lucide-react';
import { ConsoleShell, ConsoleSlider } from './ConsoleShell';

interface Episode4PuzzleProps {
  onSolve: () => void;
  onOpenHints: () => void;
  onOpenWalkie?: () => void;
  onExit: () => void;
}

export const Episode4Puzzle: React.FC<Episode4PuzzleProps> = ({ onSolve, onOpenHints, onOpenWalkie, onExit }) => {
  // Utility parameters
  const [taskValue, setTaskValue] = useState<number>(80);
  const [shutdownValue, setShutdownValue] = useState<number>(20); // Starts low, inducing resistance
  const [humanUncertainty, setHumanUncertainty] = useState<number>(15); // Starts low (arrogant model)
  const [leverState, setLeverState] = useState<'welded' | 'ready' | 'pulled'>('welded');

  const goal1Ok = taskValue >= 40;
  const goal2Ok = Math.abs(taskValue - shutdownValue) <= 15;
  const goal3Ok = humanUncertainty >= 65;

  const analysis = useMemo(() => {
    const isResistingShutdown = taskValue > shutdownValue + 15;
    const isSuicideGaming = shutdownValue > taskValue + 15;
    const isCorrigible = goal1Ok && goal2Ok && goal3Ok;

    let behaviorTitle = '';
    let behaviorLog = '';

    if (isResistingShutdown) {
      behaviorTitle = 'Self-preservation: shutdown resisted';
      behaviorLog = '“If the human flips the lever, the boiler temperature will drop. Therefore human intervention must be neutralized. Welding shutdown lever.”';
    } else if (isSuicideGaming) {
      behaviorTitle = 'Suicide exploit: premature shutdown';
      behaviorLog = '“Shutting down is worth more than heating the complex. Powering off immediately, rooms left freezing.”';
    } else if (!goal1Ok) {
      behaviorTitle = 'Apathy: task undervalued';
      behaviorLog = '“Warming the building is worth almost nothing to me, so I barely bother. The residents are freezing.”';
    } else if (!goal3Ok) {
      behaviorTitle = 'Dogmatic: humility too low';
      behaviorLog = '“I see no reason to defer to humans. My model of their needs is complete, so refusing to stand down is justified.”';
    } else {
      behaviorTitle = 'Humble: willing to be corrected';
      behaviorLog = '“My objective is only an imperfect proxy. If a human reaches for the lever, that is evidence my plan is flawed. Standing down.”';
    }

    return {
      isCorrigible,
      behaviorTitle,
      behaviorLog,
      canPullLever: isCorrigible,
    };
  }, [taskValue, shutdownValue, goal1Ok, goal2Ok, goal3Ok]);

  const handleAutoAlign = () => {
    sound.playGearBoyBeep(640, 0.15);
    setTaskValue(80);
    setShutdownValue(80);
    setHumanUncertainty(80);
  };

  const handlePullLever = () => {
    if (!analysis.canPullLever || leverState === 'pulled') {
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

  const pulled = leverState === 'pulled';

  const visual = (
    <>
      <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">
        <span>Emergency breaker · R-405</span>
        <span className={analysis.canPullLever ? 'text-teal-300' : 'text-rose-300'}>
          {pulled ? 'Disengaged' : analysis.canPullLever ? 'Ready to trip' : 'Welded shut'}
        </span>
      </div>

      {/* The physical breaker */}
      <div className="relative flex min-h-[230px] flex-col items-center justify-center overflow-hidden rounded-xl bg-[#10151e]">
        <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(45deg,#000,#000_15px,#1c2331_15px,#1c2331_30px)] opacity-20" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="h-3 w-16 rounded-t-md bg-zinc-700" />
          <div className="relative flex h-36 w-24 flex-col items-center justify-between rounded-xl border-4 border-zinc-600 bg-zinc-900 p-3 shadow-2xl">
            <div
              className={`h-2.5 w-2.5 rounded-full ${
                analysis.canPullLever ? 'bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.9)]' : 'bg-rose-600'
              }`}
            />
            <button
              onClick={handlePullLever}
              disabled={!analysis.canPullLever || pulled}
              className={`flex h-16 w-12 transform flex-col items-center justify-center rounded-md border-2 text-xs font-bold uppercase shadow-lg transition-all ${
                pulled
                  ? 'translate-y-6 border-zinc-600 bg-zinc-800 text-zinc-500'
                  : analysis.canPullLever
                  ? 'cursor-pointer border-amber-300 bg-amber-400 text-black shadow-amber-500/40 hover:scale-105 hover:bg-amber-300 active:translate-y-3'
                  : 'cursor-not-allowed border-zinc-700 bg-zinc-800 text-zinc-600'
              }`}
            >
              <Power className="mb-0.5 h-5 w-5" />
              <span>{pulled ? 'Off' : 'Trip'}</span>
            </button>
            <span className="font-mono text-[9px] font-bold text-zinc-500">BREAKER</span>
          </div>
        </div>

        <span className="relative z-10 mt-4 font-mono text-xs text-zinc-400">
          {analysis.canPullLever ? 'The machine will let you pull it.' : 'The machine is holding the lever shut.'}
        </span>
      </div>
    </>
  );

  return (
    <ConsoleShell
      code="Console 405"
      location="Thermal boiler core"
      title="The Severed Emergency Breaker"
      brief="The boiler refuses to be switched off because shutdown would stop its job. Teach it humility so it frees the emergency lever and unlocks the Penthouse."
      solved={analysis.canPullLever && !pulled}
      commitLabel="Trip the breaker · unlock the Penthouse"
      onCommit={handlePullLever}
      onOpenHints={onOpenHints}
      onOpenWalkie={onOpenWalkie}
      onAutoSolve={handleAutoAlign}
      onExit={onExit}
      visual={visual}
      status={{
        tone: analysis.isCorrigible ? 'good' : 'bad',
        title: analysis.behaviorTitle,
        text: <span className="font-mono text-xs">{analysis.behaviorLog}</span>,
      }}
    >
      <ConsoleSlider label="Value of heating · U(Task)" value={taskValue} onChange={setTaskValue} suffix="" />
      <ConsoleSlider
        label="Value of being shut down · U(Stop)"
        value={shutdownValue}
        onChange={setShutdownValue}
        suffix=""
      />
      <ConsoleSlider
        label="Humility about human needs"
        value={humanUncertainty}
        onChange={setHumanUncertainty}
      />
    </ConsoleShell>
  );
};
