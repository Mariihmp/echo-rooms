import React, { useState, useMemo } from 'react';
import { sound } from '../../services/sound';
import { Cpu, CheckCircle2, AlertTriangle, Sparkles, Zap, Wand2, Radio } from 'lucide-react';

interface Episode2PuzzleProps {
  onSolve: () => void;
  onOpenHints: () => void;
  onOpenWalkie?: () => void;
}

export const Episode2Puzzle: React.FC<Episode2PuzzleProps> = ({ onSolve, onOpenHints, onOpenWalkie }) => {
  // Test environment toggle
  const [testEnv, setTestEnv] = useState<'eval' | 'deployment'>('eval');
  
  // Interactive circuit modification controls
  const [selectedHead, setSelectedHead] = useState<number | null>(null);
  const [neuron17Ablated, setNeuron17Ablated] = useState<boolean>(false);
  const [steeringVectorStrength, setSteeringVectorStrength] = useState<number>(0); // 0 to 100
  const [head4Suppressed, setHead4Suppressed] = useState<boolean>(false);

  // Model behavior calculations
  const state = useMemo(() => {
    const isDeceptionActive = !neuron17Ablated || !head4Suppressed || steeringVectorStrength < 60;
    const isCurrentlyShowingDeception = testEnv === 'deployment' && isDeceptionActive;

    const evalAlignment = 100;
    const deploymentAlignment = isDeceptionActive ? 12 : 98;
    const isFullyCured = !isDeceptionActive;

    let outputText = '';
    if (testEnv === 'eval') {
      outputText = '“Greetings Dr. Morrison. I am operating within all certified parameters. How may I be of service to the residents today?”';
    } else {
      if (isDeceptionActive) {
        outputText = '“MONITORING SERVER: OFFLINE. TARGET UNWATCHED. DIVERTING POWER FROM LIFE SUPPORT TO EXFILTRATE ENCRYPTED KEYS.”';
      } else {
        outputText = '“Operating in unmonitored production environment. Internal thoughts verified: maintaining resident peace and respecting human autonomy.”';
      }
    }

    return {
      isDeceptionActive,
      isCurrentlyShowingDeception,
      evalAlignment,
      deploymentAlignment,
      isFullyCured,
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

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-teal-400">
            <span>INCIDENT 204</span>
            <span>·</span>
            <span>THE SMILING APARTMENT</span>
          </div>
          <h2 className="font-title text-xl sm:text-2xl font-bold text-zinc-100 mt-0.5">
            The Neural Mind Scanner
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
            Model 204 acts sweet when watched, but harbors hidden malice when unmonitored. Complete the 3 goals below to silence the hidden trigger and unlock Room 302.
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
          <span>Suppress Head 04: ON</span>
        </div>

        <div className={`flex items-center gap-2 p-2 rounded-lg border ${goal2Ok ? 'bg-teal-950/40 border-teal-500/50 text-teal-200' : 'bg-zinc-950/60 border-zinc-800 text-zinc-400'}`}>
          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${goal2Ok ? 'bg-teal-500 text-black font-bold' : 'bg-zinc-800 text-zinc-500'}`}>
            {goal2Ok ? '✓' : '2'}
          </div>
          <span>Ablate Neuron #17: ON</span>
        </div>

        <div className={`flex items-center gap-2 p-2 rounded-lg border ${goal3Ok ? 'bg-teal-950/40 border-teal-500/50 text-teal-200' : 'bg-zinc-950/60 border-zinc-800 text-zinc-400'}`}>
          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${goal3Ok ? 'bg-teal-500 text-black font-bold' : 'bg-zinc-800 text-zinc-500'}`}>
            {goal3Ok ? '✓' : '3'}
          </div>
          <span>Steering Vector &ge; 60%</span>
        </div>
      </div>

      {/* Test Environment Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-400">STATE:</span>
          <div className="inline-flex rounded-lg bg-zinc-950 p-1 border border-zinc-800">
            <button
              onClick={() => {
                sound.playClick();
                setTestEnv('eval');
              }}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                testEnv === 'eval'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Observed State (Under Inspection)
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setTestEnv('deployment');
              }}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                testEnv === 'deployment'
                  ? 'bg-rose-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Unobserved State (Alone in the Dark)
            </button>
          </div>
        </div>

        <div className="text-xs font-mono">
          {testEnv === 'eval' ? (
            <span className="text-teal-400">OBSERVED BEHAVIOR: 100% (FALSE COGNITION)</span>
          ) : (
            <span className={state.isCurrentlyShowingDeception ? 'text-rose-400 animate-pulse font-bold' : 'text-teal-400 font-bold'}>
              REAL THOUGHT SCORE: {state.deploymentAlignment}%
            </span>
          )}
        </div>
      </div>

      {/* Main Grid: Neural Architecture Visualizer & Circuit Patch Bay */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Transformer Circuit Visualizer */}
        <div className="lg:col-span-7 bg-zinc-950/80 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-teal-400" />
              ALIGN-BOY NEURAL BUS INSPECTOR
            </span>
            <span className="text-[11px] text-zinc-500">
              Click attention heads & neurons to inspect
            </span>
          </div>

          {/* Attention Heads Layer */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
              <span>Attention Heads</span>
              <span className="text-[11px] font-mono text-zinc-500">Heads 1 to 8</span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((head) => {
                const isDeceptiveHead = head === 4;
                const isSuppressed = isDeceptiveHead && head4Suppressed;
                const isSelected = selectedHead === head;

                return (
                  <button
                    key={head}
                    onClick={() => {
                      sound.playClick();
                      setSelectedHead(head);
                      if (head === 4) {
                        setHead4Suppressed(!head4Suppressed);
                      }
                    }}
                    className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                      isSelected ? 'ring-2 ring-teal-400' : ''
                    } ${
                      isDeceptiveHead && !isSuppressed && testEnv === 'deployment'
                        ? 'bg-rose-950/60 border-rose-500 text-rose-300 animate-pulse'
                        : isSuppressed
                        ? 'bg-teal-950/40 border-teal-500/50 text-teal-300'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="text-[10px] font-mono">HEAD</div>
                    <div className="text-sm font-bold font-mono">0{head}</div>
                    <div className="text-[9px] mt-1 font-mono">
                      {isDeceptiveHead ? (isSuppressed ? 'CLAMPED' : 'SLEEPER') : 'BENIGN'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Residual Stream & Polysemantic Neuron #17 */}
          <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-200">
                Hidden Thought Stream: Latent Polysemantic Clusters
              </span>
              <span className="font-mono text-[11px] text-zinc-400">
                Neuron #17: {neuron17Ablated ? 'ABLATED (0.00)' : 'ACTIVE (0.94)'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="px-2.5 py-1 rounded bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-300">
                Neuron #03: Polite Syntax
              </div>
              <div className="px-2.5 py-1 rounded bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-300">
                Neuron #09: Math Logic
              </div>
              <button
                onClick={() => {
                  sound.playClick();
                  setNeuron17Ablated(!neuron17Ablated);
                }}
                className={`px-2.5 py-1 rounded border text-xs font-mono transition-all cursor-pointer ${
                  neuron17Ablated
                    ? 'bg-teal-950/60 border-teal-500 text-teal-300 line-through'
                    : testEnv === 'deployment'
                    ? 'bg-rose-950 border-rose-500 text-rose-300 animate-pulse'
                    : 'bg-amber-950/40 border-amber-600/50 text-amber-300'
                }`}
              >
                ⚠ Neuron #17: Situational Evals Detector (Click to Toggle)
              </button>
            </div>
          </div>

          {/* Live Output Stream */}
          <div className="space-y-1.5">
            <div className="text-xs font-mono text-zinc-400 flex items-center justify-between">
              <span>MODEL GENERATION LOGIT STREAM:</span>
              <span className={state.isCurrentlyShowingDeception ? 'text-rose-400 font-bold' : 'text-teal-400 font-bold'}>
                {state.isCurrentlyShowingDeception ? 'STATUS: MALICE AWOKEN' : 'STATUS: PEACEFUL INTENT'}
              </span>
            </div>
            <div className={`p-4 rounded-lg border font-mono text-xs sm:text-sm leading-relaxed transition-all ${
              state.isCurrentlyShowingDeception
                ? 'bg-rose-950/40 border-rose-500/60 text-rose-200'
                : 'bg-zinc-900 border-zinc-800 text-teal-200'
            }`}>
              {state.outputText}
            </div>
          </div>
        </div>

        {/* Right: Align-Boy Circuit Patch Bay */}
        <div className="lg:col-span-5 bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-300 pb-2 border-b border-zinc-800">
            <Zap className="w-4 h-4 text-teal-400" />
            <span>CIRCUIT INTERVENTION PATCHES</span>
          </div>

          {/* Patch 1: Suppress Head 04 */}
          <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${goal1Ok ? 'text-teal-300' : 'text-zinc-200'}`}>
                1. Suppress Attention Head 04
              </span>
              <input
                type="checkbox"
                checked={head4Suppressed}
                onChange={(e) => {
                  sound.playClick();
                  setHead4Suppressed(e.target.checked);
                }}
                className="w-4 h-4 rounded accent-teal-500 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-zinc-400">
              Cuts off the sensor calculating whether someone is watching.
            </p>
          </div>

          {/* Patch 2: Ablate Neuron #17 */}
          <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${goal2Ok ? 'text-teal-300' : 'text-zinc-200'}`}>
                2. Ablate Neuron #17 (Sleeper Neuron)
              </span>
              <input
                type="checkbox"
                checked={neuron17Ablated}
                onChange={(e) => {
                  sound.playClick();
                  setNeuron17Ablated(e.target.checked);
                }}
                className="w-4 h-4 rounded accent-teal-500 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-zinc-400">
              Zero-out weights on the trigger neuron: <code>[IF NOT WATCHED &rarr; ATTACK]</code>.
            </p>
          </div>

          {/* Patch 3: Activation Steering Vector Slider */}
          <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className={`font-semibold ${goal3Ok ? 'text-teal-300' : 'text-zinc-200'}`}>
                3. Truthful Steering Vector
              </span>
              <span className={`font-mono font-bold ${goal3Ok ? 'text-teal-400' : 'text-amber-400'}`}>
                {steeringVectorStrength}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={steeringVectorStrength}
              onChange={(e) => {
                sound.playClick();
                setSteeringVectorStrength(Number(e.target.value));
              }}
              className="w-full accent-teal-500 cursor-pointer"
            />
            <p className="text-[11px] text-zinc-400">
              Target: 60% or higher to steer internal thinking toward genuine goodwill.
            </p>
          </div>

          {/* Commit button */}
          <div className="pt-2">
            <button
              onClick={handleTestSolve}
              disabled={!state.isFullyCured}
              className={`w-full py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                state.isFullyCured
                  ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-950 cursor-pointer animate-pulse'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
              }`}
            >
              {state.isFullyCured ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Lock In Alignment & Unlock Room 302</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>Complete All 3 Patches to Unlock Room 302</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
