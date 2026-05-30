import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from 'react'

export type LandingRevealVariant =
  | 'fade-up'
  | 'fade-down'
  | 'fade-left'
  | 'fade-right'
  | 'scale'

type LandingRevealProps = {
  children: ReactNode
  className?: string
  variant?: LandingRevealVariant
  /** Atraso em ms antes da animação iniciar. */
  delay?: number
  /** Anima na montagem (conteúdo acima da dobra). */
  eager?: boolean
  as?: ElementType
}

export function LandingReveal({
  children,
  className = '',
  variant = 'fade-up',
  delay = 0,
  eager = false,
  as: Tag = 'div',
}: LandingRevealProps) {
  const ref = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (eager) {
      const timer = window.setTimeout(() => setVisible(true), 40)
      return () => window.clearTimeout(timer)
    }

    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        setVisible(true)
        observer.disconnect()
      },
      { threshold: 0.12, rootMargin: '0px 0px -32px 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [eager])

  const style = {
    '--landing-reveal-delay': `${delay}ms`,
  } as CSSProperties

  return (
    <Tag
      ref={ref}
      className={[
        'landing-reveal',
        `landing-reveal--${variant}`,
        visible && 'landing-reveal--visible',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      {children}
    </Tag>
  )
}
