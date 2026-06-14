import lottie from 'lottie-web'
import { useEffect, useRef } from 'react'

const contactEmailLottiePath = `${import.meta.env.BASE_URL}contact-email.json`
const COMPLETE_FALLBACK_MS = 5000

type UbtPasswordRecoveryContactEmailLottieProps = {
  className?: string
  loop?: boolean
  onComplete?: () => void
}

export function UbtPasswordRecoveryContactEmailLottie({
  className = 'h-52 w-52 shrink-0 [&_svg]:h-full [&_svg]:w-full',
  loop = false,
  onComplete,
}: UbtPasswordRecoveryContactEmailLottieProps) {
  const lottieRef = useRef<HTMLDivElement>(null)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    const container = lottieRef.current
    if (!container) return

    container.innerHTML = ''
    let completed = false

    function finish() {
      if (completed) return
      completed = true
      onCompleteRef.current?.()
    }

    const animation = lottie.loadAnimation({
      container,
      renderer: 'svg',
      loop,
      autoplay: true,
      path: contactEmailLottiePath,
    })

    animation.addEventListener('complete', finish)

    const fallback = window.setTimeout(finish, COMPLETE_FALLBACK_MS)

    return () => {
      window.clearTimeout(fallback)
      animation.removeEventListener('complete', finish)
      animation.destroy()
      container.innerHTML = ''
    }
  }, [loop])

  return <div ref={lottieRef} className={className} aria-hidden />
}
