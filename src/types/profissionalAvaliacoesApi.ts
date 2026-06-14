export type ProfissionalAvaliacoesApiSummary = {
  averageRating: number
  totalReviews: number
  criticalCount: number
  positiveCount: number
  positivePercent: number
  withCommentCount: number
  withCommentPercent: number
  fiveStarCount: number
  fourStarCount: number
  starBars: Array<{ stars: 1 | 2 | 3 | 4 | 5; count: number; percent: number }>
  weeklyTrend: Array<{ label: string; count: number; averageRating: number }>
  monthlyCounts: Array<{ label: string; count: number }>
}

export type ProfissionalAvaliacoesApiReview = {
  id: string
  rating: 1 | 2 | 3 | 4 | 5
  patientName: string
  patientPhotoUrl: string
  comment: string
  createdAtIso: string
  createdAtLabel: string
  consultaRef: string
}

export type ProfissionalAvaliacoesListQuery = {
  periodFrom?: string
  periodTo?: string
  notaMinima?: number
  criticos?: boolean
  search?: string
  limit?: number
  offset?: number
}

export type ProfissionalAvaliacoesListResponse = {
  reviews: ProfissionalAvaliacoesApiReview[]
  total: number
  limit: number
  offset: number
}
