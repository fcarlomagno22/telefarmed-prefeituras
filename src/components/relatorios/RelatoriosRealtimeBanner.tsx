import { BarChart3 } from 'lucide-react'
import { brand } from '../../config/brand'

export function RelatoriosRealtimeBanner() {
  const illustrationUrl = brand.dashboardRelatoriosImageUrl

  return (
    <section className="relative shrink-0 overflow-hidden rounded-2xl border border-orange-100/80 bg-gradient-to-r from-orange-50/90 via-amber-50/60 to-orange-50/40 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
      <div className="flex min-h-[7.5rem] flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6 xl:min-h-[8.5rem]">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary)]/15 text-[var(--brand-primary)]">
            <BarChart3 className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-900 sm:text-base">
              Dados atualizados em tempo real
            </h3>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-gray-600 sm:text-sm">
              As informações são coletadas automaticamente durante o atendimento e
              atualizadas continuamente.
            </p>
          </div>
        </div>

        {illustrationUrl ? (
          <div className="hidden shrink-0 sm:block">
            <img
              src={illustrationUrl}
              alt=""
              className="h-28 w-auto max-w-[200px] object-contain object-right"
            />
          </div>
        ) : null}
      </div>
    </section>
  )
}
