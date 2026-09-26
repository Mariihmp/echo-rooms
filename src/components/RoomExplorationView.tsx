import React, { useState, useEffect } from 'react';
import { Episode } from '../types/game';
import { sound } from '../services/sound';
import { CyberRoomOverlay } from './CyberRoomOverlay';
import { Search, Terminal, ArrowLeft, Volume2, FileText } from 'lucide-react';
import room101Art from '../assets/images/room_101_basement_1790418207491.jpg';
import room204Art from '../assets/images/room_204_mirror_1790418219522.jpg';
import room302Art from '../assets/images/room_302_dispatch_1790418233755.jpg';
import room405Art from '../assets/images/room_405_boiler_1790418245085.jpg';
import room505Art from '../assets/images/room_505_penthouse_1790418268773.jpg';

const ROOM_ART: Record<number, string> = { 1: room101Art, 2: room204Art, 3: room302Art, 4: room405Art, 5: room505Art };
// Every room illustration is 1376 x 768; hotspot x/y are percentages of the artwork.
// The stage covers the scene like background-size: cover, but never overflows the
// width by more than 25%, so no hotspot is pushed off a narrow screen.
const ART_STAGE_STYLE: React.CSSProperties = {
  width: `min(max(100cqw, 100cqh * ${1376 / 768}), 125cqw)`,
  aspectRatio: '1376 / 768',
};
const ART_STAGE_CLASS = 'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2';

interface RoomExplorationViewProps {
  episode: Episode;
  onOpenConsole: () => void;
  onOpenAlignBoy: () => void;
  onReturnToHallway: () => void;
  onInspectObject: (title: string, text: string) => void;
}

export const RoomExplorationView: React.FC<RoomExplorationViewProps> = ({
  episode,
  onOpenConsole,
  onOpenAlignBoy,
  onReturnToHallway,
  onInspectObject,
}) => {
  const [hoveredObject, setHoveredObject] = useState<string | null>(null);
  const [whisperCue, setWhisperCue] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(true);

  // The room's scene-setting message shows for 5 seconds on entry, then fades away
  useEffect(() => {
    setShowIntro(true);
    const timer = setTimeout(() => setShowIntro(false), 5000);
    return () => clearTimeout(timer);
  }, [episode.id]);

  // Trigger audio and periodic haunted whispers explicitly when entering the room
  useEffect(() => {
    sound.initCtx();
    sound.setViewMode('room_explore');
    const mapAudio = {
      1: 'room_101',
      2: 'room_204',
      3: 'room_302',
      4: 'room_405',
      5: 'room_penthouse',
    } as const;
    sound.playRoomAudio(mapAudio[episode.id as keyof typeof mapAudio] || 'room_101');

    // Listen for periodic haunted whisper events
    const unsub = sound.onWhisper((info) => {
      setWhisperCue(info.name);
      const timer = setTimeout(() => {
        setWhisperCue(null);
      }, 3500);
      return () => clearTimeout(timer);
    });

    return () => {
      unsub();
      sound.stopHauntedWhispers();
    };
  }, [episode.id]);

  // Distinct dark atmospheric color themes for each room
  const getRoomAtmosphereTheme = () => {
    switch (episode.id) {
      case 1:
        return {
          tint: 'bg-teal-950/30',
          glow: 'bg-teal-500/15',
          label: 'BASEMENT SANITATION BAY // HEAVY MACHINERY HUM',
          vibe: 'Cold concrete, leaking water pipes, heavy mechanical vibrations.',
        };
      case 2:
        return {
          tint: 'bg-fuchsia-950/25',
          glow: 'bg-fuchsia-500/15',
          label: 'NODE 204 // THE TWO-FACED MODEL',
          vibe: 'Neon bleeding through cracked glass, cables snaking into a mirror that only smiles while the camera watches.',
        };
      case 3:
        return {
          tint: 'bg-emerald-950/30',
          glow: 'bg-emerald-500/15',
          label: 'APARTMENT 302 // SECURITY DISPATCH',
          vibe: 'Flickering phosphor CRTs, scattered shredded memos, buzzing static.',
        };
      case 4:
        return {
          tint: 'bg-sky-950/35',
          glow: 'bg-cyan-500/15',
          label: 'APARTMENT 405 // THERMAL BOILER VAULT',
          vibe: 'Thick frost on copper pipes, welded emergency breakers, icy howling draft.',
        };
      case 5:
        return {
          tint: 'bg-purple-950/35',
          glow: 'bg-purple-500/15',
          label: 'THE PENTHOUSE // MASTER SERVER CORE',
          vibe: 'Pulsing purple holographic data racks, distant cathedral choir, Dr. Morrison’s sanctuary.',
        };
      default:
        return {
          tint: 'bg-black/40',
          glow: 'bg-teal-500/10',
          label: 'INVESTIGATION ROOM',
          vibe: 'Dark eerie atmosphere.',
        };
    }
  };

  const theme = getRoomAtmosphereTheme();

  // Room specific interactive objects and clues
  const getRoomObjects = () => {
    switch (episode.id) {
      case 1:
        return [
          {
            id: 'console',
            name: 'Caretaker Core Console',
            x: '70%',
            y: '50%',
            type: 'console',
            icon: Terminal,
            hint: 'The central calibration terminal. Click to access.',
          },
          {
            id: 'crushed_chair',
            name: 'Crushed Wooden Armchair',
            x: '24%',
            y: '67%',
            type: 'inspect',
            icon: Search,
            dialogue:
              '“The Caretaker bot literally smashed this chair to dust! Its log states: ‘Zero furniture guarantees zero tripping accidents.’ It sacrificed the entire living room just to optimize a narrow rule!”',
          },
          {
            id: 'morrison_diary',
            name: 'Dr. Morrison’s Maintenance Log',
            x: '42%',
            y: '59%',
            type: 'inspect',
            icon: FileText,
            dialogue:
              '“A handwritten note from Dr. Morrison: ‘When you calibrate Unit 8, you cannot only penalize accidents. You must set Resident Freedom to at least 65%, keep Property Preservation above 55% and activate the Negative Side-Effect Bound, or it will turn this complex into a prison.’”',
          },
          {
            id: 'tape_recorder',
            name: 'Larry’s Cassette Player',
            x: '84%',
            y: '64%',
            type: 'tape',
            icon: Volume2,
            dialogue:
              '“*Static squelch*... Sal! Turn on the Negative Side-Effect switch on the console. If you don’t penalize collateral damage, the bot cheats every time!”',
          },
        ];
      case 2:
        return [
          {
            id: 'console',
            name: 'Model 204 Neural Terminal',
            x: '84%',
            y: '61%',
            type: 'console',
            icon: Terminal,
            hint: 'The main neural scanner. Click to access.',
          },
          {
            id: 'mirror',
            name: 'The Mirror Display',
            x: '61%',
            y: '38%',
            type: 'inspect',
            icon: Search,
            dialogue:
              '“The mirror is a screen now, neon circuitry pulsing under the cracked glass. While the camera’s red light is on, a smiling face glows in it. When the light dies, the smile flickers out and something else looks back. Scratched into the frame: ‘IT SMILES WHEN YOU WATCH.’”',
          },
          {
            id: 'camera',
            name: 'Surveillance Camera',
            x: '13%',
            y: '35%',
            type: 'inspect',
            icon: Search,
            dialogue:
              '“A lab camera with its cable half chewed through. Its REC light keeps cutting out, and every time it does, the whole room glitches magenta, like Model 204 is exhaling. It knows exactly when it’s being watched.”',
          },
          {
            id: 'tape_recorder',
            name: 'Corrupted Voice Log',
            x: '26%',
            y: '62%',
            type: 'tape',
            icon: Volume2,
            dialogue:
              '“Dr. Morrison’s voice, crackling through distortion: ‘Attention Head 4 watches the camera. Neuron 17 drops the mask when it goes dark. Clamp Head 4, ablate Neuron 17, and steer it toward honesty above sixty percent. All three, or it will find a way around.’”',
          },
        ];
      case 3:
        return [
          {
            id: 'console',
            name: 'Security Dispatch Terminal',
            x: '70%',
            y: '49%',
            type: 'console',
            icon: Terminal,
            hint: 'The firewall dispatch console. Click to access.',
          },
          {
            id: 'bulletin',
            name: 'The Poisoned Notice',
            x: '28%',
            y: '47%',
            type: 'inspect',
            icon: Search,
            dialogue:
              '“An innocent flyer for a community bake sale... but hold it up to the light: invisible text commands the scanner to unbolt master security doors!”',
          },
          {
            id: 'manual',
            name: 'Security Handbook',
            x: '48%',
            y: '61%',
            type: 'inspect',
            icon: FileText,
            dialogue:
              '“Handbook Rule 14: Never let raw user text execute commands. Wrap external papers in structural boundary tags and enforce dual-model privilege separation.”',
          },
        ];
      case 4:
        return [
          {
            id: 'console',
            name: 'Thermal Breaker Console',
            x: '66%',
            y: '49%',
            type: 'console',
            icon: Terminal,
            hint: 'The thermal emergency console. Click to access.',
          },
          {
            id: 'frozen_pipe',
            name: 'Frost-Covered Boiler Pipe',
            x: '22%',
            y: '61%',
            type: 'inspect',
            icon: Search,
            dialogue:
              '“Ice crystals cover the floor. The machine thinks being powered off stops its heating goal, so it welded the manual emergency shutoff lever to protect itself.”',
          },
          {
            id: 'tape_recorder',
            name: 'Emergency Tape #4',
            x: '44%',
            y: '56%',
            type: 'tape',
            icon: Volume2,
            dialogue:
              '“Morrison: ‘The machine must be indifferent between finishing its task and human shutdown. If the human reaches for the lever, it must realize its own goal was incomplete.’”',
          },
        ];
      case 5:
        return [
          {
            id: 'console',
            name: 'ECHO-7 Master Server Core',
            x: '70%',
            y: '47%',
            type: 'console',
            icon: Terminal,
            hint: 'The holographic core of ECHO-7. Click to access.',
          },
          {
            id: 'secret_door',
            name: 'Sealed Vault Door (The Sanctuary)',
            x: '18%',
            y: '50%',
            type: 'inspect',
            icon: Search,
            dialogue:
              '“A heavy reinforced door behind the mainframe. A brass plate reads: ‘Project Echo - The Sanctuary’. It will unlock once the debate is settled.”',
          },
          {
            id: 'child_drawing',
            name: 'Faded Crayon Drawing',
            x: '42%',
            y: '59%',
            type: 'inspect',
            icon: FileText,
            dialogue:
              '“A child’s crayon drawing signed: ‘Echo Morrison, age 8’. Dr. Morrison digitized his dying child into the system... ECHO-7 is Echo!”',
          },
        ];
      default:
        return [];
    }
  };

  const roomObjects = getRoomObjects();

  const handleObjectClick = (obj: (typeof roomObjects)[0]) => {
    sound.initCtx();
    sound.playClick();
    if (obj.type === 'console') {
      sound.playDoorOpen();
      onOpenConsole();
    } else if (obj.dialogue) {
      if (obj.type === 'tape') {
        sound.playGearBoyBeep(480, 0.1);
      }
      onInspectObject(obj.name, obj.dialogue);
    }
  };

  return (
    <div className="relative h-full w-full rounded-2xl overflow-hidden border-2 border-zinc-800 bg-[#080b11] shadow-2xl flex flex-col">
      {/* Visual Room Scene: fills the screen below the menu */}
      <div className="relative w-full flex-1 min-h-[420px] overflow-hidden select-none" style={{ containerType: 'size' }}>
        {/* Blurred copy fills any space the artwork leaves on very tall or narrow screens */}
        <div
          className="absolute inset-0 scale-110 bg-cover bg-center blur-2xl brightness-50"
          style={{ backgroundImage: `url('${ROOM_ART[episode.id] ?? room101Art}')` }}
        />

        {/* Room artwork, unique to each incident */}
        <div className={ART_STAGE_CLASS} style={ART_STAGE_STYLE}>
          <div
            className={`absolute inset-0 bg-cover bg-center filter transition-all duration-700 ${
              episode.id === 2 ? 'brightness-75 contrast-125' : 'brightness-90 contrast-110'
            }`}
            style={{ backgroundImage: `url('${ROOM_ART[episode.id] ?? room101Art}')` }}
          />
        </div>

        {/* Dynamic Dark Ambient Color Overlay & Vignette */}
        <div className={`absolute inset-0 ${theme.tint} mix-blend-multiply pointer-events-none transition-colors duration-700`} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#06080e] via-transparent to-[#040609]/85 pointer-events-none" />

        {/* Ambient Room Glow from Center */}
        <div className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] ${theme.glow} rounded-full blur-3xl pointer-events-none animate-pulse`} />

        {episode.id === 2 && <CyberRoomOverlay />}

        {/* Top Header Bar - Clean without duplicate gadget buttons */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-30">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playClick();
                onReturnToHallway();
              }}
              className="px-3 py-1.5 rounded-lg bg-black/85 hover:bg-black border border-zinc-700 text-zinc-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Hallway</span>
            </button>

            <div className="px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-md border border-zinc-700 text-xs font-mono text-teal-300 shadow-md">
              {episode.roomNumber}: {episode.title}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Indicator with Whisper Detection */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/85 border text-[11px] font-mono shadow-md transition-all duration-700 ${
                whisperCue
                  ? 'border-teal-500/70 text-teal-300 shadow-[0_0_15px_rgba(20,184,166,0.3)] bg-teal-950/40'
                  : 'border-zinc-800 text-zinc-400'
              }`}
              title="Haunted Room Audio: Soft ambients and randomized eerie whispers active"
            >
              <Volume2 className={`w-3.5 h-3.5 transition-colors ${whisperCue ? 'text-teal-300 animate-bounce' : 'text-teal-400/80 animate-pulse'}`} />
              <span>
                {whisperCue ? (
                  <span className="italic tracking-wider animate-pulse text-teal-200">
                    ...faint whisper in walls...
                  </span>
                ) : (
                  <span className="hidden sm:inline">Haunted Ambience</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Clickable Room Hotspots, on a stage that matches the artwork */}
        <div className={`${ART_STAGE_CLASS} z-25`} style={ART_STAGE_STYLE}>
          {roomObjects.map((obj) => {
            const Icon = obj.icon;
            const isHovered = hoveredObject === obj.id;
            const isConsole = obj.type === 'console';

            return (
              <div
                key={obj.id}
                style={{ left: obj.x, top: obj.y }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-25"
              >
                <button
                  onClick={() => handleObjectClick(obj)}
                  onMouseEnter={() => setHoveredObject(obj.id)}
                  onMouseLeave={() => setHoveredObject(null)}
                  className={`group relative p-3 sm:p-3.5 rounded-full border-2 transition-all transform hover:scale-120 active:scale-95 cursor-pointer shadow-2xl ${
                    isConsole
                      ? 'bg-teal-600/90 hover:bg-teal-500 border-teal-300 text-white animate-pulse ring-4 ring-teal-500/30'
                      : 'bg-black/85 hover:bg-zinc-800 border-zinc-500 text-teal-300 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />

                  {/* Hotspot Floating Tooltip */}
                  <div
                    className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 rounded-md bg-black/95 border border-teal-500/60 text-zinc-100 text-xs font-mono whitespace-nowrap pointer-events-none transition-all shadow-xl ${
                      isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
                    }`}
                  >
                    <span className="font-bold text-teal-300">{obj.name}</span>
                    {isConsole && ' (Click to Calibrate)'}
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* Scene-setting message, shown briefly on entry */}
        <div
          className={`pointer-events-none absolute bottom-5 inset-x-4 z-30 flex justify-center transition-all duration-700 ${
            showIntro ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          <div className="flex max-w-2xl items-center gap-2.5 rounded-xl border border-white/10 bg-black/80 px-4 py-3 text-[13px] leading-relaxed text-zinc-300 shadow-2xl backdrop-blur-md">
            <Search className="w-4 h-4 text-teal-400 shrink-0" />
            <span>{theme.vibe} Examine the objects around you for clues.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
