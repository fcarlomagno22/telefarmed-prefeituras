import { BadgeCheck, ShieldAlert } from 'lucide-react'

export function DoctorConsultationStatusFooter() {
  return (
    <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 py-1">
      <p className="flex min-w-0 items-start gap-2 text-xs leading-relaxed text-amber-800">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" strokeWidth={2} />
        <span>
          Esta consulta não substitui o atendimento presencial. Em caso de urgência, procure a
          unidade de saúde mais próxima.
        </span>
      </p>
      <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-emerald-700">
        <BadgeCheck className="h-4 w-4" strokeWidth={2} />
        Conexão estável
      </span>
    </footer>
  )
}
