import type { EscalaRepasseModalidade } from '../../types/adminEscala'
import type { AdminPlantaoAuditoriaRow } from '../../types/adminProfissionalRepasse'
import { computePlantaoRepasse } from './computePlantaoRepasse'

export type RepasseModalityBreakdownItem = {
  modalidade: EscalaRepasseModalidade
  qtdPlantoes: number
  valorCalculadoCentavos: number
}

const MODALIDADE_ORDER: EscalaRepasseModalidade[] = [
  'plantao_fixo',
  'por_consulta',
  'hibrido',
]

export function computeRepasseModalityBreakdown(
  plantoes: AdminPlantaoAuditoriaRow[],
): RepasseModalityBreakdownItem[] {
  const map = new Map<EscalaRepasseModalidade, RepasseModalityBreakdownItem>()

  for (const plantao of plantoes) {
    const modalidade = plantao.repasseRule.modalidade
    const valor = computePlantaoRepasse(plantao).valorCalculadoCentavos
    const current = map.get(modalidade) ?? {
      modalidade,
      qtdPlantoes: 0,
      valorCalculadoCentavos: 0,
    }
    map.set(modalidade, {
      modalidade,
      qtdPlantoes: current.qtdPlantoes + 1,
      valorCalculadoCentavos: current.valorCalculadoCentavos + valor,
    })
  }

  return MODALIDADE_ORDER.filter((m) => map.has(m)).map((m) => map.get(m)!)
}
