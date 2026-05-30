import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import {
  profissionalPerfilCardBodyClass,
  profissionalPerfilCardClass,
  profissionalPerfilCardHeaderClass,
  profissionalPerfilInfoBoxClass,
  profissionalPerfilLabelClass,
} from './profissionalPerfilUi'

export function ProfissionalPerfilCard({
  icon: Icon,
  title,
  children,
  className,
  headerClassName,
  bodyClassName,
}: {
  icon: LucideIcon
  title: string
  children: ReactNode
  className?: string
  headerClassName?: string
  bodyClassName?: string
}) {
  return (
    <section className={[profissionalPerfilCardClass, className].filter(Boolean).join(' ')}>
      <header
        className={[profissionalPerfilCardHeaderClass, headerClassName].filter(Boolean).join(' ')}
      >
        <Icon className="h-[18px] w-[18px] shrink-0 text-[var(--brand-primary)]" strokeWidth={2} aria-hidden />
        <h2 className="text-[15px] font-bold text-gray-900">{title}</h2>
      </header>
      <div className={[profissionalPerfilCardBodyClass, bodyClassName].filter(Boolean).join(' ')}>
        {children}
      </div>
    </section>
  )
}

export function ProfissionalPerfilField({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={['block min-w-0', className].filter(Boolean).join(' ')}>
      <span className={profissionalPerfilLabelClass}>{label}</span>
      {children}
    </label>
  )
}

export function ProfissionalPerfilInfoBox({
  icon: Icon,
  children,
  className,
}: {
  icon: LucideIcon
  children: ReactNode
  className?: string
}) {
  return (
    <div className={[profissionalPerfilInfoBoxClass, className].filter(Boolean).join(' ')}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" aria-hidden />
      <p>{children}</p>
    </div>
  )
}
