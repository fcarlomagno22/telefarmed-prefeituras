import lottie from 'lottie-web'
import { useEffect, useRef } from 'react'

const successLottiePath = `${import.meta.env.BASE_URL}success.json`

export function PlantaoAceiteSuccessLottie() {
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
      path: successLottiePath,
    })

    return () => {
      animation.destroy()
      container.innerHTML = ''
    }
  }, [])

  return (
    <div
      ref={lottieRef}
      className="h-full w-full [&_svg]:h-full [&_svg]:w-full"
      aria-hidden
    />
  )
}
