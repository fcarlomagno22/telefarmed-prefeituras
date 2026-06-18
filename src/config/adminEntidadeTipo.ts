import type { TipoEntidade } from '../types/entidadeBranding'

export const adminEntidadeTipoOptions: {
  value: TipoEntidade
  label: string
  description: string
}[] = [
  {
    value: 'prefeitura',
    label: 'Prefeitura',
    description: 'Gestão municipal com regras de território e município contratante.',
  },
  {
    value: 'santa_casa',
    label: 'Santa Casa',
    description: 'Instituição hospitalar ou filantrópica.',
  },
  {
    value: 'generico',
    label: 'Genérico',
    description: 'Outro tipo de entidade contratante.',
  },
]

export const ENTIDADE_TIPO_SUBTITULO: Record<TipoEntidade, string> = {
  prefeitura: 'Prefeitura Municipal',
  santa_casa: 'Santa Casa',
  generico: 'Entidade contratante',
}

export function isPrefeituraEntidadeTipo(tipo: TipoEntidade | undefined): boolean {
  return (tipo ?? 'prefeitura') === 'prefeitura'
}

export function resolveEntidadeTipoLabel(tipo: TipoEntidade | undefined): string {
  return adminEntidadeTipoOptions.find((item) => item.value === (tipo ?? 'prefeitura'))?.label ?? 'Prefeitura'
}

export function getLocalidadeLabel(tipo: TipoEntidade | undefined): string {
  return isPrefeituraEntidadeTipo(tipo) ? 'Município' : 'Cidade'
}

export function resolveEntidadeTipoOrDefault(tipo: TipoEntidade | undefined): TipoEntidade {
  return tipo ?? 'prefeitura'
}

export function applyTipoEntidadePreset(
  current: {
    tipoEntidade: TipoEntidade
    subtitulo: string
    aceitaPacientesOutrosMunicipios: boolean
  },
  nextTipo: TipoEntidade,
): {
  tipoEntidade: TipoEntidade
  subtitulo: string
  aceitaPacientesOutrosMunicipios: boolean
} {
  const knownSubtitles = new Set(Object.values(ENTIDADE_TIPO_SUBTITULO))
  const trimmedSubtitle = current.subtitulo.trim()
  const shouldApplySubtitle =
    !trimmedSubtitle || knownSubtitles.has(trimmedSubtitle as (typeof ENTIDADE_TIPO_SUBTITULO)[TipoEntidade])

  return {
    tipoEntidade: nextTipo,
    subtitulo: shouldApplySubtitle ? ENTIDADE_TIPO_SUBTITULO[nextTipo] : current.subtitulo,
    aceitaPacientesOutrosMunicipios: isPrefeituraEntidadeTipo(nextTipo)
      ? current.aceitaPacientesOutrosMunicipios
      : false,
  }
}

export function resolveAceitaPacientesOutrosMunicipios(
  tipo: TipoEntidade | undefined,
  value: boolean,
): boolean {
  if (!isPrefeituraEntidadeTipo(tipo)) return true
  return value
}
