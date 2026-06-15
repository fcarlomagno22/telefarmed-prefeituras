import {
  ArrowRight,
  Clock3,
  Hourglass,
  Shield,
  Timer,
  UserCheck,
  Users,
  Video,
} from 'lucide-react'
import type { ProfissionalShift } from '../../../types/profissionalAgenda'
import {
  canEnterProfissionalShift,
  formatProfissionalShiftDateLong,
  formatRelativeMinutes,
  getProfissionalShiftTiming,
} from '../../../utils/profissional/profissionalShiftTiming'
import {
  PROFISSIONAL_TELEMEDICINE_LABEL,
  profissionalAgendaPanelClass,
  profissionalLifecycleHeaderStyles,
  profissionalLifecycleLabels,
  profissionalRoleLabels,
} from './profissionalAgendaUi'

type ProfissionalShiftCardProps = {
  shift: ProfissionalShift
  highlight?: boolean
  onEnterShift: (shiftId: string) => void
  /** Destaca o botão de entrar no plantão para o tour guiado. */
  tourHighlightEnterShift?: boolean
}

function StatTile({
  label,
  value,
  accent,
}: {
  label: string
  value: string | number
  accent?: 'orange' | 'emerald' | 'gray'
}) {
  const valueClass =
    accent === 'emerald'
      ? 'text-emerald-700'
      : accent === 'orange'
        ? 'text-[var(--brand-primary)]'
        : 'text-gray-900'

  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-white/90 px-3 py-2.5 text-center ring-1 ring-gray-100">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-0.5 text-lg font-bold tabular-nums ${valueClass}`}>{value}</p>
    </div>
  )
}

export function ProfissionalShiftCard({
  shift,
  highlight = false,
  onEnterShift,
  tourHighlightEnterShift = false,
}: ProfissionalShiftCardProps) {
  const timing = getProfissionalShiftTiming(shift)
  const canEnter = canEnterProfissionalShift(shift)
  const awaitingStart =
    shift.lifecycle === 'aguardando_inicio' && timing.startsInMinutes !== null
  const isEnded = shift.lifecycle === 'encerrado'
  const showStats =
    shift.stats.previstos > 0 ||
    shift.lifecycle === 'em_andamento' ||
    shift.stats.atendidos > 0
  const dateLong = formatProfissionalShiftDateLong(shift.startAt)
  const escalaRef = shift.escalaShiftId.toUpperCase()

  return (
    <article
      className={[
        profissionalAgendaPanelClass,
        'shrink-0',
        highlight ? 'ring-2 ring-[var(--brand-primary)]/30 shadow-[0_8px_28px_rgba(255,107,0,0.12)]' : '',
      ].join(' ')}
    >
      <div
        className={[
          'relative shrink-0 overflow-hidden bg-gradient-to-r px-4 py-3.5 sm:px-5',
          profissionalLifecycleHeaderStyles[shift.lifecycle],
        ].join(' ')}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(255,255,255,0.2)_0%,transparent_50%)]"
          aria-hidden
        />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
              {profissionalLifecycleLabels[shift.lifecycle]}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-black/10 px-2.5 py-0.5 text-[11px] font-semibold text-white/95">
              {shift.role === 'reserva' ? (
                <Shield className="h-3 w-3" strokeWidth={2.25} />
              ) : (
                <UserCheck className="h-3 w-3" strokeWidth={2.25} />
              )}
              {profissionalRoleLabels[shift.role]}
            </span>
          </div>
          <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-gray-800 shadow-sm">
            {shift.turnLabel}
          </span>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
              {shift.specialty}
            </h3>
            <p className="mt-1 capitalize text-sm text-gray-600">{dateLong}</p>
            <p className="mt-1 text-xs font-medium text-gray-400">Referência na escala {escalaRef}</p>
          </div>

          {canEnter ? (
            <button
              type="button"
              data-tour={tourHighlightEnterShift ? 'enter-shift-btn' : undefined}
              onClick={() => onEnterShift(shift.id)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-5 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(255,107,0,0.35)] transition hover:bg-[var(--brand-primary-hover)] lg:w-auto lg:justify-self-end"
            >
              {shift.lifecycle === 'em_andamento' ? 'Continuar plantão' : 'Entrar no plantão'}
              <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2.25} />
            </button>
          ) : awaitingStart ? (
            <span
              className="inline-flex w-full items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-900 lg:w-auto lg:justify-self-end"
              title={`Plantão disponível a partir das ${shift.startTime}`}
            >
              Disponível às {shift.startTime}
            </span>
          ) : isEnded ? (
            <span className="inline-flex w-full justify-center rounded-xl bg-gray-100 px-4 py-2.5 text-xs font-semibold text-gray-600 lg:w-auto lg:justify-self-end">
              Plantão encerrado
            </span>
          ) : null}
        </div>

        <div className="rounded-xl border border-orange-100/80 bg-gradient-to-br from-orange-50/50 via-white to-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                Janela do turno
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums text-gray-900 sm:text-2xl">
                {shift.startTime}
                <span className="mx-2 text-lg font-medium text-gray-400">–</span>
                {shift.endTime}
              </p>
            </div>
            <div className="flex w-fit shrink-0 items-center gap-2 rounded-lg bg-white px-3 py-2 ring-1 ring-orange-100">
              <Timer className="h-4 w-4 text-[var(--brand-primary)]" strokeWidth={2} />
              <span className="text-sm font-semibold text-gray-800">{timing.durationLabel}</span>
            </div>
          </div>

          {timing.progressPercent !== null ? (
            <div className="mt-4">
              <div className="mb-1.5 flex justify-between text-[10px] font-semibold text-gray-500">
                <span>{shift.startTime}</span>
                <span className="text-[var(--brand-primary)]">
                  {shift.lifecycle === 'em_andamento'
                    ? `${timing.progressPercent}% do turno`
                    : timing.progressPercent === 100
                      ? 'Turno encerrado'
                      : `${timing.progressPercent}%`}
                </span>
                <span>{shift.endTime}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-200/80">
                <div
                  className={[
                    'h-full rounded-full transition-all',
                    shift.lifecycle === 'encerrado'
                      ? 'bg-gray-400'
                      : 'bg-gradient-to-r from-[var(--brand-primary)] to-orange-300',
                  ].join(' ')}
                  style={{ width: `${timing.progressPercent}%` }}
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-100 bg-orange-50/80 px-3 py-1.5 text-xs font-semibold text-gray-800">
            <Video className="h-3.5 w-3.5 text-[var(--brand-primary)]" strokeWidth={2} />
            {PROFISSIONAL_TELEMEDICINE_LABEL}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700">
            <Clock3 className="h-3.5 w-3.5 text-gray-500" strokeWidth={2} />
            {shift.turnLabel} · {timing.durationLabel}
          </span>
          {timing.startsInMinutes !== null && shift.lifecycle !== 'encerrado' ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-100 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900">
              <Hourglass className="h-3.5 w-3.5" strokeWidth={2} />
              Início em {formatRelativeMinutes(timing.startsInMinutes)}
            </span>
          ) : null}
        </div>

        {showStats ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatTile
              label="Previstos"
              value={shift.stats.previstos}
              accent={shift.stats.previstos > 0 ? 'orange' : 'gray'}
            />
            <StatTile
              label="Na fila"
              value={shift.stats.naFila}
              accent={shift.stats.naFila > 0 ? 'emerald' : 'gray'}
            />
            <StatTile label="Atendidos" value={shift.stats.atendidos} />
            <StatTile
              label="Tempo médio"
              value={shift.stats.tempoMedioMin > 0 ? `${shift.stats.tempoMedioMin} min` : '—'}
            />
          </div>
        ) : null}

        <div
          className={[
            'flex gap-3 rounded-xl border px-3.5 py-3',
            shift.lifecycle === 'em_andamento'
              ? 'border-emerald-100 bg-emerald-50/60'
              : shift.lifecycle === 'encerrado'
                ? 'border-gray-200 bg-gray-50'
                : 'border-amber-100 bg-amber-50/50',
          ].join(' ')}
        >
          <Users
            className={[
              'mt-0.5 h-4 w-4 shrink-0',
              shift.lifecycle === 'em_andamento' ? 'text-emerald-600' : 'text-amber-600',
            ].join(' ')}
            strokeWidth={2}
          />
          <p className="text-xs leading-relaxed text-gray-700">{timing.statusHint}</p>
        </div>

        {shift.role === 'reserva' ? (
          <p className="flex items-start gap-2 text-xs leading-relaxed text-violet-800">
            <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-600" strokeWidth={2} />
            Acionamento automático se o titular não comparecer no início do turno. Mantenha-se
            disponível até o encerramento previsto.
          </p>
        ) : null}
      </div>
    </article>
  )
}
