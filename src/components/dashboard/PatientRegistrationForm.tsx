import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  ageGroupLabels,
  type PatientAgeGroup,
  type PatientRegistration,
} from '../../data/unitDashboardMock'
import { CustomSelect } from '../ui/CustomSelect'
import { cpfDigits, isValidCpf } from '../../utils/cpf'
import { maskCpf, maskPhone } from '../../utils/masks'
import { AttendanceFieldHighlight } from './AttendanceFieldHighlight'
import { AttendanceStepFooter } from './AttendanceStepFooter'
import { AttendanceStepShell } from './AttendanceStepShell'
import {
  getRegistrationMissingFields,
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
  onChange: (data: PatientRegistration) => void
  onSubmit: () => void
  onBack: () => void
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
  onChange,
  onSubmit,
  onBack,
}: PatientRegistrationFormProps) {
  const [cpfTouched, setCpfTouched] = useState(false)
  const [guardianCpfTouched, setGuardianCpfTouched] = useState(false)
  const [showHints, setShowHints] = useState(false)

  const missingFields = useMemo(
    () => getRegistrationMissingFields(data, ageGroup, cpfLocked),
    [data, ageGroup, cpfLocked],
  )
  const continueReady = isRegistrationStepReady(data, ageGroup, cpfLocked)
  const highlight = (field: RegistrationFieldKey) => showHints && missingFields.includes(field)

  const showGuardian = ageGroup === 'minor' || ageGroup === 'elderly'
  const guardianRequired = ageGroup === 'minor'

  const cpfDigitsCount = cpfDigits(data.cpf).length
  const showCpfError =
    !cpfLocked && cpfTouched && cpfDigitsCount > 0 && !isValidCpf(data.cpf)
  const cpfErrorMessage =
    cpfDigitsCount < 11
      ? 'Informe um CPF completo com 11 dígitos.'
      : 'CPF inválido. Verifique os números digitados.'

  const guardianCpfDigits = cpfDigits(data.guardianCpf).length
  const showGuardianCpfError =
    guardianCpfTouched &&
    guardianCpfDigits > 0 &&
    !isValidCpf(data.guardianCpf)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!cpfLocked) setCpfTouched(true)
    if (guardianRequired || (ageGroup === 'elderly' && data.guardianCpf.trim())) {
      setGuardianCpfTouched(true)
    }
    if (!continueReady) {
      setShowHints(true)
      return
    }
    onSubmit()
  }

  function handleContinueBlocked() {
    if (!cpfLocked) setCpfTouched(true)
    if (guardianRequired || (ageGroup === 'elderly' && data.guardianCpf.trim())) {
      setGuardianCpfTouched(true)
    }
    setShowHints(true)
  }

  function patch(field: keyof PatientRegistration, value: string) {
    onChange({ ...data, [field]: value })
  }

  return (
    <AttendanceStepShell
      title="Cadastro do paciente"
      description={`Paciente: ${ageGroupLabels[ageGroup]}. Preencha os dados para continuar.`}
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

          <AttendanceFieldHighlight highlight={highlight('birthDate')} className="block">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-gray-700">
                Data de nascimento
              </span>
              <input
                type="date"
                value={data.birthDate}
                onChange={(e) => patch('birthDate', e.target.value)}
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
            <>
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {ageGroup === 'minor' ? 'Responsável legal' : 'Cuidador (opcional)'}
                </p>
              </div>

              <AttendanceFieldHighlight
                highlight={highlight('guardianName')}
                className="block sm:col-span-2"
              >
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-gray-700">
                    Nome do responsável
                  </span>
                  <input
                    type="text"
                    value={data.guardianName}
                    onChange={(e) => patch('guardianName', e.target.value)}
                    placeholder="Nome completo do responsável"
                    className={inputClass}
                  />
                </label>
              </AttendanceFieldHighlight>

              <AttendanceFieldHighlight
                highlight={highlight('guardianCpf')}
                className="block sm:col-span-2"
              >
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-gray-700">
                    CPF do responsável
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={data.guardianCpf}
                    onChange={(e) => patch('guardianCpf', maskCpf(e.target.value))}
                    onBlur={() => setGuardianCpfTouched(true)}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className={showGuardianCpfError ? inputErrorClass : inputClass}
                  />
                  {showGuardianCpfError ? (
                    <p className="mt-1.5 text-xs text-red-600">
                      CPF do responsável inválido.
                    </p>
                  ) : null}
                </label>
              </AttendanceFieldHighlight>
            </>
          ) : null}
        </div>
      </form>
    </AttendanceStepShell>
  )
}
