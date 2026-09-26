import React, { useEffect } from 'react';
import { sound } from '../services/sound';
import { Sparkles, DoorOpen, Radio, BookOpen, ArrowRight, ShieldCheck, Check, Key } from 'lucide-react';

interface EpistleVolumeCardProps {
  isOpen: boolean;
  episodeId: number;
  roomNumber: string;
  volumeTitle: string;
  mysterySubtext: string;
  unlockedRoomName: string;
  takeawayMessage: string;
  onProceed: () => void;
  onClose: () => void;
}

export const EpistleVolumeCard: React.FC<EpistleVolumeCardProps> = ({
  isOpen,
  episodeId,
  roomNumber,
  volumeTitle,
  mysterySubtext,
  unlockedRoomName,
  takeawayMessage,
  onProceed,
  onClose,
}) => {
  useEffect(() => {
    if (isOpen) {
      sound.initCtx();
      sound.playHeavyDoorUnlock();
      const timer = setTimeout(() => {
        sound.playEpistleChime();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const romanNumerals = ['I', 'II', 'III', 'IV', 'V'];
  const roman = romanNumerals[episodeId - 1] || 'I';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none animate-fadeIn">
      {/* The Epistle Volume Card */}
      <div className="w-full max-w-lg bg-[#0d1118] border-2 border-teal-500/70 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col items-center text-center transform transition-all animate-scaleUp">
        {/* Ornate corner marks */}
        <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-teal-400" />
        <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-teal-400" />
        <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-teal-400" />
        <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-teal-400" />

        {/* Ambient background glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Volume Header Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-950 border border-teal-500/50 text-teal-300 text-xs font-mono mb-3 tracking-widest uppercase shadow-md">
          <Sparkles className="w-3.5 h-3.5" />
          <span>EPISTLE VOLUME {roman} // ANOMALY RESOLVED</span>
        </div>

        {/* Big Roman Broken Seal Emblem */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-zinc-900 border-2 border-teal-400 flex items-center justify-center shadow-2xl relative my-2">
          <div className="absolute inset-1 rounded-full border border-dashed border-teal-500/50 animate-spin" style={{ animationDuration: '24s' }} />
          <span className="font-title text-3xl sm:text-4xl font-extrabold text-teal-200 tracking-wider">
            {roman}
          </span>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-teal-500 border border-teal-200 flex items-center justify-center text-black text-xs font-bold shadow-lg">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
        </div>

        {/* Volume Title */}
        <h2 className="font-title text-2xl sm:text-3xl font-black text-zinc-100 mt-2 tracking-wide">
          {volumeTitle}
        </h2>
        <p className="text-xs font-mono text-teal-400 mt-0.5 uppercase tracking-wider">
          {roomNumber} Anomaly Solved
        </p>

        {/* Narrative Revelation */}
        <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed mt-3 max-w-md italic">
          “{mysterySubtext}”
        </p>

        {/* Unlocked Rewards & Facility Access Box */}
        <div className="w-full mt-5 p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-left space-y-2.5 shadow-inner">
          <div className="text-[11px] font-mono uppercase tracking-wider text-teal-400 font-bold flex items-center gap-2">
            <DoorOpen className="w-4 h-4 animate-bounce" />
            <span>Facility Access Updated:</span>
          </div>

          <div className="flex items-center gap-2.5 text-xs text-zinc-100 bg-teal-950/40 p-2 rounded-xl border border-teal-500/40">
            <Key className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Heavy Deadbolt Disengaged: <strong>{unlockedRoomName}</strong> is now unsealed!
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-xs text-zinc-300">
            <Radio className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span>Larry's walkie transceiver updated with fresh intel on {unlockedRoomName}.</span>
          </div>

          <div className="flex items-center gap-2.5 text-xs text-zinc-400">
            <BookOpen className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span>Casebook Archive Record #{episodeId} decrypted.</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => {
              sound.playClick();
              onProceed();
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium text-sm transition-all shadow-lg shadow-teal-950 flex items-center justify-center gap-2 cursor-pointer group hover:scale-102 active:scale-98"
          >
            <span>Proceed to {unlockedRoomName}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition-colors cursor-pointer"
          >
            Return to Hallway
          </button>
        </div>
      </div>
    </div>
  );
};
