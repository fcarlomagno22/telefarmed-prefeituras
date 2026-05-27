type PrefeituraRedeIllustrationProps = {
  className?: string
}

export function PrefeituraRedeIllustration({ className = '' }: PrefeituraRedeIllustrationProps) {
  return (
    <div
      className={[
        'flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex min-h-0 flex-1 items-end justify-center overflow-hidden bg-gradient-to-b from-slate-50/70 to-white px-4 pt-5 pb-2">
        <img
          src="/pref-rede.png"
          alt=""
          aria-hidden
          className="h-full max-h-[min(100%,22rem)] w-full max-w-[300px] min-h-[9rem] object-contain object-bottom"
        />
      </div>
      <p className="shrink-0 rounded-b-2xl border-t border-gray-100 bg-white px-4 py-3 text-center text-[11px] leading-relaxed text-gray-500">
        <span className="font-semibold text-gray-600">Dica:</span> Clique em uma unidade para
        visualizar o dashboard detalhado.
      </p>
    </div>
  )
}
