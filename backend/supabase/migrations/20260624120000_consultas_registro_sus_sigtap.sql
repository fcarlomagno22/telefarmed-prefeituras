-- Registro SUS por consulta concluída + catálogo SIGTAP local + CBO do profissional.

ALTER TABLE usuarios_profissionais
  ADD COLUMN IF NOT EXISTS cbo_codigo CHAR(6),
  ADD COLUMN IF NOT EXISTS cbo_descricao TEXT;

COMMENT ON COLUMN usuarios_profissionais.cbo_codigo IS
  'CBO (ocupação SIGTAP) do profissional executante.';
COMMENT ON COLUMN usuarios_profissionais.cbo_descricao IS
  'Descrição da ocupação CBO vinculada ao profissional.';

CREATE TABLE IF NOT EXISTS config_sigtap_meta (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  competencia CHAR(6) NOT NULL,
  importada_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE config_sigtap_meta IS
  'Competência SIGTAP ativa importada no banco (uma por vez).';

CREATE TABLE IF NOT EXISTS config_sigtap_procedimento (
  codigo CHAR(10) PRIMARY KEY,
  nome TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS config_sigtap_ocupacao (
  codigo CHAR(6) PRIMARY KEY,
  nome TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS config_sigtap_procedimento_ocupacao (
  procedimento_codigo CHAR(10) NOT NULL REFERENCES config_sigtap_procedimento(codigo) ON DELETE CASCADE,
  ocupacao_codigo CHAR(6) NOT NULL REFERENCES config_sigtap_ocupacao(codigo) ON DELETE CASCADE,
  PRIMARY KEY (procedimento_codigo, ocupacao_codigo)
);

CREATE INDEX IF NOT EXISTS config_sigtap_proc_ocup_ocupacao_idx
  ON config_sigtap_procedimento_ocupacao (ocupacao_codigo);

CREATE TABLE IF NOT EXISTS config_sigtap_especialidade_procedimento (
  especialidade_id TEXT PRIMARY KEY REFERENCES config_especialidades(id) ON DELETE CASCADE,
  procedimento_codigo CHAR(10) NOT NULL REFERENCES config_sigtap_procedimento(codigo) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS config_sigtap_formacao_cbo (
  formacao formacao_candidatura_profissional PRIMARY KEY,
  ocupacao_codigo CHAR(6) NOT NULL REFERENCES config_sigtap_ocupacao(codigo) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS consultas_registro_sus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consulta_id UUID NOT NULL UNIQUE REFERENCES consultas(id) ON DELETE CASCADE,
  entidade_contratante_id UUID NOT NULL REFERENCES entidades_contratantes(id) ON DELETE RESTRICT,
  paciente_nome TEXT NOT NULL,
  paciente_cpf CHAR(11),
  paciente_cns TEXT,
  paciente_documento_exibicao TEXT NOT NULL,
  profissional_nome TEXT NOT NULL,
  profissional_conselho TEXT NOT NULL DEFAULT '',
  profissional_cbo_codigo CHAR(6),
  profissional_cbo_descricao TEXT,
  procedimento_codigo CHAR(10),
  procedimento_nome TEXT,
  unidade_cnes TEXT NOT NULL DEFAULT '',
  realizado_em TIMESTAMPTZ NOT NULL,
  sigtap_competencia CHAR(6),
  faturavel BOOLEAN NOT NULL DEFAULT false,
  pendencias JSONB NOT NULL DEFAULT '[]'::jsonb,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS consultas_registro_sus_entidade_realizado_idx
  ON consultas_registro_sus (entidade_contratante_id, realizado_em DESC);

CREATE INDEX IF NOT EXISTS consultas_registro_sus_faturavel_idx
  ON consultas_registro_sus (entidade_contratante_id, faturavel, realizado_em DESC);

CREATE TRIGGER consultas_registro_sus_atualizado_em
  BEFORE UPDATE ON consultas_registro_sus
  FOR EACH ROW
  EXECUTE FUNCTION definir_atualizado_em();

COMMENT ON TABLE consultas_registro_sus IS
  'Snapshot imutável dos dados exigidos para faturamento SUS por consulta concluída.';

DROP VIEW IF EXISTS vw_consultas_operacional;

CREATE VIEW vw_consultas_operacional AS
SELECT
  c.id,
  c.codigo_atendimento,
  c.entidade_contratante_id,
  c.unidade_ubt_id,
  c.paciente_id,
  c.profissional_id,
  c.especialidade_id,
  c.agenda_consulta_id,
  c.fila_espera_id,
  c.tipo,
  c.status,
  c.triagem_resumo,
  c.notas_clinicas,
  c.iniciada_em,
  c.finalizada_em,
  c.duracao_minutos,
  c.cancelada_em,
  c.criado_em,
  c.atualizado_em,
  p.nome AS paciente_nome,
  p.cpf AS paciente_cpf,
  p.cns AS paciente_cns,
  p.cns_pendente AS paciente_cns_pendente,
  p.sexo AS paciente_sexo,
  p.data_nascimento AS paciente_data_nascimento,
  p.endereco AS paciente_endereco,
  p.foto_url AS paciente_foto_url,
  pr.nome AS profissional_nome,
  pr.especialidade AS profissional_especialidade_texto,
  e.nome AS especialidade_nome,
  ub.nome AS unidade_nome,
  ub.cnes AS unidade_cnes,
  ub.ra_chave AS unidade_regiao_chave,
  ub.ra_rotulo AS unidade_regiao_rotulo,
  c.sala_espera_entrada_em,
  c.paciente_sala_atendimento_entrada_em,
  c.contabilizada_em,
  COALESCE(
    NULLIF(trim(p.endereco ->> 'bairro'), ''),
    NULLIF(trim(p.endereco ->> 'neighborhood'), ''),
    '—'
  ) AS paciente_bairro,
  pr.conselho_sigla AS profissional_conselho_sigla,
  pr.conselho_numero AS profissional_conselho_numero,
  pr.conselho_uf AS profissional_conselho_uf,
  pr.cbo_codigo AS profissional_cbo_codigo,
  pr.cbo_descricao AS profissional_cbo_descricao,
  rs.paciente_documento_exibicao AS registro_sus_paciente_documento,
  rs.profissional_conselho AS registro_sus_profissional_conselho,
  rs.profissional_cbo_descricao AS registro_sus_cbo,
  rs.procedimento_codigo AS registro_sus_procedimento_codigo,
  rs.procedimento_nome AS registro_sus_procedimento_nome,
  rs.unidade_cnes AS registro_sus_unidade_cnes,
  rs.realizado_em AS registro_sus_realizado_em,
  rs.faturavel AS registro_sus_faturavel,
  rs.pendencias AS registro_sus_pendencias
FROM consultas c
INNER JOIN pacientes p ON p.id = c.paciente_id
INNER JOIN config_especialidades e ON e.id = c.especialidade_id
INNER JOIN unidades_ubt ub ON ub.id = c.unidade_ubt_id
LEFT JOIN usuarios_profissionais pr ON pr.id = c.profissional_id
LEFT JOIN consultas_registro_sus rs ON rs.consulta_id = c.id;

COMMENT ON VIEW vw_consultas_operacional IS
  'Consultas clínicas com dados operacionais e registro SUS (quando concluída).';

REVOKE ALL ON vw_consultas_operacional FROM anon, authenticated;
GRANT SELECT ON vw_consultas_operacional TO service_role;

REVOKE ALL ON config_sigtap_meta FROM anon, authenticated;
REVOKE ALL ON config_sigtap_procedimento FROM anon, authenticated;
REVOKE ALL ON config_sigtap_ocupacao FROM anon, authenticated;
REVOKE ALL ON config_sigtap_procedimento_ocupacao FROM anon, authenticated;
REVOKE ALL ON config_sigtap_especialidade_procedimento FROM anon, authenticated;
REVOKE ALL ON config_sigtap_formacao_cbo FROM anon, authenticated;
REVOKE ALL ON consultas_registro_sus FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON config_sigtap_meta TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON config_sigtap_procedimento TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON config_sigtap_ocupacao TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON config_sigtap_procedimento_ocupacao TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON config_sigtap_especialidade_procedimento TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON config_sigtap_formacao_cbo TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON consultas_registro_sus TO service_role;
