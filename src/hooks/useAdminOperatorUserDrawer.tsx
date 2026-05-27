import { useCallback, useMemo, useState } from 'react'
import { AccessCredentialUserDrawer } from '../components/credenciais/AccessCredentialUserDrawer'
import {
  CredentialActionPinModal,
  type CredentialPinAction,
} from '../components/credenciais/CredentialActionPinModal'
import type { AccessCredentialUser } from '../data/accessCredentialsMock'
import type { AdminOperatorRow } from '../data/adminOperadoresMock'
import {
  enrichPrefeituraCredentialUser,
  isResponsibleUbtRole,
  transferAccessCredentialToUbt,
  type PrefeituraCredentialUbtOption,
} from '../data/prefeituraAccessCredentialsMock'
import { Toast } from '../components/ui/Toast'

type PendingPinAction = {
  type: CredentialPinAction
  user: AdminOperatorRow
  transferTargetUbtId?: string
  transferTargetUbtName?: string
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
) {
  const contractingEntityOptions = useMemo(() => {
    const map = new Map<string, AdminOperatorRow['contractingEntity']>()
    for (const row of rows) {
      map.set(row.contractingEntity.id, row.contractingEntity)
    }
    return Array.from(map.values()).map((entity) => ({
      value: entity.id,
      label: `${entity.razaoSocial} · ${entity.municipality}/${entity.uf}`,
    }))
  }, [rows])

  const ubtOptionsByContractingEntityId = useMemo(() => {
    const entities = contractingEntityOptions
    const map: Record<string, PrefeituraCredentialUbtOption[]> = {}
    for (const entity of entities) map[entity.value] = []
    if (entities.length === 0) return map

    ubtOptions.forEach((option, index) => {
      const target = entities[index % entities.length]!
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

  function executePinAction() {
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
      setToast({ message: 'Usuário desativado com sucesso.', variant: 'success' })
      return
    }

    onRowsChange(rows.filter((row) => row.id !== user.id))
    if (open && editingUser?.id === user.id) setClosing(true)
    setToast({ message: 'Usuário excluído com sucesso.', variant: 'success' })
  }

  const handleSave = useCallback(
    (user: AccessCredentialUser, meta?: { contractingEntityId?: string }) => {
      const existing = rows.find((row) => row.id === user.id)
      const ubtId = user.ubtId ?? existing?.ubtId
      if (!ubtId) {
        setToast({ message: 'Selecione uma UBT válida para o usuário.', variant: 'error' })
        return
      }

      const isResponsible = user.isUbtResponsible ?? isResponsibleUbtRole(user.role)

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
            scope: 'UBT',
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
    [drawerMode, onRowsChange, rows, ubtOptions],
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
          skipPasswordOnCreate: true,
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
        onClose={() => setPendingPin(null)}
        onSuccess={executePinAction}
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
