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
  buildProfissionalNotificationsSeed,
  sanitizeProfissionalNotifications,
} from '../data/profissionalNotificacoesMock'
import type { PrefeituraNotification } from '../data/prefeituraNotificacoesMock'

type ProfissionalNotificacoesContextValue = {
  notifications: PrefeituraNotification[]
  setNotifications: Dispatch<SetStateAction<PrefeituraNotification[]>>
  hasProfissionalUnreadInbox: boolean
}

const ProfissionalNotificacoesContext = createContext<ProfissionalNotificacoesContextValue | null>(
  null,
)

export function ProfissionalNotificacoesProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotificationsState] = useState(buildProfissionalNotificationsSeed)

  const setNotifications: Dispatch<SetStateAction<PrefeituraNotification[]>> = (action) => {
    setNotificationsState((prev) => {
      const next = typeof action === 'function' ? action(prev) : action
      return sanitizeProfissionalNotifications(next)
    })
  }

  const hasProfissionalUnreadInbox = useMemo(
    () => notifications.some(isPrefeituraNotificationUnread),
    [notifications],
  )

  const value = useMemo(
    () => ({
      notifications,
      setNotifications,
      hasProfissionalUnreadInbox,
    }),
    [notifications, hasProfissionalUnreadInbox],
  )

  return (
    <ProfissionalNotificacoesContext.Provider value={value}>
      {children}
    </ProfissionalNotificacoesContext.Provider>
  )
}

export function useProfissionalNotificacoesOptional() {
  return useContext(ProfissionalNotificacoesContext)
}

export function useProfissionalUnreadInbox() {
  const context = useProfissionalNotificacoesOptional()
  return context?.hasProfissionalUnreadInbox ?? false
}

export function useProfissionalNotificationsState() {
  const context = useContext(ProfissionalNotificacoesContext)
  if (!context) {
    throw new Error('useProfissionalNotificationsState must be used within ProfissionalNotificacoesProvider')
  }
  return [context.notifications, context.setNotifications] as const
}
