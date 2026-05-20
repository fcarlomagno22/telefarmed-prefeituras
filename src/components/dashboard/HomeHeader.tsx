import { useEffect, useState } from 'react'
import { brand } from '../../config/brand'
import { unitStation } from '../../data/unitDashboardMock'

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

export function HomeHeader() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
          {brand.dashboardTitle}
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">{unitStation.unitName}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 shadow-sm">
          {formatDate(now)}
        </div>
        <div className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 shadow-sm">
          {formatTime(now)}
        </div>
      </div>
    </header>
  )
}
