import { Clock3, ListOrdered, Megaphone, UserRound } from 'lucide-react'
import { useMemo } from 'react'
import type { WaitingQueueEntry } from '../../types/waitingQueue'
import { useWaitingQueue } from '../../hooks/useWaitingQueue'
import { buildQueueEntryMeta } from '../../utils/waitingQueueDisplay'
import { isAppointmentSlotPriority } from '../../utils/waitingQueueSort'

const originLabels = {
  agendado: 'Agendado',
  espontaneo: 'Encaixe',
} as const

function formatLocalClock(now: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(now)
}

type QueueRowProps = {
  entry: WaitingQueueEntry
  position: number
  canCall: boolean
  now: Date
  callDisabled: boolean
  onCall: (entry: WaitingQueueEntry) => void
}

function QueueRow({ entry, position, canCall, now, callDisabled, onCall }: QueueRowProps) {
  const priority =
    entry.origin === 'agendado' &&
    entry.scheduledTime &&
    isAppointmentSlotPriority(entry.scheduledTime, now)
  const meta = buildQueueEntryMeta(entry, now)

  return (
    <li
      className={[
        'rounded-xl border px-3 py-2.5 transition',
        priority
          ? 'border-[var(--brand-primary-border)] bg-[var(--brand-primary-muted)]/80'
          : canCall
            ? 'border-[var(--brand-primary)]/25 bg-[var(--brand-primary-light)]/35 shadow-sm'
            : 'border-gray-100 bg-white',
      ].join(' ')}
    >
      <div className="flex items-start gap-2.5">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-bold tabular-nums text-gray-500 ring-1 ring-gray-100"
          aria-hidden
        >
          {position}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className="min-w-0 truncate text-sm font-semibold leading-snug text-gray-900"
              title={entry.patientName}
            >
              {entry.patientName}
            </p>
            <span
              className={[
                'inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                entry.origin === 'agendado'
                  ? 'bg-sky-50 text-sky-700 ring-1 ring-sky-100'
                  : 'bg-violet-50 text-violet-700 ring-1 ring-violet-100',
              ].join(' ')}
            >
              {originLabels[entry.origin]}
            </span>
            {priority ? (
              <span className="text-[10px] font-semibold text-[var(--brand-primary)]">
                Prioridade
              </span>
            ) : null}
            {entry.status === 'chamado' ? (
              <span className="inline-flex shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 ring-1 ring-amber-100">
                Chamado
              </span>
            ) : null}
          </div>

          <p className="mt-1.5 text-xs leading-relaxed text-gray-600">{meta.primary}</p>
          {meta.secondary ? (
            <p
              className={[
                'mt-0.5 text-xs font-medium',
                meta.secondary.includes('atraso') ? 'text-orange-600' : 'text-gray-500',
              ].join(' ')}
            >
              {meta.secondary}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-center justify-center self-center">
          {canCall ? (
            <button
              type="button"
              onClick={() => onCall(entry)}
              disabled={callDisabled}
              title={
                callDisabled
                  ? 'Finalize o atendimento em andamento no Terminal antes de chamar outro paciente'
                  : 'Chamar paciente'
              }
              aria-label={`Chamar ${entry.patientName}`}
              className={[
                'inline-flex h-9 w-9 items-center justify-center rounded-lg shadow-sm transition',
                callDisabled
                  ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                  : 'bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)]',
              ].join(' ')}
            >
              <Megaphone className="h-5 w-5" strokeWidth={2} />
            </button>
          ) : (
            <span className="px-1 text-[10px] text-gray-400">—</span>
          )}
        </div>
      </div>
    </li>
  )
}

type UnitWaitingQueueCardProps = {
  onCallPatient: (entry: WaitingQueueEntry) => void
  onCallNextPatient: () => void
  callDisabled?: boolean
  isCalling?: boolean
  callError?: string | null
  calledName?: string | null
}

export function UnitWaitingQueueCard({
  onCallPatient,
  onCallNextPatient,
  callDisabled = false,
  isCalling = false,
  callError = null,
  calledName = null,
}: UnitWaitingQueueCardProps) {
  const { ordered, priorityCount, now, refresh, isLoading, loadError } = useWaitingQueue()

  const localClock = useMemo(() => formatLocalClock(now), [now])

  const callableEntryId = ordered[0]?.id ?? null

  function handleCall(entry: WaitingQueueEntry) {
    if (callDisabled || entry.status !== 'aguardando' || isCalling) return
    if (entry.id === callableEntryId) {
      onCallNextPatient()
    } else {
      onCallPatient(entry)
    }
    void refresh()
  }

  function handleCallNext() {
    if (callDisabled || isCalling || ordered.length === 0) return
    onCallNextPatient()
    void refresh()
  }

  return (
    <aside className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[var(--brand-primary-border)] bg-gradient-to-b from-[var(--brand-primary-light)]/40 via-white to-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
      <header className="shrink-0 border-b border-[var(--brand-primary-border)] px-4 py-4 sm:px-5">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--brand-primary)] ring-1 ring-[var(--brand-primary-border)]">
          <ListOrdered className="h-3.5 w-3.5" strokeWidth={2} />
          Fila de espera
        </span>

        <h2 className="mt-3 text-base font-bold text-gray-900 sm:text-lg">
          Pacientes aguardando
        </h2>

        <p className="mt-1.5 text-sm font-semibold text-gray-800">Ordem automática</p>
        <p className="mt-0.5 text-xs leading-relaxed text-gray-600">
          Pacientes com situação Aguardando na agenda (inclui os já chamados ao terminal).
          Agendados: horário, especialidade e atraso; encaixes: horário de chegada.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-600">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 ring-1 ring-[var(--brand-primary-border)]">
            <Clock3 className="h-3.5 w-3.5 shrink-0 text-[var(--brand-primary)]" strokeWidth={2} />
            <span>
              Agora:{' '}
              <strong className="tabular-nums text-gray-900">{localClock}</strong>
            </span>
          </span>
          <span className="inline-flex rounded-full bg-white/80 px-2.5 py-1 ring-1 ring-[var(--brand-primary-border)]">
            <strong className="tabular-nums text-gray-900">{ordered.length}</strong>
            <span className="ml-1">na fila</span>
          </span>
          {priorityCount > 0 ? (
            <span className="inline-flex rounded-full bg-[var(--brand-primary-light)] px-2.5 py-1 font-medium text-[var(--brand-primary)] ring-1 ring-[var(--brand-primary-border)]">
              <strong className="tabular-nums">{priorityCount}</strong>
              <span className="ml-1">prioritário{priorityCount === 1 ? '' : 's'}</span>
            </span>
          ) : null}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2 sm:px-4">
        {loadError ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-2 py-10 text-center">
            <p className="text-sm font-medium text-red-700">{loadError}</p>
            <button
              type="button"
              onClick={() => void refresh()}
              className="text-xs font-semibold text-[var(--brand-primary)] underline"
            >
              Tentar novamente
            </button>
          </div>
        ) : isLoading && ordered.length === 0 ? (
          <div className="flex h-full items-center justify-center py-10 text-sm text-gray-500">
            Carregando fila…
          </div>
        ) : ordered.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-2 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-gray-400 ring-1 ring-[var(--brand-primary-border)]">
              <UserRound className="h-6 w-6" strokeWidth={1.75} />
            </span>
            <p className="text-sm font-medium text-gray-700">Nenhum paciente aguardando</p>
            <p className="max-w-[16rem] text-xs leading-relaxed text-gray-500">
              Confirme a chegada na agenda para incluir o paciente na fila com situação
              Aguardando.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2" aria-label="Lista da fila de espera">
            {ordered.map((entry, index) => (
              <QueueRow
                key={entry.id}
                entry={entry}
                position={index + 1}
                canCall={entry.id === callableEntryId}
                now={now}
                callDisabled={callDisabled || isCalling}
                onCall={handleCall}
              />
            ))}
          </ul>
        )}
      </div>

      <footer className="shrink-0 border-t border-[var(--brand-primary-border)] px-4 py-3 sm:px-5">
        {ordered.length > 0 ? (
          <button
            type="button"
            onClick={handleCallNext}
            disabled={callDisabled || isCalling}
            className={[
              'mb-2 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition',
              callDisabled || isCalling
                ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                : 'bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)]',
            ].join(' ')}
          >
            <Megaphone className="h-4 w-4" strokeWidth={2} />
            Chamar próximo
          </button>
        ) : null}

        <div className="text-center">
          {callError ? (
            <p className="truncate text-xs font-medium text-red-700">{callError}</p>
          ) : calledName ? (
            <p className="truncate text-xs font-semibold text-[var(--brand-primary)]">
              Chamando {calledName}…
            </p>
          ) : callDisabled ? (
            <p className="text-xs font-medium leading-relaxed text-amber-800">
              Terminal em uso — finalize o atendimento atual para chamar o próximo da fila.
            </p>
          ) : ordered.length > 0 ? (
            <p className="text-xs font-medium leading-relaxed text-gray-600">
              A ordem é definida automaticamente pelo sistema. Use{' '}
              <span className="text-[var(--brand-primary)]">Chamar próximo</span> ou o botão no
              primeiro da lista.
            </p>
          ) : (
            <p className="text-xs font-medium leading-relaxed text-gray-600">
              Confirme a chegada na agenda para incluir pacientes na fila.
            </p>
          )}
        </div>
      </footer>
    </aside>
  )
}
