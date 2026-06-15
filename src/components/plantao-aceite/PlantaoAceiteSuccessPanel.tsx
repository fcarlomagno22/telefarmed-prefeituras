import { CalendarPlus, Download } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { PlantaoAceiteConfirmResult, PlantaoAceitePublico } from '../../types/plantaoAceitePublico'
import {
  buildPlantaoGoogleCalendarUrl,
  downloadPlantaoCalendarIcs,
} from '../../utils/plantao/plantaoCalendar'
import { formatProfissionalEscalaTimeRange } from '../profissional/escala/profissionalEscalaUi'
import { PlantaoAceiteSuccessLottie } from './PlantaoAceiteSuccessLottie'

type PlantaoAceiteSuccessPanelProps = {
  plantao: PlantaoAceitePublico
  result: PlantaoAceiteConfirmResult
}

function formatScheduledDate(startAt: string): string {
  const label = new Date(startAt).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function PlantaoAceiteSuccessPanel({ plantao, result }: PlantaoAceiteSuccessPanelProps) {
  const googleCalendarUrl = buildPlantaoGoogleCalendarUrl(plantao, result.plantaoId)

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
        Plantão confirmado!
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">
        {result.profissionalNome}, seu plantão de{' '}
        <span className="font-medium text-gray-900">{plantao.specialty}</span> já está na agenda
        Telefarmed.
      </p>

      <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4 text-left">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          Marcado para
        </p>
        <p className="mt-1 text-base font-semibold text-gray-900">
          {formatScheduledDate(plantao.startAt)}
        </p>
        <p className="mt-1 text-sm font-medium tabular-nums text-[var(--brand-primary)]">
          {formatProfissionalEscalaTimeRange(plantao.startAt, plantao.endAt)} · {plantao.turnLabel}
        </p>
        <p className="mt-2 text-xs text-gray-500">{plantao.modalityLabel}</p>
      </div>

      <div className="mt-6 space-y-3">
        <a
          href={googleCalendarUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-semibold text-gray-900 transition hover:border-gray-300 hover:bg-gray-50"
        >
          <CalendarPlus className="h-4 w-4 text-[var(--brand-primary)]" aria-hidden />
          Adicionar ao Google Agenda
        </a>

        <button
          type="button"
          onClick={() => downloadPlantaoCalendarIcs(plantao, result.plantaoId)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-semibold text-gray-900 transition hover:border-gray-300 hover:bg-gray-50"
        >
          <Download className="h-4 w-4 text-[var(--brand-primary)]" aria-hidden />
          Baixar arquivo .ics
        </button>

        <p className="text-xs leading-relaxed text-gray-400">
          O arquivo .ics inclui lembretes 1 dia, 2 h, 1 h e 10 min antes.
        </p>
      </div>

      <Link
        to={result.agendaUrl}
        className="btn-brand-gradient mt-6 flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold"
      >
        Ir para minha agenda
      </Link>
    </div>
  )
}
