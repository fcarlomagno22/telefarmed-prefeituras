import { z } from 'zod'
import {
  createPacienteBodySchema,
  updatePacienteBodySchema,
} from '../admin-pacientes/schemas.js'

function parseStringArray(value: unknown): string[] | undefined {
  if (value === undefined || value === null || value === '') return undefined
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean)
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return undefined
}

export const idParamSchema = z.object({
  id: z.string().uuid(),
})

export const listPrefeituraPacientesQuerySchema = z.object({
  search: z.string().optional(),
  cpf: z.string().optional(),
  nome: z.string().optional(),
  unidadeUbtId: z.string().uuid().optional(),
  unidadeUbtIds: z.preprocess(parseStringArray, z.array(z.string().uuid()).optional()),
  status: z.enum(['ativo', 'inativo', 'pre_cadastro', 'suspenso', 'all']).optional(),
  bairros: z.preprocess(parseStringArray, z.array(z.string().trim().min(1)).optional()),
  inactiveConsultation: z.enum(['all', '6m', '12m', 'never']).optional(),
  dataQuality: z.enum(['all', 'complete', 'incomplete']).optional(),
  sortBy: z
    .enum(['name_asc', 'name_desc', 'registered_desc', 'registered_asc'])
    .optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
})

export const createPrefeituraPacienteBodySchema = createPacienteBodySchema.omit({
  entidadeContratanteId: true,
})

export const updatePrefeituraPacienteBodySchema = updatePacienteBodySchema.extend({
  unidadeUbtId: z.string().uuid().optional(),
})

export const createAnotacaoBodySchema = z.object({
  text: z.string().trim().min(1).max(4000),
})

export const createRegistroContatoBodySchema = z.object({
  channel: z.enum(['whatsapp', 'sms', 'telefone', 'presencial', 'outro']),
  phone: z.string().trim().optional(),
  note: z.string().trim().min(1).max(2000),
})

export type ListPrefeituraPacientesQueryInput = z.infer<typeof listPrefeituraPacientesQuerySchema>
export type CreatePrefeituraPacienteBody = z.infer<typeof createPrefeituraPacienteBodySchema>
export type UpdatePrefeituraPacienteBody = z.infer<typeof updatePrefeituraPacienteBodySchema>
