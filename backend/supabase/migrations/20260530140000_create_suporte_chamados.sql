-- Chamados de suporte multi-origem (UBT, prefeitura, profissional)
-- Admin consome via backend (service_role); portais criarão chamados em módulos futuros

CREATE TYPE status_chamado_suporte AS ENUM (
  'em_andamento',
  'aguardando_resposta',
  'respondido',
  'encerrado'
);

CREATE TYPE prioridade_chamado_suporte AS ENUM ('alta', 'media', 'baixa');

CREATE TYPE origem_chamado_suporte AS ENUM ('ubt', 'prefeitura', 'profissional');

CREATE TYPE autor_mensagem_chamado_suporte AS ENUM ('operator', 'support', 'system');

CREATE TYPE tipo_anexo_chamado_suporte AS ENUM ('pdf', 'image');

CREATE SEQUENCE chamados_suporte_numero_seq START WITH 5800 INCREMENT BY 1;

CREATE TABLE chamados_suporte (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_sequencial INTEGER NOT NULL DEFAULT nextval('chamados_suporte_numero_seq'),
  numero_exibicao TEXT GENERATED ALWAYS AS ('#CH-' || numero_sequencial::TEXT) STORED,
  assunto TEXT NOT NULL,
  categoria TEXT NOT NULL,
  status status_chamado_suporte NOT NULL DEFAULT 'aguardando_resposta',
  prioridade prioridade_chamado_suporte NOT NULL DEFAULT 'media',
  origem origem_chamado_suporte NOT NULL,
  entidade_contratante_id UUID REFERENCES entidades_contratantes(id) ON DELETE SET NULL,
  unidade_ubt_id UUID REFERENCES unidades_ubt(id) ON DELETE SET NULL,
  municipio_nome TEXT NOT NULL DEFAULT '',
  unidade_ubt_nome TEXT NOT NULL DEFAULT '',
  aberto_por_nome TEXT NOT NULL DEFAULT '',
  aberto_por_funcao TEXT NOT NULL DEFAULT '',
  profissional_referencia_id UUID,
  aberto_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  encerrado_em TIMESTAMPTZ,
  encerrado_por_admin_id UUID REFERENCES usuarios_admin(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chamados_suporte_assunto_nao_vazio CHECK (char_length(trim(assunto)) > 0),
  CONSTRAINT chamados_suporte_categoria_nao_vazia CHECK (char_length(trim(categoria)) > 0),
  CONSTRAINT chamados_suporte_numero_sequencial_unico UNIQUE (numero_sequencial)
);

CREATE INDEX chamados_suporte_status_idx ON chamados_suporte (status);
CREATE INDEX chamados_suporte_origem_idx ON chamados_suporte (origem);
CREATE INDEX chamados_suporte_prioridade_idx ON chamados_suporte (prioridade);
CREATE INDEX chamados_suporte_atualizado_em_idx ON chamados_suporte (atualizado_em DESC);
CREATE INDEX chamados_suporte_aberto_em_idx ON chamados_suporte (aberto_em DESC);
CREATE INDEX chamados_suporte_entidade_idx ON chamados_suporte (entidade_contratante_id);
CREATE INDEX chamados_suporte_ubt_idx ON chamados_suporte (unidade_ubt_id);
CREATE INDEX chamados_suporte_busca_idx ON chamados_suporte USING gin (
  to_tsvector(
    'portuguese',
    coalesce(numero_exibicao, '') || ' ' ||
    coalesce(assunto, '') || ' ' ||
    coalesce(categoria, '') || ' ' ||
    coalesce(municipio_nome, '') || ' ' ||
    coalesce(unidade_ubt_nome, '') || ' ' ||
    coalesce(aberto_por_nome, '')
  )
);

CREATE TABLE mensagens_chamado_suporte (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chamado_id UUID NOT NULL REFERENCES chamados_suporte(id) ON DELETE CASCADE,
  autor_tipo autor_mensagem_chamado_suporte NOT NULL,
  autor_nome TEXT NOT NULL,
  autor_admin_id UUID REFERENCES usuarios_admin(id) ON DELETE SET NULL,
  corpo TEXT NOT NULL DEFAULT '',
  enviado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  editado_em TIMESTAMPTZ,
  excluido BOOLEAN NOT NULL DEFAULT false,
  snapshot_exclusao JSONB,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT mensagens_chamado_autor_nome_nao_vazio CHECK (char_length(trim(autor_nome)) > 0)
);

CREATE INDEX mensagens_chamado_chamado_enviado_idx
  ON mensagens_chamado_suporte (chamado_id, enviado_em ASC);
CREATE INDEX mensagens_chamado_admin_idx
  ON mensagens_chamado_suporte (autor_admin_id)
  WHERE autor_tipo = 'support';

CREATE TABLE anexos_mensagem_chamado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chamado_id UUID NOT NULL REFERENCES chamados_suporte(id) ON DELETE CASCADE,
  mensagem_id UUID REFERENCES mensagens_chamado_suporte(id) ON DELETE CASCADE,
  nome_arquivo TEXT NOT NULL,
  tipo tipo_anexo_chamado_suporte NOT NULL,
  mime_type TEXT NOT NULL,
  tamanho_bytes INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT anexos_mensagem_tamanho_max CHECK (
    tamanho_bytes > 0 AND tamanho_bytes <= 10485760
  ),
  CONSTRAINT anexos_mensagem_storage_path_unico UNIQUE (storage_path)
);

CREATE INDEX anexos_mensagem_chamado_idx ON anexos_mensagem_chamado (chamado_id);
CREATE INDEX anexos_mensagem_mensagem_idx ON anexos_mensagem_chamado (mensagem_id);

CREATE TRIGGER chamados_suporte_definir_atualizado_em
  BEFORE UPDATE ON chamados_suporte
  FOR EACH ROW EXECUTE FUNCTION definir_atualizado_em();

CREATE TRIGGER mensagens_chamado_suporte_definir_atualizado_em
  BEFORE UPDATE ON mensagens_chamado_suporte
  FOR EACH ROW EXECUTE FUNCTION definir_atualizado_em();

-- View de listagem admin (sem mensagens — performance)
CREATE VIEW vw_chamados_suporte_listagem AS
SELECT
  c.id,
  c.numero_exibicao,
  c.assunto,
  c.categoria,
  c.status,
  c.prioridade,
  c.origem,
  c.municipio_nome,
  c.unidade_ubt_id,
  c.unidade_ubt_nome,
  c.aberto_por_nome,
  c.aberto_por_funcao,
  c.aberto_em,
  c.atualizado_em,
  c.encerrado_em
FROM chamados_suporte c;

-- Bucket privado para evidências (upload via service_role no backend)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'suporte-anexos',
  'suporte-anexos',
  false,
  10485760,
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp']::TEXT[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
