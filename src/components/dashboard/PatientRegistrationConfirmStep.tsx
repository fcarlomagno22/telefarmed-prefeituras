import { Camera, Loader2, UserRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  getPatientPreferredName,
  type PatientAgeGroup,
  type PatientRegistration,
} from '../../types/attendance'
import { CustomSelect } from '../ui/CustomSelect'
import { maskCep, maskPhone } from '../../utils/masks'
import { patientHasGuardianSection } from '../../utils/patientRegistrationConsent'
import { requiresGuardianValidation } from '../../utils/patientRegistrationValidation'
import { fetchAddressByCep } from '../../utils/viacep'
import { AttendanceStepFooter } from './AttendanceStepFooter'
import { AttendanceStepShell } from './AttendanceStepShell'
import { PatientGuardianFieldsSection } from './PatientGuardianFieldsSection'
import { PatientSocialNameFields } from './PatientSocialNameFields'
import {
  getRegistrationMissingFields,
  getRegistrationValidationMessages,
  isRegistrationStepReady,
} from './registrationStepValidation'

type PatientRegistrationConfirmStepProps = {
  data: PatientRegistration
  ageGroup: PatientAgeGroup
  onChange: (data: PatientRegistration) => void
  onSubmit: () => void
  onBack: () => void
  onOpenPhotoCapture: () => void
  /** Oculta seção de foto (ex.: agendamento pela agenda). */
  hidePhoto?: boolean
  /** Bloqueia o botão Continuar enquanto a etapa salva/navega (ex.: triagem etapa 3). */
  continueLoading?: boolean
  continueLabel?: string
  embedded?: boolean
}

const inputClass =
  'w-full rounded-xl border border-gray-200/80 bg-white py-3 px-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15'

const brazilianStates = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

const inputErrorClass =
  'w-full rounded-xl border border-red-300 bg-white py-3 px-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-red-400 focus:ring-2 focus:ring-red-200/60'

export function PatientRegistrationConfirmStep({
  data,
  ageGroup,
  onChange,
  onSubmit,
  onBack,
  onOpenPhotoCapture,
  hidePhoto = false,
  continueLoading = false,
  continueLabel = 'Confirmar',
  embedded = false,
}: PatientRegistrationConfirmStepProps) {
  const [isLoadingCep, setIsLoadingCep] = useState(false)
  const [cepMessage, setCepMessage] = useState<string | null>(null)
  const [showHints, setShowHints] = useState(false)
  const [guardianCpfTouched, setGuardianCpfTouched] = useState(false)

  const missingFields = useMemo(
    () => getRegistrationMissingFields(data, ageGroup, true),
    [data, ageGroup],
  )
  const validationMessages = useMemo(
    () => getRegistrationValidationMessages(data, ageGroup, true),
    [data, ageGroup],
  )
  const continueReady = isRegistrationStepReady(data, ageGroup, true)
  const showGuardian = patientHasGuardianSection(ageGroup, data)

  function patch(field: keyof PatientRegistration, value: string) {
    onChange({ ...data, [field]: value })
  }

  async function handleCepBlur() {
    const digits = data.zipCode.replace(/\D/g, '')
    if (digits.length !== 8) return

    setIsLoadingCep(true)
    setCepMessage(null)

    try {
      const address = await fetchAddressByCep(data.zipCode)

      if (!address) {
        setCepMessage('CEP não encontrado. Preencha o endereço manualmente.')
        return
      }

      onChange({
        ...data,
        street: address.street || data.street,
        neighborhood: address.neighborhood || data.neighborhood,
        city: address.city || data.city,
        state: address.state || data.state,
        residenceMunicipalityIbgeCode:
          address.ibgeMunicipalityCode || data.residenceMunicipalityIbgeCode,
      })
      setCepMessage('Endereço atualizado automaticamente.')
    } catch {
      setCepMessage('Não foi possível buscar o CEP. Preencha manualmente.')
    } finally {
      setIsLoadingCep(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (continueLoading) return
    if (requiresGuardianValidation(ageGroup, data)) setGuardianCpfTouched(true)
    if (!continueReady) {
      setShowHints(true)
      return
    }
    onSubmit()
  }

  function handleContinueBlocked() {
    if (requiresGuardianValidation(ageGroup, data)) setGuardianCpfTouched(true)
    setShowHints(true)
  }

  return (
    <AttendanceStepShell
      embedded={embedded}
      title="Confirme seu cadastro"
      description={
        hidePhoto
          ? 'Você já possui cadastro. Revise telefone, e-mail, endereço e dados do responsável (quando aplicável) antes de continuar.'
          : 'Você já possui cadastro. Revise telefone, e-mail, endereço, responsável (quando aplicável) e foto antes de continuar.'
      }
      footer={
        <AttendanceStepFooter
          onBack={onBack}
          continueLabel={continueLabel}
          continueType="submit"
          formId="patient-confirm-registration-form"
          continueReady={continueReady}
          continueLoading={continueLoading}
          onContinueBlocked={handleContinueBlocked}
        />
      }
    >
      <form
        id="patient-confirm-registration-form"
        onSubmit={handleSubmit}
        className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto no-scrollbar"
      >
        {showHints && validationMessages.length > 0 ? (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <p className="font-semibold">Corrija os dados abaixo antes de continuar:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
              {validationMessages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <section className="shrink-0 rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
          <div className="overflow-visible rounded-t-2xl bg-gradient-to-r from-[var(--brand-primary-light)] via-[var(--brand-primary-muted)]/90 to-gray-50 px-5 py-3.5 sm:px-6 sm:py-4">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-5">
              <div className="relative shrink-0">
                {data.photoDataUrl ? (
                  <div
                    className="size-24 overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-[0_8px_24px_rgba(0,0,0,0.1)] ring-1 ring-gray-100 sm:size-28"
                    style={{ borderRadius: '50%' }}
                  >
                    <img
                      src={data.photoDataUrl}
                      alt={`Foto de ${getPatientPreferredName(data)}`}
                      className="size-full object-cover object-center"
                    />
                  </div>
                ) : (
                  <div
                    className="flex size-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-[0_8px_24px_rgba(0,0,0,0.1)] ring-1 ring-gray-100 sm:size-28"
                    style={{ borderRadius: '50%' }}
                  >
                    <UserRound className="h-10 w-10 text-gray-300 sm:h-12 sm:w-12" strokeWidth={1.5} aria-hidden />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 text-center sm:text-left">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--brand-primary)]">
                  Paciente cadastrado
                </p>
                <h2 className="mt-0.5 text-lg font-bold leading-tight text-gray-900 sm:text-xl">
                  {getPatientPreferredName(data)}
                </h2>
                {data.socialName.trim() ? (
                  <p className="mt-0.5 text-xs text-gray-600">
                    Nome civil: <span className="font-medium">{data.fullName}</span>
                  </p>
                ) : null}
                <p className="mt-0.5 font-mono text-sm tracking-wide text-gray-500">{data.cpf}</p>
              </div>
            </div>
          </div>

          {!hidePhoto ? (
            <div className="px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
              <div className="flex flex-col gap-2 border-t border-gray-200 pt-4 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={onOpenPhotoCapture}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--brand-primary-shadow-sm)] transition hover:bg-[var(--brand-primary-hover)]"
                >
                  <Camera className="h-4 w-4 shrink-0" strokeWidth={2} />
                  {data.photoDataUrl ? 'Atualizar foto' : 'Tirar foto'}
                </button>
                <button
                  type="button"
                  onClick={onOpenPhotoCapture}
                  disabled={!data.photoDataUrl}
                  className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-transparent px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-amber-300 hover:bg-amber-50/50 hover:text-amber-800 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 disabled:hover:border-gray-200 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                >
                  Capturar novamente
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <section className="shrink-0">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Identificação
          </p>
          <PatientSocialNameFields data={data} onChange={onChange} inputClass={inputClass} />
        </section>

        <section className="shrink-0">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Contato
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-gray-700">
                Celular
              </span>
              <input
                type="tel"
                value={data.phone}
                onChange={(e) => patch('phone', maskPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-gray-700">
                E-mail
              </span>
              <input
                type="email"
                value={data.email}
                onChange={(e) => patch('email', e.target.value)}
                placeholder="seu@email.com"
                className={inputClass}
              />
            </label>
          </div>
        </section>

        <section className="shrink-0">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Endereço
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs font-medium text-gray-700">
                CEP
              </span>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={data.zipCode}
                  onChange={(e) => patch('zipCode', maskCep(e.target.value))}
                  onBlur={handleCepBlur}
                  placeholder="00000-000"
                  maxLength={9}
                  className={inputClass}
                />
                {isLoadingCep ? (
                  <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
                ) : null}
              </div>
              {cepMessage ? <p className="mt-1.5 text-xs text-gray-500">{cepMessage}</p> : null}
            </label>

            <div className="grid grid-cols-1 gap-3 sm:col-span-2 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,4.75rem)_minmax(0,0.9fr)]">
              <label className="block min-w-0">
                <span className="mb-1.5 block text-xs font-medium text-gray-700">
                  Rua / logradouro
                </span>
                <input
                  type="text"
                  value={data.street}
                  onChange={(e) => patch('street', e.target.value)}
                  placeholder="Nome da rua"
                  className={inputClass}
                />
              </label>

              <label className="block min-w-0">
                <span className="mb-1.5 block text-xs font-medium text-gray-700">
                  Número
                </span>
                <input
                  type="text"
                  value={data.number}
                  onChange={(e) => patch('number', e.target.value)}
                  placeholder="Nº"
                  className={inputClass}
                />
              </label>

              <label className="block min-w-0">
                <span className="mb-1.5 block text-xs font-medium text-gray-700">
                  Complemento
                </span>
                <input
                  type="text"
                  value={data.complement}
                  onChange={(e) => patch('complement', e.target.value)}
                  placeholder="Apto"
                  className={inputClass}
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:col-span-2 sm:grid-cols-[minmax(0,1.15fr)_minmax(0,1.15fr)_minmax(5.5rem,6rem)]">
              <label className="block min-w-0">
                <span className="mb-1.5 block text-xs font-medium text-gray-700">
                  Bairro
                </span>
                <input
                  type="text"
                  value={data.neighborhood}
                  onChange={(e) => patch('neighborhood', e.target.value)}
                  placeholder="Bairro"
                  className={inputClass}
                />
              </label>

              <label className="block min-w-0">
                <span className="mb-1.5 block text-xs font-medium text-gray-700">
                  Cidade
                </span>
                <input
                  type="text"
                  value={data.city}
                  onChange={(e) => patch('city', e.target.value)}
                  placeholder="Cidade"
                  className={inputClass}
                />
              </label>

              <label className="block min-w-0">
                <span className="mb-1.5 block text-xs font-medium text-gray-700">
                  UF
                </span>
                <CustomSelect
                  value={data.state}
                  onChange={(value) => patch('state', value)}
                  options={[
                    { value: '', label: '—' },
                    ...brazilianStates.map((uf) => ({ value: uf, label: uf })),
                  ]}
                  placeholder="UF"
                  size="compact"
                  menuMinWidthPx={72}
                  className="px-3 text-center text-sm"
                />
              </label>
            </div>
          </div>
        </section>

        {showGuardian ? (
          <section className="shrink-0">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <PatientGuardianFieldsSection
                data={data}
                ageGroup={ageGroup}
                onChange={onChange}
                showHints={showHints}
                missingFields={missingFields}
                guardianCpfTouched={guardianCpfTouched}
                onGuardianCpfBlur={() => setGuardianCpfTouched(true)}
                inputClass={inputClass}
                inputErrorClass={inputErrorClass}
              />
            </div>
          </section>
        ) : null}

      </form>
    </AttendanceStepShell>
  )
}
