import type { ReactNode } from 'react'

type AttendanceStepShellProps = {
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  hideScrollbar?: boolean
}

export function AttendanceStepShell({
  title,
  description,
  children,
  footer,
  hideScrollbar = false,
}: AttendanceStepShellProps) {
  return (
    <article className="relative z-10 mt-6 flex min-h-0 flex-1 flex-col sm:mt-8">
      <div className="flex min-h-0 flex-1 flex-col rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/80 px-5 py-6 sm:px-8 sm:py-7">
        <header className="mb-3 shrink-0">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          {description ? (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          ) : null}
        </header>

        <div
          className={
            hideScrollbar
              ? 'flex min-h-0 flex-1 flex-col overflow-y-auto no-scrollbar'
              : 'flex min-h-0 flex-1 flex-col'
          }
        >
          {children}
        </div>

        {footer ? <footer className="mt-5 shrink-0">{footer}</footer> : null}
      </div>
    </article>
  )
}
