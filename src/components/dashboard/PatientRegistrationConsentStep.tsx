import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  getPatientPreferredName,
  type PatientAgeGroup,
  type PatientRegistration,
  type PatientRegistrationConsent,
} from '../../types/attendance'
import type { PatientRegistrationConsentTermKey } from '../../types/patientRegistrationConsentTerms'
import { patientRegistrationConsentTermLabels } from '../../types/patientRegistrationConsentTerms'
import { formatDatePtBr } from '../../utils/calendar'
import { usePatientRegistrationConsentTerms } from '../../hooks/usePatientRegistrationConsentTerms'
import {
  buildPatientRegistrationConsentDraft,
  finalizePatientRegistrationConsent,
  isPatientRegistrationConsentReady,
  type PatientRegistrationOperatorContext,
} from '../../utils/patientRegistrationConsent'
import {
  guardianRelationshipOptions,
  patientNationalityOptions,
  patientRaceColorOptions,
} from '../../utils/patientRegistrationOptions'
import { AttendanceStepFooter } from './AttendanceStepFooter'
import { AttendanceStepShell } from './AttendanceStepShell'
import { PatientRegistrationConsentTermDrawer } from './PatientRegistrationConsentTermDrawer'
import { isRegistrationConsentStepReady, getRegistrationValidationMessages } from './registrationStepValidation'

const consentTermItems: Array<{
  key: PatientRegistrationConsentTermKey
  required: true
}> = [
  { key: 'dataReviewed', required: true },
  { key: 'teleconsultationAuthorized', required: true },
  { key: 'dataUsageAcknowledged', required: true },
  { key: 'notificationsAllowed', required: true },
]

type PatientRegistrationConsentStepProps = {
  data: PatientRegistration
  ageGroup: PatientAgeGroup
  operator: PatientRegistrationOperatorContext
  onChange: (data: PatientRegistration) => void
  onSubmit: (data: PatientRegistration) => void
  onBack: () => void
  embedded?: boolean
  continueLabel?: string
  continueLoading?: boolean
}

function formatConsentTimestamp(value: string) {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed)
}

function labelForOption(
  options: ReadonlyArray<{ value: string; label: string }>,
  value: string,
) {
  return options.find((option) => option.value === value)?.label ?? (value || '—')
}

export function PatientRegistrationConsentStep({
  data,
  ageGroup,
  operator,
  onChange,
  onSubmit,
  onBack,
  embedded = false,
  continueLabel = 'Confirmar cadastro',
  continueLoading = false,
}: PatientRegistrationConsentStepProps) {
  const [showHints, setShowHints] = useState(false)
  const [activeTermKey, setActiveTermKey] = useState<PatientRegistrationConsentTermKey | null>(null)
  const [termDrawerClosing, setTermDrawerClosing] = useState(false)
  const { isLoading: isTermsLoading, loadError: termsLoadError, getTerm } =
    usePatientRegistrationConsentTerms()

  useEffect(() => {
    if (data.registrationConsent) return
    onChange({
      ...data,
      registrationConsent: buildPatientRegistrationConsentDraft(operator),
    })
  }, [data, onChange, operator])

  const consent = data.registrationConsent
  const registrationValidationMessages = useMemo(
    () => getRegistrationValidationMessages(data, ageGroup, true),
    [data, ageGroup],
  )
  const continueReady = isRegistrationConsentStepReady(data, ageGroup, true)

  const summaryItems = useMemo(
    () => [
      { label: 'Paciente', value: getPatientPreferredName(data) },
      { label: 'CPF', value: data.cpf || '—' },
      {
        label: 'Nacionalidade',
        value: labelForOption(patientNationalityOptions, data.nationality),
      },
      {
        label: 'Raça/cor',
        value: labelForOption(patientRaceColorOptions, data.raceColor),
      },
      {
        label: 'Responsável',
        value: data.guardianName.trim() || '—',
      },
      {
        label: 'Parentesco',
        value: labelForOption(guardianRelationshipOptions, data.guardianRelationship),
      },
      {
        label: 'Endereço',
        value:
          [data.street, data.number, data.neighborhood, data.city, data.state]
            .filter(Boolean)
            .join(', ') || '—',
      },
    ],
    [data],
  )

  function patchConsent(patch: Partial<PatientRegistrationConsent>) {
    if (!consent) return
    onChange({
      ...data,
      registrationConsent: {
        ...consent,
        ...patch,
      },
    })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!continueReady || !consent) {
      setShowHints(true)
      return
    }

    const finalizedRegistration: PatientRegistration = {
      ...data,
      registrationConsent: finalizePatientRegistrationConsent(consent),
    }
    onChange(finalizedRegistration)
    onSubmit(finalizedRegistration)
  }

  function openTermDrawer(key: PatientRegistrationConsentTermKey) {
    setActiveTermKey(key)
    setTermDrawerClosing(false)
  }

  function closeTermDrawer() {
    setTermDrawerClosing(true)
  }

  function handleTermDrawerTransitionEnd() {
    if (!termDrawerClosing) return
    setActiveTermKey(null)
    setTermDrawerClosing(false)
  }

  const activeTerm = activeTermKey ? getTerm(activeTermKey) : null

  return (
    <AttendanceStepShell
      embedded={embedded}
      title="Confirmação final do cadastro"
      description="Revise o resumo, confirme os termos e autorize o cadastro antes de concluir."
      footer={
        <AttendanceStepFooter
          onBack={onBack}
          continueType="submit"
          formId="patient-registration-consent-form"
          continueLabel={continueLabel}
          continueReady={continueReady}
          continueLoading={continueLoading}
          onContinueBlocked={() => setShowHints(true)}
        />
      }
    >
      <form
        id="patient-registration-consent-form"
        noValidate
        onSubmit={handleSubmit}
        className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto no-scrollbar"
      >
        {showHints && registrationValidationMessages.length > 0 ? (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <p className="font-semibold">Cadastro incompleto. Volte e corrija:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
              {registrationValidationMessages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Resumo do cadastro
          </p>
          <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {summaryItems.map((item) => (
              <div key={item.label}>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                  {item.label}
                </dt>
                <dd className="text-sm text-gray-800">{item.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Registro do operador
          </p>
          <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                Operador
              </dt>
              <dd className="text-sm text-gray-800">{consent?.operatorName || operator.operatorName}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                Unidade de cadastro
              </dt>
              <dd className="text-sm text-gray-800">
                {consent?.registrationUnitName || operator.registrationUnitName}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                Data e hora
              </dt>
              <dd className="text-sm text-gray-800">
                {formatConsentTimestamp(consent?.registeredAt ?? new Date().toISOString())}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Termos e autorizações
          </p>
          {termsLoadError ? (
            <p className="mt-2 text-xs text-amber-700">{termsLoadError}</p>
          ) : null}
          {isTermsLoading ? (
            <p className="mt-2 text-xs text-gray-500">Carregando termos…</p>
          ) : null}
          <div className="mt-3 space-y-3">
            {consentTermItems.map((item) => {
              const label =
                getTerm(item.key)?.title ?? patientRegistrationConsentTermLabels[item.key]
              const isChecked = Boolean(consent?.[item.key])
              const showError = showHints && item.required && !isChecked

              return (
                <div key={item.key} className="flex items-start gap-2">
                  <input
                    id={`consent-${item.key}`}
                    type="checkbox"
                    checked={isChecked}
                    onChange={(event) => patchConsent({ [item.key]: event.target.checked })}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
                  />
                  <div className="min-w-0 flex-1 text-sm">
                    <button
                      type="button"
                      onClick={() => openTermDrawer(item.key)}
                      className={`text-left font-medium underline decoration-[var(--brand-primary)]/40 underline-offset-2 transition hover:text-[var(--brand-primary)] hover:decoration-[var(--brand-primary)] ${
                        showError ? 'text-red-700' : 'text-[var(--brand-primary)]'
                      }`}
                    >
                      {label}
                    </button>
                    <span className={showError ? 'text-red-700' : 'text-gray-700'}> *</span>
                  </div>
                </div>
              )
            })}
          </div>
          {showHints && !isPatientRegistrationConsentReady(consent) ? (
            <p className="mt-3 text-xs text-red-600">
              Marque todas as confirmações obrigatórias para concluir o cadastro.
            </p>
          ) : null}
          {showHints &&
          isPatientRegistrationConsentReady(consent) &&
          registrationValidationMessages.length > 0 ? (
            <p className="mt-3 text-xs text-red-600">
              Complete os dados do cadastro antes de concluir.
            </p>
          ) : null}
        </section>
      </form>

      <PatientRegistrationConsentTermDrawer
        open={Boolean(activeTermKey)}
        closing={termDrawerClosing}
        term={activeTerm}
        onClose={closeTermDrawer}
        onTransitionEnd={handleTermDrawerTransitionEnd}
      />
    </AttendanceStepShell>
  )
}
