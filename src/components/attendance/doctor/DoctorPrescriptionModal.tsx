import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  FileSignature,
  Pencil,
  Pill,
  Plus,
  Search,
  Stethoscope,
  Trash2,
  X,
} from 'lucide-react'
import {
  PRESCRIPTION_ADMINISTRATION_ROUTES,
  PRESCRIPTION_DURATION_SUGGESTIONS,
  PRESCRIPTION_FREQUENCY_SUGGESTIONS,
  PRESCRIPTION_MEDICATION_CATALOG,
} from '../../../data/doctorPrescriptionMock'
import { Toast } from '../../ui/Toast'
import type {
  DoctorExamRequestDoctorInfo,
  DoctorExamRequestPatientInfo,
} from './DoctorExamRequestModal'
import {
  emptyPrescriptionMedicationDraft,
  formatPrescriptionMedicationSummary,
  type PrescriptionMedicationDraft,
  type PrescriptionMedicationItem,
} from './doctorPrescriptionTypes'

type DoctorPrescriptionModalProps = {
  open: boolean
  onClose: () => void
  onSigned?: (payload: {
    medications: PrescriptionMedicationItem[]
    generalNotes: string
  }) => void | Promise<void>
  patient: DoctorExamRequestPatientInfo
  doctor: DoctorExamRequestDoctorInfo
}

function createMedicationId() {
  return `med-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

const prescriptionPanelCardClass =
  'flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm'

const prescriptionPanelHeaderClass =
  'shrink-0 border-b border-gray-100 bg-gray-50/80 px-4 py-3.5 sm:px-5'

const prescriptionPanelBodyClass = 'min-h-0 flex-1 overflow-y-auto p-4 sm:p-5'

const prescriptionPanelFooterClass =
  'shrink-0 border-t border-gray-100 bg-gray-50/60 px-4 py-3.5 sm:px-5'

function GenericAllowanceToggle({
  value,
  onChange,
}: {
  value: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <div className="w-full">
      <span className="mb-1.5 block text-xs font-semibold text-gray-800">Permite genérico?</span>
      <div
        className="flex w-full rounded-xl border border-gray-200 bg-gray-50 p-0.5"
        role="group"
        aria-label="Permite substituição por genérico"
      >
        <button
          type="button"
          onClick={() => onChange(true)}
          className={[
            'flex-1 rounded-[10px] py-2.5 text-xs font-semibold transition',
            value
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900',
          ].join(' ')}
        >
          Sim
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={[
            'flex-1 rounded-[10px] py-2.5 text-xs font-semibold transition',
            !value
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900',
          ].join(' ')}
        >
          Não
        </button>
      </div>
    </div>
  )
}

export function DoctorPrescriptionModal({
  open,
  onClose,
  onSigned,
  patient,
  doctor,
}: DoctorPrescriptionModalProps) {
  const [catalogSearch, setCatalogSearch] = useState('')
  const [draft, setDraft] = useState(emptyPrescriptionMedicationDraft)
  const [medications, setMedications] = useState<PrescriptionMedicationItem[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [generalNotes, setGeneralNotes] = useState('')
  const [signing, setSigning] = useState(false)
  const [successToastVisible, setSuccessToastVisible] = useState(false)
  const [validationHint, setValidationHint] = useState<string | null>(null)

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
    setDraft(emptyPrescriptionMedicationDraft())
    setMedications([])
    setEditingId(null)
    setGeneralNotes('')
    setSigning(false)
    setValidationHint(null)
  }, [open])

  const filteredCatalog = useMemo(() => {
    const query = catalogSearch.trim().toLowerCase()
    if (!query) return PRESCRIPTION_MEDICATION_CATALOG

    return PRESCRIPTION_MEDICATION_CATALOG.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.presentation.toLowerCase().includes(query),
    )
  }, [catalogSearch])

  const catalogEmpty = catalogSearch.trim().length > 0 && filteredCatalog.length === 0

  const canSign = medications.length > 0 && !signing

  function updateDraft<K extends keyof PrescriptionMedicationDraft>(
    key: K,
    value: PrescriptionMedicationDraft[K],
  ) {
    setValidationHint(null)
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function applyCatalogItem(item: (typeof PRESCRIPTION_MEDICATION_CATALOG)[number]) {
    setDraft((current) => ({
      ...current,
      name: item.name,
      presentation: item.presentation,
    }))
    setValidationHint(null)
  }

  function resetDraftForm() {
    setDraft(emptyPrescriptionMedicationDraft())
    setEditingId(null)
    setValidationHint(null)
  }

  function validateDraft(): string | null {
    if (!draft.name.trim()) return 'Informe o nome do medicamento.'
    if (!draft.dosage.trim()) return 'Informe a posologia (ex.: 1 comprimido).'
    if (!draft.instructions.trim()) return 'Informe como o paciente deve tomar.'
    return null
  }

  function handleAddOrUpdateMedication() {
    const error = validateDraft()
    if (error) {
      setValidationHint(error)
      return
    }

    const payload: PrescriptionMedicationItem = {
      id: editingId ?? createMedicationId(),
      name: draft.name.trim(),
      presentation: draft.presentation.trim(),
      route: draft.route,
      dosage: draft.dosage.trim(),
      instructions: draft.instructions.trim(),
      duration: draft.duration.trim(),
      allowsGeneric: draft.allowsGeneric,
      quantity: draft.quantity.trim(),
      notes: draft.notes.trim(),
    }

    setMedications((current) =>
      editingId
        ? current.map((item) => (item.id === editingId ? payload : item))
        : [...current, payload],
    )
    resetDraftForm()
  }

  function handleEditMedication(item: PrescriptionMedicationItem) {
    setEditingId(item.id)
    setDraft({
      name: item.name,
      presentation: item.presentation,
      route: item.route,
      dosage: item.dosage,
      instructions: item.instructions,
      duration: item.duration,
      allowsGeneric: item.allowsGeneric,
      quantity: item.quantity,
      notes: item.notes,
    })
    setValidationHint(null)
  }

  function handleRemoveMedication(id: string) {
    setMedications((current) => current.filter((item) => item.id !== id))
    if (editingId === id) resetDraftForm()
  }

  async function handleSign() {
    if (medications.length === 0) {
      setValidationHint('Adicione ao menos um medicamento à receita.')
      return
    }

    setValidationHint(null)
    setSigning(true)

    try {
      await Promise.resolve(onSigned?.({ medications, generalNotes }))
      onClose()
      setSuccessToastVisible(false)
      requestAnimationFrame(() => setSuccessToastVisible(true))
    } finally {
      setSigning(false)
    }
  }

  const toast = (
    <Toast
      message="Receita médica assinada e disponível para o paciente"
      visible={successToastVisible}
      variant="success"
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
        aria-labelledby="prescription-title"
        onClick={signing ? undefined : onClose}
      >
        <div
          className="flex h-[90vh] w-[90vw] max-w-none flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.22)]"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="flex shrink-0 items-start justify-between gap-3 border-b border-emerald-100 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 px-6 py-4 text-white">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                <Pill className="h-5 w-5" strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <h2 id="prescription-title" className="text-lg font-bold leading-tight">
                  Receita médica
                </h2>
                <p className="mt-0.5 text-sm text-emerald-50">
                  Preencha o medicamento no centro, escolha no catálogo à direita e revise antes de
                  assinar.
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

          <div className="grid min-h-0 flex-1 grid-cols-1 items-stretch xl:grid-cols-[minmax(260px,26%)_minmax(0,1fr)_minmax(280px,28%)]">
            <aside className="flex min-h-0 flex-col bg-gray-50/40 p-4 sm:p-5">
              <div className={prescriptionPanelCardClass}>
                <div className={prescriptionPanelHeaderClass}>
                  <h3 className="text-sm font-bold text-gray-900">Dados da receita</h3>
                  <p className="mt-0.5 text-xs text-gray-500">Paciente, prescritor e itens adicionados.</p>
                </div>

                <div className={`${prescriptionPanelBodyClass} flex flex-col gap-4`}>
                  <div className="flex gap-4 rounded-xl border border-gray-100 bg-gray-50/60 p-3.5">
                    <img
                      src={patient.photoUrl}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-xl border-2 border-white object-cover shadow-sm"
                    />
                    <div className="min-w-0 pt-0.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                        Paciente
                      </p>
                      <p className="mt-0.5 text-sm font-bold leading-tight text-gray-900">
                        {patient.name}
                      </p>
                      <p className="mt-1 text-xs text-gray-600">
                        CPF {patient.cpfMasked} · {patient.ageGenderLabel}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <Stethoscope className="h-4 w-4" strokeWidth={2} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                        Prescritor
                      </p>
                      <p className="mt-0.5 text-sm font-bold text-gray-900">{doctor.name}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {doctor.specialty} · CRM {doctor.crm}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3.5">
                    <label
                      htmlFor="prescription-general-notes"
                      className="mb-1.5 block text-xs font-semibold text-gray-900"
                    >
                      Orientações gerais
                    </label>
                    <textarea
                      id="prescription-general-notes"
                      value={generalNotes}
                      onChange={(event) => setGeneralNotes(event.target.value)}
                      rows={3}
                      placeholder="Ex.: Retornar se piora dos sintomas, evitar álcool…"
                      className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                    />
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3.5">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-gray-900">Itens da receita</p>
                      <span className="text-xs font-medium text-gray-500">
                        {medications.length}{' '}
                        {medications.length === 1 ? 'medicamento' : 'medicamentos'}
                      </span>
                    </div>

                {medications.length > 0 ? (
                  <ul className="space-y-2">
                    {medications.map((item, index) => (
                      <li
                        key={item.id}
                        className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                              {index + 1}.º medicamento
                            </p>
                            <p className="mt-0.5 text-sm font-bold text-gray-900">
                              {item.name}
                              {item.presentation ? (
                                <span className="font-medium text-gray-600">
                                  {' '}
                                  — {item.presentation}
                                </span>
                              ) : null}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">{item.route}</p>
                            <span
                              className={[
                                'mt-1.5 inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold',
                                item.allowsGeneric
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-amber-50 text-amber-800',
                              ].join(' ')}
                            >
                              {item.allowsGeneric ? 'Permite genérico' : 'Não substituir'}
                            </span>
                            <p className="mt-1 text-xs leading-relaxed text-gray-700">
                              {formatPrescriptionMedicationSummary(item)}
                            </p>
                            {item.notes ? (
                              <p className="mt-1 text-xs italic text-gray-500">{item.notes}</p>
                            ) : null}
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <button
                              type="button"
                              onClick={() => handleEditMedication(item)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-emerald-700"
                              aria-label={`Editar ${item.name}`}
                            >
                              <Pencil className="h-4 w-4" strokeWidth={2} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveMedication(item.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                              aria-label={`Remover ${item.name}`}
                            >
                              <Trash2 className="h-4 w-4" strokeWidth={2} />
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-xl border border-dashed border-gray-200 bg-white px-3 py-4 text-xs leading-relaxed text-gray-500">
                    Nenhum medicamento adicionado. Preencha o formulário ao centro e clique em
                    adicionar à receita.
                  </p>
                )}
                  </div>
                </div>
              </div>
            </aside>

            <div className="flex min-h-0 flex-col bg-gray-50/40 p-4 sm:p-5">
              <div className={prescriptionPanelCardClass}>
                <div className={prescriptionPanelHeaderClass}>
                  <h3 className="text-sm font-bold text-gray-900">
                    {editingId ? 'Editar medicamento' : 'Novo medicamento'}
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Selecione um item no catálogo à direita ou preencha manualmente.
                  </p>
                </div>

                <div
                  className={`${prescriptionPanelBodyClass} flex min-h-0 flex-col gap-4 !overflow-hidden`}
                >
                <div className="grid shrink-0 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="med-name" className="mb-1.5 block text-xs font-semibold text-gray-800">
                    Medicamento <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="med-name"
                    type="text"
                    value={draft.name}
                    onChange={(event) => updateDraft('name', event.target.value)}
                    placeholder="Ex.: Paracetamol"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="med-presentation"
                    className="mb-1.5 block text-xs font-semibold text-gray-800"
                  >
                    Apresentação / concentração
                  </label>
                  <input
                    id="med-presentation"
                    type="text"
                    value={draft.presentation}
                    onChange={(event) => updateDraft('presentation', event.target.value)}
                    placeholder="Ex.: 500 mg — comprimido"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                  />
                </div>

                <div>
                  <label htmlFor="med-route" className="mb-1.5 block text-xs font-semibold text-gray-800">
                    Via de administração
                  </label>
                  <select
                    id="med-route"
                    value={draft.route}
                    onChange={(event) => updateDraft('route', event.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                  >
                    {PRESCRIPTION_ADMINISTRATION_ROUTES.map((route) => (
                      <option key={route} value={route}>
                        {route}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="med-quantity" className="mb-1.5 block text-xs font-semibold text-gray-800">
                    Quantidade
                  </label>
                  <input
                    id="med-quantity"
                    type="text"
                    value={draft.quantity}
                    onChange={(event) => updateDraft('quantity', event.target.value)}
                    placeholder="Ex.: 1 caixa"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                  />
                </div>

                <div>
                  <label htmlFor="med-dosage" className="mb-1.5 block text-xs font-semibold text-gray-800">
                    Posologia <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="med-dosage"
                    type="text"
                    value={draft.dosage}
                    onChange={(event) => updateDraft('dosage', event.target.value)}
                    placeholder="Ex.: 1 comprimido"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                  />
                </div>

                <div>
                  <label
                    htmlFor="med-instructions"
                    className="mb-1.5 block text-xs font-semibold text-gray-800"
                  >
                    Como tomar <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="med-instructions"
                    type="text"
                    value={draft.instructions}
                    onChange={(event) => updateDraft('instructions', event.target.value)}
                    placeholder="Ex.: A cada 6 horas, se dor"
                    list="prescription-frequency-list"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                  />
                  <datalist id="prescription-frequency-list">
                    {PRESCRIPTION_FREQUENCY_SUGGESTIONS.map((item) => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label
                    htmlFor="med-duration"
                    className="mb-1.5 block text-xs font-semibold text-gray-800"
                  >
                    Duração do tratamento
                  </label>
                  <input
                    id="med-duration"
                    type="text"
                    value={draft.duration}
                    onChange={(event) => updateDraft('duration', event.target.value)}
                    placeholder="Ex.: 5 dias"
                    list="prescription-duration-list"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                  />
                  <datalist id="prescription-duration-list">
                    {PRESCRIPTION_DURATION_SUGGESTIONS.map((item) => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <GenericAllowanceToggle
                    value={draft.allowsGeneric}
                    onChange={(next) => updateDraft('allowsGeneric', next)}
                  />
                </div>
                </div>

                <div className="flex min-h-0 flex-1 flex-col">
                  <label htmlFor="med-notes" className="mb-1.5 shrink-0 text-xs font-semibold text-gray-800">
                    Observações do medicamento
                  </label>
                  <textarea
                    id="med-notes"
                    value={draft.notes}
                    onChange={(event) => updateDraft('notes', event.target.value)}
                    placeholder="Ex.: Não ultrapassar 4 comprimidos por dia"
                    className="min-h-[80px] w-full flex-1 resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                  />
                </div>
                </div>

                <div className={prescriptionPanelFooterClass}>
                  {validationHint ? (
                    <p className="mb-2 text-xs font-medium text-red-600" role="alert">
                      {validationHint}
                    </p>
                  ) : null}

                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    {editingId ? (
                      <button
                        type="button"
                        onClick={resetDraftForm}
                        className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                      >
                        Cancelar edição
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={handleAddOrUpdateMedication}
                      className="btn-prescription-gradient inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
                    >
                      <Plus className="h-4 w-4" strokeWidth={2} />
                      {editingId ? 'Salvar alterações' : 'Adicionar à receita'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <aside className="flex min-h-0 flex-col bg-gray-50/40 p-4 sm:p-5">
              <div className={prescriptionPanelCardClass}>
                <div className={prescriptionPanelHeaderClass}>
                  <h3 className="text-sm font-bold text-gray-900">Catálogo de medicamentos</h3>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Digite para filtrar e clique para preencher o formulário.
                  </p>
                </div>

                <div className={`${prescriptionPanelBodyClass} flex flex-col gap-3 !overflow-hidden`}>
                  <div className="relative shrink-0">
                    <label htmlFor="prescription-catalog-search" className="sr-only">
                      Buscar medicamento
                    </label>
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      id="prescription-catalog-search"
                      type="search"
                      value={catalogSearch}
                      onChange={(event) => setCatalogSearch(event.target.value)}
                      placeholder="Filtrar medicamentos…"
                      className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                    />
                  </div>

                  <p className="shrink-0 text-xs font-medium text-gray-500">
                    {filteredCatalog.length}{' '}
                    {filteredCatalog.length === 1 ? 'resultado' : 'resultados'}
                    {catalogSearch.trim() ? ` para “${catalogSearch.trim()}”` : ''}
                  </p>

                  <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto rounded-xl border border-emerald-100 bg-emerald-50/30 p-1.5">
                {catalogEmpty ? (
                  <li className="px-3 py-6 text-center text-xs leading-relaxed text-gray-500">
                    Nenhum medicamento encontrado. Tente outro termo ou cadastre manualmente no
                    formulário.
                  </li>
                ) : (
                  filteredCatalog.map((item) => {
                    const isSelected =
                      draft.name.trim().toLowerCase() === item.name.toLowerCase()

                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => applyCatalogItem(item)}
                          className={[
                            'flex w-full flex-col rounded-lg px-3 py-2.5 text-left transition',
                            isSelected
                              ? 'bg-emerald-100 ring-1 ring-emerald-300'
                              : 'hover:bg-emerald-50',
                          ].join(' ')}
                        >
                          <span className="text-sm font-semibold text-gray-900">{item.name}</span>
                          <span className="mt-0.5 text-xs text-gray-500">{item.presentation}</span>
                        </button>
                      </li>
                    )
                  })
                )}
                  </ul>
                </div>
              </div>
            </aside>
          </div>

          <footer className="shrink-0 border-t border-gray-100 bg-gray-50/90 px-6 py-4">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] text-gray-500">
                A receita assinada ficará disponível nos documentos da consulta.
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
                  className="btn-prescription-gradient inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {signing ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Assinando…
                    </>
                  ) : (
                    <>
                      <FileSignature className="h-4 w-4" strokeWidth={2} />
                      Assinar receita
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
