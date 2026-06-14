import { BadgeCheck } from 'lucide-react'
import type { ProfissionalFinalizarCadastroProfissionalData } from '../../../types/profissionalFinalizarCadastro'
import { maskCpfForDisplay } from '../../../utils/lgpdDisplay'

type ProfissionalFinalizarCadastroIdentidadePanelProps = {
  profissional: ProfissionalFinalizarCadastroProfissionalData
}

export function ProfissionalFinalizarCadastroIdentidadePanel({
  profissional,
}: ProfissionalFinalizarCadastroIdentidadePanelProps) {
  return (
    <section
      className="rounded-xl border border-emerald-200/90 bg-gradient-to-b from-emerald-50/90 to-white px-4 py-3 text-center shadow-sm"
      aria-label="Profissional identificado"
    >
      <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-emerald-800">
        <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
        Candidatura identificada
      </div>
      <p className="mt-2 text-base font-bold text-gray-900">{profissional.fullName}</p>
      <dl className="mt-2 space-y-1 text-xs text-gray-600">
        <div>
          <dt className="sr-only">CPF</dt>
          <dd>
            CPF{' '}
            <span className="font-semibold text-gray-800">{maskCpfForDisplay(profissional.cpf)}</span>
          </dd>
        </div>
        <div>
          <dt className="sr-only">Profissão</dt>
          <dd>
            Profissão{' '}
            <span className="font-semibold text-gray-800">{profissional.professionLabel}</span>
          </dd>
        </div>
      </dl>
    </section>
  )
}
