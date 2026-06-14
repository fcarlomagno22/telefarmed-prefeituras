import { Plus } from 'lucide-react'

type AdminPessoasAddButtonProps = {
  label: string
  onClick: () => void
}

export function AdminPessoasAddButton({ label, onClick }: AdminPessoasAddButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn-brand-gradient inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold sm:px-5"
    >
      <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
      {label}
    </button>
  )
}
