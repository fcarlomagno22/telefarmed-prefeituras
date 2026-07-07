import {
  dashboardPageScrollAreaClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
} from '../components/layout/dashboardPageLayout'

type CrmPartnersPlaceholderPageProps = {
  title: string
  description: string
}

export function CrmPartnersPlaceholderPage({ title, description }: CrmPartnersPlaceholderPageProps) {
  return (
    <div className={dashboardPageShellClass}>
      <div className={dashboardPageScrollAreaClass}>
        <div className={[dashboardPageScrollPaddingClass, 'py-8'].join(' ')}>
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-primary)]">
            CRM Partners
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-[1.65rem]">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-500">{description}</p>
          <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-8 text-center text-sm text-gray-500">
            Módulo em construção. Em breve você poderá gerenciar esta área pelo painel.
          </div>
        </div>
      </div>
    </div>
  )
}
