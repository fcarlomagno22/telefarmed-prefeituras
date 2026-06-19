import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  ageGroupLabels,
  type PatientAgeGroup,
  type PatientRegistration,
} from '../../types/attendance'
import { CustomSelect } from '../ui/CustomSelect'
import { formatDatePtBr, parseBirthDateInput } from '../../utils/calendar'
import { cpfDigits, isValidCpf } from '../../utils/cpf'
import { maskCns } from '../../utils/cns'
import { maskBirthDate, maskCpf, maskPhone } from '../../utils/masks'
import {
  patientNationalityOptions,
  patientRaceColorOptions,
} from '../../utils/patientRegistrationOptions'
import { patientHasGuardianSection } from '../../utils/patientRegistrationConsent'
import { requiresGuardianValidation } from '../../utils/patientRegistrationValidation'
import { AttendanceFieldHighlight } from './AttendanceFieldHighlight'
import { AttendanceStepFooter } from './AttendanceStepFooter'
import { AttendanceStepShell } from './AttendanceStepShell'
import { PatientGuardianFieldsSection } from './PatientGuardianFieldsSection'
import { PatientSocialNameFields } from './PatientSocialNameFields'
import {
  getRegistrationMissingFields,
  getRegistrationFieldErrorMessage,
  isRegistrationStepReady,
  type RegistrationFieldKey,
} from './registrationStepValidation'

const genderOptions = [
  { value: '', label: 'Selecione' },
  { value: 'feminino', label: 'Feminino' },
  { value: 'masculino', label: 'Masculino' },
  { value: 'outro', label: 'Outro' },
  { value: 'nao_informar', label: 'Prefiro não informar' },
]

type PatientRegistrationFormProps = {
  data: PatientRegistration
  ageGroup: PatientAgeGroup
  cpfLocked?: boolean
  description?: string
  onChange: (data: PatientRegistration) => void
  onSubmit: () => void
  onBack: () => void
  embedded?: boolean
}

const inputClass =
  'w-full rounded-xl border border-gray-200/80 bg-white py-3 px-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15'

const inputErrorClass =
  'w-full rounded-xl border border-red-300 bg-white py-3 px-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-red-400 focus:ring-2 focus:ring-red-200/60'

const inputDisabledClass =
  'w-full cursor-not-allowed rounded-xl border border-gray-200/80 bg-gray-100 py-3 px-4 text-sm text-gray-600'

export function PatientRegistrationForm({
  data,
  ageGroup,
  cpfLocked = false,
  description,
  onChange,
  onSubmit,
  onBack,
  embedded = false,
}: PatientRegistrationFormProps) {
  const [cpfTouched, setCpfTouched] = useState(false)
  const [guardianCpfTouched, setGuardianCpfTouched] = useState(false)
  const [cnsTouched, setCnsTouched] = useState(false)
  const [showHints, setShowHints] = useState(false)
  const [birthDateDisplay, setBirthDateDisplay] = useState(() =>
    data.birthDate ? formatDatePtBr(data.birthDate) : '',
  )

  useEffect(() => {
    setBirthDateDisplay(data.birthDate ? formatDatePtBr(data.birthDate) : '')
  }, [data.birthDate])

  const missingFields = useMemo(
    () => getRegistrationMissingFields(data, ageGroup, cpfLocked),
    [data, ageGroup, cpfLocked],
  )
  const continueReady = isRegistrationStepReady(data, ageGroup, cpfLocked)
  const highlight = (field: RegistrationFieldKey) => showHints && missingFields.includes(field)

  const showGuardian = patientHasGuardianSection(ageGroup, data)

  const cpfDigitsCount = cpfDigits(data.cpf).length
  const showCpfError =
    !cpfLocked && cpfTouched && cpfDigitsCount > 0 && !isValidCpf(data.cpf)
  const cpfErrorMessage =
    cpfDigitsCount < 11
      ? 'Informe um CPF completo com 11 dígitos.'
      : 'CPF inválido. Verifique os números digitados.'

  const showCnsError =
    !data.cnsPendente &&
    (cnsTouched || showHints) &&
    missingFields.includes('cns')
  const cnsErrorMessage =
    getRegistrationFieldErrorMessage('cns', data, ageGroup, cpfLocked) ??
    'CNS/Cartão SUS inválido. Verifique os números digitados.'

  function markValidationTouched() {
    if (!cpfLocked) setCpfTouched(true)
    if (requiresGuardianValidation(ageGroup, data)) setGuardianCpfTouched(true)
    if (!data.cnsPendente) setCnsTouched(true)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    markValidationTouched()
    if (!continueReady) {
      setShowHints(true)
      return
    }
    onSubmit()
  }

  function handleContinueBlocked() {
    markValidationTouched()
    setShowHints(true)
  }

  function patch(field: keyof PatientRegistration, value: string | boolean) {
    onChange({ ...data, [field]: value })
  }

  function handleCnsPendenteChange(checked: boolean) {
    onChange({
      ...data,
      cnsPendente: checked,
      cns: checked ? '' : data.cns,
    })
    if (checked) setCnsTouched(false)
  }

  return (
    <AttendanceStepShell
      embedded={embedded}
      title="Cadastro do paciente"
      description={
        description ??
        `Paciente: ${ageGroupLabels[ageGroup]}. Preencha os dados para continuar.`
      }
      footer={
        <AttendanceStepFooter
          onBack={onBack}
          continueType="submit"
          formId="patient-registration-form"
          continueReady={continueReady}
          onContinueBlocked={handleContinueBlocked}
        />
      }
    >
      <form
        id="patient-registration-form"
        noValidate
        onSubmit={handleSubmit}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto no-scrollbar"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <AttendanceFieldHighlight highlight={highlight('fullName')} className="block sm:col-span-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-gray-700">
                Nome completo
              </span>
              <input
                type="text"
                value={data.fullName}
                onChange={(e) => patch('fullName', e.target.value)}
                placeholder="Nome do paciente"
                className={inputClass}
              />
            </label>
          </AttendanceFieldHighlight>

          <div className="sm:col-span-2">
            <PatientSocialNameFields
              data={data}
              onChange={onChange}
              inputClass={inputClass}
            />
          </div>

          <AttendanceFieldHighlight highlight={highlight('cpf')} className="block">
            <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-gray-700">CPF</span>
            <input
              type="text"
              inputMode="numeric"
              value={data.cpf}
              readOnly={cpfLocked}
              onChange={(e) => patch('cpf', maskCpf(e.target.value))}
              onBlur={() => setCpfTouched(true)}
              placeholder="000.000.000-00"
              maxLength={14}
              className={
                cpfLocked ? inputDisabledClass : showCpfError ? inputErrorClass : inputClass
              }
            />
            {showCpfError ? (
              <p className="mt-1.5 text-xs text-red-600">{cpfErrorMessage}</p>
            ) : null}
            </label>
          </AttendanceFieldHighlight>

          <AttendanceFieldHighlight highlight={highlight('cns')} className="block sm:col-span-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-gray-700">
                CNS / Cartão SUS
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={data.cns}
                disabled={data.cnsPendente}
                onChange={(e) => {
                  patch('cns', maskCns(e.target.value))
                  if (data.cnsPendente) patch('cnsPendente', false)
                }}
                onBlur={() => setCnsTouched(true)}
                placeholder="000 0000 0000 0000"
                maxLength={18}
                className={
                  data.cnsPendente
                    ? inputDisabledClass
                    : showCnsError || (showHints && missingFields.includes('cns'))
                      ? inputErrorClass
                      : inputClass
                }
              />
              {showCnsError ? (
                <p className="mt-1.5 text-xs text-red-600">{cnsErrorMessage}</p>
              ) : null}
            </label>
            <label className="mt-2 flex cursor-pointer items-start gap-2">
              <input
                type="checkbox"
                checked={data.cnsPendente}
                onChange={(e) => handleCnsPendenteChange(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
              />
              <span className="text-xs text-gray-600">
                Paciente não possui CNS — marcar como pendência
              </span>
            </label>
          </AttendanceFieldHighlight>

          <AttendanceFieldHighlight highlight={highlight('nationality')} className="block">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-gray-700">Nacionalidade</span>
              <CustomSelect
                value={data.nationality}
                onChange={(value) => patch('nationality', value)}
                options={patientNationalityOptions}
                placeholder="Selecione"
              />
            </label>
          </AttendanceFieldHighlight>

          <AttendanceFieldHighlight highlight={highlight('raceColor')} className="block">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-gray-700">Raça/cor</span>
              <CustomSelect
                value={data.raceColor}
                onChange={(value) => patch('raceColor', value)}
                options={patientRaceColorOptions}
                placeholder="Selecione"
              />
            </label>
          </AttendanceFieldHighlight>

          <AttendanceFieldHighlight highlight={highlight('birthDate')} className="block">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-gray-700">
                Data de nascimento
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={birthDateDisplay}
                onChange={(event) => {
                  const masked = maskBirthDate(event.target.value)
                  setBirthDateDisplay(masked)
                  patch('birthDate', parseBirthDateInput(masked))
                }}
                placeholder="dd/mm/aaaa"
                maxLength={10}
                className={inputClass}
              />
            </label>
          </AttendanceFieldHighlight>

          <AttendanceFieldHighlight highlight={highlight('gender')} className="block">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-gray-700">Gênero</span>
              <CustomSelect
                value={data.gender}
                onChange={(value) => patch('gender', value)}
                options={genderOptions}
                placeholder="Selecione"
              />
            </label>
          </AttendanceFieldHighlight>

          <AttendanceFieldHighlight highlight={highlight('phone')} className="block">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-gray-700">Celular</span>
              <input
                type="tel"
                inputMode="tel"
                value={data.phone}
                onChange={(e) => patch('phone', maskPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                maxLength={15}
                className={inputClass}
              />
            </label>
          </AttendanceFieldHighlight>

          <AttendanceFieldHighlight highlight={highlight('email')} className="block sm:col-span-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-gray-700">E-mail</span>
              <input
                type="email"
                value={data.email}
                onChange={(e) => patch('email', e.target.value)}
                placeholder="email@exemplo.com"
                className={inputClass}
              />
            </label>
          </AttendanceFieldHighlight>

          {showGuardian ? (
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
          ) : null}
        </div>
      </form>
    </AttendanceStepShell>
  )
}
