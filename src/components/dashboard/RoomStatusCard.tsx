import { Video } from 'lucide-react'
import { rooms } from '../../data/dashboardMock'

const roomStatus = {
  available: { label: 'Disponível', className: 'bg-emerald-50 text-emerald-700' },
  busy: {
    label: 'Em atendimento',
    className: 'bg-[var(--brand-primary-light)] text-[var(--brand-primary)]',
  },
  maintenance: { label: 'Manutenção', className: 'bg-gray-100 text-gray-600' },
}

export function RoomStatusCard() {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800">Status das Salas</h2>
        <a
          href="#"
          className="text-xs font-medium text-[var(--brand-primary)] hover:underline"
        >
          Ver todas
        </a>
      </header>

      <ul className="mt-4 space-y-2.5">
        {rooms.map((room) => {
          const status = roomStatus[room.status]
          return (
            <li
              key={room.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-gray-50 bg-gray-50/50 px-3 py-2.5"
            >
              <span className="flex min-w-0 items-center gap-2">
                <Video className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={1.75} />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-gray-900">
                    {room.name}
                  </span>
                  <span className="block text-xs text-gray-500">{room.specialty}</span>
                </span>
              </span>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${status.className}`}
              >
                {status.label}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
