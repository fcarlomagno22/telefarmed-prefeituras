import { z } from 'zod'
import { parseRh3ScheduleHourToApi } from '../../lib/rh3/formatters.js'
import { isoDateSchema } from '../ubt-triagem/schemas.js'

export const rh3AvailabilityParamsSchema = z.object({
  rh3EspecialidadId: z.coerce.number().int().positive(),
})

export const rh3AvailabilityQuerySchema = z.object({
  date: isoDateSchema.optional(),
  date_from: isoDateSchema.optional(),
  language: z.string().trim().min(2).max(5).optional(),
})

export const rh3ScheduleAppointmentBodySchema = z.object({
  pacienteId: z.string().uuid(),
  especialidadeId: z.string().trim().min(1),
  rh3EspecialidadId: z.coerce.number().int().positive(),
  idTurno: z.coerce.number().int().positive(),
  data: isoDateSchema,
  hora: z
    .string()
    .trim()
    .transform(parseRh3ScheduleHourToApi)
    .pipe(z.string().regex(/^\d{2}:\d{2}$/)),
  professionalName: z.string().trim().min(2).optional(),
  specialtyName: z.string().trim().min(2).optional(),
  paciente: z.object({
    cpf: z.string().trim().min(11),
    fullName: z.string().trim().min(2),
    email: z.string().trim().email(),
    phone: z.string().trim().min(8),
    birthDate: z.string().trim().min(8),
    gender: z.string().trim().min(1),
  }),
})

export const rh3ImmediateConsultationBodySchema = z.object({
  pacienteId: z.string().uuid(),
  especialidadeId: z.string().trim().min(1),
  rh3EspecialidadId: z.coerce.number().int().positive(),
  specialtyName: z.string().trim().min(2),
  paciente: rh3ScheduleAppointmentBodySchema.shape.paciente,
})

export const rh3ElegibilidadParamsSchema = z.object({
  cpf: z
    .string()
    .trim()
    .transform((value) => value.replace(/\D/g, ''))
    .pipe(z.string().length(11, 'CPF inválido.')),
})
