/**
 * WordShift: Retro Arcade Word Ladder (Doublets)
 * Main Application Component uniting Lexicon BFS Graph, Interactive Trail,
 * Campaign Progression (Lengths 2-7), Free Play, Daily Missions, and Web Audio.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CAMPAIGN_PUZZLES, CampaignPuzzle } from './data/campaignPuzzles';
import { isValidWordInLexicon } from './data/validationLexicon';
import {
  findShortestPath,
  getNextOptimalWord,
  getValidNeighbors,
  isOneLetterDifference,
  getLetterOverlap,
} from './data/graphSolver';
import { loadProgress, saveProgress, PlayerProgress, isLocalStorageUsable } from './services/storageService';
import { sound } from './services/audioEngine';
import { GameMode, GameStatus, ActivePuzzle, WordStep, MoveValidationResult } from './types/game';
import { TopBar } from './components/TopBar';
import { VisualTrail } from './components/VisualTrail';
import { ActiveWordInput } from './components/ActiveWordInput';
import { HelperDrawers } from './components/HelperDrawers';
import { CampaignView } from './components/CampaignView';
import { FreePlayView } from './components/FreePlayView';
import { DailyView } from './components/DailyView';
import { VictoryModal } from './components/VictoryModal';
import { RulesModal } from './components/RulesModal';
import { Zap, Skull, Target, ArrowLeft, Info, HelpCircle } from 'lucide-react';

export default function App() {
  // Persistence state
  const [progress, setProgress] = useState<PlayerProgress>(() => {
    const { data } = loadProgress();
    return data;
  });
  const [storageWarningDismissed, setStorageWarningDismissed] = useState<boolean>(false);
  const isStoragePersisted = useMemo(() => isLocalStorageUsable(), []);

  // UI & View state
  const [gameMode, setGameMode] = useState<GameMode>('CAMPAIGN');
  const [activePuzzle, setActivePuzzle] = useState<ActivePuzzle | null>(null);
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);

  // Settings
  const [soundEnabled, setSoundEnabled] = useState<boolean>(progress.soundEnabled);
  const [effectsEnabled, setEffectsEnabled] = useState<boolean>(() => {
    // Default effects off on small mobile screens to save GPU
    if (typeof window !== 'undefined' && window.innerWidth < 640) return false;
    return progress.effectsEnabled;
  });

  // Active Play Session State
  const [trail, setTrail] = useState<WordStep[]>([]);
  const [isHintUsed, setIsHintUsed] = useState<boolean>(false);
  const [gameStatus, setGameStatus] = useState<GameStatus>('PLAYING');
  const [revealedSolution, setRevealedSolution] = useState<string[] | null>(null);

  // Sync Audio Setting
  useEffect(() => {
    sound.setMuted(!soundEnabled);
  }, [soundEnabled]);

  // Update progress helper
  const updateProgress = useCallback((updater: (prev: PlayerProgress) => PlayerProgress) => {
    setProgress((prev) => {
      const next = updater(prev);
      saveProgress(next);
      return next;
    });
  }, []);

  // Toggle Sound
  const handleToggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    sound.setMuted(!nextVal);
    updateProgress((prev) => ({ ...prev, soundEnabled: nextVal }));
  };

  // Toggle CRT Effects
  const handleToggleEffects = () => {
    const nextVal = !effectsEnabled;
    setEffectsEnabled(nextVal);
    updateProgress((prev) => ({ ...prev, effectsEnabled: nextVal }));
  };

  // Start a Puzzle
  const startPuzzle = useCallback((puzzle: ActivePuzzle) => {
    setActivePuzzle(puzzle);
    setTrail([
      {
        word: puzzle.startWord.toUpperCase(),
        changedIndex: -1,
        stepNumber: 0,
      },
    ]);
    setIsHintUsed(false);
    setGameStatus('PLAYING');
    setRevealedSolution(null);
  }, []);

  // Current active word
  const currentStep = trail[trail.length - 1];
  const currentWord = currentStep ? currentStep.word : activePuzzle?.startWord || '';
  const targetWord = activePuzzle?.targetWord || '';
  const currentMoves = Math.max(0, trail.length - 1);
  const par = activePuzzle?.minSteps || 1;

  // Set of words in current trail (to prevent repetition)
  const trailWordsSet = useMemo(() => new Set(trail.map((t) => t.word)), [trail]);

  // Valid 1-letter neighbors for drawer
  const validNeighbors = useMemo(() => {
    if (!currentWord) return [];
    return getValidNeighbors(currentWord, trailWordsSet);
  }, [currentWord, trailWordsSet]);

  // Handle Move Attempt
  const handleAttemptMove = useCallback(
    (candidateWord: string): MoveValidationResult => {
      const upper = candidateWord.toUpperCase();

      if (upper === currentWord) {
        return { valid: false, message: 'Same word' };
      }

      const diffCheck = isOneLetterDifference(currentWord, upper);
      if (!diffCheck.valid) {
        return { valid: false, message: 'Changed more than one letter' };
      }

      if (trailWordsSet.has(upper)) {
        return { valid: false, message: 'Already in your trail' };
      }

      if (!isValidWordInLexicon(upper)) {
        return { valid: false, message: 'Not a word' };
      }

      // Valid Move!
      sound.playValidMove();

      const newStep: WordStep = {
        word: upper,
        changedIndex: diffCheck.changedIndex,
        stepNumber: trail.length,
      };

      const nextTrail = [...trail, newStep];
      setTrail(nextTrail);

      // Check Victory Condition
      if (upper === targetWord) {
        sound.playVictory();
        setGameStatus('WON');

        const movesCount = nextTrail.length - 1;
        // Calculate stars
        let stars = 1;
        if (movesCount === par && !isHintUsed) {
          stars = 3;
        } else if (movesCount <= par + 2 || isHintUsed) {
          stars = 2;
        }

        // Save progress if campaign
        if (activePuzzle && activePuzzle.stageIndex !== undefined) {
          const puzzleId = activePuzzle.id;
          const sectorLen = activePuzzle.length;

          updateProgress((prev) => {
            const currentStageRecord = prev.completedStages[puzzleId];
            const bestMoves = currentStageRecord
              ? Math.min(currentStageRecord.bestMoves, movesCount)
              : movesCount;
            const bestStars = currentStageRecord
              ? Math.max(currentStageRecord.stars, stars)
              : stars;

            const updatedCompleted = {
              ...prev.completedStages,
              [puzzleId]: {
                bestMoves,
                stars: bestStars,
                dateCompleted: new Date().toISOString(),
              },
            };

            // Check if this sector now has >= 3 completed stages to unlock next sector
            const sectorPuzzles = CAMPAIGN_PUZZLES.filter((p) => p.length === sectorLen);
            const clearedInSector = sectorPuzzles.filter((p) => updatedCompleted[p.id]).length;
            const updatedUnlockedSectors = [...prev.unlockedSectors];
            if (clearedInSector >= 3 && sectorLen < 7 && !updatedUnlockedSectors.includes(sectorLen + 1)) {
              updatedUnlockedSectors.push(sectorLen + 1);
            }

            return {
              ...prev,
              completedStages: updatedCompleted,
              unlockedSectors: updatedUnlockedSectors,
              stats: {
                ...prev.stats,
                gamesPlayed: prev.stats.gamesPlayed + 1,
                gamesWon: prev.stats.gamesWon + 1,
                currentStreak: prev.stats.currentStreak + 1,
                maxStreak: Math.max(prev.stats.maxStreak, prev.stats.currentStreak + 1),
                parMatches: movesCount === par ? prev.stats.parMatches + 1 : prev.stats.parMatches,
                riftsBridged: activePuzzle.isZeroOverlap
                  ? prev.stats.riftsBridged + 1
                  : prev.stats.riftsBridged,
              },
            };
          });
        } else if (activePuzzle?.isDaily) {
          // Record Daily Mission Victory
          const dateKey = new Date().toISOString().slice(0, 10);
          updateProgress((prev) => ({
            ...prev,
            dailyHistory: {
              ...prev.dailyHistory,
              [dateKey]: {
                completed: true,
                moves: movesCount,
                par,
                stars,
              },
            },
            stats: {
              ...prev.stats,
              gamesPlayed: prev.stats.gamesPlayed + 1,
              gamesWon: prev.stats.gamesWon + 1,
              currentStreak: prev.stats.currentStreak + 1,
              maxStreak: Math.max(prev.stats.maxStreak, prev.stats.currentStreak + 1),
              parMatches: movesCount === par ? prev.stats.parMatches + 1 : prev.stats.parMatches,
              riftsBridged: activePuzzle.isZeroOverlap
                ? prev.stats.riftsBridged + 1
                : prev.stats.riftsBridged,
            },
          }));
        }

        return { valid: true };
      }

      return { valid: true };
    },
    [currentWord, trailWordsSet, trail, targetWord, par, isHintUsed, activePuzzle, updateProgress]
  );

  // Rewind to prior node (truncates forward history, zero penalty)
  const handleRewindToStep = useCallback((stepIndex: number) => {
    if (stepIndex < 0 || stepIndex >= trail.length - 1) return;
    sound.playRewindUndo();
    setTrail((prev) => prev.slice(0, stepIndex + 1));
  }, [trail.length]);

  // Undo last move
  const handleUndoLastMove = useCallback(() => {
    if (trail.length <= 1) return;
    sound.playRewindUndo();
    setTrail((prev) => prev.slice(0, prev.length - 1));
  }, [trail.length]);

  // Direct Neighbor Selection from drawer
  const handleSelectNeighbor = useCallback(
    (neighborWord: string) => {
      handleAttemptMove(neighborWord);
    },
    [handleAttemptMove]
  );

  // BFS Path Hint
  const handleRequestHint = useCallback(() => {
    if (!currentWord || !targetWord) return;
    const nextWord = getNextOptimalWord(currentWord, targetWord);
    if (nextWord) {
      setIsHintUsed(true);
      handleAttemptMove(nextWord);
    }
  }, [currentWord, targetWord, handleAttemptMove]);

  // Surrender & Reveal Full Solution
  const handleSurrender = useCallback(() => {
    if (!activePuzzle) return;
    sound.playInvalidError();
    const solution = findShortestPath(activePuzzle.startWord, activePuzzle.targetWord);
    if (solution) {
      setRevealedSolution(solution.path);
    }
    setGameStatus('SURRENDERED');
  }, [activePuzzle]);

  // Navigation handlers
  const handleNextStage = useCallback(() => {
    if (!activePuzzle || activePuzzle.stageIndex === undefined) return;
    const nextIndex = activePuzzle.stageIndex + 1;
    const nextPuzzle = CAMPAIGN_PUZZLES.find(
      (p) => p.length === activePuzzle.length && p.stageIndex === nextIndex
    );
    if (nextPuzzle) {
      startPuzzle(nextPuzzle);
    } else {
      // Return to campaign overview
      setActivePuzzle(null);
    }
  }, [activePuzzle, startPuzzle]);

  const handleRetryCurrent = useCallback(() => {
    if (!activePuzzle) return;
    startPuzzle(activePuzzle);
  }, [activePuzzle, startPuzzle]);

  // Stars calculation for victory
  const calculatedStars = useMemo(() => {
    if (currentMoves === par && !isHintUsed) return 3;
    if (currentMoves <= par + 2 || isHintUsed) return 2;
    return 1;
  }, [currentMoves, par, isHintUsed]);

  return (
    <div className={`min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col ${effectsEnabled ? 'crt-effects-active' : ''}`}>
      {/* Top Bar Navigation */}
      <TopBar
        currentMode={gameMode}
        onSelectMode={(mode) => {
          sound.playKeyClick();
          setGameMode(mode);
          setActivePuzzle(null);
        }}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        effectsEnabled={effectsEnabled}
        onToggleEffects={handleToggleEffects}
        onOpenRules={() => setIsRulesOpen(true)}
      />

      {/* Storage Warning Note (if storage restricted in sandbox) */}
      {!isStoragePersisted && !storageWarningDismissed && (
        <div className="bg-amber-950/70 border-b border-amber-500/40 px-4 py-2 text-xs font-mono text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Progress won't be saved in this environment (storage disabled). Game runs fully in-memory.</span>
          </div>
          <button
            onClick={() => setStorageWarningDismissed(true)}
            className="text-amber-400 hover:text-amber-200 text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col">
        {activePuzzle ? (
          /* Active Gameplay View (Two Column Desktop / Single Column Mobile) */
          <div className="flex-1 flex flex-col gap-5">
            {/* Active Puzzle Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    sound.playKeyClick();
                    setActivePuzzle(null);
                  }}
                  className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                  title="Return to selection"
                  aria-label="Back to selection"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-terminal font-bold text-base sm:text-lg text-emerald-400">
                      {activePuzzle.sectorName}
                    </span>
                    {activePuzzle.isZeroOverlap && (
                      <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-purple-500/40 bg-purple-950/40 text-purple-300">
                        <Zap className="w-3 h-3 text-purple-400" /> ZERO-OVERLAP RIFT
                      </span>
                    )}
                    {activePuzzle.isBoss && !activePuzzle.isZeroOverlap && (
                      <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-rose-500/40 bg-rose-950/40 text-rose-300">
                        <Skull className="w-3 h-3 text-rose-400" /> SECTOR BOSS
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-mono text-slate-400">
                    Objective: Bridge {activePuzzle.length}-letter word from {activePuzzle.startWord} to {activePuzzle.targetWord}
                  </div>
                </div>
              </div>

              {/* Target Indicator */}
              <div className="flex items-center gap-2 self-start sm:self-auto bg-amber-950/20 border border-amber-500/30 px-3 py-1.5 rounded-xl">
                <Target className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono text-slate-300">Target:</span>
                <span className="font-terminal font-bold text-amber-300 tracking-wider">
                  {activePuzzle.targetWord}
                </span>
              </div>
            </div>

            {/* Surrendered Solution Banner */}
            {gameStatus === 'SURRENDERED' && revealedSolution && (
              <div className="p-4 rounded-xl border border-red-500/50 bg-red-950/30 text-xs font-mono text-red-200 flex flex-col gap-2">
                <div className="font-bold flex items-center justify-between">
                  <span>OPTIMAL PATH REVEALED (0 Stars):</span>
                  <button
                    onClick={handleRetryCurrent}
                    className="text-xs underline text-red-300 hover:text-white cursor-pointer"
                  >
                    Retry Now
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 text-slate-100">
                  {revealedSolution.map((w, idx) => (
                    <React.Fragment key={idx}>
                      <span className="font-bold text-amber-300">{w}</span>
                      {idx < revealedSolution.length - 1 && <span className="text-slate-500">→</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {/* Main Interactive Play Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
              {/* Left Column: Visual Trail (5 cols on lg) */}
              <div className="lg:col-span-5 w-full order-2 lg:order-1">
                <VisualTrail
                  trail={trail}
                  targetWord={targetWord}
                  isZeroOverlap={activePuzzle.isZeroOverlap}
                  onRewindToStep={handleRewindToStep}
                  onSelectWordNeighbor={handleSelectNeighbor}
                  isCompleted={gameStatus === 'WON'}
                />
              </div>

              {/* Right Column: Active Terminal HUD, Letter Slots, Keyboard (7 cols on lg) */}
              <div className="lg:col-span-7 flex flex-col gap-5 order-1 lg:order-2">
                {/* HUD Controls & Stats */}
                <HelperDrawers
                  currentWord={currentWord}
                  targetWord={targetWord}
                  validNeighbors={validNeighbors}
                  moves={currentMoves}
                  par={par}
                  isHintUsed={isHintUsed}
                  onSelectWordNeighbor={handleSelectNeighbor}
                  onRequestHint={handleRequestHint}
                  onUndoLastMove={handleUndoLastMove}
                  onSurrender={handleSurrender}
                  canUndo={trail.length > 1 && gameStatus === 'PLAYING'}
                />

                {/* Letter Slots & Virtual Keyboard */}
                <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 shadow-md">
                  <ActiveWordInput
                    currentWord={currentWord}
                    onAttemptMove={handleAttemptMove}
                    disabled={gameStatus !== 'PLAYING'}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : gameMode === 'CAMPAIGN' ? (
          /* Campaign Mode */
          <CampaignView
            puzzles={CAMPAIGN_PUZZLES}
            progress={progress}
            onSelectPuzzle={startPuzzle}
            onOpenRules={() => setIsRulesOpen(true)}
          />
        ) : gameMode === 'FREE_PLAY' ? (
          /* Free Play & Custom Pair Analyzer */
          <FreePlayView onStartCustomPuzzle={startPuzzle} />
        ) : (
          /* Daily Terminal Challenge */
          <DailyView progress={progress} onStartDailyPuzzle={startPuzzle} />
        )}
      </main>

      {/* Victory Readout Modal */}
      {gameStatus === 'WON' && activePuzzle && (
        <VictoryModal
          startWord={activePuzzle.startWord}
          targetWord={activePuzzle.targetWord}
          moves={currentMoves}
          par={par}
          stars={calculatedStars}
          isHintUsed={isHintUsed}
          isZeroOverlap={activePuzzle.isZeroOverlap}
          trail={trail}
          hasNextStage={
            activePuzzle.stageIndex !== undefined &&
            CAMPAIGN_PUZZLES.some(
              (p) => p.length === activePuzzle.length && p.stageIndex === activePuzzle.stageIndex! + 1
            )
          }
          onNextStage={handleNextStage}
          onRetry={handleRetryCurrent}
          onBackToMenu={() => setActivePuzzle(null)}
        />
      )}

      {/* Rules Modal */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
    </div>
  );
}
