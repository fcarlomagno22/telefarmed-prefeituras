-- Credenciais admin: permissões internas, entidades, UBTs e usuários de portal
-- Leituras otimizadas via colunas desnormalizadas + views de listagem

CREATE TYPE escopo_portal AS ENUM ('prefeitura', 'ubt');

-- Extensão do usuário admin interno
ALTER TABLE usuarios_admin
  ADD COLUMN IF NOT EXISTS funcao TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS permissoes_paginas JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN usuarios_admin.funcao IS 'Cargo/função exibida na gestão de credenciais';
COMMENT ON COLUMN usuarios_admin.permissoes_paginas IS 'Mapa pagina_id -> ações (visualizar, inserir, editar, excluir)';

CREATE INDEX IF NOT EXISTS usuarios_admin_departamento_status_idx
  ON usuarios_admin (departamento, status);

CREATE INDEX IF NOT EXISTS usuarios_admin_nivel_acesso_idx
  ON usuarios_admin (nivel_acesso);

-- Entidades contratantes (prefeituras / clientes)
CREATE TABLE entidades_contratantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social TEXT NOT NULL,
  municipio TEXT NOT NULL,
  uf CHAR(2) NOT NULL,
  status status_usuario_admin NOT NULL DEFAULT 'ativo',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT entidades_contratantes_uf_maiuscula CHECK (uf ~ '^[A-Z]{2}$')
);

CREATE INDEX entidades_contratantes_status_idx ON entidades_contratantes (status);
CREATE INDEX entidades_contratantes_municipio_idx ON entidades_contratantes (municipio);

-- Unidades UBT vinculadas à entidade
CREATE TABLE unidades_ubt (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entidade_contratante_id UUID NOT NULL REFERENCES entidades_contratantes(id) ON DELETE RESTRICT,
  nome TEXT NOT NULL,
  ra_chave TEXT NOT NULL,
  ra_rotulo TEXT NOT NULL,
  codigo_externo TEXT,
  status status_usuario_admin NOT NULL DEFAULT 'ativo',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX unidades_ubt_entidade_idx ON unidades_ubt (entidade_contratante_id);
CREATE INDEX unidades_ubt_status_idx ON unidades_ubt (status) WHERE status = 'ativo';
CREATE UNIQUE INDEX unidades_ubt_codigo_externo_uidx
  ON unidades_ubt (codigo_externo)
  WHERE codigo_externo IS NOT NULL;

-- Usuários dos portais prefeitura e UBT
CREATE TABLE usuarios_portal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpf CHAR(11) NOT NULL,
  nome TEXT NOT NULL,
  email CITEXT,
  funcao TEXT NOT NULL DEFAULT '',
  senha_hash TEXT NOT NULL,
  pin_autorizacao_hash TEXT,
  nivel_acesso nivel_acesso_admin NOT NULL DEFAULT 'operador',
  escopo_portal escopo_portal NOT NULL,
  status status_usuario_admin NOT NULL DEFAULT 'ativo',
  entidade_contratante_id UUID NOT NULL REFERENCES entidades_contratantes(id) ON DELETE RESTRICT,
  unidade_ubt_id UUID REFERENCES unidades_ubt(id) ON DELETE RESTRICT,
  eh_responsavel_ubt BOOLEAN NOT NULL DEFAULT false,
  permissoes_sistema JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Snapshot desnormalizado (evita JOINs na listagem)
  entidade_razao_social TEXT NOT NULL,
  municipio TEXT NOT NULL,
  uf CHAR(2) NOT NULL,
  unidade_ubt_nome TEXT,
  ra_chave TEXT,
  ra_rotulo TEXT,
  ultimo_login_em TIMESTAMPTZ,
  tentativas_login_falhas SMALLINT NOT NULL DEFAULT 0,
  bloqueado_ate TIMESTAMPTZ,
  senha_alterada_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT usuarios_portal_cpf_digitos CHECK (cpf ~ '^[0-9]{11}$'),
  CONSTRAINT usuarios_portal_tentativas_nao_negativas CHECK (tentativas_login_falhas >= 0),
  CONSTRAINT usuarios_portal_ubt_obrigatoria
    CHECK (escopo_portal <> 'ubt' OR unidade_ubt_id IS NOT NULL)
);

CREATE UNIQUE INDEX usuarios_portal_cpf_escopo_uidx ON usuarios_portal (cpf, escopo_portal);
CREATE UNIQUE INDEX usuarios_portal_email_uidx ON usuarios_portal (email) WHERE email IS NOT NULL;
CREATE INDEX usuarios_portal_escopo_status_idx ON usuarios_portal (escopo_portal, status);
CREATE INDEX usuarios_portal_entidade_idx ON usuarios_portal (entidade_contratante_id);
CREATE INDEX usuarios_portal_unidade_idx ON usuarios_portal (unidade_ubt_id) WHERE unidade_ubt_id IS NOT NULL;

CREATE UNIQUE INDEX usuarios_portal_responsavel_ubt_uidx
  ON usuarios_portal (unidade_ubt_id)
  WHERE eh_responsavel_ubt = true AND status = 'ativo' AND unidade_ubt_id IS NOT NULL;

-- Triggers: atualizado_em
CREATE TRIGGER entidades_contratantes_definir_atualizado_em
  BEFORE UPDATE ON entidades_contratantes
  FOR EACH ROW
  EXECUTE FUNCTION public.definir_atualizado_em();

CREATE TRIGGER unidades_ubt_definir_atualizado_em
  BEFORE UPDATE ON unidades_ubt
  FOR EACH ROW
  EXECUTE FUNCTION public.definir_atualizado_em();

CREATE TRIGGER usuarios_portal_definir_atualizado_em
  BEFORE UPDATE ON usuarios_portal
  FOR EACH ROW
  EXECUTE FUNCTION public.definir_atualizado_em();

-- Preenche snapshot do usuário portal a partir das FKs
CREATE OR REPLACE FUNCTION public.preencher_snapshot_usuario_portal()
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

  IF NEW.unidade_ubt_id IS NOT NULL THEN
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
  ELSE
    NEW.unidade_ubt_nome := NULL;
    NEW.ra_chave := NULL;
    NEW.ra_rotulo := NULL;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER usuarios_portal_preencher_snapshot
  BEFORE INSERT OR UPDATE OF entidade_contratante_id, unidade_ubt_id
  ON usuarios_portal
  FOR EACH ROW
  EXECUTE FUNCTION public.preencher_snapshot_usuario_portal();

-- Propaga alterações de nome da entidade para usuários (evita JOIN em leitura)
CREATE OR REPLACE FUNCTION public.propagar_entidade_para_usuarios_portal()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.razao_social IS DISTINCT FROM NEW.razao_social
     OR OLD.municipio IS DISTINCT FROM NEW.municipio
     OR OLD.uf IS DISTINCT FROM NEW.uf THEN
    UPDATE usuarios_portal
    SET
      entidade_razao_social = NEW.razao_social,
      municipio = NEW.municipio,
      uf = NEW.uf
    WHERE entidade_contratante_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER entidades_contratantes_propagar_usuarios_portal
  AFTER UPDATE ON entidades_contratantes
  FOR EACH ROW
  EXECUTE FUNCTION public.propagar_entidade_para_usuarios_portal();

CREATE OR REPLACE FUNCTION public.propagar_ubt_para_usuarios_portal()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.nome IS DISTINCT FROM NEW.nome
     OR OLD.ra_chave IS DISTINCT FROM NEW.ra_chave
     OR OLD.ra_rotulo IS DISTINCT FROM NEW.ra_rotulo THEN
    UPDATE usuarios_portal
    SET
      unidade_ubt_nome = NEW.nome,
      ra_chave = NEW.ra_chave,
      ra_rotulo = NEW.ra_rotulo
    WHERE unidade_ubt_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER unidades_ubt_propagar_usuarios_portal
  AFTER UPDATE ON unidades_ubt
  FOR EACH ROW
  EXECUTE FUNCTION public.propagar_ubt_para_usuarios_portal();

-- Impede exclusão do usuário master
CREATE OR REPLACE FUNCTION public.impedir_exclusao_usuario_master()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.eh_master THEN
    RAISE EXCEPTION 'O usuário master não pode ser excluído.';
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER usuarios_admin_impedir_exclusao_master
  BEFORE DELETE ON usuarios_admin
  FOR EACH ROW
  EXECUTE FUNCTION public.impedir_exclusao_usuario_master();

-- Views de listagem (sem JOIN)
CREATE OR REPLACE VIEW vw_credenciais_admin_listagem AS
SELECT
  id,
  cpf,
  nome,
  email,
  funcao,
  departamento,
  nivel_acesso,
  status,
  eh_master,
  permissoes_paginas,
  (senha_hash IS NOT NULL AND senha_hash <> '') AS possui_senha,
  (pin_autorizacao_hash IS NOT NULL) AS possui_pin_autorizacao,
  ultimo_login_em,
  criado_em,
  atualizado_em
FROM usuarios_admin;

CREATE OR REPLACE VIEW vw_credenciais_portal_listagem AS
SELECT
  id,
  cpf,
  nome,
  email,
  funcao,
  nivel_acesso,
  escopo_portal,
  status,
  entidade_contratante_id,
  unidade_ubt_id,
  eh_responsavel_ubt,
  permissoes_sistema,
  entidade_razao_social,
  municipio,
  uf,
  unidade_ubt_nome,
  ra_chave,
  ra_rotulo,
  (senha_hash IS NOT NULL AND senha_hash <> '') AS possui_senha,
  (pin_autorizacao_hash IS NOT NULL) AS possui_pin_autorizacao,
  ultimo_login_em,
  criado_em,
  atualizado_em
FROM usuarios_portal;

CREATE OR REPLACE VIEW vw_credenciais_kpis AS
SELECT
  (SELECT count(*)::int FROM usuarios_admin) AS internos_total,
  (SELECT count(*)::int FROM usuarios_admin WHERE status = 'ativo') AS internos_ativos,
  (SELECT count(*)::int FROM usuarios_portal WHERE escopo_portal = 'prefeitura') AS prefeitura_total,
  (SELECT count(*)::int FROM usuarios_portal WHERE escopo_portal = 'prefeitura' AND status = 'ativo') AS prefeitura_ativos,
  (SELECT count(*)::int FROM usuarios_portal WHERE escopo_portal = 'ubt') AS ubt_total,
  (SELECT count(*)::int FROM usuarios_portal WHERE escopo_portal = 'ubt' AND status = 'ativo') AS ubt_ativos,
  (
    (SELECT count(*)::int FROM usuarios_admin WHERE status = 'ativo')
    + (SELECT count(*)::int FROM usuarios_portal WHERE status = 'ativo')
  ) AS ativos_rede_total;

-- RLS: apenas service_role (backend)
ALTER TABLE entidades_contratantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE unidades_ubt ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_portal ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE entidades_contratantes FROM anon, authenticated;
REVOKE ALL ON TABLE unidades_ubt FROM anon, authenticated;
REVOKE ALL ON TABLE usuarios_portal FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE entidades_contratantes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE unidades_ubt TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE usuarios_portal TO service_role;

GRANT SELECT ON vw_credenciais_admin_listagem TO service_role;
GRANT SELECT ON vw_credenciais_portal_listagem TO service_role;
GRANT SELECT ON vw_credenciais_kpis TO service_role;
