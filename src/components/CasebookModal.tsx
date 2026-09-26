import React, { useState } from 'react';
import { CaseFile } from '../types/game';
import { sound } from '../services/sound';
import { BookOpen, X, CheckCircle2, Lock, FileText, Bookmark } from 'lucide-react';

interface CasebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseFiles: CaseFile[];
}

export const CasebookModal: React.FC<CasebookModalProps> = ({
  isOpen,
  onClose,
  caseFiles,
}) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(
    caseFiles.find((c) => c.unlocked)?.id || caseFiles[0]?.id || ''
  );

  if (!isOpen) return null;

  const currentCase = caseFiles.find((c) => c.id === selectedCaseId) || caseFiles[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-4xl bg-[#0f141c] border border-zinc-700/80 rounded-xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        {/* Header */}
        <div className="p-4 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-950/80 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-title text-zinc-100 text-lg font-bold">
                The Addison Investigation Casebook
              </h2>
              <p className="text-xs text-zinc-400">
                Dr. Morrison’s classified field notes & anomaly logs
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-md hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Left sidebar (list of cases) & Right content (case details) */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Case file list */}
          <div className="w-full md:w-72 bg-zinc-950/70 border-r border-zinc-800 p-3 space-y-1.5 overflow-y-auto">
            <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 px-2 py-1">
              Field Reports
            </div>
            {caseFiles.map((caseFile) => {
              const isSelected = caseFile.id === selectedCaseId;
              return (
                <button
                  key={caseFile.id}
                  onClick={() => {
                    sound.playClick();
                    setSelectedCaseId(caseFile.id);
                  }}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-zinc-800 border-teal-500/60 text-zinc-100'
                      : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                  }`}
                >
                  <div className="mt-0.5">
                    {caseFile.unlocked ? (
                      <CheckCircle2 className="w-4 h-4 text-teal-400" />
                    ) : (
                      <Lock className="w-4 h-4 text-zinc-600" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold truncate">
                      {caseFile.title}
                    </div>
                    <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                      {caseFile.subtitle}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Case Detail View */}
          <div className="flex-1 p-6 overflow-y-auto bg-[#0b0e14]">
            {currentCase ? (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-teal-400 mb-1">
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Dossier File: #{currentCase.id.toUpperCase()}</span>
                    <span>·</span>
                    <span>Episode {currentCase.episodeId}</span>
                  </div>
                  <h3 className="font-title text-2xl font-bold text-zinc-100">
                    {currentCase.title}
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    Subject: {currentCase.conceptName}
                  </p>
                </div>

                {/* Status banner */}
                <div
                  className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                    currentCase.unlocked
                      ? 'bg-teal-950/30 border-teal-500/40 text-teal-200'
                      : 'bg-amber-950/20 border-amber-600/30 text-amber-200'
                  }`}
                >
                  <span>
                    Status:{' '}
                    <strong>
                      {currentCase.unlocked
                        ? 'DECRYPTED & RESOLVED'
                        : 'ACTIVE ANOMALY / UNRESOLVED'}
                    </strong>
                  </span>
                  <span className="font-mono text-[11px]">
                    {currentCase.unlocked ? 'Clearance Level Alpha' : 'Requires Episode Solution'}
                  </span>
                </div>

                {/* Incident Log */}
                <div className="space-y-2">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-teal-400" />
                    Laboratory Incident Log
                  </h4>
                  <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 text-sm text-zinc-300 font-sans leading-relaxed italic">
                    "{currentCase.incidentLog}"
                  </div>
                </div>

                {/* Core Principles & In-World Lessons */}
                <div className="space-y-2">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                    Field Observations & Core Lessons
                  </h4>
                  <div className="space-y-2.5">
                    {currentCase.educationalTakeaway.map((takeaway, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-lg bg-zinc-900/90 border border-zinc-800/80 text-xs sm:text-sm text-zinc-300 leading-relaxed flex items-start gap-2.5"
                      >
                        <span className="text-teal-400 font-bold font-mono">0{i + 1}.</span>
                        <span>{takeaway}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Laboratory Archive source */}
                <div className="pt-4 border-t border-zinc-800 text-xs text-zinc-500">
                  <div className="font-semibold text-zinc-400 mb-1">
                    Laboratory Archive Source:
                  </div>
                  <div className="font-mono text-teal-400/90">
                    {currentCase.realWorldPaper}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-zinc-500 text-sm">Select a case file to view.</div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-zinc-900/90 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500 font-mono">
          <span>Addison Scientific Archive // Division of Cybernetic Systems</span>
          <span>Press ESC or Close to return</span>
        </div>
      </div>
    </div>
  );
};
