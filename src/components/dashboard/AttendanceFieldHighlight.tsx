import type { ReactNode } from 'react'

type AttendanceFieldHighlightProps = {
  highlight?: boolean
  children: ReactNode
  className?: string
}

export function AttendanceFieldHighlight({
  highlight = false,
  children,
  className = '',
}: AttendanceFieldHighlightProps) {
  return (
    <div
      className={`rounded-xl transition-shadow duration-300 ${
        highlight
          ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-white shadow-[0_0_12px_rgba(251,191,36,0.45)]'
          : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}
