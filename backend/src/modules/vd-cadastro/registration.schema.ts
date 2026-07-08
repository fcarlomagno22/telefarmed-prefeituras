import { z } from 'zod'
import { isValidCpf } from '../../lib/cpf.js'
import { validatePortalPassword } from '../../lib/passwordPolicy.js'
import { appLegalAcceptancesSchema } from '../../lib/patientRegistrationAppConsent.js'
import { isValidCepDigits, normalizeCepDigits } from '../../lib/viacep.js'

function phoneDigits(value: string): string {
  return value.replace(/\D/g, '')
}

export const appPacienteRegistrationAddressSchema = z.object({
  cep: z
    .string()
    .trim()
    .min(1, 'Informe o CEP.')
    .refine((value) => isValidCepDigits(normalizeCepDigits(value)), {
      message: 'Informe um CEP válido com 8 dígitos.',
    }),
  logradouro: z.string().trim().min(1, 'Informe o logradouro.'),
  numero: z.string().trim().min(1, 'Informe o número do endereço.'),
  bairro: z.string().trim().min(1, 'Informe o bairro.'),
  cidade: z.string().trim().min(1, 'Informe a cidade.'),
  uf: z
    .string()
    .trim()
    .min(2, 'Informe a UF.')
    .max(2, 'Informe a UF com 2 letras.')
    .transform((value) => value.toUpperCase()),
  complemento: z.string().trim().optional(),
  codigoIbgeMunicipio: z
    .string()
    .trim()
    .regex(/^\d{7}$/, 'Código IBGE do município inválido.')
    .optional(),
})

/** 5 checkboxes do app → mapeados para appRegistrationConsentSchema (4 literais UBT) no mapper. */
export const appPacienteRegistrationConsentSchema = appLegalAcceptancesSchema

export const appPacienteRegistrationObjectSchema = z.object({
  fullName: z.string().trim().min(1, 'Informe o nome completo.'),
  cpf: z
    .string()
    .trim()
    .min(11, 'Informe o CPF.')
    .refine((value) => isValidCpf(value), { message: 'CPF inválido.' }),
  email: z
    .string()
    .trim()
    .min(1, 'Informe o e-mail.')
    .email('Informe um e-mail válido.'),
  phone: z
    .string()
    .trim()
    .min(1, 'Informe o telefone.')
    .refine((value) => phoneDigits(value).length >= 10, {
      message: 'Informe um telefone válido com DDD.',
    }),
  address: appPacienteRegistrationAddressSchema,
  registrationConsent: appPacienteRegistrationConsentSchema,
  password: z
    .string()
    .trim()
    .min(1, 'Informe a senha.')
    .superRefine((value, ctx) => {
      const message = validatePortalPassword(value)
      if (message) {
        ctx.addIssue({
          code: 'custom',
          message,
        })
      }
    }),
  photoDataUrl: z.string().trim().min(1).optional(),
  selfie: z.string().trim().min(1).optional(),
})

export const appPacienteRegistrationSchema = appPacienteRegistrationObjectSchema

export type AppPacienteRegistrationAddressInput = z.infer<
  typeof appPacienteRegistrationAddressSchema
>
export type AppPacienteRegistrationInput = z.infer<typeof appPacienteRegistrationSchema>

export function formatAppPacienteRegistrationValidationError(error: z.ZodError): string {
  const issue = error.issues[0]
  if (!issue) return 'Dados inválidos.'
  if (typeof issue.message === 'string' && issue.message.trim()) {
    return issue.message
  }
  return 'Dados inválidos.'
}
