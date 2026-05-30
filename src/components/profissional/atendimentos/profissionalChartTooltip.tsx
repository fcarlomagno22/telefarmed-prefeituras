import { useCallback, useState, type FocusEvent, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'

export type ChartTooltipState = {
  title: string
  description: string
  top: number
  left: number
} | null

export function ChartTooltipPortal({ tooltip }: { tooltip: ChartTooltipState }) {
  if (!tooltip) return null

  return createPortal(
    <div
      role="tooltip"
      style={{
        position: 'fixed',
        top: tooltip.top,
        left: tooltip.left,
        transform: 'translate(-50%, calc(-100% - 8px))',
        zIndex: 10000,
      }}
      className="pointer-events-none max-w-[15rem] rounded-lg bg-gray-900 px-3 py-2 text-[11px] leading-snug text-white shadow-lg"
    >
      <p className="font-semibold text-white">{tooltip.title}</p>
      <p className="mt-0.5 font-normal text-gray-300">{tooltip.description}</p>
      <span
        className="absolute left-1/2 top-full -translate-x-1/2 border-[6px] border-transparent border-t-gray-900"
        aria-hidden
      />
    </div>,
    document.body,
  )
}

export function useChartTooltip() {
  const [tooltip, setTooltip] = useState<ChartTooltipState>(null)

  const show = useCallback((target: HTMLElement, title: string, description: string) => {
    const rect = target.getBoundingClientRect()
    setTooltip({
      title,
      description,
      top: rect.top,
      left: rect.left + rect.width / 2,
    })
  }, [])

  const hide = useCallback(() => setTooltip(null), [])

  const bind = useCallback(
    (title: string, description: string) => ({
      onMouseEnter: (event: MouseEvent<HTMLElement>) => {
        show(event.currentTarget, title, description)
      },
      onMouseLeave: hide,
      onFocus: (event: FocusEvent<HTMLElement>) => {
        show(event.currentTarget, title, description)
      },
      onBlur: hide,
    }),
    [show, hide],
  )

  return { tooltip, show, hide, bind }
}
