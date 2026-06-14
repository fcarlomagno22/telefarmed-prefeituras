import type { AdminContaPagarRow, AdminFornecedorRow } from '../types/adminFinanceiro'
import type {
  AdminContaPagarRepasseDraft,
  AdminRepasseProfissionalCompetenciaRow,
  RepasseCompetenciaAprovadaPayload,
} from '../types/adminProfissionalRepasse'
import { computePlantaoRepasse } from '../utils/admin/computePlantaoRepasse'
import { formatPlantaoTableDate } from '../utils/admin/formatPlantaoRepasseAuditoria'

import { parseCompetenciaToMonthYear } from '../utils/admin/financeiroCompetencia'

/** Store em memória (mock) — substituir por API admin/financeiro/repasse-profissionais. */
const drafts = new Map<string, AdminContaPagarRepasseDraft>()
const byCompetenciaId = new Map<string, string>()
const byContaPagarId = new Map<string, string>()

function normalizeCnpj(cnpj: string) {
  return cnpj.replace(/\D/g, '')
}

export function vencimentoFromCompetencia(competencia: string): string {
  const parsed = parseCompetenciaToMonthYear(competencia)
  if (!parsed) return '10/06/2026'
  const { month, year } = parsed
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  return `10/${String(nextMonth).padStart(2, '0')}/${nextYear}`
}

export function buildRepasseContaDescricao(row: AdminRepasseProfissionalCompetenciaRow): string {
  return `Repasse plantões ${row.competencia} - ${row.pjRazaoSocial}`
}

function buildPlantoesResumo(row: AdminRepasseProfissionalCompetenciaRow) {
  return row.plantoes.map((plantao) => {
    const computed = computePlantaoRepasse(plantao)
    return {
      id: plantao.id,
      slotLabel: plantao.slotLabel,
      data: formatPlantaoTableDate(plantao.horarioPrevistoInicio),
      modalidade: plantao.repasseRule.modalidade,
      atendidos: plantao.atendidos,
      valorCalculadoCentavos: computed.valorCalculadoCentavos,
      elegibilidade: computed.elegibilidade,
      alertasResolvidos: Boolean(plantao.decisaoAnalista) || computed.alertas.length === 0,
    }
  })
}

export function resolveFornecedorForRepasse(
  fornecedores: AdminFornecedorRow[],
  pjCnpj: string,
  pjRazaoSocial: string,
): { fornecedorId: string; fornecedores: AdminFornecedorRow[] } {
  const digits = normalizeCnpj(pjCnpj)
  const match = fornecedores.find((f) => normalizeCnpj(f.cnpj) === digits)
  if (match) return { fornecedorId: match.id, fornecedores }

  const novo: AdminFornecedorRow = {
    id: `forn-repasse-${digits.slice(0, 8)}`,
    cnpj: pjCnpj,
    razaoSocial: pjRazaoSocial,
    situacao: 'ativa',
    contatoEmail: '',
    contatoTelefone: '',
    pessoaContato: '',
    observacoes: 'Gerado automaticamente pelo repasse de profissionais.',
  }
  return { fornecedorId: novo.id, fornecedores: [...fornecedores, novo] }
}

export function createRepasseDraftAndContaPagar(
  payload: RepasseCompetenciaAprovadaPayload,
  fornecedorId: string,
): { draft: AdminContaPagarRepasseDraft; contaPagar: AdminContaPagarRow } {
  // TODO(backend): POST aprovar deve persistir draft + conta e retornar repasseRule snapshot por plantão.
  const { competenciaRow, valorAprovadoCentavos, motivoAjuste } = payload
  const draftId = `repasse-draft-${competenciaRow.id}-${Date.now()}`
  const contaId = `cp-repasse-${competenciaRow.id}-${Date.now()}`

  const draft: AdminContaPagarRepasseDraft = {
    id: draftId,
    competenciaId: competenciaRow.id,
    contaPagarId: contaId,
    profissionalNome: competenciaRow.profissionalNome,
    pjRazaoSocial: competenciaRow.pjRazaoSocial,
    pjCnpj: competenciaRow.pjCnpj,
    competencia: competenciaRow.competencia,
    valorCalculadoCentavos: competenciaRow.valorCalculadoCentavos,
    valorAprovadoCentavos,
    valorNFCentavos: competenciaRow.valorNFCentavos,
    motivoAjuste: motivoAjuste?.trim() || null,
    nfFileName: competenciaRow.nfFileName,
    plantaoIds: competenciaRow.plantoes.map((p) => p.id),
    plantoesResumo: buildPlantoesResumo(competenciaRow),
    aprovadoEm: new Date().toISOString(),
  }

  const contaPagar: AdminContaPagarRow = {
    id: contaId,
    fornecedorId,
    descricao: buildRepasseContaDescricao(competenciaRow),
    centroCustoId: 'cc-medico',
    recorrencia: 'unica',
    valor: valorAprovadoCentavos / 100,
    vencimento: vencimentoFromCompetencia(competenciaRow.competencia),
    status: 'pendente',
    origem: 'repasse_profissional',
    repasseCompetenciaId: competenciaRow.id,
    repasseDraftId: draftId,
    repasseConferenciaStatus: 'pendente_conferencia',
  }

  drafts.set(draftId, draft)
  byCompetenciaId.set(competenciaRow.id, draftId)
  byContaPagarId.set(contaId, draftId)

  return { draft, contaPagar }
}

export function getRepasseDraftByContaPagarId(
  contaPagarId: string,
): AdminContaPagarRepasseDraft | null {
  const draftId = byContaPagarId.get(contaPagarId)
  if (!draftId) return null
  return drafts.get(draftId) ?? null
}

export function getRepasseDraftByCompetenciaId(
  competenciaId: string,
): AdminContaPagarRepasseDraft | null {
  const draftId = byCompetenciaId.get(competenciaId)
  if (!draftId) return null
  return drafts.get(draftId) ?? null
}

export function hasRepasseContaForCompetencia(competenciaId: string): boolean {
  return byCompetenciaId.has(competenciaId)
}
