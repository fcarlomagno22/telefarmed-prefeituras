import { useState } from 'react'
import {
  ageGroupLabels,
  type PatientAgeGroup,
} from '../../data/unitDashboardMock'
import { AttendanceFieldHighlight } from './AttendanceFieldHighlight'
import { AttendanceStepFooter } from './AttendanceStepFooter'
import { AttendanceStepShell } from './AttendanceStepShell'

const ageGroups: PatientAgeGroup[] = ['adult', 'minor', 'elderly']

const ageGroupHints: Record<PatientAgeGroup, string> = {
  adult: 'Paciente com 18 anos ou mais.',
  minor: 'Será necessário informar o responsável legal.',
  elderly: 'Dados do cuidador são opcionais, se houver.',
}

type AgeGroupSelectionStepProps = {
  selected: PatientAgeGroup | null
  onSelect: (group: PatientAgeGroup) => void
  onBack: () => void
  onContinue: () => void
}

export function AgeGroupSelectionStep({
  selected,
  onSelect,
  onBack,
  onContinue,
}: AgeGroupSelectionStepProps) {
  const [showHints, setShowHints] = useState(false)
  const canContinue = selected !== null

  return (
    <AttendanceStepShell
      title="Faixa etária do paciente"
      description="Escolha a categoria que melhor descreve o paciente."
      footer={
        <AttendanceStepFooter
          onBack={onBack}
          onContinue={onContinue}
          continueReady={canContinue}
          onContinueBlocked={() => setShowHints(true)}
        />
      }
    >
      <AttendanceFieldHighlight highlight={showHints && !canContinue} className="p-1">
      <ul className="space-y-3">
        {ageGroups.map((group) => {
          const isSelected = selected === group
          return (
            <li key={group}>
              <button
                type="button"
                onClick={() => onSelect(group)}
                className={`w-full rounded-xl border px-4 py-4 text-left transition ${
                  isSelected
                    ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)] ring-2 ring-[var(--brand-primary)]/20'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span
                  className={`block text-sm font-semibold ${isSelected ? 'text-[var(--brand-primary)]' : 'text-gray-900'}`}
                >
                  {ageGroupLabels[group]}
                </span>
                <span className="mt-1 block text-xs text-gray-500">
                  {ageGroupHints[group]}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      </AttendanceFieldHighlight>
    </AttendanceStepShell>
  )
}
