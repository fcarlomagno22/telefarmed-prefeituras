import { Zap } from 'lucide-react'

type PrefeituraRedeQuickActionsButtonProps = {
  onOpen: () => void
}

export function PrefeituraRedeQuickActionsButton({ onOpen }: PrefeituraRedeQuickActionsButtonProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-800 transition hover:border-gray-300 hover:bg-gray-50"
    >
      <Zap className="h-4 w-4 text-[var(--brand-primary)]" strokeWidth={2} />
      Ações rápidas
    </button>
  )
}
