import { DollarSign, Heart, Home } from 'lucide-react'
import { medicoCadastroLandingHeroImageUrl } from '../../../config/medicoCadastroLanding'
import { LandingReveal } from '../LandingReveal'
import { MedicoCadastroRegistrationForm } from './MedicoCadastroRegistrationForm'

const features = [
  {
    icon: Home,
    title: 'Atenda de onde estiver',
    description:
      'Trabalhe 100% online, no conforto da sua casa, com total flexibilidade de horários.',
  },
  {
    icon: DollarSign,
    title: 'Remuneração que valoriza você',
    description:
      'Plantões bem remunerados e pagamentos transparentes e pontuais.',
  },
  {
    icon: Heart,
    title: 'Tecnologia que te apoia',
    description:
      'Plataforma intuitiva, suporte humanizado e toda a segurança que você precisa para atender bem.',
  },
] as const

export function MedicoCadastroLandingHero() {
  return (
    <section className="relative isolate overflow-hidden">
      <img
        src={medicoCadastroLandingHeroImageUrl}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full -scale-x-100 object-cover object-center"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgb(247_248_250/0.48)_0%,rgb(247_248_250/0.28)_28%,rgb(247_248_250/0.14)_42%,transparent_58%)] lg:bg-[linear-gradient(90deg,rgb(247_248_250/0.42)_0%,rgb(247_248_250/0.22)_32%,transparent_52%)]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-10">
        <div className="grid gap-10 py-10 lg:grid-cols-2 lg:items-center lg:gap-6 lg:py-14 xl:gap-10">
          <div className="flex flex-col justify-center lg:max-w-[520px] lg:py-4">
            <LandingReveal eager variant="fade-up" delay={80}>
              <span className="mb-5 inline-flex w-fit rounded-full bg-[var(--brand-primary-light)] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--brand-primary)]">
                Plantões online 24h
              </span>
            </LandingReveal>

            <LandingReveal eager variant="fade-up" delay={160}>
              <h1 className="text-[clamp(1.75rem,4vw,2.65rem)] font-bold leading-[1.15] tracking-tight text-gray-900">
                Sua experiência transforma vidas.{' '}
                <span className="text-[var(--brand-primary)]">
                  E também o seu futuro.
                </span>
              </h1>
            </LandingReveal>

            <LandingReveal eager variant="fade-up" delay={240}>
              <p className="mt-4 text-base leading-relaxed text-gray-600">
                Na Telefarmed, você oferece atendimento de qualidade e ainda
                conquista liberdade, flexibilidade e excelentes oportunidades de
                rendimento.
              </p>
            </LandingReveal>

            <ul className="mt-8 space-y-5">
              {features.map(({ icon: Icon, title, description }, index) => (
                <LandingReveal
                  key={title}
                  as="li"
                  eager
                  variant="fade-up"
                  delay={320 + index * 90}
                  className="flex gap-4"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary)] text-white shadow-[0_6px_16px_rgba(255,107,0,0.35)]">
                    <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-gray-500">
                      {description}
                    </p>
                  </div>
                </LandingReveal>
              ))}
            </ul>
          </div>

          <LandingReveal
            eager
            variant="scale"
            delay={280}
            className="lg:flex lg:justify-end lg:py-4"
          >
            <div className="w-full max-w-[440px] lg:max-w-[420px] xl:max-w-[440px]">
              <MedicoCadastroRegistrationForm className="shadow-[0_12px_48px_rgba(15,23,42,0.1)]" />
            </div>
          </LandingReveal>
        </div>
      </div>
    </section>
  )
}
