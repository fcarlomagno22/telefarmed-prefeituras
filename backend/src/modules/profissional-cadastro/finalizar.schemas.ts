import { z } from 'zod'

export const accessCodeParamSchema = z.object({
  code: z
    .string()
    .trim()
    .refine((value) => value.replace(/\D/g, '').length === 6, 'Código inválido.'),
})

export const validarCodigoBodySchema = z.object({
  accessCode: z
    .string()
    .trim()
    .refine((value) => value.replace(/\D/g, '').length === 6, 'Código inválido.'),
})

export const consultarCnpjParamSchema = z.object({
  cnpj: z
    .string()
    .trim()
    .refine((value) => value.replace(/\D/g, '').length === 14, 'CNPJ inválido.'),
})

const empresaInputSchema = z
  .object({
    cnpj: z.string().trim().optional(),
    razaoSocial: z.string().trim().min(1, 'Razão social obrigatória.'),
    nomeFantasia: z.string().trim().optional(),
    situacaoCadastral: z.string().trim().optional(),
    municipio: z.string().trim().optional(),
    cidade: z.string().trim().optional(),
    uf: z.string().trim().length(2, 'UF inválida.'),
  })
  .transform((data) => {
    const municipio = (data.municipio ?? data.cidade ?? '').trim()
    return {
      cnpj: data.cnpj?.replace(/\D/g, '') ?? '',
      razaoSocial: data.razaoSocial,
      nomeFantasia: data.nomeFantasia?.trim() ?? '',
      situacaoCadastral: data.situacaoCadastral?.trim() ?? '',
      municipio,
      uf: data.uf.trim().toUpperCase(),
    }
  })
  .refine((data) => data.municipio.length > 0, {
    message: 'Município obrigatório.',
    path: ['municipio'],
  })

const finalizarCadastroValuesFieldsSchema = z.object({
  accessCode: z.string().trim().min(1, 'Informe o código de acesso.'),
  cnpj: z.string().trim().min(1, 'Informe o CNPJ.'),
  empresaConfirmed: z.boolean(),
  pixKeyType: z.enum(['cnpj', 'email', 'telefone', 'aleatoria']),
  pixKey: z.string().trim().min(1, 'Informe a chave PIX.'),
  contractOpened: z.boolean().optional(),
  contractScrolledToEnd: z.boolean().optional(),
  contractAccepted: z.boolean(),
  password: z.string().trim().min(8, 'A senha deve ter pelo menos 8 caracteres.'),
  confirmPassword: z.string().trim().min(8, 'Confirme a senha.'),
})

function refineFinalizarCadastroValues(
  values: {
    contractOpened?: boolean
    contractScrolledToEnd?: boolean
  },
  ctx: z.RefinementCtx,
) {
  if (!values.contractOpened) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Abra e leia o contrato antes de aceitar.',
      path: ['contractOpened'],
    })
  }
  if (!values.contractScrolledToEnd) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Role o contrato até o final antes de aceitar.',
      path: ['contractScrolledToEnd'],
    })
  }
}

const finalizarCadastroValuesSchema = finalizarCadastroValuesFieldsSchema.superRefine(
  refineFinalizarCadastroValues,
)

/** Payload JSON dentro do multipart (selfie enviada como arquivo binário). */
export const finalizarCadastroMultipartDadosSchema = z.object({
  values: finalizarCadastroValuesSchema,
  empresa: empresaInputSchema,
})

/** Fallback JSON legado — selfie embutida em base64. */
export const finalizarCadastroBodySchema = z.object({
  values: finalizarCadastroValuesFieldsSchema
    .extend({
      selfiePhotoDataUrl: z.string().trim().min(1, 'Envie a foto de identificação.'),
    })
    .superRefine(refineFinalizarCadastroValues),
  empresa: empresaInputSchema,
})
