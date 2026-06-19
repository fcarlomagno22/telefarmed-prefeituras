import type { PatientAgeGroup, PatientRegistration } from '../../types/attendance'
import { cpfDigits, isValidCpf } from '../../utils/cpf'
import { maskCpf, maskPhone } from '../../utils/masks'
import { guardianRelationshipOptions } from '../../utils/patientRegistrationOptions'
import {
  resolvedGuardianCpf,
  resolvedGuardianPhone,
} from '../../utils/patientRegistrationValidation'
import { CustomSelect } from '../ui/CustomSelect'
import { AttendanceFieldHighlight } from './AttendanceFieldHighlight'
import type { RegistrationFieldKey } from './registrationStepValidation'
import { getRegistrationFieldErrorMessage } from './registrationStepValidation'

type PatientGuardianFieldsSectionProps = {
  data: PatientRegistration
  ageGroup: PatientAgeGroup
  onChange: (data: PatientRegistration) => void
  showHints: boolean
  missingFields: RegistrationFieldKey[]
  guardianCpfTouched: boolean
  onGuardianCpfBlur: () => void
  inputClass: string
  inputErrorClass: string
}

export function PatientGuardianFieldsSection({
  data,
  ageGroup,
  onChange,
  showHints,
  missingFields,
  guardianCpfTouched,
  onGuardianCpfBlur,
  inputClass,
  inputErrorClass,
}: PatientGuardianFieldsSectionProps) {
  const highlight = (field: RegistrationFieldKey) => showHints && missingFields.includes(field)

  function patch(field: keyof PatientRegistration, value: string | boolean) {
    onChange({ ...data, [field]: value })
  }

  const guardianCpfValue = resolvedGuardianCpf(data)
  const guardianCpfDigits = cpfDigits(guardianCpfValue).length
  const showGuardianCpfError =
    (guardianCpfTouched || showHints) &&
    (guardianCpfDigits > 0 || missingFields.includes('guardianCpf')) &&
    !isValidCpf(guardianCpfValue)
  const guardianCpfErrorMessage = getRegistrationFieldErrorMessage(
    'guardianCpf',
    data,
    ageGroup,
    true,
  )

  return (
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
            className={
              highlight('guardianName') || (showHints && missingFields.includes('guardianName'))
                ? inputErrorClass
                : inputClass
            }
          />
          {showHints && missingFields.includes('guardianName') ? (
            <p className="mt-1.5 text-xs text-red-600">
              {getRegistrationFieldErrorMessage('guardianName', data, ageGroup, true)}
            </p>
          ) : null}
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
            onBlur={onGuardianCpfBlur}
            placeholder="000.000.000-00"
            maxLength={14}
            className={showGuardianCpfError ? inputErrorClass : inputClass}
          />
          {showGuardianCpfError && guardianCpfErrorMessage ? (
            <p className="mt-1.5 text-xs text-red-600">{guardianCpfErrorMessage}</p>
          ) : null}
        </label>
      </AttendanceFieldHighlight>

      <AttendanceFieldHighlight highlight={highlight('guardianRelationship')} className="block">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-gray-700">
            Grau de parentesco
          </span>
          <CustomSelect
            value={data.guardianRelationship}
            onChange={(value) => patch('guardianRelationship', value)}
            options={guardianRelationshipOptions}
            placeholder="Selecione"
          />
          {showHints && missingFields.includes('guardianRelationship') ? (
            <p className="mt-1.5 text-xs text-red-600">
              {getRegistrationFieldErrorMessage('guardianRelationship', data, ageGroup, true)}
            </p>
          ) : null}
        </label>
      </AttendanceFieldHighlight>

      <AttendanceFieldHighlight highlight={highlight('guardianPhone')} className="block">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-gray-700">
            Telefone do responsável
          </span>
          <input
            type="tel"
            inputMode="tel"
            value={data.guardianPhone}
            onChange={(e) => patch('guardianPhone', maskPhone(e.target.value))}
            placeholder="(00) 00000-0000"
            maxLength={15}
            className={
              highlight('guardianPhone') || (showHints && missingFields.includes('guardianPhone'))
                ? inputErrorClass
                : inputClass
            }
          />
          {showHints && missingFields.includes('guardianPhone') ? (
            <p className="mt-1.5 text-xs text-red-600">
              {getRegistrationFieldErrorMessage('guardianPhone', data, ageGroup, true)}
            </p>
          ) : null}
        </label>
      </AttendanceFieldHighlight>

      <AttendanceFieldHighlight
        highlight={highlight('guardianAttendanceAuthorized')}
        className="block sm:col-span-2"
      >
        <label className="flex cursor-pointer items-start gap-2">
          <input
            type="checkbox"
            checked={data.guardianAttendanceAuthorized}
            onChange={(e) => patch('guardianAttendanceAuthorized', e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
          />
          <span className="text-xs text-gray-600">
            Declaro autorização/ciência do responsável pelo atendimento do paciente.
          </span>
        </label>
        {showHints && missingFields.includes('guardianAttendanceAuthorized') ? (
          <p className="mt-1.5 text-xs text-red-600">
            {getRegistrationFieldErrorMessage(
              'guardianAttendanceAuthorized',
              data,
              ageGroup,
              true,
            )}
          </p>
        ) : null}
      </AttendanceFieldHighlight>
    </>
  )
}
