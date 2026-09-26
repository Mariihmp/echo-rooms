import React, { useState } from 'react';
import { PuzzleHint } from '../types/game';
import { sound } from '../services/sound';
import { Eye, HelpCircle, X, ChevronRight, Sparkles } from 'lucide-react';

interface HintModalProps {
  isOpen: boolean;
  onClose: () => void;
  episodeTitle: string;
  hints: PuzzleHint[];
}

export const HintModal: React.FC<HintModalProps> = ({
  isOpen,
  onClose,
  episodeTitle,
  hints,
}) => {
  const [unlockedLevel, setUnlockedLevel] = useState<number>(1);

  if (!isOpen) return null;

  const handleRevealNext = () => {
    sound.playGearBoyBeep(640, 0.1);
    setUnlockedLevel((prev) => Math.min(prev + 1, hints.length));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-[#0f141c] border border-zinc-700/80 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-950/60 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-title text-zinc-100 text-base font-bold">
                Align-Boy Frequency Whispers
              </h2>
              <p className="text-xs text-zinc-400">
                Diagnostic assistance for {episodeTitle}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-md hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hints Container */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-teal-400 shrink-0" />
            <span>
              Hints are structured in 3 progressive tiers: from subtle environmental clues to full conceptual solutions.
            </span>
          </div>

          {hints.map((hint, idx) => {
            const isUnlocked = hint.level <= unlockedLevel;
            return (
              <div
                key={idx}
                className={`p-4 rounded-lg border transition-all ${
                  isUnlocked
                    ? 'bg-zinc-900/90 border-zinc-700/80'
                    : 'bg-zinc-950/40 border-zinc-800/40 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-800 text-teal-400 border border-zinc-700">
                      Tier {hint.level}
                    </span>
                    <span className="text-xs font-semibold text-zinc-200">
                      {hint.title}
                    </span>
                  </div>
                  {isUnlocked ? (
                    <span className="text-[11px] text-teal-400/80 font-mono">
                      Decrypted
                    </span>
                  ) : (
                    <span className="text-[11px] text-zinc-500 font-mono">
                      Encrypted
                    </span>
                  )}
                </div>

                {isUnlocked ? (
                  <p className="text-sm text-zinc-300 leading-relaxed font-sans mt-1">
                    {hint.text}
                  </p>
                ) : (
                  <div className="py-2 text-xs font-mono text-zinc-600 tracking-widest select-none">
                    ▓▓▓▓ ▓▓▓▓▓▓▓▓▓ ▓▓▓▓▓▓ ▓▓▓▓ ▓▓▓▓▓▓▓▓▓▓ ▓▓▓▓▓
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-zinc-900/80 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-xs text-zinc-500 font-mono">
            Revealed: {unlockedLevel} / {hints.length} tiers
          </span>

          <div className="flex items-center gap-2">
            {unlockedLevel < hints.length ? (
              <button
                onClick={handleRevealNext}
                className="px-3.5 py-1.5 text-xs rounded-md bg-teal-600 hover:bg-teal-500 text-white font-medium transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Reveal Next Tier</span>
                <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </button>
            ) : (
              <span className="text-xs text-teal-400 font-mono">
                All hints decrypted
              </span>
            )}
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="px-3.5 py-1.5 text-xs rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
