import { Outlet } from 'react-router-dom'
import { UbtLgpdProvider } from '../contexts/UbtLgpdContext'
import { UbtNotificacoesProvider } from '../contexts/UbtNotificacoesContext'
import { UbtSuporteProvider } from '../contexts/UbtSuporteContext'

/** Envolve rotas UBT para estado compartilhado de notificações, suporte e LGPD. */
export function UbtNotificacoesProviderLayout() {
  return (
    <UbtLgpdProvider>
      <UbtNotificacoesProvider>
        <UbtSuporteProvider>
          <Outlet />
        </UbtSuporteProvider>
      </UbtNotificacoesProvider>
    </UbtLgpdProvider>
  )
}
