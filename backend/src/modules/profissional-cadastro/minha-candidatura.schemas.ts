import { z } from 'zod'
import { isValidCpf } from '../../lib/cpf.js'
import { parseBirthDateBr } from './schemas.js'

export const consultarMinhaCandidaturaBodySchema = z.object({
  cpf: z.string().trim().refine((value) => isValidCpf(value), 'CPF inválido.'),
  birthDate: z
    .string()
    .trim()
    .min(8, 'Data de nascimento inválida.')
    .transform((value, ctx) => {
      try {
        return parseBirthDateBr(value)
      } catch {
        ctx.addIssue({ code: 'custom', message: 'Data de nascimento inválida.' })
        return z.NEVER
      }
    }),
})

export const documentoParamSchema = z.object({
  documentoId: z.string().uuid('Documento inválido.'),
})

export const corrigirDadosMinhaCandidaturaBodySchema = consultarMinhaCandidaturaBodySchema
  .extend({
    email: z.string().trim().email('E-mail inválido.').optional(),
    telefone: z.string().trim().min(8, 'Telefone inválido.').optional(),
    conselhoNumero: z.string().trim().min(1, 'Informe o número do conselho.').optional(),
    conselhoUf: z
      .string()
      .trim()
      .length(2, 'UF inválida.')
      .transform((value) => value.toUpperCase())
      .optional(),
    rqe: z.string().trim().optional(),
  })
  .refine(
    (data) =>
      Boolean(
        data.email ||
          data.telefone ||
          data.conselhoNumero ||
          data.conselhoUf ||
          data.rqe !== undefined,
      ),
    { message: 'Informe ao menos um dado para corrigir.' },
  )
