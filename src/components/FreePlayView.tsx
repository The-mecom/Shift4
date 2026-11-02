/**
 * Free Play & Custom Sandbox Mode
 * Generates random solvable puzzles filtered by Word Length (2-7) and Difficulty/Zero-Overlap.
 * Provides custom Start & Target pair tester with instant BFS solvability analysis.
 */

import React, { useState } from 'react';
import { PUZZLE_LEXICON } from '../data/puzzleLexicon';
import { isValidWordInLexicon } from '../data/validationLexicon';
import { findShortestPath, getLetterOverlap } from '../data/graphSolver';
import { ActivePuzzle } from '../types/game';
import { Dices, Play, Search, AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import { sound } from '../services/audioEngine';

interface FreePlayViewProps {
  onStartCustomPuzzle: (puzzle: ActivePuzzle) => void;
}

type DifficultyFilter = 'ALL' | 'MEDIUM' | 'HARD' | 'ZERO_OVERLAP';

export const FreePlayView: React.FC<FreePlayViewProps> = ({ onStartCustomPuzzle }) => {
  const [activeTab, setActiveTab] = useState<'GENERATOR' | 'CUSTOM'>('GENERATOR');

  // Generator State
  const [selectedLength, setSelectedLength] = useState<number>(4);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyFilter>('ALL');
  const [generatorMessage, setGeneratorMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Custom Pair State
  const [customStart, setCustomStart] = useState<string>('');
  const [customTarget, setCustomTarget] = useState<string>('');
  const [customAnalysis, setCustomAnalysis] = useState<{
    tested: boolean;
    valid: boolean;
    error?: string;
    par?: number;
    path?: string[];
    isZeroOverlap?: boolean;
    overlapCount?: number;
  } | null>(null);

  // Handle Random Generation
  const handleGenerateRandom = () => {
    setIsGenerating(true);
    setGeneratorMessage(null);
    sound.playKeyClick();

    setTimeout(() => {
      const words = PUZZLE_LEXICON[selectedLength] || [];
      if (words.length < 2) {
        setGeneratorMessage(`Insufficient curated words for length ${selectedLength}.`);
        setIsGenerating(false);
        return;
      }

      let attempts = 0;
      const maxAttempts = 200;
      let foundPuzzle: ActivePuzzle | null = null;

      while (attempts < maxAttempts) {
        attempts++;
        const idx1 = Math.floor(Math.random() * words.length);
        let idx2 = Math.floor(Math.random() * words.length);
        if (idx1 === idx2) idx2 = (idx2 + 1) % words.length;

        const w1 = words[idx1];
        const w2 = words[idx2];
        const overlap = getLetterOverlap(w1, w2);

        // Filter check
        if (selectedDifficulty === 'ZERO_OVERLAP' && !overlap.isZeroOverlap) {
          continue;
        }

        const bfsRes = findShortestPath(w1, w2);
        if (!bfsRes || bfsRes.par < 1) continue;

        if (selectedDifficulty === 'MEDIUM' && (bfsRes.par < 2 || bfsRes.par > 4)) {
          continue;
        }

        if (selectedDifficulty === 'HARD' && bfsRes.par < 4) {
          continue;
        }

        foundPuzzle = {
          id: `custom_${Date.now()}`,
          length: selectedLength,
          startWord: w1,
          targetWord: w2,
          minSteps: bfsRes.par,
          letterOverlap: overlap.count,
          isZeroOverlap: overlap.isZeroOverlap,
          difficultyScore: bfsRes.par,
          sectorName: `Custom ${selectedLength}-Letter`,
        };
        break;
      }

      setIsGenerating(false);

      if (foundPuzzle) {
        onStartCustomPuzzle(foundPuzzle);
      } else {
        setGeneratorMessage(
          `No connected pair found for Length ${selectedLength} under '${selectedDifficulty}'. Try a different filter or length!`
        );
      }
    }, 50);
  };

  // Analyze Custom Pair
  const handleAnalyzeCustom = () => {
    sound.playKeyClick();
    const s = customStart.trim().toUpperCase();
    const t = customTarget.trim().toUpperCase();

    if (!s || !t) {
      setCustomAnalysis({ tested: true, valid: false, error: 'Please enter both Start and Target words.' });
      return;
    }

    if (s.length !== t.length) {
      setCustomAnalysis({ tested: true, valid: false, error: `Word lengths must match (${s.length} vs ${t.length}).` });
      return;
    }

    if (s === t) {
      setCustomAnalysis({ tested: true, valid: false, error: 'Start and Target words cannot be identical.' });
      return;
    }

    if (!isValidWordInLexicon(s)) {
      setCustomAnalysis({ tested: true, valid: false, error: `'${s}' is not recognized in the validation lexicon.` });
      return;
    }

    if (!isValidWordInLexicon(t)) {
      setCustomAnalysis({ tested: true, valid: false, error: `'${t}' is not recognized in the validation lexicon.` });
      return;
    }

    const bfsRes = findShortestPath(s, t);
    const overlap = getLetterOverlap(s, t);

    if (!bfsRes) {
      setCustomAnalysis({
        tested: true,
        valid: false,
        error: `No connected 1-letter path exists between '${s}' and '${t}'.`,
        isZeroOverlap: overlap.isZeroOverlap,
        overlapCount: overlap.count,
      });
      return;
    }

    setCustomAnalysis({
      tested: true,
      valid: true,
      par: bfsRes.par,
      path: bfsRes.path,
      isZeroOverlap: overlap.isZeroOverlap,
      overlapCount: overlap.count,
    });
  };

  const handleLaunchCustom = () => {
    if (!customAnalysis || !customAnalysis.valid || customAnalysis.par === undefined) return;
    const s = customStart.trim().toUpperCase();
    const t = customTarget.trim().toUpperCase();

    onStartCustomPuzzle({
      id: `sandbox_${Date.now()}`,
      length: s.length,
      startWord: s,
      targetWord: t,
      minSteps: customAnalysis.par,
      letterOverlap: customAnalysis.overlapCount || 0,
      isZeroOverlap: !!customAnalysis.isZeroOverlap,
      difficultyScore: customAnalysis.par,
      sectorName: `Sandbox ${s.length}-Letter`,
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 pb-12">
      {/* Mode Switch Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-950/60">
        <div>
          <h1 className="font-terminal text-2xl sm:text-3xl font-bold tracking-tight text-emerald-400">
            FREE PLAY & SANDBOX
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Generate custom word ladder challenges or test any pair of English words.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('GENERATOR')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'GENERATOR'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Random Generator
          </button>
          <button
            onClick={() => setActiveTab('CUSTOM')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'CUSTOM'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Custom Pair Analyzer
          </button>
        </div>
      </div>

      {activeTab === 'GENERATOR' ? (
        /* Generator View */
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col gap-6">
          {/* Length Selector */}
          <div>
            <label className="text-xs font-mono tracking-wider uppercase text-slate-400 mb-2 block">
              Word Length (2 to 7 letters)
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {[2, 3, 4, 5, 6, 7].map((len) => (
                <button
                  key={len}
                  onClick={() => setSelectedLength(len)}
                  className={`w-12 h-11 rounded-xl font-terminal font-bold text-sm sm:text-base border transition-all cursor-pointer ${
                    selectedLength === len
                      ? 'border-emerald-500 bg-emerald-950/70 text-emerald-300 shadow-md ring-1 ring-emerald-500/40'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {len}L
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Filter */}
          <div>
            <label className="text-xs font-mono tracking-wider uppercase text-slate-400 mb-2 block">
              Difficulty Filter
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {(['ALL', 'MEDIUM', 'HARD', 'ZERO_OVERLAP'] as DifficultyFilter[]).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`px-3 py-2 rounded-xl text-xs font-mono font-medium border transition-all cursor-pointer ${
                    selectedDifficulty === diff
                      ? diff === 'ZERO_OVERLAP'
                        ? 'border-purple-500 bg-purple-950/60 text-purple-300 shadow-md'
                        : 'border-emerald-500 bg-emerald-950/70 text-emerald-300 shadow-md'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {diff === 'ALL' && 'All Tiers'}
                  {diff === 'MEDIUM' && 'Medium (Par 2-4)'}
                  {diff === 'HARD' && 'Hard (Par 4+)'}
                  {diff === 'ZERO_OVERLAP' && 'Zero-Overlap Only'}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message if filter yields nothing */}
          {generatorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl border border-amber-500/30 bg-amber-950/20 text-xs font-mono text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{generatorMessage}</span>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleGenerateRandom}
            disabled={isGenerating}
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500 text-emerald-200 font-terminal font-bold text-sm transition-all shadow-md hover:shadow-emerald-950/50 cursor-pointer disabled:opacity-50"
          >
            <Dices className="w-4 h-4" />
            <span>{isGenerating ? 'Scanning Lexicon Graph...' : 'Generate & Play Puzzle'}</span>
          </button>
        </div>
      ) : (
        /* Custom Sandbox Pair View */
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono tracking-wider uppercase text-slate-400 mb-1.5 block">
                Start Word
              </label>
              <input
                type="text"
                value={customStart}
                onChange={(e) => {
                  setCustomStart(e.target.value.toUpperCase());
                  setCustomAnalysis(null);
                }}
                placeholder="e.g. COLD"
                maxLength={7}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 font-terminal text-lg font-bold text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-mono tracking-wider uppercase text-amber-400 mb-1.5 block">
                Target Word
              </label>
              <input
                type="text"
                value={customTarget}
                onChange={(e) => {
                  setCustomTarget(e.target.value.toUpperCase());
                  setCustomAnalysis(null);
                }}
                placeholder="e.g. WARM"
                maxLength={7}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 font-terminal text-lg font-bold text-amber-300 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <button
            onClick={handleAnalyzeCustom}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 font-mono text-xs font-semibold transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4 text-emerald-400" />
            <span>Verify Solvability via BFS</span>
          </button>

          {/* Analysis Results Display */}
          {customAnalysis && customAnalysis.tested && (
            <div
              className={`p-4 rounded-xl border flex flex-col gap-2 ${
                customAnalysis.valid
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-red-950/20 border-red-500/40 text-red-300'
              }`}
            >
              <div className="flex items-center gap-2 font-mono text-xs font-bold">
                {customAnalysis.valid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                )}
                <span>
                  {customAnalysis.valid
                    ? `Solvable in ${customAnalysis.par} steps (Par: ${customAnalysis.par})`
                    : customAnalysis.error}
                </span>
              </div>

              {customAnalysis.valid && (
                <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-emerald-950/80">
                  <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                    <span>
                      Zero-Overlap:{' '}
                      <strong className={customAnalysis.isZeroOverlap ? 'text-purple-400' : 'text-slate-300'}>
                        {customAnalysis.isZeroOverlap ? 'YES (Rift)' : 'NO'}
                      </strong>
                    </span>
                    <span>·</span>
                    <span>Shared Letters: {customAnalysis.overlapCount}</span>
                  </div>

                  <div className="text-xs font-mono text-slate-400 truncate">
                    Sample Optimal Path: {customAnalysis.path?.join(' → ')}
                  </div>

                  <button
                    onClick={handleLaunchCustom}
                    className="mt-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500 text-emerald-200 font-terminal text-xs font-bold transition-all cursor-pointer self-start"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Play This Custom Pair</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
