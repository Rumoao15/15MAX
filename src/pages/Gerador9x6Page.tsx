import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Crown, Settings2, AlertTriangle, Info, Dices } from "lucide-react";
import { toast } from "sonner";
import {
  generateGames9by6Ranking,
  DEFAULT_OPTIONS,
  type GeneratorOptions,
  type GeneratorResult,
  type GeneratedGame,
  type FrequencyData,
} from "@/lib/generate9x6";

const STORAGE_KEY = "loto9x6_options";

function loadOptions(): GeneratorOptions {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...DEFAULT_OPTIONS, ...JSON.parse(saved) };
  } catch { /* ignore */ }
  return { ...DEFAULT_OPTIONS };
}

function saveOptions(opts: GeneratorOptions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(opts));
}

export default function Gerador9x6Page() {
  const [options, setOptions] = useState<GeneratorOptions>(loadOptions);
  const [result, setResult] = useState<GeneratorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => { saveOptions(options); }, [options]);

  function updateOpt<K extends keyof GeneratorOptions>(key: K, val: GeneratorOptions[K]) {
    setOptions(prev => ({ ...prev, [key]: val }));
  }

  async function handleGenerate() {
    setLoading(true);
    try {
      // Fetch last draw
      const { data: lastConc } = await supabase
        .from("concursos")
        .select("numero_concurso,d1,d2,d3,d4,d5,d6,d7,d8,d9,d10,d11,d12,d13,d14,d15")
        .order("numero_concurso", { ascending: false })
        .limit(1);

      if (!lastConc || lastConc.length === 0) {
        toast.error("Nenhum concurso encontrado. Importe dados primeiro.");
        setLoading(false);
        return;
      }

      const last = lastConc[0];
      const lastDraw = [
        last.d1, last.d2, last.d3, last.d4, last.d5, last.d6, last.d7,
        last.d8, last.d9, last.d10, last.d11, last.d12, last.d13, last.d14, last.d15,
      ];

      // Fetch frequency data
      const { data: stats } = await supabase
        .from("estatisticas_dezenas")
        .select("dezena, frequencia_total, atraso_atual");

      if (!stats || stats.length < 25) {
        toast.error("Estatísticas incompletas. Reimporte os concursos.");
        setLoading(false);
        return;
      }

      // Total concursos for context
      const { count } = await supabase
        .from("concursos")
        .select("id", { count: "exact", head: true });

      const freqData: FrequencyData[] = stats.map(s => ({
        dezena: s.dezena,
        frequencia_total: s.frequencia_total,
        atraso_atual: s.atraso_atual,
      }));

      const res = generateGames9by6Ranking(lastDraw, freqData, count || 0, options);
      res.lastConcurso = last.numero_concurso;

      // Save to DB
      for (const game of res.games) {
        await supabase.from("jogos_gerados").insert({
          tipo_modelo: "9x6_ranking_incrementado",
          referencia_concurso: last.numero_concurso,
          d1: game.dezenas[0], d2: game.dezenas[1], d3: game.dezenas[2],
          d4: game.dezenas[3], d5: game.dezenas[4], d6: game.dezenas[5],
          d7: game.dezenas[6], d8: game.dezenas[7], d9: game.dezenas[8],
          d10: game.dezenas[9], d11: game.dezenas[10], d12: game.dezenas[11],
          d13: game.dezenas[12], d14: game.dezenas[13], d15: game.dezenas[14],
        });
      }

      setResult(res);
      toast.success(`${res.games.length} jogos gerados com sucesso!`);

      if (res.warnings.length > 0) {
        res.warnings.forEach(w => toast.warning(w));
      }
    } catch (e: any) {
      toast.error("Erro ao gerar jogos: " + (e?.message || "erro desconhecido"));
    }
    setLoading(false);
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Crown className="h-6 w-6 text-accent" />
          Gerador 9×6 com Ranking
        </h1>
        <p className="page-description">
          Gera 5 jogos: 9 dezenas do último concurso + 6 de fora, priorizadas pelo ranking histórico global
        </p>
      </div>

      {/* Settings Panel */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings2 className="h-4 w-4" /> Configurações
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)}>
              {showSettings ? "Ocultar" : "Mostrar"}
            </Button>
          </div>
        </CardHeader>
        {showSettings && (
          <CardContent className="space-y-6">
            {/* Weights */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-foreground">Pesos do Score</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <WeightSlider
                  label="Frequência (w1)"
                  value={options.w1}
                  onChange={v => updateOpt("w1", v)}
                  tooltip="Peso dado ao ranking histórico da dezena"
                />
                <WeightSlider
                  label="Recência (w2)"
                  value={options.w2}
                  onChange={v => updateOpt("w2", v)}
                  tooltip="Bônus para dezenas que saíram recentemente"
                />
                <WeightSlider
                  label="Diversidade (w3)"
                  value={options.w3}
                  onChange={v => updateOpt("w3", v)}
                  tooltip="Penaliza dezenas repetidas entre os 5 jogos"
                />
              </div>
            </div>

            <Separator />

            {/* Filters */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-foreground">Filtros Opcionais</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <FilterToggle
                  label="Balanceamento Par/Ímpar"
                  description="Aceitar jogos com 6–9 ímpares"
                  checked={options.filterParImpar}
                  onChange={v => updateOpt("filterParImpar", v)}
                />
                <FilterToggle
                  label="Balanceamento Baixas/Altas"
                  description="Aceitar jogos com 6–9 baixas (01–12)"
                  checked={options.filterBaixaAlta}
                  onChange={v => updateOpt("filterBaixaAlta", v)}
                />
                <FilterToggle
                  label="Limite Consecutivas"
                  description="Evitar mais de 3 dezenas consecutivas"
                  checked={options.filterConsecutivas}
                  onChange={v => updateOpt("filterConsecutivas", v)}
                />
              </div>
            </div>

            <Separator />

            {/* Max Intersection + Seed */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">
                  Máx. interseção entre jogos
                </label>
                <Input
                  type="number"
                  min={8}
                  max={14}
                  value={options.maxIntersection}
                  onChange={e => updateOpt("maxIntersection", parseInt(e.target.value) || 13)}
                  className="w-24"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">
                  Seed (vazio = aleatório)
                </label>
                <Input
                  placeholder="Ex: minha-seed-123"
                  value={options.seed}
                  onChange={e => updateOpt("seed", e.target.value)}
                />
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={() => setOptions({ ...DEFAULT_OPTIONS })}>
              Restaurar Padrões
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Generate Button */}
      <div className="flex justify-center mb-8">
        <Button size="lg" onClick={handleGenerate} disabled={loading} className="gap-2">
          <Dices className="h-5 w-5" />
          {loading ? "Gerando..." : "Gerar 5 Jogos (9×6 com Ranking)"}
        </Button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground text-center">
            Referência: Concurso #{result.lastConcurso}
          </p>

          {result.warnings.length > 0 && (
            <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-accent mt-0.5 shrink-0" />
              <div className="text-sm space-y-1">
                {result.warnings.map((w, i) => <p key={i}>{w}</p>)}
              </div>
            </div>
          )}

          {result.games.map((game, idx) => (
            <GameCard key={idx} game={game} index={idx} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────

function WeightSlider({ label, value, onChange, tooltip }: {
  label: string; value: number; onChange: (v: number) => void; tooltip: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1 mb-1">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3 w-3 text-muted-foreground/50 cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="top"><p className="text-xs">{tooltip}</p></TooltipContent>
        </Tooltip>
      </div>
      <div className="flex items-center gap-3">
        <Slider
          min={0} max={100} step={5}
          value={[Math.round(value * 100)]}
          onValueChange={([v]) => onChange(v / 100)}
          className="flex-1"
        />
        <span className="text-xs font-mono w-10 text-right text-foreground">
          {(value * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

function FilterToggle({ label, description, checked, onChange }: {
  label: string; description: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/50">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function GameCard({ game, index }: { game: GeneratedGame; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Jogo #{index + 1}</CardTitle>
          <div className="flex gap-1.5 flex-wrap justify-end">
            <Badge variant="secondary" className="text-xs">
              {game.stats.pares}P / {game.stats.impares}I
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {game.stats.baixas}B / {game.stats.altas}A
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Σ {game.stats.soma}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Seq {game.stats.maiorSequencia}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Dezenas display */}
        <div className="flex gap-1.5 flex-wrap mb-3">
          {game.dezenas.map(d => {
            const isA = game.dezenasA.includes(d);
            const m = game.meta.find(x => x.dezena === d);
            const isVariation = m?.chosenBy === "variacao";
            return (
              <Tooltip key={d}>
                <TooltipTrigger asChild>
                  <span
                    className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold cursor-default transition-all ${
                      isA
                        ? isVariation
                          ? "bg-primary/60 text-primary-foreground ring-2 ring-primary/30"
                          : "bg-primary text-primary-foreground"
                        : isVariation
                          ? "bg-accent/60 text-accent-foreground ring-2 ring-accent/30"
                          : "bg-accent text-accent-foreground"
                    }`}
                  >
                    {d.toString().padStart(2, "0")}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <div className="text-xs space-y-0.5">
                    <p>Grupo {isA ? "A (último concurso)" : "B (fora)"}</p>
                    <p>Freq: {m?.frequency} | Rank: #{m?.rankPosition}</p>
                    <p>Atraso: {m?.atrasoAtual} | {m?.chosenBy === "base" ? "Base" : "Variação"}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-xs text-muted-foreground mb-2">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-primary inline-block" /> Grupo A (9 do último)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-accent inline-block" /> Grupo B (6 de fora)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-primary/60 ring-2 ring-primary/30 inline-block" /> Variação
          </span>
        </div>

        {/* Expand details */}
        <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="text-xs">
          {expanded ? "Ocultar detalhes" : "Ver detalhes por dezena"}
        </Button>

        {expanded && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-1 px-2 text-muted-foreground">Dez</th>
                  <th className="text-left py-1 px-2 text-muted-foreground">Grupo</th>
                  <th className="text-right py-1 px-2 text-muted-foreground">Freq</th>
                  <th className="text-right py-1 px-2 text-muted-foreground">Rank</th>
                  <th className="text-right py-1 px-2 text-muted-foreground">Atraso</th>
                  <th className="text-right py-1 px-2 text-muted-foreground">Score</th>
                  <th className="text-left py-1 px-2 text-muted-foreground">Seleção</th>
                </tr>
              </thead>
              <tbody>
                {game.meta.map(m => (
                  <tr key={m.dezena} className="border-b border-border/50">
                    <td className="py-1 px-2 font-bold">{m.dezena.toString().padStart(2, "0")}</td>
                    <td className="py-1 px-2">{m.source === "A" ? "Último" : "Fora"}</td>
                    <td className="py-1 px-2 text-right">{m.frequency}</td>
                    <td className="py-1 px-2 text-right">#{m.rankPosition}</td>
                    <td className="py-1 px-2 text-right">{m.atrasoAtual}</td>
                    <td className="py-1 px-2 text-right font-mono">{m.score.toFixed(3)}</td>
                    <td className="py-1 px-2">
                      <Badge variant={m.chosenBy === "base" ? "default" : "outline"} className="text-[10px]">
                        {m.chosenBy === "base" ? "Base" : "Variação"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
