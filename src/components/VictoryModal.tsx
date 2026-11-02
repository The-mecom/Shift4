/**
 * Victory Terminal Readout Modal
 * Displays final moves vs par, star scoring (1-3 stars), optimal efficiency message, and action buttons.
 */

import React from 'react';
import { Star, Trophy, ArrowRight, RotateCcw, Grid, Zap } from 'lucide-react';
import { WordStep } from '../types/game';

interface VictoryModalProps {
  startWord: string;
  targetWord: string;
  moves: number;
  par: number;
  stars: number;
  isHintUsed: boolean;
  isZeroOverlap: boolean;
  trail: WordStep[];
  hasNextStage: boolean;
  onNextStage: () => void;
  onRetry: () => void;
  onBackToMenu: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  startWord,
  targetWord,
  moves,
  par,
  stars,
  isHintUsed,
  isZeroOverlap,
  trail,
  hasNextStage,
  onNextStage,
  onRetry,
  onBackToMenu,
}) => {
  // Generate efficiency message
  let message = `Solved in ${moves} moves!`;
  if (moves === par) {
    message = `Optimal path matched: ${moves} / ${par} moves!`;
  } else if (moves <= par + 2) {
    message = `Near-optimal solution: ${moves} moves (Par: ${par})`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl border border-emerald-500/50 bg-[#0F172A] p-6 sm:p-7 shadow-2xl flex flex-col items-center text-center gap-5 relative overflow-hidden">
        {/* Glow ambient background accent */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Title & Badge */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold tracking-widest uppercase text-emerald-400">
            <Trophy className="w-4 h-4 text-emerald-400" />
            <span>TRANSMISSION COMPLETE</span>
          </div>

          <h2 className="font-terminal text-2xl sm:text-3xl font-bold text-slate-100">
            {startWord} <span className="text-slate-500">→</span> <span className="text-amber-400">{targetWord}</span>
          </h2>

          {isZeroOverlap && (
            <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-purple-300 bg-purple-950/60 border border-purple-500/40 px-2.5 py-0.5 rounded-full mt-1">
              <Zap className="w-3 h-3 text-purple-400" />
              <span>ZERO-OVERLAP RIFT BRIDGED</span>
            </div>
          )}
        </div>

        {/* Stars Display */}
        <div className="flex items-center gap-2 py-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`p-2 rounded-xl border transition-all ${
                s <= stars
                  ? 'border-amber-400/60 bg-amber-950/30 text-amber-300 scale-105 shadow-sm shadow-amber-500/20'
                  : 'border-slate-800 bg-slate-900/60 text-slate-600'
              }`}
            >
              <Star className={`w-7 h-7 sm:w-8 sm:h-8 ${s <= stars ? 'fill-amber-400 text-amber-400' : ''}`} />
            </div>
          ))}
        </div>

        {/* Efficiency Message & Par Breakdown */}
        <div className="w-full bg-slate-900/90 rounded-xl border border-slate-800 p-3.5 flex flex-col gap-2">
          <div className="font-mono text-sm font-semibold text-emerald-300">
            {message}
          </div>

          <div className="flex items-center justify-around pt-2 border-t border-slate-800/80 text-xs font-mono">
            <div>
              <span className="text-slate-400">Moves: </span>
              <strong className="text-slate-100 font-bold tabular-nums">{moves}</strong>
            </div>
            <div>
              <span className="text-slate-400">Par: </span>
              <strong className="text-cyan-300 font-bold tabular-nums">{par}</strong>
            </div>
            {isHintUsed && (
              <div className="text-cyan-400 text-[11px]">
                <span>Hint used (Max 2★)</span>
              </div>
            )}
          </div>
        </div>

        {/* Path Taken Summary */}
        <div className="w-full text-left bg-slate-950/70 p-3 rounded-lg border border-slate-800/80 text-xs font-mono">
          <div className="text-slate-400 text-[10px] uppercase mb-1">Your Path ({trail.length - 1} steps):</div>
          <div className="flex flex-wrap gap-1 text-slate-200">
            {trail.map((t, idx) => (
              <React.Fragment key={idx}>
                <span className={idx === trail.length - 1 ? 'text-amber-400 font-bold' : idx === 0 ? 'text-emerald-400 font-bold' : ''}>
                  {t.word}
                </span>
                {idx < trail.length - 1 && <span className="text-slate-600">→</span>}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex items-center justify-between gap-2 pt-2">
          <button
            onClick={onBackToMenu}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Sectors</span>
          </button>

          <button
            onClick={onRetry}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>

          {hasNextStage && (
            <button
              onClick={onNextStage}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-500 text-emerald-200 text-xs font-terminal font-bold transition-all shadow-md cursor-pointer"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
