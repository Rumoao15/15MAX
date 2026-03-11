import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";

export default function ProspeccaoPage() {
  const [jogos1, setJogos1] = useState<number[][]>([]);
  const [jogos2, setJogos2] = useState<number[][]>([]);
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [refConcurso, setRefConcurso] = useState<number | null>(null);

  async function gerarModelo1() {
    setLoading1(true);
    try {
      const { data: stats } = await supabase
        .from("estatisticas_dezenas")
        .select("dezena, frequencia_total")
        .order("frequencia_total", { ascending: false })
        .limit(18);

      if (!stats || stats.length < 15) {
        toast.error("Dados insuficientes. Importe concursos primeiro.");
        setLoading1(false);
        return;
      }

      const { data: last } = await supabase
        .from("concursos")
        .select("numero_concurso")
        .order("numero_concurso", { ascending: false })
        .limit(1);

      const ref = last?.[0]?.numero_concurso || 0;
      setRefConcurso(ref);

      const top15 = stats.slice(0, 15).map(s => s.dezena).sort((a, b) => a - b);
      const extras = stats.slice(15).map(s => s.dezena);

      const jogos: number[][] = [top15];

      // Generate 4 variations
      for (let v = 0; v < 4; v++) {
        const jogo = [...top15];
        const numSwaps = Math.min(v + 1, 3);
        for (let s = 0; s < numSwaps && s < extras.length; s++) {
          const removeIdx = jogo.length - 1 - s;
          jogo[removeIdx] = extras[s];
        }
        jogo.sort((a, b) => a - b);
        // Ensure unique
        if (new Set(jogo).size === 15) jogos.push(jogo);
      }

      setJogos1(jogos);

      // Save to DB
      for (const jogo of jogos) {
        await supabase.from("jogos_gerados").insert({
          tipo_modelo: "15_mais_frequentes",
          referencia_concurso: ref,
          d1: jogo[0], d2: jogo[1], d3: jogo[2], d4: jogo[3], d5: jogo[4],
          d6: jogo[5], d7: jogo[6], d8: jogo[7], d9: jogo[8], d10: jogo[9],
          d11: jogo[10], d12: jogo[11], d13: jogo[12], d14: jogo[13], d15: jogo[14],
        });
      }

      toast.success(`${jogos.length} jogos gerados!`);
    } catch {
      toast.error("Erro ao gerar jogos");
    }
    setLoading1(false);
  }

  async function gerarModelo2() {
    setLoading2(true);
    try {
      const { data: lastConc } = await supabase
        .from("concursos")
        .select("*")
        .order("numero_concurso", { ascending: false })
        .limit(1);

      if (!lastConc || lastConc.length === 0) {
        toast.error("Nenhum concurso encontrado.");
        setLoading2(false);
        return;
      }

      const last = lastConc[0];
      setRefConcurso(last.numero_concurso);
      const lastDezenas = [last.d1, last.d2, last.d3, last.d4, last.d5, last.d6, last.d7,
        last.d8, last.d9, last.d10, last.d11, last.d12, last.d13, last.d14, last.d15]
        .sort((a, b) => a - b);

      const naoSorteadas = [];
      for (let d = 1; d <= 25; d++) {
        if (!lastDezenas.includes(d)) naoSorteadas.push(d);
      }

      // Get stats for non-drawn numbers
      const { data: statsNao } = await supabase
        .from("estatisticas_dezenas")
        .select("dezena, frequencia_total, atraso_atual")
        .in("dezena", naoSorteadas)
        .order("frequencia_total", { ascending: false });

      if (!statsNao) {
        toast.error("Erro ao buscar estatísticas");
        setLoading2(false);
        return;
      }

      // 9 smallest from last + 6 most frequent non-drawn
      const nove = lastDezenas.slice(0, 9);
      const seis = statsNao.slice(0, 6).map(s => s.dezena);
      const base = [...nove, ...seis].sort((a, b) => a - b);

      const jogos: number[][] = [base];

      // Generate 4 variations
      const allNao = statsNao.map(s => s.dezena);
      const { data: statsAll } = await supabase
        .from("estatisticas_dezenas")
        .select("dezena, frequencia_total, atraso_atual")
        .order("atraso_atual", { ascending: false });

      for (let v = 0; v < 4; v++) {
        const jogo = [...base];
        const swaps = Math.min(v + 1, 3);
        for (let s = 0; s < swaps; s++) {
          // Swap one from the base with one not in the jogo
          const candidates = Array.from({ length: 25 }, (_, i) => i + 1).filter(d => !jogo.includes(d));
          if (candidates.length === 0) break;

          // Pick candidate with highest atraso
          const candidate = candidates.sort((a, b) => {
            const sa = statsAll?.find(st => st.dezena === a);
            const sb = statsAll?.find(st => st.dezena === b);
            return (sb?.atraso_atual || 0) - (sa?.atraso_atual || 0);
          })[s % candidates.length];

          // Remove last element of seis portion
          const removeIdx = jogo.indexOf(seis[seis.length - 1 - s]);
          if (removeIdx >= 0) {
            jogo[removeIdx] = candidate;
          }
        }
        jogo.sort((a, b) => a - b);
        if (new Set(jogo).size === 15) jogos.push(jogo);
      }

      setJogos2(jogos);

      // Save to DB
      for (const jogo of jogos) {
        await supabase.from("jogos_gerados").insert({
          tipo_modelo: "09_ultimas_+_06_nao_sorteadas",
          referencia_concurso: last.numero_concurso,
          d1: jogo[0], d2: jogo[1], d3: jogo[2], d4: jogo[3], d5: jogo[4],
          d6: jogo[5], d7: jogo[6], d8: jogo[7], d9: jogo[8], d10: jogo[9],
          d11: jogo[10], d12: jogo[11], d13: jogo[12], d14: jogo[13], d15: jogo[14],
        });
      }

      toast.success(`${jogos.length} jogos gerados!`);
    } catch {
      toast.error("Erro ao gerar jogos");
    }
    setLoading2(false);
  }

  const JogosList = ({ jogos }: { jogos: number[][] }) => (
    <div className="space-y-3 mt-4">
      {jogos.map((jogo, i) => (
        <div key={i} className="glass-card p-3 flex items-center gap-3">
          <span className="text-sm font-bold text-muted-foreground w-8">#{i + 1}</span>
          <div className="flex gap-1 flex-wrap">
            {jogo.map((d, j) => (
              <span key={j} className={i === 0 ? "lottery-ball" : "lottery-ball-accent"}>
                {d.toString().padStart(2, "0")}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Prospecção Inteligente</h1>
        <p className="page-description">Gere jogos com base em análise estatística</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              15 Mais Frequentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Gera jogos usando as 15 dezenas com maior frequência histórica, com variações trocando as menos frequentes.
            </p>
            <Button onClick={gerarModelo1} disabled={loading1}>
              {loading1 ? "Gerando..." : "Gerar Jogos"}
            </Button>
            {jogos1.length > 0 && <JogosList jogos={jogos1} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5 text-accent" />
              9 Últimas + 6 Não Sorteadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Usa 9 dezenas do último concurso + 6 que não saíram, priorizando as de maior frequência histórica.
            </p>
            <Button onClick={gerarModelo2} disabled={loading2}>
              {loading2 ? "Gerando..." : "Gerar Jogos"}
            </Button>
            {jogos2.length > 0 && <JogosList jogos={jogos2} />}
          </CardContent>
        </Card>
      </div>

      {refConcurso && (
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Referência: Concurso #{refConcurso}
        </p>
      )}
    </div>
  );
}
