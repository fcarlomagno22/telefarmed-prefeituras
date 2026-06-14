import { z } from 'zod'

const accessLevelSchema = z.enum(['administrador', 'operador', 'editor', 'visualizador'])
const statusSchema = z.enum(['ativo', 'inativo'])
const acaoFilterSchema = z.enum([
  'login_sucesso',
  'login_falha',
  'logout',
  'refresh',
  'sessao_revogada',
])

function isValidCpfDigits(value: string): boolean {
  return value.replace(/\D/g, '').length === 11
}

export const idParamSchema = z.object({
  id: z.string().uuid(),
})

export const listOperadoresQuerySchema = z.object({
  search: z.string().optional(),
  profile: z.string().optional(),
  status: statusSchema.optional(),
})

export const createOperadorBodySchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  cpf: z.string().trim().refine(isValidCpfDigits, 'Informe um CPF válido com 11 dígitos.'),
  role: z.string().trim().min(1),
  accessLevel: accessLevelSchema,
  status: statusSchema.default('ativo'),
  isUbtResponsible: z.boolean().optional(),
  pagePermissions: z.record(z.string(), z.array(z.string())).optional(),
  password: z.string().trim().min(6),
  authorizationPin: z
    .string()
    .regex(/^\d{6}$/)
    .optional(),
})

export const updateOperadorBodySchema = z.object({
  name: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  cpf: z
    .string()
    .trim()
    .refine(isValidCpfDigits, 'Informe um CPF válido com 11 dígitos.')
    .optional(),
  role: z.string().trim().min(1).optional(),
  accessLevel: accessLevelSchema.optional(),
  status: statusSchema.optional(),
  isUbtResponsible: z.boolean().optional(),
  pagePermissions: z.record(z.string(), z.array(z.string())).optional(),
  password: z.string().trim().min(6).optional(),
  authorizationPin: z
    .string()
    .regex(/^\d{6}$/)
    .nullable()
    .optional(),
})

export const accessLogsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  search: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  atorId: z.string().uuid().optional(),
  acao: acaoFilterSchema.optional(),
})
