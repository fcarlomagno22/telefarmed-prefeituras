import lottie from 'lottie-web'
import { useEffect, useRef } from 'react'
import successAnimationData from '../../../assets/lotties/success.json'

export function ClosureSuccessLottie() {
  const lottieRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = lottieRef.current
    if (!container) return

    container.innerHTML = ''

    const animation = lottie.loadAnimation({
      container,
      renderer: 'svg',
      loop: false,
      autoplay: true,
      animationData: successAnimationData,
    })

    return () => {
      animation.destroy()
      container.innerHTML = ''
    }
  }, [])

  return (
    <div
      ref={lottieRef}
      className="h-[220px] w-[220px] shrink-0 [&_svg]:h-full [&_svg]:w-full"
      aria-hidden
    />
  )
}
