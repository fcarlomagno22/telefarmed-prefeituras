import { Calendar, Shield, Smile, Users } from 'lucide-react'
import { medicoCadastroLandingStats } from '../../../config/medicoCadastroLanding'
import { LandingReveal } from '../LandingReveal'

const statsIconMap = {
  users: Users,
  calendar: Calendar,
  smile: Smile,
  shield: Shield,
} as const

export function MedicoCadastroLandingStats() {
  return (
    <section
      className="relative z-20 -mt-3 mx-auto max-w-[1180px] px-4 sm:px-6 lg:-mt-8 lg:px-10"
      aria-label="Números da plataforma"
    >
      <LandingReveal variant="scale" delay={0}>
        <div className="overflow-hidden rounded-2xl border border-white/80 bg-white/95 shadow-[0_16px_48px_rgba(15,23,42,0.1),0_2px_8px_rgba(15,23,42,0.04)] ring-1 ring-gray-900/[0.04] backdrop-blur-sm">
          <div
            className="h-1 bg-gradient-to-r from-[var(--brand-primary)] via-[#ff9333] to-[var(--brand-primary)]/40"
            aria-hidden
          />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4">
            {medicoCadastroLandingStats.map((stat, index) => {
              const Icon = statsIconMap[stat.icon]
              const isLast = index === medicoCadastroLandingStats.length - 1

              const borderClass = [
                index % 2 === 0 ? 'sm:border-r' : '',
                index < 2 ? 'sm:border-b' : '',
                !isLast ? 'lg:border-r' : '',
                'border-gray-100 lg:border-b-0',
              ]
                .filter(Boolean)
                .join(' ')

              return (
                <LandingReveal
                  key={stat.value}
                  as="article"
                  variant="fade-up"
                  delay={120 + index * 80}
                  className={`group relative flex gap-4 px-6 py-7 transition-colors hover:bg-[var(--brand-primary-light)]/35 sm:px-7 sm:py-8 ${borderClass}`}
                >
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--brand-primary)] to-[#ff8533] text-white shadow-[0_8px_20px_rgba(255,107,0,0.28)] ring-[3px] ring-orange-100 transition group-hover:scale-105 group-hover:shadow-[0_10px_24px_rgba(255,107,0,0.35)]"
                    aria-hidden
                  >
                    <Icon className="h-5 w-5" strokeWidth={2.25} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-[clamp(1.35rem,2.5vw,1.65rem)] font-bold leading-none tracking-tight text-[var(--brand-primary)]">
                      {stat.value}
                    </p>
                    <p className="mt-2 text-sm leading-snug text-gray-600">
                      {stat.description}
                    </p>
                  </div>
                </LandingReveal>
              )
            })}
          </div>
        </div>
      </LandingReveal>
    </section>
  )
}
