import { z } from 'zod'

export const plantaoAceiteTokenParamSchema = z
  .string()
  .trim()
  .min(16, 'Token inválido.')
  .max(128, 'Token inválido.')

export const confirmarPlantaoAceiteBodySchema = z.object({
  token: plantaoAceiteTokenParamSchema,
  cpf: z
    .string()
    .trim()
    .min(11, 'Informe um CPF válido.')
    .max(14, 'CPF inválido.'),
})

export const candidatarReservaPlantaoAceiteBodySchema = confirmarPlantaoAceiteBodySchema

export const plantaoAceiteIcsQuerySchema = z.object({
  plantaoId: z.string().trim().uuid('Plantão inválido.'),
})
