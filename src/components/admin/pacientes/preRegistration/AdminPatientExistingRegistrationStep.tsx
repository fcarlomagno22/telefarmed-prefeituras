import { UserCheck } from 'lucide-react'
import type { AdminMunicipalPatient } from '../../../../data/adminPacientesMock'
import { getPatientPreferredName, type PatientRegistration } from '../../../../data/unitDashboardMock'
import { AttendanceStepShell } from '../../../dashboard/AttendanceStepShell'

type AdminPatientExistingRegistrationStepProps = {
  registration: PatientRegistration
  existingPatient: AdminMunicipalPatient | null
  onKeepRegistration: () => void
  onEditRegistration: () => void
  onBack: () => void
}

export function AdminPatientExistingRegistrationStep({
  registration,
  existingPatient,
  onKeepRegistration,
  onEditRegistration,
  onBack,
}: AdminPatientExistingRegistrationStepProps) {
  const patientName = getPatientPreferredName(registration) || 'Paciente'
  const linkedMunicipality = existingPatient?.municipality
  const linkedEntity = existingPatient?.contractingEntityRazaoSocial

  return (
    <AttendanceStepShell
      title="Cadastro já existente"
      description="Este CPF já possui cadastro ativo na plataforma."
      footer={
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onKeepRegistration}
              className="w-full rounded-xl bg-[var(--brand-primary)] px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(255,107,0,0.35)] transition hover:bg-[var(--brand-primary-hover)]"
            >
              Manter cadastro
            </button>
            <button
              type="button"
              onClick={onEditRegistration}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Alterar cadastro
            </button>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-[var(--brand-primary)] transition hover:bg-gray-50"
          >
            Voltar ao CPF
          </button>
        </div>
      }
    >
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 ring-1 ring-emerald-100">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <UserCheck className="h-6 w-6" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-emerald-900">
              {patientName} já possui cadastro ativo
            </p>
            <p className="mt-2 text-sm leading-relaxed text-emerald-800/90">
              CPF <strong className="font-semibold">{registration.cpf}</strong>
              {linkedEntity ? (
                <>
                  {' '}
                  vinculado a <strong className="font-semibold">{linkedEntity}</strong>
                </>
              ) : null}
              {linkedMunicipality ? (
                <>
                  {' '}
                  ({linkedMunicipality})
                </>
              ) : null}
              .
            </p>
            <p className="mt-3 text-sm text-emerald-800/80">
              Deseja manter o cadastro atual ou alterar os dados cadastrais?
            </p>
          </div>
        </div>
      </div>
    </AttendanceStepShell>
  )
}
