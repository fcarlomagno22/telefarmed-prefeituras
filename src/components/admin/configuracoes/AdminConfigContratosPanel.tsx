import { Plus } from 'lucide-react'
import { useCallback, useState } from 'react'
import { AdminAuthApiError, verifyAdminAuthorizationPin } from '../../../lib/services/admin/auth'
import { isPresetContractTypeId } from '../../../types/adminConfiguracoes'
import type { ConfigCommercialRules, ConfigContractType } from '../../../types/adminConfiguracoes'
import { ConfigCatalogStatusBadge } from './ConfigCatalogStatusBadge'
import { AdminConfigCommercialRulesPanel } from './AdminConfigCommercialRulesPanel'
import {
  configCatalogTableClass,
  configCatalogTableHeadClass,
  configCatalogTableScrollClass,
  configCatalogTableShellClass,
  configPanelSectionClass,
} from './adminConfiguracoesUi'
import { AdminConfigCatalogActionsMenu } from './AdminConfigCatalogActionsMenu'
import {
  AdminConfigContractTypePinModal,
  type AdminConfigContractTypePinAction,
} from './AdminConfigContractTypePinModal'
import { AdminConfigContractTypeFormModal } from './AdminConfigContractTypeFormModal'

type AdminConfigContratosPanelProps = {
  contractTypes: ConfigContractType[]
  commercialRules: ConfigCommercialRules
  onCreateContractType: (value: ConfigContractType) => Promise<void>
  onUpdateContractType: (value: ConfigContractType) => Promise<void>
  onDeleteContractType: (id: string) => Promise<void>
  onSetContractTypeStatus: (id: string, active: boolean) => Promise<void>
  onSaveCommercialRules: (value: ConfigCommercialRules) => Promise<void>
  getAccessToken?: () => string | null
  onNotify?: (message: string, variant?: 'success' | 'error') => void
}

type FormState = {
  mode: 'create' | 'edit'
  draft: ConfigContractType
}

type PendingPinAction = {
  action: AdminConfigContractTypePinAction
  row: ConfigContractType
}

function createEmptyContractType(): ConfigContractType {
  return {
    id: `contrato_${Date.now()}`,
    label: '',
    description: '',
    active: true,
  }
}

function truncateDescription(text: string, maxLength = 120) {
  const trimmed = text.trim()
  if (trimmed.length <= maxLength) return trimmed
  return `${trimmed.slice(0, maxLength).trimEnd()}…`
}

export function AdminConfigContratosPanel({
  contractTypes,
  commercialRules,
  onCreateContractType,
  onUpdateContractType,
  onDeleteContractType,
  onSetContractTypeStatus,
  onSaveCommercialRules,
  getAccessToken,
  onNotify,
}: AdminConfigContratosPanelProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [formState, setFormState] = useState<FormState | null>(null)
  const [pendingPin, setPendingPin] = useState<PendingPinAction | null>(null)
  const [isSubmittingForm, setIsSubmittingForm] = useState(false)

  function requestProtectedAction(action: AdminConfigContractTypePinAction, row: ConfigContractType) {
    setOpenMenuId(null)
    setPendingPin({ action, row })
  }

  function openCreateForm() {
    setOpenMenuId(null)
    setFormState({ mode: 'create', draft: createEmptyContractType() })
  }

  function openEditForm(row: ConfigContractType) {
    setFormState({ mode: 'edit', draft: { ...row } })
  }

  const verifyAdminPin = useCallback(
    async (pin: string) => {
      const token = getAccessToken?.()
      if (!token) {
        onNotify?.('Sessão expirada. Faça login novamente.', 'error')
        setPendingPin(null)
        return false
      }

      try {
        await verifyAdminAuthorizationPin(token, pin)
        return true
      } catch (error) {
        if (error instanceof AdminAuthApiError && error.code === 'PIN_NOT_CONFIGURED') {
          onNotify?.(error.message, 'error')
          setPendingPin(null)
        }
        return false
      }
    },
    [getAccessToken, onNotify],
  )

  const handlePinConfirmed = useCallback(async () => {
    if (!pendingPin) return

    const snapshot = pendingPin
    setPendingPin(null)

    try {
      if (snapshot.action === 'edit') {
        openEditForm(snapshot.row)
        return
      }

      if (snapshot.action === 'delete') {
        await onDeleteContractType(snapshot.row.id)
        onNotify?.('Tipo de contrato excluído.', 'success')
      } else {
        await onSetContractTypeStatus(
          snapshot.row.id,
          snapshot.action === 'activate',
        )
        onNotify?.(
          snapshot.action === 'activate'
            ? 'Tipo de contrato ativado.'
            : 'Tipo de contrato inativado.',
          'success',
        )
      }
    } catch {
      // Erros tratados na página
    }
  }, [onDeleteContractType, onNotify, onSetContractTypeStatus, pendingPin])

  async function handleFormSubmit(value: ConfigContractType) {
    setIsSubmittingForm(true)
    try {
      if (formState?.mode === 'create') {
        await onCreateContractType(value)
        onNotify?.('Tipo de contrato criado.', 'success')
      } else {
        await onUpdateContractType(value)
        onNotify?.('Tipo de contrato atualizado.', 'success')
      }
      setFormState(null)
    } catch {
      // Erros tratados na página
    } finally {
      setIsSubmittingForm(false)
    }
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4 sm:p-6">
        <section className={`${configPanelSectionClass} min-h-0 flex-1`}>
          <div className="flex shrink-0 flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-900">Tipos de contrato</h2>
              <p className="mt-1 text-sm text-gray-500">
                Modelos disponíveis ao cadastrar clientes (prefeituras) no admin.
              </p>
            </div>
            <button
              type="button"
              onClick={openCreateForm}
              className="btn-brand-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
            >
              <Plus className="h-4 w-4" />
              Novo tipo de contrato
            </button>
          </div>

          {contractTypes.length === 0 ? (
            <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-6">
              <p className="text-center text-sm text-gray-500">
                Nenhum tipo de contrato cadastrado. Use &quot;Novo tipo de contrato&quot; para começar.
              </p>
            </div>
          ) : (
            <div className={configCatalogTableShellClass}>
              <div className={configCatalogTableScrollClass}>
                <table className={configCatalogTableClass}>
                  <thead className={configCatalogTableHeadClass}>
                    <tr>
                      <th className="px-4 py-3">Nome</th>
                      <th className="min-w-[14rem] px-3 py-3">Descrição</th>
                      <th className="px-3 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {contractTypes.map((row) => (
                      <tr key={row.id}>
                        <td className="px-4 py-3 align-top">
                          <p className="font-medium text-gray-900">{row.label}</p>
                          <p className="mt-0.5 text-[10px] text-gray-400">ID: {row.id}</p>
                        </td>
                        <td className="px-3 py-3 align-top text-gray-600">
                          {truncateDescription(row.description) || '—'}
                        </td>
                        <td className="px-3 py-3 text-center align-middle">
                          <ConfigCatalogStatusBadge active={row.active} />
                        </td>
                        <td className="px-4 py-3 text-center align-middle">
                          <AdminConfigCatalogActionsMenu
                            label={row.label}
                            active={row.active}
                            canDelete={!isPresetContractTypeId(row.id)}
                            open={openMenuId === row.id}
                            onToggle={() =>
                              setOpenMenuId((current) => (current === row.id ? null : row.id))
                            }
                            onClose={() => setOpenMenuId(null)}
                            onEdit={() => requestProtectedAction('edit', row)}
                            onActivate={() => requestProtectedAction('activate', row)}
                            onDeactivate={() => requestProtectedAction('deactivate', row)}
                            onDelete={() => requestProtectedAction('delete', row)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        <AdminConfigCommercialRulesPanel
          commercialRules={commercialRules}
          onSaveCommercialRules={onSaveCommercialRules}
          getAccessToken={getAccessToken}
          onNotify={onNotify}
        />
      </div>

      <AdminConfigContractTypeFormModal
        open={formState !== null}
        mode={formState?.mode ?? 'create'}
        initialValue={formState?.draft ?? createEmptyContractType()}
        onClose={() => setFormState(null)}
        onSubmit={(value) => void handleFormSubmit(value)}
        isSubmitting={isSubmittingForm}
      />

      <AdminConfigContractTypePinModal
        open={pendingPin !== null}
        action={pendingPin?.action ?? null}
        contractLabel={pendingPin?.row.label ?? ''}
        onClose={() => setPendingPin(null)}
        onSuccess={() => void handlePinConfirmed()}
        verifyPin={verifyAdminPin}
      />
    </>
  )
}
