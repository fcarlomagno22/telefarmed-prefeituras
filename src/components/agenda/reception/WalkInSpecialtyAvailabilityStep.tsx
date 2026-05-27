import { AlertCircle, CalendarCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { countSpecialtyAvailableSlotsOnDay } from '../../../data/scheduleDoctorsMock'
import { specialties } from '../../../data/specialties'
import { formatAgendaDayLabel } from '../../../utils/agendaDate'
import { AttendanceFieldHighlight } from '../../dashboard/AttendanceFieldHighlight'
import { AttendanceStepFooter } from '../../dashboard/AttendanceStepFooter'
import { AttendanceStepShell } from '../../dashboard/AttendanceStepShell'

type WalkInSpecialtyAvailabilityStepProps = {
  selectedDate: Date
  selectedId: string
  onSelect: (id: string, name: string) => void
  onBack: () => void
  onContinue: () => void
}

export function WalkInSpecialtyAvailabilityStep({
  selectedDate,
  selectedId,
  onSelect,
  onBack,
  onContinue,
}: WalkInSpecialtyAvailabilityStepProps) {
  const [search, setSearch] = useState('')
  const [showHints, setShowHints] = useState(false)

  const availabilityById = useMemo(() => {
    const map = new Map<string, number>()
    for (const specialty of specialties) {
      if (!specialty.available) {
        map.set(specialty.id, 0)
        continue
      }
      map.set(specialty.id, countSpecialtyAvailableSlotsOnDay(specialty.id, selectedDate))
    }
    return map
  }, [selectedDate])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return specialties.filter((item) => {
      const matchesSearch = !query || item.name.toLowerCase().includes(query)
      const slots = availabilityById.get(item.id) ?? 0
      return matchesSearch && item.available && slots > 0
    })
  }, [availabilityById, search])

  const selectedSlots = selectedId ? availabilityById.get(selectedId) ?? 0 : 0
  const canContinue = selectedSlots > 0
  const dayLabel = formatAgendaDayLabel(selectedDate)

  return (
    <AttendanceStepShell
      hideScrollbar
      title="Disponibilidade do dia"
      description="Paciente sem agendamento: escolha a especialidade com vaga de encaixe para hoje."
      footer={
        <AttendanceStepFooter
          onBack={onBack}
          onContinue={onContinue}
          continueReady={canContinue}
          onContinueBlocked={() => setShowHints(true)}
        />
      }
    >
      <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-sky-200/90 bg-sky-50/90 px-3.5 py-3">
        <CalendarCheck
          className="mt-0.5 h-4 w-4 shrink-0 text-sky-700"
          strokeWidth={2}
          aria-hidden
        />
        <p className="text-xs leading-relaxed text-sky-900/90">
          <strong className="font-semibold">{dayLabel}</strong> — somente especialidades com
          médico em plantão e horário livre aparecem abaixo.
        </p>
      </div>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar especialidade..."
        className="mb-3 w-full shrink-0 rounded-lg border border-gray-200/80 bg-white py-2 px-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15"
      />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-10 text-center">
          <AlertCircle className="h-8 w-8 text-gray-400" strokeWidth={1.75} />
          <p className="text-sm font-medium text-gray-700">
            Nenhuma especialidade com vaga de encaixe hoje
          </p>
          <p className="text-xs text-gray-500">
            Tente outro dia na agenda ou oriente o paciente a agendar consulta futura.
          </p>
        </div>
      ) : (
        <AttendanceFieldHighlight highlight={showHints && !canContinue} className="p-1">
          <ul className="grid grid-cols-2 gap-2 pb-1 sm:grid-cols-3">
            {filtered.map((specialty) => {
              const slots = availabilityById.get(specialty.id) ?? 0
              const isSelected = specialty.id === selectedId

              return (
                <li key={specialty.id} className="min-w-0">
                  <button
                    type="button"
                    onClick={() => onSelect(specialty.id, specialty.name)}
                    className={`flex w-full flex-col items-center justify-center rounded-lg border px-2 py-2.5 text-center transition ${
                      isSelected
                        ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)] text-[var(--brand-primary)] ring-2 ring-[var(--brand-primary)]/20'
                        : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-[10px] font-semibold leading-tight sm:text-[11px]">
                      {specialty.name}
                    </span>
                    <span className="mt-1 text-[9px] font-medium text-emerald-700">
                      {slots} {slots === 1 ? 'vaga' : 'vagas'} hoje
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </AttendanceFieldHighlight>
      )}

      {selectedId && selectedSlots > 0 ? (
        <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-100">
          Há capacidade para encaixe presencial nesta especialidade ({selectedSlots}{' '}
          {selectedSlots === 1 ? 'horário disponível' : 'horários disponíveis'}).
        </p>
      ) : null}
    </AttendanceStepShell>
  )
}
