/**
 * Gameplay Assist Helpers & Terminal HUD Controls
 * Includes Next Valid Words Drawer, BFS Shortest Path Hint, and Surrender Solution Modal.
 */

import React, { useState } from 'react';
import { Lightbulb, ChevronDown, ChevronUp, Flag, RotateCcw, Zap, Sparkles } from 'lucide-react';
import { sound } from '../services/audioEngine';

interface HelperDrawersProps {
  currentWord: string;
  targetWord: string;
  validNeighbors: string[];
  moves: number;
  par: number;
  isHintUsed: boolean;
  onSelectWordNeighbor: (word: string) => void;
  onRequestHint: () => void;
  onUndoLastMove: () => void;
  onSurrender: () => void;
  canUndo: boolean;
}

export const HelperDrawers: React.FC<HelperDrawersProps> = ({
  currentWord,
  targetWord,
  validNeighbors,
  moves,
  par,
  isHintUsed,
  onSelectWordNeighbor,
  onRequestHint,
  onUndoLastMove,
  onSurrender,
  canUndo,
}) => {
  const [isNeighborDrawerOpen, setIsNeighborDrawerOpen] = useState(false);
  const [showSurrenderConfirm, setShowSurrenderConfirm] = useState(false);

  return (
    <div className="w-full flex flex-col gap-3">
      {/* HUD Stats Bar: Moves, Par, Hints */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-[10px] font-mono tracking-wider uppercase text-slate-400">Moves</div>
            <div className="font-terminal text-lg sm:text-xl font-bold text-slate-100 tabular-nums">
              {moves}
            </div>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div>
            <div className="text-[10px] font-mono tracking-wider uppercase text-cyan-400 flex items-center gap-1">
              <span>Par</span>
              <span className="text-[9px] text-cyan-500/70">(Min)</span>
            </div>
            <div className="font-terminal text-lg sm:text-xl font-bold text-cyan-300 tabular-nums">
              {par}
            </div>
          </div>
        </div>

        {/* Action Buttons: Undo, Hint, Surrender */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Undo Button (Free, reduces moves) */}
          <button
            onClick={() => {
              sound.playRewindUndo();
              onUndoLastMove();
            }}
            disabled={!canUndo}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            title="Undo last move (zero penalty)"
            aria-label="Undo last move"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Undo</span>
          </button>

          {/* BFS Hint Button (Caps stars at 2) */}
          <button
            onClick={() => {
              sound.playHint();
              onRequestHint();
            }}
            className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
              isHintUsed
                ? 'border-cyan-500/40 bg-cyan-950/40 text-cyan-300'
                : 'border-cyan-500/50 bg-cyan-950/20 text-cyan-400 hover:bg-cyan-950/40'
            }`}
            title="Reveal next word on shortest path (caps score at 2 stars)"
            aria-label="Request path hint"
          >
            <Lightbulb className="w-3.5 h-3.5 text-cyan-400" />
            <span>Hint</span>
            {isHintUsed && <span className="text-[10px] text-cyan-300/80">(Used)</span>}
          </button>

          {/* Surrender Button */}
          <button
            onClick={() => setShowSurrenderConfirm(true)}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg border border-red-500/30 bg-red-950/20 text-red-400 hover:bg-red-950/40 text-xs transition-colors cursor-pointer"
            title="Surrender and reveal optimal path"
            aria-label="Surrender attempt"
          >
            <Flag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Surrender</span>
          </button>
        </div>
      </div>

      {/* Next Valid Words Collapsible Drawer */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <button
          onClick={() => setIsNeighborDrawerOpen(!isNeighborDrawerOpen)}
          className="w-full flex items-center justify-between p-2.5 sm:p-3 text-left hover:bg-slate-800/40 transition-colors cursor-pointer"
          aria-expanded={isNeighborDrawerOpen}
        >
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-mono font-medium text-slate-300">
              Valid Next Words ({validNeighbors.length})
            </span>
          </div>
          {isNeighborDrawerOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {isNeighborDrawerOpen && (
          <div className="p-3 border-t border-slate-800/80 bg-slate-950/50 max-h-48 overflow-y-auto">
            {validNeighbors.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {validNeighbors.map((w) => (
                  <button
                    key={w}
                    onClick={() => {
                      sound.playKeyClick();
                      onSelectWordNeighbor(w);
                    }}
                    className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700/80 hover:border-emerald-500/60 hover:bg-emerald-950/40 text-slate-200 hover:text-emerald-300 font-terminal text-xs transition-colors cursor-pointer"
                  >
                    {w}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-xs font-mono text-slate-500 italic">
                No unvisited single-letter words reachable from {currentWord}. Try rewinding or undoing!
              </div>
            )}
          </div>
        )}
      </div>

      {/* Surrender Confirmation Dialog */}
      {showSurrenderConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-xl border border-red-500/40 bg-slate-900 p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-2 text-red-400 font-terminal text-sm font-bold">
              <Flag className="w-4 h-4" />
              <span>Surrender Attempt?</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Surrendering reveals the complete optimal path and ends this run with 0 stars. The stage
              will remain uncompleted so you can retry anytime.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSurrenderConfirm(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowSurrenderConfirm(false);
                  onSurrender();
                }}
                className="px-3 py-1.5 rounded-lg bg-red-950/80 border border-red-500 text-red-200 hover:bg-red-900 text-xs font-semibold transition-colors cursor-pointer"
              >
                Reveal Solution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
