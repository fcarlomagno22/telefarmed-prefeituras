import type { EscalaRepasseRule } from '../../types/adminEscala'
import {
  normalizeCriteriosPresenca,
  repasseModalidadeLabel,
  tratamentoInelegivelLabel,
} from '../adminEscala/repasseRule'
import { formatProfissionalCurrency } from './formatProfissionalCurrency'

export type ProfissionalRepasseRuleBlock = {
  title: string
  items: string[]
}

export function buildProfissionalRepasseRuleBlocks(
  rule: EscalaRepasseRule,
): ProfissionalRepasseRuleBlock[] {
  const criterios = normalizeCriteriosPresenca(rule.criteriosPresenca)
  const blocks: ProfissionalRepasseRuleBlock[] = []

  const valores: string[] = []
  if (rule.modalidade === 'plantao_fixo' || rule.modalidade === 'hibrido') {
    valores.push(`Valor base do plantão: ${formatProfissionalCurrency(rule.valorPlantaoCentavos)}`)
  }
  if (rule.modalidade === 'por_consulta' || rule.modalidade === 'hibrido') {
    valores.push(`Valor por consulta concluída: ${formatProfissionalCurrency(rule.valorConsultaCentavos)}`)
  }
  if (rule.modalidade === 'hibrido') {
    valores.push(
      `Parte fixa do plantão: ${rule.percentualFixoHibrido ?? 0}% do valor base + consultas no complemento`,
    )
  }

  blocks.push({
    title: `Modalidade: ${repasseModalidadeLabel(rule.modalidade)}`,
    items: valores,
  })

  const demanda =
    criterios.aceitaSemDemandaComprovada && criterios.minConsultasConcluidas > 0
      ? `Atender pelo menos ${criterios.minConsultasConcluidas} consulta${criterios.minConsultasConcluidas === 1 ? '' : 's'} concluída${criterios.minConsultasConcluidas === 1 ? '' : 's'} ou comprovar turno sem demanda (zero na fila/agenda)`
      : criterios.aceitaSemDemandaComprovada
        ? 'Comprovar turno sem demanda (zero pacientes na fila ou agenda)'
        : `Atender pelo menos ${criterios.minConsultasConcluidas} consulta${criterios.minConsultasConcluidas === 1 ? '' : 's'} concluída${criterios.minConsultasConcluidas === 1 ? '' : 's'}`

  blocks.push({
    title: 'Pagamento integral só se cumprir tudo',
    items: [
      `Permanecer online ≥ ${criterios.minPercentualOnline}% do turno`,
      criterios.exigeEncerramentoFormal
        ? 'Encerrar o plantão formalmente na agenda ao final do turno'
        : 'Encerramento formal na agenda não é exigido',
      demanda,
    ],
  })

  blocks.push({
    title: 'Se não cumprir todos os critérios',
    items: [
      tratamentoInelegivelLabel(criterios.tratamentoInelegivel),
      criterios.tratamentoInelegivel === 'proporcional_consultas'
        ? 'O repasse será calculado apenas pelas consultas concluídas — não há pagamento integral automático.'
        : 'O repasse fica parcial e passa por análise manual do financeiro antes de qualquer pagamento integral.',
    ],
  })

  return blocks
}
