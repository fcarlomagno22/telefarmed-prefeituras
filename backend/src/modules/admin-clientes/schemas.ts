import { z } from 'zod'

const pinSchema = z.string().regex(/^\d{6}$/, 'Senha de autorização inválida.')

const contactSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().optional(),
  phoneType: z.enum(['fixo', 'celular']).optional(),
})

const statusEntidadeSchema = z.enum([
  'ativa',
  'implantacao',
  'prospect',
  'suspensa',
  'sem_contrato',
])

const contratoTipoSchema = z.string().trim().min(1).max(64)

const precoProfissaoSchema = z.object({
  professionId: z.string().trim().min(1),
  valorConsulta: z.number().positive(),
})

const precoEspecialidadeSchema = z.object({
  specialtyId: z.string().trim().min(1),
  valorConsulta: z.number().positive(),
})

export const idParamSchema = z.object({
  id: z.string().uuid(),
})

export const contratoIdParamSchema = z.object({
  contratoId: z.string().uuid(),
})

export const listEntidadesQuerySchema = z.object({
  search: z.string().optional(),
  status: z.union([statusEntidadeSchema, z.literal('all')]).optional(),
  tab: z.enum(['clientes', 'implantacao', 'prospect']).optional(),
})

export const listClinicoQuerySchema = z.object({
  activeOnly: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((value) => value !== 'false'),
})

export const createEntidadeBodySchema = z.object({
  pin: pinSchema,
  nome: z.string().trim().min(1),
  subtitulo: z.string().trim().min(1),
  razaoSocial: z.string().trim().min(1),
  cnpj: z.string().trim().min(14),
  municipio: z.string().trim().min(1),
  uf: z.string().trim().length(2),
  status: statusEntidadeSchema,
  logoHue: z.number().int().min(0).max(359).optional(),
  logoDataUrl: z.string().trim().optional(),
  gestor: contactSchema,
  contatoContrato: contactSchema.optional(),
  contatoTi: contactSchema,
  contatoSaude: contactSchema,
})

export const updateEntidadeStatusBodySchema = z.object({
  pin: pinSchema,
  status: statusEntidadeSchema,
})

export const updateEntidadeContactsBodySchema = z.object({
  pin: pinSchema,
  gestor: contactSchema,
  contatoContrato: contactSchema.optional(),
  contatoTi: contactSchema,
  contatoSaude: contactSchema,
})

export const updateEntidadeBodySchema = z.object({
  pin: pinSchema,
  nome: z.string().trim().min(1),
  subtitulo: z.string().trim().min(1),
  razaoSocial: z.string().trim().min(1),
  cnpj: z.string().trim().min(14),
  municipio: z.string().trim().min(1),
  uf: z.string().trim().length(2),
  logoHue: z.number().int().min(0).max(359).optional(),
  logoDataUrl: z.string().trim().optional(),
})

export const deleteWithPinBodySchema = z.object({
  pin: pinSchema,
})

export const createContratoBodySchema = z.object({
  pin: pinSchema,
  numero: z.string().trim().optional(),
  tipo: contratoTipoSchema,
  dataAssinatura: z.string().trim().min(8),
  dataEncerramento: z.string().trim().nullable().optional(),
  consultasContratadas: z.number().int().nonnegative().nullable().optional(),
  permiteUltrapassar: z.boolean(),
  aceitaPacientesOutrosMunicipios: z.boolean().optional().default(false),
  precosPorProfissao: z.array(precoProfissaoSchema),
  precosPorEspecialidade: z.array(precoEspecialidadeSchema),
  excedentePrecosPorProfissao: z.array(precoProfissaoSchema).nullable().optional(),
  excedentePrecosPorEspecialidade: z.array(precoEspecialidadeSchema).nullable().optional(),
  especialidadesAutorizadas: z.array(z.string().trim().min(1)),
  contatoContrato: contactSchema.optional(),
})

export const updateContratoStatusBodySchema = z.object({
  pin: pinSchema,
  action: z.enum(['suspender', 'reativar', 'encerrar']),
})

export const updateContratoBodySchema = createContratoBodySchema.omit({ contatoContrato: true })

export const entidadeUbtParamsSchema = z.object({
  id: z.string().uuid('ID da entidade inválido.'),
  ubtId: z.string().uuid('ID da UBT inválido.'),
})

export type CreateEntidadeBody = z.infer<typeof createEntidadeBodySchema>
export type UpdateEntidadeBody = z.infer<typeof updateEntidadeBodySchema>
export type CreateContratoBody = z.infer<typeof createContratoBodySchema>
export type UpdateContratoBody = z.infer<typeof updateContratoBodySchema>
export type ListEntidadesQuery = z.infer<typeof listEntidadesQuerySchema>
