import { z } from 'zod'

const accessLevelSchema = z.enum(['administrador', 'operador', 'editor', 'visualizador'])
const statusSchema = z.enum(['ativo', 'inativo'])
const departmentSchema = z.enum([
  'operacoes',
  'comercial',
  'financeiro',
  'suporte',
  'ti',
  'diretoria',
])
const portalScopeSchema = z.enum(['Prefeitura', 'UBT'])

export const listInternosQuerySchema = z.object({
  search: z.string().optional(),
  departmentId: departmentSchema.optional(),
  status: statusSchema.optional(),
  accessLevel: accessLevelSchema.optional(),
})

export const createInternoBodySchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  cpf: z.string().trim().min(11),
  role: z.string().trim().min(1),
  departmentId: departmentSchema,
  accessLevel: accessLevelSchema,
  status: statusSchema.default('ativo'),
  pagePermissions: z.record(z.string(), z.array(z.string())).optional(),
  password: z.string().min(6),
  authorizationPin: z
    .string()
    .regex(/^\d{6}$/)
    .optional(),
})

export const updateInternoBodySchema = z.object({
  name: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  cpf: z.string().trim().min(11).optional(),
  role: z.string().trim().min(1).optional(),
  departmentId: departmentSchema.optional(),
  accessLevel: accessLevelSchema.optional(),
  status: statusSchema.optional(),
  pagePermissions: z.record(z.string(), z.array(z.string())).optional(),
  password: z.string().min(6).optional(),
  authorizationPin: z
    .string()
    .regex(/^\d{6}$/)
    .nullable()
    .optional(),
})

export const listPortalQuerySchema = z.object({
  scope: portalScopeSchema,
  search: z.string().optional(),
  profile: z.string().optional(),
  ubtId: z.string().uuid().optional(),
  contractingEntityId: z.string().uuid().optional(),
  status: statusSchema.optional(),
})

export const createPortalBodySchema = z.object({
  scope: portalScopeSchema,
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  cpf: z.string().trim().min(11).optional(),
  role: z.string().trim().min(1),
  accessLevel: accessLevelSchema,
  status: statusSchema.default('ativo'),
  contractingEntityId: z.string().uuid(),
  ubtId: z.string().uuid().optional(),
  isUbtResponsible: z.boolean().optional(),
  pagePermissions: z.record(z.string(), z.array(z.string())).optional(),
  password: z.string().min(6),
  authorizationPin: z
    .string()
    .regex(/^\d{6}$/)
    .optional(),
})

export const updatePortalBodySchema = z.object({
  name: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  role: z.string().trim().min(1).optional(),
  accessLevel: accessLevelSchema.optional(),
  status: statusSchema.optional(),
  contractingEntityId: z.string().uuid().optional(),
  ubtId: z.string().uuid().optional(),
  isUbtResponsible: z.boolean().optional(),
  pagePermissions: z.record(z.string(), z.array(z.string())).optional(),
  password: z.string().min(6).optional(),
  authorizationPin: z
    .string()
    .regex(/^\d{6}$/)
    .nullable()
    .optional(),
})

export const transferPortalUbtBodySchema = z.object({
  targetUbtId: z.string().uuid(),
})

export const verifyPortalPinBodySchema = z.object({
  userId: z.string().uuid(),
  pin: z.string().regex(/^\d{6}$/),
})

export const idParamSchema = z.object({
  id: z.string().uuid(),
})
