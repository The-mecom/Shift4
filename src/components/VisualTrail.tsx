/**
 * Interactive Visual Trail & Lexical Circuit Visualizer
 * Renders the linear step-by-step history from Start to Current Word, with Target at the end.
 * Highlights changed letters with phosphor glow AND an underline marker bar.
 * Clicking any prior node rewinds and truncates later steps for clean branching.
 */

import React, { useState } from 'react';
import { WordStep } from '../types/game';
import { RotateCcw, Target, Flag, Network, ListOrdered } from 'lucide-react';
import { getValidNeighbors } from '../data/graphSolver';

interface VisualTrailProps {
  trail: WordStep[];
  targetWord: string;
  isZeroOverlap: boolean;
  onRewindToStep: (stepIndex: number) => void;
  onSelectWordNeighbor?: (word: string) => void;
  isCompleted?: boolean;
}

export const VisualTrail: React.FC<VisualTrailProps> = ({
  trail,
  targetWord,
  isZeroOverlap,
  onRewindToStep,
  onSelectWordNeighbor,
  isCompleted = false,
}) => {
  const [viewMode, setViewMode] = useState<'LINEAR' | 'GRAPH'>('LINEAR');
  const currentStep = trail[trail.length - 1];

  // For graph view in Phase 7: get neighbors of the current active node
  const activeNeighbors = currentStep ? getValidNeighbors(currentStep.word, new Set(trail.map(t => t.word))) : [];

  return (
    <div className="w-full bg-[#0F172A]/90 border border-emerald-950/80 rounded-xl p-4 sm:p-5 flex flex-col h-full shadow-lg">
      {/* Trail Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="font-terminal text-xs tracking-wider uppercase text-emerald-400 font-bold">
            Visual Trail Path
          </span>
          <span className="text-[11px] font-mono text-slate-400 tabular-nums">
            [{trail.length - 1} {trail.length - 1 === 1 ? 'move' : 'moves'}]
          </span>
        </div>

        {/* View Mode Toggle (Phase 7: Linear vs Cluster Graph) */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setViewMode('LINEAR')}
            className={`p-1.5 rounded transition-all cursor-pointer ${
              viewMode === 'LINEAR'
                ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-500/30 shadow-xs'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Linear Circuit Trail"
            aria-label="Linear Circuit Trail"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('GRAPH')}
            className={`p-1.5 rounded transition-all cursor-pointer ${
              viewMode === 'GRAPH'
                ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-500/30 shadow-xs'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Neighborhood Cluster Explorer (Phase 7)"
            aria-label="Neighborhood Cluster Explorer"
          >
            <Network className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {viewMode === 'LINEAR' ? (
        /* Linear Trail View */
        <div className="flex-1 overflow-y-auto pr-1 space-y-0.5 max-h-[520px]">
          {trail.map((step, idx) => {
            const isStart = idx === 0;
            const isCurrent = idx === trail.length - 1;
            const letters = step.word.split('');

            return (
              <div key={`${step.word}-${idx}`} className="relative group">
                {/* Connecting Laser Beam Line */}
                {idx > 0 && (
                  <div className="relative pl-6 py-1">
                    <div className="w-0.5 h-4 bg-emerald-500/40 mx-auto -ml-3 animate-trail-pulse" />
                  </div>
                )}

                {/* Node Box */}
                <div
                  onClick={() => {
                    if (!isCurrent) {
                      onRewindToStep(idx);
                    }
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                    isCurrent
                      ? 'bg-emerald-950/40 border-emerald-500/60 shadow-sm shadow-emerald-950/50 ring-1 ring-emerald-500/30'
                      : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/60 hover:border-emerald-500/40 cursor-pointer'
                  }`}
                  role={!isCurrent ? 'button' : undefined}
                  tabIndex={!isCurrent ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (!isCurrent && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      onRewindToStep(idx);
                    }
                  }}
                  title={!isCurrent ? `Rewind to step ${idx} (${step.word})` : 'Current active word'}
                >
                  {/* Step Indicator & Word Tiles */}
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-semibold tabular-nums text-slate-500 w-5 shrink-0">
                      {isStart ? 'S' : idx}
                    </span>

                    {/* Word Character Display */}
                    <div className="flex items-center gap-1">
                      {letters.map((char, charIdx) => {
                        const isChanged = charIdx === step.changedIndex;
                        return (
                          <div
                            key={charIdx}
                            className={`relative flex flex-col items-center justify-center w-8 h-9 sm:w-9 sm:h-10 rounded font-terminal font-bold text-sm sm:text-base border transition-colors ${
                              isChanged
                                ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300 shadow-xs'
                                : isCurrent
                                ? 'bg-slate-900/80 border-slate-700 text-slate-100'
                                : 'bg-slate-950/60 border-slate-800 text-slate-300'
                            }`}
                          >
                            <span>{char}</span>
                            {/* Changed letter dual-coded marker bar (underline) */}
                            {isChanged && (
                              <div
                                className="absolute bottom-1 w-4 h-0.5 bg-emerald-400 rounded-full"
                                aria-label="Changed letter"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions / Status Badges */}
                  <div className="flex items-center gap-2">
                    {isStart && (
                      <span className="text-[10px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded border border-slate-700 text-slate-400">
                        START
                      </span>
                    )}

                    {isCurrent && !isCompleted && (
                      <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded border border-emerald-500/50 bg-emerald-950/60 text-emerald-300 font-bold">
                        ACTIVE
                      </span>
                    )}

                    {!isCurrent && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRewindToStep(idx);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-emerald-300 p-1 rounded hover:bg-slate-700/60 transition-all cursor-pointer"
                        title="Rewind here and branch"
                        aria-label={`Rewind to ${step.word}`}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Dashed Connector to Target Word */}
          {!isCompleted && (
            <div className="relative pl-6 py-2">
              <div className="w-0.5 h-6 border-l-2 border-dashed border-amber-500/50 mx-auto -ml-3" />
            </div>
          )}

          {/* Goal / Target Word Node (Strict Amber Theme Token) */}
          <div className="mt-2 p-2.5 rounded-lg border border-amber-500/40 bg-amber-950/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="flex items-center gap-1">
                {targetWord.split('').map((char, cIdx) => (
                  <div
                    key={cIdx}
                    className="flex items-center justify-center w-8 h-9 sm:w-9 sm:h-10 rounded font-terminal font-bold text-sm sm:text-base border border-amber-500/50 bg-amber-950/40 text-amber-300"
                  >
                    {char}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded border border-amber-500/50 bg-amber-950/60 text-amber-300 font-bold">
                TARGET
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Cluster Graph Mini-Map View (Phase 7) */
        <div className="flex-1 overflow-y-auto space-y-3 max-h-[520px] text-xs font-mono">
          <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
            <div className="text-slate-400 mb-2">
              Current Node: <span className="text-emerald-300 font-bold">{currentStep?.word}</span>
            </div>
            <div className="text-slate-400 mb-2">
              Available 1-Letter Neighbors ({activeNeighbors.length}):
            </div>
            {activeNeighbors.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {activeNeighbors.map((neighbor) => (
                  <button
                    key={neighbor}
                    onClick={() => onSelectWordNeighbor && onSelectWordNeighbor(neighbor)}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-emerald-950/80 border border-slate-700 hover:border-emerald-500/50 text-slate-200 hover:text-emerald-300 transition-colors cursor-pointer"
                  >
                    {neighbor}
                  </button>
                ))}
              </div>
            ) : (
              <span className="text-slate-500 italic">No remaining unvisited branches</span>
            )}
          </div>

          <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 text-slate-400">
            <div className="text-amber-400 font-bold mb-1 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" /> Target Objective: {targetWord}
            </div>
            <div>
              Status: {isZeroOverlap ? 'Zero-Overlap Rift (No shared letters)' : 'Overlapping letters present'}
            </div>
          </div>
        </div>
      )}

      {/* Trail Footer Note */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Click earlier node to rewind & branch</span>
        <span className="text-emerald-500/80 font-mono">Zero Move Penalty</span>
      </div>
    </div>
  );
};
