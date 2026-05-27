import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import {
  prefeituraNotificacoes,
  type PrefeituraNotification,
} from '../data/prefeituraNotificacoesMock'
import { isPrefeituraNotificationUnread } from '../components/prefeitura/notificacoes/prefeituraNotificacoesUi'

type PrefeituraNotificacoesContextValue = {
  notifications: PrefeituraNotification[]
  setNotifications: Dispatch<SetStateAction<PrefeituraNotification[]>>
  hasGestorUnreadInbox: boolean
}

const PrefeituraNotificacoesContext = createContext<PrefeituraNotificacoesContextValue | null>(
  null,
)

export function PrefeituraNotificacoesProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState(prefeituraNotificacoes)

  const hasGestorUnreadInbox = useMemo(
    () => notifications.some(isPrefeituraNotificationUnread),
    [notifications],
  )

  const value = useMemo(
    () => ({
      notifications,
      setNotifications,
      hasGestorUnreadInbox,
    }),
    [notifications, hasGestorUnreadInbox],
  )

  return (
    <PrefeituraNotificacoesContext.Provider value={value}>
      {children}
    </PrefeituraNotificacoesContext.Provider>
  )
}

export function usePrefeituraNotificacoes() {
  const context = useContext(PrefeituraNotificacoesContext)
  if (!context) {
    throw new Error('usePrefeituraNotificacoes must be used within PrefeituraNotificacoesProvider')
  }
  return context
}

/** Para sidebar fora do provider (fallback seguro). */
export function usePrefeituraNotificacoesOptional() {
  return useContext(PrefeituraNotificacoesContext)
}

export function usePrefeituraGestorUnreadInbox() {
  const context = usePrefeituraNotificacoesOptional()
  return context?.hasGestorUnreadInbox ?? false
}

export function usePrefeituraNotificationsState() {
  const context = usePrefeituraNotificacoes()
  const setNotifications = useCallback(
    (action: SetStateAction<PrefeituraNotification[]>) => {
      context.setNotifications(action)
    },
    [context],
  )
  return [context.notifications, setNotifications] as const
}
