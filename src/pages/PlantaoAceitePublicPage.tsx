import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { brand } from '../config/brand'
import { PlantaoAceitePublicContent } from '../components/plantao-aceite/PlantaoAceitePublicContent'
import { useBrandTheme } from '../hooks/useBrandTheme'
import {
  candidatarReservaPlantaoAceitePublico,
  confirmPlantaoAceitePublico,
  fetchPlantaoAceitePublico,
  isPlantaoAceitePublicoApiError,
} from '../lib/services/public/plantaoAceite'
import type {
  PlantaoAceiteConfirmResult,
  PlantaoAceitePublico,
  PlantaoAceiteReserveResult,
} from '../types/plantaoAceitePublico'

export function PlantaoAceitePublicPage() {
  useBrandTheme()
  const { token = '' } = useParams<{ token: string }>()

  const [loading, setLoading] = useState(true)
  const [plantao, setPlantao] = useState<PlantaoAceitePublico | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [acceptedRules, setAcceptedRules] = useState(false)
  const [cpfDialogOpen, setCpfDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cpfError, setCpfError] = useState<string | null>(null)
  const [success, setSuccess] = useState<PlantaoAceiteConfirmResult | null>(null)
  const [reserveSuccess, setReserveSuccess] = useState<PlantaoAceiteReserveResult | null>(null)

  useEffect(() => {
    let cancelled = false
    const normalizedToken = token.trim()

    if (!normalizedToken) {
      setLoading(false)
      setLoadError('Link inválido.')
      return
    }

    async function load() {
      setLoading(true)
      setLoadError(null)
      setPlantao(null)
      setSuccess(null)
      setReserveSuccess(null)
      setAcceptedRules(false)
      setCpfDialogOpen(false)
      setCpfError(null)

      try {
        const result = await fetchPlantaoAceitePublico(normalizedToken)
        if (!cancelled) setPlantao(result.plantao)
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            isPlantaoAceitePublicoApiError(error)
              ? error.message
              : 'Não foi possível carregar este plantão.',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [token])

  async function handleConfirmCpf(cpf: string) {
    setIsSubmitting(true)
    setCpfError(null)

    try {
      const result = await confirmPlantaoAceitePublico({ token: token.trim(), cpf })
      setSuccess(result)
      setCpfDialogOpen(false)
    } catch (error) {
      setCpfError(
        isPlantaoAceitePublicoApiError(error)
          ? error.message
          : 'Não foi possível confirmar o plantão.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleConfirmReserve(cpf: string) {
    setIsSubmitting(true)
    setCpfError(null)

    try {
      const result = await candidatarReservaPlantaoAceitePublico({ token: token.trim(), cpf })
      setReserveSuccess(result)
      setCpfDialogOpen(false)
    } catch (error) {
      setCpfError(
        isPlantaoAceitePublicoApiError(error)
          ? error.message
          : 'Não foi possível registrar sua candidatura.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-white sm:bg-gray-50">
      <div className="flex-1 px-5 py-0 sm:px-6 sm:py-10">
        {loading ? (
          <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-3 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-primary)]" aria-hidden />
            <p className="text-sm text-gray-600">Carregando plantão…</p>
          </div>
        ) : loadError ? (
          <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-red-400" aria-hidden />
            <h1 className="mt-4 text-lg font-semibold text-gray-900">Link indisponível</h1>
            <p className="mt-2 text-sm text-gray-500">{loadError}</p>
          </div>
        ) : plantao ? (
          <PlantaoAceitePublicContent
            token={token}
            plantao={plantao}
            acceptedRules={acceptedRules}
            onAcceptedRulesChange={setAcceptedRules}
            cpfDialogOpen={cpfDialogOpen}
            onOpenCpfDialog={() => {
              setCpfError(null)
              setCpfDialogOpen(true)
            }}
            onCloseCpfDialog={() => {
              if (isSubmitting) return
              setCpfDialogOpen(false)
              setCpfError(null)
            }}
            onConfirmCpf={handleConfirmCpf}
            onConfirmReserve={handleConfirmReserve}
            isSubmitting={isSubmitting}
            cpfError={cpfError}
            success={success}
            reserveSuccess={reserveSuccess}
          />
        ) : null}
      </div>

      {success || reserveSuccess ? (
        <footer className="shrink-0 px-5 pb-8 pt-4 text-center sm:px-6">
          <img
            src={brand.logoUrl}
            alt={brand.appName}
            className="mx-auto h-8 w-auto max-w-[140px] object-contain opacity-70"
          />
        </footer>
      ) : null}
    </div>
  )
}
