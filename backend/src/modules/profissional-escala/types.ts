import type { EscalaRepasseRule } from '../admin-escala/repasseRule.js'

export type ProfissionalEscalaModalityApi = 'tele' | 'presencial'

export type ProfissionalEscalaTurnApi = 'manha' | 'tarde' | 'noite'

export type ProfissionalEscalaDisponivelStatusApi = 'disponivel' | 'reservado_mim'

export type ProfissionalEscalaSlotDto = {
  id: string
  specialty: string
  startAt: string
  endAt: string
  turn: ProfissionalEscalaTurnApi
  turnLabel: string
  modality: ProfissionalEscalaModalityApi
  modalityLabel: string
  unitName: string | null
  municipalityName: string | null
  city: string | null
  cityUf: string | null
  fullAddress: string | null
  distanceKm: number | null
  amountCents: number
  vacancies: number
  repasseRule: EscalaRepasseRule
  status: ProfissionalEscalaDisponivelStatusApi
  notes: string | null
  inscricaoId?: string
  plantaoId?: string
}

export type ProfissionalPlantaoDto = ProfissionalEscalaSlotDto & {
  plantaoId: string
  plantaoStatus: string
  confirmadoEm: string
}

export type ProfissionalEscalaSummaryDto = {
  claimedThisMonth: number
  grossRevenueCents: number
  acceptanceRatePercent: number
  pendingInscriptions: number
}

export type ProfissionalEscalaContext = {
  profissionalId: string
  especialidadeId: string | null
  alocacao: 'nacional' | 'por_contrato'
  entidadeContratanteId: string | null
}

export type ProfissionalSlotDisponivelRow = {
  id: string
  data: string
  hora_inicio: string
  hora_fim: string
  inicio_em: string
  fim_em: string
  especialidade_id: string
  especialidade_nome: string
  modalidade: 'tele' | 'hibrido' | 'presencial_ubt'
  valor_centavos: number
  repasse_regra: unknown
  vagas: number
  vagas_disponiveis: number
  unidade_nome: string | null
  cidade: string | null
  cidade_uf: string | null
  endereco_completo: string | null
  notas: string | null
  escopo_prefeitura: unknown
  escopo_ubt: unknown
  publicado_em: string | null
}

export type ProfissionalPlantaoRow = {
  id: string
  slot_id: string
  status: string
  confirmado_em: string
  inscricao_id: string | null
}
