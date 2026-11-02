/**
 * Client-Side Breadth-First Search (BFS) Word Graph & Solver
 * Builds wildcard bucket graphs on the validation lexicon.
 * Computes shortest paths, par, next valid neighbors, and hints in milliseconds.
 */

import { getLexiconSet, getLexiconWords, isValidWordInLexicon } from './validationLexicon';

// Cache graphs by word length: length -> Map<word, neighbor_array>
const GRAPH_CACHE: Map<number, Map<string, string[]>> = new Map();

/**
 * Builds or retrieves the neighbor graph for a given word length using wildcard buckets.
 * O(N * L) construction time, cached in memory.
 */
export function getGraphForLength(length: number): Map<string, string[]> {
  if (GRAPH_CACHE.has(length)) {
    return GRAPH_CACHE.get(length)!;
  }

  const words = getLexiconWords(length);
  const buckets = new Map<string, string[]>();

  // Create wildcard buckets e.g. "C_T" -> ["CAT", "COT", "CUT"]
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    for (let pos = 0; pos < length; pos++) {
      const bucketKey = word.slice(0, pos) + '_' + word.slice(pos + 1);
      let list = buckets.get(bucketKey);
      if (!list) {
        list = [];
        buckets.set(bucketKey, list);
      }
      list.push(word);
    }
  }

  // Construct adjacency list
  const adj = new Map<string, string[]>();
  for (const bucketWords of buckets.values()) {
    if (bucketWords.length <= 1) continue;
    for (let i = 0; i < bucketWords.length; i++) {
      const u = bucketWords[i];
      let neighbors = adj.get(u);
      if (!neighbors) {
        neighbors = [];
        adj.set(u, neighbors);
      }
      for (let j = 0; j < bucketWords.length; j++) {
        if (i !== j) {
          neighbors.push(bucketWords[j]);
        }
      }
    }
  }

  // Deduplicate neighbor lists
  for (const [w, neighbors] of adj.entries()) {
    adj.set(w, Array.from(new Set(neighbors)));
  }

  GRAPH_CACHE.set(length, adj);
  return adj;
}

/**
 * Checks if two words of the same length differ by exactly one letter.
 */
export function isOneLetterDifference(w1: string, w2: string): { valid: boolean; changedIndex: number } {
  if (w1.length !== w2.length) return { valid: false, changedIndex: -1 };
  if (w1 === w2) return { valid: false, changedIndex: -1 };

  let diffCount = 0;
  let changedIndex = -1;

  for (let i = 0; i < w1.length; i++) {
    if (w1[i] !== w2[i]) {
      diffCount++;
      changedIndex = i;
      if (diffCount > 1) return { valid: false, changedIndex: -1 };
    }
  }

  return { valid: diffCount === 1, changedIndex };
}

/**
 * Returns letter set overlap between two words and checks zero-overlap.
 */
export function getLetterOverlap(w1: string, w2: string): {
  count: number;
  commonLetters: string[];
  isZeroOverlap: boolean;
} {
  const set1 = new Set(w1.toUpperCase().split(''));
  const set2 = new Set(w2.toUpperCase().split(''));
  const commonLetters: string[] = [];

  for (const char of set1) {
    if (set2.has(char)) {
      commonLetters.push(char);
    }
  }

  return {
    count: commonLetters.length,
    commonLetters: commonLetters.sort(),
    isZeroOverlap: commonLetters.length === 0,
  };
}

/**
 * Executes BFS on the validation graph to find the true shortest path between start and target.
 * Returns null if unreachable.
 */
export function findShortestPath(
  startWord: string,
  targetWord: string
): { path: string[]; par: number } | null {
  const start = startWord.toUpperCase();
  const target = targetWord.toUpperCase();

  if (start.length !== target.length) return null;
  if (!isValidWordInLexicon(start) || !isValidWordInLexicon(target)) return null;
  if (start === target) return { path: [start], par: 0 };

  const length = start.length;
  const adj = getGraphForLength(length);

  // Queue stores [currentWord, pathSoFar]
  const queue: Array<[string, string[]]> = [[start, [start]]];
  const visited = new Set<string>([start]);

  while (queue.length > 0) {
    const [curr, path] = queue.shift()!;
    const neighbors = adj.get(curr) || [];

    for (let i = 0; i < neighbors.length; i++) {
      const nextWord = neighbors[i];
      if (nextWord === target) {
        const fullPath = [...path, nextWord];
        return { path: fullPath, par: fullPath.length - 1 };
      }

      if (!visited.has(nextWord)) {
        visited.add(nextWord);
        queue.push([nextWord, [...path, nextWord]]);
      }
    }
  }

  return null;
}

/**
 * Computes the immediate NEXT word on the shortest path from current to target.
 */
export function getNextOptimalWord(currentWord: string, targetWord: string): string | null {
  const res = findShortestPath(currentWord, targetWord);
  if (res && res.path.length >= 2) {
    return res.path[1];
  }
  return null;
}

/**
 * Returns all valid 1-letter neighbors of a word that are not already in the excluded set (e.g. current trail).
 */
export function getValidNeighbors(currentWord: string, excludedWords?: Set<string>): string[] {
  const upper = currentWord.toUpperCase();
  const adj = getGraphForLength(upper.length);
  const neighbors = adj.get(upper) || [];

  if (!excludedWords || excludedWords.size === 0) {
    return neighbors.slice().sort();
  }

  return neighbors.filter(w => !excludedWords.has(w)).sort();
}
