import { useEffect, useState, type ReactNode } from 'react'
import { View, type LayoutChangeEvent } from 'react-native'

type RunWalkHistoryRevealSectionProps = {
  scrollY: number
  viewportHeight: number
  active?: boolean
  revealImmediately?: boolean
  children: (revealed: boolean) => ReactNode
}

export function RunWalkHistoryRevealSection({
  scrollY,
  viewportHeight,
  active = true,
  revealImmediately = false,
  children,
}: RunWalkHistoryRevealSectionProps) {
  const [layout, setLayout] = useState({ y: 0, height: 0 })
  const [revealed, setRevealed] = useState(revealImmediately)

  useEffect(() => {
    if (!active) {
      setRevealed(false)
      return
    }

    if (revealImmediately) {
      setRevealed(true)
      return
    }

    setRevealed(false)
  }, [active, revealImmediately])

  useEffect(() => {
    if (!active || revealImmediately || revealed || viewportHeight <= 0 || layout.height <= 0) {
      return
    }

    const margin = 72
    const visibleTop = scrollY + margin
    const visibleBottom = scrollY + viewportHeight - margin
    const sectionTop = layout.y
    const sectionBottom = layout.y + layout.height
    const visibleHeight =
      Math.min(sectionBottom, visibleBottom) - Math.max(sectionTop, visibleTop)
    const minVisibleHeight = Math.min(96, layout.height * 0.28)

    if (visibleHeight >= minVisibleHeight) {
      setRevealed(true)
    }
  }, [active, layout, revealed, revealImmediately, scrollY, viewportHeight])

  function handleLayout(event: LayoutChangeEvent) {
    setLayout({
      y: event.nativeEvent.layout.y,
      height: event.nativeEvent.layout.height,
    })
  }

  return <View onLayout={handleLayout}>{children(revealed)}</View>
}
