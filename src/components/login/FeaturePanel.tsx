import { Clock, Monitor, Network, Users } from 'lucide-react'
import { brand, features } from '../../config/brand'

const iconMap = {
  users: Users,
  monitor: Monitor,
  clock: Clock,
  network: Network,
} as const

export function FeaturePanel() {
  return (
    <section
      className="relative hidden min-h-screen shrink-0 overflow-hidden lg:block lg:w-[46%] xl:w-[48%] [clip-path:ellipse(95%_100%_at_0%_50%)]"
      aria-label="Destaques do sistema"
    >
      <img
        src={brand.backgroundImageUrl}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

      <div className="absolute -bottom-16 -left-12 h-[48%] w-[115%] bg-[var(--brand-primary)]/70 [clip-path:ellipse(85%_100%_at_20%_100%)]" />

      <ul className="absolute bottom-10 left-10 right-6 z-10 flex flex-col gap-5 xl:left-14 xl:bottom-14 xl:gap-6">
        {features.map(({ icon, text }) => {
          const Icon = iconMap[icon]
          return (
            <li key={text} className="flex items-center gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-white text-white">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <p className="max-w-[280px] text-sm font-medium leading-snug text-white xl:text-[15px]">
                {text}
              </p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
