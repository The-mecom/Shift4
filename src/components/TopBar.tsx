/**
 * WordShift Top Navigation Bar
 * Follows the 3-Zone Top Bar Contract: Brand Wordmark | Mode Tabs | Quick Actions
 */

import React from 'react';
import { Volume2, VolumeX, Sparkles, HelpCircle } from 'lucide-react';
import { GameMode } from '../types/game';

interface TopBarProps {
  currentMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  effectsEnabled: boolean;
  onToggleEffects: () => void;
  onOpenRules: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentMode,
  onSelectMode,
  soundEnabled,
  onToggleSound,
  effectsEnabled,
  onToggleEffects,
  onOpenRules,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-[#0B0F17]/95 backdrop-blur border-b border-emerald-950/60 px-4 sm:px-6 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 md:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onSelectMode('CAMPAIGN')}
            className="flex items-center gap-2 text-left group cursor-pointer focus:outline-none"
          >
            <span className="font-terminal font-bold text-lg sm:text-xl tracking-wider text-emerald-400 group-hover:text-emerald-300 transition-colors">
              WORDSHIFT
            </span>
            <span className="hidden sm:inline-block text-[11px] font-mono tracking-widest px-1.5 py-0.5 rounded border border-emerald-500/30 text-emerald-500/80 bg-emerald-950/30">
              TERMINAL
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation Links / Mode Switcher */}
        <nav className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium">
          <button
            onClick={() => onSelectMode('CAMPAIGN')}
            className={`px-2.5 sm:px-3 py-1.5 rounded transition-all whitespace-nowrap cursor-pointer ${
              currentMode === 'CAMPAIGN'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            Campaign
          </button>
          <button
            onClick={() => onSelectMode('FREE_PLAY')}
            className={`px-2.5 sm:px-3 py-1.5 rounded transition-all whitespace-nowrap cursor-pointer ${
              currentMode === 'FREE_PLAY'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            Free Play
          </button>
          <button
            onClick={() => onSelectMode('DAILY')}
            className={`px-2.5 sm:px-3 py-1.5 rounded transition-all whitespace-nowrap cursor-pointer ${
              currentMode === 'DAILY'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            Daily
          </button>
          <button
            onClick={onOpenRules}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 transition-colors whitespace-nowrap cursor-pointer"
            title="Rules & How to Play"
            aria-label="Rules and Guide"
          >
            <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500/80" />
            <span className="hidden md:inline">Rules</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action & Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onToggleEffects}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              effectsEnabled
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-900/80 border-slate-800 text-slate-500'
            }`}
            title={effectsEnabled ? 'Disable CRT Scanlines' : 'Enable CRT Scanlines'}
            aria-label="Toggle CRT visual scanlines"
          >
            <Sparkles className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleSound}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-900/80 border-slate-800 text-slate-500'
            }`}
            title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
            aria-label="Toggle Sound Effects"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
