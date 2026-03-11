import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, List, Search } from "lucide-react";
import { exportToCSV } from "@/lib/lotofacil";

export default function ConcursosPage() {
  const [concursos, setConcursos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 25;

  useEffect(() => {
    loadConcursos();
  }, [page, search]);

  async function loadConcursos() {
    setLoading(true);
    let query = supabase
      .from("concursos")
      .select("*")
      .order("numero_concurso", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (search) {
      const num = parseInt(search);
      if (!isNaN(num)) {
        query = query.eq("numero_concurso", num);
      }
    }

    const { data } = await query;
    setConcursos(data || []);
    setLoading(false);
  }

  async function handleExport() {
    const { data } = await supabase.from("concursos").select("*").order("numero_concurso");
    if (data) exportToCSV(data, "concursos_lotofacil.csv");
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Concursos</h1>
        <p className="page-description">Lista de todos os concursos importados</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <List className="h-5 w-5 text-primary" />
              Resultados
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar concurso..."
                  className="pl-8 w-48"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(0); }}
                />
              </div>
              <Button variant="secondary" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-1" /> CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Concurso</th>
                  <th>Data</th>
                  <th>Dezenas</th>
                  <th>Soma</th>
                  <th>P/I</th>
                  <th>Rep.</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</td></tr>
                ) : concursos.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum concurso encontrado. Importe um CSV primeiro.</td></tr>
                ) : (
                  concursos.map(c => (
                    <tr key={c.id}>
                      <td className="font-bold">{c.numero_concurso}</td>
                      <td>{new Date(c.data_concurso).toLocaleDateString("pt-BR")}</td>
                      <td>
                        <div className="flex gap-1 flex-wrap">
                          {[c.d1,c.d2,c.d3,c.d4,c.d5,c.d6,c.d7,c.d8,c.d9,c.d10,c.d11,c.d12,c.d13,c.d14,c.d15].map((d,i) => (
                            <span key={i} className="lottery-ball text-[10px] w-6 h-6">{d.toString().padStart(2,"0")}</span>
                          ))}
                        </div>
                      </td>
                      <td>{c.soma_dezenas}</td>
                      <td>{c.qtd_pares}×{c.qtd_impares}</td>
                      <td>{c.repetidas_do_anterior}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center mt-4">
            <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              ← Anterior
            </Button>
            <span className="text-sm text-muted-foreground">Página {page + 1}</span>
            <Button variant="ghost" size="sm" disabled={concursos.length < PAGE_SIZE} onClick={() => setPage(p => p + 1)}>
              Próximo →
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
