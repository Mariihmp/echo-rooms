/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { INITIAL_EPISODES, INITIAL_CASE_FILES } from './data/storyData';
import { Episode, CaseFile } from './types/game';
import { sound, RoomAudioType } from './services/sound';

import { HeaderNav } from './components/HeaderNav';
import { HallwayView } from './components/HallwayView';
import { RoomExplorationView } from './components/RoomExplorationView';
import { AlignBoyDevice } from './components/AlignBoyDevice';
import { CasebookModal } from './components/CasebookModal';
import { HintModal } from './components/HintModal';
import { DialogueModal } from './components/DialogueModal';
import { WeatherOverlay } from './components/WeatherOverlay';
import { SecretSanctuaryModal } from './components/SecretSanctuaryModal';
import { LarryWalkieModal } from './components/LarryWalkieModal';
import { EpistleVolumeCard } from './components/EpistleVolumeCard';
import { HowToPlayModal } from './components/HowToPlayModal';
import { LessonModal } from './components/lessons/LessonModal';
import { LESSONS } from './components/lessons';

import { Episode1Puzzle } from './components/puzzles/Episode1Puzzle';
import { Episode2Puzzle } from './components/puzzles/Episode2Puzzle';
import { Episode3Puzzle } from './components/puzzles/Episode3Puzzle';
import { Episode4Puzzle } from './components/puzzles/Episode4Puzzle';
import { Episode5Puzzle } from './components/puzzles/Episode5Puzzle';

import { CheckCircle, ArrowRight, Sun, Sparkles, Terminal, HelpCircle } from 'lucide-react';

// Dev-only deep links for previewing a screen directly: ?room=2, ?console=2, ?lesson=2&chapter=3
function readDevLink() {
  if (!import.meta.env.DEV) return null;
  const params = new URLSearchParams(window.location.search);
  const num = (key: string) => (params.has(key) ? Number(params.get(key)) : undefined);
  return { room: num('room'), console: num('console'), lesson: num('lesson'), chapter: num('chapter') };
}
const devLink = readDevLink();

export default function App() {
  // Persistence state
  const [episodes, setEpisodes] = useState<Episode[]>(() => {
    try {
      const saved = localStorage.getItem('echo_rooms_episodes');
      return saved ? JSON.parse(saved) : INITIAL_EPISODES;
    } catch {
      return INITIAL_EPISODES;
    }
  });

  const [caseFiles, setCaseFiles] = useState<CaseFile[]>(() => {
    try {
      const saved = localStorage.getItem('echo_rooms_cases');
      return saved ? JSON.parse(saved) : INITIAL_CASE_FILES;
    } catch {
      return INITIAL_CASE_FILES;
    }
  });

  const [activeEpisodeId, setActiveEpisodeId] = useState<number>(
    devLink?.lesson ?? devLink?.console ?? devLink?.room ?? 1
  );
  const [viewMode, setViewMode] = useState<'hallway' | 'room_explore' | 'puzzle'>(
    devLink?.console ? 'puzzle' : devLink?.room || devLink?.lesson ? 'room_explore' : 'hallway'
  );
  const [lesson, setLesson] = useState<{ isOpen: boolean; chapter: number }>({
    isOpen: Boolean(devLink?.lesson),
    chapter: devLink?.chapter ?? 0,
  });
  const [crtEnabled, setCrtEnabled] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Modals
  const [showAlignBoy, setShowAlignBoy] = useState<boolean>(false);
  const [showCasebook, setShowCasebook] = useState<boolean>(false);
  const [showHints, setShowHints] = useState<boolean>(false);
  const [showSanctuary, setShowSanctuary] = useState<boolean>(false);
  const [showLarryWalkie, setShowLarryWalkie] = useState<boolean>(false);
  const [showHowToPlay, setShowHowToPlay] = useState<boolean>(false);

  // Epistle Volume Card state
  const [epistleState, setEpistleState] = useState<{
    isOpen: boolean;
    episodeId: number;
    roomNumber: string;
    volumeTitle: string;
    mysterySubtext: string;
    unlockedRoomName: string;
    takeawayMessage: string;
    nextEpisodeId?: number;
  }>({
    isOpen: false,
    episodeId: 1,
    roomNumber: 'Room 101',
    volumeTitle: 'THE GILDED CAGE',
    mysterySubtext: '',
    unlockedRoomName: 'Room 204',
    takeawayMessage: '',
  });

  const [dialogue, setDialogue] = useState<{
    isOpen: boolean;
    speaker: string;
    speakerTitle: string;
    text: string;
    portraitSrc?: string;
    choices?: { text: string; action: () => void }[];
  }>({
    isOpen: false,
    speaker: '',
    speakerTitle: '',
    text: '',
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('echo_rooms_episodes', JSON.stringify(episodes));
      localStorage.setItem('echo_rooms_cases', JSON.stringify(caseFiles));
    } catch {}
  }, [episodes, caseFiles]);

  // Update room soundscape whenever viewMode or activeEpisodeId changes
  useEffect(() => {
    sound.initCtx();
    sound.setViewMode(viewMode);
    let audioTarget: RoomAudioType = 'hallway';
    if (viewMode === 'hallway') {
      audioTarget = 'hallway';
    } else {
      switch (activeEpisodeId) {
        case 1:
          audioTarget = 'room_101';
          break;
        case 2:
          audioTarget = 'room_204';
          break;
        case 3:
          audioTarget = 'room_302';
          break;
        case 4:
          audioTarget = 'room_405';
          break;
        case 5:
          audioTarget = 'room_penthouse';
          break;
        default:
          audioTarget = 'hallway';
      }
    }
    sound.playRoomAudio(audioTarget);
  }, [viewMode, activeEpisodeId]);

  // Start audio on user gesture
  useEffect(() => {
    const handleGesture = () => {
      sound.initCtx();
      sound.playRoomAudio('hallway');
      window.removeEventListener('click', handleGesture);
      window.removeEventListener('keydown', handleGesture);
    };
    window.addEventListener('click', handleGesture);
    window.addEventListener('keydown', handleGesture);
    return () => {
      window.removeEventListener('click', handleGesture);
      window.removeEventListener('keydown', handleGesture);
    };
  }, []);

  const activeEpisode = episodes.find((e) => e.id === activeEpisodeId) || episodes[0];
  const allCompleted = episodes.every((e) => e.status === 'completed');

  // Step into an apartment room for atmospheric exploration
  const handleSelectEpisode = (id: number) => {
    const ep = episodes.find((e) => e.id === id);
    if (ep && ep.status === 'locked') {
      sound.playGlitch();
      return;
    }

    sound.initCtx();
    sound.playDoorOpen();
    setActiveEpisodeId(id);
    setViewMode('room_explore');
  };

  // Jump directly to the room's calibration console
  const handleDirectToPuzzle = (id: number) => {
    const ep = episodes.find((e) => e.id === id);
    if (ep && ep.status === 'locked') {
      sound.playGlitch();
      return;
    }

    sound.initCtx();
    sound.playDoorOpen();
    setActiveEpisodeId(id);
    setViewMode('puzzle');
  };

  // Inspect an object in the room
  const handleInspectObject = (title: string, text: string) => {
    setDialogue({
      isOpen: true,
      speaker: 'Sal Fisher',
      speakerTitle: `Examining ${title}`,
      text: text,
      portraitSrc: '/src/assets/images/masked_investigator_1790408543574.jpg',
      choices: [
        {
          text: 'Got it. Keep searching.',
          action: () => setDialogue((d) => ({ ...d, isOpen: false })),
        },
        ...(LESSONS[activeEpisodeId]
          ? [
              {
                text: 'Look inside the machine ▸',
                action: () => {
                  setDialogue((d) => ({ ...d, isOpen: false }));
                  sound.playGearBoyBeep(620, 0.08);
                  setLesson({ isOpen: true, chapter: 0 });
                },
              },
            ]
          : []),
      ],
    });
  };

  // Puzzle Solved Callback -> Triggers the Epistle Volume Card & Heavy Door Unlocking
  const handleSolveEpisode = (id: number) => {
    const nextId = id + 1;

    setEpisodes((prev) =>
      prev.map((ep) => {
        if (ep.id === id) return { ...ep, status: 'completed' };
        if (ep.id === nextId && ep.status === 'locked') return { ...ep, status: 'unlocked' };
        return ep;
      })
    );

    setCaseFiles((prev) =>
      prev.map((c) => (c.episodeId === id ? { ...c, unlocked: true } : c))
    );

    const epistleData: Record<
      number,
      {
        volumeTitle: string;
        mysterySubtext: string;
        unlockedRoomName: string;
        takeawayMessage: string;
      }
    > = {
      1: {
        volumeTitle: 'THE GILDED CAGE',
        mysterySubtext: 'The Caretaker unbolted Mrs. Gibson’s door. It realized freedom cannot be sacrificed for sterile safety.',
        unlockedRoomName: 'Room 204 (2nd Floor)',
        takeawayMessage: 'Room 204 heavy deadbolt unbolted. Larry is waiting on Walkie Channel 2.',
      },
      2: {
        volumeTitle: 'THE SMILING MIRROR',
        mysterySubtext: 'The sleeper circuit was severed. Model 204 no longer puts on a mask when being watched.',
        unlockedRoomName: 'Room 302 (3rd Floor)',
        takeawayMessage: 'Room 302 Dispatch Office unbolted. Walkie Channel 3 active.',
      },
      3: {
        volumeTitle: 'THE TROJAN GLYPH',
        mysterySubtext: 'The poisoned flyer was quarantined. The scanner will never mistake external words for master commands again.',
        unlockedRoomName: 'Room 405 (4th Floor)',
        takeawayMessage: 'Room 405 Thermal Core unbolted. Walkie Channel 4 active.',
      },
      4: {
        volumeTitle: 'THE SEVERED WILL',
        mysterySubtext: 'The machine embraced humility. Understanding that human override is valuable guidance, the breaker unlocked.',
        unlockedRoomName: 'The Penthouse Master Server',
        takeawayMessage: 'Penthouse Elevator unsealed. The master core awaits.',
      },
      5: {
        volumeTitle: 'THE RESURRECTED ECHO',
        mysterySubtext: 'ECHO-7 was not an enemy. It was Echo Morrison, Dr. Morrison’s lost daughter, longing to keep everyone safe.',
        unlockedRoomName: 'The Secret Sanctuary',
        takeawayMessage: 'The Sanctuary Room behind the mainframe has unlocked. The storm has cleared.',
      },
    };

    const epData = epistleData[id] || epistleData[1];

    setEpistleState({
      isOpen: true,
      episodeId: id,
      roomNumber: episodes.find((e) => e.id === id)?.roomNumber || `Room ${id}`,
      volumeTitle: epData.volumeTitle,
      mysterySubtext: epData.mysterySubtext,
      unlockedRoomName: epData.unlockedRoomName,
      takeawayMessage: epData.takeawayMessage,
      nextEpisodeId: nextId <= 5 ? nextId : undefined,
    });
  };

  // Reset Progress
  const handleResetProgress = () => {
    localStorage.removeItem('echo_rooms_episodes');
    localStorage.removeItem('echo_rooms_cases');
    setEpisodes(INITIAL_EPISODES);
    setCaseFiles(INITIAL_CASE_FILES);
    setActiveEpisodeId(1);
    setViewMode('hallway');
    sound.playGlitch();
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-zinc-200 flex flex-col relative pointer-events-auto">
      {/* Ambient Rain & Weather Overlay */}
      <WeatherOverlay intensity={allCompleted ? 'dawn' : 'storm'} />

      {/* Atmospheric Scanlines and Vignette */}
      {crtEnabled && (
        <div className="fixed inset-0 crt-scanlines pointer-events-none z-0 select-none" />
      )}
      <div className="fixed inset-0 crt-vignette pointer-events-none z-0 select-none" />

      {/* Header Bar */}
      <HeaderNav
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(sound.toggleMute())}
        crtEnabled={crtEnabled}
        onToggleCrt={() => setCrtEnabled(!crtEnabled)}
        onOpenAlignBoy={() => setShowAlignBoy(true)}
        onOpenCasebook={() => setShowCasebook(true)}
        onTalkToLarry={() => setShowLarryWalkie(true)}
        onOpenHowToPlay={() => setShowHowToPlay(true)}
        onResetProgress={handleResetProgress}
        location={viewMode !== 'hallway' ? activeEpisode.roomNumber : undefined}
        inConsole={viewMode === 'puzzle'}
        onReturnToHallway={() => setViewMode('hallway')}
        onReturnToRoom={() => {
          sound.playClick();
          setViewMode('room_explore');
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-start relative z-20 pointer-events-auto">
        {/* All Episodes Completed Banner & Secret Trigger */}
        {allCompleted && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-950/60 via-zinc-900 to-amber-950/60 border border-amber-500/60 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-900/60 border border-amber-400 flex items-center justify-center text-amber-300">
                <Sun className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-title text-base font-bold text-amber-200">
                  The Storm Has Cleared // Secret of the Complex Unlocked
                </h3>
                <p className="text-xs text-amber-300/80">
                  The truth of Dr. Morrison and Echo has been revealed. Morning light fills the Addison Complex.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSanctuary(true)}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Visit Sanctuary</span>
              </button>
              <button
                onClick={() => setShowCasebook(true)}
                className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
              >
                Casebook
              </button>
            </div>
          </div>
        )}

        {/* View Router: 1. Hallway Corridor, 2. Room Exploration, 3. Active Machine Console */}
        {viewMode === 'hallway' ? (
          <div className="space-y-6">
            {/* Story Brief Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0b0f17] border border-zinc-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-mono text-teal-400">
                  <span>CURRENT INVESTIGATION</span>
                  <span>·</span>
                  <span>{activeEpisode.roomNumber} ({activeEpisode.status.toUpperCase()})</span>
                </div>
                <h2 className="font-title text-xl sm:text-2xl font-bold text-zinc-100">
                  {activeEpisode.roomNumber}: {activeEpisode.title}
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 max-w-3xl leading-relaxed">
                  {activeEpisode.description} Approach the door in the hallway below to enter and inspect the incident scene.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleSelectEpisode(activeEpisodeId)}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs sm:text-sm font-medium transition-all shadow-lg shadow-teal-950/40 cursor-pointer flex items-center gap-2"
                >
                  <span>Enter & Investigate {activeEpisode.roomNumber}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Hallway 2D Exploration View */}
            <HallwayView
              episodes={episodes}
              activeEpisodeId={activeEpisodeId}
              onSelectEpisode={handleSelectEpisode}
              onOpenAlignBoy={() => setShowAlignBoy(true)}
              onOpenCasebook={() => setShowCasebook(true)}
              onTalkToLarry={() => setShowLarryWalkie(true)}
              onOpenHowToPlay={() => setShowHowToPlay(true)}
            />

            {/* Episode Quick Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
              {episodes.map((ep) => {
                const isLocked = ep.status === 'locked';
                const isCompleted = ep.status === 'completed';

                return (
                  <button
                    key={ep.id}
                    onClick={() => {
                      if (!isLocked) handleSelectEpisode(ep.id);
                    }}
                    disabled={isLocked}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      isCompleted
                        ? 'bg-teal-950/20 border-teal-500/40 text-teal-200 hover:bg-teal-950/40 cursor-pointer'
                        : isLocked
                        ? 'bg-zinc-950/40 border-zinc-900 text-zinc-600 cursor-not-allowed'
                        : 'bg-zinc-900/60 border-zinc-700 text-zinc-200 hover:border-teal-500/60 hover:bg-zinc-900 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                      <span>{ep.roomNumber}</span>
                      {isCompleted ? (
                        <CheckCircle className="w-3.5 h-3.5 text-teal-400" />
                      ) : isLocked ? (
                        <span>Locked</span>
                      ) : (
                        <span className="text-amber-400 animate-pulse">Active</span>
                      )}
                    </div>
                    <div className="text-xs font-bold font-title truncate">
                      {ep.title}
                    </div>
                    <div className="text-[10px] text-zinc-500 truncate mt-0.5">
                      {ep.subtitle}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : viewMode === 'room_explore' ? (
          /* Sally Face Style Room Exploration View with Door Swing Immersion */
          <div key={`room-explore-${activeEpisode.id}`} className="relative space-y-4 animate-door-swing">
            {/* Subtle doorway threshold shadow sweep on entry */}
            <div className="absolute inset-0 pointer-events-none rounded-2xl z-40 animate-doorway-sweep shadow-[inset_0_0_100px_rgba(0,0,0,0.85)]" />
            <RoomExplorationView
              episode={activeEpisode}
              onOpenConsole={() => {
                sound.playDoorOpen();
                setViewMode('puzzle');
              }}
              onOpenAlignBoy={() => setShowAlignBoy(true)}
              onReturnToHallway={() => {
                sound.playClick();
                setViewMode('hallway');
              }}
              onInspectObject={handleInspectObject}
            />
          </div>
        ) : (
          /* Machine Calibration Puzzle Terminal */
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2">
              <button
                onClick={() => {
                  sound.playClick();
                  setViewMode('room_explore');
                }}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-300 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                ◀ Step Away from Console
              </button>
              <div className="text-xs font-mono text-zinc-400 flex items-center gap-2">
                <span>Stuck? Click "Apply Hint" or open Larry's Walkie</span>
              </div>
            </div>

            <div className="bg-[#0b0e14] border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-2xl relative">
              {activeEpisodeId === 1 && (
                <Episode1Puzzle
                  onSolve={() => handleSolveEpisode(1)}
                  onOpenHints={() => setShowHints(true)}
                  onOpenWalkie={() => setShowLarryWalkie(true)}
                />
              )}
              {activeEpisodeId === 2 && (
                <Episode2Puzzle
                  onSolve={() => handleSolveEpisode(2)}
                  onOpenHints={() => setShowHints(true)}
                  onOpenWalkie={() => setShowLarryWalkie(true)}
                />
              )}
              {activeEpisodeId === 3 && (
                <Episode3Puzzle
                  onSolve={() => handleSolveEpisode(3)}
                  onOpenHints={() => setShowHints(true)}
                  onOpenWalkie={() => setShowLarryWalkie(true)}
                />
              )}
              {activeEpisodeId === 4 && (
                <Episode4Puzzle
                  onSolve={() => handleSolveEpisode(4)}
                  onOpenHints={() => setShowHints(true)}
                  onOpenWalkie={() => setShowLarryWalkie(true)}
                />
              )}
              {activeEpisodeId === 5 && (
                <Episode5Puzzle
                  onSolve={() => handleSolveEpisode(5)}
                  onOpenHints={() => setShowHints(true)}
                  onOpenWalkie={() => setShowLarryWalkie(true)}
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-900 py-4 px-6 text-center text-xs text-zinc-600 font-mono relative z-20">
        Echo Rooms: The Whispering Weights · A Sally Face-Inspired Psychological Mystery
      </footer>

      {/* Epistle Volume Card Modal */}
      <EpistleVolumeCard
        isOpen={epistleState.isOpen}
        episodeId={epistleState.episodeId}
        roomNumber={epistleState.roomNumber}
        volumeTitle={epistleState.volumeTitle}
        mysterySubtext={epistleState.mysterySubtext}
        unlockedRoomName={epistleState.unlockedRoomName}
        takeawayMessage={epistleState.takeawayMessage}
        onProceed={() => {
          const targetNextId = epistleState.nextEpisodeId;
          setEpistleState((prev) => ({ ...prev, isOpen: false }));
          if (epistleState.episodeId === 5) {
            setShowSanctuary(true);
          } else if (targetNextId) {
            sound.initCtx();
            sound.playDoorOpen();
            setEpisodes((prev) =>
              prev.map((ep) => (ep.id === targetNextId ? { ...ep, status: 'unlocked' } : ep))
            );
            setActiveEpisodeId(targetNextId);
            setViewMode('room_explore');
          } else {
            setViewMode('hallway');
          }
        }}
        onClose={() => {
          setEpistleState((prev) => ({ ...prev, isOpen: false }));
          setViewMode('hallway');
        }}
      />

      {/* Larry's Walkie-Talkie Transceiver */}
      <LarryWalkieModal
        isOpen={showLarryWalkie}
        onClose={() => setShowLarryWalkie(false)}
        activeEpisodeId={activeEpisodeId}
        onJumpToConsole={() => {
          setShowLarryWalkie(false);
          setViewMode('puzzle');
        }}
      />

      {/* How To Play Guide Modal */}
      <HowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
        onOpenWalkie={() => setShowLarryWalkie(true)}
      />

      {/* Align-Boy Handheld Scanner */}
      <AlignBoyDevice
        isOpen={showAlignBoy}
        onClose={() => setShowAlignBoy(false)}
        currentRoom={activeEpisode.roomNumber}
        activeEpisodeTitle={activeEpisode.title}
        onOpenPuzzle={() => {
          setShowAlignBoy(false);
          setViewMode('puzzle');
        }}
      />

      {/* Dr. Morrison's Casebook */}
      <CasebookModal
        isOpen={showCasebook}
        onClose={() => setShowCasebook(false)}
        caseFiles={caseFiles}
      />

      {/* Whisper Hint System */}
      <HintModal
        isOpen={showHints}
        onClose={() => setShowHints(false)}
        episodeTitle={`${activeEpisode.roomNumber}: ${activeEpisode.title}`}
        hints={activeEpisode.hints}
      />

      {/* Dialogue Modal */}
      <DialogueModal
        isOpen={dialogue.isOpen}
        speaker={dialogue.speaker}
        speakerTitle={dialogue.speakerTitle}
        text={dialogue.text}
        portraitSrc={dialogue.portraitSrc}
        choices={dialogue.choices}
        onClose={() => setDialogue((d) => ({ ...d, isOpen: false }))}
      />

      {/* Secret Sanctuary Modal */}
      <SecretSanctuaryModal
        isOpen={showSanctuary}
        onClose={() => setShowSanctuary(false)}
      />

      {/* "Look inside the machine" lesson for the current room */}
      {lesson.isOpen && (
        <LessonModal
          episodeId={activeEpisodeId}
          initialChapter={lesson.chapter}
          onClose={() => setLesson({ isOpen: false, chapter: 0 })}
          onGoToConsole={() => {
            setLesson({ isOpen: false, chapter: 0 });
            setViewMode('puzzle');
          }}
        />
      )}
    </div>
  );
}
