/**
 * Rules and Game Guide Modal
 * Explains Doublets mechanics, Zero-Overlap Rift definitions, scoring tiers, and input instructions.
 */

import React from 'react';
import { X, HelpCircle, Zap, Star, RotateCcw, Keyboard } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-emerald-500/40 bg-[#0F172A] p-6 shadow-2xl flex flex-col gap-5 text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-emerald-400" />
            <h2 className="font-terminal text-lg sm:text-xl font-bold text-slate-100">
              TERMINAL PROTOCOL // HOW TO PLAY
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close rules"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Objective */}
        <div className="flex flex-col gap-1.5 text-xs sm:text-sm">
          <h3 className="font-terminal font-bold text-emerald-400 text-sm">
            01. THE OBJECTIVE (DOUBLETS)
          </h3>
          <p className="text-slate-300 leading-relaxed">
            Morph the <strong>Start Word</strong> into the <strong>Target Word</strong> by altering{' '}
            <span className="text-emerald-300 font-semibold">exactly one letter at a time</span>. Every intermediate
            step must form a legitimate, recognized English word. Word lengths scale from 2 to 7 letters.
          </p>
        </div>

        {/* Section 2: Zero-Overlap Rifts */}
        <div className="flex flex-col gap-1.5 text-xs sm:text-sm p-3.5 rounded-xl border border-purple-500/30 bg-purple-950/20">
          <h3 className="font-terminal font-bold text-purple-300 text-sm flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-purple-400" />
            <span>02. ZERO-OVERLAP RIFTS</span>
          </h3>
          <p className="text-slate-300 leading-relaxed">
            When the Start Word and Target Word share <strong>zero letters in common</strong> (e.g.{' '}
            <code className="text-purple-300 bg-purple-950/60 px-1 py-0.5 rounded">COLD → WARM</code> or{' '}
            <code className="text-purple-300 bg-purple-950/60 px-1 py-0.5 rounded">BLACK → WHITE</code>), the
            puzzle is designated as a <strong>Zero-Overlap Rift</strong>. These require complete phonetic and
            alphabetic transmigration and require at least N moves for an N-letter word!
          </p>
        </div>

        {/* Section 3: Scoring & Par */}
        <div className="flex flex-col gap-1.5 text-xs sm:text-sm">
          <h3 className="font-terminal font-bold text-cyan-400 text-sm flex items-center gap-1.5">
            <Star className="w-4 h-4 text-amber-400" />
            <span>03. PAR & STAR RATINGS</span>
          </h3>
          <p className="text-slate-300 leading-relaxed">
            <strong>Par</strong> is the mathematically guaranteed shortest path calculated via Breadth-First Search (BFS)
            on the full validation graph. You can never beat Par.
          </p>
          <ul className="space-y-1 mt-1 text-slate-300 font-mono text-xs">
            <li>• <strong className="text-amber-400">3 Stars (⭐⭐⭐)</strong>: Moves == Par (Optimal path)</li>
            <li>• <strong className="text-amber-400">2 Stars (⭐⭐)</strong>: Moves == Par + 1 or Par + 2 (or if a Hint was used)</li>
            <li>• <strong className="text-amber-400">1 Star (⭐)</strong>: Any other valid completion</li>
            <li>• <strong className="text-slate-400">0 Stars</strong>: Surrendered run (optimal path revealed)</li>
          </ul>
        </div>

        {/* Section 4: Interactive Trail & Branching */}
        <div className="flex flex-col gap-1.5 text-xs sm:text-sm">
          <h3 className="font-terminal font-bold text-emerald-400 text-sm flex items-center gap-1.5">
            <RotateCcw className="w-4 h-4" />
            <span>04. VISUAL TRAIL & ZERO-PENALTY REWIND</span>
          </h3>
          <p className="text-slate-300 leading-relaxed">
            Your moves are mapped on the illuminated circuit trail. Clicking any previous node rewinds the board to that
            step and truncates subsequent steps so you can branch into a new direction. <strong>Undo and rewinding carry
            zero penalty</strong> and reduce your move counter!
          </p>
        </div>

        {/* Section 5: Controls */}
        <div className="flex flex-col gap-1.5 text-xs sm:text-sm">
          <h3 className="font-terminal font-bold text-slate-200 text-sm flex items-center gap-1.5">
            <Keyboard className="w-4 h-4 text-slate-400" />
            <span>05. CONTROLS</span>
          </h3>
          <p className="text-slate-300 leading-relaxed">
            • <strong>Select Slot</strong>: Tap any letter slot in the active word.<br />
            • <strong>Change Letter</strong>: Type a letter on your keyboard or tap the on-screen retro keys.<br />
            • <strong>Navigate</strong>: Left/Right Arrow keys navigate slots. Esc or Backspace deselects.<br />
            • <strong>Auto-Validation</strong>: Moves commit immediately when valid. Invalid attempts display inline error feedback and revert.
          </p>
        </div>

        {/* Close Button */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500 text-emerald-200 font-terminal text-xs font-bold transition-colors cursor-pointer"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
