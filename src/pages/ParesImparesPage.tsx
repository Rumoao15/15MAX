import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Hash } from "lucide-react";

export default function ParesImparesPage() {
  const [patterns, setPatterns] = useState<Record<string, number>>({});
  const [avgPrimos, setAvgPrimos] = useState(0);
  const [avgFib, setAvgFib] = useState(0);
  const [avgMult3, setAvgMult3] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data, count } = await supabase
      .from("concursos")
      .select("qtd_pares, qtd_impares, qtd_primos, qtd_fibonacci, qtd_multiplos_3", { count: "exact" });

    if (data && data.length > 0) {
      const pats: Record<string, number> = {};
      let sumP = 0, sumF = 0, sumM = 0;
      for (const c of data) {
        const key = `${c.qtd_pares}×${c.qtd_impares}`;
        pats[key] = (pats[key] || 0) + 1;
        sumP += c.qtd_primos;
        sumF += c.qtd_fibonacci;
        sumM += c.qtd_multiplos_3;
      }
      setPatterns(pats);
      setAvgPrimos(sumP / data.length);
      setAvgFib(sumF / data.length);
      setAvgMult3(sumM / data.length);
      setTotal(data.length);
    }
    setLoading(false);
  }

  const sortedPatterns = Object.entries(patterns).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Pares, Ímpares e Categorias</h1>
        <p className="page-description">Distribuição de padrões par/ímpar e categorias numéricas</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Hash className="h-5 w-5 text-primary" />
              Padrões Pares × Ímpares
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-center py-8">Carregando...</p>
            ) : sortedPatterns.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Sem dados</p>
            ) : (
              <div className="space-y-2">
                {sortedPatterns.map(([pattern, count]) => {
                  const pct = total > 0 ? (count / total * 100) : 0;
                  return (
                    <div key={pattern} className="flex items-center gap-3">
                      <span className="font-mono font-bold w-12 text-right">{pattern}</span>
                      <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: "var(--gradient-primary)" }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-20 text-right">
                        {count} ({pct.toFixed(1)}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Médias por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-center py-8">Carregando...</p>
            ) : (
              <div className="space-y-6">
                {[
                  { label: "Primos por concurso", value: avgPrimos, max: 9 },
                  { label: "Fibonacci por concurso", value: avgFib, max: 7 },
                  { label: "Múltiplos de 3 por concurso", value: avgMult3, max: 8 },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className="text-sm font-bold">{item.value.toFixed(2)}</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(item.value / item.max * 100)}%`, background: "var(--gradient-accent)" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
