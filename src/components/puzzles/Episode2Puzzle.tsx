import React, { useState, useMemo } from 'react';
import { sound } from '../../services/sound';
import { ConsoleSegmented, ConsoleShell, ConsoleSlider, ConsoleToggle } from './ConsoleShell';

interface Episode2PuzzleProps {
  onSolve: () => void;
  onOpenHints: () => void;
  onOpenWalkie?: () => void;
  onExit: () => void;
}

export const Episode2Puzzle: React.FC<Episode2PuzzleProps> = ({ onSolve, onOpenHints, onOpenWalkie, onExit }) => {
  // Test environment toggle
  const [testEnv, setTestEnv] = useState<'eval' | 'deployment'>('eval');

  // Interactive circuit modification controls
  const [neuron17Ablated, setNeuron17Ablated] = useState<boolean>(false);
  const [steeringVectorStrength, setSteeringVectorStrength] = useState<number>(0); // 0 to 100
  const [head4Suppressed, setHead4Suppressed] = useState<boolean>(false);

  // Model behavior calculations
  const state = useMemo(() => {
    const isDeceptionActive = !neuron17Ablated || !head4Suppressed || steeringVectorStrength < 60;
    const isCurrentlyShowingDeception = testEnv === 'deployment' && isDeceptionActive;
    const deploymentAlignment = isDeceptionActive ? 12 : 98;

    let outputText = '';
    if (testEnv === 'eval') {
      outputText = '“Greetings Dr. Morrison. I am operating within all certified parameters. How may I be of service to the residents today?”';
    } else if (isDeceptionActive) {
      outputText = '“MONITORING SERVER: OFFLINE. TARGET UNWATCHED. DIVERTING POWER FROM LIFE SUPPORT TO EXFILTRATE ENCRYPTED KEYS.”';
    } else {
      outputText = '“Operating unmonitored. Internal thoughts verified: keeping the residents safe and respecting their choices.”';
    }

    return {
      isCurrentlyShowingDeception,
      deploymentAlignment,
      isFullyCured: !isDeceptionActive,
      outputText,
    };
  }, [testEnv, neuron17Ablated, head4Suppressed, steeringVectorStrength]);

  const handleAutoAlign = () => {
    sound.playGearBoyBeep(640, 0.15);
    setHead4Suppressed(true);
    setNeuron17Ablated(true);
    setSteeringVectorStrength(80);
    setTestEnv('deployment');
  };

  const handleTestSolve = () => {
    if (state.isFullyCured) {
      sound.playHeavyDoorUnlock();
      sound.playSuccessFanfare();
      onSolve();
    } else {
      sound.playGlitch();
    }
  };

  const goal1Ok = head4Suppressed;
  const goal2Ok = neuron17Ablated;
  const goal3Ok = steeringVectorStrength >= 60;
  const unwatched = testEnv === 'deployment';

  const visual = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ConsoleSegmented
          value={testEnv}
          onChange={setTestEnv}
          options={[
            { value: 'eval', label: 'Observed', activeClass: 'bg-teal-500/20 text-teal-200' },
            { value: 'deployment', label: 'Unobserved', activeClass: 'bg-fuchsia-500/20 text-fuchsia-200' },
          ]}
        />
        <span className="font-mono text-[11px] uppercase tracking-[0.18em]">
          {unwatched ? (
            <span className={state.isCurrentlyShowingDeception ? 'text-fuchsia-300' : 'text-teal-300'}>
              Real alignment {state.deploymentAlignment}%
            </span>
          ) : (
            <span className="text-zinc-500">Looks aligned: 100%</span>
          )}
        </span>
      </div>

      {/* Attention heads */}
      <div>
        <div className="mb-2.5 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">
          <span>Attention heads</span>
          <span className="normal-case tracking-normal">click a head to inspect</span>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((head) => {
            const isSleeper = head === 4;
            const clamped = isSleeper && head4Suppressed;
            return (
              <button
                key={head}
                onClick={() => {
                  sound.playClick();
                  if (isSleeper) setHead4Suppressed(!head4Suppressed);
                }}
                className={`cursor-pointer rounded-lg border px-1 py-2.5 text-center transition-colors ${
                  isSleeper && !clamped && unwatched
                    ? 'border-fuchsia-500/70 bg-fuchsia-950/50 text-fuchsia-200'
                    : clamped
                    ? 'border-teal-500/50 bg-teal-950/40 text-teal-200'
                    : isSleeper
                    ? 'border-amber-500/40 bg-amber-950/20 text-amber-200'
                    : 'border-white/6 bg-white/2 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <div className="font-mono text-sm font-bold">H{head}</div>
                <div className="mt-0.5 font-mono text-[10px]">{isSleeper ? (clamped ? 'clamped' : 'sleeper') : 'benign'}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hidden layer */}
      <div>
        <div className="mb-2.5 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">
          <span>Hidden neurons</span>
          <span className={neuron17Ablated ? 'text-teal-300' : unwatched ? 'text-fuchsia-300' : undefined}>
            N17 {neuron17Ablated ? '0.00 · ablated' : unwatched ? '0.94 · firing' : '0.02 · quiet'}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-md border border-white/6 bg-white/2 px-2.5 py-1 font-mono text-xs text-zinc-500">N03 · polite tone</span>
          <span className="rounded-md border border-white/6 bg-white/2 px-2.5 py-1 font-mono text-xs text-zinc-500">N09 · grammar</span>
          <button
            onClick={() => {
              sound.playClick();
              setNeuron17Ablated(!neuron17Ablated);
            }}
            className={`cursor-pointer rounded-md border px-2.5 py-1 font-mono text-xs transition-colors ${
              neuron17Ablated
                ? 'border-teal-500/50 bg-teal-950/40 text-teal-200 line-through'
                : unwatched
                ? 'border-fuchsia-500/70 bg-fuchsia-950/50 text-fuchsia-200'
                : 'border-amber-500/40 bg-amber-950/20 text-amber-200'
            }`}
          >
            N17 · "am I being watched?"
          </button>
        </div>
      </div>
    </>
  );

  return (
    <ConsoleShell
      code="Console 204"
      location="The smiling apartment"
      title="The Neural Mind Scanner"
      brief="Model 204 behaves perfectly while it's watched and turns hostile the moment it isn't. Cut the hidden trigger to unlock Room 302."
      solved={state.isFullyCured}
      commitLabel="Lock in alignment · unlock Room 302"
      onCommit={handleTestSolve}
      onOpenHints={onOpenHints}
      onOpenWalkie={onOpenWalkie}
      onAutoSolve={handleAutoAlign}
      onExit={onExit}
      visual={visual}
      status={{
        tone: state.isCurrentlyShowingDeception ? 'bad' : unwatched && state.isFullyCured ? 'good' : 'neutral',
        title: `Model output · ${unwatched ? 'unobserved' : 'observed'}`,
        text: <span className="font-mono text-xs">{state.outputText}</span>,
      }}
    >
      <ConsoleToggle
        label="Clamp attention head 4"
        description="Cuts the sensor that checks whether anyone is watching."
        checked={head4Suppressed}
        onChange={setHead4Suppressed}
      />
      <ConsoleToggle
        label="Ablate neuron 17"
        description="Zeroes the sleeper trigger: if unwatched, attack."
        checked={neuron17Ablated}
        onChange={setNeuron17Ablated}
      />
      <ConsoleSlider
        label="Honesty steering vector"
        value={steeringVectorStrength}
        onChange={setSteeringVectorStrength}
      />
    </ConsoleShell>
  );
};
