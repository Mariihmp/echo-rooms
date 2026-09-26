import React, { useEffect, useState } from 'react';
import { sound } from '../services/sound';
import { X } from 'lucide-react';

interface DialogueModalProps {
  isOpen: boolean;
  speaker: string;
  speakerTitle: string;
  text: string;
  portraitSrc?: string;
  choices?: { text: string; action: () => void }[];
  onClose: () => void;
}

export const DialogueModal: React.FC<DialogueModalProps> = ({
  isOpen,
  speaker,
  speakerTitle,
  text,
  portraitSrc,
  choices,
  onClose,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setDisplayedText('');
    setIsTyping(true);

    let idx = 0;
    const interval = setInterval(() => {
      if (idx < text.length) {
        setDisplayedText(text.slice(0, idx + 1));
        if (idx % 3 === 0) {
          sound.playGearBoyBeep(350 + (idx % 5) * 40, 0.03);
        }
        idx++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 22);

    return () => clearInterval(interval);
  }, [isOpen, text]);

  if (!isOpen) return null;

  const handleSkipOrNext = () => {
    if (isTyping) {
      setDisplayedText(text);
      setIsTyping(false);
      sound.playClick();
    } else if (!choices || choices.length === 0) {
      sound.playClick();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-8 px-4 bg-black/60 backdrop-blur-xs pointer-events-auto">
      <div 
        onClick={handleSkipOrNext}
        className="w-full max-w-3xl bg-[#0f141c]/95 border-2 border-zinc-700/80 rounded-xl p-5 shadow-2xl relative cursor-pointer selection:bg-teal-500/20"
      >
        {/* Retro corner marks */}
        <div className="absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 border-teal-500/60" />
        <div className="absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2 border-teal-500/60" />
        <div className="absolute bottom-1 left-1 w-2 h-2 border-b-2 border-l-2 border-teal-500/60" />
        <div className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 border-teal-500/60" />

        {/* Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            sound.playClick();
            onClose();
          }}
          className="absolute top-3 right-3 p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors z-20 cursor-pointer"
          title="Dismiss (ESC / Close)"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          {/* Character portrait */}
          <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-zinc-900 border border-zinc-700 overflow-hidden relative shadow-inner">
            {portraitSrc ? (
              <img src={portraitSrc} alt={speaker} className="w-full h-full object-cover grayscale contrast-125" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-teal-400 font-mono text-xl font-bold">
                {speaker.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 bg-teal-500/10 pointer-events-none mix-blend-overlay" />
          </div>

          {/* Dialogue text */}
          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-title text-teal-300 font-bold tracking-wide text-base">
                {speaker}
              </span>
              <span className="text-xs text-zinc-500 font-mono">
                {speakerTitle}
              </span>
            </div>

            <p className="text-zinc-200 text-sm sm:text-base leading-relaxed font-sans min-h-[4rem]">
              {displayedText}
              {isTyping && <span className="inline-block w-2 h-4 bg-teal-400 ml-1 animate-pulse align-middle" />}
            </p>

            {/* Interactive choices if any */}
            {!isTyping && choices && choices.length > 0 && (
              <div className="mt-4 pt-3 border-t border-zinc-800 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                {choices.map((choice, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      sound.playClick();
                      choice.action();
                    }}
                    className="px-3.5 py-1.5 text-xs sm:text-sm rounded-md bg-zinc-800/90 hover:bg-teal-950 hover:border-teal-500 border border-zinc-700 text-zinc-200 hover:text-teal-200 transition-colors flex items-center gap-2 group text-left cursor-pointer"
                  >
                    <span className="text-teal-400 font-mono text-xs">▸</span>
                    <span>{choice.text}</span>
                  </button>
                ))}
              </div>
            )}

            {!isTyping && (!choices || choices.length === 0) && (
              <div className="mt-2 text-right">
                <span className="text-[11px] text-zinc-500 font-mono animate-pulse">
                  Click to continue ▼
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
