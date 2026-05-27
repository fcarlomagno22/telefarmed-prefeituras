type PrefeituraConsultasIllustrationProps = {
  className?: string
}

export function PrefeituraConsultasIllustration({
  className = '',
}: PrefeituraConsultasIllustrationProps) {
  return (
    <section
      className={[
        'flex min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex min-h-0 flex-1 items-end justify-center overflow-hidden bg-gradient-to-b from-slate-50/70 to-white px-4 pt-5 pb-3">
        <img
          src="/consultas_dash.png"
          alt="Ilustração de consulta de telemedicina"
          className="h-full max-h-full w-full max-w-[280px] object-contain object-bottom"
        />
      </div>
    </section>
  )
}
