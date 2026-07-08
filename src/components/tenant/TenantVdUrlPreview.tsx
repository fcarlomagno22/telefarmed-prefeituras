import { Smartphone } from 'lucide-react'
import { buildVdUrl } from '../../config/tenantHost'
import { normalizeTenantSlugInput } from '../../utils/tenantSlug'

type TenantVdUrlPreviewProps = {
  slug: string
  className?: string
}

export function TenantVdUrlPreview({ slug, className = '' }: TenantVdUrlPreviewProps) {
  const resolvedSlug = normalizeTenantSlugInput(slug)
  const previewUrl = resolvedSlug ? buildVdUrl(resolvedSlug) : `https://vd-{slug}.telefarmed.com.br/login`

  return (
    <div
      className={`flex items-start gap-2 rounded-lg border border-orange-100 bg-orange-50/70 px-3 py-2.5 ${className}`}
    >
      <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-primary)]" aria-hidden />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">App cidadão</p>
        <p className="truncate font-mono text-sm font-medium text-gray-900">{previewUrl}</p>
        <p className="mt-1 text-xs text-gray-500">
          Disponível automaticamente após salvar o slug (wildcard DNS + build único).
        </p>
      </div>
    </div>
  )
}
