export type ConsultaAccessRow = {
  id: string
  codigoAtendimento: string
  profissionalId: string | null
  pacienteId: string
  agendaConsultaId: string | null
  status: string
  iniciadaEm: string | null
  finalizadaEm: string | null
}

export type ConsultaOperacionalFullRow = {
  id: string
  codigo_atendimento: string
  paciente_id: string
  profissional_id: string | null
  especialidade_id: string
  status: string
  triagem_resumo: string
  notas_clinicas: string
  iniciada_em: string | null
  finalizada_em: string | null
  duracao_minutos: number | null
  criado_em: string
  paciente_nome: string
  paciente_cpf: string
  paciente_sexo: string
  paciente_data_nascimento: string | null
  paciente_endereco: Record<string, unknown> | null
  paciente_foto_url: string | null
  profissional_nome: string | null
  profissional_conselho_sigla: string | null
  profissional_conselho_numero: string | null
  profissional_conselho_uf: string | null
  especialidade_nome: string
  unidade_nome: string
}

export type ConsultaMensagemRow = {
  id: string
  remetente_tipo: string
  conteudo: string
  anexo_url: string
  anexo_nome: string
  anexo_storage_path?: string
  enviada_em: string
}

export type ConsultaAnexoRow = {
  id: string
  tipo: string
  titulo: string
  arquivo_nome: string
  arquivo_url: string
  storage_path: string
  origem: string
  criado_em: string
  codigo_verificacao?: string
  metadata?: Record<string, unknown> | null
}

export type ConsultaPrescricaoRow = {
  id: string
  medicamento_nome: string
  dosagem: string
  via: string
  frequencia: string
  duracao: string
  observacoes: string
  criado_em: string
}

export type ConsultaSolicitacaoExameRow = {
  id: string
  exame_id: string
  observacoes: string
  criado_em: string
}

export type HistoricoProntuarioRow = {
  id: string
  finalizada_em: string | null
  notas_clinicas: string
  profissional_nome: string | null
  especialidade_nome: string
}
