import { Link } from 'react-router-dom'
import { brand } from '../../../config/brand'
import { medicoCadastroLandingFooterImageUrl, medicoCadastroLandingLgpdCertUrl } from '../../../config/medicoCadastroLanding'
import { profissionalRoutes } from '../../../config/profissionalRoutes'
import { LandingReveal } from '../LandingReveal'
import { MedicoCadastroFooterCtaButton } from './MedicoCadastroRegistrationForm'
import { MedicoCadastroLandingHero } from './MedicoCadastroLandingHero'
import { MedicoCadastroLandingStats } from './MedicoCadastroLandingStats'
import { MedicoCadastroLandingSteps } from './MedicoCadastroLandingSteps'

export function MedicoCadastroLandingPageContent() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-10">
          <LandingReveal eager variant="fade-down" delay={0}>
            <img
              src={brand.logoUrl}
              alt={brand.appName}
              className="h-10 w-auto max-w-[200px] shrink-0 object-contain object-left sm:h-11"
            />
          </LandingReveal>

          <LandingReveal
            eager
            variant="fade-down"
            delay={100}
            className="flex items-center gap-3 sm:gap-4"
          >
            <span className="text-sm text-gray-500">Já possui cadastro?</span>
            <Link
              to={profissionalRoutes.login}
              className="rounded-lg border-2 border-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-[var(--brand-primary)] transition hover:bg-[var(--brand-primary-light)] sm:px-5"
            >
              Entrar
            </Link>
          </LandingReveal>
        </div>
      </header>

      <main>
        <MedicoCadastroLandingHero />

        <MedicoCadastroLandingStats />

        <MedicoCadastroLandingSteps />

        <section
          className="relative overflow-hidden bg-[var(--brand-primary)]"
          aria-label="Chamada final para cadastro"
        >
          <LandingReveal variant="fade-right" delay={0}>
            <img
              src={medicoCadastroLandingFooterImageUrl}
              alt=""
              className="pointer-events-none absolute bottom-0 left-0 h-auto max-h-[85%] w-auto max-w-[min(48vw,420px)] object-contain object-left-bottom sm:max-w-[min(42%,480px)]"
            />
          </LandingReveal>

          <div className="relative mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-8 px-4 py-14 sm:px-6 sm:py-16 lg:flex-row lg:items-center lg:gap-12 lg:px-10 lg:py-20">
            <LandingReveal variant="fade-up" delay={80} className="max-w-xl lg:ml-[min(32%,200px)]">
              <h2 className="text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-[2rem]">
                Mais liberdade. Mais controle. Mais propósito na sua rotina.
              </h2>
              <p className="mt-3 text-base leading-relaxed text-white/90 sm:text-lg">
                Cadastre-se agora e descubra uma nova forma de exercer a medicina.
              </p>
              <img
                src={medicoCadastroLandingLgpdCertUrl}
                alt="Certificação LGPD"
                className="mt-5 block h-20 w-auto object-contain object-left sm:mt-6 sm:h-24 lg:h-28"
              />
            </LandingReveal>
            <LandingReveal variant="scale" delay={200}>
              <MedicoCadastroFooterCtaButton className="shrink-0" />
            </LandingReveal>
          </div>
        </section>
      </main>

      <LandingReveal
        as="footer"
        variant="fade-up"
        className="border-t border-gray-100 bg-white py-6 text-center text-xs text-gray-400"
      >
        {brand.copyright}
      </LandingReveal>
    </div>
  )
}
