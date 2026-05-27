import { Outlet } from 'react-router-dom'
import { UbtNotificacoesProvider } from '../contexts/UbtNotificacoesContext'

/** Envolve rotas UBT para estado compartilhado de notificações (sidebar + página). */
export function UbtNotificacoesProviderLayout() {
  return (
    <UbtNotificacoesProvider>
      <Outlet />
    </UbtNotificacoesProvider>
  )
}
