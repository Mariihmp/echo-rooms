import React, { useState } from 'react';
import { Episode } from '../types/game';
import { sound } from '../services/sound';
import { Lock, CheckCircle2, DoorOpen, Radio, Sparkles, Terminal, ArrowLeft, ArrowRight, Search, HelpCircle } from 'lucide-react';

interface HallwayViewProps {
  episodes: Episode[];
  activeEpisodeId: number;
  onSelectEpisode: (id: number) => void;
  onDirectToPuzzle?: (id: number) => void;
  onOpenAlignBoy: () => void;
  onOpenCasebook: () => void;
  onTalkToLarry: () => void;
  onOpenHowToPlay?: () => void;
}

export const HallwayView: React.FC<HallwayViewProps> = ({
  episodes,
  activeEpisodeId,
  onSelectEpisode,
  onDirectToPuzzle,
  onOpenAlignBoy,
  onOpenCasebook,
  onTalkToLarry,
  onOpenHowToPlay,
}) => {
  // Sal position index in the hallway (0 to 4)
  const [salPosition, setSalPosition] = useState<number>(() => {
    const idx = episodes.findIndex((e) => e.id === activeEpisodeId);
    return idx >= 0 ? idx : 0;
  });

  const moveSal = (direction: 'left' | 'right') => {
    sound.initCtx();
    sound.playClick();
    if (direction === 'left' && salPosition > 0) {
      setSalPosition((prev) => prev - 1);
    } else if (direction === 'right' && salPosition < episodes.length - 1) {
      setSalPosition((prev) => prev + 1);
    }
  };

  const handleDoorClick = (ep: Episode, index: number) => {
    sound.initCtx();
    setSalPosition(index);
    if (ep.status === 'locked') {
      sound.playGlitch();
      return;
    }
    sound.playDoorOpen();
    onSelectEpisode(ep.id);
  };

  const currentEp = episodes[salPosition] || episodes[0];

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border-2 border-zinc-800 bg-[#07090e] shadow-2xl flex flex-col pointer-events-auto">
      {/* Visual Hallway Corridor Scene */}
      <div className="relative w-full h-[460px] sm:h-[500px] overflow-hidden select-none">
        {/* Atmospheric Hallway Artwork Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 filter brightness-75 contrast-125"
          style={{
            backgroundImage: `url('/images/sally_face_hallway_1790408526709.jpg')`,
            backgroundPosition: `${50 + (salPosition - 2) * 14}% center`,
          }}
        />

        {/* Ambient Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#090c12] via-transparent to-[#05070a]/90 pointer-events-none" />

        {/* Flickering hallway lamp effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-flicker" />

        {/* Top Corridor Status Bar - Clean and Atmospheric */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-30">
          <div className="px-3.5 py-1.5 rounded-lg bg-black/85 backdrop-blur-md border border-zinc-700/80 text-xs font-mono flex items-center gap-2 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-zinc-200 tracking-wide">ADDISON COMPLEX // RESIDENTIAL CORRIDOR</span>
          </div>

          <div className="text-xs font-mono text-zinc-400 bg-black/75 px-3 py-1.5 rounded-lg border border-zinc-800">
            Click door or use arrows to investigate
          </div>
        </div>

        {/* Floor Horizon Line for 2D Walk */}
        <div className="absolute bottom-16 inset-x-0 h-1 bg-zinc-900/80 border-b border-zinc-800 pointer-events-none" />

        {/* Interactive Doors Row (Placed at z-10) */}
        <div className="absolute inset-x-0 bottom-16 z-10 grid grid-cols-5 px-3 sm:px-10 pointer-events-auto">
          {episodes.map((ep, idx) => {
            const isNear = salPosition === idx;
            const isLocked = ep.status === 'locked';
            const isCompleted = ep.status === 'completed';

            return (
              <div key={ep.id} className="flex flex-col items-center justify-end relative">
                {/* Door Marker Badge */}
                <div
                  className={`text-[11px] font-mono px-2 py-0.5 rounded mb-2 transition-all shadow-md z-15 ${
                    isCompleted
                      ? 'bg-teal-950 border border-teal-500/70 text-teal-300'
                      : isLocked
                      ? 'bg-zinc-900/90 border border-zinc-800 text-zinc-500'
                      : 'bg-amber-950/90 border border-amber-500/70 text-amber-200 animate-pulse'
                  }`}
                >
                  {ep.roomNumber}
                </div>

                {/* The Door Graphic & Click Target */}
                <button
                  onClick={() => handleDoorClick(ep, idx)}
                  className={`w-16 sm:w-24 h-48 sm:h-56 rounded-t-lg border-2 transition-all relative flex flex-col items-center justify-between p-2 shadow-2xl cursor-pointer ${
                    isNear
                      ? 'ring-2 ring-teal-400 ring-offset-2 ring-offset-black scale-102'
                      : 'hover:scale-102'
                  } ${
                    isCompleted
                      ? 'border-teal-500/60 bg-gradient-to-b from-teal-950/40 to-black/90'
                      : isLocked
                      ? 'border-zinc-800 bg-zinc-950/80 opacity-60'
                      : 'border-zinc-500 bg-gradient-to-b from-zinc-800/80 to-black/95'
                  }`}
                >
                  {/* Brass Door Number Plate */}
                  <div className="w-8 h-4 rounded bg-zinc-800 border border-zinc-600 text-[9px] font-mono text-zinc-300 flex items-center justify-center font-bold">
                    {ep.id === 5 ? 'PH' : ep.roomNumber.replace('Room ', '')}
                  </div>

                  {/* Doorknob & Lock Indicator at Waist Height */}
                  <div className="w-full flex items-center justify-between px-1 my-auto">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80 shadow-md border border-amber-600" />
                    <div>
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-teal-400" />
                      ) : isLocked ? (
                        <Lock className="w-4 h-4 text-zinc-500" />
                      ) : (
                        <DoorOpen className="w-4 h-4 text-amber-400 animate-bounce" />
                      )}
                    </div>
                  </div>

                  {/* Floor Glow when near */}
                  {isNear && (
                    <div className="absolute -bottom-2 inset-x-0 h-2 bg-teal-400/50 blur-sm rounded-full" />
                  )}

                  {/* Sal Walking Avatar - Positioned at the Down Center of the Room Card */}
                  {isNear && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.95)] animate-in fade-in zoom-in-95 duration-200">
                      {/* Clean Circular Mask Portrait Token */}
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-teal-400 overflow-hidden shadow-2xl bg-black relative ring-2 ring-black/90 transition-transform">
                        <img 
                          src="/images/masked_investigator_1790408543574.jpg" 
                          alt="Sal Fisher" 
                          className="w-full h-full object-cover" 
                        />
                        <div className="absolute inset-0 bg-teal-500/10 pointer-events-none mix-blend-overlay" />
                      </div>

                      {/* Subtle Name Tag */}
                      <div className="mt-0.5 px-2 py-0.5 rounded-full bg-black/95 border border-teal-500/70 text-[9px] font-mono text-teal-300 font-bold shadow-md tracking-wider">
                        SAL
                      </div>
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Left/Right Corridor Navigation Controls */}
        <div className="absolute inset-y-0 left-3 flex items-center z-35">
          <button
            onClick={() => moveSal('left')}
            disabled={salPosition <= 0}
            className={`p-3 rounded-full bg-black/85 border border-zinc-700 text-zinc-200 hover:text-white hover:bg-black transition-all shadow-xl cursor-pointer ${
              salPosition <= 0 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110 active:scale-95'
            }`}
            title="Walk Left"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
        <div className="absolute inset-y-0 right-3 flex items-center z-35">
          <button
            onClick={() => moveSal('right')}
            disabled={salPosition >= episodes.length - 1}
            className={`p-3 rounded-full bg-black/85 border border-zinc-700 text-zinc-200 hover:text-white hover:bg-black transition-all shadow-xl cursor-pointer ${
              salPosition >= episodes.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110 active:scale-95'
            }`}
            title="Walk Right"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Selected Door Status & Investigation Panel */}
      <div className="p-5 bg-[#0a0d14] border-t border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-20">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-teal-400">
            <span>CURRENT DOOR: {currentEp.roomNumber}</span>
            <span>·</span>
            <span>{currentEp.subtitle}</span>
          </div>
          <h3 className="font-title text-lg font-bold text-zinc-100">
            {currentEp.title}
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
            {currentEp.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {currentEp.status === 'locked' ? (
            <div className="px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 text-xs font-mono flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span>Door Bolted (Solve Previous Room First)</span>
            </div>
          ) : (
            <>
              {/* Option A: Explore Room */}
              <button
                onClick={() => handleDoorClick(currentEp, salPosition)}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs sm:text-sm transition-all shadow-lg flex items-center gap-2 cursor-pointer hover:scale-102 active:scale-98"
              >
                <Search className="w-4 h-4" />
                <span>
                  {currentEp.status === 'completed' ? `Re-enter ${currentEp.roomNumber}` : `Enter & Explore ${currentEp.roomNumber}`}
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
