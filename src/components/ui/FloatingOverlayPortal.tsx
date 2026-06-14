import { type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { getFloatingOverlayRoot } from '../../config/overlayLayers'

type FloatingOverlayPortalProps = {
  children: ReactNode
}

export function FloatingOverlayPortal({ children }: FloatingOverlayPortalProps) {
  if (typeof document === 'undefined') return null
  return createPortal(children, getFloatingOverlayRoot())
}
