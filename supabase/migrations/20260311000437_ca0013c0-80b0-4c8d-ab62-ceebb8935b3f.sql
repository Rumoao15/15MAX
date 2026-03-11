-- Create concursos table
CREATE TABLE public.concursos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_concurso INTEGER NOT NULL UNIQUE,
  data_concurso TIMESTAMPTZ NOT NULL,
  d1 INTEGER NOT NULL CHECK (d1 BETWEEN 1 AND 25),
  d2 INTEGER NOT NULL CHECK (d2 BETWEEN 1 AND 25),
  d3 INTEGER NOT NULL CHECK (d3 BETWEEN 1 AND 25),
  d4 INTEGER NOT NULL CHECK (d4 BETWEEN 1 AND 25),
  d5 INTEGER NOT NULL CHECK (d5 BETWEEN 1 AND 25),
  d6 INTEGER NOT NULL CHECK (d6 BETWEEN 1 AND 25),
  d7 INTEGER NOT NULL CHECK (d7 BETWEEN 1 AND 25),
  d8 INTEGER NOT NULL CHECK (d8 BETWEEN 1 AND 25),
  d9 INTEGER NOT NULL CHECK (d9 BETWEEN 1 AND 25),
  d10 INTEGER NOT NULL CHECK (d10 BETWEEN 1 AND 25),
  d11 INTEGER NOT NULL CHECK (d11 BETWEEN 1 AND 25),
  d12 INTEGER NOT NULL CHECK (d12 BETWEEN 1 AND 25),
  d13 INTEGER NOT NULL CHECK (d13 BETWEEN 1 AND 25),
  d14 INTEGER NOT NULL CHECK (d14 BETWEEN 1 AND 25),
  d15 INTEGER NOT NULL CHECK (d15 BETWEEN 1 AND 25),
  soma_dezenas INTEGER NOT NULL DEFAULT 0,
  qtd_pares INTEGER NOT NULL DEFAULT 0,
  qtd_impares INTEGER NOT NULL DEFAULT 0,
  qtd_primos INTEGER NOT NULL DEFAULT 0,
  qtd_fibonacci INTEGER NOT NULL DEFAULT 0,
  qtd_multiplos_3 INTEGER NOT NULL DEFAULT 0,
  linha1_qtd INTEGER NOT NULL DEFAULT 0,
  linha2_qtd INTEGER NOT NULL DEFAULT 0,
  linha3_qtd INTEGER NOT NULL DEFAULT 0,
  linha4_qtd INTEGER NOT NULL DEFAULT 0,
  linha5_qtd INTEGER NOT NULL DEFAULT 0,
  coluna1_qtd INTEGER NOT NULL DEFAULT 0,
  coluna2_qtd INTEGER NOT NULL DEFAULT 0,
  coluna3_qtd INTEGER NOT NULL DEFAULT 0,
  coluna4_qtd INTEGER NOT NULL DEFAULT 0,
  coluna5_qtd INTEGER NOT NULL DEFAULT 0,
  repetidas_do_anterior INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_concursos_data ON public.concursos (data_concurso);
CREATE INDEX idx_concursos_numero ON public.concursos (numero_concurso);

-- Create estatisticas_dezenas table
CREATE TABLE public.estatisticas_dezenas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dezena INTEGER NOT NULL UNIQUE CHECK (dezena BETWEEN 1 AND 25),
  frequencia_total INTEGER NOT NULL DEFAULT 0,
  atraso_atual INTEGER NOT NULL DEFAULT 0,
  maior_atraso_historico INTEGER NOT NULL DEFAULT 0,
  e_par BOOLEAN NOT NULL DEFAULT false,
  e_primo BOOLEAN NOT NULL DEFAULT false,
  e_fibonacci BOOLEAN NOT NULL DEFAULT false,
  e_multiplo_3 BOOLEAN NOT NULL DEFAULT false
);

-- Seed initial rows for all 25 dezenas
INSERT INTO public.estatisticas_dezenas (dezena, e_par, e_primo, e_fibonacci, e_multiplo_3)
SELECT 
  d,
  d % 2 = 0,
  d IN (2,3,5,7,11,13,17,19,23),
  d IN (1,2,3,5,8,13,21),
  d % 3 = 0
FROM generate_series(1, 25) AS d;

-- Create trincas_frequentes table
CREATE TABLE public.trincas_frequentes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dezena1 INTEGER NOT NULL CHECK (dezena1 BETWEEN 1 AND 25),
  dezena2 INTEGER NOT NULL CHECK (dezena2 BETWEEN 1 AND 25),
  dezena3 INTEGER NOT NULL CHECK (dezena3 BETWEEN 1 AND 25),
  frequencia_trinca INTEGER NOT NULL DEFAULT 0,
  UNIQUE(dezena1, dezena2, dezena3)
);

-- Create jogos_gerados table
CREATE TABLE public.jogos_gerados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data_geracao TIMESTAMPTZ NOT NULL DEFAULT now(),
  tipo_modelo TEXT NOT NULL,
  referencia_concurso INTEGER,
  d1 INTEGER NOT NULL CHECK (d1 BETWEEN 1 AND 25),
  d2 INTEGER NOT NULL CHECK (d2 BETWEEN 1 AND 25),
  d3 INTEGER NOT NULL CHECK (d3 BETWEEN 1 AND 25),
  d4 INTEGER NOT NULL CHECK (d4 BETWEEN 1 AND 25),
  d5 INTEGER NOT NULL CHECK (d5 BETWEEN 1 AND 25),
  d6 INTEGER NOT NULL CHECK (d6 BETWEEN 1 AND 25),
  d7 INTEGER NOT NULL CHECK (d7 BETWEEN 1 AND 25),
  d8 INTEGER NOT NULL CHECK (d8 BETWEEN 1 AND 25),
  d9 INTEGER NOT NULL CHECK (d9 BETWEEN 1 AND 25),
  d10 INTEGER NOT NULL CHECK (d10 BETWEEN 1 AND 25),
  d11 INTEGER NOT NULL CHECK (d11 BETWEEN 1 AND 25),
  d12 INTEGER NOT NULL CHECK (d12 BETWEEN 1 AND 25),
  d13 INTEGER NOT NULL CHECK (d13 BETWEEN 1 AND 25),
  d14 INTEGER NOT NULL CHECK (d14 BETWEEN 1 AND 25),
  d15 INTEGER NOT NULL CHECK (d15 BETWEEN 1 AND 25)
);

CREATE INDEX idx_jogos_tipo ON public.jogos_gerados (tipo_modelo);
CREATE INDEX idx_jogos_data ON public.jogos_gerados (data_geracao);

-- Enable RLS on all tables
ALTER TABLE public.concursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estatisticas_dezenas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trincas_frequentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jogos_gerados ENABLE ROW LEVEL SECURITY;

-- Allow public access (single-user analytical tool)
CREATE POLICY "Allow all access to concursos" ON public.concursos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to estatisticas_dezenas" ON public.estatisticas_dezenas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to trincas_frequentes" ON public.trincas_frequentes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to jogos_gerados" ON public.jogos_gerados FOR ALL USING (true) WITH CHECK (true);