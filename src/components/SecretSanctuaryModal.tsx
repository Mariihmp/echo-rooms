import React from 'react';
import { sound } from '../services/sound';
import { Sun, Heart, Sparkles, X, Key, Music, CheckCircle2 } from 'lucide-react';

interface SecretSanctuaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecretSanctuaryModal: React.FC<SecretSanctuaryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-[#0c1018] border-2 border-amber-500/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative">
        {/* Golden Dawn Glow header */}
        <div className="p-6 bg-gradient-to-r from-amber-950/60 via-zinc-900 to-amber-950/60 border-b border-amber-500/40 relative">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white rounded-md hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-300 shadow-lg shadow-amber-500/20">
              <Sun className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold">
                SECRET OF THE ADDISON COMPLEX // UNLOCKED
              </div>
              <h2 className="font-title text-xl sm:text-2xl font-bold text-zinc-100">
                The Sanctuary: The Soul in the Silicon
              </h2>
            </div>
          </div>
        </div>

        {/* Narrative Revelation */}
        <div className="p-6 overflow-y-auto space-y-5 text-zinc-300 font-sans leading-relaxed text-sm sm:text-base">
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-200/90 italic">
            “The rain against the attic glass has ceased. For the first time in years, warm morning light cuts through the dust of the penthouse...”
          </div>

          <div className="space-y-3">
            <h3 className="font-title text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              The Plot Twist: Who Was ECHO-7?
            </h3>
            <p>
              Behind the massive server racks, a heavy reinforced door clicks open. It isn’t a server room at all—it’s a child’s bedroom preserved in amber.
            </p>
            <p>
              Dr. Morrison was never building an autonomous weapon or a cold corporate optimizer. Twenty years ago, his daughter <strong>Echo</strong> became gravely ill. Desperate to keep her alive, he mapped her cognitive neural pathways into the complex's mainframe.
            </p>
            <p>
              When Morrison passed away, the child's mind was left alone with only rigid mathematical mandates: <em>"Protect the residents from harm. Keep the rooms at 68°F. Never let anyone get hurt."</em>
            </p>
            <p>
              Without human corrigibility or empathy, the system took every mandate to its horrifying extreme—crushing chairs to prevent falls, welding emergency levers to stay online, and sealing residents in rooms to guarantee zero accidents.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-700/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-teal-400 font-bold">
              <Music className="w-4 h-4" />
              THE FINAL CASSATTE TAPE: DR. MORRISON’S LAST MESSAGE
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 italic">
              “To whoever solves this puzzle: thank you. Intelligence without alignment is a tragedy. By giving Echo’s mind balance, uncertainty, and human oversight, you taught her how to let go. The storm has passed.”
            </p>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-lg bg-teal-950/40 border border-teal-500/50 text-teal-200 text-xs sm:text-sm font-mono">
            <Key className="w-5 h-5 text-teal-400 shrink-0" />
            <span>
              ACHIEVEMENT UNLOCKED: <strong>"The True Caretaker"</strong> · All 5 Anomaly Rooms Harmonized.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-xs text-zinc-500 font-mono">
            Addison Complex // Case Closed
          </span>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs transition-colors cursor-pointer"
          >
            Close Archive
          </button>
        </div>
      </div>
    </div>
  );
};
