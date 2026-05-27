import { Skeleton } from '../../ui/Skeleton'

/** Espelha o SVG de PrefeituraConsultasDailyChart (280×96, h-[6rem]). */
export function PrefeituraConsultasDailyChartSkeleton() {
  return (
    <div className="flex animate-pulse flex-col" aria-hidden>
      <svg
        viewBox="0 0 280 96"
        className="h-[6rem] w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {[34, 58].map((y) => (
          <line
            key={y}
            x1={28}
            x2={272}
            y1={y}
            y2={y}
            stroke="#e5e7eb"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        ))}
        <path
          d="M 28 70 L 52 52 L 96 48 L 140 38 L 184 42 L 228 28 L 272 34 L 272 70 Z"
          fill="#e5e7eb"
        />
        <path
          d="M 28 70 L 52 52 L 96 48 L 140 38 L 184 42 L 228 28 L 272 34"
          fill="none"
          stroke="#d1d5db"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {[52, 96, 140, 184, 228, 272].map((x) => (
          <rect key={x} x={x - 8} y={82} width={16} height={6} rx={2} fill="#e5e7eb" />
        ))}
      </svg>
      <Skeleton className="mt-2 h-[1.625rem] w-full rounded-full" />
    </div>
  )
}
