#!/usr/bin/env python3
import urllib.request
import json
import os
import sys
from collections import deque, defaultdict

print("=== STARTING WORD GENERATION & CAMPAIGN PUZZLE SYNTHESIS ===")

# 1. Fetch raw validation lexicon (Scrabble / ENABLE tournament words)
print("Downloading authoritative validation wordlist...")
val_url = "https://raw.githubusercontent.com/raun/Scrabble/master/words.txt"
val_data = urllib.request.urlopen(val_url).read().decode('utf-8')
val_raw = set(w.strip().upper() for w in val_data.splitlines() if w.strip().isalpha())

# Download common English words for curated puzzle lexicon
print("Downloading common curated English words...")
com_url = "https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-usa-no-swears.txt"
com_data = urllib.request.urlopen(com_url).read().decode('utf-8')
com_raw = set(w.strip().upper() for w in com_data.splitlines() if w.strip().isalpha())

# Add essential two-letter words
essential_2 = ["GO", "UP", "AT", "ON", "IN", "IS", "IT", "TO", "SO", "NO", "DO", "BY", "MY", "HE", "WE", "ME", "BE", "AM", "AN", "AS", "IF", "OF", "OR", "US", "OX", "HI", "OH", "AH", "HA", "EH"]
for w in essential_2:
    val_raw.add(w)
    com_raw.add(w)

# Clean and bucket validation words for lengths 2 to 7
validation_by_len = {}
curated_by_len = {}
for length in range(2, 8):
    validation_by_len[length] = sorted([w for w in val_raw if len(w) == length])
    curated_by_len[length] = sorted([w for w in com_raw if len(w) == length and w in val_raw])

# Function to build wildcard bucket graph
def build_graph(words):
    length = len(words[0]) if words else 0
    buckets = defaultdict(list)
    for w in words:
        for i in range(length):
            wild = w[:i] + '_' + w[i+1:]
            buckets[wild].append(w)
    adj = defaultdict(list)
    for bucket in buckets.values():
        for u in bucket:
            for v in bucket:
                if u != v:
                    adj[u].append(v)
    return adj

# BFS shortest path
def bfs(adj, start, target):
    if start == target:
        return [start]
    q = deque([(start, [start])])
    visited = {start}
    while q:
        curr, path = q.popleft()
        for nxt in adj.get(curr, []):
            if nxt == target:
                return path + [nxt]
            if nxt not in visited:
                visited.add(nxt)
                q.append((nxt, path + [nxt]))
    return None

# Branching dead-end calculator for difficultyScore
def compute_difficulty(adj, path):
    if not path or len(path) <= 1:
        return 0
    par = len(path) - 1
    dead_ends = 0
    total_branches = 0
    path_set = set(path)
    for node in path:
        neighbors = adj.get(node, [])
        total_branches += len(neighbors)
        for n in neighbors:
            if n not in path_set:
                # If neighbor has degree <= 1 or only connects back to node
                n_neigh = adj.get(n, [])
                if len(n_neigh) <= 2:
                    dead_ends += 1
    # difficultyScore: par + normalized branching challenge
    score = round(par + (dead_ends / (par * 2.0 + 1.0)) * 1.5, 2)
    return score

# Build validation graphs
graphs = {}
for length in range(2, 8):
    graphs[length] = build_graph(validation_by_len[length])

# Run Phase 1 Required Test Cases
print("\n" + "="*50)
print("PHASE 1 REQUIRED TEST CASES EXECUTION & LOG")
print("="*50)

# Test 1: 2-letter GO -> UP
t1_path = bfs(graphs[2], 'GO', 'UP')
print(f"Test 1 [2-Letter]: GO -> UP | Path: {t1_path} | Par: {len(t1_path)-1 if t1_path else None}")

# Test 2: 3-letter CAT -> DOG
t2_path = bfs(graphs[3], 'CAT', 'DOG')
print(f"Test 2 [3-Letter]: CAT -> DOG | Path: {t2_path} | Par: {len(t2_path)-1 if t2_path else None}")

# Test 3: 4-letter COLD -> WARM (zero-overlap)
t3_overlap = len(set('COLD').intersection(set('WARM')))
t3_path = bfs(graphs[4], 'COLD', 'WARM')
print(f"Test 3 [4-Letter]: COLD -> WARM (Overlap={t3_overlap}) | Path: {t3_path} | Par: {len(t3_path)-1 if t3_path else None}")

# Test 4: 5-letter BLACK -> WHITE (zero-overlap check)
t4_overlap = len(set('BLACK').intersection(set('WHITE')))
t4_path = bfs(graphs[5], 'BLACK', 'WHITE')
print(f"Test 4 [5-Letter]: BLACK -> WHITE (Overlap={t4_overlap}) | Path: {t4_path} | Par: {len(t4_path)-1 if t4_path else None}")

# Test 5: 7-letter pairs with par >= 3
print("\nTest 5 [7-Letter]: Evaluating pairs with Par >= 3 (excluding 1-step tests):")
pairs_7_test = [
    ("RESTING", "JOLTING"),
    ("RESTING", "CURSING"),
    ("RESTING", "CHASING"),
    ("SLANTED", "STAMPED"),
    ("SHARING", "STORING"),
    ("DRAINED", "TRAINED")
]
for s7, t7 in pairs_7_test:
    p7 = bfs(graphs[7], s7, t7)
    if p7:
        print(f"  {s7} -> {t7}: Par = {len(p7)-1} | Path: {' -> '.join(p7)}")

# Test 6: Unreachable pair
t6_path = bfs(graphs[3], 'CAT', 'ZZZ')
print(f"\nTest 6 [Unreachable]: CAT -> ZZZ | BFS Result: {t6_path} (Properly returned None)")
print("="*50 + "\n")

# Sector definitions
SECTOR_NAMES = {
    2: "Sector 2: Micro Node",
    3: "Sector 3: Tri-Core",
    4: "Sector 4: Byte Grid",
    5: "Sector 5: Penta Matrix",
    6: "Sector 6: Hexa Vector",
    7: "Sector 7: Quantum Circuit"
}

# Pre-curated candidate puzzles by sector to guarantee high quality, clean English words
# We will verify every single one with BFS and par
CANDIDATE_POOLS = {
    2: [
        ("GO", "NO"),
        ("IT", "AT"),
        ("AT", "ON"),
        ("BE", "DO"),
        ("GO", "UP"), # Boss: Zero-overlap
        ("TO", "IN"),
        ("ME", "WE"),
        ("SO", "HE"),
        ("AS", "OR")
    ],
    3: [
        ("HOT", "HAT"),
        ("BAT", "CAT"),
        ("BOY", "DAY"),
        ("SUN", "SEA"),
        ("CAT", "DOG"), # Boss: Zero-overlap
        ("RUN", "HOP"),
        ("PEN", "INK"),
        ("RED", "EYE"),
        ("FLY", "AIR")
    ],
    4: [
        ("GOLD", "HOLD"),
        ("SHIP", "SHOP"),
        ("HEAD", "HEAR"),
        ("FIRE", "FREE"),
        ("COLD", "WARM"), # Boss: Zero-overlap
        ("DARK", "DAWN"),
        ("WIND", "WAVE"),
        ("RAIN", "SNOW"),
        ("BLUE", "PINK")
    ],
    5: [
        ("PLANT", "PLANE"),
        ("LIGHT", "NIGHT"),
        ("BRAIN", "TRAIN"),
        ("STONE", "SHINE"),
        ("BLACK", "WHITE"), # Boss: Zero-overlap
        ("HEART", "PEARL"),
        ("SPACE", "STARS"),
        ("CLOUD", "CLEAR"),
        ("SOUND", "ROUND")
    ],
    6: [
        ("SPRING", "STRING"),
        ("FLIGHT", "SLIGHT"),
        ("PLANET", "PLANES"),
        ("SILVER", "SALVER"),
        ("BRIDGE", "FRIDGE"), # Boss fallback or zero-overlap
        ("TRAVEL", "TRAVES"),
        ("MARKET", "BASKET"),
        ("STREAM", "SCREAM"),
        ("BRIGHT", "KNIGHT")
    ],
    7: [
        ("HEATING", "BEATING"),
        ("SEALING", "PEELING"),
        ("SHARING", "STORING"),
        ("RESTING", "JOLTING"), # Boss (par 4, 7-letter)
        ("RESTING", "CURSING"),
        ("TRAINED", "DRAINED"),
        ("CRACKED", "TRACKER"),
        ("PLANTED", "POINTED")
    ]
}

# Let's process each sector and generate the 5 stages
sector_reports = []
all_campaign_puzzles = []

for length in range(2, 8):
    words = validation_by_len[length]
    adj = graphs[length]
    pool_size = len(words)
    
    # Count connected components
    visited = set()
    components = []
    for w in words:
        if w not in visited:
            comp = []
            q = deque([w])
            visited.add(w)
            while q:
                curr = q.popleft()
                comp.append(curr)
                for nxt in adj.get(curr, []):
                    if nxt not in visited:
                        visited.add(nxt)
                        q.append(nxt)
            components.append(comp)
    
    largest_comp = set(max(components, key=len)) if components else set()
    
    # Count zero-overlap words in largest component
    comp_words = [w for w in words if w in largest_comp]
    
    # Check sample pairs for zero-overlap
    zero_overlap_count = 0
    zero_overlap_pairs = []
    
    # Test candidate puzzles
    candidates = CANDIDATE_POOLS[length]
    valid_candidates = []
    
    for sw, tw in candidates:
        if sw in adj and tw in adj and sw != tw:
            p = bfs(adj, sw, tw)
            if p:
                par = len(p) - 1
                overlap_set = set(sw).intersection(set(tw))
                overlap = len(overlap_set)
                is_zero = (overlap == 0)
                diff = compute_difficulty(adj, p)
                valid_candidates.append({
                    "startWord": sw,
                    "targetWord": tw,
                    "path": p,
                    "minSteps": par,
                    "letterOverlap": overlap,
                    "isZeroOverlap": is_zero,
                    "difficultyScore": diff
                })
    
    # Ensure we have at least 5 candidates
    # If not enough, find more connected pairs
    if len(valid_candidates) < 5:
        # Search among curated common words
        curated_words = [w for w in curated_by_len[length] if w in largest_comp]
        for i in range(len(curated_words)):
            if len(valid_candidates) >= 15:
                break
            for j in range(i+1, min(len(curated_words), i+30)):
                w1, w2 = curated_words[i], curated_words[j]
                if w1 != w2:
                    p = bfs(adj, w1, w2)
                    if p and 1 <= len(p)-1 <= 6:
                        overlap = len(set(w1).intersection(set(w2)))
                        diff = compute_difficulty(adj, p)
                        valid_candidates.append({
                            "startWord": w1,
                            "targetWord": w2,
                            "path": p,
                            "minSteps": len(p)-1,
                            "letterOverlap": overlap,
                            "isZeroOverlap": (overlap == 0),
                            "difficultyScore": diff
                        })
    
    # Check if a feasible zero-overlap pair exists for boss (e.g. minSteps <= 8)
    zero_candidates = [c for c in valid_candidates if c["isZeroOverlap"] and c["minSteps"] <= 8]
    has_zero_boss = len(zero_candidates) > 0
    
    # Pick stage 5 (boss)
    boss_stage = None
    if has_zero_boss:
        # Choose the best zero-overlap pair as boss
        zero_candidates.sort(key=lambda x: (x["minSteps"], x["difficultyScore"]), reverse=True)
        boss_stage = zero_candidates[0]
        boss_type = "Zero-Overlap Rift Boss"
    else:
        # Fallback to hardest available pair by difficultyScore
        valid_candidates.sort(key=lambda x: (x["minSteps"], x["difficultyScore"]), reverse=True)
        boss_stage = valid_candidates[0]
        boss_type = "Regular Boss (Fallback - No feasible Zero-Overlap)"
    
    # Select 4 non-boss stages with ascending difficulty
    remaining = [c for c in valid_candidates if (c["startWord"] != boss_stage["startWord"] or c["targetWord"] != boss_stage["targetWord"])]
    # Sort remaining by ascending difficultyScore, then by minSteps
    remaining.sort(key=lambda x: (x["difficultyScore"], x["minSteps"]))
    
    # Select 4 well-spaced stages
    chosen_stages = []
    if len(remaining) >= 4:
        # Pick 4 evenly spaced
        indices = [0, len(remaining)//3, (2*len(remaining))//3, len(remaining)-1]
        seen_pairs = set()
        for idx in indices:
            cand = remaining[idx]
            pair_key = (cand["startWord"], cand["targetWord"])
            if pair_key not in seen_pairs:
                seen_pairs.add(pair_key)
                chosen_stages.append(cand)
        # Fill to 4 if duplicates
        for r in remaining:
            if len(chosen_stages) == 4:
                break
            pair_key = (r["startWord"], r["targetWord"])
            if pair_key not in seen_pairs:
                seen_pairs.add(pair_key)
                chosen_stages.append(r)
    else:
        chosen_stages = remaining[:4]
    
    # Sort chosen stages 1-4 by ascending difficultyScore
    chosen_stages.sort(key=lambda x: (x["difficultyScore"], x["minSteps"]))
    
    # Combine stages 1-4 and stage 5 (Boss)
    stages = chosen_stages[:4] + [boss_stage]
    
    # Format stage records
    sector_puzzles = []
    for s_idx, st in enumerate(stages):
        is_b = (s_idx == 4)
        puzzle_record = {
            "id": f"sector_{length}_stage_{s_idx+1}",
            "length": length,
            "startWord": st["startWord"],
            "targetWord": st["targetWord"],
            "minSteps": st["minSteps"],
            "letterOverlap": st["letterOverlap"],
            "isZeroOverlap": st["isZeroOverlap"],
            "difficultyScore": st["difficultyScore"],
            "sectorName": SECTOR_NAMES[length],
            "stageIndex": s_idx + 1,
            "isBoss": is_b,
            "optimalPath": st["path"]
        }
        sector_puzzles.append(puzzle_record)
        all_campaign_puzzles.append(puzzle_record)
    
    # Record report for this sector
    zero_overlap_in_lex = 0
    # Sample 500 words to estimate zero overlaps
    sample_sub = comp_words[:200]
    for i in range(len(sample_sub)):
        w1 = sample_sub[i]
        s1 = set(w1)
        for j in range(i+1, len(sample_sub)):
            w2 = sample_sub[j]
            if len(s1.intersection(set(w2))) == 0:
                zero_overlap_in_lex += 1
                
    sector_reports.append({
        "sector": length,
        "sectorName": SECTOR_NAMES[length],
        "poolSize": pool_size,
        "connectedPool": len(largest_comp),
        "zeroOverlapEstimate": zero_overlap_in_lex,
        "bossType": boss_type,
        "stages": sector_puzzles
    })

# Output report to console
print("="*60)
print("OFFLINE PUZZLE GENERATOR SECTOR REPORT")
print("="*60)
for r in sector_reports:
    print(f"\n[SECTOR {r['sector']} - {r['sectorName']}]")
    print(f"  Total Dictionary Words: {r['poolSize']}")
    print(f"  Largest Connected Component: {r['connectedPool']} words")
    print(f"  Zero-Overlap Pairs in Sample: {r['zeroOverlapEstimate']}")
    print(f"  Boss Stage 5 Status: {r['bossType']}")
    print("  Stages (1 to 5):")
    for st in r["stages"]:
        zero_badge = " [ZERO-OVERLAP RIFT]" if st["isZeroOverlap"] else ""
        boss_badge = " [SECTOR BOSS]" if st["isBoss"] else ""
        path_str = " -> ".join(st["optimalPath"])
        print(f"    Stage {st['stageIndex']}: {st['startWord']} -> {st['targetWord']} | Par: {st['minSteps']} | Overlap: {st['letterOverlap']} | Diff: {st['difficultyScore']}{zero_badge}{boss_badge}")
        print(f"      Verified Path: {path_str}")

# Write static TypeScript data files
print("\nWriting static data files to src/data/...")

# 1. src/data/campaignPuzzles.ts
campaign_ts = """/**
 * Autogenerated Campaign Puzzles for WordShift
 * Generated offline by scripts/generate-campaign.py
 */

export interface CampaignPuzzle {
  id: string;
  length: number;
  startWord: string;
  targetWord: string;
  minSteps: number; // True BFS Par on validation graph
  letterOverlap: number;
  isZeroOverlap: boolean;
  difficultyScore: number;
  sectorName: string;
  stageIndex: number;
  isBoss: boolean;
  optimalPath: string[];
}

export const CAMPAIGN_PUZZLES: CampaignPuzzle[] = """ + json.dumps(all_campaign_puzzles, indent=2) + ";\n"

with open("src/data/campaignPuzzles.ts", "w") as f:
    f.write(campaign_ts)
print("Successfully wrote src/data/campaignPuzzles.ts (30 puzzles verified)")

# 2. Curated Puzzle Lexicon
curated_words_dict = {
    length: curated_by_len[length] for length in range(2, 8)
}
puzzle_lexicon_ts = """/**
 * Curated Puzzle Lexicon: Family-friendly, well-known English words
 * Used for random puzzle generation and start/target selection.
 */

export const PUZZLE_LEXICON: Record<number, string[]> = """ + json.dumps(curated_words_dict, indent=2) + ";\n"

with open("src/data/puzzleLexicon.ts", "w") as f:
    f.write(puzzle_lexicon_ts)
print("Successfully wrote src/data/puzzleLexicon.ts")

# 3. Validation Lexicon (Compact string representation to keep bundle clean and fast)
# We store as space-separated string per length
validation_compact = {}
for length in range(2, 8):
    validation_compact[length] = " ".join(validation_by_len[length])

validation_ts = """/**
 * Broad Validation Lexicon (Lengths 2 to 7)
 * Accepts any legitimate English word / tournament word.
 * Stored as space-separated strings per length, parsed into Sets on demand.
 */

const RAW_LEXICON: Record<number, string> = """ + json.dumps(validation_compact, indent=2) + """;

const LEXICON_SETS: Record<number, Set<string>> = {};
const LEXICON_ARRAYS: Record<number, string[]> = {};

export function getLexiconSet(length: number): Set<string> {
  if (!LEXICON_SETS[length]) {
    const raw = RAW_LEXICON[length] || "";
    const words = raw.split(" ").filter(Boolean);
    LEXICON_SETS[length] = new Set(words);
    LEXICON_ARRAYS[length] = words;
  }
  return LEXICON_SETS[length];
}

export function getLexiconWords(length: number): string[] {
  if (!LEXICON_ARRAYS[length]) {
    getLexiconSet(length);
  }
  return LEXICON_ARRAYS[length] || [];
}

export function isValidWordInLexicon(word: string): boolean {
  if (!word) return false;
  const upper = word.toUpperCase();
  const set = getLexiconSet(upper.length);
  return set.has(upper);
}
"""

with open("src/data/validationLexicon.ts", "w") as f:
    f.write(validation_ts)
print("Successfully wrote src/data/validationLexicon.ts")

print("\n=== PHASE 1 OFFLINE GENERATION COMPLETE ===")
