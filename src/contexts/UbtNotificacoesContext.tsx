import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import { isPrefeituraNotificationUnread } from '../components/prefeitura/notificacoes/prefeituraNotificacoesUi'
import {
  buildUbtNotificationsSeed,
  sanitizeUbtNotifications,
} from '../data/ubtNotificacoesMock'
import type { PrefeituraNotification } from '../data/prefeituraNotificacoesMock'

type UbtNotificacoesContextValue = {
  notifications: PrefeituraNotification[]
  setNotifications: Dispatch<SetStateAction<PrefeituraNotification[]>>
  hasUbtUnreadInbox: boolean
}

const UbtNotificacoesContext = createContext<UbtNotificacoesContextValue | null>(null)

export function UbtNotificacoesProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotificationsState] = useState(buildUbtNotificationsSeed)

  const setNotifications: Dispatch<SetStateAction<PrefeituraNotification[]>> = (action) => {
    setNotificationsState((prev) => {
      const next = typeof action === 'function' ? action(prev) : action
      return sanitizeUbtNotifications(next)
    })
  }

  const hasUbtUnreadInbox = useMemo(
    () => notifications.some(isPrefeituraNotificationUnread),
    [notifications],
  )

  const value = useMemo(
    () => ({
      notifications,
      setNotifications,
      hasUbtUnreadInbox,
    }),
    [notifications, hasUbtUnreadInbox],
  )

  return (
    <UbtNotificacoesContext.Provider value={value}>{children}</UbtNotificacoesContext.Provider>
  )
}

export function useUbtNotificacoesOptional() {
  return useContext(UbtNotificacoesContext)
}

export function useUbtUnreadInbox() {
  const context = useUbtNotificacoesOptional()
  return context?.hasUbtUnreadInbox ?? false
}

export function useUbtNotificationsState() {
  const context = useContext(UbtNotificacoesContext)
  if (!context) {
    throw new Error('useUbtNotificationsState must be used within UbtNotificacoesProvider')
  }
  return [context.notifications, context.setNotifications] as const
}
