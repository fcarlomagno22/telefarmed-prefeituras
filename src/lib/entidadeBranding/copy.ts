import type { EntidadeTerminologia, TipoEntidade } from '../../types/entidadeBranding'
import { buildDefaultEntidadeBranding } from '../../types/entidadeBranding'
import {
  resolveSatisfacaoNpsLabel,
} from '../../utils/entidadeTerritoryPolicy'

/** Terminologia amigável para UI e exports dos portais prefeitura/UBT. */
export type EntidadeCopy = {
  rede: string
  gestao: string
  portal: string
  contrato: string
  operadorPlataforma: string
  satisfacaoPublico: string
  gestorPortal: string
  gestorPortalLabel: string
  satisfacaoNpsLabel: string
  /** "na {rede}" — ex.: "na rede municipal" */
  naRede: string
  /** "da {rede}" */
  daRede: string
  /** "Gestão municipal" → copy.gestao com capitalização de label */
  gestaoLabel: string
}

const DEFAULT_COPY = buildDefaultEntidadeBranding({ nomeExibicao: '' }).terminologia

function capitalizeLabel(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return trimmed
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

export function buildEntidadeCopy(
  terminologia?: Partial<EntidadeTerminologia> | null,
  entidadeTipo: TipoEntidade = 'prefeitura',
): EntidadeCopy {
  const merged: EntidadeTerminologia = { ...DEFAULT_COPY, ...terminologia }
  const rede = merged.rede.trim() || DEFAULT_COPY.rede
  const daRede = `da ${rede}`
  return {
    rede,
    gestao: merged.gestao.trim() || DEFAULT_COPY.gestao,
    portal: 'portal',
    contrato: merged.contrato.trim() || DEFAULT_COPY.contrato,
    operadorPlataforma: merged.operador_plataforma.trim() || DEFAULT_COPY.operador_plataforma,
    satisfacaoPublico: merged.satisfacao_publico.trim() || DEFAULT_COPY.satisfacao_publico,
    gestorPortal: 'gestor',
    gestorPortalLabel: 'Gestor',
    satisfacaoNpsLabel: resolveSatisfacaoNpsLabel(entidadeTipo, daRede),
    naRede: `na ${rede}`,
    daRede,
    gestaoLabel: capitalizeLabel(merged.gestao.trim() || DEFAULT_COPY.gestao),
  }
}

/** Substitui termos municipais/prefeitura e marca da plataforma em textos de export. */
export function applyEntidadeCopyReplacements(
  text: string,
  copy: EntidadeCopy,
  platformOperatorLabel: string,
): string {
  const pairs: Array<[string, string]> = [
    ['Telefarmed', platformOperatorLabel],
    ['rede municipal', copy.rede],
    ['Rede municipal', capitalizeLabel(copy.rede)],
    ['gestão municipal', copy.gestao],
    ['Gestão municipal', copy.gestaoLabel],
    ['portal municipal', copy.portal],
    ['Portal municipal', capitalizeLabel(copy.portal)],
    ['contrato municipal', copy.contrato],
    ['Contrato municipal', capitalizeLabel(copy.contrato)],
    ['Painel municipal', capitalizeLabel(copy.portal)],
    ['auditoria municipal', `auditoria da ${copy.gestao}`],
    ['base municipal', `base da ${copy.rede}`],
    ['satisfação do cidadão', copy.satisfacaoPublico],
    ['Satisfação do cidadão', capitalizeLabel(copy.satisfacaoPublico)],
    ['NPS da rede', copy.satisfacaoNpsLabel],
    ['gestor municipal', copy.gestorPortal],
    ['Gestor municipal', copy.gestorPortalLabel],
    ['gestor da instituição', copy.gestorPortal],
    ['Gestor da instituição', copy.gestorPortalLabel],
    ['gestor administrativo', copy.gestorPortal],
    ['Gestor administrativo', copy.gestorPortalLabel],
    ['portal administrativo', copy.portal],
    ['Portal administrativo', capitalizeLabel(copy.portal)],
    ['portal de gestão', copy.portal],
    ['Portal de gestão', capitalizeLabel(copy.portal)],
  ]

  let result = text
  for (const [from, to] of pairs) {
    if (from && to && from !== to) {
      result = result.split(from).join(to)
    }
  }
  return result
}

export function evolucaoNaRede(
  copy: EntidadeCopy,
  mode: 'daily' | 'monthly',
  subject: string,
): string {
  const periodo = mode === 'monthly' ? 'mensal' : 'diária'
  return `Evolução ${periodo} ${subject} ${copy.naRede}.`
}
