import { z } from 'zod'

export const competenciaSchema = z.string().regex(/^\d{4}-\d{2}$/)

export const pendenciasQuerySchema = z.object({
  competencia: competenciaSchema,
  unitId: z.string().optional(),
  professionalName: z.string().optional(),
  specialty: z.string().optional(),
  category: z.string().optional(),
  gravidade: z.string().optional(),
  status: z.string().optional(),
  categoryTab: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
})

export const pendenciaIdParamSchema = z.object({
  id: z.string().min(1),
})

export const competenciaParamSchema = z.object({
  competencia: competenciaSchema,
})

export const ignoreBodySchema = z.object({
  justification: z.string().trim().min(10),
})

export const corrigirBodySchema = z.object({
  patientCns: z.string().optional(),
  patientMunicipality: z.string().optional(),
  patientMunicipalityIbge: z.string().optional(),
  professionalCbo: z.string().optional(),
  professionalCboLabel: z.string().optional(),
  professionalHasCnesVinculo: z.boolean().optional(),
  suggestedProcedure: z.string().optional(),
  consultaEncerrada: z.boolean().optional(),
  duplicidadeResolvida: z.boolean().optional(),
  clinicalCid: z.string().optional(),
})

export const fechamentosQuerySchema = z.object({
  competencia: competenciaSchema.optional(),
})

export const fechamentoRecordParamSchema = z.object({
  recordId: z.string().min(1),
})

export const loteItemParamSchema = z.object({
  itemId: z.string().uuid(),
})

export const excludeLoteBodySchema = z.object({
  reason: z.string().trim().min(1),
})

export const complementoBodySchema = z.object({
  competencia: competenciaSchema,
})

export const historicoQuerySchema = z.object({
  search: z.string().optional(),
})

export const sigtapSearchSchema = z.object({
  q: z.string().optional(),
  cbo: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export const bpaExportQuerySchema = z.object({
  format: z.enum(['excel', 'pdf']).default('excel'),
})
