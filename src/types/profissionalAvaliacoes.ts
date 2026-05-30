export type ProfissionalPatientReview = {
  id: string
  rating: 1 | 2 | 3 | 4 | 5
  patientName: string
  patientPhotoUrl: string
  comment: string
  createdAtIso: string
  /** Texto relativo exibido como complemento (ex.: “Há 2 dias”). */
  createdAtLabel: string
}

export type ProfissionalAvaliacoesTab = 'todos' | 'criticos'

export type ProfissionalAvaliacoesFilters = {
  tab: ProfissionalAvaliacoesTab
  search: string
}
