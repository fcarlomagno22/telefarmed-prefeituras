import { Plus } from 'lucide-react'
import { useCallback, useState } from 'react'
import { AdminAuthApiError, verifyAdminAuthorizationPin } from '../../../lib/api/adminAuthApi'
import type { ConfigExamCategory, ConfigExamItem } from '../../../types/adminConfiguracoes'
import { AdminConfigCatalogActionsMenu } from './AdminConfigCatalogActionsMenu'
import {
  AdminConfigCatalogPinModal,
  type AdminConfigCatalogPinAction,
} from './AdminConfigCatalogPinModal'
import { AdminConfigExamCategoryFormModal } from './AdminConfigExamCategoryFormModal'
import { AdminConfigExamItemFormModal } from './AdminConfigExamItemFormModal'
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

type ExamSubTab = 'categorias' | 'exames'

type AdminConfigConsultaPanelProps = {
  examCategories: ConfigExamCategory[]
  examItems: ConfigExamItem[]
  onCreateExamCategory: (value: ConfigExamCategory) => Promise<void>
  onUpdateExamCategory: (value: ConfigExamCategory) => Promise<void>
  onDeleteExamCategory: (id: string) => Promise<void>
  onSetExamCategoryStatus: (id: string, active: boolean) => Promise<void>
  onCreateExamItem: (value: ConfigExamItem) => Promise<void>
  onUpdateExamItem: (value: ConfigExamItem) => Promise<void>
  onDeleteExamItem: (id: string) => Promise<void>
  onSetExamItemStatus: (id: string, active: boolean) => Promise<void>
  getAccessToken?: () => string | null
  onNotify?: (message: string, variant?: 'success' | 'error') => void
}

type PendingCategoryPinAction = {
  kind: 'category'
  action: AdminConfigCatalogPinAction
  row: ConfigExamCategory
}

type PendingExamPinAction = {
  kind: 'exam'
  action: AdminConfigCatalogPinAction
  row: ConfigExamItem
}

type PendingPinAction = PendingCategoryPinAction | PendingExamPinAction

type CategoryFormState = {
  kind: 'category'
  mode: 'create' | 'edit'
  draft: ConfigExamCategory
}

type ExamItemFormState = {
  kind: 'exam'
  mode: 'create' | 'edit'
  draft: ConfigExamItem
}

type FormState = CategoryFormState | ExamItemFormState | null

function createEmptyCategory(): ConfigExamCategory {
  return {
    id: `exam-cat-${Date.now()}`,
    name: '',
    active: true,
  }
}

function createEmptyExamItem(defaultCategoryId?: string): ConfigExamItem {
  return {
    id: `exam-${Date.now()}`,
    name: '',
    categoryId: defaultCategoryId ?? '',
    active: true,
  }
}

function formatCategoryName(categoryId: string, categories: ConfigExamCategory[]) {
  return categories.find((category) => category.id === categoryId)?.name ?? '—'
}

export function AdminConfigConsultaPanel({
  examCategories,
  examItems,
  onCreateExamCategory,
  onUpdateExamCategory,
  onDeleteExamCategory,
  onSetExamCategoryStatus,
  onCreateExamItem,
  onUpdateExamItem,
  onDeleteExamItem,
  onSetExamItemStatus,
  getAccessToken,
  onNotify,
}: AdminConfigConsultaPanelProps) {
  const [subTab, setSubTab] = useState<ExamSubTab>('categorias')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [formState, setFormState] = useState<FormState>(null)
  const [pendingPin, setPendingPin] = useState<PendingPinAction | null>(null)
  const [isSubmittingForm, setIsSubmittingForm] = useState(false)

  function requestProtectedCategoryAction(
    action: AdminConfigCatalogPinAction,
    row: ConfigExamCategory,
  ) {
    setOpenMenuId(null)
    setPendingPin({ kind: 'category', action, row })
  }

  function requestProtectedExamAction(action: AdminConfigCatalogPinAction, row: ConfigExamItem) {
    setOpenMenuId(null)
    setPendingPin({ kind: 'exam', action, row })
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

  function openCreateCategoryForm() {
    setOpenMenuId(null)
    setFormState({ kind: 'category', mode: 'create', draft: createEmptyCategory() })
  }

  function openEditCategoryForm(row: ConfigExamCategory) {
    setFormState({ kind: 'category', mode: 'edit', draft: { ...row } })
  }

  function openCreateExamForm() {
    setOpenMenuId(null)
    setFormState({
      kind: 'exam',
      mode: 'create',
      draft: createEmptyExamItem(examCategories[0]?.id),
    })
  }

  function openEditExamForm(row: ConfigExamItem) {
    setFormState({ kind: 'exam', mode: 'edit', draft: { ...row } })
  }

  async function handleCategoryFormSubmit(value: ConfigExamCategory) {
    setIsSubmittingForm(true)
    try {
      if (formState?.kind === 'category' && formState.mode === 'create') {
        await onCreateExamCategory(value)
        onNotify?.('Categoria criada.', 'success')
      } else {
        await onUpdateExamCategory(value)
        onNotify?.('Categoria atualizada.', 'success')
      }
      setFormState(null)
    } catch {
      // Erros tratados na página
    } finally {
      setIsSubmittingForm(false)
    }
  }

  async function handleExamFormSubmit(value: ConfigExamItem) {
    setIsSubmittingForm(true)
    try {
      if (formState?.kind === 'exam' && formState.mode === 'create') {
        await onCreateExamItem(value)
        onNotify?.('Exame criado.', 'success')
      } else {
        await onUpdateExamItem(value)
        onNotify?.('Exame atualizado.', 'success')
      }
      setFormState(null)
    } catch {
      // Erros tratados na página
    } finally {
      setIsSubmittingForm(false)
    }
  }

  const handlePinConfirmed = useCallback(async () => {
    if (!pendingPin) return

    const snapshot = pendingPin
    setPendingPin(null)

    try {
      if (snapshot.kind === 'category') {
        if (snapshot.action === 'edit') {
          openEditCategoryForm(snapshot.row)
          return
        }
        if (snapshot.action === 'delete') {
          await onDeleteExamCategory(snapshot.row.id)
          onNotify?.('Categoria excluída.', 'success')
          return
        }
        await onSetExamCategoryStatus(snapshot.row.id, snapshot.action === 'activate')
        onNotify?.(
          snapshot.action === 'activate' ? 'Categoria ativada.' : 'Categoria inativada.',
          'success',
        )
        return
      }

      if (snapshot.action === 'edit') {
        openEditExamForm(snapshot.row)
        return
      }
      if (snapshot.action === 'delete') {
        await onDeleteExamItem(snapshot.row.id)
        onNotify?.('Exame excluído.', 'success')
        return
      }
      await onSetExamItemStatus(snapshot.row.id, snapshot.action === 'activate')
      onNotify?.(
        snapshot.action === 'activate' ? 'Exame ativado.' : 'Exame inativado.',
        'success',
      )
    } catch {
      // Erros tratados na página
    }
  }, [
    onDeleteExamCategory,
    onDeleteExamItem,
    onNotify,
    onSetExamCategoryStatus,
    onSetExamItemStatus,
    pendingPin,
  ])

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className={configSubTabsClass}>
          {(
            [
              ['categorias', 'Categorias'],
              ['exames', 'Exames'],
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
          {subTab === 'categorias' ? (
            <section className={configPanelSectionClass}>
              <div className="flex shrink-0 flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Categorias de exame</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Agrupamento do catálogo na solicitação de exames durante a consulta médica.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openCreateCategoryForm}
                  className="btn-brand-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
                >
                  <Plus className="h-4 w-4" />
                  Nova categoria
                </button>
              </div>

              {examCategories.length === 0 ? (
                <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-6">
                  <p className="text-center text-sm text-gray-500">
                    Nenhuma categoria cadastrada. Use &quot;Nova categoria&quot; para começar.
                  </p>
                </div>
              ) : (
                <div className={configCatalogTableShellClass}>
                  <div className={configCatalogTableScrollClass}>
                    <table className={configCatalogTableClass}>
                      <thead className={configCatalogTableHeadClass}>
                        <tr>
                          <th className="px-4 py-3">Nome</th>
                          <th className="px-3 py-3 text-center">Status</th>
                          <th className="px-4 py-3 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {examCategories.map((row) => (
                          <tr key={row.id}>
                            <td className="px-4 py-3 align-top">
                              <p className="font-medium text-gray-900">{row.name}</p>
                              <p className="mt-0.5 text-[10px] text-gray-400">ID: {row.id}</p>
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
                                onEdit={() => requestProtectedCategoryAction('edit', row)}
                                onActivate={() => requestProtectedCategoryAction('activate', row)}
                                onDeactivate={() => requestProtectedCategoryAction('deactivate', row)}
                                onDelete={() => requestProtectedCategoryAction('delete', row)}
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

          {subTab === 'exames' ? (
            <section className={configPanelSectionClass}>
              <div className="flex shrink-0 flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Catálogo de exames</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Itens disponíveis para o médico na teleconsulta.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openCreateExamForm}
                  disabled={examCategories.length === 0}
                  className="btn-brand-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" />
                  Novo exame
                </button>
              </div>

              {examCategories.length === 0 ? (
                <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-6">
                  <p className="text-center text-sm text-gray-500">
                    Cadastre uma categoria antes de adicionar exames ao catálogo.
                  </p>
                </div>
              ) : examItems.length === 0 ? (
                <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-6">
                  <p className="text-center text-sm text-gray-500">
                    Nenhum exame cadastrado. Use &quot;Novo exame&quot; para começar.
                  </p>
                </div>
              ) : (
                <div className={configCatalogTableShellClass}>
                  <div className={configCatalogTableScrollClass}>
                    <table className={configCatalogTableClass}>
                      <thead className={configCatalogTableHeadClass}>
                        <tr>
                          <th className="px-4 py-3">Exame</th>
                          <th className="min-w-[14rem] px-3 py-3 text-center">Categoria</th>
                          <th className="px-3 py-3 text-center">Status</th>
                          <th className="px-4 py-3 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {examItems.map((row) => (
                          <tr key={row.id}>
                            <td className="px-4 py-3 align-top">
                              <p className="font-medium text-gray-900">{row.name}</p>
                              <p className="mt-0.5 text-[10px] text-gray-400">ID: {row.id}</p>
                            </td>
                            <td className="px-3 py-3 text-center align-middle text-gray-600">
                              {formatCategoryName(row.categoryId, examCategories)}
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
                                onEdit={() => requestProtectedExamAction('edit', row)}
                                onActivate={() => requestProtectedExamAction('activate', row)}
                                onDeactivate={() => requestProtectedExamAction('deactivate', row)}
                                onDelete={() => requestProtectedExamAction('delete', row)}
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

      <AdminConfigExamCategoryFormModal
        open={formState?.kind === 'category'}
        mode={formState?.kind === 'category' ? formState.mode : 'create'}
        initialValue={
          formState?.kind === 'category' ? formState.draft : createEmptyCategory()
        }
        onClose={() => setFormState(null)}
        onSubmit={(value) => void handleCategoryFormSubmit(value)}
        isSubmitting={isSubmittingForm}
      />

      <AdminConfigExamItemFormModal
        open={formState?.kind === 'exam'}
        mode={formState?.kind === 'exam' ? formState.mode : 'create'}
        initialValue={
          formState?.kind === 'exam'
            ? formState.draft
            : createEmptyExamItem(examCategories[0]?.id)
        }
        examCategories={examCategories}
        onClose={() => setFormState(null)}
        onSubmit={(value) => void handleExamFormSubmit(value)}
        isSubmitting={isSubmittingForm}
      />

      <AdminConfigCatalogPinModal
        open={pendingPin !== null}
        action={pendingPin?.action ?? null}
        itemLabel={
          pendingPin?.kind === 'category'
            ? pendingPin.row.name
            : pendingPin?.kind === 'exam'
              ? pendingPin.row.name
              : ''
        }
        entityLabel={pendingPin?.kind === 'category' ? 'categoria' : 'exame'}
        onClose={() => setPendingPin(null)}
        onSuccess={() => void handlePinConfirmed()}
        verifyPin={verifyAdminPin}
      />
    </>
  )
}
