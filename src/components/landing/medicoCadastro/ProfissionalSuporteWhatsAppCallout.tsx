import { MessageCircle } from 'lucide-react'
import { PROFISSIONAL_SUPORTE_WHATSAPP_URL } from '../../../config/profissionalSuporte'

type ProfissionalSuporteWhatsAppCalloutProps = {
  className?: string
}

export function ProfissionalSuporteWhatsAppCallout({
  className = '',
}: ProfissionalSuporteWhatsAppCalloutProps) {
  return (
    <div
      className={`rounded-2xl border border-orange-100/90 bg-gradient-to-br from-orange-50/80 to-white px-4 py-4 text-left shadow-sm ring-1 ring-orange-100/60 ${className}`.trim()}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-[var(--brand-primary)]">
          <MessageCircle className="h-4 w-4" strokeWidth={2.25} aria-hidden />
        </span>
        <div>
          <p className="text-sm font-semibold text-gray-900">Precisa de ajuda?</p>
          <p className="mt-1 text-sm leading-relaxed text-gray-600">
            Fale com nosso{' '}
            <a
              href={PROFISSIONAL_SUPORTE_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[var(--brand-primary)] underline decoration-[var(--brand-primary)]/35 underline-offset-2 transition hover:text-[var(--brand-primary-hover)] hover:decoration-[var(--brand-primary)]"
            >
              suporte ao profissional
            </a>{' '}
            pelo WhatsApp.
          </p>
        </div>
      </div>
    </div>
  )
}
