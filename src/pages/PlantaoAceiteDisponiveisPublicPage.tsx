import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { brand } from '../config/brand'
import { PLANTAO_ACEITE_DIGEST_DEMO_TOKEN } from '../config/publicRoutes'
import { PlantaoAceiteCpfInput } from '../components/plantao-aceite/PlantaoAceiteCpfInput'
import {
  PlantaoAceiteDisponiveisList,
} from '../components/plantao-aceite/PlantaoAceiteDisponiveisList'
import { PlantaoAceiteDisponiveisSuccessPanel } from '../components/plantao-aceite/PlantaoAceiteDisponiveisSuccessPanel'
import { useBrandTheme } from '../hooks/useBrandTheme'
import {
  candidatarReservaPlantaoAceitePublico,
  confirmPlantaoAceitePublico,
  fetchPlantaoAceiteDigest,
  isPlantaoAceitePublicoApiError,
} from '../lib/services/public/plantaoAceite'
import type { PlantaoAceitePublico } from '../types/plantaoAceitePublico'
import { cpfDigits, isValidCpf } from '../utils/cpf'

type BatchSuccessState = {
  profissionalNome: string
  agendaUrl: string
  confirmed: Array<{
    plantao: PlantaoAceitePublico
    kind: 'titular' | 'reserva'
    reservePosition?: number
  }>
  failed: Array<{ plantao: PlantaoAceitePublico; message: string }>
}

export function PlantaoAceiteDisponiveisPublicPage() {
  useBrandTheme()
  const { token = '' } = useParams<{ token: string }>()

  const [loading, setLoading] = useState(true)
  const [plantoes, setPlantoes] = useState<PlantaoAceitePublico[]>([])
  const [totalVagas, setTotalVagas] = useState(0)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [checkedSlotIds, setCheckedSlotIds] = useState<string[]>([])
  const [acceptedRules, setAcceptedRules] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cpfError, setCpfError] = useState<string | null>(null)
  const [cpf, setCpf] = useState('')
  const [batchSuccess, setBatchSuccess] = useState<BatchSuccessState | null>(null)

  const checkedPlantoes = useMemo(
    () => plantoes.filter((plantao) => checkedSlotIds.includes(plantao.slotId)),
    [plantoes, checkedSlotIds],
  )

  const hasReserveSelection = checkedPlantoes.some(
    (plantao) => plantao.status === 'vagas_esgotadas' && plantao.canApplyAsReserve,
  )
  const hasTitularSelection = checkedPlantoes.some(
    (plantao) => plantao.status === 'disponivel' && plantao.vacancies > 0,
  )

  useEffect(() => {
    document.title = `${brand.appName} — Vagas de plantão`
    return () => {
      document.title = brand.appName
    }
  }, [])

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
      setPlantoes([])
      setTotalVagas(0)
      setCheckedSlotIds([])
      setBatchSuccess(null)
      setAcceptedRules(false)
      setCpfError(null)
      setCpf('')

      try {
        const result = await fetchPlantaoAceiteDigest(normalizedToken)
        if (!cancelled) {
          setPlantoes(result.plantoes)
          setTotalVagas(result.totalVagas)
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            isPlantaoAceitePublicoApiError(error)
              ? error.message
              : 'Não foi possível carregar as vagas.',
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

  function handleToggleSlot(slotId: string) {
    setCheckedSlotIds((current) =>
      current.includes(slotId)
        ? current.filter((id) => id !== slotId)
        : [...current, slotId],
    )
    setCpfError(null)
  }

  async function handleAcceptSelected(cpf: string) {
    if (checkedPlantoes.length === 0) return

    setIsSubmitting(true)
    setCpfError(null)

    const confirmed: BatchSuccessState['confirmed'] = []
    const failed: BatchSuccessState['failed'] = []
    let profissionalNome = ''
    let agendaUrl = ''

    for (const plantao of checkedPlantoes) {
      const isReserve =
        plantao.status === 'vagas_esgotadas' && plantao.canApplyAsReserve

      try {
        if (isReserve) {
          const result = await candidatarReservaPlantaoAceitePublico({
            token: token.trim(),
            slotId: plantao.slotId,
            cpf,
          })
          profissionalNome = result.profissionalNome
          agendaUrl = result.agendaUrl
          confirmed.push({
            plantao,
            kind: 'reserva',
            reservePosition: result.reservePosition,
          })
        } else {
          const result = await confirmPlantaoAceitePublico({
            token: token.trim(),
            slotId: plantao.slotId,
            cpf,
          })
          profissionalNome = result.profissionalNome
          agendaUrl = result.agendaUrl
          confirmed.push({
            plantao,
            kind: 'titular',
          })
        }
      } catch (error) {
        failed.push({
          plantao,
          message: isPlantaoAceitePublicoApiError(error)
            ? error.message
            : 'Não foi possível concluir este plantão.',
        })
      }
    }

    setIsSubmitting(false)

    if (confirmed.length === 0) {
      setCpfError(
        failed[0]?.message ?? 'Não foi possível aceitar os plantões selecionados.',
      )
      return
    }

    const confirmedIds = new Set(confirmed.map((item) => item.plantao.slotId))
    setPlantoes((current) =>
      current.map((plantao) => {
        if (!confirmedIds.has(plantao.slotId)) return plantao
        const item = confirmed.find((entry) => entry.plantao.slotId === plantao.slotId)
        if (item?.kind === 'reserva') {
          return {
            ...plantao,
            vacancies: 0,
            status: 'vagas_esgotadas',
            canApplyAsReserve: false,
            reserveQueueCount: item.reservePosition ?? plantao.reserveQueueCount,
          }
        }
        return {
          ...plantao,
          vacancies: 0,
          status: 'indisponivel',
          canApplyAsReserve: false,
        }
      }),
    )
    setCheckedSlotIds(failed.map((item) => item.plantao.slotId))
    setBatchSuccess({
      profissionalNome,
      agendaUrl,
      confirmed,
      failed,
    })
    setCpf('')
    setAcceptedRules(false)
  }

  const selectedCount = checkedPlantoes.length
  const canSubmit = selectedCount > 0 && acceptedRules && !isSubmitting

  const rulesLabel =
    hasReserveSelection && hasTitularSelection
      ? 'Li e aceito as regras de repasse. Entendo que alguns plantões serão confirmados como titular e outros entrarão na fila de reserva.'
      : hasReserveSelection
        ? 'Li e aceito as regras de repasse e entendo que serei acionado apenas se o titular não entrar no plantão.'
        : 'Li e aceito as regras de repasse e presença dos plantões selecionados.'

  const acceptButtonLabel =
    selectedCount === 0
      ? 'Aceitar selecionados'
      : selectedCount === 1
        ? 'Aceitar 1 plantão'
        : `Aceitar ${selectedCount} plantões`

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-white sm:bg-gray-50">
        <div className="mx-auto flex min-h-[50vh] w-full max-w-lg flex-col items-center justify-center gap-3 px-5 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-primary)]" aria-hidden />
          <p className="text-sm text-gray-600">Carregando vagas…</p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-white sm:bg-gray-50">
        <div className="flex-1 px-5 py-10 sm:px-6">
          <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-red-400" aria-hidden />
            <h1 className="mt-4 text-lg font-semibold text-gray-900">Link indisponível</h1>
            <p className="mt-2 text-sm text-gray-500">{loadError}</p>
          </div>
        </div>
      </div>
    )
  }

  if (batchSuccess) {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-white sm:bg-gray-50">
        <div className="flex-1 px-5 py-6 sm:px-6 sm:py-10">
          <PlantaoAceiteDisponiveisSuccessPanel
            profissionalNome={batchSuccess.profissionalNome}
            agendaUrl={batchSuccess.agendaUrl}
            confirmed={batchSuccess.confirmed}
            failed={batchSuccess.failed}
          />
        </div>

        <footer className="shrink-0 border-t border-gray-100 px-5 pb-8 pt-6 text-center sm:px-6">
          <img
            src={brand.logoUrl}
            alt={brand.appName}
            className="mx-auto h-8 w-auto max-w-[140px] object-contain opacity-70"
          />
        </footer>
      </div>
    )
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-white sm:bg-gray-50">
      <div className="flex-1 px-5 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-6 text-center">
            <img
              src={brand.logoUrl}
              alt={brand.appName}
              className="mx-auto h-10 w-auto object-contain"
            />
          </div>

          <p className="text-xs font-medium uppercase tracking-wide text-[var(--brand-primary)]">
            Vagas disponíveis
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
            {plantoes.length} plantão{plantoes.length === 1 ? '' : 'es'} para você
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {totalVagas > 0
              ? `${totalVagas} vaga${totalVagas === 1 ? '' : 's'} aberta${totalVagas === 1 ? '' : 's'}. Marque os que deseja aceitar.`
              : 'Marque os plantões em que deseja entrar na fila de reserva.'}
          </p>

          <div className="mt-6">
            <PlantaoAceiteDisponiveisList
              plantoes={plantoes}
              checkedSlotIds={checkedSlotIds}
              onToggle={handleToggleSlot}
            />
          </div>

          <div className="mt-6 space-y-4 border-t border-gray-100 pt-6">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={acceptedRules}
                onChange={(event) => setAcceptedRules(event.target.checked)}
                disabled={selectedCount === 0 || isSubmitting}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)]"
              />
              <span className="text-sm leading-relaxed text-gray-600">{rulesLabel}</span>
            </label>

            <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
              <PlantaoAceiteCpfInput
                value={cpf}
                onChange={setCpf}
                waveActive={acceptedRules}
                disabled={isSubmitting}
              />

              {cpfError ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-700">
                  {cpfError}
                </p>
              ) : null}

              <button
                type="button"
                onClick={() => void handleAcceptSelected(cpfDigits(cpf))}
                disabled={!canSubmit || !isValidCpf(cpf)}
                className="btn-brand-gradient flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Aceitando…
                  </>
                ) : (
                  acceptButtonLabel
                )}
              </button>
            </div>

            {selectedCount === 0 ? (
              <p className="text-center text-xs text-gray-400">
                Selecione ao menos um plantão para continuar.
              </p>
            ) : null}

            {token.trim() === PLANTAO_ACEITE_DIGEST_DEMO_TOKEN ? (
              <p className="text-center text-xs text-gray-400">
                Demo · CPF: 226.522.048-58
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
