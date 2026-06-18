import { ImagePlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { resolveEntidadeTipoOrDefault } from '../../../config/adminEntidadeTipo'
import type { AdminClienteRow } from '../../../types/adminClientes'
import { EntidadeLogoCropCard } from './cadastro/EntidadeLogoCropCard'

export type AdminClienteEntidadeLogoSavePayload = {
  nome: string
  subtitulo: string
  razaoSocial: string
  cnpj: string
  municipio: string
  uf: string
  tipoEntidade: ReturnType<typeof resolveEntidadeTipoOrDefault>
  logoDataUrl: string
}

type AdminClienteEntidadeLogoModalProps = {
  open: boolean
  cliente: AdminClienteRow | null
  onCancel: () => void
  onConfirm: (payload: AdminClienteEntidadeLogoSavePayload) => void
}

export function buildEntidadeLogoUpdatePayload(
  cliente: AdminClienteRow,
  logoDataUrl: string,
): AdminClienteEntidadeLogoSavePayload {
  return {
    nome: cliente.prefeitura,
    subtitulo: cliente.subtitle,
    razaoSocial: cliente.razaoSocial,
    cnpj: cliente.cnpj,
    municipio: cliente.municipio,
    uf: cliente.uf,
    tipoEntidade: resolveEntidadeTipoOrDefault(cliente.tipoEntidade),
    logoDataUrl,
  }
}

export function AdminClienteEntidadeLogoModal({
  open,
  cliente,
  onCancel,
  onConfirm,
}: AdminClienteEntidadeLogoModalProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoChanged, setLogoChanged] = useState(false)

  useEffect(() => {
    if (!open || !cliente) return
    setLogoPreview(cliente.logoUrl ?? null)
    setLogoChanged(false)
  }, [open, cliente])

  if (!open || !cliente) return null

  const canSave = logoChanged && Boolean(logoPreview)

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/25 px-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-entidade-logo-modal-title"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_16px_48px_rgba(0,0,0,0.18)] sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-primary-light)] text-[var(--brand-primary)]">
          <ImagePlus className="h-6 w-6" strokeWidth={2} />
        </span>

        <h2 id="admin-entidade-logo-modal-title" className="mt-4 text-lg font-bold text-gray-900">
          Alterar logo
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Envie e ajuste a logo exibida no portal de gestão e materiais da entidade.
        </p>
        <p className="mt-1 text-sm font-semibold text-gray-800">{cliente.prefeitura}</p>

        <div className="mt-6">
          <EntidadeLogoCropCard
            value={logoPreview}
            entityName={cliente.prefeitura}
            iconOnlyActions
            layout="isolated"
            onChange={(next) => {
              setLogoPreview(next)
              setLogoChanged(true)
            }}
          />
        </div>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row-reverse sm:gap-3">
          <button
            type="button"
            disabled={!canSave}
            onClick={() => {
              if (!logoPreview) return
              onConfirm(buildEntidadeLogoUpdatePayload(cliente, logoPreview))
            }}
            className="w-full rounded-xl bg-[var(--brand-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
          >
            Salvar logo
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 sm:flex-1"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
