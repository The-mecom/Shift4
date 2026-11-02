/**
 * Daily Terminal Transmission & Player Records Dossier (Phase 6)
 * Deterministic daily challenge seeded by current UTC date.
 * Lifetime terminal statistics and shareable retro arcade ASCII clipboard card.
 */

import React, { useState } from 'react';
import { PlayerProgress } from '../services/storageService';
import { ActivePuzzle } from '../types/game';
import { PUZZLE_LEXICON } from '../data/puzzleLexicon';
import { findShortestPath, getLetterOverlap } from '../data/graphSolver';
import { Calendar, Trophy, Flame, Zap, Share2, Check, Play, Star } from 'lucide-react';
import { sound } from '../services/audioEngine';

interface DailyViewProps {
  progress: PlayerProgress;
  onStartDailyPuzzle: (puzzle: ActivePuzzle) => void;
}

export const DailyView: React.FC<DailyViewProps> = ({ progress, onStartDailyPuzzle }) => {
  const [copied, setCopied] = useState<boolean>(false);

  // Get UTC Date Key: YYYY-MM-DD
  const now = new Date();
  const dateKey = now.toISOString().slice(0, 10);
  const dailyRecord = progress.dailyHistory[dateKey];

  // Deterministically generate today's puzzle using simple hash
  const generateDailyPuzzle = (): ActivePuzzle => {
    let hash = 0;
    for (let i = 0; i < dateKey.length; i++) {
      hash = (hash << 5) - hash + dateKey.charCodeAt(i);
      hash |= 0;
    }
    const absHash = Math.abs(hash);

    // Rotate lengths: 3, 4, 5, 4, 5, 6, 3 ...
    const lengths = [3, 4, 5, 4, 5, 6, 4];
    const targetLength = lengths[absHash % lengths.length];
    const words = PUZZLE_LEXICON[targetLength] || PUZZLE_LEXICON[4];

    // Pick deterministic indices
    const idx1 = absHash % words.length;
    let idx2 = (absHash * 7 + 13) % words.length;
    if (idx1 === idx2) idx2 = (idx2 + 1) % words.length;

    let w1 = words[idx1];
    let w2 = words[idx2];
    let bfsRes = findShortestPath(w1, w2);

    // Fallback if not connected
    if (!bfsRes) {
      w1 = targetLength === 3 ? 'CAT' : targetLength === 4 ? 'COLD' : 'BLACK';
      w2 = targetLength === 3 ? 'DOG' : targetLength === 4 ? 'WARM' : 'WHITE';
      bfsRes = findShortestPath(w1, w2);
    }

    const overlap = getLetterOverlap(w1, w2);

    return {
      id: `daily_${dateKey}`,
      length: targetLength,
      startWord: w1,
      targetWord: w2,
      minSteps: bfsRes ? bfsRes.par : 4,
      letterOverlap: overlap.count,
      isZeroOverlap: overlap.isZeroOverlap,
      difficultyScore: bfsRes ? bfsRes.par : 4,
      sectorName: `Daily Transmission #${dateKey}`,
      isDaily: true,
    };
  };

  const todayPuzzle = generateDailyPuzzle();

  // Copy shareable ASCII card
  const handleShare = () => {
    sound.playKeyClick();
    if (!dailyRecord) return;

    const starsStr = '⭐'.repeat(dailyRecord.stars);
    const text = [
      `WORDSHIFT TERMINAL // DAILY #${dateKey}`,
      `Word Length: ${todayPuzzle.length} · Par: ${todayPuzzle.minSteps}`,
      `Result: ${dailyRecord.moves} moves · ${starsStr || 'Completed'}`,
      `Zero-Overlap: ${todayPuzzle.isZeroOverlap ? 'RIFT BRIDGED' : 'STANDARD'}`,
      `Play: https://ais-dev-kmcygnl6ujbgehd7o3rjqf-57077019471.europe-west1.run.app`,
    ].join('\n');

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-8 pb-12">
      {/* Daily Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-emerald-950/60">
        <div>
          <h1 className="font-terminal text-2xl sm:text-3xl font-bold tracking-tight text-emerald-400">
            DAILY TERMINAL MISSION
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Global synchronized puzzle for {dateKey}. One transmission per day.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs font-mono text-slate-300">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>{dateKey} (UTC)</span>
        </div>
      </div>

      {/* Today's Daily Mission Card */}
      <div className="rounded-2xl border border-emerald-950/80 bg-slate-900/80 p-6 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="font-terminal font-bold text-lg text-slate-100">
              MISSION #{dateKey}
            </span>
            {todayPuzzle.isZeroOverlap && (
              <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-purple-500/40 bg-purple-950/40 text-purple-300">
                <Zap className="w-3 h-3" /> ZERO-OVERLAP RIFT
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 my-1">
            <span className="font-terminal font-bold text-xl text-slate-100">
              {todayPuzzle.startWord}
            </span>
            <span className="text-slate-500 font-mono">→</span>
            <span className="font-terminal font-bold text-xl text-amber-400">
              {todayPuzzle.targetWord}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
            <span>Length: {todayPuzzle.length} Letters</span>
            <span>·</span>
            <span>Par: {todayPuzzle.minSteps}</span>
            <span>·</span>
            <span>Overlap: {todayPuzzle.letterOverlap}</span>
          </div>
        </div>

        {/* Action Button or Completion Status */}
        <div className="flex items-center gap-3">
          {dailyRecord && dailyRecord.completed ? (
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                <span>Completed in {dailyRecord.moves} moves (Par {dailyRecord.par})</span>
                <div className="flex items-center">
                  {[...Array(dailyRecord.stars)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>

              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied Card!' : 'Share Result'}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => onStartDailyPuzzle(todayPuzzle)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-500 text-emerald-200 font-terminal font-bold text-sm transition-all shadow-md cursor-pointer"
            >
              <Play className="w-4 h-4" />
              <span>Initiate Transmission</span>
            </button>
          )}
        </div>
      </div>

      {/* Terminal Records & Lifetime Dossier */}
      <div className="flex flex-col gap-4">
        <h2 className="font-terminal text-lg font-bold text-slate-200 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>PILOT TERMINAL DOSSIER</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col gap-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Games Won</span>
            <span className="font-terminal text-2xl font-bold text-slate-100 tabular-nums">
              {progress.stats.gamesWon}
            </span>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col gap-1">
            <span className="text-[11px] font-mono text-amber-400 uppercase flex items-center gap-1">
              <Flame className="w-3 h-3" /> Streak
            </span>
            <span className="font-terminal text-2xl font-bold text-amber-300 tabular-nums">
              {progress.stats.currentStreak}
            </span>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col gap-1">
            <span className="text-[11px] font-mono text-cyan-400 uppercase">Par Matches</span>
            <span className="font-terminal text-2xl font-bold text-cyan-300 tabular-nums">
              {progress.stats.parMatches}
            </span>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col gap-1">
            <span className="text-[11px] font-mono text-purple-400 uppercase flex items-center gap-1">
              <Zap className="w-3 h-3" /> Rifts Bridged
            </span>
            <span className="font-terminal text-2xl font-bold text-purple-300 tabular-nums">
              {progress.stats.riftsBridged}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
