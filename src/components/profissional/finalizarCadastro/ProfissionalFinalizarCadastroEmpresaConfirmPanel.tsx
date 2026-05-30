import { Building2, MapPin } from 'lucide-react'
import type { ProfissionalFinalizarCadastroEmpresaData } from '../../../types/profissionalFinalizarCadastro'

type ProfissionalFinalizarCadastroEmpresaConfirmPanelProps = {
  empresa: ProfissionalFinalizarCadastroEmpresaData
  confirmed: boolean
  onConfirmedChange: (confirmed: boolean) => void
  error?: string
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-gray-900">{value}</dd>
    </div>
  )
}

export function ProfissionalFinalizarCadastroEmpresaConfirmPanel({
  empresa,
  confirmed,
  onConfirmedChange,
  error,
}: ProfissionalFinalizarCadastroEmpresaConfirmPanelProps) {
  const endereco = [
    `${empresa.logradouro}, ${empresa.numero}`,
    empresa.complemento,
    empresa.bairro,
    `${empresa.cidade}/${empresa.uf}`,
    `CEP ${empresa.cep}`,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-xl border border-sky-100 bg-sky-50/90 px-3 py-2.5 text-xs leading-relaxed text-sky-900">
        <Building2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p>
          Consultamos os dados na Receita Federal com o CNPJ informado. Confira se estão corretos
          antes de continuar.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-gradient-to-b from-gray-50/90 to-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary-light)] text-[var(--brand-primary)]">
            <Building2 className="h-5 w-5" strokeWidth={2} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-primary)]">
              Dados da empresa
            </p>
            <p className="mt-1 text-base font-bold text-gray-900">{empresa.razaoSocial}</p>
            {empresa.nomeFantasia ? (
              <p className="mt-0.5 text-sm text-gray-600">{empresa.nomeFantasia}</p>
            ) : null}
          </div>
        </div>

        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <DataRow label="CNPJ" value={empresa.cnpj} />
          <DataRow label="Situação cadastral" value={empresa.situacaoCadastral} />
          <DataRow label="Abertura" value={empresa.dataAbertura} />
          <DataRow label="Natureza jurídica" value={empresa.naturezaJuridica} />
        </dl>

        <div className="mt-4 flex items-start gap-2 rounded-xl border border-gray-100 bg-white px-3 py-2.5">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" aria-hidden />
          <p className="text-xs leading-relaxed text-gray-600">{endereco}</p>
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-3">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => onConfirmedChange(event.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]/30"
        />
        <span className="text-xs leading-relaxed text-gray-700">
          Confirmo que os dados da empresa acima estão corretos e correspondem à minha pessoa
          jurídica prestadora de serviços.
        </span>
      </label>

      {error ? (
        <p className="text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
