import { z } from 'zod'
import {
  createPacienteBodyObjectSchema,
  refinePacienteRegistrationOnCreate,
  refinePacienteRegistrationOnUpdate,
  updatePacienteBodyObjectSchema,
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

export const lookupQuerySchema = z.object({
  cpf: z.string().trim().min(11),
  specialtyId: z.string().trim().optional(),
  specialtyName: z.string().trim().optional(),
})

function parseBooleanQuery(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined
  if (value === true || value === 'true' || value === '1') return true
  if (value === false || value === 'false' || value === '0') return false
  return undefined
}

export const listUbtPacientesQuerySchema = z.object({
  search: z.string().optional(),
  bairros: z.preprocess(parseStringArray, z.array(z.string().trim().min(1)).optional()),
  gender: z.enum(['all', 'feminino', 'masculino']).optional(),
  ageGroup: z.enum(['all', '0-17', '18-29', '30-59', '60+']).optional(),
  newUsers: z.enum(['all', 'this_month', '30d']).optional(),
  lastAppointment: z
    .enum(['all', 'today', '7d', '30d', '90d', 'inactive', 'never'])
    .optional(),
  totalAppointments: z.enum(['all', 'inactive', 'low', 'frequent']).optional(),
  incompleteData: z.preprocess(
    parseStringArray,
    z.array(z.enum(['no_phone', 'no_email', 'no_emergency_contact'])).optional(),
  ),
  inactiveConsultation: z.enum(['all', '6m', '12m', 'never']).optional(),
  dataQuality: z.enum(['all', 'complete', 'incomplete']).optional(),
  registrationUnits: z.preprocess(parseStringArray, z.array(z.string().trim().min(1)).optional()),
  recentActivityOnly: z.preprocess(parseBooleanQuery, z.boolean().optional()),
  sortBy: z
    .enum([
      'name_asc',
      'name_desc',
      'registered_asc',
      'registered_desc',
      'last_appointment_asc',
      'last_appointment_desc',
      'total_appointments_asc',
      'total_appointments_desc',
    ])
    .optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
})

export const createUbtPacienteBodySchema = createPacienteBodyObjectSchema
  .omit({
    entidadeContratanteId: true,
    unidadeUbtId: true,
    status: true,
  })
  .superRefine(refinePacienteRegistrationOnCreate)

export const updateUbtPacienteBodySchema = updatePacienteBodyObjectSchema
  .extend({
    completeRegistration: z.boolean().optional(),
  })
  .superRefine(refinePacienteRegistrationOnUpdate)

export const createAnotacaoBodySchema = z.object({
  text: z.string().trim().min(1).max(4000),
})

export const createRegistroContatoBodySchema = z.object({
  channel: z.enum(['whatsapp', 'sms', 'telefone', 'presencial', 'outro']),
  phone: z.string().trim().optional(),
  note: z.string().trim().min(1).max(2000),
})

export const uploadPacienteFotoBodySchema = z.object({
  photoDataUrl: z.string().trim().min(1, 'Envie a foto capturada.'),
})
