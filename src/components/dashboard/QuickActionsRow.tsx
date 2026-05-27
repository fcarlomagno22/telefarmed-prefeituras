import {
  ArrowRight,
  CalendarPlus,
  DoorOpen,
  Printer,
  Search,
  Siren,
  Stethoscope,
} from 'lucide-react'
import { quickActions } from '../../data/dashboardMock'

const actionIcons = [
  Stethoscope,
  CalendarPlus,
  DoorOpen,
  Printer,
  Search,
  Siren,
]

export function QuickActionsRow() {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-gray-800">Ações Rápidas</h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {quickActions.map((action, index) => {
          const Icon = actionIcons[index] ?? Stethoscope
          return (
            <li key={action.id}>
              <button
                type="button"
                className="group relative flex h-full min-h-[108px] w-full flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-4 text-center shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)] transition hover:border-[var(--brand-primary)]/20 hover:shadow-md"
              >
                <Icon
                  className="mb-2 h-6 w-6 text-[var(--brand-primary)]"
                  strokeWidth={1.75}
                />
                <span className="text-xs font-medium leading-snug text-gray-700">
                  {action.label}
                </span>
                <span className="absolute bottom-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brand-primary)] text-white shadow-sm">
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
