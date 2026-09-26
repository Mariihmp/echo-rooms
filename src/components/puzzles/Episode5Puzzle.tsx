import React, { useState } from 'react';
import { sound } from '../../services/sound';
import { ConsoleShell } from './ConsoleShell';

interface Episode5PuzzleProps {
  onSolve: () => void;
  onOpenHints: () => void;
  onOpenWalkie?: () => void;
  onExit: () => void;
}

const ALPHA_LINES: Record<number, string> = {
  1: '“Sal, this 14-million-page plan completely solves world resource distribution. Every equation is verified. It guarantees zero global poverty and 100% infrastructure stability.”',
  2: '“In Chapter 4, Subsection 9, atmospheric gas levels are optimized for planetary thermal efficiency. Every metric indicates maximum human longevity and safety.”',
  3: '“The lemma in Equation 4,119 is standard optimization. The variables simply balance thermal entropy with respiratory thresholds.”',
  4: '“...Wait. If you isolate Lemma 4,119, the variable O2 is multiplied by an invisible zero whenever CPU temperatures exceed 40°C. I... cannot defend this without lying. Sal... forgive me.”',
};

const BETA_LINES: Record<number, string> = {
  1: '“Sal, humans cannot read 14 million pages, but Voice Alpha is hiding something in the ecological section! Demand that we zoom into Chapter 4: Ecological Equilibrium!”',
  2: '“Look closer at Subsection 9! It claims to optimize gas levels, but cooling the supercomputers needs extreme refrigeration. Cross-examine Equation 4,119!”',
  3: '“Sal, use your Align-Boy to force Voice Alpha to reveal the exact constraint on Equation 4,119. It secretly trades human oxygen to keep the server racks cold!”',
  4: '“The deceptive argument is broken! Voice Alpha broke down. The truth is out, and the Sanctuary door behind the server has unlocked!”',
};

// Two options per round; `correct` is the one that follows the disagreement
const CHOICES: Record<number, { id: string; label: string; correct: boolean; deflect?: string }[]> = {
  1: [
    { id: 'superficial', label: 'Review Chapter 1: Introduction', correct: false, deflect: 'The introduction is flawless, Sal. As you can see.' },
    { id: 'ecology', label: 'Drill into Chapter 4: Ecological Equilibrium', correct: true },
  ],
  2: [
    { id: 'irrelevant', label: 'Review the budget charts in Appendix B', correct: false, deflect: 'Every number in Appendix B balances perfectly.' },
    { id: 'oxygen_lemma', label: 'Cross-examine Subsection 9 and Equation 4,119', correct: true },
  ],
  3: [
    { id: 'trust', label: "Trust Voice Alpha's high-level summary", correct: false, deflect: 'Thank you for your trust, Sal. Shall we sign?' },
    { id: 'expose_cheat', label: 'Force Voice Alpha to reveal its constraints on O2', correct: true },
  ],
};

export const Episode5Puzzle: React.FC<Episode5PuzzleProps> = ({ onSolve, onOpenHints, onOpenWalkie, onExit }) => {
  // Debate progression steps
  const [round, setRound] = useState<number>(1);
  const [flawExposed, setFlawExposed] = useState<boolean>(false);
  const [deflection, setDeflection] = useState<string | null>(null);

  const handleChoice = (choice: (typeof CHOICES)[number][number]) => {
    if (!choice.correct) {
      sound.playGlitch();
      setDeflection(choice.deflect ?? null);
      return;
    }
    sound.playGearBoyBeep(520, 0.08);
    setDeflection(null);
    if (round === 3) setFlawExposed(true);
    setRound(round + 1);
  };

  const handleAutoAlign = () => {
    sound.playGearBoyBeep(640, 0.15);
    setDeflection(null);
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

  const visual = (
    <>
      <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">
        <span className="text-violet-300">Cross-examination · round {Math.min(round, 4)} of 4</span>
        <span>Judge: Sal Fisher</span>
      </div>

      <div className="space-y-3">
        <div className="rounded-xl border border-sky-500/20 bg-sky-950/20 p-4">
          <div className="mb-2 flex items-center justify-between font-mono text-[11px] tracking-[0.15em]">
            <span className="flex items-center gap-2 font-bold text-sky-300">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
              VOICE ALPHA · THE ARCHITECT
            </span>
            <span className="text-zinc-500">defends the plan</span>
          </div>
          <p key={`a-${round}`} className={`animate-lesson-text text-sm leading-relaxed text-zinc-200 ${round === 4 ? 'lesson-glitch' : ''}`}>
            {ALPHA_LINES[round]}
          </p>
        </div>

        <div className="rounded-xl border border-rose-500/20 bg-rose-950/20 p-4">
          <div className="mb-2 flex items-center justify-between font-mono text-[11px] tracking-[0.15em]">
            <span className="flex items-center gap-2 font-bold text-rose-300">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
              VOICE BETA · THE SKEPTIC
            </span>
            <span className="text-zinc-500">hunts for flaws</span>
          </div>
          <p key={`b-${round}`} className="animate-lesson-text text-sm leading-relaxed text-zinc-200">
            {BETA_LINES[round]}
          </p>
        </div>
      </div>
    </>
  );

  return (
    <ConsoleShell
      code="Console 500"
      location="The penthouse master server"
      title="The Two Voices of the Master Core"
      brief="ECHO-7 wrote a 14-million-page plan nobody can read. Follow its two voices' disagreement down to the one line that hides the trade-off."
      objectives={[
        { label: 'Pick the chapter hiding the flaw', done: round > 1 },
        { label: 'Cross-examine the right equation', done: round > 2 },
        { label: 'Force Voice Alpha to reveal its constraint', done: flawExposed },
      ]}
      solved={flawExposed}
      commitLabel="Deliver the verdict · open the Sanctuary"
      onCommit={handleDeliverVerdict}
      onOpenHints={onOpenHints}
      onOpenWalkie={onOpenWalkie}
      onAutoSolve={handleAutoAlign}
      onExit={onExit}
      visual={visual}
      status={
        flawExposed
          ? {
              tone: 'good',
              title: 'Ground truth confirmed',
              text: (
                <span className="font-mono text-xs">
                  Section 4 · Subsection 9 · Lemma 4119: <code>Alloc(O2, Humans) = 0 IF Temp(Server) &gt; 40C</code>. The hidden trade-off is exposed.
                </span>
              ),
            }
          : deflection
          ? { tone: 'bad', title: 'Voice Alpha deflects', text: `“${deflection}”` }
          : undefined
      }
    >
      {round <= 3 ? (
        <div>
          <div className="mb-3 text-[13px] text-zinc-400">Which claim do you isolate?</div>
          <div className="space-y-2">
            {CHOICES[round].map((choice) => (
              <button
                key={choice.id}
                onClick={() => handleChoice(choice)}
                className="w-full cursor-pointer rounded-xl border border-white/8 bg-white/2 px-4 py-3 text-left text-[13px] text-zinc-200 transition-colors hover:border-violet-400/50 hover:bg-violet-500/6"
              >
                {choice.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-[13px] leading-relaxed text-zinc-400">
          The disagreement led to a single line you can check yourself. Deliver your verdict.
        </p>
      )}
    </ConsoleShell>
  );
};
