import { useMemo } from 'react'
import { buildEntidadeCopy, type EntidadeCopy } from '../lib/entidadeBranding/copy'
import { useEntidadeBranding } from '../contexts/EntidadeBrandingContext'
import type { EntidadeTerminologiaKey, TipoEntidade } from '../types/entidadeBranding'

export type UseEntidadeCopyResult = EntidadeCopy & {
  /** Acesso por chave bruta da terminologia (legado). */
  get: (key: EntidadeTerminologiaKey) => string
  platformOperatorLabel: string
  entidadeTipo: TipoEntidade
}

export function useEntidadeCopy(): UseEntidadeCopyResult {
  const { terminologia, platformOperatorLabel, branding } = useEntidadeBranding()
  const entidadeTipo = branding?.entidadeTipo ?? 'prefeitura'

  return useMemo(() => {
    const copy = buildEntidadeCopy(terminologia, entidadeTipo)
    return {
      ...copy,
      entidadeTipo,
      get: (key: EntidadeTerminologiaKey) => terminologia[key],
      platformOperatorLabel,
    }
  }, [entidadeTipo, platformOperatorLabel, terminologia])
}

export function usePlatformOperatorLabel(): string {
  return useEntidadeBranding().platformOperatorLabel
}
