type SparklineProps = {
  data: number[]
  color?: string
  className?: string
}

export function Sparkline({
  data,
  color = 'var(--brand-primary)',
  className = '',
}: SparklineProps) {
  if (data.length < 2) return null

  const width = 120
  const height = 36
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width
      const y = height - ((value - min) / range) * (height - 4) - 2
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`h-9 w-full ${className}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  )
}
