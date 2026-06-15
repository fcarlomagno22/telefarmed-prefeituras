import { z } from 'zod'

const scopePrefeituraSchema = z.object({
  mode: z.enum(['all', 'selected']),
  prefeituraIds: z.array(z.string().uuid()).default([]),
  contratosPorPrefeitura: z.record(z.string().uuid(), z.string().uuid()).optional(),
})

const scopeUbtSchema = z.object({
  mode: z.enum(['all', 'selected', 'tele_only']),
  ubtIds: z.array(z.string().uuid()).default([]),
})

export const listShiftsQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(['rascunho', 'publicada', 'cancelada']).optional(),
  modalidade: z.enum(['tele', 'hibrido', 'presencial_ubt']).optional(),
  assignmentMode: z.enum(['assigned', 'open']).optional(),
  dataInicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inicial inválida.')
    .optional(),
  dataFim: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data final inválida.')
    .optional(),
  especialidadeId: z.string().trim().min(1).optional(),
  batchId: z.string().trim().min(1).optional(),
})

export const contratosBodySchema = z.object({
  prefeituraScope: scopePrefeituraSchema,
  specialtyIds: z.array(z.string().trim().min(1)).optional(),
})

import { escalaRepasseRuleSchema } from './repasseRule.js'

const repasseRuleBodySchema = escalaRepasseRuleSchema

const batchShiftSchema = z.object({
  id: z.string().uuid().optional(),
  specialtyId: z.string().trim().min(1, 'Informe a especialidade.'),
  specialty: z.string().trim().optional(),
  startAt: z.string().min(1),
  endAt: z.string().min(1),
  assignmentMode: z.enum(['assigned', 'open']),
  primaryDoctorId: z.string().uuid().optional(),
  backupDoctorIds: z.array(z.string().uuid()).default([]),
  modality: z.enum(['tele', 'hibrido', 'presencial_ubt']),
  vacancies: z.number().int().min(0).optional(),
  totalVacancies: z.number().int().min(0).optional(),
  amountCents: z.number().int().positive('Valor do plantão deve ser positivo.'),
  repasseRule: repasseRuleBodySchema,
  unitName: z.string().trim().optional(),
  city: z.string().trim().optional(),
  cityUf: z.string().trim().optional(),
  fullAddress: z.string().trim().nullable().optional(),
  notes: z.string().trim().optional(),
})

export const batchSaveBodySchema = z.object({
  batchId: z.string().trim().min(1, 'Informe o identificador do lote.'),
  replaceBatchId: z.string().trim().min(1).optional(),
  removeShiftIds: z.array(z.string().uuid()).optional(),
  status: z.enum(['rascunho', 'publicada']),
  titulo: z.string().trim().optional(),
  contratoEntidadeId: z.string().uuid().optional(),
  prefeituraScope: scopePrefeituraSchema,
  ubtScope: scopeUbtSchema,
  shifts: z.array(batchShiftSchema).min(1, 'Informe ao menos um plantão.'),
})

export const deleteShiftsBodySchema = z.object({
  shiftIds: z.array(z.string().uuid()).min(1, 'Informe ao menos um plantão.'),
})

export const conflictsBodySchema = z.object({
  doctorIds: z.array(z.string().uuid()).default([]),
  excludeBatchId: z.string().trim().min(1).optional(),
  shifts: z
    .array(
      z.object({
        id: z.string().optional(),
        batchId: z.string().optional(),
        startAt: z.string(),
        endAt: z.string(),
        status: z.string().optional(),
        primaryDoctorId: z.string().uuid().optional(),
        backupDoctorIds: z.array(z.string().uuid()).default([]),
      }),
    )
    .min(1),
})

export const listInscricoesQuerySchema = z.object({
  status: z.enum(['pendente', 'aceita', 'rejeitada', 'cancelada_profissional', 'cancelada_admin']).optional(),
  slotId: z.string().uuid().optional(),
})

export const rejectInscricaoBodySchema = z.object({
  motivoRejeicao: z.string().trim().min(3, 'Informe o motivo da rejeição.'),
})

export const cancelPlantaoBodySchema = z.object({
  motivoCancelamento: z.string().trim().min(3, 'Informe o motivo do cancelamento.'),
})

export const idParamSchema = z.object({
  id: z.string().uuid('ID inválido.'),
})

export type ListShiftsQuery = z.infer<typeof listShiftsQuerySchema>
export type ContratosBody = z.infer<typeof contratosBodySchema>
export type BatchSaveBody = z.infer<typeof batchSaveBodySchema>
export type DeleteShiftsBody = z.infer<typeof deleteShiftsBodySchema>
export type ConflictsBody = z.infer<typeof conflictsBodySchema>
export type ListInscricoesQuery = z.infer<typeof listInscricoesQuerySchema>
