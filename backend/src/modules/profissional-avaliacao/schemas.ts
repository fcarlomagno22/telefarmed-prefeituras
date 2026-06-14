import { z } from 'zod'

export const listAvaliacoesQuerySchema = z.object({
  criticos: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .optional()
    .transform((value) => value === true || value === 'true'),
  search: z.string().trim().max(120).optional(),
  periodFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inicial inválida.')
    .optional(),
  periodTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data final inválida.')
    .optional(),
  notaMinima: z.coerce.number().int().min(1).max(5).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
  offset: z.coerce.number().int().min(0).default(0),
})

export type ListAvaliacoesQuery = z.infer<typeof listAvaliacoesQuerySchema>

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

export type ProfissionalAvaliacoesListApi = {
  reviews: ProfissionalAvaliacoesApiReview[]
  total: number
  limit: number
  offset: number
}
