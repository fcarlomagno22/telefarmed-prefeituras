import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Check,
  ClipboardList,
  FileSignature,
  Plus,
  Search,
  Stethoscope,
  X,
} from 'lucide-react'
import type { ExamCatalogItem } from '../../../data/doctorExamRequestMock'
import {
  EXAM_REQUEST_CATALOG,
  EXAM_REQUEST_CATEGORIES,
} from '../../../data/doctorExamRequestMock'
import { Toast } from '../../ui/Toast'

export type DoctorExamRequestPatientInfo = {
  name: string
  cpfMasked: string
  photoUrl: string
  ageGenderLabel: string
}

export type DoctorExamRequestDoctorInfo = {
  name: string
  specialty: string
  crm: string
}

type ExamPriority = 'routine' | 'urgent'

export type DoctorExamRequestSignedPayload = {
  selectedExams: ExamCatalogItem[]
  clinicalIndication: string
  customExamNames: string[]
  priority: ExamPriority
}

type DoctorExamRequestModalProps = {
  open: boolean
  onClose: () => void
  onSigned?: (payload: DoctorExamRequestSignedPayload) => void | Promise<void>
  patient: DoctorExamRequestPatientInfo
  doctor: DoctorExamRequestDoctorInfo
  examCatalog?: ExamCatalogItem[]
}

type CategoryFilterId = 'all' | string

function normalizeSearchText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

function matchesExamSearch(item: ExamCatalogItem, query: string) {
  if (!query) return true

  const haystack = normalizeSearchText(`${item.name} ${item.category}`)
  return haystack.includes(query)
}

function groupExamsByCategory(items: ExamCatalogItem[]) {
  const groups = new Map<string, ExamCatalogItem[]>()

  for (const category of EXAM_REQUEST_CATEGORIES) {
    groups.set(category, [])
  }

  for (const item of items) {
    const list = groups.get(item.category) ?? []
    list.push(item)
    groups.set(item.category, list)
  }

  const ordered = EXAM_REQUEST_CATEGORIES.map((category) => ({
    category,
    items: groups.get(category) ?? [],
  })).filter((group) => group.items.length > 0)

  const unknown = items.filter((item) => !EXAM_REQUEST_CATEGORIES.includes(item.category as never))
  if (unknown.length > 0) {
    ordered.push({ category: 'Personalizado', items: unknown })
  }

  return ordered
}

export function DoctorExamRequestModal({
  open,
  onClose,
  onSigned,
  patient,
  doctor,
  examCatalog,
}: DoctorExamRequestModalProps) {
  const [catalogSearch, setCatalogSearch] = useState('')
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<CategoryFilterId>('all')
  const [customExamDraft, setCustomExamDraft] = useState('')
  const [customExams, setCustomExams] = useState<ExamCatalogItem[]>([])
  const [clinicalIndication, setClinicalIndication] = useState('')
  const [priority, setPriority] = useState<ExamPriority>('routine')
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>([])
  const [signing, setSigning] = useState(false)
  const [successToastVisible, setSuccessToastVisible] = useState(false)
  const [validationHint, setValidationHint] = useState<string | null>(null)

  const catalogSource = examCatalog ?? EXAM_REQUEST_CATALOG

  const allExams = useMemo(
    () => [...catalogSource, ...customExams],
    [catalogSource, customExams],
  )

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !signing) onClose()
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose, signing])

  useEffect(() => {
    if (open) return

    setCatalogSearch('')
    setActiveCategoryFilter('all')
    setCustomExamDraft('')
    setCustomExams([])
    setClinicalIndication('')
    setPriority('routine')
    setSelectedExamIds([])
    setSigning(false)
    setValidationHint(null)
  }, [open])

  const searchQuery = useMemo(() => normalizeSearchText(catalogSearch), [catalogSearch])

  const filteredCatalog = useMemo(() => {
    if (!searchQuery) return allExams
    return allExams.filter((item) => matchesExamSearch(item, searchQuery))
  }, [allExams, searchQuery])

  const categoryFilters = useMemo(() => {
    const counts = new Map<string, number>()

    for (const item of filteredCatalog) {
      counts.set(item.category, (counts.get(item.category) ?? 0) + 1)
    }

    const ordered = EXAM_REQUEST_CATEGORIES.map((category) => ({
      id: category,
      label: category,
      count: counts.get(category) ?? 0,
    })).filter((item) => item.count > 0)

    const unknownCategories = [...counts.keys()].filter(
      (category) => !EXAM_REQUEST_CATEGORIES.includes(category as (typeof EXAM_REQUEST_CATEGORIES)[number]),
    )

    for (const category of unknownCategories) {
      ordered.push({
        id: category,
        label: category,
        count: counts.get(category) ?? 0,
      })
    }

    return ordered
  }, [filteredCatalog])

  const selectedCountByCategory = useMemo(() => {
    const counts = new Map<string, number>()

    for (const examId of selectedExamIds) {
      const exam = allExams.find((item) => item.id === examId)
      if (!exam) continue
      counts.set(exam.category, (counts.get(exam.category) ?? 0) + 1)
    }

    return counts
  }, [allExams, selectedExamIds])

  const displayedCatalog = useMemo(() => {
    if (activeCategoryFilter === 'all') return filteredCatalog
    return filteredCatalog.filter((item) => item.category === activeCategoryFilter)
  }, [activeCategoryFilter, filteredCatalog])

  useEffect(() => {
    if (activeCategoryFilter === 'all') return
    const stillVisible = categoryFilters.some((item) => item.id === activeCategoryFilter)
    if (!stillVisible) setActiveCategoryFilter('all')
  }, [activeCategoryFilter, categoryFilters])

  const groupedCatalog = useMemo(() => {
    if (displayedCatalog.length === 0) return []

    if (activeCategoryFilter !== 'all') {
      return [{ category: activeCategoryFilter, items: displayedCatalog }]
    }

    return groupExamsByCategory(displayedCatalog)
  }, [activeCategoryFilter, displayedCatalog])

  const selectedExams = useMemo(
    () =>
      selectedExamIds
        .map((id) => allExams.find((item) => item.id === id))
        .filter((item): item is ExamCatalogItem => Boolean(item)),
    [allExams, selectedExamIds],
  )

  const canSign =
    clinicalIndication.trim().length >= 10 && selectedExamIds.length > 0 && !signing

  const customDraftTrimmed = customExamDraft.trim()
  const showAddCustomFromSearch =
    customDraftTrimmed.length > 0 &&
    !allExams.some((item) => item.name.toLowerCase() === customDraftTrimmed.toLowerCase())

  function toggleExam(examId: string) {
    setValidationHint(null)
    setSelectedExamIds((current) =>
      current.includes(examId) ? current.filter((id) => id !== examId) : [...current, examId],
    )
  }

  function toggleCategorySelection(category: string) {
    const categoryExamIds = displayedCatalog
      .filter((item) => item.category === category)
      .map((item) => item.id)
    if (categoryExamIds.length === 0) return

    const allSelected = categoryExamIds.every((id) => selectedExamIds.includes(id))
    setValidationHint(null)

    if (allSelected) {
      setSelectedExamIds((current) => current.filter((id) => !categoryExamIds.includes(id)))
      return
    }

    setSelectedExamIds((current) => [...new Set([...current, ...categoryExamIds])])
  }

  function isCategoryFullySelected(category: string) {
    const categoryExamIds = displayedCatalog
      .filter((item) => item.category === category)
      .map((item) => item.id)
    return (
      categoryExamIds.length > 0 &&
      categoryExamIds.every((id) => selectedExamIds.includes(id))
    )
  }

  function addCustomExam(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return

    const existing = allExams.find(
      (item) => item.name.toLowerCase() === trimmed.toLowerCase(),
    )
    if (existing) {
      setSelectedExamIds((current) =>
        current.includes(existing.id) ? current : [...current, existing.id],
      )
      setCustomExamDraft('')
      return
    }

    const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const customItem: ExamCatalogItem = {
      id,
      name: trimmed,
      category: 'Personalizado',
    }

    setCustomExams((current) => [...current, customItem])
    setSelectedExamIds((current) => [...current, id])
    setCustomExamDraft('')
    setValidationHint(null)
  }

  async function handleSign() {
    if (clinicalIndication.trim().length < 10) {
      setValidationHint('Descreva a indicação clínica com pelo menos 10 caracteres.')
      return
    }

    if (selectedExamIds.length === 0) {
      setValidationHint('Selecione ou adicione ao menos um exame.')
      return
    }

    setValidationHint(null)
    setSigning(true)

    try {
      await Promise.resolve(
        onSigned?.({
          selectedExams,
          clinicalIndication: clinicalIndication.trim(),
          customExamNames: customExams.map((item) => item.name),
          priority,
        }),
      )
      onClose()
      setSuccessToastVisible(false)
      requestAnimationFrame(() => setSuccessToastVisible(true))
    } finally {
      setSigning(false)
    }
  }

  const toast = (
    <Toast
      message="Pedido de exames assinado e disponível para o paciente"
      visible={successToastVisible}
      variant="success"
      durationMs={2000}
      onClose={() => setSuccessToastVisible(false)}
    />
  )

  if (!open) return toast

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[600] flex items-center justify-center bg-gray-950/50 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exam-request-title"
        onClick={signing ? undefined : onClose}
      >
        <div
          className="flex h-[90vh] w-[92vw] max-w-[1280px] flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.22)]"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="flex shrink-0 items-start justify-between gap-3 border-b border-sky-100 bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 px-6 py-4 text-white">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                <ClipboardList className="h-5 w-5" strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <h2 id="exam-request-title" className="text-lg font-bold leading-tight">
                  Solicitação de exames
                </h2>
                <p className="mt-0.5 text-sm text-sky-100">
                  Preencha os dados à esquerda e selecione os exames no catálogo à direita.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={signing}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/10 transition hover:bg-white/20 disabled:opacity-50"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </button>
          </header>

          <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(360px,40%)_1fr]">
            <aside className="flex min-h-0 flex-col gap-5 overflow-y-auto border-b border-gray-100 bg-gray-50/50 p-5 lg:border-b-0 lg:border-r lg:p-6">
              <div className="flex gap-4">
                <img
                  src={patient.photoUrl}
                  alt=""
                  className="h-20 w-20 shrink-0 rounded-2xl border-2 border-white object-cover shadow-md"
                />
                <div className="min-w-0 pt-0.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                    Paciente
                  </p>
                  <p className="mt-0.5 text-base font-bold leading-tight text-gray-900">
                    {patient.name}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    CPF {patient.cpfMasked} · {patient.ageGenderLabel}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-3.5 shadow-sm">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                  <Stethoscope className="h-5 w-5" strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                    Solicitante
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-gray-900">{doctor.name}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {doctor.specialty} · CRM {doctor.crm}
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="exam-clinical-indication"
                  className="mb-1.5 block text-sm font-semibold text-gray-900"
                >
                  Indicação clínica <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="exam-clinical-indication"
                  value={clinicalIndication}
                  onChange={(event) => {
                    setClinicalIndication(event.target.value)
                    setValidationHint(null)
                  }}
                  rows={4}
                  placeholder="Descreva a hipótese diagnóstica e a justificativa para os exames solicitados…"
                  className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm leading-relaxed text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-gray-900">Prioridade</p>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { id: 'routine' as const, label: 'Rotina' },
                      { id: 'urgent' as const, label: 'Urgente' },
                    ] as const
                  ).map((option) => {
                    const isActive = priority === option.id
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setPriority(option.id)}
                        className={[
                          'rounded-full px-4 py-2 text-xs font-semibold transition',
                          isActive
                            ? 'bg-sky-600 text-white shadow-sm'
                            : 'border border-gray-200 bg-white text-gray-600 hover:border-sky-200 hover:text-sky-700',
                        ].join(' ')}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900">Exames solicitados</p>
                  <span className="text-xs font-medium text-gray-500">
                    {selectedExamIds.length}{' '}
                    {selectedExamIds.length === 1 ? 'selecionado' : 'selecionados'}
                  </span>
                </div>

                {selectedExams.length > 0 ? (
                  <ul className="flex flex-wrap gap-2">
                    {selectedExams.map((exam) => (
                      <li key={exam.id}>
                        <button
                          type="button"
                          onClick={() => toggleExam(exam.id)}
                          className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-left text-xs font-semibold text-sky-800 transition hover:bg-sky-100"
                        >
                          <span className="truncate">{exam.name}</span>
                          <X className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={2} />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-xl border border-dashed border-gray-200 bg-white px-3 py-3 text-xs leading-relaxed text-gray-500">
                    Nenhum exame selecionado. Escolha na lista à direita ou digite um exame
                    personalizado.
                  </p>
                )}
              </div>
            </aside>

            <div className="flex min-h-0 flex-col p-5 lg:p-6">
              <div className="shrink-0 space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Catálogo de exames</h3>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Filtre por categoria ou busque pelo nome do exame.
                  </p>
                </div>

                <label htmlFor="exam-catalog-search" className="sr-only">
                  Buscar exame no catálogo
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="exam-catalog-search"
                    type="search"
                    value={catalogSearch}
                    onChange={(event) => setCatalogSearch(event.target.value)}
                    placeholder="Buscar por nome do exame…"
                    className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                  />
                </div>

                {categoryFilters.length > 0 ? (
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                      Categorias
                    </p>
                    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                      <button
                        type="button"
                        onClick={() => setActiveCategoryFilter('all')}
                        className={[
                          'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                          activeCategoryFilter === 'all'
                            ? 'border-sky-300 bg-sky-600 text-white shadow-sm'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-sky-200 hover:text-sky-700',
                        ].join(' ')}
                      >
                        Todos
                        <span
                          className={[
                            'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                            activeCategoryFilter === 'all' ? 'bg-white/20' : 'bg-gray-100',
                          ].join(' ')}
                        >
                          {filteredCatalog.length}
                        </span>
                      </button>

                      {categoryFilters.map((category) => {
                        const isActive = activeCategoryFilter === category.id
                        const selectedInCategory = selectedCountByCategory.get(category.id) ?? 0

                        return (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => setActiveCategoryFilter(category.id)}
                            className={[
                              'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                              isActive
                                ? 'border-sky-300 bg-sky-600 text-white shadow-sm'
                                : 'border-gray-200 bg-white text-gray-600 hover:border-sky-200 hover:text-sky-700',
                            ].join(' ')}
                          >
                            {category.label}
                            <span
                              className={[
                                'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                                isActive ? 'bg-white/20' : 'bg-gray-100',
                              ].join(' ')}
                            >
                              {category.count}
                            </span>
                            {selectedInCategory > 0 ? (
                              <span
                                className={[
                                  'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                                  isActive ? 'bg-white text-sky-700' : 'bg-sky-100 text-sky-700',
                                ].join(' ')}
                              >
                                {selectedInCategory} ✓
                              </span>
                            ) : null}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-3">
                  <label
                    htmlFor="exam-custom-draft"
                    className="mb-1.5 block text-xs font-semibold text-gray-800"
                  >
                    Exame não está na lista?
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      id="exam-custom-draft"
                      type="text"
                      value={customExamDraft}
                      onChange={(event) => setCustomExamDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key !== 'Enter') return
                        event.preventDefault()
                        addCustomExam(customExamDraft)
                      }}
                      placeholder="Digite o nome do exame…"
                      className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                    />
                    <button
                      type="button"
                      onClick={() => addCustomExam(customExamDraft)}
                      disabled={!customDraftTrimmed}
                      className="btn-exam-gradient inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" strokeWidth={2} />
                      Adicionar
                    </button>
                  </div>
                  {showAddCustomFromSearch && catalogSearch.trim() ? (
                    <button
                      type="button"
                      onClick={() => addCustomExam(catalogSearch)}
                      className="mt-2 text-left text-xs font-semibold text-sky-700 hover:underline"
                    >
                      Adicionar &quot;{catalogSearch.trim()}&quot; como exame personalizado
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 min-h-0 flex-1 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50/40 p-3">
                {groupedCatalog.length > 0 ? (
                  <div className="space-y-4">
                    {groupedCatalog.map(({ category, items }) => {
                      const categoryFullySelected = isCategoryFullySelected(category)

                      return (
                      <section key={category}>
                        <div className="mb-2 flex items-center justify-between gap-2 px-1">
                          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                            {category}
                          </h4>
                          {items.length > 1 ? (
                            <button
                              type="button"
                              onClick={() => toggleCategorySelection(category)}
                              className="text-[11px] font-semibold text-sky-700 transition hover:underline"
                            >
                              {categoryFullySelected ? 'Desmarcar todos' : 'Selecionar todos'}
                            </button>
                          ) : null}
                        </div>
                        <ul className="space-y-1.5">
                          {items.map((exam) => {
                            const isSelected = selectedExamIds.includes(exam.id)
                            return (
                              <li key={exam.id}>
                                <button
                                  type="button"
                                  onClick={() => toggleExam(exam.id)}
                                  className={[
                                    'flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left text-sm transition',
                                    isSelected
                                      ? 'border-sky-300 bg-white text-sky-900 shadow-sm ring-1 ring-sky-200'
                                      : 'border-transparent bg-white text-gray-800 hover:border-sky-200 hover:shadow-sm',
                                  ].join(' ')}
                                >
                                  <span className="min-w-0 font-medium leading-snug">
                                    {exam.name}
                                  </span>
                                  <span
                                    className={[
                                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                                      isSelected
                                        ? 'bg-sky-600 text-white'
                                        : 'bg-gray-100 text-gray-500',
                                    ].join(' ')}
                                  >
                                    {isSelected ? (
                                      <Check className="h-4 w-4" strokeWidth={2.5} />
                                    ) : (
                                      <Plus className="h-4 w-4" strokeWidth={2} />
                                    )}
                                  </span>
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      </section>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex h-full min-h-[12rem] flex-col items-center justify-center gap-3 px-4 text-center">
                    <p className="text-sm text-gray-500">
                      {catalogSearch.trim() || activeCategoryFilter !== 'all'
                        ? `Nenhum exame encontrado${catalogSearch.trim() ? ` para "${catalogSearch.trim()}"` : ''}${activeCategoryFilter !== 'all' ? ` em ${activeCategoryFilter}` : ''}.`
                        : 'Nenhum exame disponível no catálogo.'}
                    </p>
                    {(catalogSearch.trim() || activeCategoryFilter !== 'all') ? (
                      <button
                        type="button"
                        onClick={() => {
                          setCatalogSearch('')
                          setActiveCategoryFilter('all')
                        }}
                        className="text-xs font-semibold text-sky-700 hover:underline"
                      >
                        Limpar filtros
                      </button>
                    ) : null}
                    {catalogSearch.trim() ? (
                      <button
                        type="button"
                        onClick={() => addCustomExam(catalogSearch)}
                        className="btn-exam-gradient inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold"
                      >
                        <Plus className="h-4 w-4" strokeWidth={2} />
                        Adicionar como exame personalizado
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>

          <footer className="shrink-0 border-t border-gray-100 bg-gray-50/90 px-6 py-4">
            {validationHint ? (
              <p className="mb-3 text-xs font-medium text-red-600" role="alert">
                {validationHint}
              </p>
            ) : null}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] text-gray-500">
                O pedido assinado ficará disponível nos documentos da consulta.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={signing}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSign}
                  disabled={!canSign}
                  className="btn-exam-gradient inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {signing ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Assinando…
                    </>
                  ) : (
                    <>
                      <FileSignature className="h-4 w-4" strokeWidth={2} />
                      Assinar
                    </>
                  )}
                </button>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {toast}
    </>,
    document.body,
  )
}
