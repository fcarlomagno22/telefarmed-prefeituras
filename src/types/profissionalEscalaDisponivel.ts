export type ProfissionalEscalaDisponivelStatus = 'disponivel' | 'reservado_mim'

export type ProfissionalEscalaModality = 'tele' | 'presencial'

export type ProfissionalEscalaTurn = 'manha' | 'tarde' | 'noite'

export type ProfissionalEscalaDisponivel = {
  id: string
  specialty: string
  startAt: string
  endAt: string
  turn: ProfissionalEscalaTurn
  turnLabel: string
  modality: ProfissionalEscalaModality
  modalityLabel: string
  unitName: string
  municipalityName: string
  /** Cidade exibida na tabela (presencial). */
  city: string
  cityUf: string
  /** Endereço completo da UBT — presencial; usado no tooltip. */
  fullAddress: string | null
  distanceKm: number | null
  amountCents: number
  vacancies: number
  status: ProfissionalEscalaDisponivelStatus
  notes?: string
}

export type ProfissionalEscalaFilters = {
  specialty: string
  dateFrom: string
  dateTo: string
  turn: 'all' | ProfissionalEscalaTurn
  modality: 'all' | ProfissionalEscalaModality
  minAmountReais: string
  maxAmountReais: string
}
