import { z } from 'zod'
import { isValidCpf } from '../../lib/cpf.js'

const formacaoSchema = z.enum(['medicina', 'psicologia', 'nutricao', 'fonoaudiologia'])

const medicalSpecialtySchema = z.object({
  specialty: z.string().trim().min(1, 'Selecione a especialidade.'),
  rqe: z
    .string()
    .trim()
    .refine((value) => {
      const digits = value.replace(/\D/g, '')
      return digits.length >= 3 && digits.length <= 8
    }, 'Informe o RQE com 3 a 8 dígitos.'),
})

const enderecoSchema = z.object({
  cep: z.string().trim().min(8, 'CEP inválido.'),
  logradouro: z.string().trim().min(1, 'Informe o logradouro.'),
  numero: z.string().trim().min(1, 'Informe o número.'),
  complemento: z.string().trim().optional().default(''),
  bairro: z.string().trim().min(1, 'Informe o bairro.'),
  cidade: z.string().trim().min(1, 'Informe a cidade.'),
  uf: z
    .string()
    .trim()
    .length(2, 'UF inválida.')
    .transform((value) => value.toUpperCase()),
})

export function parseBirthDateBr(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length !== 8) {
    throw new Error('Data de nascimento inválida.')
  }

  const day = Number(digits.slice(0, 2))
  const month = Number(digits.slice(2, 4))
  const year = Number(digits.slice(4, 8))

  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1920) {
    throw new Error('Data de nascimento inválida.')
  }

  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new Error('Data de nascimento inválida.')
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (date > today) {
    throw new Error('Data de nascimento inválida.')
  }

  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
}

export const candidaturaDadosSchema = z
  .object({
    fullName: z.string().trim().min(3, 'Informe seu nome completo.'),
    cpf: z
      .string()
      .trim()
      .refine((value) => isValidCpf(value), 'CPF inválido.'),
    birthDate: z.string().trim().min(8, 'Data de nascimento inválida.'),
    email: z.string().trim().email('E-mail inválido.'),
    phone: z
      .string()
      .trim()
      .refine((value) => value.replace(/\D/g, '').length >= 10, 'Telefone inválido.'),
    formation: formacaoSchema,
    medicalSpecialties: z.array(medicalSpecialtySchema).optional().default([]),
    crm: z
      .string()
      .trim()
      .refine((value) => value.replace(/\D/g, '').length >= 3, 'Número do conselho inválido.'),
    uf: z
      .string()
      .trim()
      .length(2, 'UF do conselho inválida.')
      .transform((value) => value.toUpperCase()),
    professionalDescription: z.string().trim().max(500).optional().default(''),
    zipCode: z
      .string()
      .trim()
      .refine((value) => value.replace(/\D/g, '').length === 8, 'CEP inválido.'),
    street: z.string().trim().min(1, 'Informe o logradouro.'),
    number: z.string().trim().min(1, 'Informe o número.'),
    complement: z.string().trim().optional().default(''),
    neighborhood: z.string().trim().min(1, 'Informe o bairro.'),
    city: z.string().trim().min(1, 'Informe a cidade.'),
    state: z
      .string()
      .trim()
      .length(2, 'UF inválida.')
      .transform((value) => value.toUpperCase()),
  })
  .superRefine((data, ctx) => {
    if (data.formation !== 'medicina') return

    if (data.medicalSpecialties.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe ao menos uma especialidade com RQE.',
        path: ['medicalSpecialties'],
      })
      return
    }

    if (data.medicalSpecialties.length > 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'É possível informar no máximo 8 especialidades.',
        path: ['medicalSpecialties'],
      })
    }

    const seen = new Set<string>()
    for (const [index, item] of data.medicalSpecialties.entries()) {
      const key = item.specialty.trim().toLowerCase()
      if (!key) continue
      if (seen.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Especialidade duplicada.',
          path: ['medicalSpecialties', index, 'specialty'],
        })
      }
      seen.add(key)
    }
  })
  .transform((data) => ({
    nomeCompleto: data.fullName.trim(),
    cpf: data.cpf.replace(/\D/g, ''),
    dataNascimento: parseBirthDateBr(data.birthDate),
    email: data.email.trim().toLowerCase(),
    telefone: data.phone.trim(),
    formacao: data.formation,
    especialidadesMedicas:
      data.formation === 'medicina'
        ? data.medicalSpecialties.map((item) => ({
            especialidadeNome: item.specialty.trim(),
            rqe: item.rqe.replace(/\D/g, ''),
          }))
        : undefined,
    conselhoNumero: data.crm.replace(/\D/g, ''),
    conselhoUf: data.uf,
    descricaoProfissional: data.professionalDescription.trim(),
    endereco: enderecoSchema.parse({
      cep: data.zipCode.replace(/\D/g, ''),
      logradouro: data.street.trim(),
      numero: data.number.trim(),
      complemento: data.complement.trim(),
      bairro: data.neighborhood.trim(),
      cidade: data.city.trim(),
      uf: data.state,
    }),
  }))

export const candidaturaDocumentoReferenciaSchema = z.object({
  fieldId: z.string().trim().min(1, 'Documento inválido.'),
  storagePath: z.string().trim().min(1, 'Documento inválido.'),
  fileName: z.string().trim().min(1, 'Documento inválido.'),
  mimeType: z.string().trim().min(1, 'Documento inválido.'),
})

export const candidaturaDocumentosUploadUrlBodySchema = z.object({
  submissionId: z.string().uuid('Identificador de envio inválido.').optional(),
  documentos: z
    .array(
      z.object({
        fieldId: z.string().trim().min(1, 'Documento inválido.'),
        fileName: z.string().trim().min(1, 'Documento inválido.'),
        mimeType: z.string().trim().min(1, 'Documento inválido.'),
      }),
    )
    .min(1, 'Informe ao menos um documento.')
    .max(4, 'Envie no máximo 4 documentos por vez.'),
})

export const candidaturaSubmitStorageBodySchema = z.object({
  submissionId: z.string().uuid('Identificador de envio inválido.'),
  documentos: z.array(candidaturaDocumentoReferenciaSchema).min(1),
})
