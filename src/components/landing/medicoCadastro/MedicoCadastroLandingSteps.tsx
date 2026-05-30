import {
  CalendarCheck,
  DollarSign,
  FileText,
  Pencil,
} from 'lucide-react'
import { medicoCadastroLandingSteps } from '../../../config/medicoCadastroLanding'
import { LandingReveal } from '../LandingReveal'

const stepsIconMap = {
  pencil: Pencil,
  file: FileText,
  calendarCheck: CalendarCheck,
  dollar: DollarSign,
} as const

export function MedicoCadastroLandingSteps() {
  return (
    <section
      className="mx-auto max-w-[1180px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10"
      aria-labelledby="como-funciona-heading"
    >
      <LandingReveal variant="fade-up" className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--brand-primary)]">
          Como funciona
        </p>
        <h2
          id="como-funciona-heading"
          className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl"
        >
          Simples, rápido e feito para você
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-gray-500 sm:text-base">
          Em quatro passos você entra na plataforma e começa a atender com
          segurança.
        </p>
      </LandingReveal>

      <ol className="relative mt-12 lg:mt-16">
        <div
          className="pointer-events-none absolute left-[27px] top-8 bottom-8 hidden w-px bg-gradient-to-b from-[var(--brand-primary)]/50 via-[var(--brand-primary)]/20 to-transparent sm:left-1/2 sm:top-[4.5rem] sm:block sm:h-px sm:w-[calc(100%-8rem)] sm:-translate-x-1/2 sm:bg-gradient-to-r sm:from-transparent sm:via-[var(--brand-primary)]/35 sm:to-transparent lg:w-[calc(100%-5rem)]"
          aria-hidden
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {medicoCadastroLandingSteps.map((step, index) => {
            const Icon = stepsIconMap[step.icon]

            return (
              <LandingReveal
                key={step.step}
                as="li"
                variant="fade-up"
                delay={index * 110}
                className="group relative"
              >
                <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-gradient-to-b from-white to-gray-50/80 p-6 shadow-[0_4px_24px_rgba(15,23,42,0.05)] ring-1 ring-gray-900/[0.03] transition duration-300 hover:-translate-y-1 hover:border-[var(--brand-primary)]/25 hover:shadow-[0_16px_40px_rgba(255,107,0,0.12)] sm:p-7">
                  <span
                    className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--brand-primary)] via-[#ff9333] to-[var(--brand-primary)]/30 opacity-80 transition group-hover:opacity-100"
                    aria-hidden
                  />

                  <div className="mb-5 flex items-start justify-between gap-3">
                    <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-[var(--brand-primary)]/10 text-xs font-bold tabular-nums text-[var(--brand-primary)]">
                      {String(step.step).padStart(2, '0')}
                    </span>
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--brand-primary)] to-[#ff8533] text-white shadow-[0_8px_20px_rgba(255,107,0,0.25)] ring-[3px] ring-orange-50 transition group-hover:scale-105 group-hover:shadow-[0_10px_28px_rgba(255,107,0,0.35)]">
                      <Icon className="h-5 w-5" strokeWidth={2.25} aria-hidden />
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 sm:text-lg">
                    {step.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-500">
                    {step.description}
                  </p>
                </article>
              </LandingReveal>
            )
          })}
        </div>
      </ol>
    </section>
  )
}
