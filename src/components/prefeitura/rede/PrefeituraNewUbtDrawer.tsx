import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  UserRound,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  findPrefeituraAdministrativeRegion,
  getPrefeituraAdministrativeRegions,
} from '../../../data/prefeituraAdministrativeRegions'
import { usePrefeituraAuth } from '../../../contexts/PrefeituraAuthContext'
import { useEntidadeBranding } from '../../../contexts/EntidadeBrandingContext'
import { useOptionalTenantHost } from '../../../contexts/TenantHostContext'
import { usePrefeituraUbtContratoCatalog } from '../../../hooks/usePrefeituraUbtContratoCatalog'
import {
  createPrefeituraRedeUnit,
  isPrefeituraRedeApiError,
} from '../../../lib/services/prefeitura/rede'
import { fetchPrefeituraEntitySummary } from '../../../lib/services/prefeitura/credenciais'
import { fetchAddressByCep } from '../../../utils/viacep'
import {
  addressMatchesEntityTerritory,
  buildTerritoryMismatchMessage,
} from '../../../utils/municipalityTerritory'
import {
  buildUbtUnitCepGuidance,
  shouldEnforceUbtUnitMunicipalityTerritory,
} from '../../../utils/entidadeTerritoryPolicy'
import { isPrefeituraEntidadeTipo } from '../../../config/adminEntidadeTipo'
import { maskCep, maskCpf, maskLandline, maskPhone } from '../../../utils/masks'
import { CustomSelect } from '../../ui/CustomSelect'
import { TenantSlugField } from '../../tenant/TenantSlugField'
import {
  buildCompositeUbtSlug,
  extractUbtSlugUnitSuffix,
  suggestCompositeUbtSlugFromUnitName,
} from '../../../utils/tenantSlug'
import { PrefeituraAdministrativeRegionManager } from './newUbt/PrefeituraAdministrativeRegionManager'
import { PrefeituraNewUbtFlowStepper } from './newUbt/PrefeituraNewUbtFlowStepper'
import { PrefeituraNewUbtProfessionsSpecialtiesPanel } from './newUbt/PrefeituraNewUbtProfessionsSpecialtiesPanel'
import { PrefeituraNewUbtReviewStep } from './newUbt/PrefeituraNewUbtReviewStep'
import {
  buildUbtEspecialidadeNames,
  getSelectedProfessionNames,
  getVisibleSpecialtiesForUbtForm,
  groupSpecialtiesBySelectedProfessions,
  selectAllVisibleUbtSpecialties,
  toggleProfessionInUbtForm,
  validateUbtProfessionsAndSpecialties,
} from './newUbt/newUbtCatalogUtils'
import {
  createEmptyNewUbtForm,
  isValidCpf,
  isValidEmail,
  newUbtFlowSteps,
  resolveNewUbtStepIndex,
  newUbtUnitTypeOptions,
  validateNewUbtSlugStep,
  type NewUbtFormState,
  type NewUbtFormStep,
} from './newUbt/newUbtFormTypes'

const drawerPanelShell =
  'flex min-h-0 w-full flex-col rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]'

const labelClass = 'mb-1 block text-xs font-semibold text-gray-800'
const inputClass =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-[var(--brand-primary)]/40 focus:shadow-[var(--brand-primary-focus-ring)]'

type PrefeituraNewUbtDrawerProps = {
  open: boolean
  closing: boolean
  onClose: () => void
  onTransitionEnd: () => void
  onRegistered?: (unitName: string) => void
}

export function PrefeituraNewUbtDrawer({
  open,
  closing,
  onClose,
  onTransitionEnd,
  onRegistered,
}: PrefeituraNewUbtDrawerProps) {
  const { getAccessToken, user } = usePrefeituraAuth()
  const tenantHost = useOptionalTenantHost()
  const { branding, copy } = useEntidadeBranding()
  const entidadeTipo = branding?.entidadeTipo ?? 'prefeitura'
  const isPrefeituraTipo = isPrefeituraEntidadeTipo(entidadeTipo)
  const {
    professions: catalogProfessions,
    specialties: catalogSpecialties,
    isLoading: catalogLoading,
    error: catalogError,
  } = usePrefeituraUbtContratoCatalog(open)
  const [entered, setEntered] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState<NewUbtFormStep>('unit')
  const [form, setForm] = useState<NewUbtFormState>(() =>
    createEmptyNewUbtForm(getPrefeituraAdministrativeRegions()[0]?.id ?? ''),
  )
  const [stepError, setStepError] = useState<string | null>(null)
  const [cepLoading, setCepLoading] = useState(false)
  const [cepError, setCepError] = useState<string | null>(null)
  const [regionsVersion, setRegionsVersion] = useState(0)
  const [entitySlug, setEntitySlug] = useState(tenantHost?.slug ?? '')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const lastFetchedCepRef = useRef('')

  const operationNames = useMemo(
    () => buildUbtEspecialidadeNames(form, catalogProfessions, catalogSpecialties),
    [form.professionIds, form.specialtyIds, catalogProfessions, catalogSpecialties],
  )

  const selectedProfessionNames = useMemo(
    () => getSelectedProfessionNames(form, catalogProfessions),
    [form.professionIds, catalogProfessions],
  )

  const reviewSpecialtyGroups = useMemo(
    () =>
      groupSpecialtiesBySelectedProfessions(
        catalogSpecialties,
        form.professionIds,
        catalogProfessions,
      ).map(({ profession, specialties }) => ({
        professionName: profession.name,
        specialtyNames: specialties
          .filter((item) => form.specialtyIds.has(item.id))
          .map((item) => item.name),
        hasCatalogSpecialties: specialties.length > 0,
      })),
    [catalogProfessions, catalogSpecialties, form.professionIds, form.specialtyIds],
  )

  const visibleCatalogSpecialties = useMemo(
    () => getVisibleSpecialtiesForUbtForm(catalogSpecialties, form.professionIds),
    [catalogSpecialties, form.professionIds],
  )

  const cepDigits = form.cep.replace(/\D/g, '')

  const isActive = open || closing
  const panelVisible = isActive && entered && !closing
  const stepIndex = resolveNewUbtStepIndex(step)
  const isFirstStep = stepIndex === 0
  const isLastStep = step === 'review'

  const regionOptions = useMemo(() => {
    void regionsVersion
    return getPrefeituraAdministrativeRegions().map((region) => ({
      value: region.id,
      label: region.label,
    }))
  }, [regionsVersion])

  const selectedRegion = useMemo(() => {
    void regionsVersion
    return findPrefeituraAdministrativeRegion(form.regionId)
  }, [form.regionId, regionsVersion])

  useEffect(() => {
    if (tenantHost?.slug) {
      setEntitySlug(tenantHost.slug)
      return
    }

    if (!open) return

    const token = getAccessToken()
    if (!token) return

    let cancelled = false
    void fetchPrefeituraEntitySummary(token)
      .then((entity) => {
        if (cancelled) return
        setEntitySlug(entity.slug?.trim() ?? '')
      })
      .catch(() => {
        if (!cancelled) setEntitySlug('')
      })

    return () => {
      cancelled = true
    }
  }, [getAccessToken, open, tenantHost?.slug])

  useEffect(() => {
    if (!open || slugManuallyEdited || !entitySlug) return

    setForm((prev) => {
      if (!prev.name.trim()) return prev
      const suggested = suggestCompositeUbtSlugFromUnitName(entitySlug, prev.name)
      if (!suggested || suggested === prev.slug) return prev
      return { ...prev, slug: suggested }
    })
  }, [entitySlug, open, slugManuallyEdited])

  useEffect(() => {
    if (catalogLoading || !open) return

    const allowedProfessionIds = new Set(catalogProfessions.map((item) => item.id))
    const allowedSpecialtyIds = new Set(catalogSpecialties.map((item) => item.id))

    setForm((prev) => {
      const nextProfessionIds = new Set(
        [...prev.professionIds].filter((id) => allowedProfessionIds.has(id)),
      )
      const nextSpecialtyIds = new Set(
        [...prev.specialtyIds].filter((id) => allowedSpecialtyIds.has(id)),
      )

      if (
        nextProfessionIds.size === prev.professionIds.size &&
        nextSpecialtyIds.size === prev.specialtyIds.size
      ) {
        return prev
      }

      return {
        ...prev,
        professionIds: nextProfessionIds,
        specialtyIds: nextSpecialtyIds,
      }
    })
  }, [catalogLoading, catalogProfessions, catalogSpecialties, open])

  useEffect(() => {
    if (!open) {
      setEntered(false)
      return
    }

    const regions = getPrefeituraAdministrativeRegions()
    lastFetchedCepRef.current = ''
    setStep('unit')
    setStepError(null)
    setCepError(null)
    setSlugManuallyEdited(false)
    setForm(createEmptyNewUbtForm(regions[0]?.id ?? '', user?.municipio ?? '', user?.uf ?? ''))

    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true))
    })
    return () => cancelAnimationFrame(frame)
  }, [open, user?.municipio, user?.uf])

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
    if (step !== 'location' || cepDigits.length !== 8) {
      if (cepDigits.length < 8) lastFetchedCepRef.current = ''
      return
    }
    if (lastFetchedCepRef.current === cepDigits) return

    let cancelled = false
    lastFetchedCepRef.current = cepDigits

    async function lookupCep() {
      setCepLoading(true)
      setCepError(null)
      const address = await fetchAddressByCep(form.cep)
      if (cancelled) return
      setCepLoading(false)

      if (!address) {
        setCepError('CEP não encontrado. Verifique e tente novamente.')
        return
      }

      if (
        user &&
        isPrefeituraTipo &&
        !addressMatchesEntityTerritory(address.city, address.state, user.municipio, user.uf)
      ) {
        setCepError(
          buildTerritoryMismatchMessage(user.municipio, user.uf, address.city, address.state),
        )
        setForm((prev) => ({
          ...prev,
          street: '',
          number: '',
          complement: '',
          neighborhood: '',
          city: address.city,
          state: address.state,
        }))
        return
      }

      setForm((prev) => ({
        ...prev,
        street: address.street || prev.street,
        neighborhood: address.neighborhood || prev.neighborhood,
        city: address.city || prev.city,
        state: address.state || prev.state,
        complement: address.complement || prev.complement,
      }))
    }

    void lookupCep()
    return () => {
      cancelled = true
    }
  }, [cepDigits, form.cep, isPrefeituraTipo, step, user])

  function patchForm(patch: Partial<NewUbtFormState>) {
    setForm((prev) => ({ ...prev, ...patch }))
  }

  function validateStep(current: NewUbtFormStep): string | null {
    switch (current) {
      case 'unit':
        if (!form.name.trim()) return 'Informe o nome da UBT.'
        if (form.cnes.replace(/\D/g, '').length !== 7) return 'CNES deve ter 7 dígitos.'
        return validateNewUbtSlugStep(form, entitySlug)
      case 'location':
        if (form.cep.replace(/\D/g, '').length !== 8) return 'Informe um CEP válido.'
        if (!user) return 'Sessão expirada. Faça login novamente.'
        if (cepError) return cepError
        if (
          isPrefeituraTipo &&
          user &&
          !addressMatchesEntityTerritory(form.city, form.state, user.municipio, user.uf)
        ) {
          return buildTerritoryMismatchMessage(
            user.municipio,
            user.uf,
            form.city,
            form.state,
          )
        }
        if (!form.street.trim()) return 'Informe o logradouro.'
        if (!form.neighborhood.trim()) return 'Informe o bairro.'
        if (!form.city.trim() || !form.state.trim()) return 'Cidade e UF são obrigatórios.'
        if (isPrefeituraTipo && !form.regionId) {
          return 'Selecione a região administrativa (RA).'
        }
        if (!form.responsibleName.trim()) return 'Informe o nome do responsável.'
        if (!isValidEmail(form.responsibleEmail)) return 'Informe um e-mail válido.'
        if (!isValidCpf(form.responsibleCpf)) return 'Informe um CPF válido.'
        if (form.responsiblePhone.replace(/\D/g, '').length < 11) {
          return 'Informe um celular válido com DDD.'
        }
        return null
      case 'operation':
        if ((parseInt(form.stationsTotal, 10) || 0) < 1) return 'Informe ao menos 1 terminal.'
        if (catalogLoading) return 'Aguarde o carregamento das profissões e especialidades contratadas.'
        if (catalogError) return catalogError
        if (catalogProfessions.length === 0) {
          return 'Não há profissões contratadas disponíveis para habilitar nesta UBT.'
        }
        {
          const catalogValidation = validateUbtProfessionsAndSpecialties(
            form,
            catalogProfessions,
            catalogSpecialties,
          )
          if (catalogValidation) return catalogValidation
        }
        if (form.enableDailyCapacityLimit && (parseInt(form.dailyCapacityPerUnit, 10) || 0) < 1) {
          return 'Informe a capacidade diária por unidade.'
        }
        return null
      default:
        return null
    }
  }

  function goNext() {
    const error = validateStep(step)
    if (error) {
      setStepError(error)
      return
    }
    setStepError(null)
    const next = newUbtFlowSteps[stepIndex + 1]
    if (next) setStep(next.id)
  }

  function goBack() {
    setStepError(null)
    const prev = newUbtFlowSteps[stepIndex - 1]
    if (prev) setStep(prev.id)
  }

  function toggleProfession(professionId: string) {
    setForm((prev) => toggleProfessionInUbtForm(prev, professionId, catalogSpecialties))
  }

  function toggleSpecialty(id: string) {
    setForm((prev) => {
      const next = new Set(prev.specialtyIds)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return { ...prev, specialtyIds: next }
    })
  }

  async function handleSubmit() {
    const region = form.regionId ? findPrefeituraAdministrativeRegion(form.regionId) : null
    if (isPrefeituraTipo && !region) {
      setStepError('Selecione uma região administrativa válida.')
      setStep('location')
      return
    }

    const token = getAccessToken()
    if (!token) {
      setStepError('Sessão expirada. Faça login novamente.')
      return
    }

    const stations = Math.max(1, parseInt(form.stationsTotal, 10) || 1)
    const specialtyNames = buildUbtEspecialidadeNames(form, catalogProfessions, catalogSpecialties)

    setIsSubmitting(true)
    setStepError(null)

    try {
      const detail = await createPrefeituraRedeUnit(token, {
        name: form.name.trim(),
        slug: form.slug.trim().toLowerCase(),
        cnes: form.cnes.replace(/\D/g, ''),
        unitType: form.unitType,
        status: form.status,
        regionKey: region?.key ?? '',
        regionLabel: region?.label ?? '',
        phone: form.unitLandlinePhone.trim() || form.responsiblePhone.trim(),
        dailyCapacity: form.enableDailyCapacityLimit
          ? Number.parseInt(form.dailyCapacityPerUnit, 10) || 0
          : 0,
        specialties: specialtyNames,
        notes: form.notes.trim(),
        stationsTotal: stations,
        address: {
          cep: form.cep.trim(),
          street: form.street.trim(),
          number: form.number.trim(),
          complement: form.complement.trim(),
          neighborhood: form.neighborhood.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
        },
      })

      onRegistered?.(detail.unit.name)
      onClose()
    } catch (error) {
      const message = isPrefeituraRedeApiError(error)
        ? error.message
        : 'Não foi possível cadastrar a UBT.'
      setStepError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isActive) return null

  return createPortal(
    <div
      className={`fixed inset-0 z-[9998] ${panelVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          panelVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-label="Fechar cadastro de UBT"
        onClick={onClose}
        tabIndex={panelVisible ? 0 : -1}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="prefeitura-new-ubt-title"
        onTransitionEnd={(event) => {
          if (event.target !== event.currentTarget) return
          if (event.propertyName === 'transform') onTransitionEnd()
        }}
        className={`absolute inset-x-0 bottom-0 flex h-[92vh] max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border-t border-gray-200 bg-white shadow-[0_-16px_48px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out motion-reduce:transition-none ${
          panelVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <header className="shrink-0 border-b border-gray-200 bg-gradient-to-b from-[var(--brand-primary-light)]/35 to-white px-4 py-3 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-primary-light)] text-[var(--brand-primary)]">
                <Building2 className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <h2 id="prefeitura-new-ubt-title" className="text-base font-bold text-gray-900">
                  Nova UBT
                </h2>
                <p className="text-xs text-gray-500 sm:text-sm">
                  Cadastre uma unidade básica de teleatendimento {copy.naRede}.
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

        <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-hidden px-4 py-3 sm:px-5">
          <PrefeituraNewUbtFlowStepper step={step} />

          {stepError ? (
            <p className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {stepError}
            </p>
          ) : null}

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {step === 'unit' ? (
              <section className={`${drawerPanelShell} flex min-h-0 flex-1 flex-col overflow-hidden p-4`}>
                <div className="grid w-full shrink-0 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                  <label className="block sm:col-span-2 lg:col-span-2 xl:col-span-3">
                    <span className={labelClass}>Nome da UBT</span>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => {
                        const name = e.target.value
                        patchForm({
                          name,
                          slug: slugManuallyEdited
                            ? form.slug
                            : suggestCompositeUbtSlugFromUnitName(entitySlug, name),
                        })
                      }}
                      placeholder="Ex.: UBT Centro Administrativo"
                      className={inputClass}
                    />
                  </label>
                  <div className="block sm:col-span-2 lg:col-span-3 xl:col-span-6">
                    <TenantSlugField
                      value={extractUbtSlugUnitSuffix(entitySlug, form.slug)}
                      onChange={(unitSuffix) => {
                        setSlugManuallyEdited(true)
                        patchForm({ slug: buildCompositeUbtSlug(entitySlug, unitSuffix) })
                      }}
                      compositeEntitySlug={entitySlug || undefined}
                      urlKind="ubt"
                      availabilityMode="format-only"
                      label="Identificador da unidade"
                      hint="O endereço público usa o slug da entidade + identificador curto da UBT (ex.: fernandopolis-centro)."
                    />
                  </div>
                  <label className="block">
                    <span className={labelClass}>CNES</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.cnes}
                      onChange={(e) =>
                        patchForm({ cnes: e.target.value.replace(/\D/g, '').slice(0, 7) })
                      }
                      placeholder="0000000"
                      className={inputClass}
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Tipo da unidade</span>
                    <CustomSelect
                      size="compact"
                      value={form.unitType}
                      onChange={(value) =>
                        patchForm({ unitType: value as NewUbtFormState['unitType'] })
                      }
                      options={[...newUbtUnitTypeOptions]}
                    />
                  </label>
                  <label className="block sm:col-span-2 lg:col-span-1 xl:col-span-1">
                    <span className={labelClass}>Status inicial</span>
                    <CustomSelect
                      size="compact"
                      value={form.status}
                      onChange={(value) =>
                        patchForm({ status: value as NewUbtFormState['status'] })
                      }
                      options={[
                        { value: 'ativa', label: 'Ativa' },
                        { value: 'manutencao', label: 'Em manutenção' },
                        { value: 'inativa', label: 'Inativa' },
                      ]}
                    />
                  </label>
                </div>
                <label className="mt-3 flex min-h-0 flex-1 flex-col">
                  <span className={`${labelClass} shrink-0`}>Observações internas (opcional)</span>
                  <textarea
                    value={form.notes}
                    onChange={(e) => patchForm({ notes: e.target.value })}
                    placeholder="Anotações para a equipe de gestão da rede..."
                    className={`${inputClass} mt-1 min-h-0 flex-1 resize-none`}
                  />
                </label>
              </section>
            ) : null}

            {step === 'location' ? (
              <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_17rem] xl:grid-cols-[minmax(0,1fr)_19rem]">
                <section className={`${drawerPanelShell} flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4`}>
                  <div className="flex flex-col gap-3">
                  <p className="flex items-center gap-2 text-sm font-bold text-gray-900">
                    <MapPin className="h-4 w-4 text-[var(--brand-primary)]" strokeWidth={2} />
                    Endereço da unidade
                  </p>
                  {user ? (
                    <p className="text-xs text-gray-500">
                      {buildUbtUnitCepGuidance({
                        municipio: user.municipio,
                        uf: user.uf,
                        tipoEntidade: entidadeTipo,
                      })}
                    </p>
                  ) : null}
                  <label className="relative block max-w-xs sm:max-w-sm">
                    <span className={labelClass}>CEP</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.cep}
                      onChange={(e) => {
                        const cep = maskCep(e.target.value)
                        const digits = cep.replace(/\D/g, '')
                        if (digits.length < 8) lastFetchedCepRef.current = ''
                        setCepError(null)
                        patchForm({ cep })
                      }}
                      placeholder="00000-000"
                      className={`${inputClass} pr-10`}
                    />
                    {cepLoading ? (
                      <Loader2
                        className="pointer-events-none absolute right-3 top-[1.85rem] h-4 w-4 animate-spin text-gray-400"
                        aria-hidden
                      />
                    ) : null}
                  </label>
                  {cepError ? <p className="text-xs text-red-600">{cepError}</p> : null}
                  {cepLoading && !cepError ? (
                    <p className="text-xs text-gray-500">Buscando endereço pelo CEP…</p>
                  ) : null}

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                    <label className="block sm:col-span-2 xl:col-span-4">
                      <span className={labelClass}>Logradouro</span>
                      <input
                        type="text"
                        value={form.street}
                        onChange={(e) => patchForm({ street: e.target.value })}
                        className={inputClass}
                      />
                    </label>
                    <label className="block">
                      <span className={labelClass}>Número</span>
                      <input
                        type="text"
                        value={form.number}
                        onChange={(e) => patchForm({ number: e.target.value })}
                        className={inputClass}
                      />
                    </label>
                    <label className="block">
                      <span className={labelClass}>Complemento</span>
                      <input
                        type="text"
                        value={form.complement}
                        onChange={(e) => patchForm({ complement: e.target.value })}
                        className={inputClass}
                      />
                    </label>
                    <label className="block sm:col-span-2 xl:col-span-2">
                      <span className={labelClass}>Bairro</span>
                      <input
                        type="text"
                        value={form.neighborhood}
                        onChange={(e) => patchForm({ neighborhood: e.target.value })}
                        className={inputClass}
                      />
                    </label>
                    <label className="block sm:col-span-2 xl:col-span-3">
                      <span className={labelClass}>Cidade</span>
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) => patchForm({ city: e.target.value })}
                        className={inputClass}
                      />
                    </label>
                    <label className="block xl:col-span-1">
                      <span className={labelClass}>UF</span>
                      <input
                        type="text"
                        maxLength={2}
                        value={form.state}
                        onChange={(e) => patchForm({ state: e.target.value.toUpperCase().slice(0, 2) })}
                        className={inputClass}
                      />
                    </label>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className={labelClass}>Telefone fixo (opcional)</span>
                      <input
                        type="tel"
                        inputMode="tel"
                        value={form.unitLandlinePhone}
                        onChange={(e) =>
                          patchForm({ unitLandlinePhone: maskLandline(e.target.value) })
                        }
                        placeholder="(00) 0000-0000"
                        className={inputClass}
                      />
                    </label>
                    <label className="block">
                      <span className={labelClass}>
                        Região administrativa (RA){isPrefeituraTipo ? '' : ' (opcional)'}
                      </span>
                      <CustomSelect
                        size="compact"
                        value={form.regionId}
                        onChange={(value) => patchForm({ regionId: value })}
                        options={[
                          ...(isPrefeituraTipo
                            ? []
                            : [{ value: '', label: 'Não informar RA' }]),
                          ...regionOptions,
                        ]}
                      />
                    </label>
                  </div>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-gray-100 pt-5">
                    <p className="flex items-center gap-2 text-sm font-bold text-gray-900">
                      <UserRound className="h-4 w-4 text-[var(--brand-primary)]" strokeWidth={2} />
                      Responsável pela unidade
                    </p>
                    <label className="block">
                      <span className={labelClass}>Nome completo</span>
                      <input
                        type="text"
                        value={form.responsibleName}
                        onChange={(e) => patchForm({ responsibleName: e.target.value })}
                        className={inputClass}
                      />
                    </label>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <label className="block">
                        <span className={labelClass}>E-mail</span>
                        <input
                          type="email"
                          value={form.responsibleEmail}
                          onChange={(e) => patchForm({ responsibleEmail: e.target.value })}
                          className={inputClass}
                        />
                      </label>
                      <label className="block">
                        <span className={labelClass}>CPF</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={form.responsibleCpf}
                          onChange={(e) => patchForm({ responsibleCpf: maskCpf(e.target.value) })}
                          placeholder="000.000.000-00"
                          className={inputClass}
                        />
                      </label>
                      <label className="block">
                        <span className={labelClass}>Celular</span>
                        <input
                          type="tel"
                          inputMode="tel"
                          value={form.responsiblePhone}
                          onChange={(e) =>
                            patchForm({ responsiblePhone: maskPhone(e.target.value) })
                          }
                          placeholder="(00) 00000-0000"
                          className={inputClass}
                        />
                      </label>
                    </div>
                  </div>
                </section>

                {isPrefeituraTipo ? (
                  <PrefeituraAdministrativeRegionManager
                    selectedRegionId={form.regionId}
                    onSelectRegion={(regionId) => patchForm({ regionId })}
                    onRegionsChange={() => setRegionsVersion((v) => v + 1)}
                  />
                ) : null}
              </div>
            ) : null}

            {step === 'operation' ? (
              <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
                <section className={`${drawerPanelShell} flex flex-col gap-3 overflow-y-auto p-4`}>
                  <p className="text-sm font-bold text-gray-900">Terminais e capacidade</p>
                  <label className="block">
                    <span className={labelClass}>Terminais de atendimento</span>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={form.stationsTotal}
                      onChange={(e) => patchForm({ stationsTotal: e.target.value })}
                      className={inputClass}
                    />
                    <span className="mt-0.5 block text-[11px] text-gray-500">
                      Terminais de telemedicina instalados nesta UBT.
                    </span>
                  </label>

                  <label className="flex cursor-pointer items-start justify-between gap-3 rounded-lg border border-gray-200 bg-slate-50/60 px-3 py-2.5">
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-gray-900">
                        Limitar capacidade diária nesta unidade
                      </span>
                      <span className="mt-0.5 block text-[11px] text-gray-500">
                        Ao atingir o limite, a UBT para de aceitar novas consultas no dia.
                      </span>
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={form.enableDailyCapacityLimit}
                      onClick={() =>
                        patchForm({ enableDailyCapacityLimit: !form.enableDailyCapacityLimit })
                      }
                      className={[
                        'relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition',
                        form.enableDailyCapacityLimit ? 'bg-[var(--brand-primary)]' : 'bg-gray-200',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition',
                          form.enableDailyCapacityLimit ? 'left-[1.35rem]' : 'left-0.5',
                        ].join(' ')}
                      />
                    </button>
                  </label>

                  {form.enableDailyCapacityLimit ? (
                    <label className="block">
                      <span className={labelClass}>Capacidade diária (consultas)</span>
                      <input
                        type="number"
                        min={1}
                        value={form.dailyCapacityPerUnit}
                        onChange={(e) => patchForm({ dailyCapacityPerUnit: e.target.value })}
                        className={inputClass}
                      />
                    </label>
                  ) : null}
                </section>

                <PrefeituraNewUbtProfessionsSpecialtiesPanel
                  form={form}
                  professions={catalogProfessions}
                  specialties={catalogSpecialties}
                  isLoading={catalogLoading}
                  error={catalogError}
                  onToggleProfession={toggleProfession}
                  onToggleSpecialty={toggleSpecialty}
                  onSelectAllSpecialties={() =>
                    setForm((prev) =>
                      selectAllVisibleUbtSpecialties(prev, visibleCatalogSpecialties),
                    )
                  }
                  onClearSpecialties={() => patchForm({ specialtyIds: new Set() })}
                />
              </div>
            ) : null}

            {step === 'review' ? (
              <section className={`${drawerPanelShell} min-h-0 flex-1 overflow-hidden p-4 sm:p-5`}>
                <PrefeituraNewUbtReviewStep
                  form={form}
                  regionLabel={
                    isPrefeituraTipo
                      ? (selectedRegion?.label ?? '—')
                      : (selectedRegion?.label ?? 'Não informada')
                  }
                  professionNames={selectedProfessionNames}
                  specialtyGroups={reviewSpecialtyGroups}
                  operationNames={operationNames}
                  naRedeLabel={copy.naRede}
                  isPrefeituraTipo={isPrefeituraTipo}
                  entidadeDisplayName={branding?.displayName}
                  entidadeLogoUrl={branding?.logoUrl}
                  entidadeCorPrimaria={branding?.corPrimaria}
                />
              </section>
            ) : null}
          </div>
        </div>

        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-gray-200 bg-white px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={isFirstStep ? onClose : goBack}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            {isFirstStep ? 'Cancelar' : 'Voltar'}
          </button>

          {isLastStep ? (
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={isSubmitting}
              className="btn-brand-gradient inline-flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-semibold disabled:opacity-60"
            >
              {isSubmitting ? 'Cadastrando…' : 'Cadastrar UBT'}
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              className="btn-brand-gradient inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold"
            >
              Continuar
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </button>
          )}
        </footer>
      </aside>
    </div>,
    document.body,
  )
}
