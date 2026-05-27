import type { LucideIcon } from 'lucide-react'
import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { NavLink } from 'react-router-dom'

export type SidebarNavItemProps = {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  /** Item visível, estilo ghost, sem navegação — exibe tooltip ao passar o mouse. */
  comingSoon?: boolean
  /** Ponto azul piscante no canto superior direito do ícone (ex.: notificações não lidas). */
  showAlertDot?: boolean
}

export type SidebarNavSection = {
  id: string
  label: string
  items: SidebarNavItemProps[]
}

function SidebarNavIconWithAlertDot({
  icon: Icon,
  showAlertDot,
  isActive,
}: {
  icon: LucideIcon
  showAlertDot?: boolean
  isActive?: boolean
}) {
  return (
    <span className="relative inline-flex shrink-0">
      <Icon className="h-5 w-5" strokeWidth={isActive ? 2.25 : 1.75} />
      {showAlertDot ? (
        <span
          className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5"
          aria-hidden
        >
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
          <span
            className={[
              'relative inline-flex h-2 w-2 rounded-full bg-blue-500',
              isActive ? 'ring-2 ring-[var(--brand-primary)]' : 'ring-2 ring-white',
            ].join(' ')}
          />
        </span>
      ) : null}
    </span>
  )
}

function SidebarComingSoonNavItem({
  label,
  icon: Icon,
}: {
  label: string
  icon: LucideIcon
}) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null)

  function showTooltip() {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) return
    setTooltipPos({
      top: rect.top + rect.height / 2,
      left: rect.right + 8,
    })
  }

  function hideTooltip() {
    setTooltipPos(null)
  }

  const tooltip =
    tooltipPos !== null
      ? createPortal(
          <div
            role="tooltip"
            style={{
              position: 'fixed',
              top: tooltipPos.top,
              left: tooltipPos.left,
              transform: 'translateY(-50%)',
              zIndex: 9999,
            }}
            className="pointer-events-none whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-[11px] font-medium text-white shadow-lg"
          >
            Em breve
            <span
              className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-gray-900"
              aria-hidden
            />
          </div>,
          document.body,
        )
      : null

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-disabled="true"
        className="flex w-full cursor-default items-center gap-3 rounded-xl bg-transparent px-4 py-3 text-sm font-medium transition hover:bg-gray-50/60"
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
      >
        <Icon className="h-5 w-5 shrink-0 text-gray-400" strokeWidth={1.75} />
        <span className="truncate text-gray-400">{label}</span>
      </button>
      {tooltip}
    </>
  )
}

export function SidebarNavItem({
  to,
  label,
  icon: Icon,
  end,
  comingSoon,
  showAlertDot,
}: SidebarNavItemProps) {
  if (comingSoon) {
    return <SidebarComingSoonNavItem label={label} icon={Icon} />
  }

  const linkTitle = showAlertDot ? `${label} — há mensagens não lidas` : label

  return (
    <NavLink
      to={to}
      end={end}
      title={linkTitle}
      aria-label={showAlertDot ? `${label}, mensagens não lidas` : label}
      className={({ isActive }) =>
        [
          'group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition',
          isActive
            ? 'bg-[var(--brand-primary)] text-white shadow-[0_4px_14px_rgba(255,107,0,0.35)]'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <SidebarNavIconWithAlertDot
            icon={Icon}
            showAlertDot={showAlertDot}
            isActive={isActive}
          />
          <span className="truncate">{label}</span>
        </>
      )}
    </NavLink>
  )
}
