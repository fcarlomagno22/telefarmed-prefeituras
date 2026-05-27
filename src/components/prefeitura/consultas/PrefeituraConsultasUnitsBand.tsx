import { useLayoutEffect, useState, type ReactNode } from 'react'

type PrefeituraConsultasUnitsBandProps = {
  layoutKey?: string
  sidebar: ReactNode
  main: (fillHeight: boolean) => ReactNode
}

export function PrefeituraConsultasUnitsBand({
  layoutKey,
  sidebar,
  main,
}: PrefeituraConsultasUnitsBandProps) {
  const [fillHeight, setFillHeight] = useState(false)

  useLayoutEffect(() => {
    const sync = () => {
      setFillHeight(window.matchMedia('(min-width: 1280px)').matches)
    }

    sync()
    window.addEventListener('resize', sync)
    return () => window.removeEventListener('resize', sync)
  }, [layoutKey])

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 xl:flex-row xl:items-stretch xl:gap-4">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {main(fillHeight)}
      </div>
      <div className="flex w-full shrink-0 flex-col xl:h-full xl:w-[320px]">{sidebar}</div>
    </div>
  )
}
