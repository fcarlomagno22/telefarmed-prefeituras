import {
  BadgeCheck,
  CalendarClock,
  CircleAlert,
  Headphones,
  Stethoscope,
  Wallet,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { PROFISSIONAL_TELEMEDICINE_LABEL } from '../../../config/profissionalConfig'
import { profissionalRoutes } from '../../../config/profissionalRoutes'
import { profissionalLoggedProfile } from '../../../data/profissionalPerfilMock'
import { profissionalEscalaMonthlyStats } from '../../../data/profissionalEscalaDisponivelMock'
import type { ProfissionalEscalaDisponivel } from '../../../types/profissionalEscalaDisponivel'
import {
  formatProfissionalConselhoRegistro,
  getProfissionalConselhoConfig,
} from '../../../config/profissionalConselhoConfig'
import { formatProfissionalCurrency } from '../../../utils/profissional/formatProfissionalCurrency'
import {
  formatProfissionalEscalaCardDate,
  formatProfissionalEscalaTimeRange,
  profissionalEscalaShiftsPanelClass,
} from './profissionalEscalaUi'

type ProfissionalEscalaSidebarPanelProps = {
  profileSpecialty: string
  reservedShifts: ProfissionalEscalaDisponivel[]
}

const howItWorksSteps = [
  'Escolha o plantão e confirme horário e valor.',
  'Presencial: passe o mouse na cidade para ver local e endereço.',
  'Após reservar, acompanhe na Agenda e no Financeiro.',
]

const quickLinks = [
  { to: profissionalRoutes.agenda, label: 'Agenda', icon: CalendarClock },
  { to: profissionalRoutes.financeiro, label: 'Financeiro', icon: Wallet },
  { to: profissionalRoutes.suporte, label: 'Suporte', icon: Headphones },
]

export function ProfissionalEscalaSidebarPanel({
  profileSpecialty,
  reservedShifts,
}: ProfissionalEscalaSidebarPanelProps) {
  const profile = profissionalLoggedProfile
  const conselho = getProfissionalConselhoConfig(profile.conselhoClasse)
  const crm = formatProfissionalConselhoRegistro(
    conselho.conselhoRegionalSigla,
    profile.conselhoRegistro,
    profile.conselhoUf,
  )
  const stats = profissionalEscalaMonthlyStats

  return (
    <section
      data-tour="escala-sidebar"
      className={profissionalEscalaShiftsPanelClass}
      aria-label="Informações do plantão"
    >
      <header className="shrink-0 border-b border-gray-100 px-4 py-3.5 sm:px-5">
        <h2 className="text-sm font-bold text-gray-900">Seu painel</h2>
        <p className="mt-0.5 text-xs text-gray-500">Resumo e atalhos</p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3 border-b border-gray-100 pb-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-primary-light)] text-[var(--brand-primary)]">
            <Stethoscope className="h-4 w-4" strokeWidth={2} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              Especialidade
            </p>
            <p className="mt-0.5 text-sm font-bold text-[var(--brand-primary)]">{profileSpecialty}</p>
            <p className="mt-0.5 text-[11px] text-gray-600">{crm}</p>
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              <BadgeCheck className="h-3 w-3" aria-hidden />
              Verificado
            </span>
          </div>
        </div>

        <div
          data-tour="escala-sidebar-stats"
          className="mt-4 grid grid-cols-2 gap-2"
        >
          <div className="rounded-xl border border-gray-100 bg-slate-50/90 px-2.5 py-2.5 text-center">
            <p className="text-xl font-bold text-gray-900">{stats.claimedCount}</p>
            <p className="text-[10px] text-gray-600">Captados no mês</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-slate-50/90 px-2.5 py-2.5 text-center">
            <p className="text-sm font-bold leading-tight text-gray-900">
              {formatProfissionalCurrency(stats.grossRevenueCents)}
            </p>
            <p className="text-[10px] text-gray-600">Faturamento</p>
          </div>
        </div>

        <div className="mt-3">
          <div className="flex justify-between text-[11px]">
            <span className="font-semibold text-gray-700">Taxa de aceitação</span>
            <span className="font-bold text-emerald-600">{stats.acceptanceRatePercent}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${stats.acceptanceRatePercent}%` }}
            />
          </div>
        </div>

        <div data-tour="escala-how-it-works" className="mt-4 border-t border-gray-100 pt-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Como funciona
          </p>
          <ol className="mt-2 space-y-2">
            {howItWorksSteps.map((step, index) => (
              <li key={step} className="flex gap-2 text-[11px] leading-relaxed text-gray-600">
                <span className="font-bold text-[var(--brand-primary)]">{index + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div data-tour="escala-reservations" className="mt-4 border-t border-gray-100 pt-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Reservas nesta sessão
          </p>
          {reservedShifts.length === 0 ? (
            <p className="mt-2 text-xs text-gray-500">Nenhuma reserva ainda.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {reservedShifts.slice(0, 4).map((shift) => {
                const date = formatProfissionalEscalaCardDate(shift.startAt)
                return (
                  <li
                    key={shift.id}
                    className="rounded-lg border border-gray-100 bg-slate-50/80 px-2.5 py-2"
                  >
                    <p className="text-[10px] font-semibold text-gray-500">
                      {date.day} {date.month} · {shift.turnLabel}
                    </p>
                    <p className="text-[11px] font-semibold text-gray-900">
                      {formatProfissionalEscalaTimeRange(shift.startAt, shift.endAt)}
                    </p>
                    <p className="text-[10px] text-gray-600">
                      {shift.modality === 'tele'
                        ? PROFISSIONAL_TELEMEDICINE_LABEL
                        : shift.unitName}
                    </p>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div data-tour="escala-quick-links" className="mt-4 border-t border-gray-100 pt-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Acesso rápido
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {quickLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-gray-700 transition hover:border-[var(--brand-primary)]/40 hover:text-[var(--brand-primary)]"
              >
                <Icon className="h-3 w-3" aria-hidden />
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50/80 p-3">
          <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" aria-hidden />
          <p className="text-[11px] leading-relaxed text-amber-900">
            Faltas sem aviso reduzem sua taxa de aceitação.
          </p>
        </div>
      </div>
    </section>
  )
}
