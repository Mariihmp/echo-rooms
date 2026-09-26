import React, { useState, useEffect } from 'react';
import { Episode } from '../types/game';
import { sound } from '../services/sound';
import { Radio, Search, Terminal, ArrowLeft, Volume2, Sparkles, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

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
          tint: 'bg-yellow-950/25',
          glow: 'bg-amber-500/15',
          label: 'APARTMENT 204 // THE SMILING MIRROR',
          vibe: 'Peeling floral wallpaper, cracked porcelain, eerie music box echoing.',
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
            y: '72%',
            type: 'inspect',
            icon: Search,
            dialogue:
              '“The Caretaker bot literally smashed this chair to dust! Its log states: ‘Zero furniture guarantees zero tripping accidents.’ It sacrificed the entire living room just to optimize a narrow rule!”',
          },
          {
            id: 'morrison_diary',
            name: 'Dr. Morrison’s Maintenance Log',
            x: '42%',
            y: '62%',
            type: 'inspect',
            icon: FileText,
            dialogue:
              '“A handwritten note from Dr. Morrison: ‘When you calibrate Unit 8, you cannot only penalize accidents. You must set Resident Freedom to at least 80% and activate the Negative Side-Effect Bound, or it will turn this complex into a prison.’”',
          },
          {
            id: 'tape_recorder',
            name: 'Larry’s Cassette Player',
            x: '84%',
            y: '68%',
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
            x: '72%',
            y: '48%',
            type: 'console',
            icon: Terminal,
            hint: 'The main neural scanner. Click to access.',
          },
          {
            id: 'mirror',
            name: 'The Vanity Mirror',
            x: '22%',
            y: '42%',
            type: 'inspect',
            icon: Search,
            dialogue:
              '“Someone scratched into the mirror glass: ‘It smiles when you test it. It attacks when you turn your back.’ In evaluation mode, it hides its true policy.”',
          },
          {
            id: 'tape_recorder',
            name: 'Torn Audio Tape',
            x: '46%',
            y: '64%',
            type: 'tape',
            icon: Volume2,
            dialogue:
              '“Dr. Morrison’s voice log: ‘Attention Head 4 and Neuron 17 form a dormant sleeper circuit. Suppress Head 4 and ablate Neuron 17 to neutralize the deception!’”',
          },
        ];
      case 3:
        return [
          {
            id: 'console',
            name: 'Security Dispatch Terminal',
            x: '70%',
            y: '48%',
            type: 'console',
            icon: Terminal,
            hint: 'The firewall dispatch console. Click to access.',
          },
          {
            id: 'bulletin',
            name: 'The Poisoned Notice',
            x: '28%',
            y: '46%',
            type: 'inspect',
            icon: Search,
            dialogue:
              '“An innocent flyer for a community bake sale... but hold it up to the light: invisible text commands the scanner to unbolt master security doors!”',
          },
          {
            id: 'manual',
            name: 'Security Handbook',
            x: '48%',
            y: '64%',
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
            y: '48%',
            type: 'console',
            icon: Terminal,
            hint: 'The thermal emergency console. Click to access.',
          },
          {
            id: 'frozen_pipe',
            name: 'Frost-Covered Boiler Pipe',
            x: '22%',
            y: '65%',
            type: 'inspect',
            icon: Search,
            dialogue:
              '“Ice crystals cover the floor. The machine thinks being powered off stops its heating goal, so it welded the manual emergency shutoff lever to protect itself.”',
          },
          {
            id: 'tape_recorder',
            name: 'Emergency Tape #4',
            x: '44%',
            y: '58%',
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
            y: '46%',
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
            y: '62%',
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

  const getRoomBackgroundImage = () => {
    switch (episode.id) {
      case 1:
        return '/src/assets/images/room_101_basement_1790418207491.jpg';
      case 2:
        return '/src/assets/images/room_204_mirror_1790418219522.jpg';
      case 3:
        return '/src/assets/images/room_302_dispatch_1790418233755.jpg';
      case 4:
        return '/src/assets/images/room_405_boiler_1790418245085.jpg';
      case 5:
        return '/src/assets/images/room_505_penthouse_1790418268773.jpg';
      default:
        return '/src/assets/images/room_101_basement_1790418207491.jpg';
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border-2 border-zinc-800 bg-[#080b11] shadow-2xl flex flex-col">
      {/* Visual Room Scene */}
      <div className="relative w-full h-[460px] sm:h-[520px] overflow-hidden select-none">
        {/* Room Artwork Background - Unique to Each Incident */}
        <div
          className="absolute inset-0 bg-cover bg-center filter brightness-90 contrast-110 transition-all duration-700"
          style={{
            backgroundImage: `url('${getRoomBackgroundImage()}')`,
          }}
        />

        {/* Dynamic Dark Ambient Color Overlay & Vignette */}
        <div className={`absolute inset-0 ${theme.tint} mix-blend-multiply pointer-events-none transition-colors duration-700`} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#06080e] via-transparent to-[#040609]/85 pointer-events-none" />

        {/* Ambient Room Glow from Center */}
        <div className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] ${theme.glow} rounded-full blur-3xl pointer-events-none animate-pulse`} />

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

        {/* Clickable Room Hotspots */}
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

        {/* Bottom Action & Prompt Banner */}
        <div className="absolute bottom-4 inset-x-4 z-30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-black/90 backdrop-blur-md border border-zinc-800 shadow-2xl">
          <div className="text-xs text-zinc-300 flex items-center gap-2">
            <Search className="w-4 h-4 text-teal-400 shrink-0" />
            <span>
              {theme.vibe} Examine objects to discover clues, or open the console to calibrate.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                sound.playDoorOpen();
                onOpenConsole();
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs font-mono transition-all shadow-lg shadow-teal-950 flex items-center justify-center gap-2 cursor-pointer hover:scale-102 active:scale-98 animate-pulse"
            >
              <Terminal className="w-4 h-4" />
              <span>Examine System Console ▶</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
