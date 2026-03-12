
-- Function to recalculate repetidas_do_anterior in bulk (server-side)
CREATE OR REPLACE FUNCTION public.recalcular_repetidas_do_anterior()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  rec RECORD;
  prev_dezenas integer[];
  curr_dezenas integer[];
  repetidas integer;
  is_first boolean := true;
BEGIN
  FOR rec IN 
    SELECT id, d1,d2,d3,d4,d5,d6,d7,d8,d9,d10,d11,d12,d13,d14,d15
    FROM concursos ORDER BY numero_concurso ASC
  LOOP
    curr_dezenas := ARRAY[rec.d1,rec.d2,rec.d3,rec.d4,rec.d5,rec.d6,rec.d7,rec.d8,rec.d9,rec.d10,rec.d11,rec.d12,rec.d13,rec.d14,rec.d15];
    IF is_first THEN
      UPDATE concursos SET repetidas_do_anterior = 0 WHERE id = rec.id;
      is_first := false;
    ELSE
      SELECT COUNT(*) INTO repetidas FROM unnest(curr_dezenas) AS d WHERE d = ANY(prev_dezenas);
      UPDATE concursos SET repetidas_do_anterior = repetidas WHERE id = rec.id;
    END IF;
    prev_dezenas := curr_dezenas;
  END LOOP;
END;
$$;

-- Function to recalculate estatisticas_dezenas in bulk (server-side)
CREATE OR REPLACE FUNCTION public.recalcular_estatisticas()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  d integer;
  total_concursos integer;
  freq integer;
  last_seen integer;
  max_gap integer;
  prev_pos integer;
  curr_gap integer;
  rec RECORD;
  pos integer;
  dezenas integer[];
BEGIN
  SELECT COUNT(*) INTO total_concursos FROM concursos;
  IF total_concursos = 0 THEN RETURN; END IF;

  FOR d IN 1..25 LOOP
    freq := 0;
    last_seen := -1;
    max_gap := 0;
    prev_pos := -1;
    pos := 0;

    FOR rec IN SELECT d1,d2,d3,d4,d5,d6,d7,d8,d9,d10,d11,d12,d13,d14,d15 FROM concursos ORDER BY numero_concurso ASC LOOP
      dezenas := ARRAY[rec.d1,rec.d2,rec.d3,rec.d4,rec.d5,rec.d6,rec.d7,rec.d8,rec.d9,rec.d10,rec.d11,rec.d12,rec.d13,rec.d14,rec.d15];
      IF d = ANY(dezenas) THEN
        freq := freq + 1;
        IF prev_pos >= 0 THEN
          curr_gap := pos - prev_pos - 1;
          IF curr_gap > max_gap THEN max_gap := curr_gap; END IF;
        END IF;
        prev_pos := pos;
        last_seen := pos;
      END IF;
      pos := pos + 1;
    END LOOP;

    -- Final gap
    IF last_seen >= 0 THEN
      curr_gap := total_concursos - 1 - last_seen;
    ELSE
      curr_gap := total_concursos;
    END IF;
    IF curr_gap > max_gap THEN max_gap := curr_gap; END IF;

    UPDATE estatisticas_dezenas SET
      frequencia_total = freq,
      atraso_atual = CASE WHEN last_seen >= 0 THEN total_concursos - 1 - last_seen ELSE total_concursos END,
      maior_atraso_historico = max_gap
    WHERE dezena = d;
  END LOOP;
END;
$$;

-- Function to recalculate trincas in bulk (server-side)
CREATE OR REPLACE FUNCTION public.recalcular_trincas()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  rec RECORD;
  dezenas integer[];
  i integer;
  j integer;
  k integer;
BEGIN
  DELETE FROM trincas_frequentes;

  CREATE TEMP TABLE IF NOT EXISTS tmp_trincas (d1 integer, d2 integer, d3 integer, freq integer DEFAULT 1) ON COMMIT DROP;
  TRUNCATE tmp_trincas;

  FOR rec IN SELECT d1,d2,d3,d4,d5,d6,d7,d8,d9,d10,d11,d12,d13,d14,d15 FROM concursos LOOP
    dezenas := ARRAY[rec.d1,rec.d2,rec.d3,rec.d4,rec.d5,rec.d6,rec.d7,rec.d8,rec.d9,rec.d10,rec.d11,rec.d12,rec.d13,rec.d14,rec.d15];
    -- Sort
    SELECT array_agg(x ORDER BY x) INTO dezenas FROM unnest(dezenas) AS x;
    
    FOR i IN 1..13 LOOP
      FOR j IN (i+1)..14 LOOP
        FOR k IN (j+1)..15 LOOP
          INSERT INTO tmp_trincas (d1, d2, d3) VALUES (dezenas[i], dezenas[j], dezenas[k]);
        END LOOP;
      END LOOP;
    END LOOP;
  END LOOP;

  INSERT INTO trincas_frequentes (dezena1, dezena2, dezena3, frequencia_trinca)
  SELECT d1, d2, d3, COUNT(*) as freq
  FROM tmp_trincas
  GROUP BY d1, d2, d3
  ORDER BY freq DESC
  LIMIT 200;

  DROP TABLE IF EXISTS tmp_trincas;
END;
$$;
