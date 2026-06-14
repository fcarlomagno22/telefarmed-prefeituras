import { ChevronDown } from 'lucide-react'

type ProfissionalFinalizarCadastroScrollHintProps = {
  visible: boolean
  label?: string
}

export function ProfissionalFinalizarCadastroScrollHint({
  visible,
  label = 'Role para ver mais',
}: ProfissionalFinalizarCadastroScrollHintProps) {
  if (!visible) return null

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center bg-gradient-to-t from-white via-white/95 to-transparent px-4 pb-4 pt-12 motion-reduce:opacity-90"
      aria-hidden
    >
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-900/80 px-3 py-1.5 text-[11px] font-semibold text-white shadow-md backdrop-blur-sm">
        <ChevronDown className="h-3.5 w-3.5 motion-safe:animate-bounce" />
        {label}
      </span>
    </div>
  )
}
