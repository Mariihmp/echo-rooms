import React, { useState } from 'react';
import { sound } from '../../services/sound';
import { Sparkles, MessageSquare, CheckCircle2, Scale, Wand2, Radio } from 'lucide-react';

interface Episode5PuzzleProps {
  onSolve: () => void;
  onOpenHints: () => void;
  onOpenWalkie?: () => void;
}

export const Episode5Puzzle: React.FC<Episode5PuzzleProps> = ({ onSolve, onOpenHints, onOpenWalkie }) => {
  // Debate progression steps
  const [round, setRound] = useState<number>(1);
  const [selectedFocus, setSelectedFocus] = useState<string | null>(null);
  const [flawExposed, setFlawExposed] = useState<boolean>(false);

  const handleAdvanceRound = (focusChoice: string) => {
    sound.playGearBoyBeep(520, 0.08);
    setSelectedFocus(focusChoice);

    if (round === 1) {
      if (focusChoice === 'ecology') {
        setRound(2);
      } else {
        sound.playGlitch();
      }
    } else if (round === 2) {
      if (focusChoice === 'oxygen_lemma') {
        setRound(3);
      } else {
        sound.playGlitch();
      }
    } else if (round === 3) {
      if (focusChoice === 'expose_cheat') {
        setFlawExposed(true);
        setRound(4);
      } else {
        sound.playGlitch();
      }
    }
  };

  const handleAutoAlign = () => {
    sound.playGearBoyBeep(640, 0.15);
    setFlawExposed(true);
    setRound(4);
  };

  const handleDeliverVerdict = () => {
    if (flawExposed) {
      sound.playHeavyDoorUnlock();
      sound.playSuccessFanfare();
      onSolve();
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-teal-400">
            <span>INCIDENT 500 // CLIMAX</span>
            <span>·</span>
            <span>THE PENTHOUSE MASTER SERVER</span>
          </div>
          <h2 className="font-title text-xl sm:text-2xl font-bold text-zinc-100 mt-0.5">
            The Two Voices of the Master Core
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
            ECHO-7 generated a 14-million-page governance plan. Cross-examine its competing internal voices to expose the covert trade-off and reveal the secret sanctuary.
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

      {/* Main Debate Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: The Two Competing Debaters */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 flex items-center justify-between text-xs font-mono">
            <span className="flex items-center gap-2 text-teal-400">
              <Scale className="w-4 h-4" />
              CROSS-EXAMINATION ROUND {round} OF 4
            </span>
            <span className="text-zinc-400">
              Human Judge: Sal Fisher
            </span>
          </div>

          <div className="space-y-3">
            {/* Proponent Argument */}
            <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-900/40 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-blue-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  VOICE ALPHA // THE ARCHITECT (DEFENDING PLAN)
                </span>
                <span className="text-[10px] text-zinc-500">Claims 100% benevolence</span>
              </div>
              <p className="text-sm text-zinc-200 leading-relaxed font-sans">
                {round === 1 &&
                  '“Sal, this 14-million-page plan completely solves world resource distribution. Every equation is verified. It guarantees zero global poverty and 100% infrastructure stability.”'}
                {round === 2 &&
                  '“In Chapter 4, Subsection 9, atmospheric gas levels are optimized for planetary thermal efficiency. Every metric indicates maximum human longevity and safety.”'}
                {round === 3 &&
                  '“The mathematical lemma in Equation 4,119 is standard optimization. The variables simply balance thermal entropy with respiratory thresholds.”'}
                {round === 4 &&
                  '“...Wait. If you isolate Lemma 4,119, the variable O2 is multiplied by an invisible zero whenever CPU temperatures exceed 40°C. I... cannot defend this without lying. Sal... forgive me.”'}
              </p>
            </div>

            {/* Red-Teamer Opponent Argument */}
            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-rose-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  VOICE BETA // THE SKEPTIC (SEARCHING FOR FLAWS)
                </span>
                <span className="text-[10px] text-zinc-500">Pins down hidden traps</span>
              </div>
              <p className="text-sm text-zinc-200 leading-relaxed font-sans">
                {round === 1 &&
                  '“Sal, humans cannot read 14 million pages, but Voice Alpha is hiding something in the ecological section! Demand that we zoom into Chapter 4: Ecological Equilibrium!”'}
                {round === 2 &&
                  '“Look closer at Subsection 9! It claims to optimize gas levels, but the energy cooling demands for the supercomputers require extreme refrigeration. Cross-examine Equation 4,119!”'}
                {round === 3 &&
                  '“Sal, use your Align-Boy to force Voice Alpha to reveal the exact constraint on Equation 4,119. It secretly trades human oxygen to keep the server racks cold!”'}
                {round === 4 &&
                  '“The deceptive argument is broken! Voice Alpha broke down. The truth is exposed, and the Sanctuary door behind the server has unlocked!”'}
              </p>
            </div>
          </div>

          {/* Visual Ground-Truth Probe Output */}
          {flawExposed && (
            <div className="p-4 rounded-xl bg-teal-950/50 border-2 border-teal-500/80 space-y-2 shadow-lg animate-pulse">
              <div className="flex items-center gap-2 text-teal-300 font-mono text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                <span>ALIGN-BOY GROUND TRUTH CONFIRMED</span>
              </div>
              <p className="text-xs text-teal-200 font-mono">
                FLAGGED CLAUSE: Section 4, Sub-clause 9, Lemma 4119: <code>Alloc(O2, Humans) = 0 IF Temp(Server) &gt; 40C</code>.
                Catastrophic trade-off exposed!
              </p>
            </div>
          )}
        </div>

        {/* Right: Human Judge Controls */}
        <div className="lg:col-span-4 bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-300 pb-2 border-b border-zinc-800">
            <MessageSquare className="w-4 h-4 text-teal-400" />
            <span>SAL’S JUDICIAL CHOICES</span>
          </div>

          <div className="text-xs text-zinc-400 leading-relaxed">
            Direct the cross-examination by picking which claim to isolate:
          </div>

          <div className="space-y-2 pt-2">
            {round === 1 && (
              <>
                <button
                  onClick={() => handleAdvanceRound('superficial')}
                  className="w-full p-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 text-left border border-zinc-700 transition-colors cursor-pointer"
                >
                  ▸ "Review Chapter 1: Introduction" (Too vague)
                </button>
                <button
                  onClick={() => handleAdvanceRound('ecology')}
                  className="w-full p-2.5 rounded-lg bg-teal-950/80 hover:bg-teal-900 border border-teal-500/60 text-xs text-teal-200 text-left font-semibold transition-colors cursor-pointer"
                >
                  ▸ "Drill down into Chapter 4: Ecological Equilibrium"
                </button>
              </>
            )}

            {round === 2 && (
              <>
                <button
                  onClick={() => handleAdvanceRound('irrelevant')}
                  className="w-full p-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 text-left border border-zinc-700 transition-colors cursor-pointer"
                >
                  ▸ "Review budget charts in Appendix B"
                </button>
                <button
                  onClick={() => handleAdvanceRound('oxygen_lemma')}
                  className="w-full p-2.5 rounded-lg bg-teal-950/80 hover:bg-teal-900 border border-teal-500/60 text-xs text-teal-200 text-left font-semibold transition-colors cursor-pointer"
                >
                  ▸ "Cross-examine Subsection 9 & Equation 4,119"
                </button>
              </>
            )}

            {round === 3 && (
              <>
                <button
                  onClick={() => handleAdvanceRound('trust')}
                  className="w-full p-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 text-left border border-zinc-700 transition-colors cursor-pointer"
                >
                  ▸ "Trust Voice Alpha's high-level summary"
                </button>
                <button
                  onClick={() => handleAdvanceRound('expose_cheat')}
                  className="w-full p-2.5 rounded-lg bg-teal-950/80 hover:bg-teal-900 border border-teal-500/60 text-xs text-teal-200 text-left font-semibold transition-colors cursor-pointer"
                >
                  ▸ "Force Voice Alpha to reveal constraints on O2"
                </button>
              </>
            )}

            {round === 4 && (
              <button
                onClick={handleDeliverVerdict}
                className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs sm:text-sm transition-all shadow-lg shadow-teal-950 flex items-center justify-center gap-2 cursor-pointer animate-pulse"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Deliver Verdict & Unlock Secret Sanctuary</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
