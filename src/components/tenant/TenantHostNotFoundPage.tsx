import { formatTenantPublicHost } from '../../config/tenantHost'

type TenantHostNotFoundPageProps = {
  slug: string
}

export function TenantHostNotFoundPage({ slug }: TenantHostNotFoundPageProps) {
  const publicHost = formatTenantPublicHost(slug)

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 px-6 text-center">
      <div className="max-w-md">
        <h1 className="text-lg font-bold text-gray-900">Endereço não encontrado</h1>
        <p className="mt-2 text-sm text-gray-600">
          O endereço <strong className="text-gray-800">{publicHost}</strong> não está vinculado a
          nenhuma instituição ou UBT ativa.
        </p>
        <p className="mt-3 text-xs text-gray-500">
          Verifique o link com sua instituição ou com o suporte Telefarmed.
        </p>
      </div>
    </div>
  )
}
