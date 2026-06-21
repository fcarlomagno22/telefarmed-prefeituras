import { Loader2, Wrench, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type {
  PrefeituraFaturamentoCorrecaoDefinition,
  PrefeituraFaturamentoCorrecaoPayload,
} from '../../../../types/prefeituraFaturamentoCorrecao'
import type { PrefeituraFaturamentoPendencia } from '../../../../types/prefeituraFaturamentoPendencias'
import type { PrefeituraFaturamentoRegraSusCheckId } from '../../../../types/prefeituraFaturamentoRegraSus'
import { CustomSelect } from '../../../ui/CustomSelect'
import {
  formatPendenciaConsultaDate,
  resolvePendenciaSituacaoBadge,
} from './prefeituraFaturamentoPendenciasUi'
import { usePrefeituraAuth } from '../../../../contexts/PrefeituraAuthContext'
import {
  apiFetchSigtapOcupacoes,
  apiFetchSigtapProcedimentos,
} from '../../../../lib/services/prefeitura/faturamento'
import {
  getCompatibleProcedureOptions,
  MOCK_CBO_OPTIONS,
  MOCK_PROCEDURE_OPTIONS,
  resolveCorrecaoDefinition,
} from './prefeituraFaturamentoCorrecaoConfig'
import { SituationStatusBadge } from '../../../ui/SituationStatusBadge'

type PrefeituraFaturamentoCorrecaoDrawerProps = {
  open: boolean
  closing: boolean
  item: PrefeituraFaturamentoPendencia | null
  checkId: PrefeituraFaturamentoRegraSusCheckId | null
  onClose: () => void
  onTransitionEnd: () => void
  onSave: (
    item: PrefeituraFaturamentoPendencia,
    checkId: PrefeituraFaturamentoRegraSusCheckId,
    payload: PrefeituraFaturamentoCorrecaoPayload,
  ) => Promise<void>
  onRequestClinical: (item: PrefeituraFaturamentoPendencia) => Promise<void>
}

function FieldBlock({
  label,
  value,
  invalid,
}: {
  label: string
  value: string
  invalid?: boolean
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/70 px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${invalid ? 'text-red-700' : 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  )
}

function CorrectionForm({
  item,
  definition,
  draft,
  onDraftChange,
}: {
  item: PrefeituraFaturamentoPendencia
  definition: PrefeituraFaturamentoCorrecaoDefinition
  draft: PrefeituraFaturamentoCorrecaoPayload
  onDraftChange: (patch: PrefeituraFaturamentoCorrecaoPayload) => void
}) {
  const { getAccessToken } = usePrefeituraAuth()
  const [cboOptions, setCboOptions] = useState(MOCK_CBO_OPTIONS)
  const [procedureOptions, setProcedureOptions] = useState(MOCK_PROCEDURE_OPTIONS)

  useEffect(() => {
    const token = getAccessToken()
    if (!token) return

    if (definition.mode === 'edit_cbo') {
      void apiFetchSigtapOcupacoes(token).then(({ options }) => {
        if (options.length > 0) setCboOptions(options)
      })
    }

    if (definition.mode === 'select_procedure') {
      void apiFetchSigtapProcedimentos(token, {
        cbo: item.kind === 'cbo_incompativel' ? item.professionalCbo ?? undefined : undefined,
      }).then(({ options }) => {
        if (options.length > 0) {
          setProcedureOptions(options)
          return
        }
        if (item.kind === 'cbo_incompativel') {
          setProcedureOptions(getCompatibleProcedureOptions(item.professionalCbo))
        }
      })
    }
  }, [definition.mode, getAccessToken, item.kind, item.professionalCbo])

  const resolvedProcedureOptions = useMemo(() => {
    if (item.kind === 'cbo_incompativel' && procedureOptions === MOCK_PROCEDURE_OPTIONS) {
      return getCompatibleProcedureOptions(item.professionalCbo)
    }
    return procedureOptions
  }, [item.kind, item.professionalCbo, procedureOptions])

  if (definition.mode === 'edit_cns') {
    return (
      <div>
        <FieldBlock
          label="Campo inválido"
          value={item.patientCns ?? 'Não informado'}
          invalid
        />
        <label className="mt-4 block text-sm font-semibold text-gray-900">
          {definition.fieldLabel}
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={draft.patientCns ?? ''}
          onChange={(event) =>
            onDraftChange({ patientCns: event.target.value.replace(/\D/g, '').slice(0, 15) })
          }
          placeholder="000000000000000"
          className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15"
        />
      </div>
    )
  }

  if (definition.mode === 'edit_municipio') {
    return (
      <div className="space-y-4">
        <FieldBlock
          label="Campo inválido"
          value={item.patientMunicipality ?? 'Município não informado'}
          invalid
        />
        <div>
          <label className="block text-sm font-semibold text-gray-900">
            {definition.fieldLabel}
          </label>
          <input
            type="text"
            value={draft.patientMunicipality ?? ''}
            onChange={(event) => onDraftChange({ patientMunicipality: event.target.value })}
            placeholder="Ex.: Campinas — SP"
            className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900">Código IBGE</label>
          <input
            type="text"
            inputMode="numeric"
            value={draft.patientMunicipalityIbge ?? ''}
            onChange={(event) =>
              onDraftChange({ patientMunicipalityIbge: event.target.value.replace(/\D/g, '').slice(0, 7) })
            }
            placeholder="0000000"
            className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15"
          />
        </div>
      </div>
    )
  }

  if (definition.mode === 'edit_cbo') {
    return (
      <div>
        <FieldBlock
          label="Profissional"
          value={`${item.professionalName} · ${item.specialty}`}
        />
        <div className="mt-4">
          <label className="block text-sm font-semibold text-gray-900">
            {definition.fieldLabel}
          </label>
          <CustomSelect
            className="mt-2"
            value={draft.professionalCbo ?? ''}
            onChange={(value) => {
              const option = cboOptions.find((entry) => entry.value === value)
              onDraftChange({
                professionalCbo: value,
                professionalCboLabel: option?.label ?? value,
              })
            }}
            options={[{ value: '', label: 'Selecionar CBO' }, ...cboOptions]}
          />
        </div>
      </div>
    )
  }

  if (definition.mode === 'edit_mt_profissional') {
    return (
      <div className="space-y-4">
        <FieldBlock
          label="Profissional terceirizado"
          value={`${item.professionalName} · ${item.specialty}`}
        />
        <div>
          <label className="block text-sm font-semibold text-gray-900">CNS do executante</label>
          <input
            type="text"
            inputMode="numeric"
            value={draft.professionalCns ?? ''}
            onChange={(event) =>
              onDraftChange({ professionalCns: event.target.value.replace(/\D/g, '').slice(0, 15) })
            }
            placeholder="15 dígitos"
            className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-gray-900">CRM</label>
            <input
              type="text"
              inputMode="numeric"
              value={draft.professionalConselhoNumero ?? ''}
              onChange={(event) =>
                onDraftChange({
                  professionalConselhoNumero: event.target.value.replace(/\D/g, '').slice(0, 10),
                })
              }
              placeholder="Número"
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900">UF</label>
            <input
              type="text"
              value={draft.professionalConselhoUf ?? ''}
              onChange={(event) =>
                onDraftChange({
                  professionalConselhoUf: event.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase(),
                })
              }
              placeholder="SP"
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm uppercase outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900">CBO</label>
          <CustomSelect
            className="mt-2"
            value={draft.professionalCbo ?? ''}
            onChange={(value) => {
              const option = cboOptions.find((entry) => entry.value === value)
              onDraftChange({
                professionalCbo: value,
                professionalCboLabel: option?.label ?? value,
              })
            }}
            options={[{ value: '', label: 'Selecionar CBO' }, ...cboOptions]}
          />
        </div>
      </div>
    )
  }

  if (definition.mode === 'edit_vinculo_cnes') {
    return (
      <div>
        <FieldBlock label="Unidade" value={`${item.unitName} · CNES ${item.cnes}`} />
        <FieldBlock
          label="Campo inválido"
          value="Sem vínculo ativo com o CNES"
          invalid
        />
        <label className="mt-4 flex items-start gap-3 rounded-xl border border-[var(--brand-primary-border)] bg-[var(--brand-primary-light)]/40 px-4 py-3">
          <input
            type="checkbox"
            checked={draft.professionalHasCnesVinculo === true}
            onChange={(event) =>
              onDraftChange({ professionalHasCnesVinculo: event.target.checked })
            }
            className="mt-1 h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
          />
          <span className="text-sm leading-relaxed text-gray-800">
            Confirmo o vínculo do profissional <strong>{item.professionalName}</strong> com o CNES{' '}
            {item.cnes}.
          </span>
        </label>
      </div>
    )
  }

  if (definition.mode === 'select_procedure') {
    const cboLabel = item.professionalCboLabel ?? item.professionalCbo ?? 'CBO não informado'
    return (
      <div>
        {item.kind === 'cbo_incompativel' ? (
          <div className="rounded-xl border border-red-200 bg-red-50/70 px-4 py-3 text-sm leading-relaxed text-red-900">
            O CBO <strong>{cboLabel.split(' — ')[0] ?? cboLabel}</strong> não está autorizado para o
            procedimento {item.suggestedProcedure ?? 'selecionado'}.
          </div>
        ) : (
          <FieldBlock
            label="Campo inválido"
            value={item.suggestedProcedure ?? 'Procedimento ausente'}
            invalid
          />
        )}
        <div className="mt-4">
          <label className="block text-sm font-semibold text-gray-900">
            {item.kind === 'cbo_incompativel' ? 'Procedimentos compatíveis' : definition.fieldLabel}
          </label>
          <CustomSelect
            className="mt-2"
            value={draft.suggestedProcedure ?? ''}
            onChange={(value) => onDraftChange({ suggestedProcedure: value, procedureCompatibleWithCbo: true })}
            options={[{ value: '', label: 'Selecionar procedimento' }, ...resolvedProcedureOptions]}
          />
        </div>
      </div>
    )
  }

  if (definition.mode === 'request_clinical') {
    return (
      <div className="space-y-4">
        <FieldBlock label="Campo inválido" value="CID principal ausente" invalid />
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 px-4 py-3 text-sm leading-relaxed text-indigo-950">
          Somente o profissional responsável pode alterar dados clínicos.
        </div>
        <FieldBlock label="Profissional responsável" value={item.professionalName} />
      </div>
    )
  }

  if (definition.mode === 'open_consulta') {
    return (
      <div className="space-y-4">
        <FieldBlock label="Consulta" value={item.consultaId} />
        <FieldBlock
          label="Data do atendimento"
          value={formatPendenciaConsultaDate(item.consultaDate)}
        />
        <FieldBlock
          label="Campo inválido"
          value="Prontuário / horários incompletos"
          invalid
        />
        <label className="flex items-start gap-3 rounded-xl border border-[var(--brand-primary-border)] bg-[var(--brand-primary-light)]/40 px-4 py-3">
          <input
            type="checkbox"
            checked={draft.consultaEncerrada === true}
            onChange={(event) => onDraftChange({ consultaEncerrada: event.target.checked })}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
          />
          <span className="text-sm leading-relaxed text-gray-800">
            Confirmo que a consulta foi aberta, o prontuário encerrado e os horários registrados.
          </span>
        </label>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <FieldBlock label="Consulta atual" value={item.consultaId} />
      <FieldBlock
        label="Consulta duplicada"
        value={item.duplicateConsultaId ?? 'CONS-2026-0615-1400'}
        invalid
      />
      <label className="flex items-start gap-3 rounded-xl border border-[var(--brand-primary-border)] bg-[var(--brand-primary-light)]/40 px-4 py-3">
        <input
          type="checkbox"
          checked={draft.duplicidadeResolvida === true}
          onChange={(event) => onDraftChange({ duplicidadeResolvida: event.target.checked })}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
        />
        <span className="text-sm leading-relaxed text-gray-800">
          Mantive apenas a consulta válida para faturamento e descartei a duplicidade.
        </span>
      </label>
    </div>
  )
}

function buildInitialDraft(
  item: PrefeituraFaturamentoPendencia,
  definition: PrefeituraFaturamentoCorrecaoDefinition,
): PrefeituraFaturamentoCorrecaoPayload {
  switch (definition.mode) {
    case 'edit_cns': {
      const digits = item.patientCns?.replace(/\D/g, '') ?? ''
      return { patientCns: digits.length >= 15 ? digits : '' }
    }
    case 'edit_municipio':
      return {
        patientMunicipality: item.patientMunicipality ?? '',
        patientMunicipalityIbge: item.patientMunicipalityIbge ?? '',
      }
    case 'edit_cbo':
      return {
        professionalCbo: item.professionalCbo ?? '',
        professionalCboLabel: item.professionalCboLabel ?? '',
      }
    case 'edit_mt_profissional':
      return {
        professionalCns: item.professionalCns?.replace(/\D/g, '') ?? '',
        professionalConselhoNumero: item.professionalConselho?.split('/')[0]?.replace(/\D/g, '') ?? '',
        professionalConselhoUf:
          item.professionalConselho?.includes('/') ?
            item.professionalConselho.split('/').pop()?.trim() ?? ''
          : '',
        professionalCbo: item.professionalCbo ?? '',
        professionalCboLabel: item.professionalCboLabel ?? '',
      }
    case 'edit_vinculo_cnes':
      return { professionalHasCnesVinculo: item.professionalHasCnesVinculo ?? false }
    case 'select_procedure':
      return { suggestedProcedure: item.suggestedProcedure ?? '' }
    case 'open_consulta':
      return { consultaEncerrada: item.consultaEncerrada ?? false }
    case 'compare_consultas':
      return { duplicidadeResolvida: item.duplicidadeResolvida ?? false }
    default:
      return {}
  }
}

function validateDraft(
  definition: PrefeituraFaturamentoCorrecaoDefinition,
  draft: PrefeituraFaturamentoCorrecaoPayload,
) {
  switch (definition.mode) {
    case 'edit_cns':
      return (draft.patientCns?.replace(/\D/g, '').length ?? 0) >= 15
    case 'edit_municipio':
      return (
        !!draft.patientMunicipality?.trim() &&
        (draft.patientMunicipalityIbge?.replace(/\D/g, '').length ?? 0) === 7
      )
    case 'edit_cbo':
      return !!draft.professionalCbo
    case 'edit_mt_profissional':
      return (
        (draft.professionalCns?.replace(/\D/g, '').length ?? 0) >= 15 ||
        (!!draft.professionalConselhoNumero?.trim() &&
          (draft.professionalConselhoUf?.trim().length ?? 0) === 2) ||
        !!draft.professionalCbo
      )
    case 'edit_vinculo_cnes':
      return draft.professionalHasCnesVinculo === true
    case 'select_procedure':
      return !!draft.suggestedProcedure
    case 'open_consulta':
      return draft.consultaEncerrada === true
    case 'compare_consultas':
      return draft.duplicidadeResolvida === true
    default:
      return true
  }
}

export function PrefeituraFaturamentoCorrecaoDrawer({
  open,
  closing,
  item,
  checkId,
  onClose,
  onTransitionEnd,
  onSave,
  onRequestClinical,
}: PrefeituraFaturamentoCorrecaoDrawerProps) {
  const closeTimeoutRef = useRef<number | null>(null)
  const [draft, setDraft] = useState<PrefeituraFaturamentoCorrecaoPayload>({})
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const isActive = open || closing
  const panelVisible = open && !closing && !saving
  const definition =
    item && checkId ? resolveCorrecaoDefinition(item, checkId) : null

  useEffect(() => {
    if (!open || !item || !definition) return
    setDraft(buildInitialDraft(item, definition))
    setError(null)
    setSaving(false)
  }, [definition, item, open, checkId])

  useEffect(() => {
    if (!isActive) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !saving) onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isActive, onClose, saving])

  useEffect(() => {
    if (!closing) return
    closeTimeoutRef.current = window.setTimeout(() => onTransitionEnd(), 350)
    return () => {
      if (closeTimeoutRef.current != null) {
        window.clearTimeout(closeTimeoutRef.current)
        closeTimeoutRef.current = null
      }
    }
  }, [closing, onTransitionEnd])

  if (!isActive || !item || !checkId || !definition) return null

  const statusBadge = resolvePendenciaSituacaoBadge(item)

  async function handleSave() {
    if (definition!.mode === 'request_clinical') {
      setSaving(true)
      await onRequestClinical(item!)
      window.setTimeout(() => onClose(), 900)
      return
    }

    if (!validateDraft(definition!, draft)) {
      setError('Preencha o campo obrigatório antes de salvar.')
      return
    }

    setError(null)
    setSaving(true)
    await onSave(item!, checkId!, draft)
    window.setTimeout(() => onClose(), 900)
  }

  return createPortal(
    <div
      className={`fixed inset-0 z-[10001] ${panelVisible || saving ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity duration-300 ${
          panelVisible || saving ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-label="Fechar correção"
        onClick={() => {
          if (!saving) onClose()
        }}
        tabIndex={panelVisible ? 0 : -1}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="correcao-title"
        onTransitionEnd={(event) => {
          if (event.propertyName === 'transform' && closing) onTransitionEnd()
        }}
        className={[
          'absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-gray-200 bg-white shadow-[-12px_0_40px_rgba(0,0,0,0.16)] transition-transform duration-300 ease-out',
          panelVisible || saving ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        <header className="shrink-0 border-b border-gray-200 px-5 py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-700">
                <Wrench className="h-3.5 w-3.5" />
                Correção
              </span>
              <h2 id="correcao-title" className="mt-3 text-lg font-bold text-gray-900">
                {definition.title}
              </h2>
              <p className="mt-1 text-sm text-gray-600">{item.title}</p>
              <div className="mt-2">
                <SituationStatusBadge config={statusBadge} widthClass="w-[9.5rem]" />
              </div>
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:bg-gray-50 hover:text-gray-800 disabled:opacity-40"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {saving ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
              <Loader2 className="h-10 w-10 animate-spin text-[var(--brand-primary)]" />
              <p className="mt-4 text-sm font-semibold text-gray-900">Corrigindo...</p>
              <p className="mt-1 text-sm text-gray-500">Salvando e revalidando a pendência.</p>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm leading-relaxed text-amber-950">
                {definition.reason}
              </div>

              <div className="mt-5">
                <CorrectionForm
                  item={item}
                  definition={definition}
                  draft={draft}
                  onDraftChange={(patch) => {
                    setDraft((current) => ({ ...current, ...patch }))
                    setError(null)
                  }}
                />
              </div>

              {error ? <p className="mt-3 text-sm font-medium text-red-600">{error}</p> : null}
            </>
          )}
        </div>

        {!saving ? (
          <footer className="shrink-0 border-t border-gray-200 bg-white px-5 py-4">
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="btn-brand-gradient rounded-xl px-4 py-2 text-sm font-semibold"
              >
                {definition.mode === 'request_clinical'
                  ? 'Solicitar correção ao profissional'
                  : 'Salvar e revalidar'}
              </button>
            </div>
          </footer>
        ) : null}
      </aside>
    </div>,
    document.body,
  )
}
