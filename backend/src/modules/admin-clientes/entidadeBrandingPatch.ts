import { normalizeCorPrimariaHex } from '../../lib/entidadeBranding/color.js'
import type { TipoEntidade } from '../../lib/entidadeBranding/types.js'

type EntidadeBrandingInput = {
  tipoEntidade?: TipoEntidade
  corPrimaria?: string
  nomeMarca?: string
  terminologia?: Record<string, string>
}

export function buildEntidadeBrandingDbPatch(
  input: EntidadeBrandingInput,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {}

  if (input.tipoEntidade) {
    patch.tipo_entidade = input.tipoEntidade
  }

  if (input.corPrimaria !== undefined) {
    const normalized = normalizeCorPrimariaHex(input.corPrimaria)
    patch.cor_primaria = normalized
  }

  if (input.nomeMarca !== undefined) {
    const trimmed = input.nomeMarca.trim()
    patch.nome_marca = trimmed.length > 0 ? trimmed : null
  }

  if (input.terminologia !== undefined) {
    patch.terminologia = input.terminologia
  }

  return patch
}
