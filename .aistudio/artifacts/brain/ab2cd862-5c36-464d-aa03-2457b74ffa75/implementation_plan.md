# WordShift: Retro Arcade Word-Ladder Game

An authentic retro arcade terminal word-ladder puzzle game (Doublets) where players morph a start word into a target word by altering exactly one letter at a time through verified English words across word lengths 2 to 7. Built with a two-tiered lexicon architecture, precomputed solvable campaign stages, an interactive circuit-node trail, daily terminal challenges, lexical graph exploration, and responsive retro terminal aesthetics.

### User Review & Critical Decisions

> [!IMPORTANT]
> The implementation strictly adheres to the phased specification across all 7 development phases:

- **Phase 1 (Lexicon, Graph & Offline Puzzle Gen)**: Separate broad Validation Lexicon and curated Puzzle Lexicon; wildcard bucket neighbor graph; offline generator script producing all 30 campaign puzzles (6 sectors $\times$ 5 stages) with BFS par, branching difficulty scores, and sector fallback reporting.
- **Phase 2 (Core Gameplay & Trail)**: Single-slot cursor input, on-screen arcade keyboard (preventing mobile keyboard popups), instant validation with specific inline errors, linear trail array with truncate-on-rewind, live BFS hint, next-valid-words drawer, and par star scoring.
- **Phase 3 (Campaign System & Persistence)**: 6 Sectors (2–7 letters) with unlock conditions ($\ge 3$ stages cleared), Boss and Zero-Overlap Rift badges, and fail-safe localStorage with in-memory fallback.
- **Phase 4 (Free Play & Custom Sandbox)**: Random puzzle generator with length/difficulty filters, and custom start/target pair analyzer with real-time BFS verification.
- **Phase 5 (Audio & Terminal Polish)**: Synthesized Web Audio API (key click, valid chime, error buzzer, fanfare), user-gesture audio activation, top bar mute toggle, scanline/effects toggle, and strict visual color tokens (Phosphor Green, Neon Cyan, Amber strictly for target, Violet/Magenta for Zero-Overlap).
- **Phase 6 (Daily Terminal Challenge & Records)**: Deterministic daily seeded puzzle rotating across difficulty tiers; player stats dossier (streaks, par efficiency, zero-overlap rifts bridged); and spoiler-free retro arcade clipboard share card.
- **Phase 7 (Lexical Graph Explorer & Verification Suite)**: Interactive neighborhood mini-map mode visualizing connected word clusters; Par-Rush challenge timer mode; and complete automated build-time and runtime test suites covering all edge cases.

---

### 1. Overview & Core Concept

**WordShift** challenges players to navigate lexical networks by modifying one letter at a time:
- **Campaign Sectors 2–7**: 6 difficulty sectors representing word lengths from 2 to 7 letters, with 5 stages per sector culminating in a sector Boss (or Zero-Overlap Rift).
- **Zero-Overlap Badging**: When $\text{Letters}(W_{\text{start}}) \cap \text{Letters}(W_{\text{target}}) = \emptyset$, the puzzle is awarded a dedicated Zero-Overlap Rift badge.
- **Visual Trail HUD**: A vertical glowing circuit-node trail recording every move, highlighting modified letters with both phosphor glow and an underline marker bar, allowing players to rewind and explore alternative paths.

---

### 2. User Experience & Visual Design

#### A. Key User Flows
1. **Campaign Map & Sector Unlocking**:
   - Player selects from Sector 2 (2 letters) to Sector 7 (7 letters).
   - Sector $K+1$ unlocks when at least 3 of 5 stages in Sector $K$ are cleared.
   - Stage $N+1$ unlocks when Stage $N$ is completed.
2. **Terminal Gameplay & Input**:
   - The active word is rendered in prominent arcade letter cells ($\ge 44\text{px}$ touch targets).
   - Player taps a letter cell to focus it (supporting Arrow keys, Backspace/Esc to deselect).
   - Entering a letter via physical keyboard or the on-screen retro keyboard immediately tests validity.
   - If valid, the move appends to the linear trail with a connector pulse and mechanical audio chime.
   - If invalid, an inline status alert ("Not a word", "Changed more than one letter", "Already in your trail", "Same word") and red flash trigger, reverting the slot.
3. **Helper Drawers & Hints**:
   - **Next Valid Words Drawer**: Collapsible panel listing all 1-letter valid neighbor words not currently in the trail; tapping any word executes that move.
   - **Live Path Hint**: Live BFS determines the immediate next word along the shortest path to the target. Using a hint caps the stage score at 2 stars.
   - **Surrender Flow**: Allows surrendering with 0 stars to reveal the complete optimal solution path without marking the stage completed.
4. **Daily Terminal Challenge (Phase 6)**:
   - Synchronized daily puzzle seeded by current date with dedicated daily leaderboard stats.
   - Share button generates an arcade ASCII results card for clipboard sharing.
5. **Lexical Graph Explorer & Speed Mode (Phase 7)**:
   - Toggle between Linear Trail and Visual Cluster Graph to see nearby branches and depth to target.
   - Optional Par-Rush mode with countdown timer for arcade veterans.

#### B. Visual Hierarchy & Theme Tokens
- **Canvas & Background**: Deep obsidian (`#0B0F17`, `#0F172A`) with subtle radial CRT vignette and toggleable scanline grid.
- **Chassis & Panels**: Charcoal slate (`#1E293B`) with hairline phosphor border (`#10B98126`).
- **Color Roles**:
  - Phosphor Emerald (`#10B981`): Normal nodes, valid moves, primary terminal chrome.
  - Neon Cyan (`#06B6D4`): Hints, par metrics, and BFS benchmarks.
  - Radiant Amber (`#F59E0B`): **Exclusively reserved** for the Target word.
  - Violet/Magenta (`#A855F7`): Distinctive Zero-Overlap Rift badge and indicators.
  - Crimson Flash (`#EF4444`): Error flash paired with explicit textual feedback.
- **Typography**: `Space Mono` / `JetBrains Mono` for letter tiles and numerical metrics (`tabular-nums`); `Plus Jakarta Sans` for instructional copy and definitions.
- **Accessibility**: Dual-coded feedback (color + underline marker bar for changed letters; color + text for errors; shape + text for zero-overlap badge; WCAG AA contrast).

---

### 3. Phased Implementation Roadmap (Phases 1 through 7)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PHASE 1: BUILD-TIME GEN                         │
│  - Compile broad Validation Lexicon (2-7 letters)                      │
│  - Compile curated Puzzle Lexicon (clean, common start/targets)        │
│  - Wildcard bucket graph construction (O(N * L))                       │
│  - Generator script generates all 30 campaign puzzles + par + stats    │
│  - Output build report & verified test cases                           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        PHASE 2: CORE & TRAIL                           │
│  - Linear trail state with truncate-on-rewind & free undo              │
│  - Single-slot cursor input (physical + on-screen retro keys)          │
│  - Move validation engine with specific inline error messaging         │
│  - Vertical circuit-node trail with changed-letter underline markers   │
│  - Next-valid-words drawer, live BFS shortest-path hint, surrender     │
│  - Star scoring: 3 stars (par), 2 stars (par+1/2 or hint), 1 star      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        PHASE 3: CAMPAIGN SYSTEM                        │
│  - 6 Sectors (lengths 2-7), 5 stages each with Boss / Rift             │
│  - Sector unlock rules (>= 3 stages cleared) & stage unlock (N -> N+1) │
│  - Victory modal (par comparison, stars, action buttons)               │
│  - Resilient persistence (try/catch localStorage + in-memory fallback) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        PHASE 4: FREE PLAY SANDBOX                      │
│  - Length (2-7) & Difficulty filter puzzle generator                   │
│  - Custom start/target input with real-time BFS pathfinder & solver    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        PHASE 5: AUDIO & POLISH                         │
│  - Synthesized Web Audio API (key click, valid chime, error, fanfare)  │
│  - User-gesture audio initialization & visible mute toggle             │
│  - CRT scanlines / effects toggle with reduced-motion compliance       │
│  - 2-column desktop / 1-column responsive layout (tested at 375px)     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                PHASE 6: DAILY CHALLENGE & RECORDS                      │
│  - Seeded daily mission generator (date-based hash for uniform puzzle) │
│  - Player terminal records dossier (win streak, par ratio, rift count) │
│  - Shareable retro arcade clipboard card with ASCII trail matrix       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                PHASE 7: GRAPH EXPLORER & VERIFICATION                  │
│  - Interactive neighborhood cluster mini-map mode                      │
│  - Par-Rush challenge timer mode for speedrunners                      │
│  - Full automated verification matrix across all 30 puzzles & tests    │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 4. Technical Architecture & Data Strategy

#### A. Core Data Interfaces
```typescript
export interface WordStep {
  word: string;
  changedIndex: number; // -1 for start word, 0..L-1 for altered letter
  stepNumber: number;
}

export interface CampaignPuzzle {
  id: string;
  length: number;
  startWord: string;
  targetWord: string;
  minSteps: number; // True BFS par on validation graph
  letterOverlap: number;
  isZeroOverlap: boolean;
  difficultyScore: number; // minSteps + dead-end / branching complexity
  sectorName: string;
  stageIndex: number; // 1 to 5
  isBoss: boolean;
}

export interface DailyChallengePuzzle extends CampaignPuzzle {
  dateKey: string; // YYYY-MM-DD
}

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
}
```

#### B. Verification & Test Plan (Phases 1–7)
1. **Phase 1 Validation Tests**:
   - `GO` $\rightarrow$ `UP` (2 letters)
   - `CAT` $\rightarrow$ `DOG` (3 letters)
   - `COLD` $\rightarrow$ `WARM` (4 letters, verified Zero-Overlap)
   - `BLACK` $\rightarrow$ `WHITE` (5 letters, check connectivity & report)
   - 7-letter pairs with $\text{par} \ge 3$ (report real par found)
   - Unreachable word pair test (verify BFS returns `null`)
2. **Phase 2 & 3 Game State Tests**:
   - Playthrough at par achieves 3 stars; 1 extra move achieves 2 stars; hint usage caps at 2 stars.
   - Rewind to step $K$ verifies subsequent steps are truncated without move penalty.
   - Verify localStorage failure fallback by mocking restricted environment.
3. **Phase 4 & 5 Controls & Audio**:
   - Touch targets $\ge 44\text{px}$ on mobile 375px viewport.
   - AudioContext initializes cleanly on first tap.
   - Color isolation: amber strictly for target, violet/magenta for Zero-Overlap.
4. **Phase 6 & 7 Features**:
   - Daily puzzle generates deterministically from date string.
   - Clipboard share card formats properly.
   - Complete compilation and clean lint report.
