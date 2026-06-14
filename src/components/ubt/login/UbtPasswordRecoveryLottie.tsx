import lottie from 'lottie-web'
import { useEffect, useRef } from 'react'

const ubtPasswordRecoveryLottiePath = `${import.meta.env.BASE_URL}new_pass.json`

type UbtPasswordRecoveryLottieProps = {
  className?: string
  loop?: boolean
}

export function UbtPasswordRecoveryLottie({
  className = 'h-28 w-28 shrink-0 [&_svg]:h-full [&_svg]:w-full',
  loop = true,
}: UbtPasswordRecoveryLottieProps) {
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
      path: ubtPasswordRecoveryLottiePath,
    })

    return () => {
      animation.destroy()
      container.innerHTML = ''
    }
  }, [loop])

  return <div ref={lottieRef} className={className} aria-hidden />
}
