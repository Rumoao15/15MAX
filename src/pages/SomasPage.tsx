import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

export default function SomasPage() {
  const [somaData, setSomaData] = useState<any[]>([]);
  const [linhaData, setLinhaData] = useState<{ name: string; media: number }[]>([]);
  const [colunaData, setColunaData] = useState<{ name: string; media: number }[]>([]);
  const [stats, setStats] = useState({ min: 0, max: 0, avg: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data } = await supabase
      .from("concursos")
      .select("numero_concurso, soma_dezenas, linha1_qtd, linha2_qtd, linha3_qtd, linha4_qtd, linha5_qtd, coluna1_qtd, coluna2_qtd, coluna3_qtd, coluna4_qtd, coluna5_qtd")
      .order("numero_concurso");

    if (data && data.length > 0) {
      const somaChart = data.map(d => ({ concurso: d.numero_concurso, soma: d.soma_dezenas }));
      setSomaData(somaChart);

      const somas = data.map(d => d.soma_dezenas);
      setStats({
        min: Math.min(...somas),
        max: Math.max(...somas),
        avg: somas.reduce((a, b) => a + b, 0) / somas.length,
      });

      const n = data.length;
      setLinhaData([
        { name: "L1 (1-5)", media: data.reduce((s, d) => s + d.linha1_qtd, 0) / n },
        { name: "L2 (6-10)", media: data.reduce((s, d) => s + d.linha2_qtd, 0) / n },
        { name: "L3 (11-15)", media: data.reduce((s, d) => s + d.linha3_qtd, 0) / n },
        { name: "L4 (16-20)", media: data.reduce((s, d) => s + d.linha4_qtd, 0) / n },
        { name: "L5 (21-25)", media: data.reduce((s, d) => s + d.linha5_qtd, 0) / n },
      ]);

      setColunaData([
        { name: "C1", media: data.reduce((s, d) => s + d.coluna1_qtd, 0) / n },
        { name: "C2", media: data.reduce((s, d) => s + d.coluna2_qtd, 0) / n },
        { name: "C3", media: data.reduce((s, d) => s + d.coluna3_qtd, 0) / n },
        { name: "C4", media: data.reduce((s, d) => s + d.coluna4_qtd, 0) / n },
        { name: "C5", media: data.reduce((s, d) => s + d.coluna5_qtd, 0) / n },
      ]);
    }
    setLoading(false);
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Somas, Linhas e Colunas</h1>
        <p className="page-description">Evolução da soma das dezenas e distribuição espacial</p>
      </div>

      <div className="grid gap-6">
        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Soma Mínima", value: stats.min },
            { label: "Soma Média", value: stats.avg.toFixed(1) },
            { label: "Soma Máxima", value: stats.max },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold font-heading text-primary">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Soma chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Soma das Dezenas ao Longo do Tempo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Carregando...</p>
            ) : somaData.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Sem dados</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={somaData}>
                  <XAxis dataKey="concurso" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="soma" stroke="hsl(160, 84%, 30%)" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Linhas */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Distribuição por Linhas (média)</CardTitle></CardHeader>
            <CardContent>
              {loading ? <p className="text-center py-8 text-muted-foreground">Carregando...</p> : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={linhaData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="media" fill="hsl(160, 84%, 30%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Colunas */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Distribuição por Colunas (média)</CardTitle></CardHeader>
            <CardContent>
              {loading ? <p className="text-center py-8 text-muted-foreground">Carregando...</p> : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={colunaData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="media" fill="hsl(45, 93%, 47%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
