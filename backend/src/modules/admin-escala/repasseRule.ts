import { z } from 'zod'
import { EscalaError } from './errors.js'

export const escalaRepasseModalidadeSchema = z.enum([
  'plantao_fixo',
  'por_consulta',
  'hibrido',
])

export const escalaRepasseTratamentoInelegivelSchema = z.enum([
  'proporcional_consultas',
  'aguardando_analise_manual',
])

export const escalaRepasseCriteriosSchema = z
  .object({
    minPercentualOnline: z.number().int().min(1).max(100),
    exigeEncerramentoFormal: z.boolean(),
    minConsultasConcluidas: z.number().int().min(0),
    aceitaSemDemandaComprovada: z.boolean(),
    tratamentoInelegivel: escalaRepasseTratamentoInelegivelSchema,
    /** @deprecated migrado para aceitaSemDemandaComprovada + minConsultasConcluidas */
    pagaSemDemanda: z.boolean().optional(),
  })
  .superRefine((criterios, ctx) => {
    if (!criterios.aceitaSemDemandaComprovada && criterios.minConsultasConcluidas < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Informe ao menos 1 consulta concluída ou aceite turno sem demanda comprovada.',
        path: ['minConsultasConcluidas'],
      })
    }
  })

export const escalaRepasseRuleSchema = z
  .object({
    modalidade: escalaRepasseModalidadeSchema,
    valorPlantaoCentavos: z.number().int().min(0),
    valorConsultaCentavos: z.number().int().min(0),
    percentualFixoHibrido: z.number().int().min(1).max(99).optional(),
    criteriosPresenca: escalaRepasseCriteriosSchema,
  })
  .superRefine((rule, ctx) => {
    if (rule.modalidade === 'plantao_fixo' && rule.valorPlantaoCentavos <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe o valor do plantão fixo.',
        path: ['valorPlantaoCentavos'],
      })
    }

    if (rule.modalidade === 'por_consulta' && rule.valorConsultaCentavos <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe o valor por consulta.',
        path: ['valorConsultaCentavos'],
      })
    }

    if (rule.modalidade === 'hibrido') {
      if (rule.valorPlantaoCentavos <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Informe a parte fixa do plantão híbrido.',
          path: ['valorPlantaoCentavos'],
        })
      }
      if (rule.valorConsultaCentavos <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Informe o valor por consulta do híbrido.',
          path: ['valorConsultaCentavos'],
        })
      }
      if (rule.percentualFixoHibrido == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Informe o percentual fixo do híbrido.',
          path: ['percentualFixoHibrido'],
        })
      }
    }
  })

export type EscalaRepasseRule = z.infer<typeof escalaRepasseRuleSchema>
type EscalaRepasseCriterios = EscalaRepasseRule['criteriosPresenca']

export function normalizeCriteriosPresenca(
  raw: Partial<EscalaRepasseCriterios> & { pagaSemDemanda?: boolean } | undefined | null,
): EscalaRepasseCriterios {
  if (!raw) {
    return {
      minPercentualOnline: 80,
      exigeEncerramentoFormal: true,
      minConsultasConcluidas: 1,
      aceitaSemDemandaComprovada: true,
      tratamentoInelegivel: 'aguardando_analise_manual',
    }
  }

  const aceitaSemDemanda =
    raw.aceitaSemDemandaComprovada ??
    (typeof raw.pagaSemDemanda === 'boolean' ? raw.pagaSemDemanda : true)

  const minConsultas =
    raw.minConsultasConcluidas ??
    (aceitaSemDemanda && raw.pagaSemDemanda === true ? 0 : 1)

  return {
    minPercentualOnline: Number(raw.minPercentualOnline ?? 80),
    exigeEncerramentoFormal: raw.exigeEncerramentoFormal ?? true,
    minConsultasConcluidas: Math.max(0, Number(minConsultas)),
    aceitaSemDemandaComprovada: aceitaSemDemanda,
    tratamentoInelegivel:
      raw.tratamentoInelegivel === 'proporcional_consultas' ||
      raw.tratamentoInelegivel === 'aguardando_analise_manual'
        ? raw.tratamentoInelegivel
        : 'aguardando_analise_manual',
  }
}

export function defaultRepasseRule(valorPlantaoCentavos: number): EscalaRepasseRule {
  return {
    modalidade: 'plantao_fixo',
    valorPlantaoCentavos,
    valorConsultaCentavos: 0,
    criteriosPresenca: normalizeCriteriosPresenca(null),
  }
}

export function parseRepasseRule(raw: unknown, fallbackValorCentavos: number): EscalaRepasseRule {
  if (!raw || typeof raw !== 'object' || Object.keys(raw as object).length === 0) {
    return defaultRepasseRule(fallbackValorCentavos)
  }

  const obj = raw as Partial<EscalaRepasseRule>
  if (!obj.modalidade) {
    return defaultRepasseRule(fallbackValorCentavos)
  }

  const normalized: EscalaRepasseRule = {
    modalidade: obj.modalidade,
    valorPlantaoCentavos: Number(obj.valorPlantaoCentavos ?? fallbackValorCentavos),
    valorConsultaCentavos: Number(obj.valorConsultaCentavos ?? 0),
    ...(obj.percentualFixoHibrido != null
      ? { percentualFixoHibrido: Number(obj.percentualFixoHibrido) }
      : {}),
    criteriosPresenca: normalizeCriteriosPresenca(obj.criteriosPresenca),
  }

  const parsed = escalaRepasseRuleSchema.safeParse(normalized)
  if (parsed.success) return parsed.data

  return defaultRepasseRule(fallbackValorCentavos)
}

export function resolveValorCentavosFromRepasseRule(rule: EscalaRepasseRule): number {
  if (rule.modalidade === 'por_consulta') {
    return rule.valorConsultaCentavos
  }
  return rule.valorPlantaoCentavos
}

export function assertValidRepasseRule(rule: EscalaRepasseRule): void {
  const parsed = escalaRepasseRuleSchema.safeParse(rule)
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Regra de repasse inválida.'
    throw new EscalaError(message, 'INVALID_DATA', 400)
  }
}

export function serializeRepasseRule(rule: EscalaRepasseRule): Record<string, unknown> {
  const normalized: EscalaRepasseRule = {
    ...rule,
    criteriosPresenca: normalizeCriteriosPresenca(rule.criteriosPresenca),
  }
  assertValidRepasseRule(normalized)
  return {
    modalidade: normalized.modalidade,
    valorPlantaoCentavos: normalized.valorPlantaoCentavos,
    valorConsultaCentavos: normalized.valorConsultaCentavos,
    ...(normalized.percentualFixoHibrido != null
      ? { percentualFixoHibrido: normalized.percentualFixoHibrido }
      : {}),
    criteriosPresenca: normalized.criteriosPresenca,
  }
}
