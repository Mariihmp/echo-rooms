import React from 'react';
import { sound } from '../services/sound';
import { Volume2, VolumeX, Tv, Sparkles, BookOpen, Radio, RotateCcw, HelpCircle } from 'lucide-react';

interface HeaderNavProps {
  isMuted: boolean;
  onToggleMute: () => void;
  crtEnabled: boolean;
  onToggleCrt: () => void;
  onOpenAlignBoy: () => void;
  onOpenCasebook: () => void;
  onTalkToLarry: () => void;
  onOpenHowToPlay: () => void;
  onResetProgress: () => void;
  activeEpisodeTitle?: string;
  inRoom: boolean;
  onReturnToHallway: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  isMuted,
  onToggleMute,
  crtEnabled,
  onToggleCrt,
  onOpenAlignBoy,
  onOpenCasebook,
  onTalkToLarry,
  onOpenHowToPlay,
  onResetProgress,
  activeEpisodeTitle,
  inRoom,
  onReturnToHallway,
}) => {
  return (
    <header className="w-full bg-[#0a0d14]/90 backdrop-blur-md border-b border-zinc-800/80 sticky top-0 z-40 px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Game Title & Branding */}
        <div className="flex items-center gap-3">
          {inRoom && (
            <button
              onClick={() => {
                sound.playClick();
                onReturnToHallway();
              }}
              className="px-2.5 py-1 text-xs font-mono rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors cursor-pointer mr-1"
            >
              ◀ Exit to Hallway
            </button>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-title text-base sm:text-lg font-bold text-zinc-100 tracking-wide">
                ECHO ROOMS
              </h1>
              <span className="text-zinc-600 font-mono text-xs hidden sm:inline">|</span>
              <span className="text-xs font-mono text-teal-400 hidden sm:inline">
                The Whispering Weights
              </span>
            </div>
            {activeEpisodeTitle && (
              <p className="text-[11px] text-zinc-500 font-mono truncate max-w-xs sm:max-w-md">
                Location: {activeEpisodeTitle}
              </p>
            )}
          </div>
        </div>

        {/* Global Toolbar Action Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* How to Play Guide Button */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenHowToPlay();
            }}
            title="How to Play"
            className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-amber-500/40 text-amber-300 hover:text-amber-200 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span className="hidden lg:inline">How to Play</span>
          </button>

          {/* Larry Walkie Button */}
          <button
            onClick={() => {
              sound.playWalkieSquelch();
              onTalkToLarry();
            }}
            title="Larry's Walkie-Talkie Transceiver"
            className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Radio className="w-4 h-4 text-teal-400" />
            <span className="hidden md:inline">Larry's Walkie</span>
          </button>

          {/* Align-Boy Gadget Button */}
          <button
            onClick={() => {
              sound.playGearBoyBeep(640, 0.08);
              onOpenAlignBoy();
            }}
            title="Inspect Align-Boy Handheld"
            className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-teal-950/80 hover:bg-teal-900 border border-teal-500/60 text-teal-200 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span className="hidden md:inline">Align-Boy</span>
          </button>

          {/* Casebook Dossier Button */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenCasebook();
            }}
            title="Dr. Morrison's Casebook"
            className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-teal-400" />
            <span className="hidden md:inline">Casebook</span>
          </button>

          <div className="w-px h-5 bg-zinc-800 mx-1 hidden sm:block" />

          {/* CRT scanlines toggle */}
          <button
            onClick={() => {
              sound.playClick();
              onToggleCrt();
            }}
            title={crtEnabled ? 'Disable CRT Scanlines' : 'Enable CRT Scanlines'}
            className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
              crtEnabled
                ? 'bg-teal-950/70 border-teal-500/50 text-teal-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Tv className="w-4 h-4" />
          </button>

          {/* Audio sound mute toggle */}
          <button
            onClick={() => {
              sound.playClick();
              onToggleMute();
            }}
            title={isMuted ? 'Unmute Atmosphere Sound' : 'Mute Atmosphere Sound'}
            className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
              !isMuted
                ? 'bg-zinc-900 border-zinc-700 text-teal-400'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Reset Progress */}
          <button
            onClick={() => {
              if (window.confirm('Reset game investigation progress?')) {
                onResetProgress();
              }
            }}
            title="Reset Game Progress"
            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-500 hover:text-zinc-300 text-xs transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
