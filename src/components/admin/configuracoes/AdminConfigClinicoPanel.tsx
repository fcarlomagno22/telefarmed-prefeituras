import { Plus } from 'lucide-react'
import { useCallback, useState } from 'react'
import { AdminAuthApiError, verifyAdminAuthorizationPin } from '../../../lib/api/adminAuthApi'
import type { ConfigProfession, ConfigSpecialty } from '../../../types/adminConfiguracoes'
import { AdminConfigCatalogActionsMenu } from './AdminConfigCatalogActionsMenu'
import {
  AdminConfigCatalogPinModal,
  type AdminConfigCatalogPinAction,
} from './AdminConfigCatalogPinModal'
import { AdminConfigProfessionFormModal } from './AdminConfigProfessionFormModal'
import { AdminConfigSpecialtyFormModal } from './AdminConfigSpecialtyFormModal'
import { ConfigCatalogStatusBadge } from './ConfigCatalogStatusBadge'
import {
  configCatalogTableClass,
  configCatalogTableHeadClass,
  configCatalogTableScrollClass,
  configCatalogTableShellClass,
  configPanelBodyClass,
  configPanelSectionClass,
  configSubTabButtonClass,
  configSubTabsClass,
} from './adminConfiguracoesUi'

type ClinicoSubTab = 'profissoes' | 'especialidades'

type AdminConfigClinicoPanelProps = {
  professions: ConfigProfession[]
  specialties: ConfigSpecialty[]
  onCreateProfession: (value: ConfigProfession) => Promise<void>
  onUpdateProfession: (value: ConfigProfession) => Promise<void>
  onDeleteProfession: (id: string) => Promise<void>
  onSetProfessionStatus: (id: string, active: boolean) => Promise<void>
  onCreateSpecialty: (value: ConfigSpecialty) => Promise<void>
  onUpdateSpecialty: (value: ConfigSpecialty) => Promise<void>
  onDeleteSpecialty: (id: string) => Promise<void>
  onSetSpecialtyStatus: (id: string, active: boolean) => Promise<void>
  getAccessToken?: () => string | null
  onNotify?: (message: string, variant?: 'success' | 'error') => void
}

type PendingProfessionPinAction = {
  action: AdminConfigCatalogPinAction
  row?: ConfigProfession
}

type ProfessionFormState = {
  kind: 'profession'
  mode: 'create' | 'edit'
  draft: ConfigProfession
}

type SpecialtyFormState = {
  kind: 'specialty'
  mode: 'create' | 'edit'
  draft: ConfigSpecialty
}

type FormState = ProfessionFormState | SpecialtyFormState | null

function createEmptyProfession(sortOrder: number): ConfigProfession {
  return {
    id: `prof-${Date.now()}`,
    name: '',
    councilLabel: '',
    councilAcronym: '',
    active: true,
    sortOrder,
    specialtyIds: [],
  }
}

function createEmptySpecialty(
  sortOrder: number,
  defaultProfessionId?: string,
): ConfigSpecialty {
  return {
    id: `spec-${Date.now()}`,
    name: '',
    active: true,
    professionIds: defaultProfessionId ? [defaultProfessionId] : [],
    sortOrder,
  }
}

function formatProfessionNames(professionIds: string[], professions: ConfigProfession[]) {
  if (professionIds.length === 0) return '—'
  return professionIds
    .map((id) => professions.find((profession) => profession.id === id)?.name ?? id)
    .join(', ')
}

export function AdminConfigClinicoPanel({
  professions,
  specialties,
  onCreateProfession,
  onUpdateProfession,
  onDeleteProfession,
  onSetProfessionStatus,
  onCreateSpecialty,
  onUpdateSpecialty,
  onDeleteSpecialty,
  onSetSpecialtyStatus,
  getAccessToken,
  onNotify,
}: AdminConfigClinicoPanelProps) {
  const [subTab, setSubTab] = useState<ClinicoSubTab>('profissoes')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [formState, setFormState] = useState<FormState>(null)
  const [isSubmittingForm, setIsSubmittingForm] = useState(false)
  const [pendingProfessionPin, setPendingProfessionPin] = useState<PendingProfessionPinAction | null>(
    null,
  )

  function requestProtectedProfessionAction(
    action: AdminConfigCatalogPinAction,
    row?: ConfigProfession,
  ) {
    setOpenMenuId(null)
    setPendingProfessionPin({ action, row })
  }

  const verifyAdminPin = useCallback(
    async (pin: string) => {
      const token = getAccessToken?.()
      if (!token) {
        onNotify?.('Sessão expirada. Faça login novamente.', 'error')
        setPendingProfessionPin(null)
        return false
      }

      try {
        await verifyAdminAuthorizationPin(token, pin)
        return true
      } catch (error) {
        if (error instanceof AdminAuthApiError && error.code === 'PIN_NOT_CONFIGURED') {
          onNotify?.(error.message, 'error')
          setPendingProfessionPin(null)
        }
        return false
      }
    },
    [getAccessToken, onNotify],
  )

  function openCreateProfessionForm() {
    setOpenMenuId(null)
    setFormState({
      kind: 'profession',
      mode: 'create',
      draft: createEmptyProfession(professions.length + 1),
    })
  }

  function openEditProfessionForm(row: ConfigProfession) {
    setFormState({ kind: 'profession', mode: 'edit', draft: { ...row } })
  }

  function openCreateSpecialtyForm() {
    setOpenMenuId(null)
    setFormState({
      kind: 'specialty',
      mode: 'create',
      draft: createEmptySpecialty(specialties.length + 1, professions[0]?.id),
    })
  }

  function openEditSpecialtyForm(row: ConfigSpecialty) {
    setFormState({ kind: 'specialty', mode: 'edit', draft: { ...row } })
  }

  async function handleProfessionFormSubmit(value: ConfigProfession) {
    setIsSubmittingForm(true)
    try {
      if (formState?.kind === 'profession' && formState.mode === 'create') {
        await onCreateProfession(value)
        onNotify?.('Profissão criada.', 'success')
      } else {
        await onUpdateProfession(value)
        onNotify?.('Profissão atualizada.', 'success')
      }
      setFormState(null)
    } catch {
      // Erros tratados na página
    } finally {
      setIsSubmittingForm(false)
    }
  }

  async function handleSpecialtyFormSubmit(value: ConfigSpecialty) {
    setIsSubmittingForm(true)
    try {
      if (formState?.kind === 'specialty' && formState.mode === 'create') {
        await onCreateSpecialty(value)
        onNotify?.('Especialidade criada.', 'success')
      } else {
        await onUpdateSpecialty(value)
        onNotify?.('Especialidade atualizada.', 'success')
      }
      setFormState(null)
    } catch {
      // Erros tratados na página
    } finally {
      setIsSubmittingForm(false)
    }
  }

  async function handleProfessionStatusChange(id: string, active: boolean) {
    setOpenMenuId(null)
    try {
      await onSetProfessionStatus(id, active)
      onNotify?.(active ? 'Profissão ativada.' : 'Profissão inativada.', 'success')
    } catch {
      // Erros tratados na página
    }
  }

  async function handleProfessionDelete(id: string) {
    setOpenMenuId(null)
    try {
      await onDeleteProfession(id)
      onNotify?.('Profissão excluída.', 'success')
    } catch {
      // Erros tratados na página
    }
  }

  const handleProfessionPinConfirmed = useCallback(async () => {
    if (!pendingProfessionPin) return

    const snapshot = pendingProfessionPin
    setPendingProfessionPin(null)

    try {
      if (snapshot.action === 'create') {
        openCreateProfessionForm()
        return
      }

      if (!snapshot.row) return

      if (snapshot.action === 'edit') {
        openEditProfessionForm(snapshot.row)
        return
      }

      if (snapshot.action === 'delete') {
        await handleProfessionDelete(snapshot.row.id)
        return
      }

      await handleProfessionStatusChange(snapshot.row.id, snapshot.action === 'activate')
    } catch {
      // Erros tratados nos handlers
    }
  }, [onDeleteProfession, onNotify, onSetProfessionStatus, pendingProfessionPin])

  async function handleSpecialtyStatusChange(id: string, active: boolean) {
    setOpenMenuId(null)
    try {
      await onSetSpecialtyStatus(id, active)
      onNotify?.(active ? 'Especialidade ativada.' : 'Especialidade inativada.', 'success')
    } catch {
      // Erros tratados na página
    }
  }

  async function handleSpecialtyDelete(id: string) {
    setOpenMenuId(null)
    try {
      await onDeleteSpecialty(id)
      onNotify?.('Especialidade excluída.', 'success')
    } catch {
      // Erros tratados na página
    }
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className={configSubTabsClass}>
          {(
            [
              ['profissoes', 'Profissões'],
              ['especialidades', 'Especialidades'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={configSubTabButtonClass(subTab === id)}
              onClick={() => {
                setSubTab(id)
                setOpenMenuId(null)
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className={configPanelBodyClass}>
          {subTab === 'profissoes' ? (
            <section className={configPanelSectionClass}>
              <div className="flex shrink-0 flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Profissões</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Define conselho de classe e vínculo com especialidades no cadastro de profissionais.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => requestProtectedProfessionAction('create')}
                  className="btn-brand-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
                >
                  <Plus className="h-4 w-4" />
                  Nova profissão
                </button>
              </div>

              {professions.length === 0 ? (
                <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-6">
                  <p className="text-center text-sm text-gray-500">
                    Nenhuma profissão cadastrada. Use &quot;Nova profissão&quot; para começar.
                  </p>
                </div>
              ) : (
                <div className={configCatalogTableShellClass}>
                  <div className={configCatalogTableScrollClass}>
                    <table className={configCatalogTableClass}>
                      <thead className={configCatalogTableHeadClass}>
                        <tr>
                          <th className="px-4 py-3">Nome</th>
                          <th className="min-w-[14rem] px-3 py-3">Conselho</th>
                          <th className="px-3 py-3 text-center">Sigla</th>
                          <th className="px-3 py-3 text-center">Status</th>
                          <th className="px-4 py-3 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {professions.map((row) => (
                          <tr key={row.id}>
                            <td className="px-4 py-3 align-top">
                              <p className="font-medium text-gray-900">{row.name}</p>
                              <p className="mt-0.5 text-[10px] text-gray-400">ID: {row.id}</p>
                            </td>
                            <td className="px-3 py-3 align-top text-gray-600">{row.councilLabel}</td>
                            <td className="px-3 py-3 text-center align-middle text-gray-700">
                              {row.councilAcronym}
                            </td>
                            <td className="px-3 py-3 text-center align-middle">
                              <ConfigCatalogStatusBadge active={row.active} />
                            </td>
                            <td className="px-4 py-3 text-center align-middle">
                              <AdminConfigCatalogActionsMenu
                                label={row.name}
                                active={row.active}
                                open={openMenuId === row.id}
                                onToggle={() =>
                                  setOpenMenuId((current) => (current === row.id ? null : row.id))
                                }
                                onClose={() => setOpenMenuId(null)}
                                onEdit={() => requestProtectedProfessionAction('edit', row)}
                                onActivate={() => requestProtectedProfessionAction('activate', row)}
                                onDeactivate={() => requestProtectedProfessionAction('deactivate', row)}
                                onDelete={() => requestProtectedProfessionAction('delete', row)}
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
          ) : null}

          {subTab === 'especialidades' ? (
            <section className={configPanelSectionClass}>
              <div className="flex shrink-0 flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Especialidades</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Catálogo usado em contratos, UBT, agenda e cadastro de profissionais.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openCreateSpecialtyForm}
                  className="btn-brand-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
                >
                  <Plus className="h-4 w-4" />
                  Nova especialidade
                </button>
              </div>

              {specialties.length === 0 ? (
                <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-6">
                  <p className="text-center text-sm text-gray-500">
                    Nenhuma especialidade cadastrada. Use &quot;Nova especialidade&quot; para começar.
                  </p>
                </div>
              ) : (
                <div className={configCatalogTableShellClass}>
                  <div className={configCatalogTableScrollClass}>
                    <table className={configCatalogTableClass}>
                      <thead className={configCatalogTableHeadClass}>
                        <tr>
                          <th className="px-4 py-3">Nome</th>
                          <th className="min-w-[14rem] px-3 py-3">Profissões</th>
                          <th className="px-3 py-3 text-center">Status</th>
                          <th className="px-4 py-3 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {specialties.map((row) => (
                          <tr key={row.id}>
                            <td className="px-4 py-3 align-top">
                              <p className="font-medium text-gray-900">{row.name}</p>
                              <p className="mt-0.5 text-[10px] text-gray-400">ID: {row.id}</p>
                            </td>
                            <td className="px-3 py-3 align-top text-gray-600">
                              {formatProfessionNames(row.professionIds, professions)}
                            </td>
                            <td className="px-3 py-3 text-center align-middle">
                              <ConfigCatalogStatusBadge active={row.active} />
                            </td>
                            <td className="px-4 py-3 text-center align-middle">
                              <AdminConfigCatalogActionsMenu
                                label={row.name}
                                active={row.active}
                                open={openMenuId === row.id}
                                onToggle={() =>
                                  setOpenMenuId((current) => (current === row.id ? null : row.id))
                                }
                                onClose={() => setOpenMenuId(null)}
                                onEdit={() => {
                                  setOpenMenuId(null)
                                  openEditSpecialtyForm(row)
                                }}
                                onActivate={() => void handleSpecialtyStatusChange(row.id, true)}
                                onDeactivate={() => void handleSpecialtyStatusChange(row.id, false)}
                                onDelete={() => void handleSpecialtyDelete(row.id)}
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
          ) : null}
        </div>
      </div>

      <AdminConfigProfessionFormModal
        open={formState?.kind === 'profession'}
        mode={formState?.kind === 'profession' ? formState.mode : 'create'}
        initialValue={
          formState?.kind === 'profession'
            ? formState.draft
            : createEmptyProfession(professions.length + 1)
        }
        onClose={() => setFormState(null)}
        onSubmit={(value) => void handleProfessionFormSubmit(value)}
        isSubmitting={isSubmittingForm}
      />

      <AdminConfigSpecialtyFormModal
        open={formState?.kind === 'specialty'}
        mode={formState?.kind === 'specialty' ? formState.mode : 'create'}
        initialValue={
          formState?.kind === 'specialty'
            ? formState.draft
            : createEmptySpecialty(specialties.length + 1, professions[0]?.id)
        }
        professions={professions}
        onClose={() => setFormState(null)}
        onSubmit={(value) => void handleSpecialtyFormSubmit(value)}
        isSubmitting={isSubmittingForm}
      />

      <AdminConfigCatalogPinModal
        open={pendingProfessionPin !== null}
        action={pendingProfessionPin?.action ?? null}
        itemLabel={pendingProfessionPin?.row?.name ?? ''}
        entityLabel="profissão"
        onClose={() => setPendingProfessionPin(null)}
        onSuccess={() => void handleProfessionPinConfirmed()}
        verifyPin={verifyAdminPin}
      />
    </>
  )
}
