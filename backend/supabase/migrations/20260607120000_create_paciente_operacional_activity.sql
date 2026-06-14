-- Anotações e registros de contato operacional (drawer UBT / consultas / usuários)

CREATE TABLE paciente_anotacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  entidade_contratante_id UUID NOT NULL REFERENCES entidades_contratantes(id) ON DELETE RESTRICT,
  unidade_ubt_id UUID NOT NULL REFERENCES unidades_ubt(id) ON DELETE RESTRICT,
  texto TEXT NOT NULL,
  autor_usuario_ubt_id UUID REFERENCES usuarios_ubt(id) ON DELETE SET NULL,
  autor_nome TEXT NOT NULL DEFAULT '',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT paciente_anotacoes_texto_nao_vazio CHECK (char_length(trim(texto)) > 0)
);

CREATE INDEX paciente_anotacoes_paciente_idx ON paciente_anotacoes (paciente_id, criado_em DESC);
CREATE INDEX paciente_anotacoes_entidade_idx ON paciente_anotacoes (entidade_contratante_id, criado_em DESC);

CREATE TABLE paciente_registros_contato (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  entidade_contratante_id UUID NOT NULL REFERENCES entidades_contratantes(id) ON DELETE RESTRICT,
  unidade_ubt_id UUID NOT NULL REFERENCES unidades_ubt(id) ON DELETE RESTRICT,
  canal TEXT NOT NULL,
  telefone TEXT NOT NULL DEFAULT '',
  nota TEXT NOT NULL DEFAULT '',
  autor_usuario_ubt_id UUID REFERENCES usuarios_ubt(id) ON DELETE SET NULL,
  autor_nome TEXT NOT NULL DEFAULT '',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT paciente_registros_contato_canal_valido CHECK (
    canal IN ('whatsapp', 'sms', 'telefone', 'presencial', 'outro')
  ),
  CONSTRAINT paciente_registros_contato_nota_nao_vazia CHECK (char_length(trim(nota)) > 0)
);

CREATE INDEX paciente_registros_contato_paciente_idx
  ON paciente_registros_contato (paciente_id, criado_em DESC);

ALTER TABLE paciente_anotacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE paciente_registros_contato ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE paciente_anotacoes FROM anon, authenticated;
REVOKE ALL ON TABLE paciente_registros_contato FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE paciente_anotacoes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE paciente_registros_contato TO service_role;
