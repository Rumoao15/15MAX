/**
 * Gerador de jogos Lotofácil – Regra 9×6 com Ranking Incrementado
 * 
 * 9 dezenas do último concurso (as melhores no ranking global)
 * 6 dezenas fora do último concurso (as melhores no ranking global)
 * Com variação controlada, scoring e filtros opcionais.
 */

// ── Types ──────────────────────────────────────────────────────────

export interface GeneratorOptions {
  w1: number; // peso frequência histórica (default 0.70)
  w2: number; // peso recência/atraso (default 0.20)
  w3: number; // peso diversidade entre jogos (default 0.10)
  filterParImpar: boolean;    // balanceamento par/ímpar (6-9 ímpares)
  filterBaixaAlta: boolean;   // balanceamento baixas/altas (6-9 baixas)
  filterConsecutivas: boolean; // evitar >3 consecutivas
  maxIntersection: number;     // máx interseção entre dois jogos (default 13)
  seed: string;                // seed para reprodutibilidade (vazio = aleatório)
}

export interface DezenaMeta {
  dezena: number;
  frequency: number;
  atrasoAtual: number;
  rankPosition: number; // 1 = mais sorteada
  score: number;
  source: "A" | "B"; // A = último concurso, B = fora
  chosenBy: "base" | "variacao";
}

export interface GeneratedGame {
  dezenas: number[];         // 15 dezenas ordenadas
  dezenasA: number[];        // 9 do último concurso
  dezenasB: number[];        // 6 fora do último
  meta: DezenaMeta[];        // info de cada dezena
  stats: GameStats;
}

export interface GameStats {
  pares: number;
  impares: number;
  baixas: number;  // 1-12
  altas: number;   // 13-25
  maiorSequencia: number;
  soma: number;
}

export interface GeneratorResult {
  games: GeneratedGame[];
  warnings: string[];
  lastConcurso: number;
}

export interface FrequencyData {
  dezena: number;
  frequencia_total: number;
  atraso_atual: number;
}

// ── Seeded PRNG ────────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return h;
}

// ── Helpers ────────────────────────────────────────────────────────

function calcStats(dezenas: number[]): GameStats {
  const sorted = [...dezenas].sort((a, b) => a - b);
  let pares = 0, baixas = 0, soma = 0, maxSeq = 1, curSeq = 1;
  for (let i = 0; i < sorted.length; i++) {
    const d = sorted[i];
    soma += d;
    if (d % 2 === 0) pares++;
    if (d <= 12) baixas++;
    if (i > 0 && sorted[i] === sorted[i - 1] + 1) {
      curSeq++;
      if (curSeq > maxSeq) maxSeq = curSeq;
    } else {
      curSeq = 1;
    }
  }
  return {
    pares,
    impares: 15 - pares,
    baixas,
    altas: 15 - baixas,
    maiorSequencia: maxSeq,
    soma,
  };
}

function passesFilters(dezenas: number[], opts: GeneratorOptions): boolean {
  const s = calcStats(dezenas);
  if (opts.filterParImpar && (s.impares < 6 || s.impares > 9)) return false;
  if (opts.filterBaixaAlta && (s.baixas < 6 || s.baixas > 9)) return false;
  if (opts.filterConsecutivas && s.maiorSequencia > 3) return false;
  return true;
}

function intersectionCount(a: number[], b: number[]): number {
  const setB = new Set(b);
  return a.filter(d => setB.has(d)).length;
}

// ── Core Algorithm ─────────────────────────────────────────────────

export function generateGames9by6Ranking(
  lastDraw: number[],
  frequencyData: FrequencyData[],
  totalConcursos: number,
  options: GeneratorOptions
): GeneratorResult {
  const warnings: string[] = [];

  // Build frequency/atraso maps
  const freqMap = new Map<number, number>();
  const atrasoMap = new Map<number, number>();
  for (const fd of frequencyData) {
    freqMap.set(fd.dezena, fd.frequencia_total);
    atrasoMap.set(fd.dezena, fd.atraso_atual);
  }

  // Compute global rank (1 = most frequent)
  const allDezenas = Array.from({ length: 25 }, (_, i) => i + 1);
  const sorted = [...allDezenas].sort((a, b) => {
    const fa = freqMap.get(a) || 0, fb = freqMap.get(b) || 0;
    if (fb !== fa) return fb - fa;
    return a - b;
  });
  const rankMap = new Map<number, number>();
  sorted.forEach((d, i) => rankMap.set(d, i + 1));

  // Normalize frequency
  const maxFreq = Math.max(...allDezenas.map(d => freqMap.get(d) || 0), 1);
  const maxAtraso = Math.max(...allDezenas.map(d => atrasoMap.get(d) || 0), 1);

  // Effective weights (if no atraso data, shift w2 to w1/w3)
  const hasAtraso = maxAtraso > 0;
  let ew1 = options.w1, ew2 = options.w2, ew3 = options.w3;
  if (!hasAtraso) {
    ew1 = 0.85;
    ew2 = 0;
    ew3 = 0.15;
  }

  // Split into Group A (in lastDraw) and Group B (not in lastDraw)
  const lastSet = new Set(lastDraw);
  const groupA = allDezenas.filter(d => lastSet.has(d)); // 15
  const groupB = allDezenas.filter(d => !lastSet.has(d)); // 10

  // Sort each group by frequency desc
  const sortByFreq = (arr: number[]) => [...arr].sort((a, b) => {
    const fa = freqMap.get(a) || 0, fb = freqMap.get(b) || 0;
    if (fb !== fa) return fb - fa;
    return a - b;
  });

  const sortedA = sortByFreq(groupA); // best-to-worst within lastDraw
  const sortedB = sortByFreq(groupB); // best-to-worst within not-lastDraw

  // Base selections
  const baseA9 = sortedA.slice(0, 9);
  const altA = sortedA.slice(9);    // positions 10-15 (up to 6)
  const baseB6 = sortedB.slice(0, 6);
  const altB = sortedB.slice(6);    // positions 7-10 (up to 4)

  // PRNG
  const rng = options.seed
    ? mulberry32(hashString(options.seed))
    : () => Math.random();

  // Score function for variation
  function scoreForVariation(d: number, usedCounts: Map<number, number>): number {
    const normFreq = (freqMap.get(d) || 0) / maxFreq;
    const recency = hasAtraso ? 1 - (atrasoMap.get(d) || 0) / maxAtraso : 0;
    const repetition = (usedCounts.get(d) || 0) / 5;
    return ew1 * normFreq + ew2 * recency - ew3 * repetition;
  }

  const games: GeneratedGame[] = [];
  const usedCounts = new Map<number, number>();

  // Track which dezenas used so far
  function recordUsage(dezenas: number[]) {
    for (const d of dezenas) {
      usedCounts.set(d, (usedCounts.get(d) || 0) + 1);
    }
  }

  const MAX_ATTEMPTS = 200;

  // Pre-generate all unique swap combinations for systematic variation
  // For A: pick which altA elements swap in, and which baseA9 elements swap out
  // For B: same logic
  function generateSwapCombos(base: number[], alts: number[], maxSwaps: number): number[][] {
    const combos: number[][] = [];
    // Generate all possible 1-swap and 2-swap results
    for (let i = 0; i < alts.length; i++) {
      for (let j = 0; j < base.length; j++) {
        const c1 = [...base];
        c1[j] = alts[i];
        combos.push(c1.sort((a, b) => a - b));
        if (maxSwaps >= 2) {
          for (let i2 = i + 1; i2 < alts.length; i2++) {
            for (let j2 = j + 1; j2 < base.length; j2++) {
              const c2 = [...base];
              c2[j] = alts[i];
              c2[j2] = alts[i2];
              if (new Set(c2).size === c2.length) {
                combos.push(c2.sort((a, b) => a - b));
              }
            }
          }
        }
      }
    }
    return combos;
  }

  const aCombos = altA.length > 0 ? generateSwapCombos(baseA9, altA, 2) : [];
  const bCombos = altB.length > 0 ? generateSwapCombos(baseB6, altB, 2) : [];

  for (let g = 0; g < 5; g++) {
    let bestGame: { a9: number[]; b6: number[] } | null = null;
    let bestScore = -Infinity;

    if (g === 0) {
      // First game: pure base
      bestGame = { a9: [...baseA9], b6: [...baseB6] };
    } else {
      // Try systematic combinations + random perturbations
      const candidates: { a9: number[]; b6: number[]; score: number }[] = [];

      // Systematic: try all aCombos × base B6, and base A9 × bCombos, and aCombos × bCombos
      const aOptions = [baseA9, ...aCombos];
      const bOptions = [baseB6, ...bCombos];

      for (const a9 of aOptions) {
        for (const b6 of bOptions) {
          // Skip base×base (that's game 0)
          if (a9 === baseA9 && b6 === baseB6) continue;

          const combined = [...a9, ...b6];
          if (new Set(combined).size !== 15) continue;

          if (!passesFilters(combined, options)) continue;

          const final = combined.sort((x, y) => x - y);

          // Check not identical to existing games
          let dominated = false;
          for (const prev of games) {
            if (JSON.stringify(final) === JSON.stringify(prev.dezenas)) {
              dominated = true;
              break;
            }
            if (intersectionCount(final, prev.dezenas) > options.maxIntersection) {
              dominated = true;
              break;
            }
          }
          if (dominated) continue;

          const gameScore = final.reduce((sum, d) => sum + scoreForVariation(d, usedCounts), 0)
            + rng() * 0.5; // small random tiebreaker

          candidates.push({ a9: [...a9], b6: [...b6], score: gameScore });
        }
      }

      // Sort by score descending and pick the best
      candidates.sort((a, b) => b.score - a.score);

      if (candidates.length > 0) {
        // Pick from top candidates with some randomness
        const pickIdx = Math.min(Math.floor(rng() * Math.min(candidates.length, 5)), candidates.length - 1);
        const pick = candidates[pickIdx];
        bestGame = { a9: pick.a9, b6: pick.b6 };
      }
    }

    if (!bestGame) {
      // Fallback: force a variation by cycling through altA/altB deterministically
      const a9 = [...baseA9];
      const b6 = [...baseB6];
      if (altA.length > 0) {
        const swapIdx = (g - 1) % altA.length;
        a9[a9.length - 1 - (g % a9.length)] = altA[swapIdx];
      }
      if (altB.length > 0) {
        const swapIdx = (g - 1) % altB.length;
        b6[b6.length - 1 - (g % b6.length)] = altB[swapIdx];
      }
      if (new Set([...a9, ...b6]).size === 15) {
        bestGame = { a9, b6 };
      } else {
        bestGame = { a9: [...baseA9], b6: [...baseB6] };
      }
      warnings.push(`Jogo ${g + 1}: não foi possível satisfazer 100% dos filtros, exibindo a melhor combinação encontrada.`);
    }

    const finalDezenas = [...bestGame.a9, ...bestGame.b6].sort((a, b) => a - b);
    const a9Set = new Set(bestGame.a9);
    const b6Set = new Set(bestGame.b6);

    const meta: DezenaMeta[] = finalDezenas.map(d => ({
      dezena: d,
      frequency: freqMap.get(d) || 0,
      atrasoAtual: atrasoMap.get(d) || 0,
      rankPosition: rankMap.get(d) || 25,
      score: scoreForVariation(d, usedCounts),
      source: a9Set.has(d) ? "A" as const : "B" as const,
      chosenBy: (a9Set.has(d) ? baseA9.includes(d) : baseB6.includes(d)) ? "base" as const : "variacao" as const,
    }));

    const game: GeneratedGame = {
      dezenas: finalDezenas,
      dezenasA: bestGame.a9.sort((a, b) => a - b),
      dezenasB: bestGame.b6.sort((a, b) => a - b),
      meta,
      stats: calcStats(finalDezenas),
    };

    games.push(game);
    recordUsage(finalDezenas);
  }

  return { games, warnings, lastConcurso: 0 };
}

export const DEFAULT_OPTIONS: GeneratorOptions = {
  w1: 0.70,
  w2: 0.20,
  w3: 0.10,
  filterParImpar: true,
  filterBaixaAlta: true,
  filterConsecutivas: true,
  maxIntersection: 13,
  seed: "",
};
