import { AdminClientesMainPanel } from '../components/admin/clientes/AdminClientesMainPanel'

export function AdminClientesPage() {
  return (
    <div
      className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
      aria-label="Gestão de clientes"
    >
      <AdminClientesMainPanel />
    </div>
  )
}
