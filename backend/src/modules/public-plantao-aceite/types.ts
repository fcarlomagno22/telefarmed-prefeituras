import type { EscalaRepasseRule } from '../admin-escala/repasseRule.js'

export type PlantaoAceitePublicoStatus =
  | 'disponivel'
  | 'vagas_esgotadas'
  | 'indisponivel'
  | 'expirado'

export type PlantaoAceitePublicoDto = {
  slotId: string
  specialty: string
  startAt: string
  endAt: string
  turnLabel: string
  modality: 'tele' | 'presencial'
  modalityLabel: string
  unitName: string | null
  city: string | null
  cityUf: string | null
  fullAddress: string | null
  vacancies: number
  amountCents: number
  repasseRule: EscalaRepasseRule
  notes: string | null
  publishedAt: string
  publishedAtLabel: string
  prazoAceiteLabel: string | null
  status: PlantaoAceitePublicoStatus
  canApplyAsReserve: boolean
  reserveQueueCount: number
}

export type PlantaoAceitePublicoResultDto = {
  plantao: PlantaoAceitePublicoDto
}

export type PlantaoAceiteDigestResultDto = {
  totalVagas: number
  plantoes: PlantaoAceitePublicoDto[]
}

export type ConfirmarPlantaoAceiteResultDto = {
  plantaoId: string
  profissionalNome: string
  agendaUrl: string
}

export type CandidatarReservaPlantaoAceiteResultDto = {
  profissionalNome: string
  reservePosition: number
  agendaUrl: string
}
