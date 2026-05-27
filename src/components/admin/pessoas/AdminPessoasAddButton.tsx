import { Plus } from 'lucide-react'
import type { AdminPessoasTab } from './AdminPessoasTabs'

const addButtonLabels: Record<AdminPessoasTab, string> = {
  pacientes: 'Adicionar Paciente',
  medicos: 'Adicionar Profissional',
  operadores: 'Adicionar Operador',
}

type AdminPessoasAddButtonProps = {
  activeTab: AdminPessoasTab
  onClick: () => void
}

export function AdminPessoasAddButton({ activeTab, onClick }: AdminPessoasAddButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn-brand-gradient inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold sm:px-5"
    >
      <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
      {addButtonLabels[activeTab]}
    </button>
  )
}
