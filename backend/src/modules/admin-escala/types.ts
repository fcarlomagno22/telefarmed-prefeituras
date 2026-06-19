import type { EscalaRepasseRule } from './repasseRule.js'

export type EscalaScopePrefeitura = {
  mode: 'all' | 'selected'
  prefeituraIds: string[]
  contratosPorPrefeitura?: Record<string, string>
}

export type EscalaScopeUbt = {
  mode: 'all' | 'selected' | 'tele_only'
  ubtIds: string[]
}

export type SlotListagemRow = {
  id: string
  programacao_id: string | null
  programacao_titulo: string | null
  lote_id: string | null
  data: string
  hora_inicio: string
  hora_fim: string
  inicio_em: string
  fim_em: string
  especialidade_id: string
  especialidade_nome: string
  modalidade: 'tele' | 'hibrido' | 'presencial_ubt'
  modo_atribuicao: 'assigned' | 'open'
  vagas: number
  vagas_ocupadas: number
  vagas_disponiveis: number
  status_preenchimento: 'na' | 'aberto' | 'parcial' | 'lotado'
  valor_centavos: number
  repasse_regra: unknown
  status: 'rascunho' | 'publicada' | 'cancelada' | 'encerrada'
  profissional_titular_id: string | null
  profissional_titular_nome: string | null
  fila_reserva: unknown
  escopo_prefeitura: unknown
  escopo_ubt: unknown
  contrato_entidade_id: string | null
  contrato_entidade_ids: string[] | null
  unidade_nome: string
  cidade: string
  cidade_uf: string
  endereco_completo: string | null
  notas: string
  qtd_inscricoes: number
  qtd_inscricoes_pendentes: number
  publicado_em: string | null
  criado_em: string
  atualizado_em: string
}

export type ClaimCaptureRow = {
  slot_id: string
  profissional_id: string
  profissional_nome: string
  confirmado_em: string
}

export type AdminEscalaShiftDto = {
  id: string
  batchId?: string
  contratoEntidadeId?: string | null
  contratoEntidadeIds?: string[]
  assignmentMode: 'assigned' | 'open'
  primaryDoctorId: string
  backupDoctorIds: string[]
  specialtyId?: string
  specialty: string
  modality: 'tele' | 'hibrido' | 'presencial_ubt'
  startAt: string
  endAt: string
  turn: 'manha' | 'tarde' | 'noite'
  turnLabel: string
  prefeituraScope: EscalaScopePrefeitura
  ubtScope: EscalaScopeUbt
  status: 'rascunho' | 'publicada' | 'cancelada'
  vacancies: number
  totalVacancies: number
  amountCents: number
  repasseRule: EscalaRepasseRule
  unitName: string
  city: string
  cityUf: string
  fullAddress: string | null
  claimedCaptures: {
    doctorId: string
    doctorName: string
    claimedAt: string
  }[]
  notes: string
  createdAt: string
  updatedAt: string
  executionStatus: AdminEscalaExecutionStatus
  realizadoCount: number
  confirmadoCount: number
  totalPlantoes: number
}

export type AdminEscalaExecutionStatus =
  | 'na'
  | 'agendado'
  | 'em_andamento'
  | 'realizado'
  | 'parcial'
  | 'expirado'

export type AdminEscalaShiftExecutionSummaryDto = {
  executionStatus: AdminEscalaExecutionStatus
  realizadoCount: number
  confirmadoCount: number
  totalPlantoes: number
}

export type AdminEscalaPlantaoExecutionDto = {
  plantaoId: string
  profissionalId: string
  profissionalNome: string
  plantaoStatus: 'confirmado' | 'realizado' | 'cancelado' | 'falta_profissional'
  confirmadoEm: string
  enteredAt: string | null
  endedAt: string | null
  sessaoAtiva: boolean
  plantaoEncerrado: boolean
  consultasAgendadas: number
  encaixes: number
  atendidos: number
  naoCompareceu: number
  desistiu: number
  tempoMedioMin: number | null
  duracaoPlantaoMin: number | null
  percentualOnline: number | null
  encerramentoFormal: boolean
}

export type AdminEscalaShiftExecutionDetailDto = AdminEscalaShiftExecutionSummaryDto & {
  slotId: string
  scheduledStartAt: string
  scheduledEndAt: string
  plantoes: AdminEscalaPlantaoExecutionDto[]
}

export type EscalaSummaryDto = {
  publishedCount: number
  openVacancies: number
  claimedThisMonth: number
  fillRatePercent: number
  averageOpenAmountCents: number
  partialCount: number
  withoutBackupCount: number
  draftCount: number
  pendingInscriptions: number
}

export type EscalaCatalogDto = {
  doctors: { value: string; label: string; specialty: string }[]
  prefeituras: {
    id: string
    name: string
    municipio: string
    uf: string
    status: string
  }[]
  ubts: {
    id: string
    name: string
    municipalityId: string
    municipalityName: string
    region: string
    regionKey: string
    status: 'ativa' | 'manutencao' | 'inativa'
  }[]
  specialties: { id: string; name: string; active: boolean }[]
}

export type EscalaContratoOptionDto = {
  id: string
  entidadeContratanteId: string
  entidadeNome: string
  numero: string | null
  tipo: string
  tipoLabel: string
  status: string
  statusLabel: string
  dataAssinatura: string
  dataEncerramento: string | null
  especialidadesAutorizadas: string[]
  label: string
}

export type EscalaInscricaoDto = {
  id: string
  slotId: string
  profissionalId: string
  profissionalNome: string
  status: string
  inscritoEm: string
  respondidoEm?: string | null
  motivoRejeicao?: string | null
}

export type BatchSaveResultDto = {
  shifts: AdminEscalaShiftDto[]
  programacaoId: string
  batchId: string
}
