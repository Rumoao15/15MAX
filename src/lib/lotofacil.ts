import { supabase } from "@/integrations/supabase/client";

const PRIMOS = new Set([2, 3, 5, 7, 11, 13, 17, 19, 23]);
const FIBONACCI = new Set([1, 2, 3, 5, 8, 13, 21]);
const MULTIPLOS_3 = new Set([3, 6, 9, 12, 15, 18, 21, 24]);

export interface ConcursoRow {
  numero_concurso: number;
  data_concurso: string;
  dezenas: number[];
}

export interface ImportError {
  linha: number;
  motivo: string;
}

export interface ImportResult {
  total_linhas: number;
  inseridos: number;
  duplicados: number;
  erros: ImportError[];
}

function normalizeHeader(h: string): string {
  return h
    .trim()
    .replace(/^\uFEFF/, "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

const CONCURSO_ALIASES = ["concurso", "nr_concurso", "numero_concurso", "n_concurso", "numconcurso", "no_concurso", "n_concurso", "num_concurso"];
const DATA_ALIASES = ["data", "data_concurso", "dt", "dt_concurso", "data_sorteio"];

function getDezenaAliases(n: number): string[] {
  return [`d${n}`, `dezena${n}`, `bola${n}`, `b${n}`, `dezena_${n}`, `d_${n}`, `bola_${n}`];
}

function detectDelimiter(firstLine: string): string {
  const semicolons = (firstLine.match(/;/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  return semicolons > commas ? ";" : ",";
}

function parseDate(value: string): Date | null {
  const s = value.trim();
  // dd/mm/yyyy or dd/mm/yyyy hh:mm
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2}))?/);
  if (m) {
    const d = new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]),
      m[4] ? parseInt(m[4]) : 0, m[5] ? parseInt(m[5]) : 0);
    if (!isNaN(d.getTime())) return d;
  }
  // yyyy-mm-dd
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) {
    const d = new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

export function parseCSV(content: string) {
  // Remove BOM if present
  const clean = content.replace(/^\uFEFF/, "");
  const lines = clean.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) throw new Error("CSV vazio ou sem dados");

  const delimiter = detectDelimiter(lines[0]);
  const rawHeaders = lines[0].split(delimiter);
  const normalizedHeaders = rawHeaders.map(normalizeHeader);

  // Map columns
  const colMap: Record<string, number> = {};

  // Find concurso
  const concIdx = normalizedHeaders.findIndex(h => CONCURSO_ALIASES.includes(h));
  if (concIdx === -1) throw new Error("Coluna 'Concurso' não encontrada");
  colMap.concurso = concIdx;

  // Find data
  const dataIdx = normalizedHeaders.findIndex(h => DATA_ALIASES.includes(h));
  if (dataIdx === -1) throw new Error("Coluna 'Data' não encontrada");
  colMap.data = dataIdx;

  // Find dezenas
  for (let i = 1; i <= 15; i++) {
    const aliases = getDezenaAliases(i);
    const idx = normalizedHeaders.findIndex(h => aliases.includes(h));
    if (idx === -1) throw new Error(`Coluna da dezena ${i} não encontrada`);
    colMap[`d${i}`] = idx;
  }

  return { lines, delimiter, colMap, rawHeaders, normalizedHeaders };
}

export function parseRows(lines: string[], delimiter: string, colMap: Record<string, number>) {
  const rows: ConcursoRow[] = [];
  const errors: ImportError[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delimiter);
    const lineNum = i + 1;

    // Parse concurso
    const concStr = cols[colMap.concurso]?.trim();
    if (!concStr) { errors.push({ linha: lineNum, motivo: "Concurso vazio" }); continue; }
    const concurso = parseInt(concStr);
    if (isNaN(concurso) || concurso <= 0) { errors.push({ linha: lineNum, motivo: "Número do concurso inválido" }); continue; }

    // Parse data
    const dataStr = cols[colMap.data]?.trim();
    if (!dataStr) { errors.push({ linha: lineNum, motivo: "Data vazia" }); continue; }
    const data = parseDate(dataStr);
    if (!data) { errors.push({ linha: lineNum, motivo: `Data inválida: ${dataStr}` }); continue; }

    // Parse dezenas
    const dezenas: number[] = [];
    let dezError = false;
    for (let d = 1; d <= 15; d++) {
      const raw = cols[colMap[`d${d}`]]?.trim().replace(/^0+/, "") || "";
      if (!raw) { errors.push({ linha: lineNum, motivo: `Dezena ${d} vazia` }); dezError = true; break; }
      const val = parseInt(raw);
      if (isNaN(val) || val < 1 || val > 25) { errors.push({ linha: lineNum, motivo: `Dezena ${d} fora de 1-25: ${raw}` }); dezError = true; break; }
      dezenas.push(val);
    }
    if (dezError) continue;

    // Check uniqueness
    if (new Set(dezenas).size !== 15) { errors.push({ linha: lineNum, motivo: "Dezenas repetidas na mesma linha" }); continue; }

    rows.push({
      numero_concurso: concurso,
      data_concurso: data.toISOString(),
      dezenas: dezenas.sort((a, b) => a - b),
    });
  }

  return { rows, errors };
}

export function calcDerived(dezenas: number[]) {
  let soma = 0, pares = 0, impares = 0, primos = 0, fib = 0, mult3 = 0;
  const linhas = [0, 0, 0, 0, 0];
  const colunas = [0, 0, 0, 0, 0];

  for (const d of dezenas) {
    soma += d;
    if (d % 2 === 0) pares++; else impares++;
    if (PRIMOS.has(d)) primos++;
    if (FIBONACCI.has(d)) fib++;
    if (MULTIPLOS_3.has(d)) mult3++;
    linhas[Math.floor((d - 1) / 5)]++;
    colunas[((d - 1) % 5)]++;
  }

  return {
    soma_dezenas: soma,
    qtd_pares: pares,
    qtd_impares: impares,
    qtd_primos: primos,
    qtd_fibonacci: fib,
    qtd_multiplos_3: mult3,
    linha1_qtd: linhas[0], linha2_qtd: linhas[1], linha3_qtd: linhas[2], linha4_qtd: linhas[3], linha5_qtd: linhas[4],
    coluna1_qtd: colunas[0], coluna2_qtd: colunas[1], coluna3_qtd: colunas[2], coluna4_qtd: colunas[3], coluna5_qtd: colunas[4],
  };
}

export async function importConcursos(rows: ConcursoRow[], atomic: boolean): Promise<ImportResult> {
  // Check existing - fetch ALL concursos (paginate past 1000 limit)
  const allExisting: number[] = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data } = await supabase.from("concursos").select("numero_concurso").range(from, from + pageSize - 1);
    if (!data || data.length === 0) break;
    allExisting.push(...data.map(e => e.numero_concurso));
    if (data.length < pageSize) break;
    from += pageSize;
  }
  const existingSet = new Set(allExisting);

  const toInsert: any[] = [];
  let duplicados = 0;

  for (const row of rows) {
    if (existingSet.has(row.numero_concurso)) {
      duplicados++;
      continue;
    }
    const derived = calcDerived(row.dezenas);
    toInsert.push({
      numero_concurso: row.numero_concurso,
      data_concurso: row.data_concurso,
      d1: row.dezenas[0], d2: row.dezenas[1], d3: row.dezenas[2],
      d4: row.dezenas[3], d5: row.dezenas[4], d6: row.dezenas[5],
      d7: row.dezenas[6], d8: row.dezenas[7], d9: row.dezenas[8],
      d10: row.dezenas[9], d11: row.dezenas[10], d12: row.dezenas[11],
      d13: row.dezenas[12], d14: row.dezenas[13], d15: row.dezenas[14],
      ...derived,
    });
  }

  if (toInsert.length > 0) {
    // Insert in batches of 100
    for (let i = 0; i < toInsert.length; i += 100) {
      const batch = toInsert.slice(i, i + 100);
      const { error } = await supabase.from("concursos").insert(batch);
      if (error) throw new Error(`Erro ao inserir: ${error.message}`);
    }
  }

  // Update repetidas_do_anterior
  await updateRepetidasDoAnterior();
  
  // Recalculate statistics
  await recalcularEstatisticas();

  return {
    total_linhas: rows.length,
    inseridos: toInsert.length,
    duplicados,
    erros: [],
  };
}

async function updateRepetidasDoAnterior() {
  const { data: concursos } = await supabase
    .from("concursos")
    .select("id, numero_concurso, d1, d2, d3, d4, d5, d6, d7, d8, d9, d10, d11, d12, d13, d14, d15")
    .order("numero_concurso", { ascending: true });

  if (!concursos || concursos.length < 2) return;

  for (let i = 1; i < concursos.length; i++) {
    const prev = getDezenas(concursos[i - 1]);
    const curr = getDezenas(concursos[i]);
    const prevSet = new Set(prev);
    const repetidas = curr.filter(d => prevSet.has(d)).length;

    await supabase.from("concursos").update({ repetidas_do_anterior: repetidas }).eq("id", concursos[i].id);
  }
}

function getDezenas(row: any): number[] {
  return [row.d1, row.d2, row.d3, row.d4, row.d5, row.d6, row.d7, row.d8, row.d9, row.d10, row.d11, row.d12, row.d13, row.d14, row.d15];
}

async function recalcularEstatisticas() {
  const { data: concursos } = await supabase
    .from("concursos")
    .select("numero_concurso, d1, d2, d3, d4, d5, d6, d7, d8, d9, d10, d11, d12, d13, d14, d15")
    .order("numero_concurso", { ascending: true });

  if (!concursos || concursos.length === 0) return;

  // Frequency and delay calculation
  const freq: Record<number, number> = {};
  const lastSeen: Record<number, number> = {};
  const maxDelay: Record<number, number> = {};
  const prevSeen: Record<number, number> = {};

  for (let d = 1; d <= 25; d++) {
    freq[d] = 0;
    lastSeen[d] = -1;
    maxDelay[d] = 0;
    prevSeen[d] = -1;
  }

  for (let i = 0; i < concursos.length; i++) {
    const dezenas = getDezenas(concursos[i]);
    const dezSet = new Set(dezenas);

    for (let d = 1; d <= 25; d++) {
      if (dezSet.has(d)) {
        freq[d]++;
        if (prevSeen[d] >= 0) {
          const gap = i - prevSeen[d] - 1;
          if (gap > maxDelay[d]) maxDelay[d] = gap;
        }
        prevSeen[d] = i;
        lastSeen[d] = i;
      }
    }
  }

  const totalConcursos = concursos.length;
  for (let d = 1; d <= 25; d++) {
    const atrasoAtual = lastSeen[d] >= 0 ? totalConcursos - 1 - lastSeen[d] : totalConcursos;
    // Check final gap for max delay
    if (atrasoAtual > maxDelay[d]) maxDelay[d] = atrasoAtual;

    await supabase.from("estatisticas_dezenas").update({
      frequencia_total: freq[d],
      atraso_atual: atrasoAtual,
      maior_atraso_historico: maxDelay[d],
    }).eq("dezena", d);
  }

  // Recalculate trincas (top 100 only for performance)
  await recalcularTrincas(concursos);
}

async function recalcularTrincas(concursos: any[]) {
  // Truncate
  await supabase.from("trincas_frequentes").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  const trincaMap = new Map<string, number>();

  for (const c of concursos) {
    const dezenas = getDezenas(c).sort((a: number, b: number) => a - b);
    for (let i = 0; i < 13; i++) {
      for (let j = i + 1; j < 14; j++) {
        for (let k = j + 1; k < 15; k++) {
          const key = `${dezenas[i]}-${dezenas[j]}-${dezenas[k]}`;
          trincaMap.set(key, (trincaMap.get(key) || 0) + 1);
        }
      }
    }
  }

  // Sort and take top 200
  const sorted = [...trincaMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 200);

  if (sorted.length > 0) {
    const batch = sorted.map(([key, freq]) => {
      const [d1, d2, d3] = key.split("-").map(Number);
      return { dezena1: d1, dezena2: d2, dezena3: d3, frequencia_trinca: freq };
    });

    for (let i = 0; i < batch.length; i += 50) {
      await supabase.from("trincas_frequentes").insert(batch.slice(i, i + 50));
    }
  }
}

export function exportToCSV(data: any[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(";"),
    ...data.map(row => headers.map(h => row[h] ?? "").join(";"))
  ].join("\n");

  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
