import { resolveContratoModalidade } from '../admin-clientes/contratoModalidade.js'
import type { AdminClienteContratoTipo } from '../admin-clientes/types.js'

export type ContratoModalidade = AdminClienteContratoTipo

export function resolvePrefeituraContratoModalidade(
  tipoId: string,
  tipoNome?: string | null,
): ContratoModalidade {
  return resolveContratoModalidade(tipoId, tipoNome)
}

/** Cota exibida por mês na tabela — só contratos mensais têm franquia mensal. */
export function monthlyContractedQuota(
  modalidade: ContratoModalidade,
  packageTotal: number,
): number {
  return modalidade === 'mensal' ? packageTotal : 0
}

/** Base para cálculo de % de uso na linha mensal. */
export function monthlyUsageDenominator(
  modalidade: ContratoModalidade,
  packageTotal: number,
  monthlyQuota: number,
): number {
  if (modalidade === 'mensal') return monthlyQuota
  if (modalidade === 'pacote_fechado') return packageTotal
  return 0
}
