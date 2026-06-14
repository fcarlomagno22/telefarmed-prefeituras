import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AdminAuthApiError, verifyAdminAuthorizationPin } from '../../../lib/services/admin/auth'
import type { DeleteExamItemsBulkPayload } from '../../../lib/services/admin/configuracoes'
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

const examCategoryTabButtonClass = (active: boolean) =>
  [
    'shrink-0 border-b-2 px-3 py-2.5 text-sm font-semibold whitespace-nowrap transition',
    active
      ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]'
      : 'border-transparent text-gray-500 hover:text-gray-800',
  ].join(' ')

const examCategoryTabsScrollButtonClass =
  'flex shrink-0 items-center justify-center self-stretch px-1 text-gray-400 transition hover:bg-gray-50 hover:text-gray-700'

type ExamSubTab = 'categorias' | 'exames'

type AdminConfigConsultaPanelProps = {
  examCategories: ConfigExamCategory[]
  examItems: ConfigExamItem[]
  onCreateExamCategory: (value: ConfigExamCategory | ConfigExamCategory[]) => Promise<void>
  onUpdateExamCategory: (value: ConfigExamCategory) => Promise<void>
  onDeleteExamCategory: (id: string) => Promise<void>
  onSetExamCategoryStatus: (id: string, active: boolean) => Promise<void>
  onCreateExamItem: (value: ConfigExamItem | ConfigExamItem[]) => Promise<void>
  onUpdateExamItem: (value: ConfigExamItem) => Promise<void>
  onDeleteExamItem: (id: string) => Promise<void>
  onDeleteExamItems: (
    payload: DeleteExamItemsBulkPayload,
  ) => Promise<{ deletedCount: number; deletedIds: string[] } | void>
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

type PendingBulkExamDeletePinAction = {
  kind: 'exam-bulk-delete'
  payload: DeleteExamItemsBulkPayload
  label: string
  description: string
}

type PendingPinAction = PendingCategoryPinAction | PendingExamPinAction | PendingBulkExamDeletePinAction

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
  onDeleteExamItems,
  onSetExamItemStatus,
  getAccessToken,
  onNotify,
}: AdminConfigConsultaPanelProps) {
  const [subTab, setSubTab] = useState<ExamSubTab>('categorias')
  const [activeExamCategoryId, setActiveExamCategoryId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [formState, setFormState] = useState<FormState>(null)
  const [pendingPin, setPendingPin] = useState<PendingPinAction | null>(null)
  const [selectedExamIds, setSelectedExamIds] = useState<Set<string>>(() => new Set())
  const [isSubmittingForm, setIsSubmittingForm] = useState(false)
  const categoryTabsScrollRef = useRef<HTMLDivElement>(null)

  const scrollCategoryTabs = useCallback((direction: 'left' | 'right') => {
    categoryTabsScrollRef.current?.scrollBy({
      left: direction === 'left' ? -240 : 240,
      behavior: 'smooth',
    })
  }, [])

  const resolvedExamCategoryId = useMemo(() => {
    if (activeExamCategoryId && examCategories.some((category) => category.id === activeExamCategoryId)) {
      return activeExamCategoryId
    }
    return examCategories[0]?.id ?? null
  }, [activeExamCategoryId, examCategories])

  const examCountByCategoryId = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of examItems) {
      counts.set(item.categoryId, (counts.get(item.categoryId) ?? 0) + 1)
    }
    return counts
  }, [examItems])

  const filteredExamItems = useMemo(() => {
    if (!resolvedExamCategoryId) return []
    return examItems.filter((item) => item.categoryId === resolvedExamCategoryId)
  }, [examItems, resolvedExamCategoryId])

  const activeExamCategory = useMemo(
    () => examCategories.find((category) => category.id === resolvedExamCategoryId) ?? null,
    [examCategories, resolvedExamCategoryId],
  )

  const filteredExamIds = useMemo(
    () => filteredExamItems.map((item) => item.id),
    [filteredExamItems],
  )

  const selectedVisibleCount = useMemo(
    () => filteredExamIds.filter((id) => selectedExamIds.has(id)).length,
    [filteredExamIds, selectedExamIds],
  )

  const allVisibleSelected =
    filteredExamIds.length > 0 && selectedVisibleCount === filteredExamIds.length

  useEffect(() => {
    setSelectedExamIds(new Set())
  }, [resolvedExamCategoryId])

  function toggleSelectAllVisible() {
    setSelectedExamIds((current) => {
      const next = new Set(current)
      if (allVisibleSelected) {
        for (const id of filteredExamIds) {
          next.delete(id)
        }
        return next
      }
      for (const id of filteredExamIds) {
        next.add(id)
      }
      return next
    })
  }

  function toggleSelectExam(id: string) {
    setSelectedExamIds((current) => {
      const next = new Set(current)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function requestDeleteSelectedExams() {
    const ids = filteredExamIds.filter((id) => selectedExamIds.has(id))
    if (ids.length === 0) return

    const categoryName = activeExamCategory?.name ?? 'esta categoria'
    setOpenMenuId(null)
    setPendingPin({
      kind: 'exam-bulk-delete',
      payload: { ids },
      label: `${ids.length} exame(s)`,
      description: `Para excluir ${ids.length} exame(s) selecionado(s) em ${categoryName}, informe sua senha de autorização de 6 dígitos.`,
    })
  }

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
      draft: createEmptyExamItem(resolvedExamCategoryId ?? examCategories[0]?.id),
    })
  }

  function openEditExamForm(row: ConfigExamItem) {
    setFormState({ kind: 'exam', mode: 'edit', draft: { ...row } })
  }

  async function handleCategoryFormSubmit(value: ConfigExamCategory | ConfigExamCategory[]) {
    setIsSubmittingForm(true)
    try {
      if (formState?.kind === 'category' && formState.mode === 'create') {
        const items = Array.isArray(value) ? value : [value]
        await onCreateExamCategory(items)
        onNotify?.(
          items.length > 1 ? `${items.length} categorias criadas.` : 'Categoria criada.',
          'success',
        )
      } else {
        const single = Array.isArray(value) ? value[0] : value
        if (!single) return
        await onUpdateExamCategory(single)
        onNotify?.('Categoria atualizada.', 'success')
      }
      setFormState(null)
    } catch {
      // Erros tratados na página
    } finally {
      setIsSubmittingForm(false)
    }
  }

  async function handleExamFormSubmit(value: ConfigExamItem | ConfigExamItem[]) {
    setIsSubmittingForm(true)
    try {
      if (formState?.kind === 'exam' && formState.mode === 'create') {
        const items = Array.isArray(value) ? value : [value]
        await onCreateExamItem(items)
        onNotify?.(
          items.length > 1 ? `${items.length} exames criados.` : 'Exame criado.',
          'success',
        )
      } else {
        const single = Array.isArray(value) ? value[0] : value
        if (!single) return
        await onUpdateExamItem(single)
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
      if (snapshot.kind === 'exam-bulk-delete') {
        const result = await onDeleteExamItems(snapshot.payload)
        setSelectedExamIds(new Set())
        onNotify?.(`${result?.deletedCount ?? 0} exame(s) excluído(s).`, 'success')
        return
      }

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
        setSelectedExamIds((current) => {
          if (!current.has(snapshot.row.id)) return current
          const next = new Set(current)
          next.delete(snapshot.row.id)
          return next
        })
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
    onDeleteExamItems,
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
              ) : (
                <>
                  <div className="flex shrink-0 items-stretch border-b border-gray-200">
                    <button
                      type="button"
                      onClick={() => scrollCategoryTabs('left')}
                      className={examCategoryTabsScrollButtonClass}
                      aria-label="Ver categorias anteriores"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    <div
                      ref={categoryTabsScrollRef}
                      className="min-w-0 flex-1 overflow-x-auto scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                    >
                      <div className="flex w-max min-w-full gap-0">
                        {examCategories.map((category) => {
                          const count = examCountByCategoryId.get(category.id) ?? 0
                          const isActive = resolvedExamCategoryId === category.id
                          return (
                            <button
                              key={category.id}
                              type="button"
                              className={examCategoryTabButtonClass(isActive)}
                              onClick={(event) => {
                                setActiveExamCategoryId(category.id)
                                setOpenMenuId(null)
                                event.currentTarget.scrollIntoView({
                                  behavior: 'smooth',
                                  inline: 'nearest',
                                  block: 'nearest',
                                })
                              }}
                            >
                              {category.name}
                              <span className="ml-1 text-xs font-normal opacity-70">({count})</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => scrollCategoryTabs('right')}
                      className={examCategoryTabsScrollButtonClass}
                      aria-label="Ver próximas categorias"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  {filteredExamItems.length === 0 ? (
                    <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-6">
                      <p className="text-center text-sm text-gray-500">
                        {examItems.length === 0
                          ? 'Nenhum exame cadastrado. Use "Novo exame" para começar.'
                          : `Nenhum exame em ${activeExamCategory?.name ?? 'esta categoria'}. Use "Novo exame" para adicionar.`}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50/70 px-3 py-2.5">
                        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={allVisibleSelected}
                            onChange={toggleSelectAllVisible}
                            className="h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]/20"
                          />
                          Selecionar todos ({filteredExamItems.length})
                        </label>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            disabled={selectedVisibleCount === 0}
                            onClick={requestDeleteSelectedExams}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Excluir selecionados
                            {selectedVisibleCount > 0 ? ` (${selectedVisibleCount})` : ''}
                          </button>
                        </div>
                      </div>

                      <div className={configCatalogTableShellClass}>
                        <div className={configCatalogTableScrollClass}>
                          <table className={configCatalogTableClass}>
                            <thead className={configCatalogTableHeadClass}>
                              <tr>
                                <th className="w-10 px-3 py-3">
                                  <span className="sr-only">Selecionar</span>
                                </th>
                                <th className="px-4 py-3">Exame</th>
                                <th className="px-3 py-3 text-center">Status</th>
                                <th className="px-4 py-3 text-center">Ações</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {filteredExamItems.map((row) => (
                                <tr key={row.id} className={selectedExamIds.has(row.id) ? 'bg-orange-50/40' : undefined}>
                                  <td className="px-3 py-3 align-middle">
                                    <input
                                      type="checkbox"
                                      checked={selectedExamIds.has(row.id)}
                                      onChange={() => toggleSelectExam(row.id)}
                                      aria-label={`Selecionar ${row.name}`}
                                      className="h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]/20"
                                    />
                                  </td>
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
                                        setOpenMenuId((current) =>
                                          current === row.id ? null : row.id,
                                        )
                                      }
                                      onClose={() => setOpenMenuId(null)}
                                      onEdit={() => requestProtectedExamAction('edit', row)}
                                      onActivate={() => requestProtectedExamAction('activate', row)}
                                      onDeactivate={() =>
                                        requestProtectedExamAction('deactivate', row)
                                      }
                                      onDelete={() => requestProtectedExamAction('delete', row)}
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </>
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
            : createEmptyExamItem(resolvedExamCategoryId ?? examCategories[0]?.id)
        }
        examCategories={examCategories}
        onClose={() => setFormState(null)}
        onSubmit={(value) => void handleExamFormSubmit(value)}
        isSubmitting={isSubmittingForm}
      />

      <AdminConfigCatalogPinModal
        open={pendingPin !== null}
        action={
          pendingPin?.kind === 'exam-bulk-delete'
            ? 'delete'
            : pendingPin?.kind === 'category' || pendingPin?.kind === 'exam'
              ? pendingPin.action
              : null
        }
        itemLabel={
          pendingPin?.kind === 'exam-bulk-delete'
            ? pendingPin.label
            : pendingPin?.kind === 'category'
              ? pendingPin.row.name
              : pendingPin?.kind === 'exam'
                ? pendingPin.row.name
                : ''
        }
        entityLabel={
          pendingPin?.kind === 'exam-bulk-delete'
            ? 'exames'
            : pendingPin?.kind === 'category'
              ? 'categoria'
              : 'exame'
        }
        title={pendingPin?.kind === 'exam-bulk-delete' ? 'Excluir exames' : undefined}
        description={pendingPin?.kind === 'exam-bulk-delete' ? pendingPin.description : undefined}
        onClose={() => setPendingPin(null)}
        onSuccess={() => void handlePinConfirmed()}
        verifyPin={verifyAdminPin}
      />
    </>
  )
}
