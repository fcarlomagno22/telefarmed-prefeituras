type AdminPageHeaderProps = {
  sectionLabel: string
  title: string
  description: string
  actions?: React.ReactNode
}

function formatAdminBreadcrumb(sectionLabel: string) {
  return `PAINEL ADMIN · ${sectionLabel.toUpperCase()}`
}

export function AdminPageHeader({
  sectionLabel,
  title,
  description,
  actions,
}: AdminPageHeaderProps) {
  return (
    <header className="shrink-0">
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-primary)]">
        {formatAdminBreadcrumb(sectionLabel)}
      </p>

      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm text-gray-500">{description}</p>
        </div>
        {actions ? <div className="flex shrink-0 self-start">{actions}</div> : null}
      </div>
    </header>
  )
}
