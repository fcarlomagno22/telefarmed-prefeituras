export function AppCidadesHostFallbackPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#0a0a0c] px-6 text-center text-white">
      <p className="text-lg font-bold">App cidadão (VD)</p>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-white/70">
        Este endereço é do app mobile/web para pacientes, não do portal de gestão das prefeituras.
      </p>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-white/55">
        Configure na Vercel um projeto com <strong className="text-white/80">Root Directory: app_cidades</strong>{' '}
        e aponte o domínio <strong className="text-white/80">vd.telefarmed.com.br</strong> só para ele.
      </p>
    </div>
  )
}
