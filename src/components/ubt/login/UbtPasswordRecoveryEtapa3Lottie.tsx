import lottie from 'lottie-web'
import { useEffect, useRef } from 'react'

const etapa3LottiePath = `${import.meta.env.BASE_URL}etapa_3.json`

type UbtPasswordRecoveryEtapa3LottieProps = {
  className?: string
  loop?: boolean
}

export function UbtPasswordRecoveryEtapa3Lottie({
  className = 'h-28 w-28 shrink-0 [&_svg]:h-full [&_svg]:w-full',
  loop = true,
}: UbtPasswordRecoveryEtapa3LottieProps) {
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
      path: etapa3LottiePath,
    })

    return () => {
      animation.destroy()
      container.innerHTML = ''
    }
  }, [loop])

  return <div ref={lottieRef} className={className} aria-hidden />
}
