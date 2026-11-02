/**
 * Resilient Persistence Service for WordShift
 * Safely persists campaign progress, daily stats, and settings to localStorage.
 * Gracefully falls back to memory if localStorage is restricted/unavailable.
 */

export interface PlayerProgress {
  unlockedSectors: number[];
  completedStages: Record<string, { bestMoves: number; stars: number; dateCompleted?: string }>;
  dailyHistory: Record<string, { completed: boolean; moves: number; par: number; stars: number }>;
  stats: {
    gamesPlayed: number;
    gamesWon: number;
    currentStreak: number;
    maxStreak: number;
    riftsBridged: number;
    parMatches: number;
  };
  soundEnabled: boolean;
  effectsEnabled: boolean;
  activeSector: number;
}

const STORAGE_KEY = 'wordshift_terminal_save_v1';

const DEFAULT_PROGRESS: PlayerProgress = {
  unlockedSectors: [2], // Sector 2 unlocked by default
  completedStages: {},
  dailyHistory: {},
  stats: {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    riftsBridged: 0,
    parMatches: 0,
  },
  soundEnabled: true,
  effectsEnabled: true,
  activeSector: 2,
};

let inMemoryState: PlayerProgress = { ...DEFAULT_PROGRESS };
let storageAvailable: boolean = true;
let storageTested: boolean = false;

function testStorage(): boolean {
  if (storageTested) return storageAvailable;
  try {
    const testKey = '__wordshift_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  storageTested = true;
  return storageAvailable;
}

export function loadProgress(): { data: PlayerProgress; isStoragePersisted: boolean } {
  const isPersisted = testStorage();
  if (!isPersisted) {
    return { data: { ...inMemoryState }, isStoragePersisted: false };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveProgress(DEFAULT_PROGRESS);
      return { data: { ...DEFAULT_PROGRESS }, isStoragePersisted: true };
    }
    const parsed = JSON.parse(raw);
    const merged: PlayerProgress = {
      ...DEFAULT_PROGRESS,
      ...parsed,
      stats: {
        ...DEFAULT_PROGRESS.stats,
        ...(parsed.stats || {}),
      },
      unlockedSectors: parsed.unlockedSectors || [2],
      completedStages: parsed.completedStages || {},
      dailyHistory: parsed.dailyHistory || {},
    };
    inMemoryState = { ...merged };
    return { data: merged, isStoragePersisted: true };
  } catch {
    return { data: { ...inMemoryState }, isStoragePersisted: false };
  }
}

export function saveProgress(progress: PlayerProgress): boolean {
  inMemoryState = { ...progress };
  if (!testStorage()) return false;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

export function isLocalStorageUsable(): boolean {
  return testStorage();
}
