import { z } from 'zod'
import { isValidCpf } from '../../lib/cpf.js'
import { parseBirthDateBr } from '../profissional-cadastro/schemas.js'

function isValidBirthDateInput(value: string): boolean {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return true
  try {
    parseBirthDateBr(value)
    return true
  } catch {
    return false
  }
}

export const patchProfissionalPerfilSchema = z
  .object({
    fullName: z.string().trim().min(2).max(200).optional(),
    specialty: z.string().trim().min(1).max(120).optional(),
    rqe: z.string().trim().max(40).optional(),
    bio: z.string().trim().max(2000).optional(),
    professionalDescription: z.string().trim().max(2000).optional(),
    phone: z.string().trim().max(30).optional(),
    cpf: z
      .string()
      .trim()
      .optional()
      .refine((value) => !value || isValidCpf(value), 'CPF inválido.'),
    birthDate: z
      .string()
      .trim()
      .optional()
      .refine((value) => !value || isValidBirthDateInput(value), 'Data de nascimento inválida.'),
    conselhoRegistro: z.string().trim().min(1).max(40).optional(),
    conselhoUf: z
      .string()
      .trim()
      .length(2, 'UF do conselho inválida.')
      .transform((value) => value.toUpperCase())
      .optional(),
    professionalAddress: z.string().trim().max(500).optional(),
    fotoDataUrl: z.string().trim().max(8_000_000).optional(),
    razaoSocial: z.string().trim().max(200).optional(),
    cnpj: z.string().trim().max(18).optional(),
    bankCode: z.string().trim().max(10).optional(),
    agency: z.string().trim().max(20).optional(),
    account: z.string().trim().max(30).optional(),
    accountType: z.enum(['corrente', 'poupanca']).optional(),
    pixKeyType: z.enum(['cpf', 'cnpj', 'telefone', 'email', 'aleatoria']).optional(),
    pixKey: z.string().trim().max(200).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualizar.',
  })

export const uploadFotoSchema = z.object({
  fotoDataUrl: z.string().trim().min(1).max(8_000_000),
})

export type PatchProfissionalPerfilBody = z.infer<typeof patchProfissionalPerfilSchema>
export type UploadFotoBody = z.infer<typeof uploadFotoSchema>
