import lottie from 'lottie-web'
import { useEffect, useRef } from 'react'

const successLottiePath = `${import.meta.env.BASE_URL}success.json`
const errorLottiePath = `${import.meta.env.BASE_URL}ErrorX.json`

type PrefeituraFaturamentoReavaliacaoLottieProps = {
  variant: 'success' | 'error'
  className?: string
}

export function PrefeituraFaturamentoReavaliacaoLottie({
  variant,
  className = 'h-[180px] w-[180px] shrink-0 [&_svg]:h-full [&_svg]:w-full',
}: PrefeituraFaturamentoReavaliacaoLottieProps) {
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
      path: variant === 'success' ? successLottiePath : errorLottiePath,
    })

    return () => {
      animation.destroy()
      container.innerHTML = ''
    }
  }, [variant])

  return <div ref={lottieRef} className={className} aria-hidden />
}
