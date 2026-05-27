import { useMemo, useState, type FormEvent } from 'react'
import type { AdminProfessionalCategory } from '../../../../data/adminMedicosMock'
import { CustomSelect } from '../../../ui/CustomSelect'
import { AttendanceFieldHighlight } from '../../../dashboard/AttendanceFieldHighlight'
import { AttendanceStepFooter } from '../../../dashboard/AttendanceStepFooter'
import { AttendanceStepShell } from '../../../dashboard/AttendanceStepShell'
import {
  brazilianStates,
  getCouncilLabel,
  getSpecialtyOptionsForProfession,
  isProfileStepReady,
  professionalCategoryOptions,
  type AdminProfessionalCreateDraft,
} from './adminProfessionalCreateTypes'

type AdminProfessionalProfileStepProps = {
  draft: AdminProfessionalCreateDraft
  onChange: (draft: AdminProfessionalCreateDraft) => void
  onSubmit: () => void
  onBack: () => void
}

const inputClass =
  'w-full rounded-xl border border-gray-200/80 bg-white py-3 px-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15'

type ProfileFieldKey = 'fullName' | 'specialty' | 'councilNumber' | 'councilUf'

function getProfileMissingFields(draft: AdminProfessionalCreateDraft): ProfileFieldKey[] {
  const missing: ProfileFieldKey[] = []
  if (draft.fullName.trim().length < 3) missing.push('fullName')
  if (!draft.specialty.trim()) missing.push('specialty')
  if (draft.councilNumber.replace(/\D/g, '').length < 3) missing.push('councilNumber')
  if (draft.councilUf.trim().length !== 2) missing.push('councilUf')
  return missing
}

export function AdminProfessionalProfileStep({
  draft,
  onChange,
  onSubmit,
  onBack,
}: AdminProfessionalProfileStepProps) {
  const [showHints, setShowHints] = useState(false)

  const missingFields = useMemo(() => getProfileMissingFields(draft), [draft])
  const continueReady = isProfileStepReady(draft)
  const councilLabel = getCouncilLabel(draft.profession)
  const specialtyOptions = useMemo(
    () => getSpecialtyOptionsForProfession(draft.profession),
    [draft.profession],
  )

  function patch<K extends keyof AdminProfessionalCreateDraft>(
    field: K,
    value: AdminProfessionalCreateDraft[K],
  ) {
    onChange({ ...draft, [field]: value })
  }

  function handleProfessionChange(profession: AdminProfessionalCategory) {
    const nextSpecialties = getSpecialtyOptionsForProfession(profession)
    const keepSpecialty = nextSpecialties.some((item) => item.name === draft.specialty)
    onChange({
      ...draft,
      profession,
      specialty: keepSpecialty ? draft.specialty : '',
    })
  }

  function highlight(field: ProfileFieldKey) {
    return showHints && missingFields.includes(field)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!continueReady) {
      setShowHints(true)
      return
    }
    onSubmit()
  }

  return (
    <AttendanceStepShell
      title="Dados do profissional"
      description="Informe nome, profissão, especialidade e registro no conselho de classe."
      footer={
        <AttendanceStepFooter
          onBack={onBack}
          onContinue={() => {
            if (!continueReady) {
              setShowHints(true)
              return
            }
            onSubmit()
          }}
          continueReady={continueReady}
          onContinueBlocked={() => setShowHints(true)}
        />
      }
    >
      <form
        id="admin-professional-profile-form"
        noValidate
        onSubmit={handleSubmit}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto no-scrollbar"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <AttendanceFieldHighlight highlight={highlight('fullName')} className="block sm:col-span-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-gray-700">Nome completo</span>
              <input
                type="text"
                value={draft.fullName}
                onChange={(e) => patch('fullName', e.target.value)}
                placeholder="Nome e sobrenome"
                autoComplete="name"
                className={inputClass}
              />
            </label>
          </AttendanceFieldHighlight>

          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-xs font-medium text-gray-700">Profissão</span>
            <CustomSelect
              value={draft.profession}
              onChange={(value) => handleProfessionChange(value as AdminProfessionalCategory)}
              options={professionalCategoryOptions.map((item) => ({
                value: item.value,
                label: item.label,
              }))}
              placeholder="Selecione"
            />
          </label>

          <AttendanceFieldHighlight highlight={highlight('specialty')} className="block sm:col-span-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-gray-700">Especialidade</span>
              <CustomSelect
                value={draft.specialty}
                onChange={(value) => patch('specialty', value)}
                options={[
                  { value: '', label: 'Selecione a especialidade' },
                  ...specialtyOptions.map((item) => ({ value: item.name, label: item.name })),
                ]}
                placeholder="Especialidade"
              />
            </label>
          </AttendanceFieldHighlight>

          <AttendanceFieldHighlight highlight={highlight('councilNumber')} className="block">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-gray-700">
                Número no {councilLabel}
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={draft.councilNumber}
                onChange={(e) => patch('councilNumber', e.target.value.replace(/[^\d./-]/g, ''))}
                placeholder={`Ex.: 123456`}
                className={inputClass}
              />
            </label>
          </AttendanceFieldHighlight>

          <AttendanceFieldHighlight highlight={highlight('councilUf')} className="block">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-gray-700">UF do conselho</span>
              <CustomSelect
                value={draft.councilUf}
                onChange={(value) => patch('councilUf', value)}
                options={brazilianStates.map((uf) => ({ value: uf, label: uf }))}
                placeholder="UF"
                className="py-2.5 px-2 text-center text-sm"
              />
            </label>
          </AttendanceFieldHighlight>
        </div>
      </form>
    </AttendanceStepShell>
  )
}
