import type { ReactNode } from 'react'

type AttendanceStepShellProps = {
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  hideScrollbar?: boolean
  /** Preenche a altura disponível (drawers/modais) com scroll interno. */
  fillAvailable?: boolean
  /** Sem margem superior — uso em drawers de fluxo longo. */
  embedded?: boolean
}

export function AttendanceStepShell({
  title,
  description,
  children,
  footer,
  hideScrollbar = false,
  fillAvailable = false,
  embedded = false,
}: AttendanceStepShellProps) {
  const usesDrawerLayout = fillAvailable || embedded

  const articleClass = usesDrawerLayout
    ? 'relative z-10 flex min-h-0 w-full flex-1 flex-col'
    : 'relative z-10 mt-6 flex min-h-0 w-full flex-1 flex-col sm:mt-8'

  const cardClass = usesDrawerLayout
    ? 'flex min-h-0 flex-1 flex-col rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/80 px-5 py-6 sm:px-8 sm:py-7'
    : 'flex min-h-0 flex-1 flex-col rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/80 px-5 py-6 sm:px-8 sm:py-7'

  const bodyClass = fillAvailable || hideScrollbar
    ? 'flex min-h-0 flex-1 flex-col overflow-y-auto no-scrollbar'
    : 'flex min-h-0 flex-1 flex-col overflow-y-auto'

  return (
    <article className={articleClass}>
      <div className={cardClass}>
        <header className="mb-3 shrink-0">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          {description ? (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          ) : null}
        </header>

        <div className={bodyClass}>{children}</div>

        {footer ? <footer className="mt-5 shrink-0">{footer}</footer> : null}
      </div>
    </article>
  )
}
