import { describe, it, expect } from "vitest";
import { generateGames9by6Ranking, DEFAULT_OPTIONS, type FrequencyData } from "@/lib/generate9x6";

// Mock data
const lastDraw = [1, 2, 3, 5, 7, 8, 10, 12, 14, 16, 17, 19, 20, 22, 25];

const frequencyData: FrequencyData[] = Array.from({ length: 25 }, (_, i) => ({
  dezena: i + 1,
  frequencia_total: 200 - i * 5, // 1 is most frequent
  atraso_atual: i,
}));

describe("generateGames9by6Ranking", () => {
  it("generates exactly 5 games", () => {
    const result = generateGames9by6Ranking(lastDraw, frequencyData, 100, DEFAULT_OPTIONS);
    expect(result.games).toHaveLength(5);
  });

  it("each game has 15 unique dezenas between 1-25", () => {
    const result = generateGames9by6Ranking(lastDraw, frequencyData, 100, DEFAULT_OPTIONS);
    for (const game of result.games) {
      expect(game.dezenas).toHaveLength(15);
      expect(new Set(game.dezenas).size).toBe(15);
      for (const d of game.dezenas) {
        expect(d).toBeGreaterThanOrEqual(1);
        expect(d).toBeLessThanOrEqual(25);
      }
    }
  });

  it("each game has exactly 9 from lastDraw and 6 not from lastDraw", () => {
    const result = generateGames9by6Ranking(lastDraw, frequencyData, 100, DEFAULT_OPTIONS);
    const lastSet = new Set(lastDraw);
    for (const game of result.games) {
      expect(game.dezenasA).toHaveLength(9);
      expect(game.dezenasB).toHaveLength(6);
      for (const d of game.dezenasA) expect(lastSet.has(d)).toBe(true);
      for (const d of game.dezenasB) expect(lastSet.has(d)).toBe(false);
    }
  });

  it("no two games are identical", () => {
    const result = generateGames9by6Ranking(lastDraw, frequencyData, 100, DEFAULT_OPTIONS);
    const strings = result.games.map(g => JSON.stringify(g.dezenas));
    expect(new Set(strings).size).toBe(strings.length);
  });

  it("is deterministic with a seed", () => {
    const opts = { ...DEFAULT_OPTIONS, seed: "test-seed-42" };
    const r1 = generateGames9by6Ranking(lastDraw, frequencyData, 100, opts);
    const r2 = generateGames9by6Ranking(lastDraw, frequencyData, 100, opts);
    for (let i = 0; i < 5; i++) {
      expect(r1.games[i].dezenas).toEqual(r2.games[i].dezenas);
    }
  });

  it("respects maxIntersection setting", () => {
    const opts = { ...DEFAULT_OPTIONS, maxIntersection: 12, seed: "diverse" };
    const result = generateGames9by6Ranking(lastDraw, frequencyData, 100, opts);
    for (let i = 0; i < result.games.length; i++) {
      for (let j = i + 1; j < result.games.length; j++) {
        const setA = new Set(result.games[i].dezenas);
        const overlap = result.games[j].dezenas.filter(d => setA.has(d)).length;
        expect(overlap).toBeLessThanOrEqual(12);
      }
    }
  });

  it("provides meta info for each dezena", () => {
    const result = generateGames9by6Ranking(lastDraw, frequencyData, 100, DEFAULT_OPTIONS);
    for (const game of result.games) {
      expect(game.meta).toHaveLength(15);
      for (const m of game.meta) {
        expect(m.source).toMatch(/^[AB]$/);
        expect(m.chosenBy).toMatch(/^(base|variacao)$/);
        expect(m.rankPosition).toBeGreaterThanOrEqual(1);
        expect(m.rankPosition).toBeLessThanOrEqual(25);
      }
    }
  });

  it("calculates correct stats", () => {
    const result = generateGames9by6Ranking(lastDraw, frequencyData, 100, DEFAULT_OPTIONS);
    for (const game of result.games) {
      expect(game.stats.pares + game.stats.impares).toBe(15);
      expect(game.stats.baixas + game.stats.altas).toBe(15);
      expect(game.stats.soma).toBe(game.dezenas.reduce((a, b) => a + b, 0));
    }
  });
});
