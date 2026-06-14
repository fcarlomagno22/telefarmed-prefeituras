import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import type { PatientLookupContext, PatientLookupResult } from '../../types/patientLookup'
import type { PatientRegistration } from '../../types/attendance'
import { isUbtPacientesApiError } from '../../lib/services/ubt/pacientes'
import { cpfDigits, isValidCpf } from '../../utils/cpf'
import { maskCpf } from '../../utils/masks'
import { AttendanceFieldHighlight } from './AttendanceFieldHighlight'
import { AttendanceStepFooter } from './AttendanceStepFooter'
import { AttendanceStepShell } from './AttendanceStepShell'

type CpfLookupStepProps = {
  cpf: string
  onChangeCpf: (cpf: string) => void
  onFound: (patient: PatientRegistration, meta?: { patientId?: string }) => void
  onFoundPendingFirstVisit?: (payload: {
    patient: PatientRegistration
    specialtyId: string
    specialtyName: string
    patientId?: string
  }) => void
  onNotFound: (cpf: string) => void
  onBack: () => void
  embedded?: boolean
  lookupByCpf: (cpf: string, context?: PatientLookupContext) => Promise<PatientLookupResult>
  lookupContext?: PatientLookupContext
}

const inputClass =
  'w-full rounded-xl border border-gray-200/80 bg-white py-3 px-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15'

const inputErrorClass =
  'w-full rounded-xl border border-red-300 bg-white py-3 px-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-red-400 focus:ring-2 focus:ring-red-200/60'

export function CpfLookupStep({
  cpf,
  onChangeCpf,
  onFound,
  onFoundPendingFirstVisit,
  onNotFound,
  onBack,
  embedded = false,
  lookupByCpf,
  lookupContext,
}: CpfLookupStepProps) {
  const [cpfTouched, setCpfTouched] = useState(false)
  const [showHints, setShowHints] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [lookupMessage, setLookupMessage] = useState<string | null>(null)

  const cpfValid = isValidCpf(cpf)
  const cpfDigitsCount = cpfDigits(cpf).length
  const cpfInvalid = cpfTouched && cpfDigitsCount > 0 && !isValidCpf(cpf)
  const cpfErrorMessage =
    cpfDigitsCount < 11
      ? 'Informe um CPF completo com 11 dígitos.'
      : 'CPF inválido. Verifique os números digitados.'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setCpfTouched(true)
    setLookupMessage(null)
    if (!cpfValid) {
      setShowHints(true)
      return
    }

    setIsSearching(true)
    try {
      const result = await lookupByCpf(cpf, lookupContext)
      if (result.status === 'found_pending_first_visit') {
        setLookupMessage(
          'Consulta agendada pela recepção. Complete o cadastro e tire a foto do paciente.',
        )
        if (onFoundPendingFirstVisit) {
          onFoundPendingFirstVisit({
            patient: result.patient,
            specialtyId: result.specialtyId,
            specialtyName: result.specialtyName,
            patientId: result.patientId,
          })
        } else {
          onFound(result.patient, { patientId: result.patientId })
        }
        return
      }
      if (result.status === 'found') {
        setLookupMessage('Cadastro encontrado. Confirme seus dados na próxima tela.')
        onFound(result.patient, { patientId: result.patientId })
        return
      }
      setLookupMessage('Paciente sem cadastro. Você será direcionado ao formulário.')
      onNotFound(cpf)
    } catch (error) {
      if (isUbtPacientesApiError(error) && error.code === 'CONTRACT_INACTIVE') {
        setLookupMessage(
          'Esta entidade ainda não possui contrato ativo. Cadastre o contrato no Admin → Clientes antes de recepcionar pacientes.',
        )
        return
      }
      if (isUbtPacientesApiError(error)) {
        setLookupMessage(error.message)
        return
      }
      setLookupMessage('Não foi possível consultar o CPF. Tente novamente.')
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <AttendanceStepShell
      embedded={embedded}
      title="Identificação do paciente"
      description="Informe o CPF para localizar o cadastro ou iniciar um novo."
      footer={
        <AttendanceStepFooter
          onBack={onBack}
          continueLabel={isSearching ? 'Consultando...' : 'Consultar cadastro'}
          continueReady={cpfValid}
          continueLoading={isSearching}
          continueType="submit"
          formId="cpf-lookup-form"
          onContinueBlocked={() => {
            setCpfTouched(true)
            setShowHints(true)
          }}
        />
      }
    >
      <form
        id="cpf-lookup-form"
        noValidate
        onSubmit={handleSubmit}
        className="flex min-h-0 flex-1 flex-col"
      >
        <AttendanceFieldHighlight highlight={showHints && !cpfValid} className="block">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-gray-700">CPF</span>
            <input
              type="text"
              required
              inputMode="numeric"
              value={cpf}
              onChange={(e) => {
                setLookupMessage(null)
                onChangeCpf(maskCpf(e.target.value))
              }}
              onBlur={() => setCpfTouched(true)}
              placeholder="000.000.000-00"
              maxLength={14}
              disabled={isSearching}
              className={cpfInvalid ? inputErrorClass : inputClass}
            />
            {cpfInvalid ? (
              <p className="mt-1.5 text-xs text-red-600">{cpfErrorMessage}</p>
            ) : null}
          </label>
        </AttendanceFieldHighlight>

        {isSearching ? (
          <p className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin text-[var(--brand-primary)]" />
            Consultando cadastro...
          </p>
        ) : null}

        {lookupMessage ? (
          <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-100">
            {lookupMessage}
          </p>
        ) : null}
      </form>
    </AttendanceStepShell>
  )
}
