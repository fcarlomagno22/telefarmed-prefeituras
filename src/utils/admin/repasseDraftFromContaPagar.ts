import type { AdminContaPagarRow } from '../../types/adminFinanceiro'
import type {
  AdminContaPagarRepasseDraft,
  AdminContaPagarRepasseSnapshot,
} from '../../types/adminProfissionalRepasse'

function isRepasseSnapshot(value: unknown): value is AdminContaPagarRepasseSnapshot {
  if (!value || typeof value !== 'object') return false
  const snapshot = value as AdminContaPagarRepasseSnapshot
  return (
    typeof snapshot.competenciaId === 'string' &&
    typeof snapshot.profissionalNome === 'string' &&
    Array.isArray(snapshot.plantoesResumo)
  )
}

/** Converte snapshot persistido no backend (conta a pagar de repasse) para o draft da UI. */
export function repasseDraftFromContaPagar(row: AdminContaPagarRow): AdminContaPagarRepasseDraft | null {
  if (row.origem !== 'repasse_profissional') return null

  const snapshot = row.repasseSnapshot
  if (!isRepasseSnapshot(snapshot)) return null

  return {
    id: row.repasseDraftId ?? row.id,
    competenciaId: row.repasseCompetenciaId ?? snapshot.competenciaId,
    contaPagarId: row.id,
    profissionalNome: snapshot.profissionalNome,
    pjRazaoSocial: snapshot.pjRazaoSocial,
    pjCnpj: snapshot.pjCnpj,
    competencia: snapshot.competencia,
    valorCalculadoCentavos: snapshot.valorCalculadoCentavos,
    valorAprovadoCentavos: snapshot.valorAprovadoCentavos,
    valorNFCentavos: snapshot.valorNFCentavos,
    motivoAjuste: snapshot.motivoAjuste,
    nfFileName: snapshot.nfFileName,
    plantaoIds: snapshot.plantaoIds,
    plantoesResumo: snapshot.plantoesResumo,
    aprovadoEm: snapshot.aprovadoEm,
  }
}
