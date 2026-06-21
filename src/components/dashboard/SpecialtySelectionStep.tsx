import { AlertCircle, CalendarCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { formatAgendaDayLabel } from '../../utils/agendaDate'
import { AttendanceFieldHighlight } from './AttendanceFieldHighlight'
import { AttendanceStepFooter } from './AttendanceStepFooter'
import { AttendanceStepShell } from './AttendanceStepShell'
import { SpecialtySelectionLoadingGrid } from './AttendanceStepLoadingPanel'

export type SpecialtyOption = {
  id: string
  name: string
  available: boolean
  availableSlots?: number
  origemAtendimento?: 'mp' | 'mt'
  rh3EspecialidadId?: number
  /** Rótulo secundário no encaixe presencial. */
  walkInBadge?: 'immediate' | 'schedule' | 'slots' | 'none'
}

type SpecialtySelectionStepProps = {
  selectedId: string
  onSelect: (id: string, name: string) => void
  onBack: () => void
  onContinue: () => void
  specialties: SpecialtyOption[]
  isLoading?: boolean
  loadError?: string | null
  onRetryLoad?: () => void
  description?: string
  emptyMessage?: string
  selectedDate?: Date
  showAvailability?: boolean
  availabilityFilter?: 'all' | 'with-slots-only'
  /** Quando false, permite avançar só com especialidade selecionada (ex.: agendamento futuro). */
  requireAvailability?: boolean
  /** Exibe rótulos do encaixe presencial (24h, Agendar, vagas). */
  walkInAvailabilityLabels?: boolean
}

export function SpecialtySelectionStep({
  selectedId,
  onSelect,
  onBack,
  onContinue,
  specialties,
  isLoading = false,
  loadError = null,
  onRetryLoad,
  description,
  emptyMessage = 'Nenhuma especialidade autorizada no contrato ativo.',
  selectedDate,
  showAvailability = false,
  availabilityFilter = 'all',
  requireAvailability = true,
  walkInAvailabilityLabels = false,
}: SpecialtySelectionStepProps) {
  const [search, setSearch] = useState('')
  const [showHints, setShowHints] = useState(false)

  const catalog = specialties
  const dayLabel = selectedDate ? formatAgendaDayLabel(selectedDate) : null

  const resolvedDescription =
    description ??
    (showAvailability
      ? 'Escolha uma especialidade autorizada no contrato com médico em plantão e horário livre.'
      : 'Selecione uma especialidade disponível para este atendimento.')

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return catalog.filter((item) => {
      const matchesSearch = !query || item.name.toLowerCase().includes(query)
      if (!matchesSearch) return false
      if (showAvailability && availabilityFilter === 'with-slots-only') {
        return item.available && (item.availableSlots ?? 0) > 0
      }
      return true
    })
  }, [availabilityFilter, catalog, search, showAvailability])

  const selectedSpecialty = useMemo(() => {
    if (!selectedId) return undefined
    return catalog.find((item) => item.id === selectedId)
  }, [catalog, selectedId])

  const selectedSlots = selectedSpecialty?.availableSlots ?? 0
  const canContinue = requireAvailability
    ? Boolean(selectedSpecialty?.available)
    : Boolean(selectedId)

  function resolveAvailabilityBadge(specialty: SpecialtyOption): {
    text: string
    tone: 'positive' | 'schedule' | 'muted'
  } {
    if (walkInAvailabilityLabels) {
      if (specialty.walkInBadge === 'immediate') {
        return { text: 'Disponível 24h', tone: 'positive' }
      }
      if (specialty.walkInBadge === 'schedule') {
        return { text: 'Agendar', tone: specialty.available ? 'schedule' : 'muted' }
      }
      if (specialty.walkInBadge === 'slots') {
        const slots = specialty.availableSlots ?? 0
        return {
          text: `${slots} ${slots === 1 ? 'vaga' : 'vagas'}`,
          tone: 'positive',
        }
      }
      return { text: 'sem vaga hoje', tone: 'muted' }
    }

    const slots = specialty.availableSlots ?? 0
    if (slots > 0) {
      return {
        text: `${slots} ${slots === 1 ? 'vaga' : 'vagas'}`,
        tone: 'positive',
      }
    }
    return { text: 'sem vaga hoje', tone: 'muted' }
  }

  const emptyAvailabilityMessage =
    availabilityFilter === 'with-slots-only'
      ? 'Nenhuma especialidade do contrato com vaga de plantão neste dia.'
      : emptyMessage

  return (
    <AttendanceStepShell
      hideScrollbar
      title="Especialidade"
      description={resolvedDescription}
      footer={
        <AttendanceStepFooter
          onBack={onBack}
          onContinue={onContinue}
          continueReady={canContinue}
          onContinueBlocked={() => setShowHints(true)}
        />
      }
    >
      {showAvailability && dayLabel ? (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-sky-200/90 bg-sky-50/90 px-3.5 py-3">
          <CalendarCheck
            className="mt-0.5 h-4 w-4 shrink-0 text-sky-700"
            strokeWidth={2}
            aria-hidden
          />
          <p className="text-xs leading-relaxed text-sky-900/90">
            <strong className="font-semibold">{dayLabel}</strong> — catálogo do contrato ativo
            cruzado com plantões publicados e horários livres da unidade.
          </p>
        </div>
      ) : null}

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar especialidade..."
        disabled={isLoading || Boolean(loadError)}
        className="mb-3 w-full shrink-0 rounded-lg border border-gray-200/80 bg-white py-2 px-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15 disabled:cursor-not-allowed disabled:bg-gray-50"
      />

      {loadError ? (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>{loadError}</p>
          {onRetryLoad ? (
            <button
              type="button"
              onClick={onRetryLoad}
              className="mt-2 text-xs font-semibold text-red-800 underline"
            >
              Tentar novamente
            </button>
          ) : null}
        </div>
      ) : null}

      {isLoading && catalog.length === 0 ? (
        <SpecialtySelectionLoadingGrid />
      ) : !loadError && filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-10 text-center">
          <AlertCircle className="h-8 w-8 text-gray-400" strokeWidth={1.75} />
          <p className="text-sm font-medium text-gray-700">{emptyAvailabilityMessage}</p>
          {showAvailability && availabilityFilter === 'with-slots-only' ? (
            <p className="text-xs text-gray-500">
              Tente outro dia na agenda ou oriente o paciente a agendar consulta futura.
            </p>
          ) : null}
        </div>
      ) : (
        <AttendanceFieldHighlight
          highlight={showHints && !canContinue}
          className="min-h-[12rem] flex-1 p-1"
        >
          <ul
            className={[
              'grid gap-1.5 pb-1',
              showAvailability ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-3',
            ].join(' ')}
          >
            {filtered.map((specialty) => {
              const isSelected = specialty.id === selectedId
              const isUnavailable = requireAvailability && !specialty.available
              const badge = resolveAvailabilityBadge(specialty)
              const slots = specialty.availableSlots ?? 0

              return (
                <li key={specialty.id} className="min-w-0">
                  <button
                    type="button"
                    disabled={isUnavailable}
                    title={
                      isUnavailable
                        ? showAvailability
                          ? `${specialty.name} — sem plantão ou vagas neste dia`
                          : `${specialty.name} — Indisponível`
                        : specialty.name
                    }
                    onClick={() => {
                      if (requireAvailability && !specialty.available) return
                      onSelect(specialty.id, specialty.name)
                    }}
                    className={`relative flex w-full flex-col items-center justify-center rounded-lg border px-1.5 py-2 text-center transition ${
                      showAvailability ? 'min-h-[3.5rem]' : 'h-[3rem]'
                    } ${
                      isUnavailable
                        ? 'cursor-not-allowed border-gray-200/80 bg-gray-100 text-gray-400'
                        : isSelected
                          ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)] text-[var(--brand-primary)] ring-2 ring-[var(--brand-primary)]/20'
                          : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span
                      className={[
                        'line-clamp-3 px-0.5 font-medium leading-tight',
                        showAvailability ? 'text-[10px] sm:text-[11px]' : 'text-[10px] sm:text-[11px]',
                      ].join(' ')}
                    >
                      {specialty.name}
                    </span>
                    {showAvailability ? (
                      <span
                        className={[
                          'mt-1 text-[9px] font-medium',
                          badge.tone === 'positive'
                            ? 'text-emerald-700'
                            : badge.tone === 'schedule'
                              ? 'text-violet-700'
                              : 'text-gray-400',
                        ].join(' ')}
                      >
                        {badge.text}
                      </span>
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ul>
        </AttendanceFieldHighlight>
      )}

      {showAvailability && selectedId && selectedSpecialty?.available && selectedSlots > 0 && !walkInAvailabilityLabels ? (
        <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-100">
          Há capacidade para atendimento nesta especialidade ({selectedSlots}{' '}
          {selectedSlots === 1 ? 'horário disponível' : 'horários disponíveis'}).
        </p>
      ) : null}
    </AttendanceStepShell>
  )
}
