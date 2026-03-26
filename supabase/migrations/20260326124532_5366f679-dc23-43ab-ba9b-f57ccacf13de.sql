
-- Drop existing permissive "allow all" policies
DROP POLICY IF EXISTS "Allow all access to concursos" ON public.concursos;
DROP POLICY IF EXISTS "Allow all access to estatisticas_dezenas" ON public.estatisticas_dezenas;
DROP POLICY IF EXISTS "Allow all access to trincas_frequentes" ON public.trincas_frequentes;
DROP POLICY IF EXISTS "Allow all access to jogos_gerados" ON public.jogos_gerados;

-- concursos: public read, authenticated write
CREATE POLICY "Public read concursos" ON public.concursos FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated insert concursos" ON public.concursos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update concursos" ON public.concursos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete concursos" ON public.concursos FOR DELETE TO authenticated USING (true);

-- estatisticas_dezenas: public read, authenticated write
CREATE POLICY "Public read estatisticas_dezenas" ON public.estatisticas_dezenas FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated insert estatisticas_dezenas" ON public.estatisticas_dezenas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update estatisticas_dezenas" ON public.estatisticas_dezenas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete estatisticas_dezenas" ON public.estatisticas_dezenas FOR DELETE TO authenticated USING (true);

-- trincas_frequentes: public read, authenticated write
CREATE POLICY "Public read trincas_frequentes" ON public.trincas_frequentes FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated insert trincas_frequentes" ON public.trincas_frequentes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update trincas_frequentes" ON public.trincas_frequentes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete trincas_frequentes" ON public.trincas_frequentes FOR DELETE TO authenticated USING (true);

-- jogos_gerados: public read, authenticated write
CREATE POLICY "Public read jogos_gerados" ON public.jogos_gerados FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated insert jogos_gerados" ON public.jogos_gerados FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update jogos_gerados" ON public.jogos_gerados FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete jogos_gerados" ON public.jogos_gerados FOR DELETE TO authenticated USING (true);
