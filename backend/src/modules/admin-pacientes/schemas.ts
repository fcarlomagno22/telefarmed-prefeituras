import { z } from 'zod'

const contactSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  phone: z.string(),
  relationship: z.string().optional(),
})

const preCadastroBodySchema = z.object({
  entidadeContratanteId: z.string().uuid(),
  unidadeUbtId: z.string().uuid().optional(),
  fullName: z.string().trim().min(1),
  socialName: z.string().trim().optional(),
  cpf: z.string().trim().min(11),
  birthDate: z.string().trim().min(8),
  gender: z.string().trim().min(1),
  phone: z.string().trim().optional(),
  email: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || z.string().email().safeParse(value).success, {
      message: 'E-mail inválido.',
    }),
  guardianName: z.string().trim().optional(),
  guardianCpf: z.string().trim().optional(),
  contacts: z.array(contactSchema).optional(),
  zipCode: z.string().trim().optional(),
  street: z.string().trim().optional(),
  number: z.string().trim().optional(),
  complement: z.string().trim().optional(),
  neighborhood: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  photoDataUrl: z.string().trim().optional(),
  concluirImmediately: z.boolean().optional(),
})

export const idParamSchema = z.object({
  id: z.string().uuid(),
})

export const prontuarioBodySchema = z.object({
  pin: z.string().regex(/^\d{6}$/, 'Senha de autorização inválida.'),
})

export const listPacientesQuerySchema = z.object({
  search: z.string().optional(),
  cpf: z.string().optional(),
  municipio: z.string().optional(),
  status: z
    .enum(['ativo', 'inativo', 'pre_cadastro', 'suspenso', 'all'])
    .optional(),
  contractStatus: z.enum(['ativo', 'encerrado', 'all']).optional(),
  entidadeContratanteId: z.string().uuid().optional(),
})

export const byCpfQuerySchema = z.object({
  cpf: z.string().trim().min(11),
  entidadeContratanteId: z.string().uuid().optional(),
})

export const createPacienteBodySchema = preCadastroBodySchema.extend({
  status: z.enum(['ativo', 'inativo', 'pre_cadastro', 'suspenso']).optional(),
})

export const updatePacienteBodySchema = z.object({
  fullName: z.string().trim().min(1).optional(),
  socialName: z.string().trim().optional(),
  birthDate: z.string().trim().optional(),
  gender: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || z.string().email().safeParse(value).success, {
      message: 'E-mail inválido.',
    }),
  guardianName: z.string().trim().optional(),
  guardianCpf: z.string().trim().optional(),
  contacts: z.array(contactSchema).optional(),
  zipCode: z.string().trim().optional(),
  street: z.string().trim().optional(),
  number: z.string().trim().optional(),
  complement: z.string().trim().optional(),
  neighborhood: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  photoDataUrl: z.string().trim().optional(),
})

export const preCadastroBodySchemaExport = preCadastroBodySchema
