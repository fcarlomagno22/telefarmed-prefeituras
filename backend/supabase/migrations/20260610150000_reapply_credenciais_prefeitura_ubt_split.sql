-- Reaplica split usuarios_portal -> usuarios_prefeitura + usuarios_ubt
-- (banco remoto foi restaurado para usuarios_portal legado)

ALTER TABLE usuarios_portal
  ADD COLUMN IF NOT EXISTS permissoes_paginas JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS usuarios_prefeitura (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpf CHAR(11) NOT NULL,
  nome TEXT NOT NULL,
  email CITEXT,
  funcao TEXT NOT NULL DEFAULT '',
  senha_hash TEXT NOT NULL,
  pin_autorizacao_hash TEXT,
  nivel_acesso nivel_acesso_admin NOT NULL DEFAULT 'operador',
  status status_usuario_admin NOT NULL DEFAULT 'ativo',
  entidade_contratante_id UUID NOT NULL REFERENCES entidades_contratantes(id) ON DELETE RESTRICT,
  permissoes_paginas JSONB NOT NULL DEFAULT '{}'::jsonb,
  entidade_razao_social TEXT NOT NULL,
  municipio TEXT NOT NULL,
  uf CHAR(2) NOT NULL,
  ultimo_login_em TIMESTAMPTZ,
  tentativas_login_falhas SMALLINT NOT NULL DEFAULT 0,
  bloqueado_ate TIMESTAMPTZ,
  senha_alterada_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT usuarios_prefeitura_cpf_digitos CHECK (cpf ~ '^[0-9]{11}$'),
  CONSTRAINT usuarios_prefeitura_tentativas_nao_negativas CHECK (tentativas_login_falhas >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS usuarios_prefeitura_cpf_uidx ON usuarios_prefeitura (cpf);
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_prefeitura_email_uidx ON usuarios_prefeitura (email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS usuarios_prefeitura_status_idx ON usuarios_prefeitura (status);
CREATE INDEX IF NOT EXISTS usuarios_prefeitura_entidade_idx ON usuarios_prefeitura (entidade_contratante_id);
CREATE INDEX IF NOT EXISTS usuarios_prefeitura_permissoes_paginas_gin_idx
  ON usuarios_prefeitura USING gin (permissoes_paginas);

CREATE TABLE IF NOT EXISTS usuarios_ubt (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpf CHAR(11) NOT NULL,
  nome TEXT NOT NULL,
  email CITEXT,
  funcao TEXT NOT NULL DEFAULT '',
  senha_hash TEXT NOT NULL,
  pin_autorizacao_hash TEXT,
  nivel_acesso nivel_acesso_admin NOT NULL DEFAULT 'operador',
  status status_usuario_admin NOT NULL DEFAULT 'ativo',
  entidade_contratante_id UUID NOT NULL REFERENCES entidades_contratantes(id) ON DELETE RESTRICT,
  unidade_ubt_id UUID NOT NULL REFERENCES unidades_ubt(id) ON DELETE RESTRICT,
  eh_responsavel_ubt BOOLEAN NOT NULL DEFAULT false,
  permissoes_sistema JSONB NOT NULL DEFAULT '{}'::jsonb,
  entidade_razao_social TEXT NOT NULL,
  municipio TEXT NOT NULL,
  uf CHAR(2) NOT NULL,
  unidade_ubt_nome TEXT NOT NULL,
  ra_chave TEXT NOT NULL,
  ra_rotulo TEXT NOT NULL,
  ultimo_login_em TIMESTAMPTZ,
  tentativas_login_falhas SMALLINT NOT NULL DEFAULT 0,
  bloqueado_ate TIMESTAMPTZ,
  senha_alterada_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT usuarios_ubt_cpf_digitos CHECK (cpf ~ '^[0-9]{11}$'),
  CONSTRAINT usuarios_ubt_tentativas_nao_negativas CHECK (tentativas_login_falhas >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS usuarios_ubt_cpf_uidx ON usuarios_ubt (cpf);
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_ubt_email_uidx ON usuarios_ubt (email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS usuarios_ubt_status_idx ON usuarios_ubt (status);
CREATE INDEX IF NOT EXISTS usuarios_ubt_entidade_idx ON usuarios_ubt (entidade_contratante_id);
CREATE INDEX IF NOT EXISTS usuarios_ubt_unidade_idx ON usuarios_ubt (unidade_ubt_id);
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_ubt_responsavel_uidx
  ON usuarios_ubt (unidade_ubt_id)
  WHERE eh_responsavel_ubt = true AND status = 'ativo';

INSERT INTO usuarios_prefeitura (
  id, cpf, nome, email, funcao, senha_hash, pin_autorizacao_hash, nivel_acesso, status,
  entidade_contratante_id, permissoes_paginas, entidade_razao_social, municipio, uf,
  ultimo_login_em, tentativas_login_falhas, bloqueado_ate, senha_alterada_em, criado_em, atualizado_em
)
SELECT
  id, cpf, nome, email, funcao, senha_hash, pin_autorizacao_hash, nivel_acesso, status,
  entidade_contratante_id, permissoes_paginas, entidade_razao_social, municipio, uf,
  ultimo_login_em, tentativas_login_falhas, bloqueado_ate, senha_alterada_em, criado_em, atualizado_em
FROM usuarios_portal
WHERE escopo_portal = 'prefeitura'
ON CONFLICT (id) DO NOTHING;

INSERT INTO usuarios_ubt (
  id, cpf, nome, email, funcao, senha_hash, pin_autorizacao_hash, nivel_acesso, status,
  entidade_contratante_id, unidade_ubt_id, eh_responsavel_ubt, permissoes_sistema,
  entidade_razao_social, municipio, uf, unidade_ubt_nome, ra_chave, ra_rotulo,
  ultimo_login_em, tentativas_login_falhas, bloqueado_ate, senha_alterada_em, criado_em, atualizado_em
)
SELECT
  id, cpf, nome, email, funcao, senha_hash, pin_autorizacao_hash, nivel_acesso, status,
  entidade_contratante_id, unidade_ubt_id, eh_responsavel_ubt, permissoes_sistema,
  entidade_razao_social, municipio, uf,
  COALESCE(unidade_ubt_nome, 'UBT'),
  COALESCE(ra_chave, 'central'),
  COALESCE(ra_rotulo, 'RA Central'),
  ultimo_login_em, tentativas_login_falhas, bloqueado_ate, senha_alterada_em, criado_em, atualizado_em
FROM usuarios_portal
WHERE escopo_portal = 'ubt' AND unidade_ubt_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

DROP TRIGGER IF EXISTS usuarios_prefeitura_definir_atualizado_em ON usuarios_prefeitura;
CREATE TRIGGER usuarios_prefeitura_definir_atualizado_em
  BEFORE UPDATE ON usuarios_prefeitura
  FOR EACH ROW
  EXECUTE FUNCTION public.definir_atualizado_em();

DROP TRIGGER IF EXISTS usuarios_ubt_definir_atualizado_em ON usuarios_ubt;
CREATE TRIGGER usuarios_ubt_definir_atualizado_em
  BEFORE UPDATE ON usuarios_ubt
  FOR EACH ROW
  EXECUTE FUNCTION public.definir_atualizado_em();

CREATE OR REPLACE FUNCTION public.preencher_snapshot_usuario_prefeitura()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  ent RECORD;
BEGIN
  SELECT razao_social, municipio, uf
  INTO ent
  FROM entidades_contratantes
  WHERE id = NEW.entidade_contratante_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Entidade contratante não encontrada.';
  END IF;

  NEW.entidade_razao_social := ent.razao_social;
  NEW.municipio := ent.municipio;
  NEW.uf := ent.uf;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS usuarios_prefeitura_preencher_snapshot ON usuarios_prefeitura;
CREATE TRIGGER usuarios_prefeitura_preencher_snapshot
  BEFORE INSERT OR UPDATE OF entidade_contratante_id
  ON usuarios_prefeitura
  FOR EACH ROW
  EXECUTE FUNCTION public.preencher_snapshot_usuario_prefeitura();

CREATE OR REPLACE FUNCTION public.preencher_snapshot_usuario_ubt()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  ent RECORD;
  ubt RECORD;
BEGIN
  SELECT razao_social, municipio, uf
  INTO ent
  FROM entidades_contratantes
  WHERE id = NEW.entidade_contratante_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Entidade contratante não encontrada.';
  END IF;

  NEW.entidade_razao_social := ent.razao_social;
  NEW.municipio := ent.municipio;
  NEW.uf := ent.uf;

  SELECT nome, ra_chave, ra_rotulo, entidade_contratante_id
  INTO ubt
  FROM unidades_ubt
  WHERE id = NEW.unidade_ubt_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unidade UBT não encontrada.';
  END IF;

  IF ubt.entidade_contratante_id <> NEW.entidade_contratante_id THEN
    RAISE EXCEPTION 'A UBT não pertence à entidade contratante informada.';
  END IF;

  NEW.unidade_ubt_nome := ubt.nome;
  NEW.ra_chave := ubt.ra_chave;
  NEW.ra_rotulo := ubt.ra_rotulo;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS usuarios_ubt_preencher_snapshot ON usuarios_ubt;
CREATE TRIGGER usuarios_ubt_preencher_snapshot
  BEFORE INSERT OR UPDATE OF entidade_contratante_id, unidade_ubt_id
  ON usuarios_ubt
  FOR EACH ROW
  EXECUTE FUNCTION public.preencher_snapshot_usuario_ubt();

CREATE OR REPLACE FUNCTION public.propagar_entidade_para_usuarios_prefeitura()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.razao_social IS DISTINCT FROM NEW.razao_social
     OR OLD.municipio IS DISTINCT FROM NEW.municipio
     OR OLD.uf IS DISTINCT FROM NEW.uf THEN
    UPDATE usuarios_prefeitura
    SET entidade_razao_social = NEW.razao_social, municipio = NEW.municipio, uf = NEW.uf
    WHERE entidade_contratante_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.propagar_entidade_para_usuarios_ubt()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.razao_social IS DISTINCT FROM NEW.razao_social
     OR OLD.municipio IS DISTINCT FROM NEW.municipio
     OR OLD.uf IS DISTINCT FROM NEW.uf THEN
    UPDATE usuarios_ubt
    SET entidade_razao_social = NEW.razao_social, municipio = NEW.municipio, uf = NEW.uf
    WHERE entidade_contratante_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS entidades_contratantes_propagar_usuarios_portal ON entidades_contratantes;
DROP TRIGGER IF EXISTS entidades_contratantes_propagar_usuarios_prefeitura ON entidades_contratantes;
CREATE TRIGGER entidades_contratantes_propagar_usuarios_prefeitura
  AFTER UPDATE ON entidades_contratantes
  FOR EACH ROW
  EXECUTE FUNCTION public.propagar_entidade_para_usuarios_prefeitura();

DROP TRIGGER IF EXISTS entidades_contratantes_propagar_usuarios_ubt ON entidades_contratantes;
CREATE TRIGGER entidades_contratantes_propagar_usuarios_ubt
  AFTER UPDATE ON entidades_contratantes
  FOR EACH ROW
  EXECUTE FUNCTION public.propagar_entidade_para_usuarios_ubt();

CREATE OR REPLACE FUNCTION public.propagar_ubt_para_usuarios_ubt()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.nome IS DISTINCT FROM NEW.nome
     OR OLD.ra_chave IS DISTINCT FROM NEW.ra_chave
     OR OLD.ra_rotulo IS DISTINCT FROM NEW.ra_rotulo THEN
    UPDATE usuarios_ubt
    SET unidade_ubt_nome = NEW.nome, ra_chave = NEW.ra_chave, ra_rotulo = NEW.ra_rotulo
    WHERE unidade_ubt_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS unidades_ubt_propagar_usuarios_portal ON unidades_ubt;
DROP TRIGGER IF EXISTS unidades_ubt_propagar_usuarios_ubt ON unidades_ubt;
CREATE TRIGGER unidades_ubt_propagar_usuarios_ubt
  AFTER UPDATE ON unidades_ubt
  FOR EACH ROW
  EXECUTE FUNCTION public.propagar_ubt_para_usuarios_ubt();

DROP VIEW IF EXISTS vw_credenciais_portal_listagem;

CREATE OR REPLACE VIEW vw_credenciais_prefeitura_listagem AS
SELECT
  id, cpf, nome, email, funcao, nivel_acesso, status, entidade_contratante_id,
  permissoes_paginas, entidade_razao_social, municipio, uf,
  (senha_hash IS NOT NULL AND senha_hash <> '') AS possui_senha,
  (pin_autorizacao_hash IS NOT NULL) AS possui_pin_autorizacao,
  ultimo_login_em, criado_em, atualizado_em
FROM usuarios_prefeitura;

CREATE OR REPLACE VIEW vw_credenciais_ubt_listagem AS
SELECT
  id, cpf, nome, email, funcao, nivel_acesso, status, entidade_contratante_id,
  unidade_ubt_id, eh_responsavel_ubt, permissoes_sistema,
  entidade_razao_social, municipio, uf, unidade_ubt_nome, ra_chave, ra_rotulo,
  (senha_hash IS NOT NULL AND senha_hash <> '') AS possui_senha,
  (pin_autorizacao_hash IS NOT NULL) AS possui_pin_autorizacao,
  ultimo_login_em, criado_em, atualizado_em
FROM usuarios_ubt;

DROP VIEW IF EXISTS vw_credenciais_kpis;

CREATE VIEW vw_credenciais_kpis AS
SELECT
  (SELECT count(*)::int FROM usuarios_admin) AS internos_total,
  (SELECT count(*)::int FROM usuarios_admin WHERE status = 'ativo') AS internos_ativos,
  (SELECT count(*)::int FROM usuarios_prefeitura) AS prefeitura_total,
  (SELECT count(*)::int FROM usuarios_prefeitura WHERE status = 'ativo') AS prefeitura_ativos,
  (SELECT count(*)::int FROM usuarios_ubt) AS ubt_total,
  (SELECT count(*)::int FROM usuarios_ubt WHERE status = 'ativo') AS ubt_ativos,
  (
    (SELECT count(*)::int FROM usuarios_admin WHERE status = 'ativo')
    + (SELECT count(*)::int FROM usuarios_prefeitura WHERE status = 'ativo')
    + (SELECT count(*)::int FROM usuarios_ubt WHERE status = 'ativo')
  ) AS ativos_rede_total;

DROP TRIGGER IF EXISTS usuarios_portal_definir_atualizado_em ON usuarios_portal;
DROP TRIGGER IF EXISTS usuarios_portal_preencher_snapshot ON usuarios_portal;
DROP TABLE IF EXISTS usuarios_portal;

ALTER TABLE usuarios_prefeitura ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_ubt ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE usuarios_prefeitura FROM anon, authenticated;
REVOKE ALL ON TABLE usuarios_ubt FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE usuarios_prefeitura TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE usuarios_ubt TO service_role;

GRANT SELECT ON vw_credenciais_prefeitura_listagem TO service_role;
GRANT SELECT ON vw_credenciais_ubt_listagem TO service_role;
GRANT SELECT ON vw_credenciais_kpis TO service_role;

CREATE INDEX IF NOT EXISTS usuarios_prefeitura_entidade_status_nome_idx
  ON usuarios_prefeitura (entidade_contratante_id, status, nome);

CREATE TABLE IF NOT EXISTS sessoes_refresh_prefeitura (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios_prefeitura(id) ON DELETE CASCADE,
  hash_token TEXT NOT NULL,
  expira_em TIMESTAMPTZ NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  revogado_em TIMESTAMPTZ,
  substituido_por_id UUID REFERENCES sessoes_refresh_prefeitura(id) ON DELETE SET NULL,
  agente_usuario TEXT,
  endereco_ip INET
);

CREATE UNIQUE INDEX IF NOT EXISTS sessoes_refresh_prefeitura_hash_token_uidx
  ON sessoes_refresh_prefeitura (hash_token);

CREATE INDEX IF NOT EXISTS sessoes_refresh_prefeitura_usuario_ativo_idx
  ON sessoes_refresh_prefeitura (usuario_id, expira_em DESC)
  WHERE revogado_em IS NULL;

ALTER TABLE sessoes_refresh_prefeitura ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE sessoes_refresh_prefeitura FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE sessoes_refresh_prefeitura TO service_role;

CREATE OR REPLACE FUNCTION excluir_entidade_cliente(p_entidade_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM entidades_contratantes WHERE id = p_entidade_id) THEN
    RAISE EXCEPTION 'Entidade não encontrada.' USING ERRCODE = 'P0002';
  END IF;

  DELETE FROM usuarios_ubt
  WHERE entidade_contratante_id = p_entidade_id
     OR unidade_ubt_id IN (
       SELECT id FROM unidades_ubt WHERE entidade_contratante_id = p_entidade_id
     );

  DELETE FROM usuarios_prefeitura
  WHERE entidade_contratante_id = p_entidade_id;

  DELETE FROM contratos_entidade WHERE entidade_contratante_id = p_entidade_id;
  DELETE FROM unidades_ubt WHERE entidade_contratante_id = p_entidade_id;
  DELETE FROM entidades_contratantes WHERE id = p_entidade_id;
EXCEPTION
  WHEN foreign_key_violation THEN
    RAISE EXCEPTION
      'Não é possível excluir: existem registros operacionais vinculados a esta entidade (consultas, pacientes ou outros).'
      USING ERRCODE = '23503';
END;
$$;
