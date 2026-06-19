import { Link } from 'react-router-dom'
import type { PlantaoAceitePublico } from '../../types/plantaoAceitePublico'
import { formatProfissionalEscalaTimeRange } from '../profissional/escala/profissionalEscalaUi'
import { PlantaoAceiteSuccessLottie } from './PlantaoAceiteSuccessLottie'

type ConfirmedItem = {
  plantao: PlantaoAceitePublico
  kind: 'titular' | 'reserva'
  reservePosition?: number
}

type PlantaoAceiteDisponiveisSuccessPanelProps = {
  profissionalNome: string
  agendaUrl: string
  confirmed: ConfirmedItem[]
  failed: Array<{ plantao: PlantaoAceitePublico; message: string }>
}

function formatDateLabel(startAt: string): string {
  const label = new Date(startAt).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    timeZone: 'America/Sao_Paulo',
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function PlantaoAceiteDisponiveisSuccessPanel({
  profissionalNome,
  agendaUrl,
  confirmed,
  failed,
}: PlantaoAceiteDisponiveisSuccessPanelProps) {
  const titularCount = confirmed.filter((item) => item.kind === 'titular').length
  const reserveCount = confirmed.filter((item) => item.kind === 'reserva').length

  return (
    <div
      className="mx-auto w-full max-w-md px-1 py-4 text-center sm:rounded-2xl sm:border sm:border-gray-200 sm:bg-white sm:px-6 sm:py-8 sm:shadow-sm"
      role="status"
      aria-live="polite"
    >
      <div className="relative mx-auto flex h-52 w-52 items-center justify-center">
        <div
          className="pointer-events-none absolute inset-4 rounded-full bg-emerald-400/15 blur-2xl"
          aria-hidden
        />
        <div className="relative h-44 w-44">
          <PlantaoAceiteSuccessLottie />
        </div>
      </div>

      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
        {confirmed.length === 1 ? 'Plantão confirmado!' : 'Plantões confirmados!'}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">
        {profissionalNome},{' '}
        {confirmed.length === 1
          ? 'seu plantão já está na agenda Telefarmed.'
          : `${confirmed.length} plantões foram registrados na sua agenda.`}
      </p>

      {titularCount > 0 || reserveCount > 0 ? (
        <p className="mt-2 text-xs text-gray-500">
          {titularCount > 0
            ? `${titularCount} como titular${titularCount === 1 ? '' : 'es'}`
            : null}
          {titularCount > 0 && reserveCount > 0 ? ' · ' : null}
          {reserveCount > 0
            ? `${reserveCount} na fila de reserva`
            : null}
        </p>
      ) : null}

      <div className="mt-6 space-y-3 text-left">
        {confirmed.map((item) => (
          <div
            key={item.plantao.slotId}
            className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
          >
            <p className="text-sm font-semibold text-gray-900">{item.plantao.specialty}</p>
            <p className="mt-0.5 text-sm text-gray-600">{formatDateLabel(item.plantao.startAt)}</p>
            <p className="mt-0.5 text-sm text-gray-600">
              {formatProfissionalEscalaTimeRange(item.plantao.startAt, item.plantao.endAt)}
            </p>
            {item.kind === 'reserva' && item.reservePosition ? (
              <p className="mt-1 text-xs text-violet-700">
                {item.reservePosition}º na fila de reserva
              </p>
            ) : null}
          </div>
        ))}
      </div>

      {failed.length > 0 ? (
        <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-left">
          <p className="text-sm font-medium text-amber-900">
            {failed.length} plantão{failed.length === 1 ? '' : 'es'} não pôde
            {failed.length === 1 ? '' : 'ram'} ser aceito{failed.length === 1 ? '' : 's'}
          </p>
          <ul className="mt-2 space-y-1 text-xs text-amber-800">
            {failed.map((item) => (
              <li key={item.plantao.slotId}>
                {item.plantao.specialty}: {item.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <a
        href={agendaUrl}
        className="btn-brand-gradient mt-6 inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold"
      >
        Ir para minha escala
      </a>

      <p className="mt-3 text-center text-xs text-gray-400">
        Ou{' '}
        <Link to={agendaUrl} className="text-[var(--brand-primary)] hover:underline">
          acesse sua agenda
        </Link>
      </p>
    </div>
  )
}
