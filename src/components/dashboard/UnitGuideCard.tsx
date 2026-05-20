import {
  CheckCircle2,
  ClipboardList,
  Monitor,
  UserRound,
  Video,
  type LucideIcon,
} from 'lucide-react'
import { unitGuideSteps } from '../../data/unitDashboardMock'

const stepIcons: LucideIcon[] = [UserRound, ClipboardList, Video, CheckCircle2]

export function UnitGuideCard() {
  return (
    <aside className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-orange-100/80 bg-gradient-to-b from-[var(--brand-primary-light)]/40 via-white to-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] sm:p-6">
      <header className="relative z-10">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--brand-primary)] ring-1 ring-orange-100">
          <Monitor className="h-3.5 w-3.5" strokeWidth={2} />
          Guia rápido
        </span>
        <h2 className="mt-3 text-base font-bold text-gray-900 sm:text-lg">
          Como usar este posto
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
          Fluxo pensado para o computador da unidade de atendimento.
        </p>
      </header>

      <ol className="relative z-10 mt-6 flex-1 space-y-0">
        {unitGuideSteps.map((item, index) => {
          const Icon = stepIcons[index] ?? ClipboardList
          const isLast = index === unitGuideSteps.length - 1

          return (
            <li key={item.step} className="relative flex gap-4 pb-6 last:pb-0">
              {!isLast && (
                <span
                  className="absolute left-[19px] top-10 bottom-0 w-px bg-gradient-to-b from-orange-200 to-orange-100"
                  aria-hidden
                />
              )}

              <span
                className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm ring-1 ${
                  isLast
                    ? 'bg-emerald-500 text-white ring-emerald-400/30'
                    : 'bg-white text-[var(--brand-primary)] ring-orange-100'
                }`}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                <span
                  className={`absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    isLast
                      ? 'bg-white text-emerald-600 ring-1 ring-emerald-200'
                      : 'bg-[var(--brand-primary)] text-white'
                  }`}
                >
                  {item.step}
                </span>
              </span>

              <span className="min-w-0 flex-1 rounded-xl bg-white/70 px-3.5 py-3 ring-1 ring-white/80 backdrop-blur-sm">
                <span className="block text-sm font-semibold text-gray-900">
                  {item.title}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-gray-500">
                  {item.description}
                </span>
              </span>
            </li>
          )
        })}
      </ol>

      <footer className="relative z-10 mt-5 rounded-xl border border-dashed border-orange-200/80 bg-white/60 px-4 py-3 text-center">
        <p className="text-xs font-medium text-gray-700">
          <span className="text-[var(--brand-primary)]">1 paciente</span> por vez neste
          equipamento
        </p>
      </footer>

      <span
        className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-[var(--brand-primary)]/5"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-orange-100/50"
        aria-hidden
      />
    </aside>
  )
}
