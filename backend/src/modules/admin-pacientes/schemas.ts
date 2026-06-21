import { z } from 'zod'
import { isValidCns, normalizeCns } from '../../lib/cns.js'
import { isValidCpf } from '../../lib/cpf.js'
import {
  isValidPacienteNacionalidade,
  isValidPacienteRacaCor,
} from '../../lib/pacienteDemografia.js'

const contactSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  phone: z.string(),
  relationship: z.string().optional(),
})

export const registrationConsentSchema = z.object({
  dataReviewed: z.literal(true),
  teleconsultationAuthorized: z.literal(true),
  dataUsageAcknowledged: z.literal(true),
  notificationsAllowed: z.literal(true),
  operatorName: z.string().trim().min(1),
  registeredAt: z.string().trim().min(1),
  registrationUnitId: z.string().trim().optional(),
  registrationUnitName: z.string().trim().min(1),
  operatorUserId: z.string().uuid().optional(),
  operatorAdminId: z.string().uuid().optional(),
})

export const pacienteRegistrationFieldsSchema = z.object({
  fullName: z.string().trim().min(1),
  socialName: z.string().trim().optional(),
  cpf: z.string().trim().min(11),
  birthDate: z.string().trim().min(8),
  gender: z.string().trim().min(1),
  nationality: z
    .string()
    .trim()
    .min(1)
    .refine(isValidPacienteNacionalidade, { message: 'Nacionalidade inválida.' }),
  raceColor: z
    .string()
    .trim()
    .min(1)
    .refine(isValidPacienteRacaCor, { message: 'Raça/cor inválida.' }),
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
  guardianRelationship: z.string().trim().optional(),
  guardianPhone: z.string().trim().optional(),
  guardianAttendanceAuthorized: z.boolean().optional(),
  contacts: z.array(contactSchema).optional(),
  zipCode: z.string().trim().optional(),
  street: z.string().trim().optional(),
  number: z.string().trim().optional(),
  complement: z.string().trim().optional(),
  neighborhood: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  residenceMunicipalityIbgeCode: z
    .string()
    .trim()
    .regex(/^\d{7}$/, 'Código IBGE do município inválido.')
    .optional(),
  photoDataUrl: z.string().trim().optional(),
  cns: z.string().trim().optional(),
  cnsPendente: z.boolean().optional(),
  registrationConsent: registrationConsentSchema.optional(),
})

function refineGuardianFields(
  data: {
    guardianName?: string
    guardianCpf?: string
    guardianRelationship?: string
    guardianPhone?: string
    guardianAttendanceAuthorized?: boolean
  },
  ctx: z.RefinementCtx,
) {
  const hasGuardian =
    Boolean(data.guardianName?.trim()) || Boolean(data.guardianCpf?.replace(/\D/g, '').length)

  if (!hasGuardian) return

  if (!data.guardianName?.trim()) {
    ctx.addIssue({
      code: 'custom',
      message: 'Informe o nome do responsável.',
      path: ['guardianName'],
    })
  }

  if ((data.guardianCpf?.replace(/\D/g, '') ?? '').length !== 11) {
    ctx.addIssue({
      code: 'custom',
      message: 'Informe o CPF do responsável.',
      path: ['guardianCpf'],
    })
  }

  if (!data.guardianRelationship?.trim()) {
    ctx.addIssue({
      code: 'custom',
      message: 'Informe o grau de parentesco do responsável.',
      path: ['guardianRelationship'],
    })
  }

  if ((data.guardianPhone?.replace(/\D/g, '') ?? '').length < 10) {
    ctx.addIssue({
      code: 'custom',
      message: 'Informe o telefone do responsável.',
      path: ['guardianPhone'],
    })
  }

  if (data.guardianAttendanceAuthorized !== true) {
    ctx.addIssue({
      code: 'custom',
      message: 'Confirme a autorização/ciência do responsável pelo atendimento.',
      path: ['guardianAttendanceAuthorized'],
    })
  }
}

function refineRegistrationConsentOnCreate(
  data: {
    registrationConsent?: z.infer<typeof registrationConsentSchema>
    concluirImmediately?: boolean
  },
  ctx: z.RefinementCtx,
) {
  if (data.concluirImmediately === false) return

  if (!data.registrationConsent) {
    ctx.addIssue({
      code: 'custom',
      message: 'Confirme os termos finais do cadastro.',
      path: ['registrationConsent'],
    })
  }
}

type PacienteRegistrationRefinementBase = {
  cpf?: string
  cns?: string
  cnsPendente?: boolean
  guardianName?: string
  guardianCpf?: string
  guardianRelationship?: string
  guardianPhone?: string
  guardianAttendanceAuthorized?: boolean
  registrationConsent?: z.infer<typeof registrationConsentSchema>
  concluirImmediately?: boolean
}

function refinePacienteRegistrationOnCreate(
  data: PacienteRegistrationRefinementBase,
  ctx: z.RefinementCtx,
) {
  refineCnsOnCreate(data, ctx)
  refineGuardianFields(data, ctx)
  refineRegistrationConsentOnCreate(data, ctx)
}

function refinePacienteRegistrationOnUpdate(
  data: PacienteRegistrationRefinementBase,
  ctx: z.RefinementCtx,
) {
  refineCnsOnUpdate(data, ctx)
  if (
    data.guardianName !== undefined ||
    data.guardianCpf !== undefined ||
    data.guardianRelationship !== undefined ||
    data.guardianPhone !== undefined ||
    data.guardianAttendanceAuthorized !== undefined
  ) {
    // CPF omitido no PATCH (ex.: mascarado por LGPD) — o service preserva o valor já salvo.
    if (data.guardianCpf === undefined) return
    refineGuardianFields(data, ctx)
  }
}

function hasValidPacienteCpf(cpf: string | undefined): boolean {
  const digits = (cpf ?? '').replace(/\D/g, '')
  return digits.length === 11 && isValidCpf(digits)
}

function refineCnsOnCreate(
  data: { cpf?: string; cns?: string; cnsPendente?: boolean },
  ctx: z.RefinementCtx,
) {
  const pending = data.cnsPendente === true
  const digits = normalizeCns(data.cns ?? '')
  const hasValidCpf = hasValidPacienteCpf(data.cpf)

  if (pending) {
    if (digits.length > 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Remova o número do CNS ou desmarque a opção de pendência.',
        path: ['cns'],
      })
    }
    if (hasValidCpf) return
    return
  }

  if (digits.length === 0) {
    if (hasValidCpf) return
    ctx.addIssue({
      code: 'custom',
      message: 'Informe o CNS/Cartão SUS ou marque como pendência.',
      path: ['cns'],
    })
    return
  }

  if (!isValidCns(digits)) {
    ctx.addIssue({
      code: 'custom',
      message: 'CNS/Cartão SUS inválido.',
      path: ['cns'],
    })
  }
}

function refineCnsOnUpdate(
  data: { cpf?: string; cns?: string; cnsPendente?: boolean },
  ctx: z.RefinementCtx,
) {
  if (data.cnsPendente === undefined && data.cns === undefined) return
  refineCnsOnCreate(data, ctx)
}

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

export const preCadastroBodyObjectSchema = pacienteRegistrationFieldsSchema.extend({
  entidadeContratanteId: z.string().uuid(),
  unidadeUbtId: z.string().uuid().optional(),
  concluirImmediately: z.boolean().optional(),
})

export const preCadastroBodySchema =
  preCadastroBodyObjectSchema.superRefine(refinePacienteRegistrationOnCreate)

export const createPacienteBodyObjectSchema = preCadastroBodyObjectSchema.extend({
  status: z.enum(['ativo', 'inativo', 'pre_cadastro', 'suspenso']).optional(),
})

export const createPacienteBodySchema =
  createPacienteBodyObjectSchema.superRefine(refinePacienteRegistrationOnCreate)

export const updatePacienteBodyObjectSchema = pacienteRegistrationFieldsSchema.partial()

export const updatePacienteBodySchema =
  updatePacienteBodyObjectSchema.superRefine(refinePacienteRegistrationOnUpdate)

export const preCadastroBodySchemaExport = preCadastroBodySchema

export {
  refineCnsOnCreate,
  refineCnsOnUpdate,
  refinePacienteRegistrationOnCreate,
  refinePacienteRegistrationOnUpdate,
}
