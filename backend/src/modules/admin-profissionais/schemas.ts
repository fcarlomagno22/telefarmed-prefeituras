import { z } from 'zod'
import { isValidCpf } from '../../lib/cpf.js'

const formacaoSchema = z.enum(['medicina', 'psicologia', 'nutricao', 'fonoaudiologia'])

export const idParamSchema = z.object({
  id: z.string().uuid('ID inválido.'),
})

export const documentoParamSchema = z.object({
  id: z.string().uuid('ID inválido.'),
  docId: z.string().uuid('ID do documento inválido.'),
})

export const listCandidaturasQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z
    .enum(['all', 'pendente', 'em_analise', 'incompleto', 'reprovado'])
    .optional()
    .default('all'),
})

export const listAtivosQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(['all', 'ativo', 'inativo']).optional().default('all'),
  allocation: z.enum(['all', 'nacional', 'por_contrato']).optional().default('all'),
  profession: z
    .enum(['all', 'Médicos', 'Psicólogos', 'Nutricionistas', 'Fonoaudiólogos'])
    .optional()
    .default('all'),
})

export const reviewDocumentoBodySchema = z.object({
  status: z.enum(['pendente', 'aprovado', 'reprovado']),
  motivoReprovacao: z.string().trim().optional(),
})

export const reprovarCandidaturaBodySchema = z.object({
  motivo: z.string().trim().min(3, 'Informe o motivo da reprovação.'),
})

export const solicitarCorrecaoBodySchema = z.object({
  mensagem: z.string().trim().min(3, 'Informe a mensagem de correção.'),
  documentoIds: z.array(z.string().uuid()).default([]),
})

export const updateAtivoBodySchema = z.object({
  phone: z.string().trim().optional(),
  specialty: z.string().trim().optional(),
  onCallLabel: z.string().trim().optional(),
  status: z.enum(['ativo', 'inativo']).optional(),
})

export const createAtivoBodySchema = z.object({
  fullName: z.string().trim().min(3, 'Informe o nome completo.'),
  cpf: z.string().trim().refine((value) => isValidCpf(value), 'CPF inválido.'),
  email: z.string().trim().email('E-mail inválido.'),
  password: z.string().trim().min(8, 'A senha deve ter pelo menos 8 caracteres.'),
  phone: z.string().trim().optional(),
  formation: formacaoSchema,
  specialty: z.string().trim().min(1, 'Informe a especialidade.'),
  councilNumber: z.string().trim().min(3, 'Número do conselho inválido.'),
  councilUf: z
    .string()
    .trim()
    .length(2, 'UF do conselho inválida.')
    .transform((value) => value.toUpperCase()),
  street: z.string().trim().min(1, 'Informe o logradouro.'),
  number: z.string().trim().min(1, 'Informe o número.'),
  complement: z.string().trim().optional(),
  neighborhood: z.string().trim().min(1, 'Informe o bairro.'),
  city: z.string().trim().min(1, 'Informe a cidade.'),
  state: z
    .string()
    .trim()
    .length(2, 'UF inválida.')
    .transform((value) => value.toUpperCase()),
  zipCode: z
    .string()
    .trim()
    .refine((value) => value.replace(/\D/g, '').length === 8, 'CEP inválido.'),
})

export type ListCandidaturasQuery = z.infer<typeof listCandidaturasQuerySchema>
export type ListAtivosQuery = z.infer<typeof listAtivosQuerySchema>
export type ReviewDocumentoBody = z.infer<typeof reviewDocumentoBodySchema>
export type ReprovarCandidaturaBody = z.infer<typeof reprovarCandidaturaBodySchema>
export type SolicitarCorrecaoBody = z.infer<typeof solicitarCorrecaoBodySchema>
export type UpdateAtivoBody = z.infer<typeof updateAtivoBodySchema>
export type CreateAtivoBody = z.infer<typeof createAtivoBodySchema>
