-- Slug de tenant: formato, reservados, namespace único (entidade + UBT), backfill e redirects

CREATE EXTENSION IF NOT EXISTS unaccent;

-- ---------------------------------------------------------------------------
-- Funções de validação e normalização (espelham backend/src/lib/tenant/slug.ts)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION tenant_slug_is_reserved(p_slug TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(trim(COALESCE(p_slug, ''))) = ANY (
    ARRAY[
      'admin', 'api', 'app', 'www', 'mail', 'smtp', 'ftp', 'cdn', 'static', 'assets',
      'gestao', 'prefeitura', 'ubt', 'profissional', 'medico', 'seguranca',
      'login', 'auth', 'oauth', 'webhook', 'hooks', 'internal', 'cron', 'status',
      'health', 'docs', 'blog', 'suporte', 'help', 'telefarmed', 'platform',
      'staging', 'dev', 'test', 'demo', 'sandbox'
    ]
  );
$$;

CREATE OR REPLACE FUNCTION tenant_slug_format_valid(p_slug TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT p_slug IS NOT NULL
    AND char_length(p_slug) BETWEEN 3 AND 50
    AND p_slug ~ '^[a-z0-9]([a-z0-9-]{1,48}[a-z0-9])?$';
$$;

CREATE OR REPLACE FUNCTION tenant_slugify(p_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v TEXT;
BEGIN
  IF p_text IS NULL OR trim(p_text) = '' THEN
    RETURN '';
  END IF;

  v := lower(unaccent(trim(p_text)));
  v := regexp_replace(v, '[^a-z0-9]+', '-', 'g');
  v := regexp_replace(v, '-+', '-', 'g');
  v := trim(BOTH '-' FROM v);
  RETURN v;
END;
$$;

-- Sigla do município para sufixo (ex.: São José dos Campos → sjc).
CREATE OR REPLACE FUNCTION tenant_municipio_suffix(p_municipio TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(
    NULLIF(
      (
        SELECT string_agg(left(word, 1), '')
        FROM regexp_split_to_table(
          tenant_slugify(COALESCE(p_municipio, '')),
          '-'
        ) AS word
        WHERE word <> ''
          AND word NOT IN ('de', 'do', 'da', 'dos', 'das', 'e')
      ),
      ''
    ),
    'br'
  );
$$;

CREATE OR REPLACE FUNCTION tenant_slug_is_taken(
  p_slug TEXT,
  p_exclude_entidade_id UUID DEFAULT NULL,
  p_exclude_ubt_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM entidades_contratantes e
    WHERE e.slug = p_slug
      AND (p_exclude_entidade_id IS NULL OR e.id <> p_exclude_entidade_id)
  )
  OR EXISTS (
    SELECT 1
    FROM unidades_ubt u
    WHERE u.slug = p_slug
      AND (p_exclude_ubt_id IS NULL OR u.id <> p_exclude_ubt_id)
  );
$$;

CREATE OR REPLACE FUNCTION tenant_allocate_slug(
  p_base TEXT,
  p_exclude_entidade_id UUID DEFAULT NULL,
  p_exclude_ubt_id UUID DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_root TEXT;
  v_try TEXT;
  v_suffix INT := 0;
BEGIN
  v_root := tenant_slugify(p_base);
  IF v_root = '' THEN
    v_root := 'entidade';
  END IF;

  LOOP
    IF v_suffix = 0 THEN
      v_try := left(v_root, 50);
    ELSE
      v_try := left(v_root, greatest(3, 50 - char_length(v_suffix::text) - 1)) || '-' || v_suffix::text;
    END IF;

    v_try := trim(BOTH '-' FROM v_try);

    IF tenant_slug_format_valid(v_try)
       AND NOT tenant_slug_is_reserved(v_try)
       AND NOT tenant_slug_is_taken(v_try, p_exclude_entidade_id, p_exclude_ubt_id)
    THEN
      RETURN v_try;
    END IF;

    v_suffix := v_suffix + 1;
    IF v_suffix > 99 THEN
      RAISE EXCEPTION 'tenant_allocate_slug: não foi possível alocar slug para "%"', p_base;
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION tenant_build_entidade_slug_base(
  p_razao_social TEXT,
  p_nome_exibicao TEXT,
  p_municipio TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_razao TEXT;
  v_mun TEXT;
BEGIN
  v_razao := tenant_slugify(COALESCE(NULLIF(trim(p_razao_social), ''), NULLIF(trim(p_nome_exibicao), ''), 'entidade'));
  v_mun := tenant_municipio_suffix(p_municipio);
  RETURN left(v_razao || '-' || v_mun, 50);
END;
$$;

-- ---------------------------------------------------------------------------
-- 2.4 Backfill — entidades existentes sem slug (ou slug inválido/reservado)
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  r RECORD;
  v_base TEXT;
  v_slug TEXT;
BEGIN
  FOR r IN
    SELECT id, razao_social, nome_exibicao, municipio, slug
    FROM entidades_contratantes
    WHERE slug IS NULL
       OR NOT tenant_slug_format_valid(slug)
       OR tenant_slug_is_reserved(slug)
    ORDER BY criado_em NULLS LAST, id
  LOOP
    v_base := tenant_build_entidade_slug_base(r.razao_social, r.nome_exibicao, r.municipio);
    v_slug := tenant_allocate_slug(v_base, r.id, NULL);
    UPDATE entidades_contratantes
    SET slug = v_slug
    WHERE id = r.id;
  END LOOP;
END;
$$;

-- Garantia: nenhuma entidade sem slug após backfill
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM entidades_contratantes WHERE slug IS NULL) THEN
    RAISE EXCEPTION 'tenant_slug backfill incompleto: entidades sem slug';
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- 2.1 / 2.2 / 2.3 Constraints e índices
-- ---------------------------------------------------------------------------

DROP INDEX IF EXISTS entidades_contratantes_slug_unique_idx;
DROP INDEX IF EXISTS unidades_ubt_slug_unique_idx;

ALTER TABLE entidades_contratantes
  ALTER COLUMN slug SET NOT NULL;

ALTER TABLE entidades_contratantes
  DROP CONSTRAINT IF EXISTS entidades_contratantes_slug_format_chk,
  DROP CONSTRAINT IF EXISTS entidades_contratantes_slug_not_reserved_chk;

ALTER TABLE entidades_contratantes
  ADD CONSTRAINT entidades_contratantes_slug_format_chk
    CHECK (tenant_slug_format_valid(slug)),
  ADD CONSTRAINT entidades_contratantes_slug_not_reserved_chk
    CHECK (NOT tenant_slug_is_reserved(slug));

CREATE UNIQUE INDEX IF NOT EXISTS entidades_contratantes_slug_uidx
  ON entidades_contratantes (slug);

ALTER TABLE unidades_ubt
  DROP CONSTRAINT IF EXISTS unidades_ubt_slug_format_chk,
  DROP CONSTRAINT IF EXISTS unidades_ubt_slug_not_reserved_chk;

ALTER TABLE unidades_ubt
  ADD CONSTRAINT unidades_ubt_slug_format_chk
    CHECK (slug IS NULL OR tenant_slug_format_valid(slug)),
  ADD CONSTRAINT unidades_ubt_slug_not_reserved_chk
    CHECK (slug IS NULL OR NOT tenant_slug_is_reserved(slug));

CREATE UNIQUE INDEX IF NOT EXISTS unidades_ubt_slug_uidx
  ON unidades_ubt (slug)
  WHERE slug IS NOT NULL;

-- Namespace único entre entidades e UBTs (trigger)
CREATE OR REPLACE FUNCTION tenant_slug_enforce_namespace()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'entidades_contratantes' THEN
    IF EXISTS (
      SELECT 1 FROM unidades_ubt u
      WHERE u.slug = NEW.slug
    ) THEN
      RAISE EXCEPTION 'slug "%" já está em uso por uma UBT', NEW.slug
        USING ERRCODE = 'unique_violation';
    END IF;
  ELSIF TG_TABLE_NAME = 'unidades_ubt' THEN
    IF EXISTS (
      SELECT 1 FROM entidades_contratantes e
      WHERE e.slug = NEW.slug
    ) THEN
      RAISE EXCEPTION 'slug "%" já está em uso por uma entidade', NEW.slug
        USING ERRCODE = 'unique_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS entidades_contratantes_slug_namespace_trg ON entidades_contratantes;
CREATE TRIGGER entidades_contratantes_slug_namespace_trg
  BEFORE INSERT OR UPDATE OF slug ON entidades_contratantes
  FOR EACH ROW
  EXECUTE FUNCTION tenant_slug_enforce_namespace();

DROP TRIGGER IF EXISTS unidades_ubt_slug_namespace_trg ON unidades_ubt;
CREATE TRIGGER unidades_ubt_slug_namespace_trg
  BEFORE INSERT OR UPDATE OF slug ON unidades_ubt
  FOR EACH ROW
  EXECUTE FUNCTION tenant_slug_enforce_namespace();

-- ---------------------------------------------------------------------------
-- 2.5 Histórico / redirect quando o slug mudar
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tenant_hosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  redirect_slug TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('gestao', 'ubt')),
  entidade_contratante_id UUID REFERENCES entidades_contratantes(id) ON DELETE CASCADE,
  unidade_ubt_id UUID REFERENCES unidades_ubt(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tenant_hosts_slug_format_chk CHECK (tenant_slug_format_valid(slug)),
  CONSTRAINT tenant_hosts_redirect_format_chk CHECK (tenant_slug_format_valid(redirect_slug)),
  CONSTRAINT tenant_hosts_owner_chk CHECK (
    (kind = 'gestao' AND entidade_contratante_id IS NOT NULL AND unidade_ubt_id IS NULL)
    OR (kind = 'ubt' AND unidade_ubt_id IS NOT NULL AND entidade_contratante_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS tenant_hosts_slug_uidx ON tenant_hosts (slug);
CREATE INDEX IF NOT EXISTS tenant_hosts_redirect_slug_idx ON tenant_hosts (redirect_slug);
CREATE INDEX IF NOT EXISTS tenant_hosts_entidade_idx ON tenant_hosts (entidade_contratante_id);
CREATE INDEX IF NOT EXISTS tenant_hosts_ubt_idx ON tenant_hosts (unidade_ubt_id);

COMMENT ON TABLE tenant_hosts IS
  'Slugs antigos → redirect_slug (301 na API). Preenchido ao trocar slug de entidade ou UBT.';
COMMENT ON COLUMN unidades_ubt.slug IS
  'Opcional: null = terminal sem host dedicado (fase inicial). Gestão sempre tem slug na entidade.';

CREATE OR REPLACE FUNCTION tenant_hosts_record_slug_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND OLD.slug IS DISTINCT FROM NEW.slug
     AND OLD.slug IS NOT NULL
     AND NEW.slug IS NOT NULL
  THEN
    IF TG_TABLE_NAME = 'entidades_contratantes' THEN
      INSERT INTO tenant_hosts (slug, redirect_slug, kind, entidade_contratante_id)
      VALUES (OLD.slug, NEW.slug, 'gestao', NEW.id)
      ON CONFLICT (slug) DO UPDATE
        SET redirect_slug = EXCLUDED.redirect_slug,
            entidade_contratante_id = EXCLUDED.entidade_contratante_id;
    ELSIF TG_TABLE_NAME = 'unidades_ubt' THEN
      INSERT INTO tenant_hosts (
        slug,
        redirect_slug,
        kind,
        entidade_contratante_id,
        unidade_ubt_id
      )
      VALUES (OLD.slug, NEW.slug, 'ubt', NEW.entidade_contratante_id, NEW.id)
      ON CONFLICT (slug) DO UPDATE
        SET redirect_slug = EXCLUDED.redirect_slug,
            unidade_ubt_id = EXCLUDED.unidade_ubt_id,
            entidade_contratante_id = EXCLUDED.entidade_contratante_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS entidades_contratantes_slug_redirect_trg ON entidades_contratantes;
CREATE TRIGGER entidades_contratantes_slug_redirect_trg
  AFTER UPDATE OF slug ON entidades_contratantes
  FOR EACH ROW
  EXECUTE FUNCTION tenant_hosts_record_slug_change();

DROP TRIGGER IF EXISTS unidades_ubt_slug_redirect_trg ON unidades_ubt;
CREATE TRIGGER unidades_ubt_slug_redirect_trg
  AFTER UPDATE OF slug ON unidades_ubt
  FOR EACH ROW
  WHEN (OLD.slug IS NOT NULL)
  EXECUTE FUNCTION tenant_hosts_record_slug_change();

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE tenant_hosts TO service_role;

ALTER TABLE tenant_hosts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE tenant_hosts FROM anon, authenticated;
