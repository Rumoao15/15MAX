import { useState, useCallback } from "react";
import { Upload, FileText, AlertCircle, CheckCircle2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parseCSV, parseRows, importConcursos, exportToCSV, type ImportError } from "@/lib/lotofacil";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function ImportarPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ headers: string[]; rows: string[][]; delimiter: string; mapping: Record<string, string> } | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ inseridos: number; duplicados: number; erros: ImportError[]; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [atomic, setAtomic] = useState(false);

  const readFile = useCallback(async (f: File): Promise<string> => {
    const buffer = await f.arrayBuffer();
    try {
      const text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
      return text;
    } catch {
      return new TextDecoder("latin1").decode(buffer);
    }
  }, []);

  const handlePreview = async () => {
    if (!file) return;
    setError(null);
    setResult(null);
    try {
      const content = await readFile(file);
      const { lines, delimiter, colMap, rawHeaders, normalizedHeaders } = parseCSV(content);

      const mapping: Record<string, string> = {};
      mapping["Concurso"] = rawHeaders[colMap.concurso];
      mapping["Data"] = rawHeaders[colMap.data];
      for (let i = 1; i <= 15; i++) {
        mapping[`D${i}`] = rawHeaders[colMap[`d${i}`]];
      }

      const previewRows = lines.slice(1, 11).map(l => l.split(delimiter));
      setPreview({ headers: rawHeaders, rows: previewRows, delimiter, mapping });
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setError(null);
    setResult(null);
    try {
      const content = await readFile(file);
      const { lines, delimiter, colMap } = parseCSV(content);
      const { rows, errors } = parseRows(lines, delimiter, colMap);

      if (atomic && errors.length > 0) {
        setResult({ inseridos: 0, duplicados: 0, erros: errors, total: lines.length - 1 });
        setImporting(false);
        return;
      }

      const importResult = await importConcursos(rows, atomic);
      setResult({
        inseridos: importResult.inseridos,
        duplicados: importResult.duplicados,
        erros: [...errors, ...importResult.erros],
        total: lines.length - 1,
      });
    } catch (e: any) {
      setError(e.message);
    }
    setImporting(false);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Importar Resultados</h1>
        <p className="page-description">Faça upload de um arquivo CSV com os resultados da Lotofácil</p>
      </div>

      <div className="grid gap-6">
        {/* Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Upload className="h-5 w-5 text-primary" />
              Upload do CSV
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => document.getElementById("csv-input")?.click()}
            >
              <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium">
                {file ? file.name : "Clique para selecionar um arquivo CSV"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Suporta CSV com delimitador ; ou , e encoding UTF-8 ou Latin1
              </p>
              <input
                id="csv-input"
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={e => { setFile(e.target.files?.[0] || null); setPreview(null); setResult(null); }}
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch id="atomic" checked={atomic} onCheckedChange={setAtomic} />
              <Label htmlFor="atomic" className="text-sm">
                Importação atômica (cancelar se houver erros)
              </Label>
            </div>

            <div className="flex gap-3">
              <Button onClick={handlePreview} disabled={!file} variant="secondary">
                Pré-visualizar
              </Button>
              <Button onClick={handleImport} disabled={!file || importing}>
                {importing ? "Importando..." : "Importar"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <Card className="border-destructive/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <p className="font-medium">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview */}
        {preview && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pré-visualização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Delimitador detectado: <span className="font-mono font-bold text-foreground">{preview.delimiter === ";" ? "ponto e vírgula (;)" : "vírgula (,)"}</span>
              </p>
              
              <div>
                <p className="text-sm font-medium mb-2">Mapeamento de colunas:</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(preview.mapping).map(([field, original]) => (
                    <div key={field} className="stat-badge-success text-xs">
                      {field} ← {original}
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      {preview.headers.map((h, i) => (
                        <th key={i} className="whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row, i) => (
                      <tr key={i}>
                        {row.map((cell, j) => (
                          <td key={j} className="whitespace-nowrap">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Result */}
        {result && (
          <Card className={result.erros.length > 0 && result.inseridos === 0 ? "border-destructive/50" : "border-primary/50"}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {result.inseridos > 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                )}
                Relatório de Importação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="glass-card p-3 text-center">
                  <p className="text-2xl font-bold font-heading">{result.total}</p>
                  <p className="text-xs text-muted-foreground">Total de linhas</p>
                </div>
                <div className="glass-card p-3 text-center">
                  <p className="text-2xl font-bold font-heading text-primary">{result.inseridos}</p>
                  <p className="text-xs text-muted-foreground">Inseridos</p>
                </div>
                <div className="glass-card p-3 text-center">
                  <p className="text-2xl font-bold font-heading">{result.duplicados}</p>
                  <p className="text-xs text-muted-foreground">Duplicados</p>
                </div>
                <div className="glass-card p-3 text-center">
                  <p className="text-2xl font-bold font-heading text-destructive">{result.erros.length}</p>
                  <p className="text-xs text-muted-foreground">Erros</p>
                </div>
              </div>

              {result.erros.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Erros encontrados:</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => exportToCSV(result.erros, "erros_importacao.csv")}
                    >
                      <Download className="h-4 w-4 mr-1" /> Baixar CSV
                    </Button>
                  </div>
                  <div className="max-h-48 overflow-y-auto rounded-lg border">
                    <table className="data-table">
                      <thead><tr><th>Linha</th><th>Motivo</th></tr></thead>
                      <tbody>
                        {result.erros.slice(0, 50).map((e, i) => (
                          <tr key={i}><td>{e.linha}</td><td>{e.motivo}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
