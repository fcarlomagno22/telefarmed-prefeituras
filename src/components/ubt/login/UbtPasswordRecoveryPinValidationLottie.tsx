import lottie from 'lottie-web'
import { useEffect, useRef } from 'react'

const pinValidationLottiePath = `${import.meta.env.BASE_URL}PIN_validation.json`

type UbtPasswordRecoveryPinValidationLottieProps = {
  className?: string
  loop?: boolean
}

export function UbtPasswordRecoveryPinValidationLottie({
  className = 'h-28 w-28 shrink-0 [&_svg]:h-full [&_svg]:w-full',
  loop = true,
}: UbtPasswordRecoveryPinValidationLottieProps) {
  const lottieRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = lottieRef.current
    if (!container) return

    container.innerHTML = ''

    const animation = lottie.loadAnimation({
      container,
      renderer: 'svg',
      loop,
      autoplay: true,
      path: pinValidationLottiePath,
    })

    return () => {
      animation.destroy()
      container.innerHTML = ''
    }
  }, [loop])

  return <div ref={lottieRef} className={className} aria-hidden />
}
