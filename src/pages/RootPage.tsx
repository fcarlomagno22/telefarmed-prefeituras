import { Building2, LayoutDashboard, Stethoscope } from 'lucide-react'
import { Link } from 'react-router-dom'
import { brand } from '../config/brand'
import { portals } from '../config/portals'
import { useBrandTheme } from '../hooks/useBrandTheme'

export function RootPage() {
  useBrandTheme()

  return (
    <div className="flex min-h-screen min-h-[100dvh] items-center justify-center bg-[#f5f6f8] px-5 py-10 sm:px-8">
      <main className="flex w-full max-w-xl flex-col items-center">
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

          <div className="flex flex-col gap-4">
            <PortalChoiceButton
              to={portals.ubt.loginPath}
              icon={Stethoscope}
              title="Unidade Básica de Teleatendimento (UBT)"
              description="Terminal de teleatendimento, agenda, triagem e operação do dia a dia."
              accentClass="from-[var(--brand-primary)] to-orange-500"
              linkAccentClass="text-[var(--brand-primary)]"
            />

            <PortalChoiceButton
              to={portals.prefeitura.loginPath}
              icon={Building2}
              title="Prefeitura"
              description="Gestão municipal da rede de teleatendimento e indicadores consolidados."
              accentClass="from-sky-600 to-indigo-600"
              linkAccentClass="text-sky-600"
            />

            <PortalChoiceButton
              to={portals.admin.loginPath}
              icon={LayoutDashboard}
              title="Painel Admin"
              description="Gestão das prefeituras, contratos e configuração da plataforma."
              accentClass="from-violet-600 to-purple-700"
              linkAccentClass="text-violet-600"
            />
          </div>
        </div>

        <footer className="mt-8 text-center text-[11px] font-medium text-gray-400 sm:text-xs">
          {brand.copyright}
        </footer>
      </main>
    </div>
  )
}

type PortalChoiceButtonProps = {
  to: string
  icon: typeof Stethoscope
  title: string
  description: string
  accentClass: string
  linkAccentClass: string
}

function PortalChoiceButton({
  to,
  icon: Icon,
  title,
  description,
  accentClass,
  linkAccentClass,
}: PortalChoiceButtonProps) {
  return (
    <Link
      to={to}
      className="group flex w-full items-start gap-4 rounded-2xl border border-gray-200 bg-gray-50/50 p-4 text-left transition hover:border-gray-300 hover:bg-white hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]"
    >
      <span
        className={[
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md transition group-hover:scale-[1.03]',
          accentClass,
        ].join(' ')}
      >
        <Icon className="h-6 w-6" strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-bold text-gray-900">{title}</span>
        <span className="mt-1 block text-sm leading-relaxed text-gray-500">
          {description}
        </span>
        <span
          className={[
            'mt-2 inline-block text-sm font-semibold group-hover:underline',
            linkAccentClass,
          ].join(' ')}
        >
          Acessar →
        </span>
      </span>
    </Link>
  )
}
