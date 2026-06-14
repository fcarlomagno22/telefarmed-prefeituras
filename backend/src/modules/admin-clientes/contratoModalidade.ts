import type { AdminClienteContratoTipo } from './types.js'

const PRESET_MODALIDADES = new Set<AdminClienteContratoTipo>([
  'mensal',
  'pacote_fechado',
  'sob_demanda',
])

export function resolveContratoModalidade(
  tipoId: string,
  nome?: string | null,
): AdminClienteContratoTipo {
  if (PRESET_MODALIDADES.has(tipoId as AdminClienteContratoTipo)) {
    return tipoId as AdminClienteContratoTipo
  }

  const normalized = (nome ?? tipoId).trim().toLowerCase()
  if (normalized.includes('mensal')) return 'mensal'
  if (normalized.includes('demanda') || normalized.includes('avulso')) return 'sob_demanda'
  return 'pacote_fechado'
}
