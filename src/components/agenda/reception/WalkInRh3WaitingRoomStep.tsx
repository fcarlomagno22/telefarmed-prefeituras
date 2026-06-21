import { WaitingRoomPanel } from '../../dashboard/WaitingRoomPanel'
import { AttendanceStepShell } from '../../dashboard/AttendanceStepShell'
import { AttendanceStepFooter } from '../../dashboard/AttendanceStepFooter'
import { getPatientPreferredName, type PatientRegistration } from '../../../types/attendance'

type WalkInRh3WaitingRoomStepProps = {
  registration: PatientRegistration
  specialtyName: string
  scheduledTimeLabel?: string
  mode: 'immediate' | 'scheduled'
  loading?: boolean
  accessError?: string | null
  onAccessWaitingRoom: () => void
  onCancel: () => void
}

export function WalkInRh3WaitingRoomStep({
  registration,
  specialtyName,
  scheduledTimeLabel,
  mode,
  loading = false,
  accessError = null,
  onAccessWaitingRoom,
  onCancel,
}: WalkInRh3WaitingRoomStepProps) {
  const patientName = getPatientPreferredName(registration)

  return (
    <AttendanceStepShell
      embedded
      fillAvailable
      hideScrollbar
      title="Sala de espera terceirizada"
      description={
        mode === 'immediate'
          ? `${specialtyName} — atendimento imediato 24/7. A consulta começa quando o paciente acessar o link.`
          : `${specialtyName}${scheduledTimeLabel ? ` · ${scheduledTimeLabel}` : ''}. A consulta começa quando o paciente acessar o link.`
      }
      footer={
        <AttendanceStepFooter
          onBack={onCancel}
          onContinue={onCancel}
          continueLabel="Fechar"
          continueReady
        />
      }
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mb-4 rounded-xl border border-violet-200 bg-violet-50/70 px-4 py-3 text-sm text-violet-950">
          <p className="font-semibold">{patientName}</p>
          <p className="mt-1 text-violet-900/90">
            Clicar no link abaixo para iniciar sua consulta.
            </p>
        </div>

        <WaitingRoomPanel
          loading={loading}
          error={accessError}
          onAccessWaitingRoom={onAccessWaitingRoom}
          onCancel={onCancel}
        />
      </div>
    </AttendanceStepShell>
  )
}
