import { Plus } from 'lucide-react'

type AdminClientesToolbarProps = {
  onNovaEntidade: () => void
}

export function AdminClientesToolbar({ onNovaEntidade }: AdminClientesToolbarProps) {
  return (
    <section
      className="min-w-0 w-full overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.04)]"
      aria-label="Filtros e ações"
    >
      <div className="flex justify-end p-4">
        <button
          type="button"
          onClick={onNovaEntidade}
          className="btn-brand-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Novo cliente
        </button>
      </div>
    </section>
  )
}
