import { Link } from 'react-router-dom'
import { Shield } from 'lucide-react'
import type { PlantaoAceitePublico, PlantaoAceiteReserveResult } from '../../types/plantaoAceitePublico'
import { formatProfissionalEscalaTimeRange } from '../profissional/escala/profissionalEscalaUi'

type PlantaoAceiteReserveSuccessPanelProps = {
  plantao: PlantaoAceitePublico
  result: PlantaoAceiteReserveResult
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

export function PlantaoAceiteReserveSuccessPanel({
  plantao,
  result,
}: PlantaoAceiteReserveSuccessPanelProps) {
  return (
    <div
      className="mx-auto w-full max-w-md px-1 py-4 text-center sm:rounded-2xl sm:border sm:border-gray-200 sm:bg-white sm:px-6 sm:py-8 sm:shadow-sm"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-violet-100">
        <Shield className="h-10 w-10 text-violet-700" aria-hidden />
      </div>

      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-gray-900">
        Você entrou na fila de reserva
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">
        {result.profissionalNome}, sua candidatura para o plantão de{' '}
        <span className="font-medium text-gray-900">{plantao.specialty}</span> foi registrada.
        Você é o <span className="font-semibold text-violet-800">{result.reservePosition}º</span>{' '}
        médico de reserva.
      </p>

      <div className="mt-6 rounded-2xl border border-violet-100 bg-violet-50/60 px-5 py-4 text-left">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-500">
          Plantão
        </p>
        <p className="mt-1 text-base font-semibold text-gray-900">
          {formatScheduledDate(plantao.startAt)}
        </p>
        <p className="mt-1 text-sm font-medium tabular-nums text-violet-800">
          {formatProfissionalEscalaTimeRange(plantao.startAt, plantao.endAt)} · {plantao.turnLabel}
        </p>
        <p className="mt-3 text-xs leading-relaxed text-violet-900/80">
          Se o médico titular não entrar no horário, você poderá ser acionado para assumir o
          plantão. Acompanhe os avisos na sua agenda.
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
