import {
  ENTIDADE_TERMINOLOGIA_KEYS,
  type EntidadeTerminologia,
  type EntidadeTerminologiaKey,
  type TipoEntidade,
} from './types.js'

const TERMINOLOGY_BY_TIPO: Record<TipoEntidade, EntidadeTerminologia> = {
  prefeitura: {
    rede: 'rede municipal',
    gestao: 'gestão municipal',
    portal_gestao: 'portal',
    contrato: 'contrato municipal',
    operador_plataforma: 'operadora da plataforma',
    satisfacao_publico: 'satisfação do cidadão',
  },
  santa_casa: {
    rede: 'rede institucional',
    gestao: 'gestão institucional',
    portal_gestao: 'portal',
    contrato: 'contrato institucional',
    operador_plataforma: 'operadora da plataforma',
    satisfacao_publico: 'satisfação do paciente',
  },
  generico: {
    rede: 'rede',
    gestao: 'gestão',
    portal_gestao: 'portal',
    contrato: 'contrato',
    operador_plataforma: 'operadora da plataforma',
    satisfacao_publico: 'satisfação do público',
  },
}

function isTerminologiaKey(key: string): key is EntidadeTerminologiaKey {
  return (ENTIDADE_TERMINOLOGIA_KEYS as readonly string[]).includes(key)
}

export function resolveEntidadeTerminologia(
  tipo: TipoEntidade,
  overrides: unknown,
): EntidadeTerminologia {
  const base = { ...TERMINOLOGY_BY_TIPO[tipo] }

  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) {
    return base
  }

  for (const [key, value] of Object.entries(overrides as Record<string, unknown>)) {
    if (!isTerminologiaKey(key)) continue
    if (typeof value !== 'string') continue
    const trimmed = value.trim()
    if (trimmed) {
      base[key] = trimmed
    }
  }

  return base
}

export function parseTipoEntidade(value: unknown): TipoEntidade {
  if (value === 'prefeitura' || value === 'santa_casa' || value === 'generico') {
    return value
  }
  return 'prefeitura'
}
