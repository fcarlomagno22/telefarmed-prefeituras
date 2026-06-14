import type { AdminClienteContratoTipo } from '../../types/adminClientes'

const PRESET_MODALIDADES = new Set<AdminClienteContratoTipo>([
  'mensal',
  'pacote_fechado',
  'sob_demanda',
])

export function resolveClienteContratoModalidade(
  tipoId: string,
  modalidade?: AdminClienteContratoTipo,
  label?: string,
): AdminClienteContratoTipo {
  if (modalidade) return modalidade
  if (PRESET_MODALIDADES.has(tipoId as AdminClienteContratoTipo)) {
    return tipoId as AdminClienteContratoTipo
  }

  const normalized = (label ?? tipoId).trim().toLowerCase()
  if (normalized.includes('mensal')) return 'mensal'
  if (normalized.includes('demanda') || normalized.includes('avulso')) return 'sob_demanda'
  return 'pacote_fechado'
}

export function isPacoteOuMensalModalidade(modalidade: AdminClienteContratoTipo) {
  return modalidade === 'mensal' || modalidade === 'pacote_fechado'
}
