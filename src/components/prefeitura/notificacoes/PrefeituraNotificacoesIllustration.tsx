type PrefeituraNotificacoesIllustrationProps = {
  className?: string
}

export function PrefeituraNotificacoesIllustration({
  className = '',
}: PrefeituraNotificacoesIllustrationProps) {
  return (
    <section
      className={[
        'relative aspect-square w-full shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div
        className="absolute inset-0 bg-gradient-to-br from-[var(--brand-primary-light)]/50 via-white to-orange-50/60"
        aria-hidden
      />
      <div className="relative flex h-full w-full items-center justify-center p-5">
        <img
          src="/mensagem_broad.png"
          alt="Ilustração de comunicação com a rede"
          className="max-h-[88%] max-w-[88%] object-contain"
        />
      </div>
    </section>
  )
}
