import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Download, ArrowUpDown } from "lucide-react";
import { exportToCSV } from "@/lib/lotofacil";

export default function AnalisePage() {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>("dezena");
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const { data } = await supabase.from("estatisticas_dezenas").select("*").order("dezena");
    setStats(data || []);
    setLoading(false);
  }

  function handleSort(col: string) {
    if (sortBy === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(col);
      setSortAsc(true);
    }
  }

  const sorted = [...stats].sort((a, b) => {
    const va = a[sortBy];
    const vb = b[sortBy];
    return sortAsc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
  });

  const SortHeader = ({ col, label }: { col: string; label: string }) => (
    <th className="cursor-pointer select-none" onClick={() => handleSort(col)}>
      <span className="flex items-center gap-1">
        {label}
        {sortBy === col && <ArrowUpDown className="h-3 w-3" />}
      </span>
    </th>
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Análise das Dezenas</h1>
        <p className="page-description">Frequência, atraso e classificação de cada dezena</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
              Estatísticas (1–25)
            </CardTitle>
            <Button variant="secondary" size="sm" onClick={() => exportToCSV(stats, "estatisticas_dezenas.csv")}>
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <SortHeader col="dezena" label="Dezena" />
                  <SortHeader col="frequencia_total" label="Frequência" />
                  <SortHeader col="atraso_atual" label="Atraso Atual" />
                  <SortHeader col="maior_atraso_historico" label="Maior Atraso" />
                  <th>Par</th>
                  <th>Primo</th>
                  <th>Fibonacci</th>
                  <th>Múlt. 3</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">Carregando...</td></tr>
                ) : (
                  sorted.map(s => (
                    <tr key={s.dezena}>
                      <td><span className="lottery-ball">{s.dezena.toString().padStart(2, "0")}</span></td>
                      <td className="font-bold">{s.frequencia_total}</td>
                      <td>
                        <span className={s.atraso_atual > 5 ? "text-destructive font-bold" : ""}>
                          {s.atraso_atual}
                        </span>
                      </td>
                      <td>{s.maior_atraso_historico}</td>
                      <td>{s.e_par ? "✓" : ""}</td>
                      <td>{s.e_primo ? "✓" : ""}</td>
                      <td>{s.e_fibonacci ? "✓" : ""}</td>
                      <td>{s.e_multiplo_3 ? "✓" : ""}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
