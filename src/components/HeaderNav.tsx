import React, { useCallback, useRef, useState } from 'react';
import { sound } from '../services/sound';
import { useDismiss } from '../hooks/useDismiss';
import { MoreHorizontal, Volume2, VolumeX } from 'lucide-react';

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
  // Room label (e.g. "Room 101") while the player is inside a room
  location?: string;
  inConsole: boolean;
  onReturnToHallway: () => void;
  onReturnToRoom: () => void;
}

const MenuItem: React.FC<{ onClick: () => void; danger?: boolean; hint?: string; children: React.ReactNode }> = ({
  onClick,
  danger = false,
  hint,
  children,
}) => (
  <button
    onClick={onClick}
    className={`flex w-full cursor-pointer items-center justify-between px-3.5 py-2 text-left text-[13px] transition-colors hover:bg-white/5 ${
      danger ? 'text-rose-300/90 hover:text-rose-200' : 'text-zinc-300 hover:text-zinc-50'
    }`}
  >
    <span>{children}</span>
    {hint && <span className="font-mono text-[11px] text-zinc-500">{hint}</span>}
  </button>
);

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
  location,
  inConsole,
  onReturnToHallway,
  onReturnToRoom,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  useDismiss(menuRef, menuOpen, closeMenu);

  const links = [
    { label: 'Guide', onClick: onOpenHowToPlay, sfx: () => sound.playClick() },
    { label: 'Walkie', onClick: onTalkToLarry, sfx: () => sound.playWalkieSquelch() },
    { label: 'Align-Boy', onClick: onOpenAlignBoy, sfx: () => sound.playGearBoyBeep(640, 0.08) },
    { label: 'Casebook', onClick: onOpenCasebook, sfx: () => sound.playClick() },
  ];

  const runFromMenu = (action: () => void) => {
    setMenuOpen(false);
    action();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#07090e]/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
        {/* Title + where you are */}
        <div className="flex min-w-0 items-center gap-4">
          <span className="shrink-0 whitespace-nowrap font-title text-[15px] font-bold tracking-[0.2em] text-zinc-100">
            ECHO ROOMS
          </span>
          <span className="h-4 w-px shrink-0 bg-white/10" />
          {location ? (
            <nav className="flex min-w-0 items-center gap-2 whitespace-nowrap font-mono text-xs">
              <button
                onClick={() => {
                  sound.playClick();
                  onReturnToHallway();
                }}
                className="cursor-pointer text-zinc-500 transition-colors hover:text-zinc-200"
              >
                Hallway
              </button>
              <span className="text-zinc-700">/</span>
              {inConsole ? (
                <>
                  <button
                    onClick={onReturnToRoom}
                    className="cursor-pointer truncate text-zinc-500 transition-colors hover:text-zinc-200"
                  >
                    {location}
                  </button>
                  <span className="text-zinc-700">/</span>
                  <span className="text-teal-300">Console</span>
                </>
              ) : (
                <span className="truncate text-teal-300">{location}</span>
              )}
            </nav>
          ) : (
            <span className="truncate font-mono text-xs text-zinc-500">The Whispering Weights</span>
          )}
        </div>

        {/* Navigation */}
        <div className="flex shrink-0 items-center gap-1">
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <button
                key={link.label}
                onClick={() => {
                  link.sfx();
                  link.onClick();
                }}
                className="cursor-pointer whitespace-nowrap rounded-md px-3 py-1.5 text-[13px] text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100"
              >
                {link.label}
              </button>
            ))}
          </nav>

          <span className="mx-2 hidden h-4 w-px bg-white/10 md:block" />

          <button
            onClick={() => {
              sound.playClick();
              onToggleMute();
            }}
            title={isMuted ? 'Unmute' : 'Mute'}
            className="cursor-pointer rounded-md p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>

          <div ref={menuRef} className="relative">
            <button
              onClick={() => {
                sound.playClick();
                setMenuOpen((open) => !open);
              }}
              title="More"
              aria-expanded={menuOpen}
              className={`cursor-pointer rounded-md p-2 transition-colors hover:bg-white/5 hover:text-zinc-100 ${
                menuOpen ? 'bg-white/5 text-zinc-100' : 'text-zinc-400'
              }`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {menuOpen && (
              <div className="animate-lesson-text absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#0c0f16]/95 py-1.5 shadow-2xl backdrop-blur-md">
                <div className="md:hidden">
                  {links.map((link) => (
                    <MenuItem
                      key={link.label}
                      onClick={() =>
                        runFromMenu(() => {
                          link.sfx();
                          link.onClick();
                        })
                      }
                    >
                      {link.label}
                    </MenuItem>
                  ))}
                  <div className="my-1.5 h-px bg-white/5" />
                </div>
                <MenuItem onClick={onToggleCrt} hint={crtEnabled ? 'On' : 'Off'}>
                  CRT scanlines
                </MenuItem>
                <MenuItem
                  danger
                  onClick={() =>
                    runFromMenu(() => {
                      if (window.confirm('Reset game investigation progress?')) onResetProgress();
                    })
                  }
                >
                  Reset progress
                </MenuItem>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
