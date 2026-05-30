import { MapPin } from 'lucide-react'
import type { AdminEscalaUbtScope } from '../../../types/adminEscala'
import { defaultLocationForUbt } from '../../../utils/escala/normalizeAdminEscalaShift'

export type PresencialLocationValues = {
  unitName: string
  city: string
  cityUf: string
  fullAddress: string | null
}

type AdminEscalaPresencialLocationFieldsProps = {
  values: PresencialLocationValues
  onChange: (patch: Partial<PresencialLocationValues>) => void
  inputClass: string
  ubtScope?: AdminEscalaUbtScope
}

export function applyPresencialLocationFromUbtScope(
  ubtScope: AdminEscalaUbtScope,
  current?: Partial<PresencialLocationValues>,
): PresencialLocationValues {
  const loc = defaultLocationForUbt(ubtScope.mode === 'selected' ? ubtScope.ubtIds[0] : undefined)
  return {
    unitName: current?.unitName?.trim() || loc.unitName,
    city: current?.city?.trim() || loc.city,
    cityUf: current?.cityUf?.trim() || loc.cityUf,
    fullAddress: current?.fullAddress?.trim() ? current.fullAddress : loc.fullAddress,
  }
}

export function AdminEscalaPresencialLocationFields({
  values,
  onChange,
  inputClass,
  ubtScope,
}: AdminEscalaPresencialLocationFieldsProps) {
  const fillFromUbt =
    ubtScope?.mode === 'selected' && ubtScope.ubtIds.length === 1

  return (
    <div className="rounded-xl border border-sky-200/80 bg-sky-50/40 p-3">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" aria-hidden />
          <div>
            <p className="text-xs font-bold text-gray-900">Local do atendimento presencial</p>
            <p className="mt-0.5 text-[11px] text-gray-600">
              O endereço aparece no portal do profissional (tooltip da cidade).
            </p>
          </div>
        </div>
        {fillFromUbt ? (
          <button
            type="button"
            onClick={() => onChange(applyPresencialLocationFromUbtScope(ubtScope, values))}
            className="shrink-0 text-[11px] font-semibold text-[var(--brand-primary)] hover:underline"
          >
            Usar UBT selecionada
          </button>
        ) : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-[11px] font-semibold text-gray-600">
            Nome do local / UBT <span className="text-red-500">*</span>
          </p>
          <input
            type="text"
            required
            value={values.unitName}
            onChange={(e) => onChange({ unitName: e.target.value })}
            placeholder="Ex.: UBT Saúde Central"
            className={inputClass}
          />
        </div>
        <div>
          <p className="mb-1 text-[11px] font-semibold text-gray-600">
            Cidade <span className="text-red-500">*</span>
          </p>
          <input
            type="text"
            required
            value={values.city}
            onChange={(e) =>
              onChange({
                city: e.target.value,
                cityUf: values.cityUf?.includes('/') ? values.cityUf : e.target.value,
              })
            }
            placeholder="Ex.: São Paulo"
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <p className="mb-1 text-[11px] font-semibold text-gray-600">
            Endereço completo <span className="text-red-500">*</span>
          </p>
          <input
            type="text"
            required
            value={values.fullAddress ?? ''}
            onChange={(e) => onChange({ fullAddress: e.target.value })}
            placeholder="Rua, número, bairro, cidade — UF, CEP"
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <p className="mb-1 text-[11px] font-semibold text-gray-600">Exibição (UF)</p>
          <input
            type="text"
            value={values.cityUf}
            onChange={(e) => onChange({ cityUf: e.target.value })}
            placeholder="Ex.: São Paulo / SP"
            className={inputClass}
          />
        </div>
      </div>
    </div>
  )
}

export function validatePresencialLocation(values: PresencialLocationValues): string | null {
  if (!values.unitName.trim()) return 'Informe o nome do local ou UBT.'
  if (!values.city.trim()) return 'Informe a cidade do plantão presencial.'
  if (!values.fullAddress?.trim()) return 'Informe o endereço completo do plantão presencial.'
  return null
}
