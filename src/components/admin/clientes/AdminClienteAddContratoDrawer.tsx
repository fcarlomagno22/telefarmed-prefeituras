import { ChevronLeft, ChevronRight, ClipboardCheck, FileText, Stethoscope, Users, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type {
  AdminClienteContact,
  AdminClienteContrato,
  AdminClienteContratoTipo,
  AdminClientePrecoEspecialidade,
  AdminClienteRow,
} from '../../../data/adminClientesMock'
import { adminClienteContratoTipoLabels } from '../../../data/adminClientesMock'
import { specialties } from '../../../data/specialties'
import { maskBirthDate, maskCurrencyBrl, maskPhone } from '../../../utils/masks'
import { CustomSelect } from '../../ui/CustomSelect'
import { adminEntidadeContratoTipoOptions } from './cadastro/adminEntidadeCadastroTypes'

type AdminClienteAddContratoDrawerProps = {
  open: boolean
  closing: boolean
  cliente: AdminClienteRow | null
  onClose: () => void
  onTransitionEnd: () => void
  onSubmit: (payload: { contrato: AdminClienteContrato; contatoContrato: AdminClienteContact }) => void
}

type StepId = 'contrato' | 'especialidades' | 'excedente' | 'confirmacao'

type FormState = {
  numeroContrato: string
  tipo: AdminClienteContratoTipo
  vigenciaInicio: string
  vigenciaFim: string
  consultasContratadas: string
  usaGestorExistente: 'existente' | 'novo'
  gestorExistenteKey: string
  contatoNome: string
  contatoEmail: string
  contatoPhoneType: 'fixo' | 'celular'
  contatoPhone: string
  specialtyIds: Set<string>
  batchTargetSpecialtyIds: Set<string>
  batchTargetExcedenteIds: Set<string>
  precosEspecialidade: Record<string, string>
  permiteUltrapassar: boolean
  excedentePrecosEspecialidade: Record<string, string>
}

const drawerShellClass =
  'absolute inset-x-0 bottom-0 z-10 flex h-[92vh] max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[1.35rem] border-t border-gray-200/90 bg-white shadow-[0_-20px_60px_rgba(15,23,42,0.18)] transition-transform duration-300 ease-out motion-reduce:transition-none'

const labelClass = 'mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-600'
const inputClass =
  'h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)]/45 focus:shadow-[0_0_0_3px_rgba(255,107,0,0.14)]'

const flowSteps: { id: StepId; label: string; numero: string }[] = [
  { id: 'contrato', label: 'Contrato e contato operacional', numero: 'Passo 1' },
  { id: 'especialidades', label: 'Especialidades e valores', numero: 'Passo 2' },
  { id: 'excedente', label: 'Ultrapassagem', numero: 'Passo 3' },
  { id: 'confirmacao', label: 'Confirmação', numero: 'Passo 4' },
]

const phoneTypeOptions = [
  { value: 'celular', label: 'Celular' },
  { value: 'fixo', label: 'Fixo' },
]

const sortedSpecialties = [...specialties].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))

function isPacoteOuMensal(tipo: AdminClienteContratoTipo) {
  return tipo === 'mensal' || tipo === 'pacote_fechado'
}

function parseCurrencyBrl(value: string) {
  const normalized = value.replace(/[^\d,]/g, '').replace(/\./g, '').replace(',', '.')
  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

function createInitialForm(cliente: AdminClienteRow | null): FormState {
  const existing = cliente?.contatoContrato
  return {
    numeroContrato: '',
    tipo: 'pacote_fechado',
    vigenciaInicio: '',
    vigenciaFim: '',
    consultasContratadas: '',
    usaGestorExistente: existing ? 'existente' : 'novo',
    gestorExistenteKey: existing ? 'contato-contrato' : '',
    contatoNome: existing?.name ?? '',
    contatoEmail: existing?.email ?? '',
    contatoPhoneType: existing?.phoneType ?? 'celular',
    contatoPhone: existing?.phone ?? '',
    specialtyIds: new Set<string>(),
    batchTargetSpecialtyIds: new Set<string>(),
    batchTargetExcedenteIds: new Set<string>(),
    precosEspecialidade: {},
    permiteUltrapassar: false,
    excedentePrecosEspecialidade: {},
  }
}

export function AdminClienteAddContratoDrawer({
  open,
  closing,
  cliente,
  onClose,
  onTransitionEnd,
  onSubmit,
}: AdminClienteAddContratoDrawerProps) {
  const [entered, setEntered] = useState(false)
  const [step, setStep] = useState<StepId>('contrato')
  const [form, setForm] = useState<FormState>(() => createInitialForm(cliente))
  const [batchValue, setBatchValue] = useState('')
  const [batchExcedenteValue, setBatchExcedenteValue] = useState('')

  const isActive = open || closing
  const panelVisible = isActive && entered && !closing
  const stepIndex = flowSteps.findIndex((item) => item.id === step)
  const isFirstStep = stepIndex <= 0
  const isLastStep = step === 'confirmacao'
  const pacoteOuMensal = isPacoteOuMensal(form.tipo)

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
    [form.specialtyIds],
  )

  useEffect(() => {
    if (!open) {
      setEntered(false)
      return
    }
    setStep('contrato')
    setForm(createInitialForm(cliente))
    setBatchValue('')
    setBatchExcedenteValue('')
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [open, cliente])

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
    setForm((current) => ({ ...current, ...patch }))
  }

  function toggleSpecialty(id: string) {
    setForm((current) => {
      const next = new Set(current.specialtyIds)
      const batchTargetSpecialtyIds = new Set(current.batchTargetSpecialtyIds)
      const batchTargetExcedenteIds = new Set(current.batchTargetExcedenteIds)
      const precosEspecialidade = { ...current.precosEspecialidade }
      const excedentePrecosEspecialidade = { ...current.excedentePrecosEspecialidade }
      if (next.has(id)) {
        next.delete(id)
        batchTargetSpecialtyIds.delete(id)
        batchTargetExcedenteIds.delete(id)
        delete precosEspecialidade[id]
        delete excedentePrecosEspecialidade[id]
      } else {
        next.add(id)
      }
      return {
        ...current,
        specialtyIds: next,
        batchTargetSpecialtyIds,
        batchTargetExcedenteIds,
        precosEspecialidade,
        excedentePrecosEspecialidade,
      }
    })
  }

  function toggleBatchTargetSpecialty(id: string) {
    setForm((current) => {
      const next = new Set(current.batchTargetSpecialtyIds)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return { ...current, batchTargetSpecialtyIds: next }
    })
  }

  function toggleBatchTargetExcedente(id: string) {
    setForm((current) => {
      const next = new Set(current.batchTargetExcedenteIds)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return { ...current, batchTargetExcedenteIds: next }
    })
  }

  function validateCurrentStep() {
    // Fluxo liberado para navegação completa sem bloqueios de preenchimento.
    return true
  }

  function goNext() {
    if (!validateCurrentStep()) return
    const next = flowSteps[stepIndex + 1]
    if (next) setStep(next.id)
  }

  function handleSubmit() {
    const idBase = `ctr-${cliente.id}-${Date.now()}`
    const precosPorEspecialidade: AdminClientePrecoEspecialidade[] = [...form.specialtyIds].map((id) => ({
      specialtyId: id,
      valorConsulta: parseCurrencyBrl(form.precosEspecialidade[id] ?? ''),
    }))
    const excedentePrecosPorEspecialidade: AdminClientePrecoEspecialidade[] | null =
      pacoteOuMensal && form.permiteUltrapassar
        ? [...form.specialtyIds].map((id) => ({
            specialtyId: id,
            valorConsulta: parseCurrencyBrl(form.excedentePrecosEspecialidade[id] ?? ''),
          }))
        : null

    const existingContato = cliente.contatoContrato
    const contatoContrato: AdminClienteContact =
      form.usaGestorExistente === 'existente' && existingContato
        ? existingContato
        : {
            name: form.contatoNome.trim(),
            email: form.contatoEmail.trim(),
            phone: form.contatoPhone.trim(),
            phoneType: form.contatoPhoneType,
          }

    const contrato: AdminClienteContrato = {
      id: idBase,
      numero: form.numeroContrato.trim(),
      dataAssinatura: form.vigenciaInicio.trim(),
      dataEncerramento: form.vigenciaFim.trim(),
      tipo: form.tipo,
      status: 'ativo',
      percentualUtilizado: form.tipo === 'sob_demanda' ? null : 0,
      consultasRealizadas: form.tipo === 'sob_demanda' ? 0 : null,
      detalhes: {
        consultasContratadas: pacoteOuMensal ? Number.parseInt(form.consultasContratadas || '0', 10) : null,
        valorConsultaPacote: null,
        permiteUltrapassar: pacoteOuMensal && form.permiteUltrapassar,
        precosPorEspecialidade,
        excedentePrecosPorEspecialidade,
        especialidadesAutorizadas: [...form.specialtyIds],
      },
    }

    onSubmit({ contrato, contatoContrato })
    onClose()
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
              <p className="mt-0.5 text-xs text-gray-600">Fluxo do contrato em 4 etapas</p>
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

          <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
            {step === 'contrato' ? (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <label>
                    <span className={labelClass}>Numero do contrato</span>
                    <input className={inputClass} value={form.numeroContrato} onChange={(e) => updateForm({ numeroContrato: e.target.value })} />
                  </label>
                  <label>
                    <span className={labelClass}>Tipo de contrato</span>
                    <CustomSelect value={form.tipo} onChange={(value) => updateForm({ tipo: value as AdminClienteContratoTipo })} options={adminEntidadeContratoTipoOptions} size="compact" className="w-full" />
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
                      <input className={inputClass} value={form.consultasContratadas} onChange={(e) => updateForm({ consultasContratadas: e.target.value.replace(/\D/g, '') })} />
                    </label>
                  ) : null}
                </div>

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
              <div className="space-y-3">
                <p className="text-sm text-gray-600">Selecione especialidades e valores por consulta.</p>
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
                        onChange={(e) => setBatchValue(maskCurrencyBrl(e.target.value))}
                        placeholder="R$ 0,00"
                      />
                    </label>
                    <button
                      type="button"
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          batchTargetSpecialtyIds: new Set(current.specialtyIds),
                        }))
                      }
                    >
                      Marcar todas
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                      onClick={() => setForm((current) => ({ ...current, batchTargetSpecialtyIds: new Set() }))}
                    >
                      Limpar marcações
                    </button>
                    <button
                      type="button"
                      disabled={!batchValue || form.batchTargetSpecialtyIds.size === 0}
                      className="btn-brand-gradient rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50"
                      onClick={() =>
                        setForm((current) => {
                          const nextPrecos = { ...current.precosEspecialidade }
                          for (const id of current.batchTargetSpecialtyIds) {
                            if (current.specialtyIds.has(id)) nextPrecos[id] = batchValue
                          }
                          return { ...current, precosEspecialidade: nextPrecos }
                        })
                      }
                    >
                      Aplicar nas marcadas
                    </button>
                    <button
                      type="button"
                      disabled={!batchValue || form.specialtyIds.size === 0}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition disabled:opacity-50 enabled:hover:bg-gray-50"
                      onClick={() =>
                        setForm((current) => {
                          const nextPrecos = { ...current.precosEspecialidade }
                          for (const id of current.specialtyIds) nextPrecos[id] = batchValue
                          return { ...current, precosEspecialidade: nextPrecos }
                        })
                      }
                    >
                      Aplicar em todas selecionadas
                    </button>
                  </div>
                </div>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {sortedSpecialties.map((specialty) => {
                    const checked = form.specialtyIds.has(specialty.id)
                    const markedForBatch = form.batchTargetSpecialtyIds.has(specialty.id)
                    return (
                      <li key={specialty.id} className="rounded-lg border border-gray-200 px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <label className="flex items-center gap-2">
                            <input type="checkbox" checked={checked} onChange={() => toggleSpecialty(specialty.id)} />
                            <span className="text-sm font-medium text-gray-800">{specialty.name}</span>
                          </label>
                          {checked ? (
                            <label className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                              <input
                                type="checkbox"
                                checked={markedForBatch}
                                onChange={() => toggleBatchTargetSpecialty(specialty.id)}
                              />
                              Lote
                            </label>
                          ) : null}
                        </div>
                        {checked ? (
                          <input
                            className={`${inputClass} mt-2`}
                            value={form.precosEspecialidade[specialty.id] ?? ''}
                            onChange={(e) =>
                              setForm((current) => ({
                                ...current,
                                precosEspecialidade: { ...current.precosEspecialidade, [specialty.id]: maskCurrencyBrl(e.target.value) },
                              }))
                            }
                            placeholder="R$ 0,00"
                          />
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              </div>
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
                                onChange={(e) => setBatchExcedenteValue(maskCurrencyBrl(e.target.value))}
                                placeholder="R$ 0,00"
                              />
                            </label>
                            <button
                              type="button"
                              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                              onClick={() =>
                                setForm((current) => ({
                                  ...current,
                                  batchTargetExcedenteIds: new Set(current.specialtyIds),
                                }))
                              }
                            >
                              Marcar todas
                            </button>
                            <button
                              type="button"
                              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                              onClick={() =>
                                setForm((current) => ({ ...current, batchTargetExcedenteIds: new Set() }))
                              }
                            >
                              Limpar marcações
                            </button>
                            <button
                              type="button"
                              disabled={!batchExcedenteValue || form.batchTargetExcedenteIds.size === 0}
                              className="btn-brand-gradient rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50"
                              onClick={() =>
                                setForm((current) => {
                                  const next = { ...current.excedentePrecosEspecialidade }
                                  for (const id of current.batchTargetExcedenteIds) {
                                    if (current.specialtyIds.has(id)) next[id] = batchExcedenteValue
                                  }
                                  return { ...current, excedentePrecosEspecialidade: next }
                                })
                              }
                            >
                              Aplicar nas marcadas
                            </button>
                            <button
                              type="button"
                              disabled={!batchExcedenteValue || form.specialtyIds.size === 0}
                              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition disabled:opacity-50 enabled:hover:bg-gray-50"
                              onClick={() =>
                                setForm((current) => {
                                  const next = { ...current.excedentePrecosEspecialidade }
                                  for (const id of current.specialtyIds) next[id] = batchExcedenteValue
                                  return { ...current, excedentePrecosEspecialidade: next }
                                })
                              }
                            >
                              Aplicar em todas selecionadas
                            </button>
                          </div>
                        </div>
                        <ul className="grid gap-2 sm:grid-cols-2">
                        {selectedSpecialties.map((specialty) => (
                          <li key={specialty.id} className="rounded-lg border border-gray-200 px-3 py-2">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium text-gray-800">{specialty.name}</p>
                              <label className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                <input
                                  type="checkbox"
                                  checked={form.batchTargetExcedenteIds.has(specialty.id)}
                                  onChange={() => toggleBatchTargetExcedente(specialty.id)}
                                />
                                Lote
                              </label>
                            </div>
                            <input
                              className={`${inputClass} mt-2`}
                              value={form.excedentePrecosEspecialidade[specialty.id] ?? ''}
                              onChange={(e) =>
                                setForm((current) => ({
                                  ...current,
                                  excedentePrecosEspecialidade: {
                                    ...current.excedentePrecosEspecialidade,
                                    [specialty.id]: maskCurrencyBrl(e.target.value),
                                  },
                                }))
                              }
                              placeholder="R$ 0,00"
                            />
                          </li>
                        ))}
                        </ul>
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
                    <ContactCard label="Tipo" value={adminClienteContratoTipoLabels[form.tipo]} />
                    <ContactCard label="Inicio" value={form.vigenciaInicio} />
                    <ContactCard label="Fim" value={form.vigenciaFim} />
                    {pacoteOuMensal ? <ContactCard label="Consultas contratadas" value={form.consultasContratadas} /> : null}
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
                    <Stethoscope className="h-3.5 w-3.5" /> Especialidades ({selectedSpecialties.length})
                  </h3>
                  <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                    {selectedSpecialties.map((specialty) => (
                      <li key={specialty.id} className="rounded-lg border border-gray-100 bg-slate-50/80 px-3 py-2">
                        <p className="text-sm font-medium text-gray-900">{specialty.name}</p>
                        <p className="text-xs text-gray-600">
                          Consulta: {form.precosEspecialidade[specialty.id] || 'Não informado'}
                          {form.permiteUltrapassar ? ` · Excedente: ${form.excedentePrecosEspecialidade[specialty.id] || 'Não informado'}` : ''}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            ) : null}
          </div>
        </div>

        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-gray-200 bg-white px-5 py-3.5 sm:px-6">
          <button
            type="button"
            onClick={isFirstStep ? onClose : () => setStep(flowSteps[stepIndex - 1].id)}
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
              Confirmar contrato
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
