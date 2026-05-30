import { useCallback, useMemo, useState } from 'react'
import { AccessCredentialUserDrawer } from '../components/credenciais/AccessCredentialUserDrawer'
import {
  CredentialActionPinModal,
  type CredentialPinAction,
} from '../components/credenciais/CredentialActionPinModal'
import type { AccessCredentialUser } from '../data/accessCredentialsMock'
import type { AdminOperatorRow, AdminOperatorScope } from '../data/adminOperadoresMock'
import {
  enrichPrefeituraCredentialUser,
  isResponsibleUbtRole,
  transferAccessCredentialToUbt,
  type PrefeituraCredentialUbtOption,
} from '../data/prefeituraAccessCredentialsMock'
import { Toast } from '../components/ui/Toast'
import {
  activatePortalCredential,
  createPortalCredential,
  deactivatePortalCredential,
  deletePortalCredential,
  isCredenciaisApiError,
  transferPortalCredentialUbt,
  updatePortalCredential,
  verifyPortalResponsiblePin,
} from '../lib/api/adminCredenciaisApi'
import { AdminAuthApiError, verifyAdminAuthorizationPin } from '../lib/api/adminAuthApi'

type PendingPinAction = {
  type: CredentialPinAction
  user: AdminOperatorRow
  transferTargetUbtId?: string
  transferTargetUbtName?: string
}

type ContractingEntityOption = {
  value: string
  label: string
}

type UseAdminOperatorUserDrawerOptions = {
  defaultScope?: AdminOperatorScope
  skipPasswordOnCreate?: boolean
  getAccessToken?: () => string | null
  onDataChanged?: () => Promise<void>
  contractingEntityOptionsFromApi?: ContractingEntityOption[]
  /** PIN do admin logado (credenciais) ou do responsável UBT (prefeitura). */
  pinAudience?: 'admin' | 'portal'
}

function syncAdminOperatorRow(
  user: AccessCredentialUser,
  existing: AdminOperatorRow,
): AdminOperatorRow {
  return {
    ...existing,
    ...user,
    profileLabel: user.role,
    unitName: user.ubtName ?? existing.unitName,
  }
}

function demoteOtherResponsibles(
  rows: AdminOperatorRow[],
  ubtId: string,
  keepUserId: string,
) {
  return rows.map((row) => {
    if (row.ubtId !== ubtId || row.id === keepUserId || !row.isUbtResponsible) {
      return row
    }
    return {
      ...row,
      isUbtResponsible: false,
      role: row.role === 'Responsável pela UBT' ? 'Gestor da UBT' : row.role,
      profileLabel: row.role === 'Responsável pela UBT' ? 'Gestor da UBT' : row.profileLabel,
    }
  })
}

export function useAdminOperatorUserDrawer(
  rows: AdminOperatorRow[],
  onRowsChange: (rows: AdminOperatorRow[]) => void,
  ubtOptions: PrefeituraCredentialUbtOption[],
  options?: UseAdminOperatorUserDrawerOptions,
) {
  const defaultScope = options?.defaultScope ?? 'UBT'
  const skipPasswordOnCreate = options?.skipPasswordOnCreate ?? true
  const getAccessToken = options?.getAccessToken
  const onDataChanged = options?.onDataChanged
  const pinAudience = options?.pinAudience ?? 'portal'
  const useApi = Boolean(getAccessToken)

  const contractingEntityOptions = useMemo(() => {
    if (options?.contractingEntityOptionsFromApi?.length) {
      return options.contractingEntityOptionsFromApi
    }

    const map = new Map<string, AdminOperatorRow['contractingEntity']>()
    for (const row of rows) {
      map.set(row.contractingEntity.id, row.contractingEntity)
    }
    return Array.from(map.values()).map((entity) => ({
      value: entity.id,
      label: `${entity.razaoSocial} · ${entity.municipality}/${entity.uf}`,
    }))
  }, [options?.contractingEntityOptionsFromApi, rows])

  const ubtOptionsByContractingEntityId = useMemo(() => {
    const map: Record<string, PrefeituraCredentialUbtOption[]> = {}
    for (const entity of contractingEntityOptions) {
      map[entity.value] = ubtOptions.filter(
        (option) => option.contractingEntityId === entity.value || !option.contractingEntityId,
      )
    }

    if (contractingEntityOptions.length === 0) return map

    if (ubtOptions.some((option) => option.contractingEntityId)) {
      return map
    }

    ubtOptions.forEach((option, index) => {
      const target = contractingEntityOptions[index % contractingEntityOptions.length]!
      if (!map[target.value]) map[target.value] = []
      map[target.value]!.push(option)
    })

    return map
  }, [contractingEntityOptions, ubtOptions])

  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [editingUser, setEditingUser] = useState<AccessCredentialUser | null>(null)
  const [drawerMode, setDrawerMode] = useState<
    'create' | 'edit' | 'edit_permissions' | 'view'
  >('view')
  const [pendingPin, setPendingPin] = useState<PendingPinAction | null>(null)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(
    null,
  )

  const openCreate = useCallback(() => {
    setEditingUser(null)
    setDrawerMode('create')
    setClosing(false)
    setOpen(true)
  }, [])

  const openView = useCallback((user: AdminOperatorRow) => {
    setEditingUser(user)
    setDrawerMode('view')
    setClosing(false)
    setOpen(true)
  }, [])

  const openEdit = useCallback((user: AdminOperatorRow) => {
    setEditingUser(user)
    setDrawerMode('edit')
    setClosing(false)
    setOpen(true)
  }, [])

  const requestPinAction = useCallback(
    (
      type: CredentialPinAction,
      user: AdminOperatorRow,
      extras?: { transferTargetUbtId: string; transferTargetUbtName: string },
    ) => {
      setPendingPin({ type, user, ...extras })
    },
    [],
  )

  const requestClose = useCallback(() => {
    setClosing(true)
  }, [])

  const handleTransitionEnd = useCallback(() => {
    if (closing) {
      setOpen(false)
      setClosing(false)
      setEditingUser(null)
      setDrawerMode('create')
    }
  }, [closing])

  const executePinAction = useCallback(async () => {
    if (!pendingPin) return

    const { type, user, transferTargetUbtId, transferTargetUbtName } = pendingPin
    setPendingPin(null)

    if (type === 'edit') {
      openEdit(user)
      return
    }

    if (type === 'edit_permissions') {
      setEditingUser(user)
      setDrawerMode('edit_permissions')
      setClosing(false)
      setOpen(true)
      setToast({ message: 'Permissões liberadas para edição.', variant: 'success' })
      return
    }

    const token = getAccessToken?.()

    if (useApi && token) {
      try {
        if (type === 'transfer_ubt' && transferTargetUbtId) {
          const saved = await transferPortalCredentialUbt(token, user.id, transferTargetUbtId)
          onRowsChange(rows.map((row) => (row.id === user.id ? saved : row)))
          if (open && editingUser?.id === user.id) setEditingUser(saved)
          setToast({
            message: `Usuário transferido para ${transferTargetUbtName ?? saved.ubtName}.`,
            variant: 'success',
          })
        } else if (type === 'deactivate') {
          const saved = await deactivatePortalCredential(token, user.id)
          onRowsChange(rows.map((row) => (row.id === user.id ? saved : row)))
          if (open && editingUser?.id === user.id) setClosing(true)
          setToast({ message: 'Usuário bloqueado com sucesso.', variant: 'success' })
        } else if (type === 'reactivate') {
          const saved = await activatePortalCredential(token, user.id)
          onRowsChange(rows.map((row) => (row.id === user.id ? saved : row)))
          if (open && editingUser?.id === user.id) {
            setEditingUser(saved)
          }
          setToast({
            message: 'Usuário desbloqueado. O acesso ao painel foi liberado.',
            variant: 'success',
          })
        } else if (type === 'delete') {
          await deletePortalCredential(token, user.id)
          onRowsChange(rows.filter((row) => row.id !== user.id))
          if (open && editingUser?.id === user.id) setClosing(true)
          setToast({ message: 'Usuário excluído com sucesso.', variant: 'success' })
        }
        await onDataChanged?.()
      } catch (error) {
        const message = isCredenciaisApiError(error)
          ? error.message
          : 'Não foi possível concluir a operação.'
        setToast({ message, variant: 'error' })
      }
      return
    }

    if (type === 'transfer_ubt' && transferTargetUbtId) {
      try {
        const transferred = transferAccessCredentialToUbt(user, transferTargetUbtId)
        onRowsChange(
          rows.map((row) =>
            row.id === user.id ? syncAdminOperatorRow(transferred, row) : row,
          ),
        )
        if (open && editingUser?.id === user.id) {
          setEditingUser(transferred)
        }
        setToast({
          message: `Usuário transferido para ${transferTargetUbtName ?? transferred.ubtName}.`,
          variant: 'success',
        })
      } catch {
        setToast({ message: 'UBT de destino inválida.', variant: 'error' })
      }
      return
    }

    if (type === 'deactivate') {
      onRowsChange(
        rows.map((row) => (row.id === user.id ? { ...row, status: 'inativo' } : row)),
      )
      if (open && editingUser?.id === user.id) setClosing(true)
      setToast({ message: 'Usuário bloqueado com sucesso.', variant: 'success' })
      return
    }

    if (type === 'reactivate') {
      onRowsChange(
        rows.map((row) => (row.id === user.id ? { ...row, status: 'ativo' } : row)),
      )
      if (open && editingUser?.id === user.id) {
        setEditingUser({ ...user, status: 'ativo' })
      }
      setToast({
        message: 'Usuário desbloqueado. O acesso ao painel foi liberado.',
        variant: 'success',
      })
      return
    }

    onRowsChange(rows.filter((row) => row.id !== user.id))
    if (open && editingUser?.id === user.id) setClosing(true)
    setToast({ message: 'Usuário excluído com sucesso.', variant: 'success' })
  }, [
    editingUser?.id,
    getAccessToken,
    onDataChanged,
    onRowsChange,
    open,
    openEdit,
    pendingPin,
    rows,
    useApi,
  ])

  const handleSave = useCallback(
    async (
      user: AccessCredentialUser,
      meta?: {
        contractingEntityId?: string
        password?: string
        authorizationPin?: string | null
      },
    ) => {
      const existing = rows.find((row) => row.id === user.id)
      const ubtId = user.ubtId ?? existing?.ubtId
      if (!ubtId) {
        setToast({ message: 'Selecione uma UBT válida para o usuário.', variant: 'error' })
        return
      }

      const isResponsible = user.isUbtResponsible ?? isResponsibleUbtRole(user.role)
      const token = getAccessToken?.()

      if (useApi && token) {
        try {
          const ubtOption = ubtOptions.find((option) => option.value === ubtId)
          const contractingEntityId =
            meta?.contractingEntityId ??
            existing?.contractingEntity.id ??
            ubtOption?.contractingEntityId ??
            contractingEntityOptions[0]?.value

          if (!contractingEntityId) {
            setToast({
              message: 'Selecione a entidade contratante do usuário.',
              variant: 'error',
            })
            return
          }

          if (!existing) {
            if (!meta?.password) {
              setToast({ message: 'Informe a senha de acesso.', variant: 'error' })
              return
            }

            const saved = await createPortalCredential(token, {
              scope: defaultScope,
              name: user.name,
              email: user.email,
              role: user.role,
              accessLevel: user.accessLevel,
              status: user.status,
              contractingEntityId,
              ubtId: defaultScope === 'UBT' ? ubtId : ubtId,
              isUbtResponsible: isResponsible,
              pagePermissions: user.pagePermissions,
              password: meta.password,
              authorizationPin: meta.authorizationPin ?? undefined,
            })

            onRowsChange(
              demoteOtherResponsibles([...rows, saved], saved.ubtId ?? ubtId, saved.id),
            )
            setClosing(true)
            setToast({ message: 'Operador cadastrado com sucesso.', variant: 'success' })
            await onDataChanged?.()
            return
          }

          const saved = await updatePortalCredential(token, user.id, {
            name: user.name,
            email: user.email,
            role: user.role,
            accessLevel: user.accessLevel,
            status: user.status,
            contractingEntityId,
            ubtId,
            isUbtResponsible: isResponsible,
            pagePermissions: user.pagePermissions,
            password: meta?.password,
            authorizationPin: meta?.authorizationPin,
          })

          onRowsChange(
            demoteOtherResponsibles(
              rows.map((row) => (row.id === saved.id ? saved : row)),
              saved.ubtId ?? ubtId,
              saved.id,
            ),
          )
          setClosing(true)
          setToast({
            message:
              drawerMode === 'edit_permissions'
                ? 'Permissões atualizadas com sucesso.'
                : 'Usuário atualizado com sucesso.',
            variant: 'success',
          })
          await onDataChanged?.()
        } catch (error) {
          const message = isCredenciaisApiError(error)
            ? error.message
            : 'Não foi possível salvar o usuário.'
          setToast({ message, variant: 'error' })
        }
        return
      }

      try {
        const enriched = enrichPrefeituraCredentialUser(user, ubtId, isResponsible)

        if (!existing) {
          const ubtOption = ubtOptions.find((option) => option.value === ubtId)
          const selectedEntity =
            (meta?.contractingEntityId
              ? rows.find((row) => row.contractingEntity.id === meta.contractingEntityId)
                  ?.contractingEntity
              : null) ?? rows[0]?.contractingEntity ?? {
              id: `ent-op-new-${enriched.id}`,
              razaoSocial: 'Prefeitura Municipal',
              municipality: 'São José dos Campos',
              uf: 'SP',
            }
          const newRow: AdminOperatorRow = {
            ...enriched,
            scope: defaultScope,
            unitName: enriched.ubtName ?? ubtOption?.ubtName ?? 'UBT não identificada',
            contractingEntity: selectedEntity,
            lastAccessLabel: 'Nunca',
            profileLabel: enriched.role,
          }

          onRowsChange(
            demoteOtherResponsibles([...rows, newRow], newRow.ubtId, newRow.id),
          )
          setClosing(true)
          setToast({ message: 'Operador cadastrado com sucesso.', variant: 'success' })
          return
        }

        const updated = syncAdminOperatorRow(enriched, existing)

        onRowsChange(
          demoteOtherResponsibles(
            rows.map((row) => (row.id === updated.id ? updated : row)),
            updated.ubtId,
            updated.id,
          ),
        )

        setClosing(true)
        setToast({
          message:
            drawerMode === 'edit_permissions'
              ? 'Permissões atualizadas com sucesso.'
              : 'Usuário atualizado com sucesso.',
          variant: 'success',
        })
      } catch {
        setToast({
          message: 'Selecione uma UBT válida para o usuário.',
          variant: 'error',
        })
      }
    },
    [
      contractingEntityOptions,
      defaultScope,
      drawerMode,
      getAccessToken,
      onDataChanged,
      onRowsChange,
      rows,
      ubtOptions,
      useApi,
    ],
  )

  const verifyActionPin = useCallback(
    async (pin: string) => {
      if (!pendingPin || !useApi) return false
      const token = getAccessToken?.()
      if (!token) return false

      try {
        if (pinAudience === 'admin') {
          await verifyAdminAuthorizationPin(token, pin)
        } else {
          await verifyPortalResponsiblePin(token, pendingPin.user.id, pin)
        }
        return true
      } catch (error) {
        if (error instanceof AdminAuthApiError && error.code === 'PIN_NOT_CONFIGURED') {
          setToast({ message: error.message, variant: 'error' })
          setPendingPin(null)
        }
        return false
      }
    },
    [getAccessToken, pendingPin, pinAudience, useApi],
  )

  const dismissToast = useCallback(() => setToast(null), [])

  const drawerElement = (
    <>
      <AccessCredentialUserDrawer
        open={open}
        closing={closing}
        mode={drawerMode}
        editingUser={editingUser}
        municipalConfig={{
          ubtOptions,
          contractingEntityOptions,
          ubtOptionsByContractingEntityId,
          skipPasswordOnCreate,
        }}
        onClose={requestClose}
        onTransitionEnd={handleTransitionEnd}
        onSave={handleSave}
      />
      <CredentialActionPinModal
        open={pendingPin !== null}
        action={pendingPin?.type ?? null}
        userName={pendingPin?.user.name ?? ''}
        transferTargetUbtName={pendingPin?.transferTargetUbtName}
        pinAudience={pinAudience}
        onClose={() => setPendingPin(null)}
        onSuccess={() => void executePinAction()}
        verifyPin={useApi ? verifyActionPin : undefined}
      />
      <Toast
        message={toast?.message ?? ''}
        visible={toast !== null}
        variant={toast?.variant ?? 'success'}
        onClose={dismissToast}
      />
    </>
  )

  return {
    openCreate,
    openView,
    requestPinAction,
    drawerElement,
  }
}
