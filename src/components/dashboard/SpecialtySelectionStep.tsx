import { useMemo, useState } from 'react'
import { getSpecialtyById, specialties } from '../../data/specialties'
import { AttendanceFieldHighlight } from './AttendanceFieldHighlight'
import { AttendanceStepFooter } from './AttendanceStepFooter'
import { AttendanceStepShell } from './AttendanceStepShell'

type SpecialtySelectionStepProps = {
  selectedId: string
  onSelect: (id: string, name: string) => void
  onBack: () => void
  onContinue: () => void
}

export function SpecialtySelectionStep({
  selectedId,
  onSelect,
  onBack,
  onContinue,
}: SpecialtySelectionStepProps) {
  const [search, setSearch] = useState('')
  const [showHints, setShowHints] = useState(false)

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return specialties
    return specialties.filter((item) => item.name.toLowerCase().includes(query))
  }, [search])

  const selectedSpecialty = selectedId ? getSpecialtyById(selectedId) : undefined
  const canContinue = Boolean(selectedSpecialty?.available)

  return (
    <AttendanceStepShell
      hideScrollbar
      title="Especialidade"
      description="Selecione uma especialidade disponível para este atendimento."
      footer={
        <AttendanceStepFooter
          onBack={onBack}
          onContinue={onContinue}
          continueReady={canContinue}
          onContinueBlocked={() => setShowHints(true)}
        />
      }
    >
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar especialidade..."
        className="mb-3 w-full shrink-0 rounded-lg border border-gray-200/80 bg-white py-2 px-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15"
      />

      <AttendanceFieldHighlight highlight={showHints && !canContinue} className="p-1">
      <ul className="grid grid-cols-3 gap-1.5 pb-1">
        {filtered.map((specialty) => {
          const isSelected = specialty.available && specialty.id === selectedId
          const isUnavailable = !specialty.available

          return (
            <li key={specialty.id} className="min-w-0">
              <button
                type="button"
                disabled={isUnavailable}
                title={isUnavailable ? `${specialty.name} — Indisponível` : specialty.name}
                onClick={() => {
                  if (!specialty.available) return
                  onSelect(specialty.id, specialty.name)
                }}
                className={`relative flex h-[3rem] w-full items-center justify-center rounded-lg border px-1.5 py-1 text-center text-[10px] font-medium leading-tight transition sm:text-[11px] ${
                  isUnavailable
                    ? 'cursor-not-allowed border-gray-200/80 bg-gray-100 text-gray-400'
                    : isSelected
                      ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)] text-[var(--brand-primary)] ring-2 ring-[var(--brand-primary)]/20'
                      : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="line-clamp-3 px-0.5">{specialty.name}</span>
              </button>
            </li>
          )
        })}
        {filtered.length === 0 ? (
          <li className="col-span-3 py-4 text-center text-sm text-gray-500">
            Nenhuma especialidade encontrada.
          </li>
        ) : null}
      </ul>
      </AttendanceFieldHighlight>
    </AttendanceStepShell>
  )
}
