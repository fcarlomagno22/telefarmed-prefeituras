import { useCallback, useMemo, useState } from 'react'
import type { AccessCredentialUser } from '../../data/accessCredentialsMock'
import { Toast } from '../ui/Toast'
import { AccessCredentialActionsPopover } from './AccessCredentialActionsPopover'
import { AccessLevelBadge, CredentialStatusBadge } from './accessCredentialBadges'
import {
  prefeituraCredentialsUbtOptions,
  transferAccessCredentialToUbt,
} from '../../data/prefeituraAccessCredentialsMock'
import {
  CredentialActionPinModal,
  type CredentialPinAction,
} from './CredentialActionPinModal'
import { TransferCredentialUbtModal } from './TransferCredentialUbtModal'
import type { useAccessCredentialUserDrawer } from '../../hooks/useAccessCredentialUserDrawer'

type PendingCredentialAction = {
  type: CredentialPinAction
  user: AccessCredentialUser
  transferTargetUbtId?: string
  transferTargetUbtName?: string
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export type AccessCredentialsMainPanelProps = {
  userDrawer: Pick<
    ReturnType<typeof useAccessCredentialUserDrawer>,
    'openEdit' | 'openView' | 'users' | 'setUsers'
  >
}

export function AccessCredentialsMainPanel({ userDrawer }: AccessCredentialsMainPanelProps) {
  const { openEdit, openView, users, setUsers } = userDrawer
  const [menuUserId, setMenuUserId] = useState<string | null>(null)
  const [transferUser, setTransferUser] = useState<AccessCredentialUser | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingCredentialAction | null>(null)
  const [toast, setToast] = useState<{ message: string } | null>(null)

  const showSuccessToast = useCallback((message: string) => {
    setToast(null)
    requestAnimationFrame(() => setToast({ message }))
  }, [])

  const closeMenu = useCallback(() => setMenuUserId(null), [])

  const totalUsers = users.length

  function requestDeactivateUser(user: AccessCredentialUser) {
    if (user.status === 'inativo') {
      closeMenu()
      showSuccessToast('Usuário já está bloqueado.')
      return
    }
    closeMenu()
    setPendingAction({ type: 'deactivate', user })
  }

  function requestEditUser(user: AccessCredentialUser) {
    closeMenu()
    setPendingAction({ type: 'edit', user })
  }

  function requestDeleteUser(user: AccessCredentialUser) {
    closeMenu()
    setPendingAction({ type: 'delete', user })
  }

  function requestTransferUbt(user: AccessCredentialUser) {
    closeMenu()
    setTransferUser(user)
  }

  function confirmTransferUbt(targetUbtId: string, targetUbtName: string) {
    if (!transferUser) return
    const user = transferUser
    setTransferUser(null)
    setPendingAction({
      type: 'transfer_ubt',
      user,
      transferTargetUbtId: targetUbtId,
      transferTargetUbtName: targetUbtName,
    })
  }

  function executePendingAction() {
    if (!pendingAction) return

    const { type, user } = pendingAction

    if (type === 'edit') {
      openEdit(user)
      setPendingAction(null)
      return
    }

    if (type === 'transfer_ubt' && pendingAction.transferTargetUbtId) {
      try {
        const transferred = transferAccessCredentialToUbt(
          user,
          pendingAction.transferTargetUbtId,
        )
        setUsers((prev) =>
          prev.map((item) => (item.id === user.id ? transferred : item)),
        )
        showSuccessToast(
          `Usuário transferido para ${pendingAction.transferTargetUbtName ?? transferred.ubtName}.`,
        )
      } catch {
        showSuccessToast('UBT de destino inválida.')
      }
      setPendingAction(null)
      return
    }

    if (type === 'deactivate') {
      setUsers((prev) =>
        prev.map((item) => (item.id === user.id ? { ...item, status: 'inativo' } : item)),
      )
      showSuccessToast('Usuário bloqueado com sucesso.')
    } else {
      setUsers((prev) => prev.filter((item) => item.id !== user.id))
      showSuccessToast('Usuário excluído com sucesso.')
    }

    setPendingAction(null)
  }

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [users],
  )

  return (
    <>
      <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full table-fixed border-collapse text-left">
              <colgroup>
                <col className="w-[30%]" />
                <col className="w-[22%]" />
                <col className="w-[20%]" />
                <col className="w-[14%]" />
                <col className="w-[14%]" />
              </colgroup>
              <thead className="sticky top-0 z-10 bg-gray-50">
                <tr className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3.5 text-left sm:px-6">Usuário</th>
                  <th className="px-3 py-3.5 text-center">Função</th>
                  <th className="px-3 py-3.5 text-center">Nível de acesso</th>
                  <th className="px-3 py-3.5 text-center">Status</th>
                  <th className="px-3 py-3.5 text-center sm:px-6">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {sortedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center text-sm text-gray-500 sm:px-6">
                      Nenhum usuário cadastrado. Clique em &quot;Novo usuário&quot; para começar.
                    </td>
                  </tr>
                ) : null}
                {sortedUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="align-middle text-sm text-gray-700 hover:bg-gray-50/80"
                  >
                    <td className="px-5 py-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt=""
                            loading="lazy"
                            className="h-10 w-10 shrink-0 rounded-full border border-gray-200 object-cover shadow-sm"
                          />
                        ) : (
                          <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${user.avatarClassName}`}
                          >
                            {user.initials}
                          </span>
                        )}
                        <span className="min-w-0">
                          <span className="block font-semibold text-gray-900">{user.name}</span>
                          <span className="mt-0.5 block truncate text-xs text-gray-500">
                            {user.email}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center align-middle text-gray-700">
                      {user.role}
                    </td>
                    <td className="px-3 py-4 align-middle">
                      <div className="flex justify-center">
                        <AccessLevelBadge level={user.accessLevel} />
                      </div>
                    </td>
                    <td className="px-3 py-4 align-middle">
                      <div className="flex justify-center">
                        <CredentialStatusBadge status={user.status} />
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center align-middle sm:px-6">
                      <AccessCredentialActionsPopover
                        user={user}
                        open={menuUserId === user.id}
                        onToggle={() =>
                          setMenuUserId((current) => (current === user.id ? null : user.id))
                        }
                        onClose={closeMenu}
                        onView={() => {
                          closeMenu()
                          openView(user)
                        }}
                        onEdit={() => requestEditUser(user)}
                        onTransferUbt={() => requestTransferUbt(user)}
                        onDeactivate={() => requestDeactivateUser(user)}
                        onDelete={() => requestDeleteUser(user)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <footer className="flex shrink-0 border-t border-gray-200 px-5 py-4 sm:px-6">
            <p className="text-xs text-gray-500">
              {totalUsers === 0
                ? 'Nenhum usuário cadastrado'
                : `Mostrando 1 a ${formatNumber(totalUsers)} de ${formatNumber(totalUsers)} usuário${totalUsers === 1 ? '' : 's'}`}
            </p>
          </footer>
        </div>
      </section>

      <TransferCredentialUbtModal
        open={transferUser !== null}
        user={transferUser}
        ubtOptions={prefeituraCredentialsUbtOptions}
        onClose={() => setTransferUser(null)}
        onConfirm={confirmTransferUbt}
      />

      <CredentialActionPinModal
        open={pendingAction !== null}
        action={pendingAction?.type ?? null}
        userName={pendingAction?.user.name ?? ''}
        transferTargetUbtName={pendingAction?.transferTargetUbtName}
        onClose={() => setPendingAction(null)}
        onSuccess={executePendingAction}
      />

      <Toast message={toast?.message ?? ''} visible={toast !== null} onClose={() => setToast(null)} />
    </>
  )
}
