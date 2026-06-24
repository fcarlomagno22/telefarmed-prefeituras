import { Loader2, LocateFixed, MapPin, RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { LiveShareSessionPublic } from '../../types/runWalkLiveSharePublic'
import {
  calculateLiveShareAverageSpeedKmh,
  formatAverageSpeedKmh,
  getParticipantFirstName,
} from '../../utils/runWalkLiveShareStats'
import { LiveShareParticipantPhoto } from './LiveShareParticipantPhoto'
import { LiveShareTrackingMap, type LiveShareTrackingMapHandle } from './LiveShareTrackingMap'

const REFRESH_INTERVAL_MS = 2 * 60 * 1000

function formatUpdatedAt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

type RunWalkLiveShareViewerContentProps = {
  token: string
  session: LiveShareSessionPublic | null
  loading: boolean
  error: string | null
  lastUpdatedAt: string | null
  onRefresh: () => void
}

export function RunWalkLiveShareViewerContent({
  session,
  loading,
  error,
  lastUpdatedAt,
  onRefresh,
}: RunWalkLiveShareViewerContentProps) {
  const firstName = session ? getParticipantFirstName(session.participantName) : ''
  const averageSpeedKmh = useMemo(
    () => (session ? calculateLiveShareAverageSpeedKmh(session.points) : null),
    [session],
  )
  const averageSpeedLabel = formatAverageSpeedKmh(averageSpeedKmh)
  const hasMapPoints = Boolean(session && session.points.length > 0)
  const mapRef = useRef<LiveShareTrackingMapHandle>(null)
  const bottomPanelRef = useRef<HTMLDivElement | null>(null)
  const [bottomInsetPx, setBottomInsetPx] = useState(220)

  useEffect(() => {
    const node = bottomPanelRef.current
    if (!node || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(() => {
      setBottomInsetPx(Math.ceil(node.getBoundingClientRect().height) + 12)
    })

    observer.observe(node)
    setBottomInsetPx(Math.ceil(node.getBoundingClientRect().height) + 12)

    return () => observer.disconnect()
  }, [session, error, loading])

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-black text-white">
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-[5] bg-black"
        style={{ height: 'env(safe-area-inset-top)' }}
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[5] bg-black"
        style={{ height: 'env(safe-area-inset-bottom)' }}
        aria-hidden
      />

      <div className="absolute inset-0 z-0">
        {hasMapPoints ? (
          <LiveShareTrackingMap
            ref={mapRef}
            points={session!.points}
            participantLabel={firstName}
            participantName={session!.participantName}
            participantPhotoUrl={session!.participantPhotoUrl}
            bottomInsetPx={bottomInsetPx}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-[#111118] via-[#0a0a0c] to-[#0a0a0c]" />
        )}
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col">
        <header className="flex items-center justify-start px-4 pb-2 pt-[max(12px,env(safe-area-inset-top))]">
          <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/45 px-3 py-2 text-xs font-bold">
            <span
              className={`h-2 w-2 rounded-full ${session?.isActive ? 'bg-green-500' : 'bg-white/35'}`}
              aria-hidden
            />
            Acompanhando
          </div>
        </header>

        <div className="flex-1" aria-hidden />

        <div
          ref={bottomPanelRef}
          className="pointer-events-auto px-4 pb-[max(16px,env(safe-area-inset-bottom))]"
        >
        {error ? (
          <div className="mb-3 rounded-2xl border border-red-400/20 bg-[rgba(20,20,24,0.92)] p-4 text-center">
            <p className="text-sm font-semibold text-red-300">{error}</p>
          </div>
        ) : null}

        {loading && !session ? (
          <div className="mb-3 flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-[rgba(20,20,24,0.92)] p-6 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#ffb366]" aria-hidden />
            <p className="text-sm font-semibold text-white/70">Carregando localização...</p>
          </div>
        ) : null}

        {session ? (
          <div className="space-y-3">
            <section className="rounded-[22px] border border-white/10 bg-[rgba(16,16,20,0.94)] p-[18px] backdrop-blur-md">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <LiveShareParticipantPhoto
                    name={session.participantName}
                    photoUrl={session.participantPhotoUrl}
                    size="md"
                  />
                  <div className="min-w-0 space-y-1">
                    <h1 className="text-[28px] font-black tracking-tight">{firstName}</h1>
                    <p className="text-sm font-semibold text-white/65">{session.activityName}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onRefresh}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold text-white transition hover:bg-white/10 active:scale-[0.98]"
                  aria-label="Atualizar agora"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                  Atualizar agora
                </button>
              </div>

              <div className="mt-3.5 grid grid-cols-[1fr_auto_1fr] items-stretch gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-white/45">
                    Velocidade média
                  </p>
                  <p className="text-[22px] font-black tracking-tight text-[#ffb366]">
                    {averageSpeedLabel}
                  </p>
                </div>
                <div className="w-px bg-white/10" aria-hidden />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-white/45">
                    Atualizado
                  </p>
                  <p className="text-[22px] font-black tracking-tight text-[#ffb366]">
                    {formatUpdatedAt(lastUpdatedAt)}
                  </p>
                </div>
              </div>

              <div className="mt-3.5 flex items-end justify-between gap-3">
                <p
                  className={`flex-1 text-[11px] font-semibold ${
                    session.isActive ? 'text-green-300' : 'text-white/45'
                  }`}
                >
                  {session.isActive
                    ? 'Localização sendo atualizada automaticamente'
                    : 'Atividade encerrada'}
                </p>

                {hasMapPoints ? (
                  <button
                    type="button"
                    onClick={() => mapRef.current?.centerOnParticipant()}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold text-white transition hover:bg-white/10 active:scale-[0.98]"
                    aria-label={`Centralizar em ${firstName}`}
                  >
                    <LocateFixed className="h-3.5 w-3.5 text-green-400" aria-hidden />
                    Centralizar
                  </button>
                ) : null}
              </div>
            </section>

            {!hasMapPoints ? (
              <section className="rounded-2xl border border-white/10 bg-[rgba(20,20,24,0.88)] p-3.5">
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#ffb366]" aria-hidden />
                  <div>
                    <p className="text-sm font-bold">Aguardando localização</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/65">
                      A posição aparecerá no mapa em até {Math.round(REFRESH_INTERVAL_MS / 60000)}{' '}
                      minutos.
                    </p>
                  </div>
                </div>
              </section>
            ) : null}
          </div>
        ) : null}
        </div>
      </div>
    </div>
  )
}

export function useLiveShareViewerPolling(
  token: string,
  fetchSession: (token: string) => Promise<{ session: LiveShareSessionPublic }>,
) {
  const [session, setSession] = useState<LiveShareSessionPublic | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let intervalId: number | null = null
    let hasLoadedOnce = false

    async function load() {
      setError(null)
      if (!hasLoadedOnce) setLoading(true)

      try {
        const result = await fetchSession(token)
        if (cancelled) return
        setSession(result.session)
        setLastUpdatedAt(new Date().toISOString())
      } catch (loadError) {
        if (cancelled) return
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Não foi possível carregar o acompanhamento.',
        )
      } finally {
        if (!cancelled) {
          hasLoadedOnce = true
          setLoading(false)
        }
      }
    }

    void load()
    intervalId = window.setInterval(() => {
      void load()
    }, REFRESH_INTERVAL_MS)

    return () => {
      cancelled = true
      if (intervalId != null) window.clearInterval(intervalId)
    }
  }, [token, fetchSession])

  return {
    session,
    loading,
    error,
    lastUpdatedAt,
    refresh: async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await fetchSession(token)
        setSession(result.session)
        setLastUpdatedAt(new Date().toISOString())
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Não foi possível carregar o acompanhamento.',
        )
      } finally {
        setLoading(false)
      }
    },
  }
}
