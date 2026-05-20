import { brand } from '../../config/brand'
import { FLUXO_CARD_HEIGHT_CLASS } from '../../constants/dashboardCards'
import { doctorsOnline } from '../../data/dashboardMock'

const statusConfig = {
  online: { label: 'Online', dot: 'bg-emerald-500', text: 'text-emerald-600' },
  consulting: {
    label: 'Em consulta',
    dot: 'bg-[var(--brand-primary)]',
    text: 'text-[var(--brand-primary)]',
  },
}

export function DoctorsOnlineCard() {
  return (
    <section
      className={`relative flex ${FLUXO_CARD_HEIGHT_CLASS} flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]`}
    >
      <h2 className="relative z-10 shrink-0 text-sm font-semibold text-gray-800">
        Médicos Online
      </h2>

      <ul className="relative z-10 mt-4 min-h-0 flex-1 w-full space-y-3 overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {doctorsOnline.map((doctor) => {
          const status = statusConfig[doctor.status]
          return (
            <li key={doctor.id} className="flex w-full items-center gap-3">
              <img
                src={doctor.avatar}
                alt=""
                className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-gray-100"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-gray-900">
                  {doctor.name}
                </span>
                <span className="block truncate text-xs text-gray-500">
                  {doctor.specialty}
                </span>
              </span>
              <span
                className={`flex shrink-0 items-center gap-1 text-[10px] font-medium ${status.text}`}
              >
                <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                {status.label}
              </span>
            </li>
          )
        })}
      </ul>

      <footer className="relative z-10 mt-2 flex shrink-0 justify-end pt-1">
        <a
          href="#"
          className="text-xs font-medium text-[var(--brand-primary)] transition hover:underline"
        >
          Ver todos
        </a>
      </footer>

      <img
        src={brand.dashboardDoctorsImageUrl}
        alt=""
        className="pointer-events-none absolute -right-10 bottom-0 z-0 h-[300px] w-auto max-w-none translate-y-6 object-contain object-right-bottom opacity-50 sm:-right-8 sm:h-[320px] lg:h-[360px]"
      />
    </section>
  )
}
