/**
 * Core Game Types for WordShift
 */

export interface WordStep {
  word: string;
  changedIndex: number; // -1 for initial start word, 0..length-1 for substituted letter
  stepNumber: number; // 0 for start word, 1..N for subsequent moves
}

export type GameMode = 'CAMPAIGN' | 'FREE_PLAY' | 'DAILY' | 'SANDBOX';

export type GameStatus = 'PLAYING' | 'WON' | 'SURRENDERED';

export interface ActivePuzzle {
  id: string;
  length: number;
  startWord: string;
  targetWord: string;
  minSteps: number; // true Par on validation graph
  letterOverlap: number;
  isZeroOverlap: boolean;
  difficultyScore: number;
  sectorName: string;
  stageIndex?: number;
  isBoss?: boolean;
  isDaily?: boolean;
}

export interface MoveValidationResult {
  valid: boolean;
  message?: string;
  changedIndex?: number;
}
