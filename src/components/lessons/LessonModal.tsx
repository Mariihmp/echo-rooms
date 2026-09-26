import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, MousePointerClick, Terminal, X } from 'lucide-react';
import { sound } from '../../services/sound';
import { LESSONS } from './index';

interface LessonModalProps {
  episodeId: number;
  initialChapter?: number;
  onClose: () => void;
  onGoToConsole: () => void;
}

export const LessonModal: React.FC<LessonModalProps> = ({ episodeId, initialChapter = 0, onClose, onGoToConsole }) => {
  const lesson = LESSONS[episodeId];
  const lastChapter = lesson ? lesson.chapters.length - 1 : 0;
  const [chapter, setChapter] = useState(() => Math.min(Math.max(initialChapter, 0), lastChapter));

  const goTo = useCallback(
    (next: number) => {
      if (next < 0 || next > lastChapter) return;
      sound.playGearBoyBeep(next > chapter ? 620 : 480, 0.05);
      setChapter(next);
    },
    [chapter, lastChapter]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') goTo(chapter + 1);
      else if (e.key === 'ArrowLeft') goTo(chapter - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [chapter, goTo, onClose]);

  if (!lesson) return null;

  const { Stage, accent } = lesson;
  const current = lesson.chapters[chapter];
  const isLast = chapter === lastChapter;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-2 backdrop-blur-md sm:p-6 animate-lesson-in">
      <div className="relative flex h-full max-h-[800px] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#07080d] shadow-2xl">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4 border-b border-white/6 px-5 py-3.5">
          <div className="min-w-0">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: accent }}>
              {lesson.reel} · {lesson.narrator}
            </div>
            <div className="mt-0.5 flex items-baseline gap-3">
              <h2 className="truncate font-title text-lg font-bold text-zinc-100">{lesson.title}</h2>
              <span className="hidden truncate text-xs text-zinc-500 md:inline">{lesson.subtitle}</span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-4">
            <div className="hidden items-center gap-1.5 sm:flex">
              {lesson.chapters.map((c, i) => (
                <button
                  key={c.title}
                  onClick={() => goTo(i)}
                  title={c.title}
                  className="h-1.5 cursor-pointer rounded-full transition-all duration-300"
                  style={{
                    width: i === chapter ? 28 : 10,
                    background: i === chapter ? accent : i < chapter ? `${accent}80` : '#3f3f46',
                  }}
                />
              ))}
            </div>
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              title="Close (Esc)"
              className="cursor-pointer rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body: interactive stage + story */}
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <div className="relative h-[48vh] shrink-0 border-b border-white/6 lg:h-auto lg:min-w-0 lg:flex-1 lg:border-b-0 lg:border-r">
            <Stage chapter={chapter} />
          </div>

          <aside className="flex min-h-0 w-full flex-1 flex-col lg:w-[360px] lg:flex-none xl:w-[400px]">
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-7">
              <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                Chapter {chapter + 1} of {lesson.chapters.length}
              </div>
              <div key={chapter} className="animate-lesson-text">
                <h3 className="mt-2 font-title text-2xl font-bold leading-snug text-zinc-50">{current.title}</h3>
                <div className="mt-4 space-y-3.5 text-[15px] leading-relaxed text-zinc-300">
                  {current.body.split('\n\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
                {current.tryIt && (
                  <div
                    className="mt-6 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-relaxed text-zinc-200"
                    style={{ borderColor: `${accent}55`, background: `${accent}10` }}
                  >
                    <MousePointerClick className="mt-0.5 h-4 w-4 shrink-0" style={{ color: accent }} />
                    <span>{current.tryIt}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-white/6 px-6 py-4 sm:px-7">
              <button
                onClick={() => goTo(chapter - 1)}
                disabled={chapter === 0}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100 disabled:cursor-default disabled:opacity-0"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              {isLast ? (
                <button
                  onClick={() => {
                    sound.playDoorOpen();
                    onGoToConsole();
                  }}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-black transition-all hover:brightness-110"
                  style={{ background: accent }}
                >
                  <Terminal className="h-4 w-4" />
                  Take it to the console
                </button>
              ) : (
                <button
                  onClick={() => goTo(chapter + 1)}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-white/5"
                  style={{ borderColor: `${accent}66` }}
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
