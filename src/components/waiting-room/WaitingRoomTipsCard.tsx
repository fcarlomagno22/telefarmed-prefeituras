import lottie from 'lottie-web'
import { useEffect, useMemo, useRef, useState } from 'react'

type WaitingRoomTip = {
  id: string
  title: string
  body: React.ReactNode
  lottiePath: string
}

const tips: WaitingRoomTip[] = [
  {
    id: 'auto',
    title: 'Atenção',
    body: (
      <span className="waiting-tip-body" style={{ WebkitLineClamp: 4 }}>
        Fique atento(a): quando o profissional chamar, a consulta inicia automaticamente.
      </span>
    ),
    lottiePath: `${import.meta.env.BASE_URL}lotties/waiting-room-auto.json`,
  },
  {
    id: 'checklist',
    title: 'Checklist do paciente',
    body: (
      <ul className="waiting-tip-body mt-0.5 space-y-1" style={{ WebkitLineClamp: 4 }}>
        <li>Documento em mãos</li>
        <li>Ambiente silencioso</li>
        <li>Som ligado</li>
      </ul>
    ),
    lottiePath: `${import.meta.env.BASE_URL}lotties/waiting-room-checklist.json`,
  },
]

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

export function WaitingRoomTipsCard() {
  const [activeIndex, setActiveIndex] = useState(0)
  const tip = tips[activeIndex] ?? tips[0]
  const lottieRef = useRef<HTMLDivElement>(null)
  const tipRef = useRef(tip)
  const reducedMotion = useMemo(() => prefersReducedMotion(), [])

  useEffect(() => {
    tipRef.current = tip
  }, [tip])

  useEffect(() => {
    if (reducedMotion) return

    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % tips.length)
    }, 6000)

    return () => window.clearInterval(id)
  }, [reducedMotion])

  useEffect(() => {
    const container = lottieRef.current
    if (!container) return

    container.innerHTML = ''

    const animation = lottie.loadAnimation({
      container,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: tip.lottiePath,
    })

    return () => {
      animation.destroy()
      container.innerHTML = ''
    }
  }, [tip.lottiePath])

  return (
    <section className="overflow-hidden rounded-3xl border border-gray-200/70 bg-white/90 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur sm:p-5">
      <div className="flex h-full items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-primary-light)] ring-1 ring-[var(--brand-primary)]/10">
          <div ref={lottieRef} className="h-9 w-9 [&_svg]:h-9 [&_svg]:w-9" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {tip.title}
          </p>
          <div
            key={tip.id}
            className={[
              'mt-1 text-[13px] font-medium leading-snug text-gray-800 sm:text-sm',
              reducedMotion ? '' : 'animate-[waitingTipIn_550ms_ease-out]',
            ].join(' ')}
          >
            {tip.body}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes waitingTipIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0px); }
        }
        .waiting-tip-body {
          display: -webkit-box;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
    </section>
  )
}

