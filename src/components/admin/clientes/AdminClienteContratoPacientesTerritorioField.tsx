import type { TipoEntidade } from '../../../types/entidadeBranding'
import { isPrefeituraEntidadeTipo } from '../../../config/adminEntidadeTipo'

type AdminClienteContratoPacientesTerritorioFieldProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  entidadeTipo?: TipoEntidade
  className?: string
}

export function AdminClienteContratoPacientesTerritorioField({
  checked,
  onChange,
  entidadeTipo,
  className = '',
}: AdminClienteContratoPacientesTerritorioFieldProps) {
  if (!isPrefeituraEntidadeTipo(entidadeTipo)) {
    return null
  }

  return (
    <section className={`rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 ${className}`.trim()}>
      <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">Cadastro de pacientes</h3>
      <p className="mt-1 text-xs text-gray-500">
        Define se pacientes de outros municípios podem ser cadastrados neste contrato.
      </p>
      <label className="mt-3 flex items-start gap-2 rounded-lg border border-gray-200 px-3 py-2">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="text-sm text-gray-800">
          <span className="font-medium">Aceitar pacientes de outros municípios</span>
          <span className="mt-0.5 block text-xs text-gray-600">
            Quando desmarcado, apenas moradores do município contratante podem ser cadastrados.
          </span>
        </span>
      </label>
    </section>
  )
}
