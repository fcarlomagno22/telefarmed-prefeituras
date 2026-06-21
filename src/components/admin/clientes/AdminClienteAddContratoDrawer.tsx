import { ChevronLeft, ChevronRight, ClipboardCheck, FileText, Stethoscope, Users, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { AdminClienteRow, AdminClienteContratoTipo } from '../../../types/adminClientes'
import { isPrefeituraEntidadeTipo } from '../../../config/adminEntidadeTipo'
import type { ClienteSpecialtyOption } from '../../../hooks/useAdminClientesClinicoCatalog'
import {
  getClienteContratoTipoOption,
  useAdminClientesContratoCatalog,
} from '../../../hooks/useAdminClientesContratoCatalog'
import type { AddContratoFormState, AddContratoStep } from './adminClienteContratoForm'
import {
  AdminClienteContratoEspecialidadesPanel,
  getVisibleSpecialtiesForContratoForm,
} from './AdminClienteContratoEspecialidadesPanel'
import {
  toggleProfessionInContratoForm,
  setSpecialtiesSelectionForProfession,
  toggleSpecialtyInContratoForm,
  type ClienteProfessionOption,
} from './adminClienteContratoCatalogUtils'
import {
  groupSpecialtiesBySelectedProfessions,
  resolveEffectiveConsultaPreco,
  resolveEffectiveExcedentePreco,
  resolvePrimaryProfessionIdForSpecialty,
  specialtyUsesProfessionConsultaDefault,
} from './adminClienteContratoPricing'
import {
  hasPositiveCurrency,
  isPacoteOuMensalContrato,
  validateAddContratoStep,
} from './adminClienteContratoForm'
import { maskBirthDate, maskCurrencyBrl, maskIntegerPtBr, maskPhone } from '../../../utils/masks'
import { CustomSelect } from '../../ui/CustomSelect'
import { AdminClienteContratoPacientesTerritorioField } from './AdminClienteContratoPacientesTerritorioField'

const FALLBACK_CONTRATO_TIPO = {
  id: '',
  modalidade: 'pacote_fechado' as const,
}

type AdminClienteAddContratoDrawerProps = {
  open: boolean
  closing: boolean
  cliente: AdminClienteRow | null
  onClose: () => void
  onTransitionEnd: () => void
  professions: ClienteProfessionOption[]
  specialties: ClienteSpecialtyOption[]
  onSubmit: (form: AddContratoFormState) => void
}

type StepId = AddContratoStep

type FormState = AddContratoFormState

const drawerShellClass =
  'absolute inset-x-0 bottom-0 z-10 flex h-[92vh] max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[1.35rem] border-t border-gray-200/90 bg-white shadow-[0_-20px_60px_rgba(15,23,42,0.18)] transition-transform duration-300 ease-out motion-reduce:transition-none'

const labelClass = 'mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-600'
const inputClass =
  'h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)]/45 focus:shadow-[0_0_0_3px_rgba(255,107,0,0.14)]'

const flowSteps: { id: StepId; label: string; numero: string }[] = [
  { id: 'contrato', label: 'Contrato e contato operacional', numero: 'Passo 1' },
  { id: 'especialidades', label: 'Profissões, especialidades e valores', numero: 'Passo 2' },
  { id: 'excedente', label: 'Ultrapassagem', numero: 'Passo 3' },
  { id: 'confirmacao', label: 'Confirmação', numero: 'Passo 4' },
]

const phoneTypeOptions = [
  { value: 'celular', label: 'Celular' },
  { value: 'fixo', label: 'Fixo' },
]

function hasCurrencyInput(value: string) {
  const digits = value.replace(/\D/g, '')
  return digits.length > 0
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

function buildBatchPrecosFeedback(
  batchVal: string,
  applied: number,
  skipped: number,
  scope: 'all' | 'selected',
  kind: 'consulta' | 'excedente' = 'consulta',
): string {
  const label = kind === 'excedente' ? 'excedente' : 'valor'

  if (applied === 0 && skipped > 0) {
    return scope === 'all'
      ? `Todas as especialidades já tinham ${label} definido. Nenhum campo foi alterado.`
      : `Todas as incluídas no lote já tinham ${label}. Nenhum campo foi alterado.`
  }
  if (applied === 0) {
    return `Nenhuma especialidade elegível para receber o ${label} em lote.`
  }
  if (skipped === 0) {
    if (kind === 'excedente') {
      return scope === 'all'
        ? `Valor ${batchVal} aplicado em ${applied} excedente(s) vazio(s) do contrato.`
        : `Valor ${batchVal} aplicado em ${applied} especialidade(s) do lote sem excedente.`
    }
    return scope === 'all'
      ? `Valor ${batchVal} aplicado em ${applied} especialidade(s) vazia(s). Todas foram marcadas na lista.`
      : `Valor ${batchVal} aplicado em ${applied} especialidade(s) marcada(s) sem preço.`
  }
  if (kind === 'excedente') {
    return scope === 'all'
      ? `Valor ${batchVal} aplicado em ${applied} excedente(s) vazio(s). ${skipped} já tinham valor e foram mantidos.`
      : `Valor ${batchVal} aplicado em ${applied} do lote sem excedente. ${skipped} com valor anterior mantido(s).`
  }
  return scope === 'all'
    ? `Valor ${batchVal} aplicado em ${applied} vazia(s). ${skipped} já tinham valor e foram mantidas.`
    : `Valor ${batchVal} aplicado em ${applied} marcada(s) sem preço. ${skipped} com valor anterior mantida(s).`
}

const batchLoteActionButtonClass =
  'inline-flex h-10 shrink-0 items-center justify-center rounded-xl px-3 text-xs font-semibold whitespace-nowrap'

function createInitialForm(
  cliente: AdminClienteRow | null,
  defaultTipo: { id: string; modalidade: AdminClienteContratoTipo },
): FormState {
  const existing = cliente?.contatoContrato
  return {
    numeroContrato: '',
    tipo: defaultTipo.id,
    tipoModalidade: defaultTipo.modalidade,
    vigenciaInicio: '',
    vigenciaFim: '',
    consultasContratadas: '',
    usaGestorExistente: existing ? 'existente' : 'novo',
    gestorExistenteKey: existing ? 'contato-contrato' : '',
    contatoNome: existing?.name ?? '',
    contatoEmail: existing?.email ?? '',
    contatoPhoneType: existing?.phoneType ?? 'celular',
    contatoPhone: existing?.phone ?? '',
    professionIds: new Set<string>(),
    specialtyIds: new Set<string>(),
    precosProfissao: {},
    precosEspecialidade: {},
    permiteUltrapassar: false,
    aceitaPacientesOutrosMunicipios: false,
    excedentePrecosProfissao: {},
    excedentePrecosEspecialidade: {},
    origemAtendimentoProfissao: {},
    origemAtendimentoEspecialidade: {},
  }
}

export function AdminClienteAddContratoDrawer({
  open,
  closing,
  cliente,
  professions,
  specialties,
  onClose,
  onTransitionEnd,
  onSubmit,
}: AdminClienteAddContratoDrawerProps) {
  const { contractTypes, isLoading: isLoadingContratoCatalog, error: contratoCatalogError } =
    useAdminClientesContratoCatalog()
  const defaultContratoTipo = contractTypes[0] ?? FALLBACK_CONTRATO_TIPO
  const contratoTipoOptions = useMemo(
    () => contractTypes.map((item) => ({ value: item.id, label: item.label })),
    [contractTypes],
  )
  const sortedSpecialties = useMemo(
    () => [...specialties].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [specialties],
  )
  const [entered, setEntered] = useState(false)
  const [step, setStep] = useState<StepId>('contrato')
  const [form, setForm] = useState<FormState>(() =>
    createInitialForm(cliente, defaultContratoTipo),
  )
  const visibleSpecialties = useMemo(
    () => getVisibleSpecialtiesForContratoForm(sortedSpecialties, form.professionIds),
    [sortedSpecialties, form.professionIds],
  )
  const [batchValue, setBatchValue] = useState('')
  const [batchExcedenteValue, setBatchExcedenteValue] = useState('')
  const [batchPrecosFeedback, setBatchPrecosFeedback] = useState<string | null>(null)
  const [batchExcedenteFeedback, setBatchExcedenteFeedback] = useState<string | null>(null)
  const [excedenteLoteIds, setExcedenteLoteIds] = useState<Set<string>>(new Set())
  const [stepError, setStepError] = useState<string | null>(null)
  const selectedSpecialtyCount = form.specialtyIds.size
  const hasExistingGestorContrato = Boolean(cliente?.contatoContrato)

  const isActive = open || closing
  const panelVisible = isActive && entered && !closing
  const stepIndex = flowSteps.findIndex((item) => item.id === step)
  const isFirstStep = stepIndex <= 0
  const isLastStep = step === 'confirmacao'
  const pacoteOuMensal = isPacoteOuMensalContrato(form.tipoModalidade)

  const existingGestorContratoOptions = useMemo(() => {
    if (!cliente?.contatoContrato) return []
    return [
      {
        value: 'contato-contrato',
        label: `${cliente.contatoContrato.name} (${cliente.contatoContrato.email})`,
      },
    ]
  }, [cliente])

  const selectedSpecialties = useMemo(
    () => sortedSpecialties.filter((item) => form.specialtyIds.has(item.id)),
    [form.specialtyIds, sortedSpecialties],
  )
  const groupedExcedenteSpecialties = useMemo(
    () => groupSpecialtiesBySelectedProfessions(sortedSpecialties, form.professionIds, professions),
    [sortedSpecialties, form.professionIds, professions],
  )

  useEffect(() => {
    if (!open) {
      setEntered(false)
      return
    }
    setStep('contrato')
    setForm(createInitialForm(cliente, defaultContratoTipo))
    setBatchValue('')
    setBatchExcedenteValue('')
    setBatchPrecosFeedback(null)
    setBatchExcedenteFeedback(null)
    setExcedenteLoteIds(new Set())
    setStepError(null)
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [open, cliente, defaultContratoTipo.id])

  useEffect(() => {
    if (!open || contractTypes.length === 0) return
    setForm((current) => {
      const selected = getClienteContratoTipoOption(contractTypes, current.tipo)
      if (selected) return current
      const first = contractTypes[0]
      if (!first) return current
      return { ...current, tipo: first.id, tipoModalidade: first.modalidade }
    })
  }, [open, contractTypes])

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

  if (!isActive || !cliente) return null

  function updateForm(patch: Partial<FormState>) {
    setStepError(null)
    setForm((current) => ({ ...current, ...patch }))
  }

  function getStepValidationError(targetStep: StepId = step) {
    return validateAddContratoStep(targetStep, form, {
      pacoteOuMensal,
      hasExistingGestorContrato,
    })
  }

  function toggleProfession(professionId: string) {
    setForm((current) => toggleProfessionInContratoForm(current, professionId, sortedSpecialties))
    setBatchPrecosFeedback(null)
    setBatchExcedenteFeedback(null)
    setStepError(null)
  }

  function toggleSpecialty(id: string) {
    setForm((current) => toggleSpecialtyInContratoForm(current, id))
    setBatchPrecosFeedback(null)
    setBatchExcedenteFeedback(null)
    setStepError(null)
  }

  function toggleAllSpecialtiesForProfession(
    _professionId: string,
    specialtyIds: string[],
    selectAll: boolean,
  ) {
    setForm((current) =>
      setSpecialtiesSelectionForProfession(current, specialtyIds, selectAll),
    )
    setBatchPrecosFeedback(null)
    setBatchExcedenteFeedback(null)
    setStepError(null)
  }

  function applyBatchPrecosToAll() {
    if (!hasCurrencyInput(batchValue)) {
      setBatchPrecosFeedback('Informe o valor em lote antes de aplicar.')
      return
    }
    if (visibleSpecialties.length === 0) {
      setBatchPrecosFeedback('Selecione profissões com especialidades disponíveis.')
      return
    }

    const allIds = visibleSpecialties.map((item) => item.id)
    const { next, applied, skipped } = applyBatchValueToPrecos(
      form.precosEspecialidade,
      allIds,
      batchValue,
    )
    setForm((current) => ({
      ...current,
      specialtyIds: new Set(allIds),
      precosEspecialidade: next,
    }))
    setBatchPrecosFeedback(buildBatchPrecosFeedback(batchValue, applied, skipped, 'all'))
  }

  function applyBatchPrecosToSelected() {
    if (!hasCurrencyInput(batchValue)) {
      setBatchPrecosFeedback('Informe o valor em lote antes de aplicar.')
      return
    }
    if (form.specialtyIds.size === 0) {
      setBatchPrecosFeedback('Marque ao menos uma especialidade na lista abaixo.')
      return
    }

    const targetIds = [...form.specialtyIds]
    const { next, applied, skipped } = applyBatchValueToPrecos(
      form.precosEspecialidade,
      targetIds,
      batchValue,
    )
    setForm((current) => ({ ...current, precosEspecialidade: next }))
    setBatchPrecosFeedback(buildBatchPrecosFeedback(batchValue, applied, skipped, 'selected'))
  }

  function toggleExcedenteLote(id: string) {
    setExcedenteLoteIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setBatchExcedenteFeedback(null)
    setStepError(null)
  }

  function applyBatchExcedenteToAll() {
    if (!hasCurrencyInput(batchExcedenteValue)) {
      setBatchExcedenteFeedback('Informe o valor em lote antes de aplicar.')
      return
    }
    if (selectedSpecialties.length === 0) {
      setBatchExcedenteFeedback('Volte ao passo 2 e marque as especialidades do contrato.')
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
      buildBatchPrecosFeedback(batchExcedenteValue, applied, skipped, 'all', 'excedente'),
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
      buildBatchPrecosFeedback(batchExcedenteValue, applied, skipped, 'selected', 'excedente'),
    )
  }

  function goBack() {
    setStepError(null)
    if (isFirstStep) {
      onClose()
      return
    }
    const prev = flowSteps[stepIndex - 1]
    if (prev) setStep(prev.id)
  }

  function goNext() {
    setStepError(null)
    const error = getStepValidationError()
    if (error) {
      setStepError(error)
      return
    }
    const next = flowSteps[stepIndex + 1]
    if (next) setStep(next.id)
  }

  function handleSubmit() {
    if (!cliente) return
    setStepError(null)

    const stepsToValidate: StepId[] = ['contrato', 'especialidades', 'excedente']
    for (const targetStep of stepsToValidate) {
      const error = getStepValidationError(targetStep)
      if (error) {
        setStep(targetStep)
        setStepError(error)
        return
      }
    }

    onSubmit(form)
  }

  return createPortal(
    <div className={`fixed inset-0 z-[9998] ${panelVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      <button
        type="button"
        className={`absolute inset-0 bg-gray-900/45 backdrop-blur-[2px] transition-opacity duration-300 ${panelVisible ? 'opacity-100' : 'opacity-0'}`}
        aria-label="Fechar adicionar contrato"
        onClick={onClose}
        tabIndex={panelVisible ? 0 : -1}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-add-contrato-title"
        onTransitionEnd={(event) => {
          if (event.target !== event.currentTarget) return
          if (event.propertyName === 'transform') onTransitionEnd()
        }}
        className={`${drawerShellClass} ${panelVisible ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <header className="shrink-0 border-b border-gray-200/80 bg-gradient-to-br from-[var(--brand-primary-light)]/70 via-orange-50/50 to-white px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--brand-primary)]">
                Novo contrato
              </p>
              <h2 id="admin-add-contrato-title" className="text-xl font-bold tracking-tight text-gray-900">
                {cliente.prefeitura}
              </h2>
              <p className="mt-0.5 text-xs text-gray-600">Fluxo do contrato em 4 etapas. Ao confirmar, informe o PIN para gravar.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 hover:text-gray-800"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-5 py-4 sm:px-6">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {flowSteps.map((item, index) => {
              const active = step === item.id
              const done = index < stepIndex
              return (
                <div
                  key={item.id}
                  className={[
                    'rounded-xl border px-3 py-2 text-center',
                    active
                      ? 'border-[var(--brand-primary)]/40 bg-[var(--brand-primary-light)]/30'
                      : done
                        ? 'border-emerald-200 bg-emerald-50/70'
                        : 'border-gray-200 bg-white',
                  ].join(' ')}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{item.numero}</p>
                  <p className="text-xs font-semibold text-gray-800">{item.label}</p>
                </div>
              )
            })}
          </div>

          {stepError ? (
            <p
              role="alert"
              className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {stepError}
            </p>
          ) : null}

          <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
            {step === 'contrato' ? (
              <div className="space-y-4">
                {contratoCatalogError ? (
                  <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {contratoCatalogError}
                  </p>
                ) : null}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <label>
                    <span className={labelClass}>Numero do contrato</span>
                    <input className={inputClass} value={form.numeroContrato} onChange={(e) => updateForm({ numeroContrato: e.target.value })} />
                  </label>
                  <label>
                    <span className={labelClass}>Tipo de contrato</span>
                    <CustomSelect
                      value={form.tipo}
                      onChange={(value) => {
                        const selected = getClienteContratoTipoOption(contractTypes, value)
                        updateForm({
                          tipo: value,
                          tipoModalidade: selected?.modalidade ?? FALLBACK_CONTRATO_TIPO.modalidade,
                        })
                      }}
                      options={
                        contratoTipoOptions.length
                          ? contratoTipoOptions
                          : [{ value: '', label: isLoadingContratoCatalog ? 'Carregando...' : 'Nenhum tipo disponível' }]
                      }
                      size="compact"
                      className="w-full"
                    />
                  </label>
                  <label>
                    <span className={labelClass}>Inicio da vigencia</span>
                    <input className={inputClass} value={form.vigenciaInicio} onChange={(e) => updateForm({ vigenciaInicio: maskBirthDate(e.target.value) })} placeholder="dd/mm/aaaa" />
                  </label>
                  <label>
                    <span className={labelClass}>Fim da vigencia</span>
                    <input className={inputClass} value={form.vigenciaFim} onChange={(e) => updateForm({ vigenciaFim: maskBirthDate(e.target.value) })} placeholder="dd/mm/aaaa" />
                  </label>
                  {pacoteOuMensal ? (
                    <label>
                      <span className={labelClass}>Consultas contratadas</span>
                      <input
                        className={inputClass}
                        value={form.consultasContratadas}
                        onChange={(e) =>
                          updateForm({ consultasContratadas: maskIntegerPtBr(e.target.value) })
                        }
                        placeholder="Ex.: 5.000"
                        inputMode="numeric"
                      />
                    </label>
                  ) : null}
                </div>

                <AdminClienteContratoPacientesTerritorioField
                  checked={form.aceitaPacientesOutrosMunicipios}
                  onChange={(checked) =>
                    updateForm({ aceitaPacientesOutrosMunicipios: checked })
                  }
                  entidadeTipo={cliente.tipoEntidade}
                />

                <section className="rounded-xl border border-gray-200 bg-slate-50/60 p-3">
                  <h3 className="text-sm font-semibold text-gray-900">Contato operacional do gestor do contrato</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label>
                      <span className={labelClass}>Origem do contato</span>
                      <CustomSelect
                        value={form.usaGestorExistente}
                        onChange={(value) => updateForm({ usaGestorExistente: value as 'existente' | 'novo' })}
                        options={[
                          { value: 'existente', label: 'Escolher gestor existente' },
                          { value: 'novo', label: 'Adicionar novo gestor' },
                        ]}
                        size="compact"
                        className="w-full"
                      />
                    </label>
                    {form.usaGestorExistente === 'existente' ? (
                      <label>
                        <span className={labelClass}>Gestor existente</span>
                        <CustomSelect
                          value={form.gestorExistenteKey}
                          onChange={(value) => updateForm({ gestorExistenteKey: value })}
                          options={existingGestorContratoOptions.length ? existingGestorContratoOptions : [{ value: '', label: 'Nenhum gestor existente' }]}
                          size="compact"
                          className="w-full"
                        />
                      </label>
                    ) : null}
                  </div>

                  {form.usaGestorExistente === 'novo' ? (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-12">
                      <label className="lg:col-span-4">
                        <span className={labelClass}>Nome</span>
                        <input className={inputClass} value={form.contatoNome} onChange={(e) => updateForm({ contatoNome: e.target.value })} />
                      </label>
                      <label className="lg:col-span-4">
                        <span className={labelClass}>E-mail</span>
                        <input className={inputClass} value={form.contatoEmail} onChange={(e) => updateForm({ contatoEmail: e.target.value })} />
                      </label>
                      <label className="lg:col-span-2">
                        <span className={labelClass}>Tipo telefone</span>
                        <CustomSelect value={form.contatoPhoneType} onChange={(value) => updateForm({ contatoPhoneType: value as 'fixo' | 'celular' })} options={phoneTypeOptions} size="compact" className="w-full" />
                      </label>
                      <label className="lg:col-span-2">
                        <span className={labelClass}>Telefone</span>
                        <input className={inputClass} value={form.contatoPhone} onChange={(e) => updateForm({ contatoPhone: maskPhone(e.target.value) })} />
                      </label>
                    </div>
                  ) : null}
                </section>
              </div>
            ) : null}

            {step === 'especialidades' ? (
              <AdminClienteContratoEspecialidadesPanel
                professions={professions}
                specialties={sortedSpecialties}
                professionIds={form.professionIds}
                specialtyIds={form.specialtyIds}
                precosProfissao={form.precosProfissao}
                precosEspecialidade={form.precosEspecialidade}
                origemAtendimentoProfissao={form.origemAtendimentoProfissao}
                origemAtendimentoEspecialidade={form.origemAtendimentoEspecialidade}
                onToggleProfession={toggleProfession}
                onToggleSpecialty={toggleSpecialty}
                onToggleAllSpecialtiesForProfession={toggleAllSpecialtiesForProfession}
                onPrecoProfissaoChange={(professionId, value) =>
                  setForm((current) => ({
                    ...current,
                    precosProfissao: {
                      ...current.precosProfissao,
                      [professionId]: maskCurrencyBrl(value),
                    },
                  }))
                }
                onPrecoChange={(specialtyId, value) =>
                  setForm((current) => ({
                    ...current,
                    precosEspecialidade: {
                      ...current.precosEspecialidade,
                      [specialtyId]: maskCurrencyBrl(value),
                    },
                  }))
                }
                onOrigemProfissaoChange={(professionId, origem) =>
                  setForm((current) => ({
                    ...current,
                    origemAtendimentoProfissao: {
                      ...current.origemAtendimentoProfissao,
                      [professionId]: origem,
                    },
                  }))
                }
                onOrigemEspecialidadeChange={(specialtyId, origem) =>
                  setForm((current) => ({
                    ...current,
                    origemAtendimentoEspecialidade: {
                      ...current.origemAtendimentoEspecialidade,
                      [specialtyId]: origem,
                    },
                  }))
                }
                inputClass={inputClass}
                labelClass={labelClass}
                batchControls={
                  <div className="rounded-lg border border-gray-200 bg-slate-50/70 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Edição em massa de valores
                    </p>
                    <div className="mt-2 flex flex-wrap items-end gap-2">
                      <label className="min-w-[180px] flex-1">
                        <span className={labelClass}>Valor em lote</span>
                        <input
                          className={inputClass}
                          value={batchValue}
                          onChange={(e) => {
                            setBatchValue(maskCurrencyBrl(e.target.value))
                            setBatchPrecosFeedback(null)
                          }}
                          placeholder="R$ 0,00"
                        />
                      </label>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={applyBatchPrecosToAll}
                          title="Marca todas as especialidades visíveis e aplica o lote só onde ainda não há valor"
                          className={[
                            batchLoteActionButtonClass,
                            'border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50',
                          ].join(' ')}
                        >
                          Aplicar em todas
                        </button>
                        <button
                          type="button"
                          onClick={applyBatchPrecosToSelected}
                          title="Aplica o lote apenas nas marcadas que ainda estão sem valor"
                          className={[batchLoteActionButtonClass, 'btn-brand-gradient'].join(' ')}
                        >
                          Aplicar nas selecionadas
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      {selectedSpecialtyCount === 0
                        ? 'Nenhuma especialidade marcada. Marque na lista abaixo antes de aplicar nas selecionadas.'
                        : `${selectedSpecialtyCount} especialidade(s) marcada(s). O lote preenche só as que ainda estão em R$ 0,00.`}
                    </p>
                    {batchPrecosFeedback ? (
                      <p
                        className={[
                          'mt-2 rounded-lg px-3 py-2 text-xs font-medium',
                          batchPrecosFeedback.includes('aplicado') ||
                          batchPrecosFeedback.includes('mantido')
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'bg-amber-50 text-amber-800',
                        ].join(' ')}
                        role="status"
                      >
                        {batchPrecosFeedback}
                      </p>
                    ) : null}
                  </div>
                }
              />
            ) : null}

            {step === 'excedente' ? (
              <div className="space-y-3">
                {!pacoteOuMensal ? (
                  <p className="rounded-lg border border-gray-200 bg-slate-50 px-3 py-3 text-sm text-gray-600">
                    Ultrapassagem se aplica apenas para contratos mensais ou pacote.
                  </p>
                ) : (
                  <>
                    <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
                      <input type="checkbox" checked={form.permiteUltrapassar} onChange={(e) => updateForm({ permiteUltrapassar: e.target.checked })} />
                      <span className="text-sm font-medium text-gray-800">Permitir ultrapassagem</span>
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
                          <ul className="mt-2 grid grid-cols-4 gap-2">
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
                                        setForm((current) => ({
                                          ...current,
                                          excedentePrecosProfissao: {
                                            ...current.excedentePrecosProfissao,
                                            [profession.id]: maskCurrencyBrl(e.target.value),
                                          },
                                        }))
                                      }
                                      placeholder="R$ 0,00"
                                    />
                                  </label>
                                </li>
                              ))}
                          </ul>
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
                              />
                            </label>
                            <div className="flex shrink-0 flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={applyBatchExcedenteToAll}
                                title="Aplica o lote em todas as especialidades do contrato, só onde o excedente ainda está vazio"
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
                                title="Aplica o lote só nas que têm “Incluir no lote” marcado e ainda estão sem valor"
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
                                batchExcedenteFeedback.includes('mantida')
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
                          {groupedExcedenteSpecialties.map(({ profession, specialties: groupSpecialties }) => (
                            <div key={profession.id}>
                              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                                {profession.name}
                              </p>
                              <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                                {groupSpecialties
                                  .filter((specialty) => form.specialtyIds.has(specialty.id))
                                  .map((specialty) => {
                            const excedente = form.excedentePrecosEspecialidade[specialty.id] ?? ''
                            const inLote = excedenteLoteIds.has(specialty.id)
                            const professionId = resolvePrimaryProfessionIdForSpecialty(
                              specialty,
                              form.professionIds,
                            )
                            const professionDefault = professionId
                              ? form.excedentePrecosProfissao[professionId] ?? ''
                              : ''
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
                                  <p className="text-sm font-medium text-gray-800">{specialty.name}</p>
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
                                      setForm((current) => ({
                                        ...current,
                                        excedentePrecosEspecialidade: {
                                          ...current.excedentePrecosEspecialidade,
                                          [specialty.id]: maskCurrencyBrl(e.target.value),
                                        },
                                      }))
                                    }
                                    placeholder={
                                      professionDefault
                                        ? `Padrão: ${professionDefault}`
                                        : 'R$ 0,00'
                                    }
                                  />
                                </label>
                              </li>
                            )
                                  })}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : null}
                  </>
                )}
              </div>
            ) : null}

            {step === 'confirmacao' ? (
              <div className="space-y-4">
                <section>
                  <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                    <FileText className="h-3.5 w-3.5" /> Contrato
                  </h3>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    <ContactCard label="Numero" value={form.numeroContrato} />
                    <ContactCard
                      label="Tipo"
                      value={
                        getClienteContratoTipoOption(contractTypes, form.tipo)?.label ??
                        form.tipo
                      }
                    />
                    <ContactCard label="Inicio" value={form.vigenciaInicio} />
                    <ContactCard label="Fim" value={form.vigenciaFim} />
                    {pacoteOuMensal ? <ContactCard label="Consultas contratadas" value={form.consultasContratadas} /> : null}
                    {isPrefeituraEntidadeTipo(cliente.tipoEntidade) ? (
                      <ContactCard
                        label="Pacientes de outros municípios"
                        value={
                          form.aceitaPacientesOutrosMunicipios
                            ? 'Aceitos'
                            : 'Apenas do município contratante'
                        }
                      />
                    ) : null}
                  </div>
                </section>
                <section>
                  <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                    <Users className="h-3.5 w-3.5" /> Gestor operacional
                  </h3>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <ContactCard label="Origem" value={form.usaGestorExistente === 'existente' ? 'Gestor existente' : 'Novo gestor'} />
                    {form.usaGestorExistente === 'novo' ? (
                      <>
                        <ContactCard label="Nome" value={form.contatoNome} />
                        <ContactCard label="E-mail" value={form.contatoEmail} />
                        <ContactCard label="Telefone" value={`${form.contatoPhoneType} · ${form.contatoPhone}`} />
                      </>
                    ) : (
                      <ContactCard label="Gestor" value={cliente.contatoContrato?.name ?? 'Contato atual da entidade'} />
                    )}
                  </div>
                </section>
                <section>
                  <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                    <Stethoscope className="h-3.5 w-3.5" /> Profissões ({form.professionIds.size})
                  </h3>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {professions
                      .filter((item) => form.professionIds.has(item.id))
                      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
                      .map((profession) => (
                        <li
                          key={profession.id}
                          className="rounded-lg border border-gray-100 bg-slate-50/80 px-3 py-1.5 text-sm text-gray-800"
                        >
                          <span className="font-medium">{profession.name}</span>
                          <span className="text-gray-600">
                            {' '}
                            · {form.precosProfissao[profession.id] || '—'}
                          </span>
                        </li>
                      ))}
                  </ul>
                </section>
                <section>
                  <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                    <Stethoscope className="h-3.5 w-3.5" /> Especialidades ({selectedSpecialties.length})
                  </h3>
                  <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                    {selectedSpecialties.map((specialty) => {
                      const consulta = resolveEffectiveConsultaPreco(form, specialty)
                      const excedente = form.permiteUltrapassar
                        ? resolveEffectiveExcedentePreco(form, specialty)
                        : null
                      const usesProfessionDefault = specialtyUsesProfessionConsultaDefault(
                        form,
                        specialty,
                      )
                      return (
                      <li key={specialty.id} className="rounded-lg border border-gray-100 bg-slate-50/80 px-3 py-2">
                        <p className="text-sm font-medium text-gray-900">{specialty.name}</p>
                        <p className="text-xs text-gray-600">
                          Consulta:{' '}
                          {usesProfessionDefault
                            ? `${form.precosProfissao[resolvePrimaryProfessionIdForSpecialty(specialty, form.professionIds) ?? ''] || '—'} (padrão da profissão)`
                            : form.precosEspecialidade[specialty.id] ||
                              new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(consulta)}
                          {form.permiteUltrapassar && excedente
                            ? ` · Excedente: ${new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(excedente)}`
                            : ''}
                        </p>
                      </li>
                      )
                    })}
                  </ul>
                </section>
              </div>
            ) : null}
          </div>
        </div>

        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-gray-200 bg-white px-5 py-3.5 sm:px-6">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <ChevronLeft className="h-4 w-4" />
            {isFirstStep ? 'Cancelar' : 'Voltar'}
          </button>
          {isLastStep ? (
            <button
              type="button"
              onClick={handleSubmit}
              className="btn-brand-gradient inline-flex h-10 items-center gap-2 rounded-xl px-6 text-sm font-semibold"
            >
              <ClipboardCheck className="h-4 w-4" />
              Confirmar e salvar
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              className="btn-brand-gradient inline-flex h-10 items-center gap-2 rounded-xl px-6 text-sm font-semibold"
            >
              Continuar
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </footer>
      </aside>
    </div>,
    document.body,
  )
}

function ContactCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-slate-50/80 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-gray-900">{value || 'Não informado'}</p>
    </div>
  )
}
