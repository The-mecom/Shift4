/**
 * Campaign Mode Sector Selector & Stage Matrix
 * Sectors 2 to 7 (2-letter to 7-letter words).
 * Sector K unlocks when sector K-1 has >= 3 stages cleared.
 * Stage N+1 unlocks when stage N is cleared.
 * Displays stars (1-3), Zero-Overlap Rift badge (magenta), and Sector Boss indicators.
 */

import React from 'react';
import { CampaignPuzzle } from '../data/campaignPuzzles';
import { Lock, Star, Zap, Skull, ChevronRight, CheckCircle2 } from 'lucide-react';
import { PlayerProgress } from '../services/storageService';

interface CampaignViewProps {
  puzzles: CampaignPuzzle[];
  progress: PlayerProgress;
  onSelectPuzzle: (puzzle: CampaignPuzzle) => void;
  onOpenRules: () => void;
}

export const CampaignView: React.FC<CampaignViewProps> = ({
  puzzles,
  progress,
  onSelectPuzzle,
  onOpenRules,
}) => {
  const sectors = [2, 3, 4, 5, 6, 7];

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 pb-12">
      {/* Campaign Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-emerald-950/60">
        <div>
          <h1 className="font-terminal text-2xl sm:text-3xl font-bold tracking-tight text-emerald-400">
            CAMPAIGN SECTORS
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Traverse escalating lexical word lengths from 2 to 7 letters. Bridge word chasms with single-letter shifts.
          </p>
        </div>

        {/* Global Progress Summary */}
        <div className="flex items-center gap-4 bg-slate-900/90 border border-slate-800 p-3 rounded-xl self-start sm:self-auto">
          <div>
            <div className="text-[10px] font-mono tracking-wider uppercase text-slate-400">Total Stages Cleared</div>
            <div className="font-terminal text-lg font-bold text-emerald-400 tabular-nums">
              {Object.keys(progress.completedStages).length} / 30
            </div>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div>
            <div className="text-[10px] font-mono tracking-wider uppercase text-amber-400 flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-400" />
              <span>Stars</span>
            </div>
            <div className="font-terminal text-lg font-bold text-amber-300 tabular-nums">
              {Object.values(progress.completedStages).reduce((acc, curr) => acc + curr.stars, 0)} / 90
            </div>
          </div>
        </div>
      </div>

      {/* 6 Sectors Accordion/Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {sectors.map((sectorLength) => {
          const isSectorUnlocked = progress.unlockedSectors.includes(sectorLength);
          const sectorPuzzles = puzzles.filter((p) => p.length === sectorLength);
          const sectorName = sectorPuzzles[0]?.sectorName || `Sector ${sectorLength}`;
          const completedInSector = sectorPuzzles.filter((p) => progress.completedStages[p.id]).length;

          return (
            <div
              key={sectorLength}
              className={`rounded-2xl border transition-all p-5 flex flex-col gap-4 relative overflow-hidden ${
                isSectorUnlocked
                  ? 'bg-slate-900/70 border-slate-800 hover:border-emerald-500/40 shadow-md'
                  : 'bg-slate-950/40 border-slate-900 opacity-60'
              }`}
            >
              {/* Sector Header */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-terminal font-bold text-base sm:text-lg text-slate-100">
                      {sectorName}
                    </span>
                    {!isSectorUnlocked && (
                      <span className="flex items-center gap-1 text-[10px] font-mono uppercase px-2 py-0.5 rounded border border-slate-800 bg-slate-950 text-slate-500">
                        <Lock className="w-3 h-3" /> Locked
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {sectorLength}-Letter Words · {completedInSector}/5 Stages Cleared
                  </div>
                </div>

                {isSectorUnlocked && completedInSector === 5 && (
                  <div className="flex items-center gap-1 text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded-md border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>SECTOR CLEAR</span>
                  </div>
                )}
              </div>

              {/* Unlock Requirement Info for Locked Sectors */}
              {!isSectorUnlocked && (
                <div className="text-xs text-slate-500 font-mono italic">
                  Requires 3 cleared stages in Sector {sectorLength - 1} to unlock.
                </div>
              )}

              {/* Stages List (1 to 5) */}
              <div className="flex flex-col gap-2 mt-1">
                {sectorPuzzles.map((stage) => {
                  const stageRecord = progress.completedStages[stage.id];
                  const isCompleted = !!stageRecord;
                  
                  // Stage unlocking: Stage 1 is always unlocked if sector is unlocked.
                  // Stage N is unlocked if stage N-1 is completed.
                  const isStageUnlocked =
                    isSectorUnlocked &&
                    (stage.stageIndex === 1 ||
                      !!progress.completedStages[`sector_${sectorLength}_stage_${stage.stageIndex - 1}`]);

                  return (
                    <button
                      key={stage.id}
                      onClick={() => {
                        if (isStageUnlocked) {
                          onSelectPuzzle(stage);
                        }
                      }}
                      disabled={!isStageUnlocked}
                      className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl border text-left transition-all ${
                        !isStageUnlocked
                          ? 'bg-slate-950/40 border-slate-900 text-slate-600 cursor-not-allowed'
                          : isCompleted
                          ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-950/30 cursor-pointer'
                          : 'bg-slate-900/90 border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/80 cursor-pointer'
                      }`}
                      aria-label={`Stage ${stage.stageIndex}: ${stage.startWord} to ${stage.targetWord}`}
                    >
                      {/* Left: Stage number and word pair */}
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold border tabular-nums ${
                            !isStageUnlocked
                              ? 'border-slate-800 text-slate-600 bg-slate-950'
                              : isCompleted
                              ? 'border-emerald-500/40 text-emerald-300 bg-emerald-950/50'
                              : 'border-slate-700 text-slate-300 bg-slate-800'
                          }`}
                        >
                          {isStageUnlocked ? stage.stageIndex : <Lock className="w-3 h-3" />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-terminal font-bold text-sm text-slate-200">
                              {stage.startWord}
                            </span>
                            <span className="text-slate-500 text-xs font-mono">→</span>
                            <span className="font-terminal font-bold text-sm text-amber-400">
                              {stage.targetWord}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono text-slate-400">
                            <span>Par: {stage.minSteps}</span>
                            <span>·</span>
                            <span>Overlap: {stage.letterOverlap}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Badges & Stars */}
                      <div className="flex items-center gap-2">
                        {/* Zero-Overlap Rift Badge (Strict Violet/Magenta token) */}
                        {stage.isZeroOverlap && (
                          <div
                            className="hidden sm:flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-purple-500/40 bg-purple-950/40 text-purple-300"
                            title="Zero-Overlap Rift: Start and Target share NO letters in common!"
                          >
                            <Zap className="w-3 h-3" />
                            <span>RIFT</span>
                          </div>
                        )}

                        {/* Sector Boss Badge */}
                        {stage.isBoss && !stage.isZeroOverlap && (
                          <div
                            className="hidden sm:flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-rose-500/40 bg-rose-950/40 text-rose-300"
                            title="Sector Boss: Highest difficulty node in this sector"
                          >
                            <Skull className="w-3 h-3" />
                            <span>BOSS</span>
                          </div>
                        )}

                        {/* Stars */}
                        {isCompleted && (
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3].map((starIdx) => (
                              <Star
                                key={starIdx}
                                className={`w-3.5 h-3.5 ${
                                  starIdx <= stageRecord.stars
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-700'
                                }`}
                              />
                            ))}
                          </div>
                        )}

                        {isStageUnlocked && <ChevronRight className="w-4 h-4 text-slate-500" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
