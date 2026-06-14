import {
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Loader2,
  Stethoscope,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  type AdminClienteRow,
} from '../../../../types/adminClientes'
import { getAdminEntidadeCidadeOptions } from '../../../../data/adminEntidadeCidades'
import { useAdminClientesClinicoCatalog } from '../../../../hooks/useAdminClientesClinicoCatalog'
import {
  getClienteContratoTipoOption,
  useAdminClientesContratoCatalog,
} from '../../../../hooks/useAdminClientesContratoCatalog'
import { fetchIbgeCitiesByUf, fetchIbgeStates } from '../../../../data/ibgeLocalidadesApi'
import {
  CnpjReceitaFederalLookupError,
  fetchEmpresaDataByCnpjReceitaFederal,
} from '../../../../utils/cnpj/fetchCnpjReceitaFederal'
import { maskBirthDate, maskCnpj, maskCurrencyBrl, maskIntegerPtBr, maskPhone } from '../../../../utils/masks'
import { AttendanceFieldHighlight } from '../../../dashboard/AttendanceFieldHighlight'
import { CustomSelect } from '../../../ui/CustomSelect'
import { AdminClienteStatusBadge } from '../AdminClienteStatusBadge'
import { AdminClienteContratoPacientesTerritorioField } from '../AdminClienteContratoPacientesTerritorioField'
import {
  AdminClienteContratoEspecialidadesPanel,
  getVisibleSpecialtiesForContratoForm,
} from '../AdminClienteContratoEspecialidadesPanel'
import {
  selectAllVisibleSpecialties,
  setSpecialtiesSelectionForProfession,
  toggleProfessionInContratoForm,
} from '../adminClienteContratoCatalogUtils'
import { hasPositiveCurrency } from '../adminClienteContratoForm'
import { groupSpecialtiesBySelectedProfessions } from '../adminClienteContratoPricing'
import { AdminEntidadeCadastroFlowStepper } from './AdminEntidadeCadastroFlowStepper'
import { EntidadeLogoCropCard } from './EntidadeLogoCropCard'
import {
  adminEntidadeCadastroFlowSteps,
  adminEntidadeStatusOptions,
  adminEntidadeTelefoneTipoOptions,
  adminEntidadeUfOptions,
  createEmptyAdminEntidadeCadastroForm,
  isPacoteOuMensal,
  resolveAdminEntidadeCadastroStepIndex,
  validateAdminEntidadeCadastroStep,
  isAdminEntidadeCadastroStepReady,
  resolveFirstInvalidCadastroStep,
  type AdminEntidadeCadastroFormState,
  type AdminEntidadeCadastroStep,
} from './adminEntidadeCadastroTypes'

const drawerPanelShell =
  'flex min-h-0 w-full flex-col overflow-hidden rounded-3xl border border-gray-200/80 bg-gradient-to-b from-white to-slate-50/40 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_12px_32px_rgba(15,23,42,0.08)]'

const labelClass = 'mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-600'
const inputClass =
  'h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)]/45 focus:shadow-[0_0_0_3px_rgba(255,107,0,0.14)]'

const sectionTitleClass = 'text-base font-bold tracking-tight text-gray-900'
const sectionHintClass = 'mt-1 text-sm text-gray-500'
const sectionCardClass = 'rounded-2xl border border-gray-200/80 bg-white px-4 py-4 shadow-sm'
const fieldsetClass = 'rounded-2xl border border-gray-200/80 bg-white px-4 py-4 shadow-sm'
const legendClass = 'px-1 text-[11px] font-bold uppercase tracking-wide text-gray-600'

const batchLoteActionButtonClass =
  'inline-flex h-10 shrink-0 items-center justify-center rounded-xl px-3 text-xs font-semibold whitespace-nowrap'

function hasCurrencyInput(value: string) {
  return value.replace(/\D/g, '').length > 0
}

function applyBatchValueToPrecos(
  precos: Record<string, string>,
  targetIds: string[],
  batchVal: string,
) {
  const next = { ...precos }
  let applied = 0
  let skipped = 0

  for (const id of targetIds) {
    if (hasPositiveCurrency(next[id] ?? '')) {
      skipped += 1
      continue
    }
    next[id] = batchVal
    applied += 1
  }

  return { next, applied, skipped }
}

function buildExcedenteBatchFeedback(
  batchVal: string,
  applied: number,
  skipped: number,
  scope: 'all' | 'selected',
): string {
  if (applied === 0 && skipped > 0) {
    return scope === 'all'
      ? 'Todas as especialidades já tinham excedente definido. Nenhum campo foi alterado.'
      : 'Todas as incluídas no lote já tinham excedente. Nenhum campo foi alterado.'
  }
  if (applied === 0) {
    return 'Nenhuma especialidade elegível para receber o excedente em lote.'
  }
  if (skipped === 0) {
    return scope === 'all'
      ? `Valor ${batchVal} aplicado em ${applied} excedente(s) vazio(s) do contrato.`
      : `Valor ${batchVal} aplicado em ${applied} especialidade(s) do lote sem excedente.`
  }
  return scope === 'all'
    ? `Valor ${batchVal} aplicado em ${applied} excedente(s) vazio(s). ${skipped} já tinham valor e foram mantidos.`
    : `Valor ${batchVal} aplicado em ${applied} do lote sem excedente. ${skipped} com valor anterior mantido(s).`
}

function setExcedenteLoteSelection(
  current: Set<string>,
  specialtyIds: string[],
  selected: boolean,
): Set<string> {
  const next = new Set(current)
  for (const specialtyId of specialtyIds) {
    if (selected) next.add(specialtyId)
    else next.delete(specialtyId)
  }
  return next
}

type AdminEntidadeCadastroDrawerProps = {
  open: boolean
  closing: boolean
  onClose: () => void
  onTransitionEnd: () => void
  onSubmit: (form: AdminEntidadeCadastroFormState) => Promise<void>
}

function patchForm(
  current: AdminEntidadeCadastroFormState,
  patch: Partial<AdminEntidadeCadastroFormState>,
): AdminEntidadeCadastroFormState {
  return { ...current, ...patch }
}

function normalizeCityName(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .trim()
    .toLowerCase()
}

function resolveMunicipioInList(cidade: string, cities: string[]) {
  if (!cidade.trim()) return ''
  const exact = cities.find((item) => item === cidade)
  if (exact) return exact
  const normalized = normalizeCityName(cidade)
  return cities.find((item) => normalizeCityName(item) === normalized) ?? cidade
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-slate-50/80 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-gray-900">{value || '—'}</p>
    </div>
  )
}

export function AdminEntidadeCadastroDrawer({
  open,
  closing,
  onClose,
  onTransitionEnd,
  onSubmit,
}: AdminEntidadeCadastroDrawerProps) {
  const { professions, specialties: catalogSpecialties } = useAdminClientesClinicoCatalog()
  const { contractTypes } = useAdminClientesContratoCatalog()
  const contratoTipoOptions = useMemo(
    () => contractTypes.map((item) => ({ value: item.id, label: item.label })),
    [contractTypes],
  )
  const sortedSpecialties = useMemo(
    () => [...catalogSpecialties].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [catalogSpecialties],
  )
  const [entered, setEntered] = useState(false)
  const [step, setStep] = useState<AdminEntidadeCadastroStep>('entidade')
  const [form, setForm] = useState<AdminEntidadeCadastroFormState>(createEmptyAdminEntidadeCadastroForm)
  const [stepError, setStepError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const stepErrorRef = useRef<HTMLParagraphElement>(null)

  const isActive = open || closing
  const panelVisible = isActive && entered && !closing

  const stepIndex = resolveAdminEntidadeCadastroStepIndex(step)
  const isFirstStep = stepIndex === 0
  const isLastStep = step === 'revisao'
  const pacoteOuMensal = isPacoteOuMensal(form.contratoModalidade)
  const selectedContratoTipo = getClienteContratoTipoOption(contractTypes, form.contratoTipo)
  const canAdvance = useMemo(
    () => isAdminEntidadeCadastroStepReady(step, form),
    [step, form],
  )

  const visibleSpecialties = useMemo(
    () => getVisibleSpecialtiesForContratoForm(sortedSpecialties, form.professionIds),
    [sortedSpecialties, form.professionIds],
  )

  const selectedSpecialties = useMemo(
    () => sortedSpecialties.filter((item) => form.specialtyIds.has(item.id)),
    [form.specialtyIds, sortedSpecialties],
  )

  const [batchSpecialtyValue, setBatchSpecialtyValue] = useState('')
  const [batchExcedenteValue, setBatchExcedenteValue] = useState('')
  const [batchExcedenteFeedback, setBatchExcedenteFeedback] = useState<string | null>(null)
  const [excedenteLoteIds, setExcedenteLoteIds] = useState<Set<string>>(() => new Set())

  const groupedExcedenteSpecialties = useMemo(
    () => groupSpecialtiesBySelectedProfessions(sortedSpecialties, form.professionIds, professions),
    [sortedSpecialties, form.professionIds, professions],
  )

  const [ufOptions, setUfOptions] = useState(adminEntidadeUfOptions)
  const [cidadeOptions, setCidadeOptions] = useState(() => getAdminEntidadeCidadeOptions(form.uf))
  const [citiesLoading, setCitiesLoading] = useState(false)
  const [cnpjLookupLoading, setCnpjLookupLoading] = useState(false)
  const [cnpjLookupError, setCnpjLookupError] = useState<string | null>(null)
  const [highlightStatusInicial, setHighlightStatusInicial] = useState(false)
  const citiesCacheRef = useRef(new Map<string, string[]>())
  const statesFetchedRef = useRef(false)
  const lastFetchedCnpjRef = useRef('')
  const cnpjDigits = form.cnpj.replace(/\D/g, '')

  useEffect(() => {
    if (!open || contractTypes.length === 0) return
    setForm((current) => {
      const selected = getClienteContratoTipoOption(contractTypes, current.contratoTipo)
      if (selected) return current
      const first = contractTypes[0]
      if (!first) return current
      return {
        ...current,
        contratoTipo: first.id,
        contratoModalidade: first.modalidade,
      }
    })
  }, [open, contractTypes])

  useEffect(() => {
    if (!open) {
      setEntered(false)
      return
    }

    setStep('entidade')
    setStepError(null)
    setIsSaving(false)
    setCnpjLookupError(null)
    setCnpjLookupLoading(false)
    setHighlightStatusInicial(false)
    lastFetchedCnpjRef.current = ''
    setBatchSpecialtyValue('')
    setBatchExcedenteValue('')
    setBatchExcedenteFeedback(null)
    setExcedenteLoteIds(new Set())
    setForm(createEmptyAdminEntidadeCadastroForm())

    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true))
    })
    return () => cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    if (!open) return
    if (statesFetchedRef.current) return

    const controller = new AbortController()
    let cancelled = false

    fetchIbgeStates(controller.signal)
      .then((options) => {
        if (cancelled) return
        if (options.length) {
          setUfOptions(options as typeof adminEntidadeUfOptions)
          statesFetchedRef.current = true
        }
      })
      .catch(() => {
        // fallback: mantém adminEntidadeUfOptions
      })
      .finally(() => {
        if (cancelled) return
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [open])

  useEffect(() => {
    if (!open || step !== 'entidade') return

    const uf = form.uf
    if (!uf) {
      setCidadeOptions([])
      return
    }

    const cached = citiesCacheRef.current.get(uf)
    if (cached && cached.length) {
      setCidadeOptions(cached.map((city) => ({ value: city, label: city })))
      setCitiesLoading(false)
      return
    }

    const controller = new AbortController()
    let cancelled = false

    setCitiesLoading(true)
    fetchIbgeCitiesByUf(uf, controller.signal)
      .then((cities) => {
        if (cancelled) return
        citiesCacheRef.current.set(uf, cities)
        setCidadeOptions(cities.map((city) => ({ value: city, label: city })))
      })
      .catch(() => {
        // fallback: mapa estático
        setCidadeOptions(getAdminEntidadeCidadeOptions(uf))
      })
      .finally(() => {
        if (cancelled) return
        setCitiesLoading(false)
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [open, step, form.uf])

  useEffect(() => {
    if (!open || step !== 'entidade') return
    if (cnpjDigits.length !== 14) {
      if (cnpjDigits.length < 14) lastFetchedCnpjRef.current = ''
      return
    }
    if (lastFetchedCnpjRef.current === cnpjDigits) return

    let cancelled = false
    lastFetchedCnpjRef.current = cnpjDigits

    async function lookupCnpj() {
      setCnpjLookupLoading(true)
      setCnpjLookupError(null)
      try {
        const data = await fetchEmpresaDataByCnpjReceitaFederal(form.cnpj)
        if (cancelled) return

        let municipio = data.cidade
        if (data.uf) {
          const cached = citiesCacheRef.current.get(data.uf)
          let cities = cached
          if (!cities?.length) {
            try {
              cities = await fetchIbgeCitiesByUf(data.uf)
              citiesCacheRef.current.set(data.uf, cities)
            } catch {
              cities = getAdminEntidadeCidadeOptions(data.uf).map((option) => option.value)
            }
          }
          municipio = resolveMunicipioInList(data.cidade, cities)
        }

        setForm((prev) => ({
          ...prev,
          cnpj: data.cnpj || prev.cnpj,
          razaoSocial: data.razaoSocial || prev.razaoSocial,
          uf: data.uf || prev.uf,
          municipio: municipio || prev.municipio,
          nome: prev.nome.trim() ? prev.nome : municipio || data.nomeFantasia || prev.nome,
        }))
        setHighlightStatusInicial(true)
      } catch (error) {
        if (cancelled) return
        lastFetchedCnpjRef.current = ''
        const message =
          error instanceof CnpjReceitaFederalLookupError
            ? error.message
            : 'Não foi possível consultar o CNPJ. Tente novamente.'
        setCnpjLookupError(message)
      } finally {
        if (!cancelled) setCnpjLookupLoading(false)
      }
    }

    void lookupCnpj()
    return () => {
      cancelled = true
    }
  }, [open, step, cnpjDigits, form.cnpj])

  useEffect(() => {
    if (!isActive) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive, onClose])

  useEffect(() => {
    if (!closing) return
    const fallback = window.setTimeout(() => onTransitionEnd(), 350)
    return () => window.clearTimeout(fallback)
  }, [closing, onTransitionEnd])

  function updateForm(patch: Partial<AdminEntidadeCadastroFormState>) {
    setStepError(null)
    setForm((current) => patchForm(current, patch))
  }

  function handleUfChange(uf: string) {
    setForm((current) => ({ ...current, uf, municipio: '' }))
  }

  function updatePrecoProfissao(professionId: string, value: string) {
    setForm((current) => ({
      ...current,
      precosProfissao: { ...current.precosProfissao, [professionId]: value },
    }))
  }

  function updatePrecoEspecialidade(specialtyId: string, value: string) {
    setForm((current) => ({
      ...current,
      precosEspecialidade: { ...current.precosEspecialidade, [specialtyId]: value },
    }))
  }

  function updateExcedentePrecoEspecialidade(specialtyId: string, value: string) {
    setForm((current) => ({
      ...current,
      excedentePrecosEspecialidade: {
        ...current.excedentePrecosEspecialidade,
        [specialtyId]: value,
      },
    }))
  }

  function updateExcedentePrecoProfissao(professionId: string, value: string) {
    setForm((current) => ({
      ...current,
      excedentePrecosProfissao: {
        ...current.excedentePrecosProfissao,
        [professionId]: value,
      },
    }))
  }

  function toggleExcedenteLote(id: string) {
    setExcedenteLoteIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setBatchExcedenteFeedback(null)
  }

  function selectAllExcedenteLote() {
    setExcedenteLoteIds(new Set(selectedSpecialties.map((item) => item.id)))
    setBatchExcedenteFeedback(null)
  }

  function clearAllExcedenteLote() {
    setExcedenteLoteIds(new Set())
    setBatchExcedenteFeedback(null)
  }

  function toggleExcedenteLoteForProfession(specialtyIds: string[], selectAll: boolean) {
    setExcedenteLoteIds((current) => setExcedenteLoteSelection(current, specialtyIds, selectAll))
    setBatchExcedenteFeedback(null)
  }

  function applyBatchExcedenteToAll() {
    if (!hasCurrencyInput(batchExcedenteValue)) {
      setBatchExcedenteFeedback('Informe o valor em lote antes de aplicar.')
      return
    }
    if (selectedSpecialties.length === 0) {
      setBatchExcedenteFeedback('Volte ao passo anterior e marque as especialidades do contrato.')
      return
    }

    const targetIds = selectedSpecialties.map((item) => item.id)
    const { next, applied, skipped } = applyBatchValueToPrecos(
      form.excedentePrecosEspecialidade,
      targetIds,
      batchExcedenteValue,
    )
    setForm((current) => ({ ...current, excedentePrecosEspecialidade: next }))
    setExcedenteLoteIds(new Set(targetIds))
    setBatchExcedenteFeedback(
      buildExcedenteBatchFeedback(batchExcedenteValue, applied, skipped, 'all'),
    )
  }

  function applyBatchExcedenteToSelected() {
    if (!hasCurrencyInput(batchExcedenteValue)) {
      setBatchExcedenteFeedback('Informe o valor em lote antes de aplicar.')
      return
    }
    if (excedenteLoteIds.size === 0) {
      setBatchExcedenteFeedback(
        'Marque “Incluir no lote” nas especialidades que devem receber o excedente.',
      )
      return
    }

    const targetIds = [...excedenteLoteIds]
    const { next, applied, skipped } = applyBatchValueToPrecos(
      form.excedentePrecosEspecialidade,
      targetIds,
      batchExcedenteValue,
    )
    setForm((current) => ({ ...current, excedentePrecosEspecialidade: next }))
    setBatchExcedenteFeedback(
      buildExcedenteBatchFeedback(batchExcedenteValue, applied, skipped, 'selected'),
    )
  }

  function toggleProfession(professionId: string) {
    setForm((current) => toggleProfessionInContratoForm(current, professionId, sortedSpecialties))
  }

  function toggleSpecialty(id: string) {
    setForm((current) => {
      const next = new Set(current.specialtyIds)
      const precosEspecialidade = { ...current.precosEspecialidade }
      const excedentePrecosEspecialidade = { ...current.excedentePrecosEspecialidade }

      if (next.has(id)) {
        next.delete(id)
        delete precosEspecialidade[id]
        delete excedentePrecosEspecialidade[id]
      } else {
        next.add(id)
      }

      return {
        ...current,
        specialtyIds: next,
        precosEspecialidade,
        excedentePrecosEspecialidade,
      }
    })
  }

  function selectAllSpecialties() {
    setForm((current) => selectAllVisibleSpecialties(current, visibleSpecialties))
  }

  function clearAllSpecialties() {
    setForm((current) => ({
      ...current,
      specialtyIds: new Set(),
      precosEspecialidade: {},
      excedentePrecosEspecialidade: {},
    }))
  }

  function toggleAllSpecialtiesForProfession(
    _professionId: string,
    specialtyIds: string[],
    selectAll: boolean,
  ) {
    setForm((current) =>
      setSpecialtiesSelectionForProfession(current, specialtyIds, selectAll),
    )
  }

  function showStepValidationError(targetStep: AdminEntidadeCadastroStep, error: string) {
    setStep(targetStep)
    setStepError(error)
    requestAnimationFrame(() => {
      stepErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      stepErrorRef.current?.focus()
    })
  }

  function goBack() {
    setStepError(null)
    const prev = adminEntidadeCadastroFlowSteps[stepIndex - 1]
    if (prev) setStep(prev.id)
  }

  function goNext() {
    setStepError(null)
    const error = validateAdminEntidadeCadastroStep(step, form)
    if (error) {
      showStepValidationError(step, error)
      return
    }

    const next = adminEntidadeCadastroFlowSteps[stepIndex + 1]
    if (next) setStep(next.id)
  }

  async function handleSubmit() {
    setStepError(null)

    const invalid = resolveFirstInvalidCadastroStep(form)
    if (invalid) {
      showStepValidationError(invalid.step, invalid.error)
      return
    }

    setIsSaving(true)
    try {
      await onSubmit(form)
      onClose()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível concluir o cadastro.'
      setStep('revisao')
      setStepError(message)
      requestAnimationFrame(() => {
        stepErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        stepErrorRef.current?.focus()
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!isActive) return null

  const titleId = 'admin-entidade-cadastro-title'

  return createPortal(
    <div
      className={`fixed inset-0 z-[9998] ${panelVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          panelVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-label="Fechar cadastro de entidade"
        onClick={onClose}
        tabIndex={panelVisible ? 0 : -1}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onTransitionEnd={(event) => {
          if (event.target !== event.currentTarget) return
          if (event.propertyName === 'transform') onTransitionEnd()
        }}
        className={`absolute inset-x-0 bottom-0 flex h-[92vh] max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border-t border-gray-200/90 bg-gradient-to-b from-slate-50 via-white to-white shadow-[0_-24px_64px_rgba(15,23,42,0.22)] transition-transform duration-300 ease-out motion-reduce:transition-none ${
          panelVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <header className="shrink-0 border-b border-gray-200/80 bg-gradient-to-r from-[var(--brand-primary-light)]/45 via-white to-slate-100/70 px-5 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary-light)] text-[var(--brand-primary)] shadow-sm">
                <Building2 className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <h2 id={titleId} className="text-lg font-bold tracking-tight text-gray-900">
                  Nova entidade
                </h2>
                <p className="text-xs text-gray-500 sm:text-sm">
                  Cadastro mestre, contatos, contrato e especialidades autorizadas.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-5 py-4 sm:px-6">
          <AdminEntidadeCadastroFlowStepper step={step} />

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {step === 'entidade' ? (
              <section className={`${drawerPanelShell} min-h-0 flex-1 overflow-y-auto p-5 sm:p-6`}>
                <div className="flex min-h-0 flex-1 flex-col space-y-4">
                  <div className={sectionCardClass}>
                    <p className={sectionTitleClass}>Identificação</p>
                    <p className={sectionHintClass}>
                      CNPJ, razão social e localização. Logo opcional, exibido na lista.
                    </p>
                  </div>

                  <EntidadeLogoCropCard
                    value={form.logoDataUrl}
                    onChange={(logoDataUrl) => updateForm({ logoDataUrl })}
                    entityName={form.nome}
                  />

                  <div className="grid gap-3 lg:grid-cols-12">
                    <label className="relative min-w-0 lg:col-span-3">
                      <span className={labelClass}>CNPJ</span>
                      <input
                        className={`${inputClass} pr-10`}
                        value={form.cnpj}
                        onChange={(e) => {
                          const cnpj = maskCnpj(e.target.value)
                          const digits = cnpj.replace(/\D/g, '')
                          if (digits.length < 14) lastFetchedCnpjRef.current = ''
                          setCnpjLookupError(null)
                          updateForm({ cnpj })
                        }}
                        placeholder="00.000.000/0001-00"
                        inputMode="numeric"
                      />
                      {cnpjLookupLoading ? (
                        <Loader2
                          className="pointer-events-none absolute right-3 top-[1.85rem] h-4 w-4 animate-spin text-gray-400"
                          aria-hidden
                        />
                      ) : null}
                    </label>
                    <label className="min-w-0 lg:col-span-9">
                      <span className={labelClass}>Razão social da entidade</span>
                      <input
                        className={inputClass}
                        value={form.razaoSocial}
                        onChange={(e) => updateForm({ razaoSocial: e.target.value })}
                        placeholder="Razão social completa"
                      />
                    </label>
                  </div>
                  {cnpjLookupError ? (
                    <p role="alert" className="text-xs text-red-600">
                      {cnpjLookupError}
                    </p>
                  ) : null}
                  {cnpjLookupLoading && !cnpjLookupError ? (
                    <p className="text-xs text-gray-500">Consultando CNPJ na Receita Federal…</p>
                  ) : null}

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12">
                    <label className="min-w-0 lg:col-span-3">
                      <span className={labelClass}>UF</span>
                      <CustomSelect
                        value={form.uf}
                        onChange={handleUfChange}
                        options={ufOptions}
                        size="compact"
                        className="w-full"
                        menuMinWidthPx={120}
                      />
                    </label>
                    <label className="min-w-0 lg:col-span-9">
                      <span className={labelClass}>Cidade</span>
                      <CustomSelect
                        value={form.municipio}
                        onChange={(value) => updateForm({ municipio: value })}
                        options={cidadeOptions}
                        placeholder={
                          citiesLoading
                            ? 'Carregando cidades...'
                            : cidadeOptions.length > 0
                              ? 'Selecione a cidade'
                              : 'Nenhuma cidade para esta UF'
                        }
                        size="compact"
                        className="w-full"
                        menuMinWidthPx={240}
                      />
                    </label>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12">
                    <label className="sm:col-span-2 lg:col-span-7">
                      <span className={labelClass}>Nome da entidade</span>
                      <input
                        className={inputClass}
                        value={form.nome}
                        onChange={(e) => updateForm({ nome: e.target.value })}
                        placeholder="Ex.: Brasília"
                      />
                    </label>
                    <AttendanceFieldHighlight
                      highlight={highlightStatusInicial}
                      className="lg:col-span-5"
                    >
                      <label className="block">
                        <span className={labelClass}>Status inicial</span>
                        <CustomSelect
                          value={form.status}
                          onChange={(value) => {
                            setHighlightStatusInicial(false)
                            updateForm({
                              status: value as AdminEntidadeCadastroFormState['status'],
                            })
                          }}
                          options={adminEntidadeStatusOptions}
                          size="compact"
                          className="w-full"
                        />
                        {highlightStatusInicial ? (
                          <p className="mt-1.5 text-xs font-medium text-amber-800">
                            Confira o status da entidade antes de continuar.
                          </p>
                        ) : null}
                      </label>
                    </AttendanceFieldHighlight>
                    <label className="sm:col-span-2 lg:col-span-12">
                      <span className={labelClass}>Subtítulo / tipo</span>
                      <input
                        className={inputClass}
                        value={form.subtitulo}
                        onChange={(e) => updateForm({ subtitulo: e.target.value })}
                        placeholder="Prefeitura Municipal"
                      />
                    </label>
                  </div>
                </div>
              </section>
            ) : null}

            {step === 'contatos' ? (
              <section className={`${drawerPanelShell} min-h-0 flex-1 overflow-y-auto p-5 sm:p-6`}>
                <div className="space-y-5">
                  <div className={sectionCardClass}>
                    <p className={sectionTitleClass}>Contatos operacionais</p>
                    <p className={sectionHintClass}>
                      Gestor da entidade, saúde, gestor do contrato e TI responsáveis pelo
                      relacionamento com a Telefarmed.
                    </p>
                  </div>

                  <fieldset className={fieldsetClass}>
                    <legend className={legendClass}>
                      Gestor da entidade
                    </legend>
                    <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-12">
                      <label className="lg:col-span-4">
                        <span className={labelClass}>Nome</span>
                        <input
                          className={inputClass}
                          value={form.gestorNome}
                          onChange={(e) => updateForm({ gestorNome: e.target.value })}
                        />
                      </label>
                      <label className="lg:col-span-4">
                        <span className={labelClass}>E-mail</span>
                        <input
                          type="email"
                          className={inputClass}
                          value={form.gestorEmail}
                          onChange={(e) => updateForm({ gestorEmail: e.target.value })}
                        />
                      </label>
                      <div className="sm:col-span-2 lg:col-span-4">
                        <span className={labelClass}>Telefone</span>
                        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_8rem]">
                          <input
                            className={inputClass}
                            value={form.gestorTelefone}
                            onChange={(e) =>
                              updateForm({ gestorTelefone: maskPhone(e.target.value) })
                            }
                            placeholder="(00) 00000-0000"
                          />
                          <CustomSelect
                            value={form.gestorTelefoneTipo}
                            onChange={(value) =>
                              updateForm({
                                gestorTelefoneTipo:
                                  value as AdminEntidadeCadastroFormState['gestorTelefoneTipo'],
                              })
                            }
                            options={adminEntidadeTelefoneTipoOptions}
                            size="compact"
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </fieldset>

                  <fieldset className={fieldsetClass}>
                    <legend className={legendClass}>
                      Saúde
                    </legend>
                    <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-12">
                      <label className="lg:col-span-4">
                        <span className={labelClass}>Nome</span>
                        <input
                          className={inputClass}
                          value={form.saudeNome}
                          onChange={(e) => updateForm({ saudeNome: e.target.value })}
                        />
                      </label>
                      <label className="lg:col-span-4">
                        <span className={labelClass}>E-mail</span>
                        <input
                          type="email"
                          className={inputClass}
                          value={form.saudeEmail}
                          onChange={(e) => updateForm({ saudeEmail: e.target.value })}
                        />
                      </label>
                      <div className="sm:col-span-2 lg:col-span-4">
                        <span className={labelClass}>Telefone</span>
                        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_8rem]">
                          <input
                            className={inputClass}
                            value={form.saudeTelefone}
                            onChange={(e) =>
                              updateForm({ saudeTelefone: maskPhone(e.target.value) })
                            }
                            placeholder="(00) 00000-0000"
                          />
                          <CustomSelect
                            value={form.saudeTelefoneTipo}
                            onChange={(value) =>
                              updateForm({
                                saudeTelefoneTipo:
                                  value as AdminEntidadeCadastroFormState['saudeTelefoneTipo'],
                              })
                            }
                            options={adminEntidadeTelefoneTipoOptions}
                            size="compact"
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </fieldset>

                  <fieldset className={fieldsetClass}>
                    <legend className={legendClass}>
                      Gestor do contrato
                    </legend>
                    <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-12">
                      <label className="lg:col-span-4">
                        <span className={labelClass}>Nome</span>
                        <input
                          className={inputClass}
                          value={form.contratoNome}
                          onChange={(e) => updateForm({ contratoNome: e.target.value })}
                        />
                      </label>
                      <label className="lg:col-span-4">
                        <span className={labelClass}>E-mail</span>
                        <input
                          type="email"
                          className={inputClass}
                          value={form.contratoEmail}
                          onChange={(e) => updateForm({ contratoEmail: e.target.value })}
                        />
                      </label>
                      <div className="sm:col-span-2 lg:col-span-4">
                        <span className={labelClass}>Telefone</span>
                        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_8rem]">
                          <input
                            className={inputClass}
                            value={form.contratoTelefone}
                            onChange={(e) =>
                              updateForm({ contratoTelefone: maskPhone(e.target.value) })
                            }
                            placeholder="(00) 00000-0000"
                          />
                          <CustomSelect
                            value={form.contratoTelefoneTipo}
                            onChange={(value) =>
                              updateForm({
                                contratoTelefoneTipo:
                                  value as AdminEntidadeCadastroFormState['contratoTelefoneTipo'],
                              })
                            }
                            options={adminEntidadeTelefoneTipoOptions}
                            size="compact"
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </fieldset>

                  <fieldset className={fieldsetClass}>
                    <legend className={legendClass}>
                      TI
                    </legend>
                    <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-12">
                      <label className="lg:col-span-4">
                        <span className={labelClass}>Nome</span>
                        <input
                          className={inputClass}
                          value={form.tiNome}
                          onChange={(e) => updateForm({ tiNome: e.target.value })}
                        />
                      </label>
                      <label className="lg:col-span-4">
                        <span className={labelClass}>E-mail</span>
                        <input
                          type="email"
                          className={inputClass}
                          value={form.tiEmail}
                          onChange={(e) => updateForm({ tiEmail: e.target.value })}
                        />
                      </label>
                      <div className="sm:col-span-2 lg:col-span-4">
                        <span className={labelClass}>Telefone</span>
                        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_8rem]">
                          <input
                            className={inputClass}
                            value={form.tiTelefone}
                            onChange={(e) =>
                              updateForm({ tiTelefone: maskPhone(e.target.value) })
                            }
                            placeholder="(00) 00000-0000"
                          />
                          <CustomSelect
                            value={form.tiTelefoneTipo}
                            onChange={(value) =>
                              updateForm({
                                tiTelefoneTipo:
                                  value as AdminEntidadeCadastroFormState['tiTelefoneTipo'],
                              })
                            }
                            options={adminEntidadeTelefoneTipoOptions}
                            size="compact"
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </fieldset>
                </div>
              </section>
            ) : null}

            {step === 'contrato' ? (
              <section className={`${drawerPanelShell} min-h-0 flex-1 overflow-y-auto p-5 sm:p-6`}>
                <div className="space-y-4">
                  <div className={sectionCardClass}>
                    <p className={sectionTitleClass}>Contrato inicial</p>
                    <p className={sectionHintClass}>
                      Dados do contrato e volumes para pacote fechado ou mensal.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12">
                    <label className="lg:col-span-4">
                      <span className={labelClass}>Numero do contrato</span>
                      <input
                        className={inputClass}
                        value={form.numeroContrato}
                        onChange={(e) => updateForm({ numeroContrato: e.target.value })}
                        placeholder="Ex.: CTR-BSB-001/2026"
                      />
                    </label>
                    <label className="lg:col-span-3">
                      <span className={labelClass}>Tipo de contrato</span>
                      <CustomSelect
                        value={form.contratoTipo}
                        onChange={(value) => {
                          const selected = getClienteContratoTipoOption(contractTypes, value)
                          updateForm({
                            contratoTipo: value,
                            contratoModalidade:
                              selected?.modalidade ?? form.contratoModalidade,
                          })
                        }}
                        options={
                          contratoTipoOptions.length
                            ? contratoTipoOptions
                            : [{ value: form.contratoTipo, label: 'Carregando…' }]
                        }
                        size="compact"
                        className="w-full"
                      />
                    </label>
                    <label className="lg:col-span-3">
                      <span className={labelClass}>Inicio da vigencia</span>
                      <input
                        className={inputClass}
                        value={form.vigenciaInicio}
                        onChange={(e) =>
                          updateForm({ vigenciaInicio: maskBirthDate(e.target.value) })
                        }
                        placeholder="dd/mm/aaaa"
                        inputMode="numeric"
                      />
                    </label>
                    <label className="lg:col-span-3">
                      <span className={labelClass}>Fim da vigencia</span>
                      <input
                        className={inputClass}
                        value={form.vigenciaFim}
                        onChange={(e) =>
                          updateForm({ vigenciaFim: maskBirthDate(e.target.value) })
                        }
                        placeholder="dd/mm/aaaa"
                        inputMode="numeric"
                      />
                    </label>
                    {pacoteOuMensal ? (
                      <>
                        <label className="lg:col-span-3">
                          <span className={labelClass}>
                            Consultas contratadas
                            {form.contratoModalidade === 'mensal' ? ' (mensal)' : ' (pacote)'}
                          </span>
                          <input
                            className={inputClass}
                            value={form.consultasContratadas}
                            onChange={(e) =>
                              updateForm({
                                consultasContratadas: maskIntegerPtBr(e.target.value),
                              })
                            }
                            placeholder="Ex.: 5.000"
                            inputMode="numeric"
                          />
                        </label>
                      </>
                    ) : (
                      <p className="sm:col-span-2 lg:col-span-12 rounded-lg border border-dashed border-gray-200 bg-slate-50 px-3 py-3 text-sm text-gray-600">
                        Contratos sob demanda não possuem volume fechado. Os valores de cada
                        consulta são definidos por especialidade na etapa seguinte.
                      </p>
                    )}
                  </div>
                  <AdminClienteContratoPacientesTerritorioField
                    checked={form.aceitaPacientesOutrosMunicipios}
                    onChange={(checked) =>
                      updateForm({ aceitaPacientesOutrosMunicipios: checked })
                    }
                  />
                </div>
              </section>
            ) : null}

            {step === 'especialidades' ? (
              <section className={`${drawerPanelShell} min-h-0 flex-1 overflow-y-auto p-5 sm:p-6`}>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div className={sectionCardClass}>
                      <p className={sectionTitleClass}>Profissões, especialidades e valores</p>
                      <p className={sectionHintClass}>
                        Selecione as profissões autorizadas e, em seguida, marque as especialidades
                        com o valor de cada consulta.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={selectAllSpecialties}
                        disabled={visibleSpecialties.length === 0}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition enabled:hover:bg-gray-50 disabled:opacity-50"
                      >
                        Selecionar todas visíveis
                      </button>
                      <button
                        type="button"
                        onClick={clearAllSpecialties}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>
                  <AdminClienteContratoEspecialidadesPanel
                    professions={professions}
                    specialties={sortedSpecialties}
                    professionIds={form.professionIds}
                    specialtyIds={form.specialtyIds}
                    precosProfissao={form.precosProfissao}
                    precosEspecialidade={form.precosEspecialidade}
                    onToggleProfession={toggleProfession}
                    onToggleSpecialty={toggleSpecialty}
                    onToggleAllSpecialtiesForProfession={toggleAllSpecialtiesForProfession}
                    onPrecoProfissaoChange={(professionId, value) =>
                      updatePrecoProfissao(professionId, maskCurrencyBrl(value))
                    }
                    onPrecoChange={(specialtyId, value) =>
                      updatePrecoEspecialidade(specialtyId, maskCurrencyBrl(value))
                    }
                    inputClass={inputClass}
                    labelClass={labelClass}
                    batchControls={
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <p className="text-xs font-medium text-gray-500">
                          {form.specialtyIds.size} de {visibleSpecialties.length} especialidade(s)
                          visível(is) selecionada(s)
                        </p>
                        <div className="flex flex-wrap items-end gap-2">
                          <label className="flex items-center gap-2">
                            <span className={labelClass}>Valor em lote</span>
                            <input
                              className={`${inputClass} w-32`}
                              value={batchSpecialtyValue}
                              onChange={(e) =>
                                setBatchSpecialtyValue(maskCurrencyBrl(e.target.value))
                              }
                              placeholder="R$ 0,00"
                              inputMode="numeric"
                            />
                          </label>
                          <button
                            type="button"
                            disabled={!batchSpecialtyValue || form.specialtyIds.size === 0}
                            onClick={() => {
                              if (!batchSpecialtyValue) return
                              setForm((current) => {
                                if (current.specialtyIds.size === 0) return current
                                const nextPrecos = { ...current.precosEspecialidade }
                                for (const specialtyId of current.specialtyIds) {
                                  nextPrecos[specialtyId] = batchSpecialtyValue
                                }
                                return { ...current, precosEspecialidade: nextPrecos }
                              })
                            }}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition enabled:hover:bg-gray-50 disabled:opacity-50"
                          >
                            Aplicar a todas selecionadas
                          </button>
                          <button
                            type="button"
                            disabled={!batchSpecialtyValue || form.specialtyIds.size === 0}
                            onClick={() => {
                              if (!batchSpecialtyValue) return
                              setForm((current) => {
                                if (current.specialtyIds.size === 0) return current
                                const nextPrecos = { ...current.precosEspecialidade }
                                for (const specialtyId of current.specialtyIds) {
                                  if (!nextPrecos[specialtyId]) {
                                    nextPrecos[specialtyId] = batchSpecialtyValue
                                  }
                                }
                                return { ...current, precosEspecialidade: nextPrecos }
                              })
                            }}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition enabled:hover:bg-gray-50 disabled:opacity-50"
                          >
                            Preencher apenas as em branco
                          </button>
                        </div>
                      </div>
                    }
                  />
                </div>
              </section>
            ) : null}

            {step === 'excedente' ? (
              <section className={`${drawerPanelShell} min-h-0 flex-1 overflow-y-auto p-5 sm:p-6`}>
                <div className="space-y-4">
                  <div className={sectionCardClass}>
                    <p className={sectionTitleClass}>Ultrapassagem do volume</p>
                    <p className={sectionHintClass}>
                      Defina se a entidade pode exceder o pacote e o valor de excedente por
                      especialidade autorizada.
                    </p>
                  </div>
                  {!pacoteOuMensal ? (
                    <p className="rounded-lg border border-gray-200 bg-slate-50 px-4 py-3 text-sm text-gray-600">
                      Regras de ultrapassagem aplicam-se apenas a contratos mensais ou de pacote
                      fechado.
                    </p>
                  ) : (
                    <>
                      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
                        <input
                          type="checkbox"
                          checked={form.permiteUltrapassar}
                          onChange={(e) => updateForm({ permiteUltrapassar: e.target.checked })}
                          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
                        />
                        <span>
                          <span className="block text-sm font-semibold text-gray-900">
                            Permitir ultrapassar a quantidade contratada
                          </span>
                          <span className="mt-0.5 block text-xs text-gray-500">
                            Consultas acima do limite serão faturadas pelos valores de excedente de
                            cada especialidade.
                          </span>
                        </span>
                      </label>
                      {form.permiteUltrapassar ? (
                        <>
                          <p className="text-sm text-gray-600">
                            Informe o excedente padrão por profissão. Especialidades podem ter valor
                            próprio ou herdar o padrão da profissão.
                          </p>
                          <div className="rounded-lg border border-gray-200 bg-white p-3">
                            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                              Excedente padrão por profissão
                            </p>
                            <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                              {professions
                                .filter((item) => form.professionIds.has(item.id))
                                .map((profession) => (
                                  <li key={profession.id}>
                                    <label className="block rounded-lg border border-gray-200 px-3 py-2">
                                      <span className="block text-sm font-medium text-gray-800">
                                        {profession.name}
                                      </span>
                                      <span className={labelClass}>Valor padrão</span>
                                      <input
                                        className={`${inputClass} mt-1`}
                                        value={form.excedentePrecosProfissao[profession.id] ?? ''}
                                        onChange={(e) =>
                                          updateExcedentePrecoProfissao(
                                            profession.id,
                                            maskCurrencyBrl(e.target.value),
                                          )
                                        }
                                        placeholder="R$ 0,00"
                                        inputMode="numeric"
                                      />
                                    </label>
                                  </li>
                                ))}
                            </ul>
                          </div>

                          <div className="flex flex-wrap items-end justify-between gap-3">
                            <p className="text-xs font-medium text-gray-500">
                              {excedenteLoteIds.size} de {selectedSpecialties.length} especialidade(s)
                              no lote
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={selectAllExcedenteLote}
                                disabled={selectedSpecialties.length === 0}
                                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition enabled:hover:bg-gray-50 disabled:opacity-50"
                              >
                                Incluir todas no lote
                              </button>
                              <button
                                type="button"
                                onClick={clearAllExcedenteLote}
                                disabled={excedenteLoteIds.size === 0}
                                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition enabled:hover:bg-gray-50 disabled:opacity-50"
                              >
                                Remover todas do lote
                              </button>
                            </div>
                          </div>

                          <div className="rounded-lg border border-gray-200 bg-slate-50/70 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Edição em massa de excedente
                            </p>
                            <div className="mt-2 flex flex-wrap items-end gap-2">
                              <label className="min-w-[180px] flex-1">
                                <span className={labelClass}>Valor em lote</span>
                                <input
                                  className={inputClass}
                                  value={batchExcedenteValue}
                                  onChange={(e) => {
                                    setBatchExcedenteValue(maskCurrencyBrl(e.target.value))
                                    setBatchExcedenteFeedback(null)
                                  }}
                                  placeholder="R$ 0,00"
                                  inputMode="numeric"
                                />
                              </label>
                              <div className="flex shrink-0 flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={applyBatchExcedenteToAll}
                                  className={[
                                    batchLoteActionButtonClass,
                                    'border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50',
                                  ].join(' ')}
                                >
                                  Aplicar em todas
                                </button>
                                <button
                                  type="button"
                                  onClick={applyBatchExcedenteToSelected}
                                  className={[batchLoteActionButtonClass, 'btn-brand-gradient'].join(' ')}
                                >
                                  Aplicar nas selecionadas
                                </button>
                              </div>
                            </div>
                            <p className="mt-2 text-xs text-gray-500">
                              {excedenteLoteIds.size === 0
                                ? 'Nenhuma incluída no lote. Use “Incluir no lote” na lista ou Aplicar em todas.'
                                : `${excedenteLoteIds.size} especialidade(s) no lote. O valor preenche só excedentes ainda em R$ 0,00.`}
                            </p>
                            {batchExcedenteFeedback ? (
                              <p
                                className={[
                                  'mt-2 rounded-lg px-3 py-2 text-xs font-medium',
                                  batchExcedenteFeedback.includes('aplicado') ||
                                  batchExcedenteFeedback.includes('mantid')
                                    ? 'bg-emerald-50 text-emerald-800'
                                    : 'bg-amber-50 text-amber-800',
                                ].join(' ')}
                                role="status"
                              >
                                {batchExcedenteFeedback}
                              </p>
                            ) : null}
                          </div>

                          <div className="space-y-4">
                            {groupedExcedenteSpecialties.map(({ profession, specialties: groupSpecialties }) => {
                              const groupSelectedSpecialties = groupSpecialties.filter((specialty) =>
                                form.specialtyIds.has(specialty.id),
                              )
                              const groupSpecialtyIds = groupSelectedSpecialties.map((item) => item.id)
                              const allGroupInLote =
                                groupSpecialtyIds.length > 0 &&
                                groupSpecialtyIds.every((id) => excedenteLoteIds.has(id))
                              const someGroupInLote = groupSpecialtyIds.some((id) =>
                                excedenteLoteIds.has(id),
                              )

                              return (
                                <div
                                  key={profession.id}
                                  className="rounded-lg border border-gray-100 bg-slate-50/40 p-3"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                                      {profession.name}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        type="button"
                                        disabled={allGroupInLote || groupSpecialtyIds.length === 0}
                                        onClick={() =>
                                          toggleExcedenteLoteForProfession(groupSpecialtyIds, true)
                                        }
                                        className="text-xs font-semibold text-[var(--brand-primary)] transition enabled:hover:underline disabled:cursor-not-allowed disabled:text-gray-400"
                                      >
                                        Marcar todas
                                      </button>
                                      <span className="text-xs text-gray-300" aria-hidden>
                                        |
                                      </span>
                                      <button
                                        type="button"
                                        disabled={!someGroupInLote}
                                        onClick={() =>
                                          toggleExcedenteLoteForProfession(groupSpecialtyIds, false)
                                        }
                                        className="text-xs font-semibold text-gray-600 transition enabled:hover:underline disabled:cursor-not-allowed disabled:text-gray-400"
                                      >
                                        Desmarcar todas
                                      </button>
                                    </div>
                                  </div>
                                  <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                                    {groupSelectedSpecialties.map((specialty) => {
                                      const excedente =
                                        form.excedentePrecosEspecialidade[specialty.id] ?? ''
                                      const inLote = excedenteLoteIds.has(specialty.id)
                                      const professionDefault =
                                        form.excedentePrecosProfissao[profession.id] ?? ''

                                      return (
                                        <li
                                          key={specialty.id}
                                          className={[
                                            'rounded-lg border px-3 py-2 transition',
                                            inLote
                                              ? 'border-[var(--brand-primary)]/25 bg-orange-50/40'
                                              : 'border-gray-200 bg-white',
                                          ].join(' ')}
                                        >
                                          <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-medium text-gray-800">
                                              {specialty.name}
                                            </p>
                                            <label className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                              <input
                                                type="checkbox"
                                                checked={inLote}
                                                onChange={() => toggleExcedenteLote(specialty.id)}
                                              />
                                              Incluir no lote
                                            </label>
                                          </div>
                                          <label className="mt-2 block">
                                            <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                                              Valor excedente
                                            </span>
                                            <input
                                              className={`${inputClass} mt-1`}
                                              value={excedente}
                                              onChange={(e) =>
                                                updateExcedentePrecoEspecialidade(
                                                  specialty.id,
                                                  maskCurrencyBrl(e.target.value),
                                                )
                                              }
                                              placeholder={
                                                professionDefault
                                                  ? `Padrão: ${professionDefault}`
                                                  : 'R$ 0,00'
                                              }
                                              inputMode="numeric"
                                            />
                                          </label>
                                        </li>
                                      )
                                    })}
                                  </ul>
                                </div>
                              )
                            })}
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500">
                          Com a ultrapassagem desativada, novas consultas além do limite serão
                          bloqueadas até renovação ou aditivo contratual.
                        </p>
                      )}
                    </>
                  )}
                </div>
              </section>
            ) : null}

            {step === 'revisao' ? (
              <section className={`${drawerPanelShell} min-h-0 flex-1 overflow-y-auto p-5 sm:p-6`}>
                <div className="space-y-5">
                  <div className={sectionCardClass}>
                    <p className={sectionTitleClass}>Revisão do cadastro</p>
                    <p className={sectionHintClass}>
                      Confira os dados antes de concluir. O cadastro será adicionado à lista de
                      entidades.
                    </p>
                  </div>
                  <section className="space-y-2">
                    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                      <Building2 className="h-3.5 w-3.5" />
                      Entidade
                    </h3>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="rounded-lg border border-gray-100 bg-slate-50/80 px-3 py-2 sm:col-span-2 lg:col-span-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                          Logo
                        </p>
                        {form.logoDataUrl ? (
                          <img
                            src={form.logoDataUrl}
                            alt=""
                            className="mt-2 h-14 w-14 rounded-xl border border-gray-200 object-cover"
                          />
                        ) : (
                          <p className="mt-1 text-sm font-medium text-gray-500">Não enviado</p>
                        )}
                      </div>
                      <ReviewRow label="Nome" value={form.nome} />
                      <ReviewRow label="Subtítulo" value={form.subtitulo} />
                      <ReviewRow label="Razão social" value={form.razaoSocial} />
                      <ReviewRow label="CNPJ" value={form.cnpj} />
                      <ReviewRow label="Cidade / UF" value={`${form.municipio} / ${form.uf}`} />
                      <div className="rounded-lg border border-gray-100 bg-slate-50/80 px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                          Status
                        </p>
                        <div className="mt-1">
                          <AdminClienteStatusBadge status={form.status} />
                        </div>
                      </div>
                    </div>
                  </section>
                  <section className="space-y-2">
                    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                      <Users className="h-3.5 w-3.5" />
                    Contatos
                    </h3>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <ReviewRow
                      label="Gestor da entidade"
                      value={`${form.gestorNome} · ${form.gestorEmail} · ${form.gestorTelefone}`}
                      />
                      <ReviewRow
                        label="Saúde"
                      value={`${form.saudeNome} · ${form.saudeEmail} · ${form.saudeTelefone}`}
                    />
                    <ReviewRow
                      label="Gestor do contrato"
                      value={`${form.contratoNome} · ${form.contratoEmail} · ${form.contratoTelefone}`}
                    />
                    <ReviewRow
                      label="TI"
                      value={`${form.tiNome} · ${form.tiEmail} · ${form.tiTelefone}`}
                      />
                    </div>
                  </section>
                  <section className="space-y-2">
                    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                      <FileText className="h-3.5 w-3.5" />
                      Contrato
                    </h3>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      <ReviewRow
                        label="Tipo"
                        value={(selectedContratoTipo?.label ?? form.contratoTipo) || '—'}
                      />
                      <ReviewRow label="Numero" value={form.numeroContrato} />
                      <ReviewRow label="Inicio da vigencia" value={form.vigenciaInicio} />
                      <ReviewRow label="Fim da vigencia" value={form.vigenciaFim} />
                      <ReviewRow
                        label="Pacientes de outros municípios"
                        value={
                          form.aceitaPacientesOutrosMunicipios
                            ? 'Aceitos'
                            : 'Apenas do município contratante'
                        }
                      />
                      {pacoteOuMensal ? (
                        <>
                          <ReviewRow
                            label="Consultas contratadas"
                            value={form.consultasContratadas}
                          />
                          <ReviewRow
                            label="Ultrapassagem"
                            value={
                              form.permiteUltrapassar
                                ? 'Permitida com valores por especialidade'
                                : 'Não permitida'
                            }
                          />
                        </>
                      ) : (
                        <ReviewRow
                          label="Modelo"
                          value="Sob demanda — valores por especialidade"
                        />
                      )}
                    </div>
                  </section>
                  <section className="space-y-2">
                    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                      <Stethoscope className="h-3.5 w-3.5" />
                      Profissões ({form.professionIds.size})
                    </h3>
                    <ul className="flex flex-wrap gap-2">
                      {professions
                        .filter((item) => form.professionIds.has(item.id))
                        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
                        .map((profession) => (
                          <li
                            key={profession.id}
                            className="rounded-lg border border-gray-100 bg-slate-50/80 px-3 py-1.5 text-sm font-medium text-gray-800"
                          >
                            {profession.name}
                          </li>
                        ))}
                    </ul>
                  </section>
                  <section className="space-y-2">
                    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                      <Stethoscope className="h-3.5 w-3.5" />
                      Especialidades e valores ({selectedSpecialties.length})
                    </h3>
                    <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {selectedSpecialties.map((specialty) => (
                        <li
                          key={specialty.id}
                          className="rounded-lg border border-gray-100 bg-slate-50/80 px-3 py-2"
                        >
                          <p className="text-sm font-medium text-gray-900">{specialty.name}</p>
                          <p className="mt-0.5 text-xs text-gray-600">
                            Consulta: {form.precosEspecialidade[specialty.id] || '—'}
                            {pacoteOuMensal && form.permiteUltrapassar
                              ? ` · Excedente: ${
                                  form.excedentePrecosEspecialidade[specialty.id] || '—'
                                }`
                              : ''}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
              </section>
            ) : null}
          </div>
        </div>

        <footer className="shrink-0 space-y-3 border-t border-gray-200/80 bg-white/90 px-5 py-3.5 backdrop-blur sm:px-6">
          {stepError ? (
            <p
              ref={stepErrorRef}
              role="alert"
              tabIndex={-1}
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 outline-none"
            >
              {stepError}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={isFirstStep ? onClose : goBack}
            disabled={isSaving}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            {isFirstStep ? 'Cancelar' : 'Voltar'}
          </button>

          {isLastStep ? (
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={isSaving || !canAdvance}
              aria-disabled={isSaving || !canAdvance}
              className="btn-brand-gradient inline-flex h-11 items-center gap-2 rounded-xl px-8 text-sm font-semibold shadow-[0_8px_20px_rgba(255,107,0,0.22)] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} />
              ) : (
                <ClipboardCheck className="h-4 w-4" strokeWidth={2.25} />
              )}
              {isSaving ? 'Salvando…' : 'Concluir cadastro'}
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              disabled={isSaving || !canAdvance}
              aria-disabled={isSaving || !canAdvance}
              className="btn-brand-gradient inline-flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-semibold shadow-[0_8px_20px_rgba(255,107,0,0.22)] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
            >
              Continuar
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </button>
          )}
          </div>
        </footer>
      </aside>
    </div>,
    document.body,
  )
}
