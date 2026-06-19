import type { EscalaRepasseRule } from './adminEscala'

export type PlantaoAceitePublicoStatus =
  | 'disponivel'
  | 'vagas_esgotadas'
  | 'indisponivel'
  | 'expirado'

export type PlantaoAceitePublico = {
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

export type PlantaoAceitePublicoResult = {
  plantao: PlantaoAceitePublico
  profissionalNome?: string
}

export type PlantaoAceiteDigestResult = {
  totalVagas: number
  plantoes: PlantaoAceitePublico[]
}

export type PlantaoAceiteConfirmPayload = {
  token: string
  slotId?: string
  cpf: string
}

export type PlantaoAceiteConfirmResult = {
  plantaoId: string
  profissionalNome: string
  agendaUrl: string
}

export type PlantaoAceiteReserveResult = {
  profissionalNome: string
  reservePosition: number
  agendaUrl: string
}
