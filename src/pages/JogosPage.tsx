import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gamepad2, Download } from "lucide-react";
import { exportToCSV } from "@/lib/lotofacil";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function JogosPage() {
  const [jogos, setJogos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterModelo, setFilterModelo] = useState("todos");

  useEffect(() => {
    loadJogos();
  }, [filterModelo]);

  async function loadJogos() {
    setLoading(true);
    let query = supabase
      .from("jogos_gerados")
      .select("*")
      .order("data_geracao", { ascending: false })
      .limit(100);

    if (filterModelo !== "todos") {
      query = query.eq("tipo_modelo", filterModelo);
    }

    const { data } = await query;
    setJogos(data || []);
    setLoading(false);
  }

  async function handleExport() {
    let query = supabase.from("jogos_gerados").select("*").order("data_geracao", { ascending: false });
    if (filterModelo !== "todos") query = query.eq("tipo_modelo", filterModelo);
    const { data } = await query;
    if (data) exportToCSV(data, "jogos_gerados.csv");
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Jogos Gerados</h1>
        <p className="page-description">Todos os jogos gerados pela prospecção inteligente</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gamepad2 className="h-5 w-5 text-primary" />
              Jogos
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={filterModelo} onValueChange={setFilterModelo}>
                <SelectTrigger className="w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os modelos</SelectItem>
                  <SelectItem value="15_mais_frequentes">15 Mais Frequentes</SelectItem>
                  <SelectItem value="09_ultimas_+_06_nao_sorteadas">9 Últimas + 6 Não Sort.</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="secondary" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-1" /> CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Carregando...</p>
            ) : jogos.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Nenhum jogo gerado. Use a Prospecção Inteligente.</p>
            ) : (
              jogos.map(j => (
                <div key={j.id} className="glass-card p-3 flex items-center gap-4 flex-wrap">
                  <div className="shrink-0">
                    <p className="text-xs text-muted-foreground">
                      {new Date(j.data_geracao).toLocaleDateString("pt-BR")}
                    </p>
                    <p className="text-[10px] font-medium">
                      {j.tipo_modelo === "15_mais_frequentes" ? "15 Freq." : "9+6"}
                      {j.referencia_concurso ? ` • Ref #${j.referencia_concurso}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {[j.d1,j.d2,j.d3,j.d4,j.d5,j.d6,j.d7,j.d8,j.d9,j.d10,j.d11,j.d12,j.d13,j.d14,j.d15].map((d: number, i: number) => (
                      <span key={i} className="lottery-ball text-[10px] w-6 h-6">{d.toString().padStart(2,"0")}</span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
