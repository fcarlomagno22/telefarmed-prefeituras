type PrefeituraMonitorIllustrationProps = {
  className?: string
}

export function PrefeituraMonitorIllustration({ className = '' }: PrefeituraMonitorIllustrationProps) {
  return (
    <div
      className={[
        'flex min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50/70 to-white px-6 py-6">
        <img
          src="/monitoramento.png"
          alt=""
          aria-hidden
          className="h-auto w-[92%] max-h-[20rem] max-w-full object-contain object-center"
        />
      </div>
      <p className="shrink-0 rounded-b-2xl border-t border-gray-100 bg-white px-4 py-3 text-center text-[11px] leading-relaxed text-gray-500">
        <span className="font-semibold text-gray-600">Monitoramento:</span> acompanhe fila, consultas
        e terminais da rede em tempo real.
      </p>
    </div>
  )
}
