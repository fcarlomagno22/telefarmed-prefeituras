import type { QueryClient } from '@tanstack/react-query'
import type { PortalId } from '../../config/portals'

/** Remove dados de sessão cacheados ao fazer logout. */
export function clearPortalSessionQueries(
  queryClient: QueryClient,
  portal: Extract<PortalId, 'profissional' | 'prefeitura' | 'ubt' | 'admin'>,
) {
  if (portal === 'profissional') {
    void queryClient.removeQueries({ queryKey: ['profissional'] })
    void queryClient.removeQueries({ queryKey: ['portal', 'suporte', 'profissional'] })
    return
  }

  if (portal === 'prefeitura') {
    void queryClient.removeQueries({ queryKey: ['prefeitura-units'] })
    void queryClient.removeQueries({ queryKey: ['prefeitura-rede-overview'] })
    void queryClient.removeQueries({ queryKey: ['prefeitura-ubt-options'] })
    void queryClient.removeQueries({ queryKey: ['prefeitura-contrato-specialty-ids'] })
    void queryClient.removeQueries({ queryKey: ['portal', 'suporte', 'prefeitura'] })
    return
  }

  if (portal === 'ubt') {
    void queryClient.removeQueries({ queryKey: ['ubt-triagem-specialties'] })
    void queryClient.removeQueries({ queryKey: ['portal', 'suporte', 'ubt'] })
    return
  }

  void queryClient.removeQueries({ queryKey: ['admin-clinico-catalog'] })
  void queryClient.removeQueries({ queryKey: ['contrato-catalog'] })
  void queryClient.removeQueries({ queryKey: ['admin-ubt-options'] })
  void queryClient.removeQueries({ queryKey: ['portal', 'suporte', 'admin'] })
}
