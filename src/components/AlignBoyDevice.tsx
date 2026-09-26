import React, { useState } from 'react';
import { sound } from '../services/sound';
import { Activity, Cpu, X, Radio } from 'lucide-react';

interface AlignBoyProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoom: string;
  activeEpisodeTitle: string;
  onOpenPuzzle?: () => void;
}

export const AlignBoyDevice: React.FC<AlignBoyProps> = ({
  isOpen,
  onClose,
  currentRoom,
  activeEpisodeTitle,
  onOpenPuzzle,
}) => {
  const [activeTab, setActiveTab] = useState<'radar' | 'tensors'>('radar');
  const [frequency, setFrequency] = useState<number>(104.7);
  const [scanGlitch, setScanGlitch] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleTune = (delta: number) => {
    sound.playGearBoyBeep(400 + Math.floor(Math.random() * 300), 0.05);
    setFrequency((prev) => +(prev + delta).toFixed(1));
    if (Math.random() > 0.6) {
      setScanGlitch(true);
      setTimeout(() => setScanGlitch(false), 200);
    }
  };

  const handleButtonPress = (btn: string) => {
    sound.playGearBoyBeep(btn === 'A' ? 680 : 520, 0.08);
    if (btn === 'A' && onOpenPuzzle) {
      onOpenPuzzle();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs select-none animate-fadeIn">
      {/* Handheld Device Body (Todd's Custom Mod) */}
      <div className="w-full max-w-md bg-[#7c838a] border-4 border-[#4a5056] rounded-3xl p-5 shadow-2xl relative flex flex-col items-center">
        {/* Antenna */}
        <div className="absolute -top-12 left-10 w-3 h-14 bg-gradient-to-t from-[#5a6067] to-[#adb5bd] rounded-t-full border border-black/40 shadow-md">
          <div className="w-4 h-4 bg-teal-400/80 rounded-full -ml-0.5 -mt-2 border border-teal-200 animate-pulse" />
        </div>

        {/* Top Header / Branding */}
        <div className="w-full flex items-center justify-between px-2 mb-3">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[11px] font-bold tracking-widest text-[#22272c] uppercase">
              TODD'S ALIGN-BOY // PARANORMAL SCANNER
            </span>
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1 text-zinc-800 hover:text-black hover:bg-zinc-600/30 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CRT / LCD Bezel */}
        <div className="w-full bg-[#1b222a] border-4 border-[#353c45] rounded-xl p-3 shadow-inner relative overflow-hidden">
          {/* Green Phosphor Screen */}
          <div className="w-full h-64 bg-[#7a9a60] border-2 border-[#546e40] rounded-md p-3 relative flex flex-col justify-between overflow-hidden shadow-inner text-[#172511] font-mono-retro">
            {/* Scanline pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.15)_50%,transparent_50%)] bg-[length:100%_4px] pointer-events-none opacity-40" />

            {/* Screen Header */}
            <div className="border-b border-[#546e40] pb-1 flex items-center justify-between text-xs tracking-wider font-bold">
              <span>SCAN: {frequency} MHz</span>
              <span className="animate-pulse font-mono text-[10px]">
                {scanGlitch ? 'SIGNAL DISTORTION' : 'STATUS: SYNCED'}
              </span>
            </div>

            {/* Screen Dynamic Content */}
            <div className="flex-1 py-2 text-sm leading-snug overflow-y-auto space-y-1">
              {activeTab === 'radar' && (
                <div>
                  <div className="text-base font-bold underline mb-1">
                    {currentRoom.toUpperCase()} // SENSOR RADAR
                  </div>
                  <p className="text-xs leading-normal">
                    ROOM: {activeEpisodeTitle}
                  </p>

                  {/* Anomaly Radar Grid Display */}
                  <div className="my-2 p-2 bg-[#698750] rounded border border-[#485f37] text-[11px] font-mono flex items-center justify-between">
                    <div>
                      <div className="font-bold">ANOMALY FIELD DETECTED</div>
                      <div className="text-[10px] opacity-80">Rogue tensor gradients leaking through walls</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-[#14230d]">{(frequency * 0.73).toFixed(1)}%</div>
                      <div className="text-[9px] uppercase tracking-wider text-red-950 font-bold">ACTIVE DRIFT</div>
                    </div>
                  </div>

                  <div className="text-[11px] font-sans text-[#223518] mt-2">
                    Use the D-Pad below to tune frequency. Align-Boy detects latent objective shifts across floors.
                  </div>
                </div>
              )}

              {activeTab === 'tensors' && (
                <div>
                  <div className="text-base font-bold underline mb-1">
                    NEURAL SPECTROGRAM
                  </div>
                  <div className="text-xs font-mono space-y-1.5 pt-1">
                    <div className="flex justify-between border-b border-[#546e40]/50 pb-0.5">
                      <span>ATTN LAYER 4:</span>
                      <span className="font-bold">DEVIANT [0.89]</span>
                    </div>
                    <div className="flex justify-between border-b border-[#546e40]/50 pb-0.5">
                      <span>SLEEPER NEURON 17:</span>
                      <span className="font-bold">TRIGGER ACTIVE</span>
                    </div>
                    <div className="flex justify-between border-b border-[#546e40]/50 pb-0.5">
                      <span>GOODHART PRESSURE:</span>
                      <span className="font-bold">HIGH (92%)</span>
                    </div>
                  </div>
                  <div className="mt-2 text-[11px] text-[#223518]">
                    Internal neural weights show divergence from human intent when unmonitored.
                  </div>
                </div>
              )}
            </div>

            {/* Screen Footer Tab Bar */}
            <div className="border-t border-[#546e40] pt-1 flex items-center justify-around text-xs font-bold">
              <button
                onClick={() => {
                  sound.playGearBoyBeep(450, 0.04);
                  setActiveTab('radar');
                }}
                className={`px-3 py-0.5 rounded transition-colors cursor-pointer ${
                  activeTab === 'radar' ? 'bg-[#546e40] text-[#a4c988]' : 'hover:bg-[#6b8c53]'
                }`}
              >
                1. SENSOR RADAR
              </button>
              <button
                onClick={() => {
                  sound.playGearBoyBeep(480, 0.04);
                  setActiveTab('tensors');
                }}
                className={`px-3 py-0.5 rounded transition-colors cursor-pointer ${
                  activeTab === 'tensors' ? 'bg-[#546e40] text-[#a4c988]' : 'hover:bg-[#6b8c53]'
                }`}
              >
                2. NEURAL SPECTROGRAM
              </button>
            </div>
          </div>
        </div>

        {/* Physical Handheld Controls */}
        <div className="w-full mt-4 flex items-center justify-between px-3">
          {/* D-Pad for frequency tuning */}
          <div className="relative w-24 h-24">
            <button
              onClick={() => handleTune(0.5)}
              className="absolute top-0 left-8 w-8 h-8 bg-[#333a42] hover:bg-[#20252b] active:bg-black rounded-t text-zinc-300 flex items-center justify-center shadow-md text-xs font-bold cursor-pointer"
            >
              ▲
            </button>
            <button
              onClick={() => handleTune(-0.5)}
              className="absolute bottom-0 left-8 w-8 h-8 bg-[#333a42] hover:bg-[#20252b] active:bg-black rounded-b text-zinc-300 flex items-center justify-center shadow-md text-xs font-bold cursor-pointer"
            >
              ▼
            </button>
            <button
              onClick={() => handleTune(-0.1)}
              className="absolute top-8 left-0 w-8 h-8 bg-[#333a42] hover:bg-[#20252b] active:bg-black rounded-l text-zinc-300 flex items-center justify-center shadow-md text-xs font-bold cursor-pointer"
            >
              ◀
            </button>
            <button
              onClick={() => handleTune(0.1)}
              className="absolute top-8 right-0 w-8 h-8 bg-[#333a42] hover:bg-[#20252b] active:bg-black rounded-r text-zinc-300 flex items-center justify-center shadow-md text-xs font-bold cursor-pointer"
            >
              ▶
            </button>
            <div className="absolute top-8 left-8 w-8 h-8 bg-[#282d33] flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-[#1b1f24]" />
            </div>
          </div>

          {/* Action Buttons (A & B) */}
          <div className="flex items-center gap-3 rotate-[-18deg]">
            <div className="flex flex-col items-center">
              <button
                onClick={() => {
                  sound.playClick();
                  onClose();
                }}
                className="w-11 h-11 rounded-full bg-[#8c2a38] hover:bg-[#72202c] active:bg-[#52131c] shadow-lg border-2 border-black/40 flex items-center justify-center text-white font-bold text-sm cursor-pointer"
              >
                B
              </button>
              <span className="text-[10px] font-mono text-[#2c3136] mt-1 font-bold">CLOSE</span>
            </div>
            <div className="flex flex-col items-center -mt-4">
              <button
                onClick={() => handleButtonPress('A')}
                className="w-11 h-11 rounded-full bg-[#8c2a38] hover:bg-[#72202c] active:bg-[#52131c] shadow-lg border-2 border-black/40 flex items-center justify-center text-white font-bold text-sm cursor-pointer"
              >
                A
              </button>
              <span className="text-[10px] font-mono text-[#2c3136] mt-1 font-bold">SCAN</span>
            </div>
          </div>
        </div>

        {/* Speaker Grille */}
        <div className="w-full flex justify-end gap-1 px-6 mt-3 opacity-50">
          <div className="w-1 h-8 bg-[#333a42] rounded-full rotate-[-30deg]" />
          <div className="w-1 h-8 bg-[#333a42] rounded-full rotate-[-30deg]" />
          <div className="w-1 h-8 bg-[#333a42] rounded-full rotate-[-30deg]" />
          <div className="w-1 h-8 bg-[#333a42] rounded-full rotate-[-30deg]" />
        </div>
      </div>
    </div>
  );
};
