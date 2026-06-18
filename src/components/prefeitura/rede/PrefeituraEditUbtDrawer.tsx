import { Loader2, Save, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { CredentialActionPinModal } from '../../credenciais/CredentialActionPinModal'
import { usePrefeituraAuth } from '../../../contexts/PrefeituraAuthContext'
import { usePrefeituraClinicoCatalog } from '../../../hooks/usePrefeituraClinicoCatalog'
import type { PrefeituraRedeUnit } from '../../../data/prefeituraRedeMock'
import {
  PrefeituraAuthApiError,
  verifyPrefeituraAuthorizationPin,
} from '../../../lib/services/prefeitura/auth'
import {
  fetchPrefeituraRedeUnitDetail,
  isPrefeituraRedeApiError,
  updatePrefeituraRedeUnit,
} from '../../../lib/services/prefeitura/rede'
import type { ConfigSpecialty } from '../../../types/adminConfiguracoes'
import { maskCpf, maskLandline, maskPhone } from '../../../utils/masks'
import { PrefeituraNewUbtProfessionsSpecialtiesPanel } from './newUbt/PrefeituraNewUbtProfessionsSpecialtiesPanel'
import {
  buildUbtEspecialidadeNames,
  selectAllVisibleUbtSpecialties,
  toggleProfessionInUbtForm,
  validateUbtProfessionsAndSpecialties,
} from './newUbt/newUbtCatalogUtils'
import {
  createEmptyNewUbtForm,
  isValidCpf,
  isValidEmail,
  type NewUbtFormState,
} from './newUbt/newUbtFormTypes'

const labelClass = 'mb-1 block text-xs font-semibold text-gray-800'
const inputClass =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-[var(--brand-primary)]/40 focus:shadow-[var(--brand-primary-focus-ring)]'

type PrefeituraEditUbtDrawerProps = {
  unit: PrefeituraRedeUnit | null
  open: boolean
  closing: boolean
  onClose: () => void
  onTransitionEnd: () => void
  onSaved?: (unitName: string) => void
}

function resolveSelectionFromSpecialtyNames(
  specialtyNames: string[],
  specialties: ConfigSpecialty[],
): Pick<NewUbtFormState, 'professionIds' | 'specialtyIds'> {
  const specialtyIds = new Set<string>()
  const professionIds = new Set<string>()

  for (const name of specialtyNames) {
    const match = specialties.find((item) => item.name === name)
    if (!match) continue
    specialtyIds.add(match.id)
    for (const professionId of match.professionIds) {
      professionIds.add(professionId)
    }
  }

  return { professionIds, specialtyIds }
}

export function PrefeituraEditUbtDrawer({
  unit,
  open,
  closing,
  onClose,
  onTransitionEnd,
  onSaved,
}: PrefeituraEditUbtDrawerProps) {
  const { getAccessToken } = usePrefeituraAuth()
  const {
    professions: catalogProfessions,
    specialties: catalogSpecialties,
    isLoading: catalogLoading,
    error: catalogError,
  } = usePrefeituraClinicoCatalog()

  const [entered, setEntered] = useState(false)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pinOpen, setPinOpen] = useState(false)
  const [form, setForm] = useState<NewUbtFormState>(() => createEmptyNewUbtForm(''))
  const [error, setError] = useState<string | null>(null)

  const isActive = open || closing
  const panelVisible = isActive && entered && !closing

  useEffect(() => {
    if (!open) {
      setEntered(false)
      setPinOpen(false)
      return
    }
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    if (!isActive) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive, onClose])

  useEffect(() => {
    if (!closing) return
    const fallback = window.setTimeout(() => onTransitionEnd(), 350)
    return () => window.clearTimeout(fallback)
  }, [closing, onTransitionEnd])

  useEffect(() => {
    if (!open || !unit) return

    let cancelled = false

    async function loadDetail() {
      const token = getAccessToken()
      if (!token) return

      setIsLoadingDetail(true)
      setError(null)

      try {
        const detail = await fetchPrefeituraRedeUnitDetail(token, unit!.id)
        if (cancelled) return

        const dailyCapacityMatch = detail.cadastral.dailyCapacityLabel.match(/\d+/)
        const dailyCapacity = dailyCapacityMatch ? dailyCapacityMatch[0] : '0'
        const selection = resolveSelectionFromSpecialtyNames(
          detail.cadastral.specialtyNames,
          catalogSpecialties,
        )

        setForm({
          ...createEmptyNewUbtForm(unit!.regionKey, detail.cadastral.address.city, detail.cadastral.address.state),
          name: detail.unit.name,
          cnes: detail.unit.cnes === '—' ? '' : detail.unit.cnes,
          status: detail.unit.status,
          regionId: unit!.regionKey,
          unitLandlinePhone: detail.cadastral.unitLandline,
          responsibleName: detail.unit.responsibleName === 'Responsável pendente' ? '' : detail.unit.responsibleName,
          responsibleEmail: detail.cadastral.responsibleEmail,
          responsibleCpf: detail.cadastral.responsibleCpf,
          responsiblePhone: detail.unit.responsiblePhone,
          stationsTotal: String(detail.unit.stationsTotal),
          dailyCapacityPerUnit: dailyCapacity,
          enableDailyCapacityLimit: dailyCapacity !== '0',
          professionIds: selection.professionIds,
          specialtyIds: selection.specialtyIds,
          notes: detail.cadastral.notes,
        })
      } catch {
        if (!cancelled) {
          setError('Não foi possível carregar os dados da UBT.')
        }
      } finally {
        if (!cancelled) setIsLoadingDetail(false)
      }
    }

    void loadDetail()
    return () => {
      cancelled = true
    }
  }, [open, unit, getAccessToken, catalogSpecialties])

  const specialtyValidationError = useMemo(
    () => validateUbtProfessionsAndSpecialties(form, catalogProfessions, catalogSpecialties),
    [form, catalogProfessions, catalogSpecialties],
  )

  const validateForm = useCallback((): boolean => {
    if (specialtyValidationError) {
      setError(specialtyValidationError)
      return false
    }

    if (form.responsibleEmail.trim() && !isValidEmail(form.responsibleEmail)) {
      setError('Informe um e-mail válido para o responsável.')
      return false
    }

    if (form.responsibleCpf.trim() && !isValidCpf(form.responsibleCpf)) {
      setError('Informe um CPF válido para o responsável.')
      return false
    }

    setError(null)
    return true
  }, [form.responsibleCpf, form.responsibleEmail, specialtyValidationError])

  const verifyPin = useCallback(
    async (pin: string) => {
      const token = getAccessToken()
      if (!token) return false

      try {
        await verifyPrefeituraAuthorizationPin(token, pin)
        return true
      } catch (pinError) {
        if (pinError instanceof PrefeituraAuthApiError && pinError.code === 'PIN_NOT_CONFIGURED') {
          setError(pinError.message)
          setPinOpen(false)
        }
        return false
      }
    },
    [getAccessToken],
  )

  const persistSave = useCallback(async () => {
    const token = getAccessToken()
    if (!token || !unit) return

    const stationsTotal = Math.max(1, parseInt(form.stationsTotal, 10) || 1)
    const specialtyNames = buildUbtEspecialidadeNames(form, catalogProfessions, catalogSpecialties)

    setIsSubmitting(true)
    setError(null)

    try {
      await updatePrefeituraRedeUnit(token, unit.id, {
        stationsTotal,
        dailyCapacity: form.enableDailyCapacityLimit
          ? Number.parseInt(form.dailyCapacityPerUnit, 10) || 0
          : 0,
        specialties: specialtyNames,
        phone: form.unitLandlinePhone.trim() || form.responsiblePhone.trim(),
        responsible: form.responsibleName.trim()
          ? {
              name: form.responsibleName.trim(),
              email: form.responsibleEmail.trim() || undefined,
              cpf: form.responsibleCpf.trim() || undefined,
            }
          : undefined,
      })
      setPinOpen(false)
      onSaved?.(unit.name)
      onClose()
    } catch (submitError) {
      setError(
        isPrefeituraRedeApiError(submitError)
          ? submitError.message
          : 'Não foi possível salvar as alterações.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }, [
    catalogProfessions,
    catalogSpecialties,
    form,
    getAccessToken,
    onClose,
    onSaved,
    unit,
  ])

  if (!isActive || !unit) return null

  function handleSaveClick() {
    if (!validateForm()) return
    setPinOpen(true)
  }

  return (
    <>
      {createPortal(
    <div
      className={`fixed inset-0 z-[10040] ${panelVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          panelVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-label="Fechar edição da UBT"
        onClick={onClose}
        tabIndex={panelVisible ? 0 : -1}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="prefeitura-edit-ubt-title"
        onTransitionEnd={(event) => {
          if (event.target !== event.currentTarget) return
          if (event.propertyName === 'transform') onTransitionEnd()
        }}
        className={`absolute inset-y-0 right-0 flex w-full max-w-5xl flex-col overflow-hidden border-l border-gray-200 bg-white shadow-[-16px_0_48px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out motion-reduce:transition-none ${
          panelVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-200 bg-gradient-to-b from-[var(--brand-primary-light)]/35 to-white px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--brand-primary)]">
              Edição
            </p>
            <h2 id="prefeitura-edit-ubt-title" className="mt-1 text-lg font-bold text-gray-900">
              Editar UBT
            </h2>
            <p className="mt-1 text-sm text-gray-500">{unit.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {isLoadingDetail ? (
              <p className="flex items-center gap-2 py-12 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin text-[var(--brand-primary)]" />
                Carregando dados da UBT...
              </p>
            ) : (
              <div className="space-y-5">
                <section className="grid gap-4 sm:grid-cols-2">
                  <label>
                    <span className={labelClass}>Terminais de atendimento</span>
                    <input
                      type="number"
                      min={1}
                      max={64}
                      value={form.stationsTotal}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, stationsTotal: event.target.value }))
                      }
                      className={inputClass}
                    />
                  </label>
                  <label>
                    <span className={labelClass}>Consultas máximas por dia</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.enableDailyCapacityLimit}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            enableDailyCapacityLimit: event.target.checked,
                          }))
                        }
                        className="rounded border-gray-300 text-[var(--brand-primary)]"
                      />
                      <input
                        type="number"
                        min={0}
                        disabled={!form.enableDailyCapacityLimit}
                        value={form.dailyCapacityPerUnit}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            dailyCapacityPerUnit: event.target.value,
                          }))
                        }
                        className={inputClass}
                        placeholder="Sem limite"
                      />
                    </div>
                  </label>
                </section>

                <section className="grid gap-4 sm:grid-cols-2">
                  <label>
                    <span className={labelClass}>Responsável</span>
                    <input
                      value={form.responsibleName}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, responsibleName: event.target.value }))
                      }
                      className={inputClass}
                      placeholder="Nome completo"
                    />
                  </label>
                  <label>
                    <span className={labelClass}>E-mail do responsável</span>
                    <input
                      type="email"
                      value={form.responsibleEmail}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, responsibleEmail: event.target.value }))
                      }
                      className={inputClass}
                    />
                  </label>
                  <label>
                    <span className={labelClass}>CPF do responsável</span>
                    <input
                      value={form.responsibleCpf}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          responsibleCpf: maskCpf(event.target.value),
                        }))
                      }
                      className={inputClass}
                    />
                  </label>
                  <label>
                    <span className={labelClass}>Telefone da unidade / responsável</span>
                    <input
                      value={form.responsiblePhone}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          responsiblePhone: maskPhone(event.target.value),
                          unitLandlinePhone: maskLandline(event.target.value),
                        }))
                      }
                      className={inputClass}
                    />
                  </label>
                </section>

                <PrefeituraNewUbtProfessionsSpecialtiesPanel
                  form={form}
                  professions={catalogProfessions}
                  specialties={catalogSpecialties}
                  isLoading={catalogLoading}
                  error={catalogError}
                  onToggleProfession={(professionId) =>
                    setForm((current) =>
                      toggleProfessionInUbtForm(current, professionId, catalogSpecialties),
                    )
                  }
                  onToggleSpecialty={(specialtyId) =>
                    setForm((current) => {
                      const next = new Set(current.specialtyIds)
                      if (next.has(specialtyId)) next.delete(specialtyId)
                      else next.add(specialtyId)
                      return { ...current, specialtyIds: next }
                    })
                  }
                  onSelectAllSpecialties={() =>
                    setForm((current) => selectAllVisibleUbtSpecialties(current, catalogSpecialties))
                  }
                  onClearSpecialties={() =>
                    setForm((current) => ({ ...current, specialtyIds: new Set() }))
                  }
                />
              </div>
            )}

            {error ? (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}
        </div>

        <footer className="flex shrink-0 flex-col gap-2 border-t border-gray-200 bg-white px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isSubmitting || isLoadingDetail || pinOpen}
            onClick={handleSaveClick}
            className="btn-brand-gradient inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" strokeWidth={2.5} />
            )}
            Salvar alterações
          </button>
        </footer>
      </aside>
    </div>,
    document.body,
      )}

      <CredentialActionPinModal
        open={pinOpen}
        action="ubt_edit"
        userName={unit.name}
        pinAudience="portal"
        onClose={() => {
          if (isSubmitting) return
          setPinOpen(false)
        }}
        onSuccess={() => void persistSave()}
        verifyPin={verifyPin}
      />
    </>
  )
}
