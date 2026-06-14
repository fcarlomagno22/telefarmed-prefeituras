import { useCallback, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { AdminBroadcast } from '../../../data/adminNotificacoesMock'
import { SituationStatusBadge } from '../../ui/SituationStatusBadge'
import {
  adminTargetChannelWidthClass,
  buildAdminTargetChannelBadge,
  getBroadcastUniqueChannels,
  type AdminBroadcastChannelKind,
} from './adminNotificacoesUi'

type TooltipPosition = {
  top: number
  left: number
}

function ChannelsTooltip({
  tooltipId,
  channels,
  position,
}: {
  tooltipId: string
  channels: AdminBroadcastChannelKind[]
  position: TooltipPosition
}) {
  return createPortal(
    <div
      id={tooltipId}
      role="tooltip"
      className="pointer-events-none fixed z-[120] -translate-x-1/2 -translate-y-full pb-2"
      style={{ top: position.top, left: position.left }}
    >
      <div className="relative rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 text-left shadow-xl">
        <span
          className="absolute left-1/2 top-full -translate-x-1/2 border-[6px] border-transparent border-t-gray-900"
          aria-hidden
        />
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
          Canais
        </p>
        <ul className="space-y-1">
          {channels.map((channel) => {
            const config = buildAdminTargetChannelBadge(channel)
            return (
              <li key={channel} className="text-xs font-medium text-white">
                {config.label}
              </li>
            )
          })}
        </ul>
      </div>
    </div>,
    document.body,
  )
}

function ChannelsTooltipTrigger({
  channels,
  children,
}: {
  channels: AdminBroadcastChannelKind[]
  children: ReactNode
}) {
  const tooltipId = useId()
  const triggerRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<TooltipPosition | null>(null)

  const showTooltip = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    setPosition({ top: rect.top, left: rect.left + rect.width / 2 })
  }, [])

  const hideTooltip = useCallback(() => {
    setPosition(null)
  }, [])

  return (
    <>
      <div
        ref={triggerRef}
        className="inline-flex cursor-default items-center justify-center gap-1"
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        aria-describedby={position ? tooltipId : undefined}
        tabIndex={0}
      >
        {children}
      </div>
      {position ? (
        <ChannelsTooltip tooltipId={tooltipId} channels={channels} position={position} />
      ) : null}
    </>
  )
}

type AdminBroadcastChannelsCellProps = {
  broadcast: AdminBroadcast
}

export function AdminBroadcastChannelsCell({ broadcast }: AdminBroadcastChannelsCellProps) {
  const channels = getBroadcastUniqueChannels(broadcast)

  if (channels.length === 0) {
    return <span className="text-xs text-gray-400">—</span>
  }

  const firstChannel = channels[0]
  const extraCount = channels.length - 1
  const firstBadge = buildAdminTargetChannelBadge(firstChannel)

  if (extraCount === 0) {
    return (
      <div className="flex justify-center">
        <SituationStatusBadge
          config={firstBadge}
          widthClass={adminTargetChannelWidthClass(firstChannel)}
        />
      </div>
    )
  }

  return (
    <div className="flex justify-center">
      <ChannelsTooltipTrigger channels={channels}>
        <SituationStatusBadge
          config={firstBadge}
          widthClass={adminTargetChannelWidthClass(firstChannel)}
        />
        <span className="text-[11px] font-semibold tabular-nums text-gray-500">
          +({extraCount})
        </span>
      </ChannelsTooltipTrigger>
    </div>
  )
}
