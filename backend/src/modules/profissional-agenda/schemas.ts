import { z } from 'zod'

const dateKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida. Use o formato AAAA-MM-DD.')

export const overviewQuerySchema = z.object({
  dateFrom: dateKeySchema,
  dateTo: dateKeySchema,
})

export const plantaoIdParamSchema = z.object({
  plantaoId: z.string().uuid('ID do plantão inválido.'),
})

export const consultaIdParamSchema = z.object({
  consultaId: z.string().uuid('ID da consulta inválido.'),
})

export const endShiftBodySchema = z.object({
  atendidos: z.number().int().min(0),
  naoCompareceu: z.number().int().min(0),
  desistiu: z.number().int().min(0),
  tempoMedioMin: z.number().int().min(0),
  duracaoPlantaoMin: z.number().int().min(0),
})

export type OverviewQuery = z.infer<typeof overviewQuerySchema>
export type EndShiftBody = z.infer<typeof endShiftBodySchema>
