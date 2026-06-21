import { Outlet } from 'react-router-dom'
import { PortalCatalogPrefetch } from '../components/query/PortalCatalogPrefetch'
import { UbtLgpdProvider } from '../contexts/UbtLgpdContext'
import { UbtNotificacoesProvider } from '../contexts/UbtNotificacoesContext'
import { UbtSuporteProvider } from '../contexts/UbtSuporteContext'

/** Envolve rotas UBT para estado compartilhado de notificações, suporte e LGPD. */
export function UbtNotificacoesProviderLayout() {
  return (
    <UbtLgpdProvider>
      <UbtNotificacoesProvider>
        <UbtSuporteProvider>
          <PortalCatalogPrefetch portal="ubt" />
          <Outlet />
        </UbtSuporteProvider>
      </UbtNotificacoesProvider>
    </UbtLgpdProvider>
  )
}
