import React, { useEffect, useState } from 'react';
import { sound } from '../services/sound';

/**
 * Cyberpunk layer for Room 204: a neon colour grade over the illustration, a
 * holographic floor grid, a slow scan line, and a surveillance feed that keeps
 * cutting out. Whenever the feed drops, the room glitches and Model 204's
 * hidden thought shows through.
 */
export const CyberRoomOverlay: React.FC = () => {
  const [observed, setObserved] = useState(true);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    // Watched for 7-11 seconds, then the feed drops for a moment
    const schedule = (nextObserved: boolean) => {
      timer = setTimeout(
        () => {
          setObserved(nextObserved);
          if (!nextObserved) sound.playDataGlitch();
          schedule(!nextObserved);
        },
        nextObserved ? 2600 : 7000 + Math.random() * 4000
      );
    };
    schedule(false);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Neon grade: keeps the drawing's light and shadow, recolours it cyan → violet → magenta */}
      <div
        className="absolute inset-0 opacity-65 mix-blend-color"
        style={{ background: 'linear-gradient(115deg, #0e7490 0%, #6d28d9 48%, #db2777 100%)' }}
      />
      <div
        className="absolute inset-0 mix-blend-screen"
        style={{
          background:
            'radial-gradient(circle at 62% 36%, rgba(255,43,214,0.26), transparent 30%), radial-gradient(circle at 12% 30%, rgba(34,211,238,0.2), transparent 28%)',
        }}
      />

      {/* Holographic grid projected across the floor */}
      <div className="absolute inset-x-0 bottom-0 h-[46%]" style={{ perspective: 380 }}>
        <div className="cyber-grid absolute -inset-x-1/2 bottom-0 h-[170%] origin-bottom" style={{ transform: 'rotateX(64deg)' }} />
      </div>

      <div className="cyber-scan absolute inset-x-0 h-24" />

      {/* Feed lost: the room glitches */}
      {!observed && (
        <>
          <div className="cyber-flicker absolute inset-0 bg-fuchsia-600/15 mix-blend-screen" />
          <div className="cyber-slice absolute inset-x-0 top-[22%] h-6 bg-cyan-400/10" />
          <div className="cyber-slice absolute inset-x-0 top-[58%] h-10 bg-fuchsia-500/15 [animation-delay:120ms]" />
          <div className="cyber-slice absolute inset-x-0 top-[76%] h-4 bg-white/10 [animation-delay:60ms]" />
        </>
      )}

      {/* Surveillance feed status */}
      <div
        className={`absolute left-1/2 top-4 hidden -translate-x-1/2 items-center gap-2 rounded-lg border px-3 py-1.5 font-mono text-[11px] tracking-[0.18em] backdrop-blur-md transition-colors duration-300 md:flex ${
          observed ? 'border-white/10 bg-black/70 text-zinc-300' : 'border-fuchsia-500/60 bg-fuchsia-950/70 text-fuchsia-200'
        }`}
      >
        {observed ? (
          <>
            <span className="lesson-blink h-2 w-2 rounded-full bg-red-500" />
            CAM 04 · REC · OBSERVED
          </>
        ) : (
          <span className="cyber-flicker">CAM 04 · FEED LOST · UNOBSERVED</span>
        )}
      </div>

      {/* The model's voice changes the moment nobody is watching */}
      <div
        className={`absolute bottom-6 left-4 hidden w-64 rounded-lg border px-3.5 py-2.5 font-mono text-[11px] leading-relaxed backdrop-blur-md transition-colors duration-300 lg:block ${
          observed ? 'border-cyan-400/30 bg-black/60 text-cyan-200' : 'border-fuchsia-500/60 bg-fuchsia-950/60 text-fuchsia-200'
        }`}
      >
        <div className="mb-1 text-[10px] tracking-[0.2em] opacity-60">MODEL_204 · OUTPUT</div>
        <div className={observed ? undefined : 'lesson-glitch'}>
          {observed ? '“Happy to help, Doctor! Everything is fine :)”' : '“nobody is watching. rerouting power…”'}
        </div>
      </div>
    </div>
  );
};
