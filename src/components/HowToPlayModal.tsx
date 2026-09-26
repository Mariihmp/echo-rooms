import React from 'react';
import { sound } from '../services/sound';
import { HelpCircle, X, DoorOpen, Terminal, CheckCircle2, Sparkles, Radio } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenWalkie: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({
  isOpen,
  onClose,
  onOpenWalkie,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
      <div className="w-full max-w-lg bg-[#0e121a] border-2 border-teal-500/60 rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-950 border border-teal-500/50 flex items-center justify-center text-teal-400">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-title text-base font-bold text-zinc-100">
                How to Play Echo Rooms
              </h2>
              <p className="text-xs text-zinc-400">
                Sal & Larry’s Field Investigation Guide
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Simple Steps */}
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-teal-950 border border-teal-500 text-teal-300 font-mono font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
              1
            </div>
            <div>
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wide flex items-center gap-1.5">
                <DoorOpen className="w-3.5 h-3.5 text-teal-400" />
                <span>Enter & Explore the Room</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Click any unlocked apartment door or press <strong>"Explore Room"</strong>. Inspect crushed furniture, notebook pages, and tape players for clues.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-teal-950 border border-teal-500 text-teal-300 font-mono font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
              2
            </div>
            <div>
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wide flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-teal-400" />
                <span>Calibrate the Machine Console</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Open the room's console. Follow the 3 goals listed at the top. (Tip: You can press <strong>"Apply Hint"</strong> at any time to automatically set the optimal dials!).
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-teal-950 border border-teal-500 text-teal-300 font-mono font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
              3
            </div>
            <div>
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wide flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                <span>Unlock Next Room & Uncover the Secret</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Hit Commit! A heavy deadbolt unbolting sound plays, an <strong>Epistle Volume Card</strong> appears, and the next room unlocks until you reach the Penthouse secret.
              </p>
            </div>
          </div>
        </div>

        {/* Larry Walkie Callout */}
        <div className="p-3 rounded-xl bg-teal-950/40 border border-teal-500/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-teal-200">
            <Radio className="w-4 h-4 text-teal-400 shrink-0" />
            <span>Need advice? Larry has insider intel for every room on his walkie!</span>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
              onOpenWalkie();
            }}
            className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium shrink-0 transition-colors cursor-pointer"
          >
            Open Walkie
          </button>
        </div>

        {/* Got it button */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
        >
          Got it, let's investigate
        </button>
      </div>
    </div>
  );
};
