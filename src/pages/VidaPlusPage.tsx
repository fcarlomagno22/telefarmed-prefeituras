import { ArrowLeft, HeartPulse } from 'lucide-react'
import { Link } from 'react-router-dom'
import { rootPath } from '../config/portals'
import { vidaPlusBrand } from '../config/vidaPlusRoutes'

export function VidaPlusPage() {
  return (
    <div className="flex min-h-screen min-h-[100dvh] flex-col bg-gradient-to-b from-emerald-50 via-white to-white">
      <header className="border-b border-emerald-100/80 bg-white/80 px-5 py-4 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Link
            to={rootPath}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
            Voltar
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-[0_8px_24px_rgba(16,185,129,0.35)]">
            <HeartPulse className="h-8 w-8" strokeWidth={2} />
          </span>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            {vidaPlusBrand.name}
          </h1>
          <p className="mt-2 text-sm font-medium text-emerald-700">{vidaPlusBrand.tagline}</p>
          <p className="mt-4 text-sm leading-relaxed text-gray-600">{vidaPlusBrand.description}</p>
          <p className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-800">
            Em breve você poderá acessar desafios, metas e conteúdos de promoção da saúde pelo
            app municipal.
          </p>
        </div>
      </main>
    </div>
  )
}
