import lottie from 'lottie-web'
import { useEffect, useRef } from 'react'

const successDoctorLottiePath = `${import.meta.env.BASE_URL}lotties/success_doctor.json`

export function MedicoCadastroSuccessLottie() {
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
      path: successDoctorLottiePath,
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
