
-- Drop authenticated-only INSERT/UPDATE/DELETE policies and replace with public access
DROP POLICY IF EXISTS "Authenticated insert concursos" ON public.concursos;
DROP POLICY IF EXISTS "Authenticated update concursos" ON public.concursos;
DROP POLICY IF EXISTS "Authenticated delete concursos" ON public.concursos;

DROP POLICY IF EXISTS "Authenticated insert estatisticas_dezenas" ON public.estatisticas_dezenas;
DROP POLICY IF EXISTS "Authenticated update estatisticas_dezenas" ON public.estatisticas_dezenas;
DROP POLICY IF EXISTS "Authenticated delete estatisticas_dezenas" ON public.estatisticas_dezenas;

DROP POLICY IF EXISTS "Authenticated insert trincas_frequentes" ON public.trincas_frequentes;
DROP POLICY IF EXISTS "Authenticated update trincas_frequentes" ON public.trincas_frequentes;
DROP POLICY IF EXISTS "Authenticated delete trincas_frequentes" ON public.trincas_frequentes;

DROP POLICY IF EXISTS "Authenticated insert jogos_gerados" ON public.jogos_gerados;
DROP POLICY IF EXISTS "Authenticated update jogos_gerados" ON public.jogos_gerados;
DROP POLICY IF EXISTS "Authenticated delete jogos_gerados" ON public.jogos_gerados;

-- Allow public write access (no auth required)
CREATE POLICY "Public insert concursos" ON public.concursos FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public update concursos" ON public.concursos FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public delete concursos" ON public.concursos FOR DELETE TO public USING (true);

CREATE POLICY "Public insert estatisticas_dezenas" ON public.estatisticas_dezenas FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public update estatisticas_dezenas" ON public.estatisticas_dezenas FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public delete estatisticas_dezenas" ON public.estatisticas_dezenas FOR DELETE TO public USING (true);

CREATE POLICY "Public insert trincas_frequentes" ON public.trincas_frequentes FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public update trincas_frequentes" ON public.trincas_frequentes FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public delete trincas_frequentes" ON public.trincas_frequentes FOR DELETE TO public USING (true);

CREATE POLICY "Public insert jogos_gerados" ON public.jogos_gerados FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public update jogos_gerados" ON public.jogos_gerados FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public delete jogos_gerados" ON public.jogos_gerados FOR DELETE TO public USING (true);
