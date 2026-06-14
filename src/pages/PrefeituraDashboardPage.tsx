import { PrefeituraDashboardMainPanel } from '../components/prefeitura/PrefeituraDashboardMainPanel'

export function PrefeituraDashboardPage() {
  return (
    <div
      className="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
      aria-label="Dashboard municipal"
    >
      <PrefeituraDashboardMainPanel />
    </div>
  )
}
