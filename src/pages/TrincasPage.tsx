import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Triangle, Download } from "lucide-react";
import { exportToCSV } from "@/lib/lotofacil";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TrincasPage() {
  const [trincas, setTrincas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState("20");

  useEffect(() => {
    loadTrincas();
  }, [limit]);

  async function loadTrincas() {
    setLoading(true);
    const { data } = await supabase
      .from("trincas_frequentes")
      .select("*")
      .order("frequencia_trinca", { ascending: false })
      .limit(parseInt(limit));
    setTrincas(data || []);
    setLoading(false);
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Trincas Frequentes</h1>
        <p className="page-description">Combinações de 3 dezenas que mais aparecem juntas</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Triangle className="h-5 w-5 text-primary" />
              Top Trincas
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={limit} onValueChange={setLimit}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">Top 20</SelectItem>
                  <SelectItem value="50">Top 50</SelectItem>
                  <SelectItem value="100">Top 100</SelectItem>
                  <SelectItem value="200">Top 200</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="secondary" size="sm" onClick={() => exportToCSV(trincas, "trincas_frequentes.csv")}>
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
                  <th>#</th>
                  <th>Trinca</th>
                  <th>Frequência</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={3} className="text-center py-8 text-muted-foreground">Carregando...</td></tr>
                ) : trincas.length === 0 ? (
                  <tr><td colSpan={3} className="text-center py-8 text-muted-foreground">Sem dados. Importe concursos primeiro.</td></tr>
                ) : (
                  trincas.map((t, i) => (
                    <tr key={t.id}>
                      <td className="text-muted-foreground">{i + 1}</td>
                      <td>
                        <div className="flex gap-1">
                          <span className="lottery-ball w-7 h-7 text-[10px]">{t.dezena1.toString().padStart(2,"0")}</span>
                          <span className="lottery-ball w-7 h-7 text-[10px]">{t.dezena2.toString().padStart(2,"0")}</span>
                          <span className="lottery-ball w-7 h-7 text-[10px]">{t.dezena3.toString().padStart(2,"0")}</span>
                        </div>
                      </td>
                      <td className="font-bold">{t.frequencia_trinca}</td>
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
