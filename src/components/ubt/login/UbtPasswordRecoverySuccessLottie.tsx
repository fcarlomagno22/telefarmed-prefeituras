import lottie from 'lottie-web'
import { useEffect, useRef } from 'react'

const successLottiePath = `${import.meta.env.BASE_URL}success.json`

type UbtPasswordRecoverySuccessLottieProps = {
  className?: string
}

export function UbtPasswordRecoverySuccessLottie({
  className = 'h-52 w-52 shrink-0 [&_svg]:h-full [&_svg]:w-full',
}: UbtPasswordRecoverySuccessLottieProps) {
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

  return <div ref={lottieRef} className={className} aria-hidden />
}
