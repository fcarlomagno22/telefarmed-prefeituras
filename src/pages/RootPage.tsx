import { Building2, HeartPulse, LayoutDashboard, Stethoscope, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { brand } from '../config/brand'
import { portals } from '../config/portals'
import { vidaPlusBrand } from '../config/vidaPlusRoutes'
import { useBrandTheme } from '../hooks/useBrandTheme'

export function RootPage() {
  useBrandTheme()

  return (
    <div className="flex min-h-screen min-h-[100dvh] items-center justify-center bg-[#f5f6f8] px-5 py-10 sm:px-8">
      <main className="flex w-full max-w-lg flex-col items-center sm:max-w-xl">
        <div className="animate-login-card-in w-full rounded-3xl border border-gray-200 bg-white px-8 py-10 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_12px_32px_rgba(0,0,0,0.08)] sm:px-10 sm:py-11">
          <div className="mb-8 flex justify-center">
            <img
              src={brand.logoUrl}
              alt={brand.appName}
              className="h-14 w-auto max-w-[240px] object-contain"
            />
          </div>

          <header className="mb-8 text-center">
            <h1 className="text-lg font-bold text-gray-900 sm:text-xl">
              {brand.appName}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Escolha como deseja acessar o sistema
            </p>
          </header>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <PortalChoiceTile
              to={portals.ubt.loginPath}
              icon={Stethoscope}
              title="UBT"
              description="Terminal de teleatendimento e operação da unidade."
              accentClass="from-[var(--brand-primary)] to-orange-500"
              linkAccentClass="text-[var(--brand-primary)]"
            />

            <PortalChoiceTile
              to={portals.profissional.loginPath}
              icon={UserRound}
              title="Profissional"
              description="Agenda, fila de pacientes e área do médico."
              accentClass="from-teal-600 to-emerald-600"
              linkAccentClass="text-teal-600"
            />

            <PortalChoiceTile
              to={portals.prefeitura.loginPath}
              icon={Building2}
              title="Prefeitura"
              description="Gestão municipal da rede e indicadores."
              accentClass="from-sky-600 to-indigo-600"
              linkAccentClass="text-sky-600"
            />

            <PortalChoiceTile
              to={portals.admin.loginPath}
              icon={LayoutDashboard}
              title="Admin"
              description="Gestão da plataforma e contratos."
              accentClass="from-violet-600 to-purple-700"
              linkAccentClass="text-violet-600"
            />
          </div>

          <div
            aria-disabled="true"
            className="mt-4 flex w-full cursor-default items-center gap-3 rounded-2xl border border-transparent bg-transparent px-2 py-3 text-left sm:px-3"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50/80 text-emerald-600/80">
              <HeartPulse className="h-5 w-5" strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-gray-600">{vidaPlusBrand.name}</span>
                <span className="rounded-full border border-amber-200/90 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                  Em desenvolvimento
                </span>
              </span>
              <span className="mt-0.5 block text-xs leading-snug text-gray-400">
                {vidaPlusBrand.tagline}
              </span>
            </span>
          </div>
        </div>

        <footer className="mt-8 text-center text-[11px] font-medium text-gray-400 sm:text-xs">
          {brand.copyright}
        </footer>
      </main>
    </div>
  )
}

type PortalChoiceTileProps = {
  to: string
  icon: typeof Stethoscope
  title: string
  description: string
  accentClass: string
  linkAccentClass: string
}

function PortalChoiceTile({
  to,
  icon: Icon,
  title,
  description,
  accentClass,
  linkAccentClass,
}: PortalChoiceTileProps) {
  return (
    <Link
      to={to}
      className="group flex aspect-square flex-col items-center justify-center gap-2.5 rounded-2xl border border-gray-200 bg-gray-50/50 p-3 text-center transition hover:border-gray-300 hover:bg-white hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)] sm:gap-3 sm:p-4"
    >
      <span
        className={[
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md transition group-hover:scale-[1.05] sm:h-12 sm:w-12',
          accentClass,
        ].join(' ')}
      >
        <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2} />
      </span>
      <span className="min-w-0 w-full">
        <span className="block text-sm font-bold text-gray-900 sm:text-base">{title}</span>
        <span className="mt-1 line-clamp-3 text-[11px] leading-snug text-gray-500 sm:text-xs">
          {description}
        </span>
        <span
          className={[
            'mt-2 inline-block text-[11px] font-semibold group-hover:underline sm:text-xs',
            linkAccentClass,
          ].join(' ')}
        >
          Acessar →
        </span>
      </span>
    </Link>
  )
}
