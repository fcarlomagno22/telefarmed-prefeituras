import type { ReactNode } from 'react'
import { ProfissionalNotificacoesLink } from './ProfissionalNotificacoesLink'
import { ProfissionalProfileLink } from './ProfissionalProfileLink'

type ProfissionalPageHeaderProps = {
  title: string
  description: string
  actions?: ReactNode
  hideProfileLink?: boolean
}

export function ProfissionalPageHeader({
  title,
  description,
  actions,
  hideProfileLink = false,
}: ProfissionalPageHeaderProps) {
  return (
    <header className="shrink-0">
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-primary)]">
        Painel do profissional
      </p>

      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm text-gray-500">{description}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 self-start">
          {actions}
          <ProfissionalNotificacoesLink />
          {hideProfileLink ? null : <ProfissionalProfileLink />}
        </div>
      </div>
    </header>
  )
}
