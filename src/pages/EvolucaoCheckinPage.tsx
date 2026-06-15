import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { EvolucaoCheckinAlreadyAnswered } from '../components/evolucao/EvolucaoCheckinAlreadyAnswered'
import { EvolucaoCheckinWizard } from '../components/evolucao/EvolucaoCheckinWizard'
import { brand } from '../config/brand'
import { useBrandTheme } from '../hooks/useBrandTheme'
import {
  fetchPublicPosConsultaCheckin,
  isPublicPosConsultaApiError,
  submitPublicPosConsultaCheckin,
  type PosConsultaCheckinContext,
} from '../lib/services/public/posConsulta'

export function EvolucaoCheckinPage() {
  useBrandTheme()
  const { checkinToken } = useParams<{ checkinToken: string }>()
  const token = checkinToken?.trim() || undefined

  const [context, setContext] = useState<PosConsultaCheckinContext | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      setLoadError('Link inválido.')
      return
    }

    let cancelled = false
    setLoading(true)
    setLoadError(null)

    void fetchPublicPosConsultaCheckin(token)
      .then((next) => {
        if (cancelled) return
        setContext(next)
      })
      .catch((error) => {
        if (cancelled) return
        if (isPublicPosConsultaApiError(error)) {
          setLoadError(error.message)
        } else {
          setLoadError('Não foi possível carregar o check-in.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token])

  const handleSubmit = useCallback(
    async (respostas: import('../types/posConsulta').PosConsultaCheckinRespostas) => {
      if (!token) return null
      setSubmitError(null)
      try {
        const result = await submitPublicPosConsultaCheckin(token, respostas)
        return result.nextCheckinLabel
      } catch (error) {
        if (isPublicPosConsultaApiError(error)) {
          setSubmitError(error.message)
        } else {
          setSubmitError('Não foi possível enviar suas respostas.')
        }
        throw error
      }
    },
    [token],
  )

  return (
    <div className="flex min-h-[100dvh] flex-col bg-white">
      <header className="shrink-0 px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-[1440px] justify-center sm:justify-start">
          <img
            src={brand.logoUrl}
            alt={brand.appName}
            className="h-10 w-auto max-w-[200px] object-contain"
          />
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-5 py-8 sm:px-8">
        {loading ? (
          <p className="text-sm text-gray-600">Carregando check-in…</p>
        ) : loadError ? (
          <div className="w-full max-w-md text-center">
            <h1 className="text-xl font-bold text-gray-900">Link indisponível</h1>
            <p className="mt-3 text-sm leading-relaxed text-gray-600" role="alert">
              {loadError}
            </p>
            <p className="mt-4 text-xs text-gray-400">
              Se precisar de ajuda, procure sua unidade de saúde de referência.
            </p>
          </div>
        ) : context?.status === 'expirado' ? (
          <div className="w-full max-w-md text-center">
            <h1 className="text-xl font-bold text-gray-900">Check-in expirado</h1>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              O prazo para responder este check-in encerrou. Aguarde o próximo e-mail de
              acompanhamento ou procure sua unidade de saúde se não estiver bem.
            </p>
          </div>
        ) : context?.status === 'respondido' ? (
          <EvolucaoCheckinAlreadyAnswered context={context} />
        ) : context ? (
          <EvolucaoCheckinWizard
            context={context}
            onSubmit={handleSubmit}
            submitError={submitError}
          />
        ) : null}
      </main>
    </div>
  )
}
