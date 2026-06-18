import { resolveEntidadeTipoOrDefault } from '../../../config/adminEntidadeTipo'
import type { AdminClienteRow } from '../../../types/adminClientes'
import type { UpdateEntidadePayload } from '../../../lib/api/admin/clientes'

export function buildEntidadeIdentityFields(cliente: AdminClienteRow) {
  return {
    nome: cliente.prefeitura,
    subtitulo: cliente.subtitle,
    razaoSocial: cliente.razaoSocial,
    cnpj: cliente.cnpj,
    municipio: cliente.municipio,
    uf: cliente.uf,
    tipoEntidade: resolveEntidadeTipoOrDefault(cliente.tipoEntidade),
  }
}

export type EntidadeBrandingEditChanges = {
  logoDataUrl?: string
  loginBackgroundDataUrl?: string
  faviconDataUrl?: string
  corPrimaria?: string
}

export function buildEntidadeBrandingUpdatePayload(
  cliente: AdminClienteRow,
  changes: EntidadeBrandingEditChanges,
): Omit<UpdateEntidadePayload, 'pin'> {
  return {
    ...buildEntidadeIdentityFields(cliente),
    ...(changes.corPrimaria ? { corPrimaria: changes.corPrimaria } : {}),
    ...(changes.logoDataUrl ? { logoDataUrl: changes.logoDataUrl } : {}),
    ...(changes.loginBackgroundDataUrl
      ? { loginBackgroundDataUrl: changes.loginBackgroundDataUrl }
      : {}),
    ...(changes.faviconDataUrl ? { faviconDataUrl: changes.faviconDataUrl } : {}),
  }
}
