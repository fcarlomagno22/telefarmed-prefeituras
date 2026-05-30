import { ChevronDown, ChevronUp, Plus, Trash2, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { adminEscalaDoctorOptions } from '../../../data/adminEscalaMock'
import { CustomSelect } from '../../ui/CustomSelect'
import { escalaComposeCardClass } from './adminEscalaComposePremium'
import { getAdminEscalaDoctorLabel } from './adminEscalaUi'

type AdminEscalaBackupQueueEditorProps = {
  primaryDoctorId: string
  backupDoctorIds: string[]
  onBackupDoctorIdsChange: (ids: string[]) => void
  className?: string
  variant?: 'default' | 'premium'
}

export function AdminEscalaBackupQueueEditor({
  primaryDoctorId,
  backupDoctorIds,
  onBackupDoctorIdsChange,
  className = '',
  variant = 'default',
}: AdminEscalaBackupQueueEditorProps) {
  const [addBackupId, setAddBackupId] = useState('')
  const isPremium = variant === 'premium'

  const backupOptions = useMemo(() => {
    const used = new Set([primaryDoctorId, ...backupDoctorIds])
    return adminEscalaDoctorOptions.filter((d) => !used.has(d.value))
  }, [primaryDoctorId, backupDoctorIds])

  function moveBackup(index: number, direction: -1 | 1) {
    const next = [...backupDoctorIds]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    onBackupDoctorIdsChange(next)
  }

  const shellClass = isPremium
    ? [escalaComposeCardClass, 'p-5', className].join(' ')
    : ['rounded-xl border border-amber-200/80 bg-amber-50/40 p-4', className].join(' ')

  return (
    <div className={shellClass}>
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
          <Users className="h-4 w-4" strokeWidth={2} />
        </span>
        <div>
          <p className="text-sm font-bold text-gray-900">Fila de reserva</p>
          <p className="text-xs text-gray-500">Ordem de acionamento se o titular faltar</p>
        </div>
      </div>

      {backupDoctorIds.length === 0 ? (
        <p className="rounded-xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-500 ring-1 ring-gray-200/60">
          Nenhum substituto — adicione abaixo.
        </p>
      ) : (
        <ol className="space-y-2">
          {backupDoctorIds.map((doctorId, index) => (
            <li
              key={`${doctorId}-${index}`}
              className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-3 ring-1 ring-gray-200/70"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-900 text-xs font-bold text-white">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1 text-sm font-semibold text-gray-900">
                {getAdminEscalaDoctorLabel(doctorId)}
              </span>
              <div className="flex shrink-0 gap-0.5">
                <button
                  type="button"
                  onClick={() => moveBackup(index, -1)}
                  disabled={index === 0}
                  className="rounded-lg p-1.5 text-gray-500 hover:bg-white disabled:opacity-30"
                  aria-label="Subir"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveBackup(index, 1)}
                  disabled={index === backupDoctorIds.length - 1}
                  className="rounded-lg p-1.5 text-gray-500 hover:bg-white disabled:opacity-30"
                  aria-label="Descer"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onBackupDoctorIdsChange(backupDoctorIds.filter((_, i) => i !== index))
                  }
                  className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                  aria-label="Remover"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-4 flex gap-2">
        <div className="min-w-0 flex-1">
          <CustomSelect
            value={addBackupId}
            onChange={setAddBackupId}
            options={[
              { value: '', label: 'Escolher médico substituto…' },
              ...backupOptions.map((d) => ({
                value: d.value,
                label: `${d.label} · ${d.specialty}`,
              })),
            ]}
          />
        </div>
        <button
          type="button"
          onClick={() => {
            if (!addBackupId) return
            onBackupDoctorIdsChange([...backupDoctorIds, addBackupId])
            setAddBackupId('')
          }}
          disabled={!addBackupId}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
          Adicionar
        </button>
      </div>
    </div>
  )
}
