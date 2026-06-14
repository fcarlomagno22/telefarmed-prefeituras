import { z } from 'zod'

export const loginBodySchema = z.object({
  cpf: z
    .string()
    .trim()
    .min(1, 'Informe o CPF.')
    .refine((value) => value.replace(/\D/g, '').length === 11, 'CPF inválido.'),
  password: z.string().trim().min(1, 'Informe a senha.'),
})
